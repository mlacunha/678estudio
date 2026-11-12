import { execFile } from 'node:child_process';
import { promises as fs } from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { promisify } from 'node:util';

const execFileAsync = promisify(execFile);
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const COVER_TYPST_DIR = path.join(__dirname, 'typst');
const FONTS_DIR = path.join(__dirname, '../planner/typst/fonts');

export async function compileCoverPdf(options) {
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

  const tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'cover-pdf-'));
  const outputPath = path.join(tempDir, 'output.pdf');
  let photoFilePath = '';

  try {
    if (photoBuffer && Buffer.isBuffer(photoBuffer)) {
      photoFilePath = path.join(tempDir, 'photo.png');
      await fs.writeFile(photoFilePath, photoBuffer);
    }

    const args = [
      'compile',
      path.join(COVER_TYPST_DIR, 'cover.typ'),
      outputPath,
      '--font-path',
      FONTS_DIR,
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

    if (photoFilePath) {
      args.push('--input', `photo=${photoFilePath}`);
    }

    await execFileAsync('typst', args, { cwd: COVER_TYPST_DIR });
    const pdfBuffer = await fs.readFile(outputPath);
    return pdfBuffer;
  } finally {
    await fs.rm(tempDir, { recursive: true, force: true }).catch(() => {});
  }
}

export async function generateCoverPreviewPng(options) {
  const {
    target = 'front-a5',
    style = 'classic',
    typography = 'editorial',
    title = '678 Estudio',
    name = '',
    subtitle = '',
    colors = {},
    photoBuffer = null,
  } = options;

  const tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'cover-preview-'));
  const outputPath = path.join(tempDir, 'preview-{0p}.png');
  let photoFilePath = '';

  try {
    if (photoBuffer && Buffer.isBuffer(photoBuffer)) {
      photoFilePath = path.join(tempDir, 'photo.png');
      await fs.writeFile(photoFilePath, photoBuffer);
    }

    const args = [
      'compile',
      path.join(COVER_TYPST_DIR, 'cover.typ'),
      outputPath,
      '--font-path',
      FONTS_DIR,
      '--input',
      `target=${target}`,
      '--input',
      'bleed=0mm', // Preview com refile 100% limpo
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
      '--ppi',
      '144',
    ];

    if (photoFilePath) {
      args.push('--input', `photo=${photoFilePath}`);
    }

    await execFileAsync('typst', args, { cwd: COVER_TYPST_DIR });
    const renderedFiles = await fs.readdir(tempDir);
    const pngFile = renderedFiles.find(f => f.endsWith('.png'));
    if (!pngFile) {
      throw new Error('Falha ao renderizar imagem PNG de prévia da capa.');
    }
    const pngBuffer = await fs.readFile(path.join(tempDir, pngFile));
    return pngBuffer;
  } finally {
    await fs.rm(tempDir, { recursive: true, force: true }).catch(() => {});
  }
}

