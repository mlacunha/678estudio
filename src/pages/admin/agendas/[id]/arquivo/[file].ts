import type { APIRoute } from 'astro';
import { getAgendaQuote, getAgendaQuoteAsset } from '../../../../../db/agendaQuotes';

export const prerender = false;

export const GET: APIRoute = async ({ params }) => {
  const id = params.id ?? '';
  const headers = { 'Cache-Control': 'no-store', 'X-Content-Type-Options': 'nosniff' };
  if (params.file === 'configuracao') {
    const quote = await getAgendaQuote(id);
    if (quote) return Response.json({ version: quote.configVersion, ...quote.config }, {
      headers: { ...headers, 'Content-Disposition': `attachment; filename="agenda-${id}.json"` },
    });
  } else if (
    params.file === 'original'
    || params.file === 'logo'
    || params.file === 'cover_image'
    || params.file === 'cover_image_original'
  ) {
    const asset = await getAgendaQuoteAsset(id, params.file);
    if (asset && ['image/jpeg', 'image/png'].includes(asset.mime)) {
      const extension = asset.mime === 'image/jpeg' ? 'jpg' : 'png';
      return new Response(new Uint8Array(asset.content), {
        headers: { ...headers, 'Content-Type': asset.mime, 'Content-Disposition': `attachment; filename="agenda-${id}-${params.file}.${extension}"` },
      });
    }
  }
  return new Response(null, { status: 404, headers });
};
