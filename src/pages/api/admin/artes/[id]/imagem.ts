import type { APIRoute } from 'astro';
import { getArteVersionRecord } from '../../../../../db/artLibraryRepository';
import { ART_UUID_PATTERN } from '../../../../../utils/artLibrary';
import { getArtFilePath, serveAdminArtFile, type ArtImageVariant } from '../../../../../utils/artLibraryImages';

export const prerender = false;

export const GET: APIRoute = async ({ params, url }) => {
  const id = params.id ?? '';
  if (!ART_UUID_PATTERN.test(id)) {
    return new Response(null, { status: 404, headers: { 'Cache-Control': 'no-store' } });
  }

  const variantParam = url.searchParams.get('variante') ?? 'thumb';
  if (variantParam !== 'thumb' && variantParam !== 'preview' && variantParam !== 'orig') {
    return new Response(null, { status: 400, headers: { 'Cache-Control': 'no-store' } });
  }
  const variant: ArtImageVariant = variantParam;

  const versaoParam = url.searchParams.get('versao');
  let requestedVersion: number | undefined;
  if (versaoParam !== null) {
    const parsed = Number(versaoParam);
    if (!Number.isInteger(parsed) || parsed < 1) {
      return new Response(null, { status: 400, headers: { 'Cache-Control': 'no-store' } });
    }
    requestedVersion = parsed;
  }

  const record = await getArteVersionRecord(id, requestedVersion);
  if (!record) {
    return new Response(null, { status: 404, headers: { 'Cache-Control': 'no-store' } });
  }

  const filePath = getArtFilePath(id, record.version, variant, record.originalExt);
  const mime = variant === 'orig' ? record.originalMime : 'image/webp';
  const download = variant === 'orig' && url.searchParams.get('download') === '1'
    ? `${record.code}-v${record.version}.${record.originalExt}`
    : undefined;

  return serveAdminArtFile(filePath, mime, download);
};

