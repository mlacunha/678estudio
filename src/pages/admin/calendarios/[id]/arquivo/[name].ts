import type { APIRoute } from 'astro';
import { getCalendarQuote, getCalendarQuoteAsset, isCalendarReference } from '../../../../../db/calendarQuotes';

export const prerender = false;

const VALID_ASSET_NAME = /^(logo|image-(?:all|cover|[1-9]|1[0-2]))$/;
const MIME_TO_EXT: Record<string, string> = {
  'image/png': 'png',
  'image/jpeg': 'jpg',
  'image/webp': 'webp',
};

export const GET: APIRoute = async ({ params, url }) => {
  const id = params.id ?? '';
  const name = params.name ?? '';
  const headers = { 'Cache-Control': 'no-store', 'X-Content-Type-Options': 'nosniff' };

  if (!isCalendarReference(id)) {
    return new Response(null, { status: 404, headers });
  }

  if (name === 'configuracao') {
    const quote = await getCalendarQuote(id);
    if (!quote) return new Response(null, { status: 404, headers });
    return Response.json(
      { id: quote.id, product: quote.product, version: quote.configVersion, ...quote.config },
      { headers: { ...headers, 'Content-Disposition': `attachment; filename="calendario-${id}.json"` } },
    );
  }

  if (!VALID_ASSET_NAME.test(name)) {
    return new Response(null, { status: 404, headers });
  }

  const asset = await getCalendarQuoteAsset(id, name);
  const ext = asset ? MIME_TO_EXT[asset.mime] : undefined;
  if (!asset || !ext) {
    return new Response(null, { status: 404, headers });
  }

  const isDownload = url.searchParams.get('download') === '1';
  const disposition = isDownload ? 'attachment' : 'inline';
  return new Response(new Uint8Array(asset.content), {
    headers: {
      ...headers,
      'Content-Type': asset.mime,
      'Content-Disposition': `${disposition}; filename="calendario-${id}-${name}.${ext}"`,
    },
  });
};
