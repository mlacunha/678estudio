import { spawn } from 'node:child_process';
import { closeSync, existsSync, mkdirSync, openSync, writeFileSync } from 'node:fs';
import { homedir } from 'node:os';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const APP_DIR = dirname(fileURLToPath(import.meta.url));
const PORT = Number(process.env.POC_EDITOR_PORT || 4399);
const BASE_URL = `http://127.0.0.1:${PORT}`;
const DATA_DIR = process.env.MOCKUP_DATA_DIR
  || (existsSync(join(APP_DIR, '../../data/mockups-comerciais'))
    ? join(APP_DIR, '../../data/mockups-comerciais')
    : join(process.env.LOCALAPPDATA || homedir(), '678Estudio-Mockups'));

mkdirSync(DATA_DIR, { recursive: true });
const ERROR_FILE = join(DATA_DIR, 'launcher-error.txt');
const LOG_FILE = join(DATA_DIR, 'server.log');

async function probeHealth() {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 1500);
  try {
    const res = await fetch(`${BASE_URL}/api/health`, { signal: controller.signal });
    const data = await res.json().catch(() => null);
    return { reachable: true, status: res.status, data };
  } catch {
    return { reachable: false };
  } finally {
    clearTimeout(timer);
  }
}

function openBrowser(url) {
  if (process.env.MOCKUP_NO_BROWSER === '1') return;
  const child = spawn('cmd.exe', ['/c', 'start', '', url], {
    detached: true,
    windowsHide: true,
    stdio: 'ignore',
  });
  child.unref();
}

async function main() {
  const initial = await probeHealth();
  if (initial.reachable) {
    if (initial.data?.ok && initial.data?.service === '678estudio-mockups') {
      openBrowser(BASE_URL);
      return;
    }
    throw new Error(`A porta ${PORT} já está em uso por outro aplicativo. Feche o outro serviço e tente novamente.`);
  }

  const serverScript = join(APP_DIR, 'editor-server.mjs');
  if (!existsSync(serverScript)) {
    throw new Error(`Arquivo principal não encontrado: ${serverScript}`);
  }

  const logFd = openSync(LOG_FILE, 'a');
  const child = spawn(process.execPath, [serverScript], {
    cwd: APP_DIR,
    detached: true,
    windowsHide: true,
    stdio: ['ignore', logFd, logFd],
    env: { ...process.env, MOCKUP_DATA_DIR: DATA_DIR },
  });
  child.unref();
  closeSync(logFd);

  const deadline = Date.now() + 12000;
  while (Date.now() < deadline) {
    await new Promise(r => setTimeout(r, 250));
    const check = await probeHealth();
    if (check.reachable && check.data?.ok && check.data?.service === '678estudio-mockups') {
      openBrowser(BASE_URL);
      return;
    }
  }

  throw new Error(`O servidor local não respondeu na porta ${PORT}. Consulte o log em: ${LOG_FILE}`);
}

main().catch(err => {
  try {
    writeFileSync(ERROR_FILE, String(err?.message || err), 'utf8');
  } catch {
    // ignore
  }
  console.error(err?.message || err);
  process.exit(1);
});
