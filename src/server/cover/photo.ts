import sharp from 'sharp';
import { hasImageSignature } from '../../utils/uploadImages';

export const maxCoverPhotoBytes = 5 * 1024 * 1024;
export const coverPhotoTypes = ['image/png', 'image/jpeg'] as const;

export function detectCoverPhotoMime(buffer: Buffer): 'image/png' | 'image/jpeg' | null {
  if (hasImageSignature(buffer, 'image/png')) return 'image/png';
  if (hasImageSignature(buffer, 'image/jpeg')) return 'image/jpeg';
  return null;
}

export async function normalizeCoverPhotoBuffer(
  input: Buffer,
  maxDimension = 2400,
): Promise<{ original: Buffer; normalized: Buffer; mime: 'image/png' | 'image/jpeg' } | null> {
  if (!input.length || input.length > maxCoverPhotoBytes) return null;
  const mime = detectCoverPhotoMime(input);
  if (!mime) return null;

  try {
    const normalized = await sharp(input, { limitInputPixels: 25_000_000, failOn: 'warning' })
      .rotate()
      .resize({
        width: maxDimension,
        height: maxDimension,
        fit: 'inside',
        withoutEnlargement: true,
      })
      .png()
      .timeout({ seconds: 5 })
      .toBuffer();

    return { original: input, normalized, mime };
  } catch {
    return null;
  }
}

export async function normalizeCoverPhotoFile(
  file: File,
  maxDimension = 2400,
): Promise<{ original: Buffer; normalized: Buffer; mime: 'image/png' | 'image/jpeg' } | null> {
  if (!file.size || file.size > maxCoverPhotoBytes) return null;
  if (file.type && !coverPhotoTypes.includes(file.type as (typeof coverPhotoTypes)[number])) {
    return null;
  }
  const buffer = Buffer.from(await file.arrayBuffer());
  return normalizeCoverPhotoBuffer(buffer, maxDimension);
}

