"""Local backup and offline recovery for the Astro supervisor."""

import hashlib
import json
import os
import re
import shutil
import sqlite3
import stat
import struct
import sys
import tempfile
import zipfile
from contextlib import closing
from datetime import datetime, timezone
from pathlib import Path


ZIP_LIMIT = 512 * 1024**2
TOTAL_LIMIT = 1024**3
MANIFEST_LIMIT = 4 * 1024**2
FILE_LIMIT = 10_000
CHUNK = 1024**2
DB = "data/studio678.db"
MANIFEST = "manifest.json"
DIRECTORIES = {
    "data/gallery-photos": re.compile(r"[0-9a-f]{8}(?:-[0-9a-f]{4}){3}-[0-9a-f]{12}-(?:thumb|large)\.webp"),
    "data/artes": re.compile(r"[0-9a-f]{8}(?:-[0-9a-f]{4}){3}-[0-9a-f]{12}-v[1-9][0-9]*-(?:thumb\.webp|preview\.webp|orig\.(?:jpg|png|webp))"),
    "uploads": re.compile(r"[A-Za-z0-9_-]{1,200}\.(?:jpg|jpeg|png|gif|webp)", re.I),
    "uploads/mockups": re.compile(r"[A-Za-z0-9_-]{1,200}\.(?:jpg|jpeg|png|gif|webp)", re.I),
}
SCHEMA = {
    "categories": "id slug title subtitle description badge display_order is_active",
    "products": "id category_slug name tagline description featured_badge image_url display_order is_active is_provisional",
    "site_settings": "id whatsapp instagram facebook email",
    "gallery_works": "id title description category_slug work_date instagram published featured display_order created_at updated_at version",
    "gallery_photos": "id work_id position width height thumb_width thumb_height",
    "agenda_quotes": "id draft_token product created_at status config_version config_json",
    "agenda_quote_assets": "quote_id name mime content",
}
OPTIONAL_SCHEMA = {
    "planner_quotes": "id draft_token product created_at status config_version config_json",
    "planner_quote_assets": "quote_id name mime content",
    "notebook_quotes": "id draft_token product created_at status config_version config_json",
    "notebook_quote_assets": "quote_id name mime content",
    "arte_categorias": "id slug name display_order is_active created_at updated_at",
    "artes": "id code title description current_version is_published is_active created_at updated_at",
    "arte_versoes": "arte_id version original_filename original_mime original_ext width height thumb_width thumb_height preview_width preview_height file_size created_at",
    "arte_categoria_rel": "arte_id categoria_id",
    "arte_produtos": "arte_id product_type",
}


class InvalidBackup(Exception):
    pass


def check(condition, message):
    if not condition:
        raise InvalidBackup(message)


def now():
    return datetime.now(timezone.utc).isoformat(timespec="seconds")


def sync_dir(path):
    if os.name != "nt":
        fd = os.open(path, os.O_RDONLY | os.O_DIRECTORY)
        try:
            os.fsync(fd)
        finally:
            os.close(fd)


def remove(path):
    path.unlink(missing_ok=True)
    sync_dir(path.parent)


def write_json(path, value):
    temp = path.with_suffix(".part")
    with temp.open("w", encoding="utf-8") as stream:
        json.dump(value, stream, ensure_ascii=False)
        stream.flush()
        os.fsync(stream.fileno())
    os.replace(temp, path)
    sync_dir(path.parent)


def read_json(path):
    return json.loads(path.read_text(encoding="utf-8"))


def ensure_directory(path):
    if not path.exists() and not path.is_symlink():
        path.mkdir(mode=0o700 if path.name == ".backup-restore" else 0o777)
        sync_dir(path.parent)
    check(path.is_dir() and not path.is_symlink(), "Um diretório de armazenamento é inválido.")
    return path


def child_directories(root, parts):
    for part in parts:
        root = ensure_directory(root / part)
    return root


def regular(path):
    return path.is_file() and not path.is_symlink()


def description(name):
    if name == DB:
        return "SQLite do catálogo, galeria, contatos e solicitações de agendas, incluindo seus arquivos"
    directory, _, filename = name.rpartition("/")
    pattern = DIRECTORIES.get(directory)
    if pattern and pattern.fullmatch(filename):
        stem = filename.split(".")[0].upper()
        if stem not in {"CON", "PRN", "AUX", "NUL"} and not re.fullmatch(r"(?:COM|LPT)[1-9]", stem):
            return {
                "data/gallery-photos": "Foto da galeria",
                "data/artes": "Arte da biblioteca",
                "uploads": "Imagem enviada",
                "uploads/mockups": "Prévia de personalização",
            }[directory]
    raise InvalidBackup("O ZIP contém um caminho inseguro ou um arquivo inesperado.")


def storage_path(root, name):
    parts = name.split("/")
    if parts[0] == "uploads":
        parts.insert(0, "public")
    return child_directories(root, parts[:-1]) / parts[-1]


def live_files(root):
    result = {}
    db = storage_path(root, DB)
    check(regular(db), "O banco atual não está disponível como um arquivo regular.")
    result[DB] = db
    for directory, pattern in DIRECTORIES.items():
        folder = storage_path(root, directory + "/placeholder")
        for item in folder.parent.iterdir():
            if not pattern.fullmatch(item.name):
                continue
            name = directory + "/" + item.name
            description(name)
            check(regular(item), "Há um arquivo de mídia que não é um arquivo regular.")
            result[name] = item
    check(len(result) <= FILE_LIMIT, "Quantidade de arquivos acima do limite.")
    check(len({name.lower() for name in result}) == len(result), "Nomes de arquivo em conflito.")
    return result


def transfer(source, target, limit):
    digest = hashlib.sha256()
    size = 0
    while chunk := source.read(CHUNK):
        size += len(chunk)
        check(size <= limit, "O conteúdo descompactado excede o limite informado.")
        digest.update(chunk)
        if target is not None:
            target.write(chunk)
    return size, digest.hexdigest()


def copy_durable(source, target):
    with source.open("rb") as src, target.open("xb") as dst:
        shutil.copyfileobj(src, dst, CHUNK)
        dst.flush()
        os.fsync(dst.fileno())
    sync_dir(target.parent)


def snapshot_database(source, target):
    with closing(sqlite3.connect(source.as_uri() + "?mode=ro", uri=True)) as current:
        with closing(sqlite3.connect(target)) as snapshot:
            current.backup(snapshot, pages=512)
            snapshot.execute("PRAGMA journal_mode=DELETE").fetchone()
    with target.open("r+b") as stream:
        os.fsync(stream.fileno())
    sync_dir(target.parent)


def verify_database(path, names=None):
    with closing(sqlite3.connect(path.as_uri() + "?mode=ro&immutable=1", uri=True)) as db:
        db.execute("PRAGMA trusted_schema=OFF")
        check(db.execute("PRAGMA integrity_check").fetchall() == [("ok",)], "A integridade do SQLite falhou.")
        check(db.execute("PRAGMA user_version").fetchone() == (0,), "Versão do SQLite da aplicação incompatível.")
        objects = db.execute("SELECT name, type, sql FROM sqlite_schema WHERE name NOT GLOB 'sqlite_*'").fetchall()
        check(all(kind in ("table", "index") and not re.match(r"^\s*CREATE\s+VIRTUAL\b", sql or "", re.I)
                  for _, kind, sql in objects), "O SQLite contém objetos incompatíveis.")
        tables = {name for name, kind, _ in objects if kind == "table"}
        allowed_tables = set(SCHEMA) | set(OPTIONAL_SCHEMA) | {"schema_migrations"}
        check(set(SCHEMA) <= tables <= allowed_tables, "Esquema do SQLite incompatível.")
        if "schema_migrations" in tables:
            check({row[1] for row in db.execute('PRAGMA table_info("schema_migrations")')} == {"id"}, "Tabela de migrações incompatível.")
        for table, columns in (SCHEMA | OPTIONAL_SCHEMA).items():
            if table in tables:
                existing = {row[1] for row in db.execute(f'PRAGMA table_info("{table}")')}
                check(set(columns.split()) <= existing, "Esquema do SQLite incompleto.")
        check(db.execute("PRAGMA foreign_key_check").fetchone() is None, "O SQLite contém referências inválidas.")
        if names is None:
            return
        for (photo_id,) in db.execute("SELECT id FROM gallery_photos"):
            for size in ("large", "thumb"):
                check(f"data/gallery-photos/{photo_id}-{size}.webp" in names, "Há uma foto da galeria ausente.")
        for (image,) in db.execute("SELECT image_url FROM products WHERE image_url LIKE '/uploads/%'"):
            check(image[1:] in names, "Há uma imagem de catálogo ausente.")
        if db.execute("SELECT 1 FROM sqlite_master WHERE type='table' AND name='arte_versoes'").fetchone():
            for (arte_id, version, orig_ext) in db.execute(
                "SELECT arte_id, version, original_ext FROM arte_versoes"
            ):
                prefix = f"data/artes/{arte_id}-v{version}"
                check(f"{prefix}-thumb.webp" in names, "Há uma miniatura da biblioteca de artes ausente.")
                check(f"{prefix}-preview.webp" in names, "Há uma prévia da biblioteca de artes ausente.")
                check(f"{prefix}-orig.{orig_ext}" in names, "Há um arquivo original da biblioteca de artes ausente.")


def backup(root, target):
    files = live_files(root)
    with tempfile.TemporaryDirectory(dir=target.parent) as temporary:
        snapshot = Path(temporary) / "snapshot.db"
        snapshot_database(files[DB], snapshot)
        verify_database(snapshot, files)
        files[DB] = snapshot
        check(sum(path.stat().st_size for path in files.values()) <= TOTAL_LIMIT, "O backup excede o limite descompactado.")
        entries = []
        with zipfile.ZipFile(target, "x") as archive:
            total = 0
            for name, path in sorted(files.items()):
                member = zipfile.ZipInfo(name)
                member.compress_type = zipfile.ZIP_DEFLATED if name == DB else zipfile.ZIP_STORED
                with path.open("rb") as source, archive.open(member, "w") as output:
                    size, digest = transfer(source, output, TOTAL_LIMIT - total)
                check(size > 0, "O armazenamento contém um arquivo de mídia vazio.")
                total += size
                entries.append({"path": name, "bytes": size, "sha256": digest, "description": description(name)})
            archive.writestr(MANIFEST, json.dumps({
                "application": "678-estudio", "version": 1, "createdAt": now(), "files": entries,
            }, ensure_ascii=False).encode())
        check(target.stat().st_size <= ZIP_LIMIT, "O ZIP excede o limite de 512 MiB.")


def manifest_files(manifest):
    check(isinstance(manifest, dict) and manifest.get("application") == "678-estudio"
          and type(manifest.get("version")) is int and manifest["version"] == 1, "Versão ou origem do backup incompatível.")
    date = datetime.fromisoformat(manifest["createdAt"])
    check(date.utcoffset() is not None, "Data do backup inválida.")
    entries = manifest["files"]
    check(isinstance(entries, list) and 0 < len(entries) <= FILE_LIMIT, "Lista de arquivos inválida.")
    files = {}
    for entry in entries:
        check(isinstance(entry, dict) and isinstance(entry.get("path"), str) and isinstance(entry.get("sha256"), str),
              "Manifesto de integridade inválido.")
        name, size, digest = entry["path"], entry["bytes"], entry["sha256"]
        description(name)
        check(isinstance(entry.get("description"), str) and entry["description"].strip(), "Descrição de arquivo ausente no manifesto.")
        check(type(size) is int and size > 0 and re.fullmatch(r"[0-9a-f]{64}", digest), "Manifesto de integridade inválido.")
        check(name not in files, "Arquivo duplicado no manifesto.")
        files[name] = (size, digest)
    check(DB in files and len({name.lower() for name in files}) == len(files), "Banco ausente ou nomes em conflito.")
    check(sum(size for size, _ in files.values()) <= TOTAL_LIMIT, "O conteúdo descompactado excede 1 GiB.")
    return files


def verify_zip_directory(path):
    # Os backups v1 não precisam de ZIP64, comentários nem volumes múltiplos.
    length = path.stat().st_size
    check(22 <= length <= ZIP_LIMIT, "Tamanho de ZIP inválido ou acima de 512 MiB.")
    with path.open("rb") as stream:
        stream.seek(-22, os.SEEK_END)
        signature, disk, start, here, count, size, offset, comment = struct.unpack("<4s4H2IH", stream.read(22))
    check(signature == b"PK\x05\x06" and disk == start == comment == 0 and here == count
          and 0 < count <= FILE_LIMIT + 1 and size <= 8 * 1024**2 and offset + size == length - 22,
          "Diretório do ZIP inválido ou acima do limite.")


def stage(root, archive_path, token):
    check(re.fullmatch(r"[0-9a-f-]{36}", token), "Identificador de validação inválido.")
    state = child_directories(root, ("data", ".backup-restore"))
    check(not (state / "job.json").exists(), "Há uma restauração em andamento.")
    verify_zip_directory(archive_path)
    current = read_json(state / "candidate.json") if (state / "candidate.json").exists() else {}
    for stale in state.iterdir():
        if stale.name != current.get("token") and re.fullmatch(r"[0-9a-f-]{36}", stale.name) and stale.is_dir() and not stale.is_symlink():
            shutil.rmtree(stale)
    candidate = state / token
    candidate.mkdir()
    try:
        with zipfile.ZipFile(archive_path) as archive:
            members = archive.infolist()
            check(0 < len(members) <= FILE_LIMIT + 1, "Quantidade de arquivos inválida.")
            names = {}
            for member in members:
                name = member.orig_filename
                if name != MANIFEST:
                    description(name)
                check(name == member.filename and name not in names and not member.flag_bits & 1
                      and member.compress_type in (zipfile.ZIP_STORED, zipfile.ZIP_DEFLATED)
                      and stat.S_IFMT(member.external_attr >> 16) in (0, stat.S_IFREG),
                      "O ZIP contém entradas duplicadas, criptografadas ou especiais.")
                names[name] = member
            check(MANIFEST in names and names[MANIFEST].file_size <= MANIFEST_LIMIT, "Manifesto ausente ou muito grande.")
            with archive.open(names[MANIFEST]) as stream:
                raw = stream.read(MANIFEST_LIMIT + 1)
            check(len(raw) <= MANIFEST_LIMIT, "Manifesto muito grande.")
            manifest = json.loads(raw)
            files = manifest_files(manifest)
            check(names.keys() == files.keys() | {MANIFEST}, "Os arquivos do ZIP não correspondem ao manifesto.")
            for name, (size, digest) in files.items():
                check(names[name].file_size == size, "Tamanho de arquivo divergente do manifesto.")
                target = child_directories(candidate, name.split("/")[:-1]) / name.split("/")[-1]
                with archive.open(names[name]) as src, target.open("xb") as dst:
                    check(transfer(src, dst, size) == (size, digest), "A verificação SHA-256 falhou.")
                    dst.flush()
                    os.fsync(dst.fileno())
                sync_dir(target.parent)
        verify_database(candidate / DB, files)
        write_json(candidate / MANIFEST, manifest)
        sync_dir(state)
        old = read_json(state / "candidate.json") if (state / "candidate.json").exists() else None
        summary = {"token": token, "createdAt": datetime.fromisoformat(manifest["createdAt"]).isoformat(),
                   "files": len(files), "bytes": sum(size for size, _ in files.values())}
        write_json(state / "candidate.json", summary)
    except BaseException:
        shutil.rmtree(candidate)
        raise
    if old and re.fullmatch(r"[0-9a-f-]{36}", old["token"]):
        shutil.rmtree(state / old["token"], ignore_errors=True)
    return summary


def verify_candidate(candidate):
    files = manifest_files(read_json(candidate / MANIFEST))
    for name, (size, digest) in files.items():
        path = candidate / name
        check(regular(path), "O arquivo preparado está ausente.")
        with path.open("rb") as stream:
            check(transfer(stream, None, size) == (size, digest), "O arquivo preparado mudou após a validação.")
    verify_database(candidate / DB, files)
    return files


def rollback_snapshot(root, destination):
    if destination.exists():
        shutil.rmtree(destination)
    destination.mkdir()
    files = live_files(root)
    for name, path in files.items():
        parts = name.split("/")
        target = child_directories(destination, parts[:-1]) / parts[-1]
        if name == DB:
            snapshot_database(path, target)
        else:
            copy_durable(path, target)
    verify_database(destination / DB)
    write_json(destination / "files.json", sorted(files))


def install(root, source, names, verify_references=True):
    previous = live_files(root)
    for name in names:
        check(regular(source / name), "Arquivo de recuperação indisponível.")
        target = storage_path(root, name)
        if target.exists() or target.is_symlink():
            check(regular(target), "Destino da restauração inválido.")
        temp = target.parent / ".678-restore-part"
        remove(temp)
        try:
            copy_durable(source / name, temp)
            if name == DB:
                for suffix in ("-wal", "-shm", "-journal"):
                    remove(target.with_name(target.name + suffix))
            os.replace(temp, target)
            sync_dir(target.parent)
        finally:
            remove(temp)
    for name in previous.keys() - set(names):
        remove(previous[name])
    verify_database(storage_path(root, DB), live_files(root) if verify_references else None)


def offline(root):
    state = child_directories(root, ("data", ".backup-restore"))
    job_file = state / "job.json"
    if not job_file.exists():
        return
    job = read_json(job_file)
    check(re.fullmatch(r"[0-9a-f-]{36}", job["token"]), "Trabalho de restauração inválido.")
    candidate, rollback = state / job["token"], state / "rollback"

    def phase(value, message):
        updated = {**job, "phase": value, "message": message}
        write_json(job_file, updated)
        job.update(updated)

    if job["phase"] == "pending":
        try:
            files = verify_candidate(candidate)
            rollback_snapshot(root, rollback)
        except Exception as error:
            print(f"Restauração recusada: {error}", file=sys.stderr)
            phase("rejected", "A restauração foi recusada antes de alterar os dados atuais. Confira o arquivo e o espaço em disco.")
        else:
            phase("applying", "Restauração em andamento.")
            try:
                install(root, candidate, files)
            except Exception as error:
                print(f"Falha ao instalar backup: {error}", file=sys.stderr)
            else:
                phase("committed", "Restauração concluída. O site voltou a usar os dados do backup.")

    if job["phase"] == "applying":
        # Em qualquer interrupção, a primeira ação do próximo boot é reverter.
        install(root, rollback, read_json(rollback / "files.json"), verify_references=False)
        phase("rolled-back", "A restauração falhou ou foi interrompida. Os dados anteriores foram recuperados.")

    check(job["phase"] in ("committed", "rolled-back", "rejected"), "Estado de recuperação desconhecido.")
    write_json(state / "result.json", {"phase": job["phase"], "message": job["message"], "finishedAt": now()})
    remove(state / "candidate.json")
    shutil.rmtree(candidate, ignore_errors=True)
    shutil.rmtree(rollback, ignore_errors=True)
    remove(job_file)


if __name__ == "__main__":
    command, *args = sys.argv[1:]
    try:
        root = Path.cwd()
        if command == "backup":
            backup(root, Path(args[0]))
        elif command == "stage":
            print(json.dumps(stage(root, Path(args[0]), args[1])))
        elif command == "offline":
            offline(root)
        else:
            raise InvalidBackup("Operação de backup desconhecida.")
    except InvalidBackup as exc:
        print(exc, file=sys.stderr)
        sys.exit(2)
    except (zipfile.BadZipFile, sqlite3.DatabaseError, ValueError, KeyError, TypeError) as exc:
        print(f"Arquivo de backup ou SQLite inválido: {exc}", file=sys.stderr)
        sys.exit(2)
