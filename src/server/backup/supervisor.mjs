import { spawn } from 'node:child_process';
import { existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

const engine = fileURLToPath(new URL('./engine.py', import.meta.url));
let current;
let stopping = false;
for (const signal of ['SIGTERM', 'SIGINT']) {
  process.on(signal, () => {
    stopping = true;
    current?.kill(signal);
  });
}

function waitForExit(child) {
  return new Promise((resolve, reject) => {
    child.once('error', reject);
    child.once('exit', resolve);
  });
}

while (!stopping) {
  if (existsSync('data/.backup-restore/job.json')) {
    current = spawn(process.env.BACKUP_PYTHON || (process.platform === 'win32' ? 'python' : 'python3'), [engine, 'offline'], { stdio: 'inherit' });
    const code = await waitForExit(current);
    if (stopping) break;
    if (code !== 0) {
      console.error('O site permanece parado para proteger a recuperação da restauração.');
      process.exitCode = 1;
      break;
    }
  }

  const app = spawn(process.execPath, ['dist/server/entry.mjs'], {
    stdio: ['inherit', 'inherit', 'inherit', 'ipc'],
    env: { ...process.env, STUDIO_BACKUP_SUPERVISED: '1' },
  });
  current = app;
  let restarting = false;
  let timer;
  app.on('message', message => {
    if (message !== '678-backup-restore' || restarting || stopping) return;
    restarting = true;
    // A requisição de confirmação já foi aceita. Dê tempo para enviar a resposta.
    timer = setTimeout(() => app.kill('SIGTERM'), 750);
  });
  const code = await waitForExit(app);
  clearTimeout(timer);
  if (!restarting || stopping) {
    process.exitCode = stopping ? 0 : (code || 1);
    break;
  }
}
