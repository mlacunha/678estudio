import { execFileSync } from 'node:child_process';
import { copyFileSync, cpSync, existsSync, mkdirSync, readFileSync, rmSync, statSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = dirname(fileURLToPath(import.meta.url));
const pkg = JSON.parse(readFileSync(join(HERE, 'package.runtime.json'), 'utf8'));
const VERSION = process.env.MOCKUP_APP_VERSION || pkg.version || '1.0.0';
const OUT_ROOT = process.env.MOCKUP_INSTALLER_OUT || join(HERE, '../../output/installer');
const STAGING_DIR = join(OUT_ROOT, 'staging');
const APP_DIR = join(STAGING_DIR, 'app');
const RUNTIME_DIR = join(STAGING_DIR, 'runtime');

const ISCC_CANDIDATES = [
  process.env.INNO_SETUP_ISCC || '',
  join(process.env.LOCALAPPDATA || '', 'Programs/Inno Setup 6/ISCC.exe'),
  'C:/Program Files (x86)/Inno Setup 6/ISCC.exe',
  'C:/Program Files/Inno Setup 6/ISCC.exe',
].filter(Boolean);

const APP_FILES = [
  'editor-server.mjs',
  'editor.html',
  'mockup-engine.mjs',
  'prepare-input.mjs',
  'photopea-bridge.mjs',
  'art-library-adapter.mjs',
  'art-library-remote-adapter.mjs',
  'launcher.mjs',
  'iniciar.vbs',
  'config.default.json',
];

function findIscc() {
  const found = ISCC_CANDIDATES.find(p => existsSync(p));
  if (!found) throw new Error('Inno Setup 6 (ISCC.exe) não encontrado no sistema.');
  return found;
}

function main() {
  rmSync(STAGING_DIR, { recursive: true, force: true });
  mkdirSync(APP_DIR, { recursive: true });
  mkdirSync(RUNTIME_DIR, { recursive: true });

  // 1. Runtime Node.js x64 portátil
  copyFileSync(process.execPath, join(RUNTIME_DIR, 'node.exe'));

  // 2. Código do aplicativo e templates JSON
  for (const file of APP_FILES) {
    copyFileSync(join(HERE, file), join(APP_DIR, file));
  }
  cpSync(join(HERE, 'templates'), join(APP_DIR, 'templates'), { recursive: true });

  // 3. Manifesto mínimo de produção (sem devDependencies nem Astro/SQLite)
  const runtimePkg = { ...pkg, version: VERSION };
  writeFileSync(join(APP_DIR, 'package.json'), JSON.stringify(runtimePkg, null, 2), 'utf8');

  console.log('Instalando dependências de execução (sharp, puppeteer-core)...');
  execFileSync('npm.cmd', ['install', '--omit=dev', '--no-audit', '--no-fund'], {
    cwd: APP_DIR,
    stdio: 'inherit',
    shell: true,
  });

  // 4. Compilar instalador Inno Setup
  const iscc = findIscc();
  console.log(`Compilando instalador v${VERSION} com ${iscc}...`);
  execFileSync(iscc, [
    `/DAppVersion=${VERSION}`,
    `/DStagingDir=${STAGING_DIR}`,
    `/O${OUT_ROOT}`,
    join(HERE, 'installer.iss'),
  ], { stdio: 'inherit' });

  const exePath = join(OUT_ROOT, `678Estudio-Mockups-Setup-${VERSION}-x64.exe`);
  const bytes = statSync(exePath).size;
  console.log(JSON.stringify({ ok: true, version: VERSION, exePath, bytes, mb: (bytes / (1024 * 1024)).toFixed(2) }, null, 2));
}

main();
