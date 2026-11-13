import { mkdir, open, readFile, unlink } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import sharp from 'sharp';
import { getDatabasePath } from '../db/database';
import {
  ART_MAX_INPUT_PIXELS,
  ART_PREVIEW_MAX_PX,
  ART_THUMB_MAX_PX,
  ART_UUID_PATTERN,
  detectImageFormat,
  getArtLibraryLimits,
  type DetectedImageFormat,
} from './artLibrary';

export type ArtImageVariant = 'thumb' | 'preview' | 'orig';

export interface ProcessedArtImage {
  original: Buffer;
  originalFormat: DetectedImageFormat;
  thumb: Buffer;
  preview: Buffer;
  width: number;
  height: number;
  thumbWidth: number;
  thumbHeight: number;
  previewWidth: number;
  previewHeight: number;
  fileSize: number;
}

export class ArtImageValidationError extends Error {
  readonly status: number;
  constructor(message: string, status = 400) {
    super(message);
    this.status = status;
  }
}

export function getArtesDirectory(): string {
  return join(dirname(getDatabasePath()), 'artes');
}

/** Monta o caminho absoluto versionado sem sobrescrever versões anteriores. */
export function getArtFilePath(id: string, version: number, variant: ArtImageVariant, origExt = 'png'): string {
  if (!ART_UUID_PATTERN.test(id)) throw new Error('Identificador de arte inválido.');
  if (!Number.isInteger(version) || version < 1) throw new Error('Versão de arte inválida.');
  const fileName = variant === 'orig'
    ? `${id}-v${version}-orig.${origExt}`
    : `${id}-v${version}-${variant}.webp`;
  return join(getArtesDirectory(), fileName);
}

/** Valida assinatura real, limites e gera thumb/preview WebP mantendo o original intacto. */
export async function processArtImage(buffer: Buffer): Promise<ProcessedArtImage> {
  const limits = getArtLibraryLimits();
  if (buffer.length === 0) throw new ArtImageValidationError('Arquivo de imagem vazio.', 400);
  if (buffer.length > limits.maxBytes) {
    const maxMb = Math.round((limits.maxBytes / (1024 * 1024)) * 10) / 10;
    throw new ArtImageValidationError(`A imagem excede o limite de ${maxMb} MB.`, 413);
  }

  const format = detectImageFormat(buffer);
  if (!format) {
    throw new ArtImageValidationError('Formato inválido. Envie JPEG, PNG ou WebP válido.', 415);
  }

  let metadata: sharp.Metadata;
  try {
    metadata = await sharp(buffer, { limitInputPixels: ART_MAX_INPUT_PIXELS, failOn: 'error' }).metadata();
  } catch {
    throw new ArtImageValidationError('Não foi possível decodificar a imagem enviada.', 415);
  }

  const width = metadata.width ?? 0;
  const height = metadata.height ?? 0;
  if (width < limits.minDimension || height < limits.minDimension) {
    throw new ArtImageValidationError(`Dimensões mínimas exigidas: ${limits.minDimension}×${limits.minDimension} px.`, 422);
  }
  if (width > limits.maxDimension || height > limits.maxDimension) {
    throw new ArtImageValidationError(`Dimensões máximas permitidas: ${limits.maxDimension}×${limits.maxDimension} px.`, 422);
  }

  const [thumbResult, previewResult] = await Promise.all([
    sharp(buffer, { limitInputPixels: ART_MAX_INPUT_PIXELS })
      .rotate()
      .resize({ width: ART_THUMB_MAX_PX, height: ART_THUMB_MAX_PX, fit: 'inside', withoutEnlargement: true })
      .webp({ quality: 80 })
      .toBuffer({ resolveWithObject: true }),
    sharp(buffer, { limitInputPixels: ART_MAX_INPUT_PIXELS })
      .rotate()
      .resize({ width: ART_PREVIEW_MAX_PX, height: ART_PREVIEW_MAX_PX, fit: 'inside', withoutEnlargement: true })
      .webp({ quality: 88 })
      .toBuffer({ resolveWithObject: true }),
  ]);

  return {
    original: buffer,
    originalFormat: format,
    thumb: thumbResult.data,
    preview: previewResult.data,
    width,
    height,
    thumbWidth: thumbResult.info.width,
    thumbHeight: thumbResult.info.height,
    previewWidth: previewResult.info.width,
    previewHeight: previewResult.info.height,
    fileSize: buffer.length,
  };
}

/** Grava os três arquivos da versão de forma exclusiva (flag wx), limpando em caso de falha. */
export async function writeArtVersionFiles(
  id: string,
  version: number,
  processed: ProcessedArtImage,
): Promise<string[]> {
  await mkdir(getArtesDirectory(), { recursive: true });
  const targets: Array<[string, Buffer]> = [
    [getArtFilePath(id, version, 'thumb'), processed.thumb],
    [getArtFilePath(id, version, 'preview'), processed.preview],
    [getArtFilePath(id, version, 'orig', processed.originalFormat.ext), processed.original],
  ];
  const created: string[] = [];

  try {
    for (const [filePath, bytes] of targets) {
      const handle = await open(filePath, 'wx');
      created.push(filePath);
      try {
        await handle.writeFile(bytes);
      } finally {
        await handle.close();
      }
    }
    return created;
  } catch (error) {
    await removeArtFiles(created);
    throw error;
  }
}

/** Remove arquivos específicos em disco (usado em rollback ou exclusão física autorizada). */
export async function removeArtFiles(paths: readonly string[]): Promise<void> {
  await Promise.all(
    paths.map(async filePath => {
      try {
        await unlink(filePath);
      } catch (error) {
        if ((error as NodeJS.ErrnoException).code !== 'ENOENT') {
          console.error('Falha ao remover arquivo da biblioteca de artes.', error);
        }
      }
    }),
  );
}

/** Lê e entrega arquivo da biblioteca no contexto autenticado de administração. */
export async function serveAdminArtFile(
  filePath: string,
  mime: string,
  downloadName?: string,
): Promise<Response> {
  try {
    const bytes = await readFile(filePath);
    const headers: Record<string, string> = {
      'Cache-Control': 'no-store',
      'Content-Type': mime,
      'X-Content-Type-Options': 'nosniff',
    };
    if (downloadName) {
      const safeName = downloadName.replace(/["\\\r\n]/g, '_');
      headers['Content-Disposition'] = `attachment; filename="${safeName}"`;
    }
    return new Response(Uint8Array.from(bytes), { status: 200, headers });
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
      return new Response(null, { status: 404, headers: { 'Cache-Control': 'no-store' } });
    }
    throw error;
  }
}

