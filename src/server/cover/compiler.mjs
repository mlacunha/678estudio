import { execFile } from 'node:child_process';
import { existsSync } from 'node:fs';
import { cp, mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { promisify } from 'node:util';

const execFileAsync = promisify(execFile);
const __dirname = path.dirname(fileURLToPath(import.meta.url));

function resolveDir(localRelative, cwdRelative) {
  const localPath = path.join(__dirname, localRelative);
  return existsSync(localPath) ? localPath : path.resolve(cwdRelative);
}

const COVER_TYPST_DIR = resolveDir('typst', 'src/server/cover/typst');
const FONTS_DIR = resolveDir('../planner/typst/fonts', 'src/server/planner/typst/fonts');
const TYPST_BIN = process.env.TYPST_BINARY || 'typst';

function detectPhotoExtension(buffer) {
  if (buffer.length >= 3 && buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff) {
    return 'jpg';
  }
  return 'png';
}

async function runCoverTypst(options, format, ppi) {
  const {
    target = 'front-a5',
    bleed = '3mm',
    style = 'classic',
    typography = 'editorial',
    title = '678 Estudio',
    name = '',
    subtitle = '',
    colors = {},
    photoBuffer = null,
  } = options;

  const tempDir = await fsMktemp();
  const hasPhoto = Boolean(photoBuffer && Buffer.isBuffer(photoBuffer) && photoBuffer.length > 0);
  const rootDir = hasPhoto ? path.join(tempDir, 'typst-root') : COVER_TYPST_DIR;
  const outputPath = path.join(tempDir, format === 'png' ? 'cover-rendered.png' : 'cover-rendered.pdf');

  try {
    let photoInputName = '';
    if (hasPhoto) {
      await cp(COVER_TYPST_DIR, rootDir, { recursive: true });
      const ext = detectPhotoExtension(photoBuffer);
      photoInputName = `input-photo.${ext}`;
      await writeFile(path.join(rootDir, photoInputName), photoBuffer);
    }

    const args = [
      'compile',
      '--root',
      rootDir,
      '--font-path',
      FONTS_DIR,
      '--format',
      format,
      '--input',
      `target=${target}`,
      '--input',
      `bleed=${bleed}`,
      '--input',
      `style=${style}`,
      '--input',
      `typography=${typography}`,
      '--input',
      `title=${title}`,
      '--input',
      `name=${name}`,
      '--input',
      `subtitle=${subtitle || ''}`,
      '--input',
      `color_primary=${colors.primary || '#1e293b'}`,
      '--input',
      `color_secondary=${colors.secondary || '#f8fafc'}`,
      '--input',
      `color_text=${colors.text || '#ffffff'}`,
      '--input',
      `color_accent=${colors.accent || '#c5a059'}`,
    ];

    if (ppi) {
      args.push('--ppi', String(ppi));
    }
    if (photoInputName) {
      args.push('--input', `photo=/${photoInputName}`);
    }

    args.push(path.join(rootDir, 'cover.typ'), outputPath);

    await execFileAsync(TYPST_BIN, args, {
      timeout: 30_000,
      windowsHide: true,
    });

    return await readFile(outputPath);
  } catch (err) {
    const stderr = err?.stderr ? String(err.stderr).trim() : '';
    const detail = stderr || err?.message || 'Erro desconhecido no Typst';
    throw new Error(`Falha ao compilar capa no Typst: ${detail}`);
  } finally {
    await rm(tempDir, { recursive: true, force: true }).catch(() => {});
  }
}

async function fsMktemp() {
  return mkdtemp(path.join(os.tmpdir(), '678-cover-'));
}

export async function compileCoverPdf(options = {}) {
  return runCoverTypst(options, 'pdf');
}

export async function generateCoverPreviewPng(options = {}) {
  return runCoverTypst({ ...options, bleed: '0mm' }, 'png', 144);
}
