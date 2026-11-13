import type { APIRoute } from 'astro';
import { readFile } from 'node:fs/promises';
import { getPublicArteVersion } from '../../../../db/artLibraryRepository';
import { ART_UUID_PATTERN } from '../../../../utils/artLibrary';
import { getArtFilePath } from '../../../../utils/artLibraryImages';
import { hasImageSignature } from '../../../../utils/uploadImages';

export const prerender = false;

export const GET: APIRoute = async ({ params, url, request }) => {
  const missing = () => new Response(null, { status: 404, headers: { 'Cache-Control': 'no-store' } });
  const id = params.id ?? '';
  if (!ART_UUID_PATTERN.test(id)) return missing();

  const variant = url.searchParams.get('variante') ?? 'thumb';
  if (variant !== 'thumb' && variant !== 'preview') {
    return new Response('Variante não permitida na rota pública.', {
      status: variant === 'orig' ? 403 : 400,
      headers: { 'Cache-Control': 'no-store' },
    });
  }

  const versaoParam = url.searchParams.get('versao');
  let requestedVersion: number | undefined;
  if (versaoParam !== null) {
    const parsed = Number(versaoParam);
    if (!Number.isInteger(parsed) || parsed < 1) return missing();
    requestedVersion = parsed;
  }

  const record = await getPublicArteVersion(id, undefined, requestedVersion);
  if (!record) return missing();

  const tag = `"${id}-v${record.version}-${variant}"`;
  const headers = {
    'Cache-Control': 'public, max-age=300',
    'Content-Type': 'image/webp',
    'X-Content-Type-Options': 'nosniff',
    ETag: tag,
  };

  if (request.headers.get('If-None-Match') === tag) {
    return new Response(null, { status: 304, headers });
  }

  try {
    const bytes = await readFile(getArtFilePath(id, record.version, variant));
    if (!hasImageSignature(bytes, 'image/webp')) return missing();
    return new Response(Uint8Array.from(bytes), { status: 200, headers });
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === 'ENOENT') return missing();
    throw error;
  }
};

