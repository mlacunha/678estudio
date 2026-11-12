import json
import sqlite3
import stat
import tempfile
import unittest
import uuid
import zipfile
from contextlib import closing
from pathlib import Path
from unittest.mock import patch

import engine


PHOTO = "data/gallery-photos/9879c04c-2b79-4da4-9afe-d520b24b8d31"
FILES = {
    PHOTO + "-large.webp": b"gallery large",
    PHOTO + "-thumb.webp": b"gallery thumb",
    "uploads/catalog.webp": b"catalog image",
    "uploads/mockups/mockup.png": b"customizer mockup",
}


class BackupTest(unittest.TestCase):
    def setUp(self):
        self.temp = tempfile.TemporaryDirectory()
        self.addCleanup(self.temp.cleanup)
        self.workspace = Path(self.temp.name)
        self.root = self.workspace / "app"
        self.root.mkdir()
        self.db = engine.storage_path(self.root, engine.DB)
        self.zip = self.workspace / "backup.zip"
        self.state = self.root / "data" / ".backup-restore"
        with closing(sqlite3.connect(self.db)) as db:
            db.execute("PRAGMA journal_mode=WAL")
            for table, columns in engine.SCHEMA.items():
                db.execute(f"CREATE TABLE {table} ({', '.join(columns.split())})")
            db.execute("INSERT INTO products (id, image_url) VALUES ('item', '/uploads/catalog.webp')")
            db.execute("INSERT INTO gallery_photos (id) VALUES (?)", (PHOTO.rsplit("/", 1)[1],))
            db.execute("INSERT INTO agenda_quotes (id, status) VALUES ('agenda', 'requested')")
            db.execute("INSERT INTO agenda_quote_assets VALUES ('agenda', 'original', 'image/png', ?)", (b"private artwork",))
            db.commit()
        for name, data in FILES.items():
            engine.storage_path(self.root, name).write_bytes(data)
        (self.root / "data" / ".env").write_text("SECRET=keep-out")
        (self.root / "public" / "uploads" / "ignored.txt").write_text("keep-out")

    def make_backup(self):
        engine.backup(self.root, self.zip)

    def read_status(self):
        return engine.read_json(self.state / "result.json")["phase"]

    def prepare(self):
        self.make_backup()
        token = str(uuid.uuid4())
        engine.stage(self.root, self.zip, token)
        engine.write_json(self.state / "job.json", {"token": token, "phase": "pending"})
        return token

    def change_live(self):
        engine.storage_path(self.root, "uploads/catalog.webp").write_bytes(b"newer catalog")
        engine.storage_path(self.root, "uploads/newer.png").write_bytes(b"new file")
        with closing(sqlite3.connect(self.db)) as db:
            db.execute("UPDATE agenda_quote_assets SET content = ?", (b"newer quote",))
            db.commit()

    def quote_content(self):
        with closing(sqlite3.connect(self.db)) as db:
            return db.execute("SELECT content FROM agenda_quote_assets").fetchone()[0]

    def test_restore_migrated_database_and_all_preview_assets(self):
        with closing(sqlite3.connect(self.db)) as db:
            db.execute("CREATE TABLE schema_migrations (id TEXT PRIMARY KEY)")
            db.execute("INSERT INTO schema_migrations VALUES ('stationery-families-v2')")
            db.execute("INSERT INTO schema_migrations VALUES ('stationery-notebooks-v1')")
            for table, columns in engine.OPTIONAL_SCHEMA.items():
                db.execute(f"CREATE TABLE {table} ({', '.join(columns.split())})")
            db.execute("INSERT INTO planner_quotes (id, status) VALUES ('planner', 'requested')")
            db.execute("INSERT INTO planner_quote_assets VALUES ('planner', 'preview-abertura', 'image/png', ?)", (b"planner preview",))
            db.execute("INSERT INTO notebook_quotes (id, status) VALUES ('notebook', 'requested')")
            db.execute("INSERT INTO notebook_quote_assets VALUES ('notebook', 'preview-abertura', 'image/png', ?)", (b"notebook preview",))
            for page in range(1, 9):
                db.execute("INSERT INTO agenda_quote_assets VALUES ('agenda', ?, 'image/png', ?)",
                           (f"preview-{page}", bytes([page])))
            db.commit()
        self.prepare()
        self.change_live()
        engine.offline(self.root)
        self.assertEqual(self.read_status(), "committed")
        with closing(sqlite3.connect(self.db)) as db:
            self.assertEqual(db.execute("SELECT id FROM schema_migrations").fetchone()[0], "stationery-families-v2")
            self.assertEqual(db.execute("SELECT content FROM planner_quote_assets WHERE quote_id = 'planner'").fetchone()[0], b"planner preview")
            self.assertEqual(db.execute("SELECT content FROM notebook_quote_assets WHERE quote_id = 'notebook'").fetchone()[0], b"notebook preview")
            for page in range(1, 9):
                self.assertEqual(db.execute("SELECT content FROM agenda_quote_assets WHERE name = ?", (f"preview-{page}",)).fetchone()[0], bytes([page]))

    def test_snapshot_open_database_with_uncommitted_changes(self):
        with closing(sqlite3.connect(self.db)) as live:
            live.execute("UPDATE agenda_quote_assets SET content = ?", (b"uncommitted",))
            self.make_backup()
            live.rollback()
        with zipfile.ZipFile(self.zip) as archive:
            manifest = json.loads(archive.read(engine.MANIFEST))
            self.assertEqual(set(archive.namelist()), set(FILES) | {engine.DB, engine.MANIFEST})
            self.assertEqual(set(engine.manifest_files(manifest)), set(FILES) | {engine.DB})
            db = self.workspace / "copy.db"
            db.write_bytes(archive.read(engine.DB))
        with closing(sqlite3.connect(db)) as copy:
            self.assertEqual(copy.execute("SELECT content FROM agenda_quote_assets").fetchone()[0], b"private artwork")

    def test_restore_database_files_and_preserve_unmanaged_files(self):
        self.prepare()
        self.change_live()
        engine.storage_path(self.root, PHOTO + "-thumb.webp").unlink()
        engine.offline(self.root)
        self.assertEqual(self.read_status(), "committed")
        self.assertEqual(self.quote_content(), b"private artwork")
        for name, data in FILES.items():
            self.assertEqual(engine.storage_path(self.root, name).read_bytes(), data)
        self.assertFalse(engine.storage_path(self.root, "uploads/newer.png").exists())
        self.assertTrue((self.root / "data" / ".env").exists())
        self.assertTrue((self.root / "public" / "uploads" / "ignored.txt").exists())

    def test_failure_after_files_start_changing_rolls_back(self):
        token = self.prepare()
        self.change_live()
        copy = engine.copy_durable

        def fail_once(source, target):
            if (self.state / token) in source.parents and source.name == "mockup.png":
                raise OSError("simulated failure")
            return copy(source, target)

        with patch.object(engine, "copy_durable", side_effect=fail_once):
            engine.offline(self.root)
        self.assertEqual(self.read_status(), "rolled-back")
        self.assertEqual(self.quote_content(), b"newer quote")
        self.assertEqual(engine.storage_path(self.root, "uploads/catalog.webp").read_bytes(), b"newer catalog")
        self.assertTrue(engine.storage_path(self.root, "uploads/newer.png").exists())

    def test_recover_after_interruption_before_astro_starts(self):
        token = self.prepare()
        self.change_live()
        engine.rollback_snapshot(self.root, self.state / "rollback")
        engine.write_json(self.state / "job.json", {"token": token, "phase": "applying"})
        engine.storage_path(self.root, "uploads/catalog.webp").unlink()
        engine.offline(self.root)
        self.assertEqual(self.read_status(), "rolled-back")
        self.assertEqual(engine.storage_path(self.root, "uploads/catalog.webp").read_bytes(), b"newer catalog")
        self.assertEqual(self.quote_content(), b"newer quote")

    def test_tampered_stage_preserves_current_data(self):
        token = self.prepare()
        self.change_live()
        (self.state / token / "uploads" / "catalog.webp").write_bytes(b"tampered")
        engine.offline(self.root)
        self.assertEqual(self.read_status(), "rejected")
        self.assertEqual(self.quote_content(), b"newer quote")

    def test_invalid_zips_are_rejected_without_writing_live_data(self):
        self.make_backup()
        with zipfile.ZipFile(self.zip) as good:
            entries = {name: good.read(name) for name in good.namelist()}
        manifest = json.loads(entries[engine.MANIFEST])
        bad = self.workspace / "bad.zip"
        bad.write_bytes(b"not a zip")
        with self.assertRaises(engine.InvalidBackup):
            engine.stage(self.root, bad, str(uuid.uuid4()))
        link = zipfile.ZipInfo("uploads/symlink.png")
        link.create_system = 3
        link.external_attr = (stat.S_IFLNK | 0o777) << 16
        for label, extra in [
            ("traversal", {"uploads/../outside.png": b"bad"}),
            ("absolute", {"/uploads/bad.png": b"bad"}),
            ("unexpected", {"data/.env": b"bad"}),
            ("symlink", {link: b"/etc/passwd"}),
            ("hash", {"uploads/catalog.webp": b"tampered!!!!!"}),
            ("version", {engine.MANIFEST: json.dumps({**manifest, "version": 2}).encode()}),
        ]:
            with self.subTest(label=label):
                with zipfile.ZipFile(bad, "w") as zip:
                    for name, data in (entries | extra).items():
                        zip.writestr(name, data)
                with self.assertRaises(engine.InvalidBackup):
                    engine.stage(self.root, bad, str(uuid.uuid4()))
        self.assertEqual(self.quote_content(), b"private artwork")
        self.assertEqual(engine.storage_path(self.root, "uploads/catalog.webp").read_bytes(), b"catalog image")


if __name__ == "__main__":
    unittest.main(verbosity=2)
