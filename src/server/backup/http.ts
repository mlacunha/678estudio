import { execFile } from 'node:child_process';
import { randomUUID } from 'node:crypto';
import { createReadStream } from 'node:fs';
import { lstat, mkdtemp, open, readFile, rename, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { Readable } from 'node:stream';
import { promisify } from 'node:util';
import { getDatabasePath, initDatabase } from '../../db/database';
import { readBoundedForm } from '../../utils/webpUpload';
import { pauseUntilIdle, resumeRequests } from './maintenance';

const run = promisify(execFile);
const maxZipBytes = 512 * 1024 * 1024;
const timeout = 15 * 60_000;
const statePath = () => join(dirname(getDatabasePath()), '.backup-restore');
let busy = false;

type Candidate = { token: string; createdAt: string; files: number; bytes: number };
type Result = { phase: string; message: string; finishedAt: string };

async function stateFile<T>(name: string): Promise<T | undefined> {
  try {
    return JSON.parse(await readFile(join(statePath(), name), 'utf8'));
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code !== 'ENOENT') throw error;
  }
}

export async function backupStatus() {
  const [candidate, result] = await Promise.all([
    stateFile<Candidate>('candidate.json'), stateFile<Result>('result.json'),
  ]);
  return { candidate, result };
}

export const canRestore = () => process.env.STUDIO_BACKUP_SUPERVISED === '1' && process.connected && Boolean(process.send);

class BackupError extends Error {
  constructor(message: string, readonly status: number) { super(message); }
}

function json(body: object, status = 200) {
  return Response.json(body, { status, headers: { 'Cache-Control': 'no-store' } });
}

async function engine(action: 'backup' | 'stage', ...args: string[]) {
  const python = process.env.BACKUP_PYTHON || (process.platform === 'win32' ? 'python' : 'python3');
  try {
    const { stdout } = await run(python, [resolve('src/server/backup/engine.py'), action, ...args], {
      timeout, maxBuffer: 128 * 1024, windowsHide: true, env: { ...process.env, PYTHONUTF8: '1' },
    });
    return stdout;
  } catch (error) {
    const failure = error as { code?: number | string; stderr?: string };
    if (failure.code === 2) throw new BackupError(failure.stderr?.trim() || 'Backup inválido.', 422);
    throw error;
  }
}

async function download() {
  if (!await pauseUntilIdle()) throw new BackupError('O site ainda está processando solicitações. Tente novamente.', 503);
  let temporary: string | undefined;
  try {
    await initDatabase();
    temporary = await mkdtemp(join(tmpdir(), '678-backup-'));
    const zip = join(temporary, 'backup.zip');
    await engine('backup', zip);
    const size = (await lstat(zip)).size;
    const stream = createReadStream(zip);
    const directory = temporary;
    stream.once('close', () => {
      void rm(directory, { recursive: true, force: true }).catch(error => console.error('Falha ao remover ZIP temporário', error));
    });
    const stamp = new Date().toISOString().slice(0, 19).replace(/[T:]/g, '-');
    return new Response(Readable.toWeb(stream) as ReadableStream<Uint8Array>, {
      headers: {
        'Content-Type': 'application/zip', 'Content-Length': String(size), 'Cache-Control': 'no-store',
        'Content-Disposition': `attachment; filename="678-estudio-backup-${stamp}Z.zip"`,
      },
    });
  } catch (error) {
    if (temporary) await rm(temporary, { recursive: true, force: true });
    throw error;
  } finally {
    resumeRequests();
  }
}

async function receiveArchive(request: Request, path: string) {
  if (request.headers.get('Content-Type') !== 'application/zip' || !request.body) {
    throw new BackupError('Selecione o ZIP de backup do 678 Estudio.', 415);
  }
  if (Number(request.headers.get('Content-Length')) > maxZipBytes) {
    throw new BackupError('O ZIP excede o limite de 512 MiB.', 413);
  }
  const signal = AbortSignal.any([request.signal, AbortSignal.timeout(timeout)]);
  const file = await open(path, 'wx', 0o600);
  const reader = request.body.getReader();
  const cancel = () => { void reader.cancel().catch(() => {}); };
  signal.addEventListener('abort', cancel, { once: true });
  let size = 0;
  try {
    while (!signal.aborted) {
      const { value, done } = await reader.read();
      if (done) break;
      size += value.byteLength;
      if (size > maxZipBytes) throw new BackupError('O ZIP excede o limite de 512 MiB.', 413);
      await file.writeFile(value);
    }
    if (signal.aborted) throw new BackupError('O envio foi interrompido ou excedeu o tempo permitido.', 408);
    if (!size) throw new BackupError('O arquivo está vazio.', 400);
  } finally {
    cancel();
    signal.removeEventListener('abort', cancel);
    reader.releaseLock();
    await file.close();
  }
}

async function validate(request: Request) {
  const temporary = await mkdtemp(join(tmpdir(), '678-restore-'));
  try {
    const upload = join(temporary, 'upload.zip');
    await receiveArchive(request, upload);
    const output = await engine('stage', upload, randomUUID());
    return json({ candidate: JSON.parse(output) });
  } finally {
    await rm(temporary, { recursive: true, force: true });
  }
}

async function confirm(request: Request) {
  if (!canRestore()) throw new BackupError('A restauração requer o processo supervisionado do 678 Estudio.', 503);
  const type = request.headers.get('Content-Type') ?? '';
  const signal = AbortSignal.any([request.signal, AbortSignal.timeout(5_000)]);
  const form = /^multipart\/form-data\s*;/i.test(type)
    ? await readBoundedForm(request, type, 4096, signal).catch(() => undefined)
    : undefined;
  const token = form?.get('token');
  if (form?.get('confirmacao') !== 'RESTAURAR' || typeof token !== 'string' || !/^[0-9a-f-]{36}$/.test(token)) {
    throw new BackupError('Digite RESTAURAR para confirmar o arquivo validado.', 400);
  }
  const state = statePath();
  const candidate = await stateFile<Candidate>('candidate.json');
  if (candidate?.token !== token || await stateFile('job.json')) {
    throw new BackupError('O arquivo validado mudou ou já há uma restauração agendada.', 409);
  }
  if (!await pauseUntilIdle()) throw new BackupError('O site ainda está processando solicitações. Tente novamente.', 503);
  const temporary = join(state, `job-${randomUUID()}.part`);
  try {
    const file = await open(temporary, 'wx', 0o600);
    try {
      await file.writeFile(JSON.stringify({ token, phase: 'pending' }));
      await file.sync();
    } finally {
      await file.close();
    }
    await rename(temporary, join(state, 'job.json'));
    if (process.platform !== 'win32') {
      const folder = await open(state, 'r');
      try { await folder.sync(); } finally { await folder.close(); }
    }
    process.send!('678-backup-restore');
    return json({ message: 'Restauração agendada. Aguarde a reinicialização do site.' }, 202);
  } catch (error) {
    resumeRequests();
    await rm(temporary, { force: true });
    throw error;
  }
}

export async function backupAction(action: string | undefined, request: Request) {
  if (action !== 'baixar' && action !== 'validar' && action !== 'restaurar') return new Response(null, { status: 404 });
  if (request.headers.get('Sec-Fetch-Site') === 'cross-site') return json({ error: 'Abra o painel no site para continuar.' }, 403);
  if (busy) return json({ error: 'Outra operação de backup está em andamento.' }, 409);
  busy = true;
  try {
    if (action === 'baixar') return await download();
    if (action === 'validar') return await validate(request);
    return await confirm(request);
  } catch (error) {
    if (error instanceof BackupError) return json({ error: error.message }, error.status);
    console.error('Falha em operação de backup', error);
    return json({ error: 'Não foi possível concluir a operação. Confira o espaço em disco e os registros do servidor.' }, 500);
  } finally {
    busy = false;
  }
}
