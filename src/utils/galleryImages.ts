import { mkdir, open, readFile, unlink } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { getDatabasePath } from '../db/database';
import { isGalleryPhotoVisible } from '../db/galleryRepository';
import { GALLERY_ID } from './gallery';
import { hasImageSignature } from './uploadImages';

const photosDirectory = () => join(dirname(getDatabasePath()), 'gallery-photos');

function photoPath(id: string, size: 'thumb' | 'large') {
  if (!GALLERY_ID.test(id)) throw new Error('Identificador de fotografia inválido.');
  return join(photosDirectory(), `${id}-${size}.webp`);
}

export async function writeGalleryPhoto(id: string, thumb: Buffer, large: Buffer, created: string[]) {
  await mkdir(photosDirectory(), { recursive: true });
  for (const [size, bytes] of [['thumb', thumb], ['large', large]] as const) {
    const path = photoPath(id, size);
    const file = await open(path, 'wx');
    created.push(path);
    try {
      await file.writeFile(bytes);
    } finally {
      await file.close();
    }
  }
}

export async function removeGalleryFiles(paths: string[]) {
  await Promise.all(paths.map(async path => {
    try {
      await unlink(path);
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code !== 'ENOENT') console.error('Falha ao remover uma fotografia da galeria.', error);
    }
  }));
}

export function removeGalleryPhotos(ids: string[]) {
  return removeGalleryFiles(ids.flatMap(id => [photoPath(id, 'thumb'), photoPath(id, 'large')]));
}

export async function serveGalleryPhoto(request: Request, id: string, size: string | null, admin = false) {
  const missing = () => new Response(null, { status: 404, headers: { 'Cache-Control': 'no-store' } });
  if (!GALLERY_ID.test(id) || (size !== 'thumb' && size !== 'large') || !await isGalleryPhotoVisible(id, admin)) return missing();
  const tag = `"${id}-${size}"`;
  const headers = {
    'Cache-Control': admin ? 'no-store' : 'public, no-cache',
    'Content-Type': 'image/webp',
    'X-Content-Type-Options': 'nosniff',
    ETag: tag,
  };
  try {
    if (!admin && request.headers.get('If-None-Match') === tag) return new Response(null, { status: 304, headers });
    const bytes = await readFile(photoPath(id, size));
    if (!hasImageSignature(bytes, 'image/webp')) return missing();
    return new Response(Uint8Array.from(bytes), { headers });
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === 'ENOENT') return missing();
    throw error;
  }
}
