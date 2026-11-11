import type { APIRoute } from 'astro';
import { getPlannerQuote, getPlannerQuoteAsset } from '../../../../../db/plannerQuotes';

export const prerender = false;

export const GET: APIRoute = async ({ params }) => {
  const id = params.id ?? '';
  const file = params.file ?? '';
  const headers = { 'Cache-Control': 'no-store', 'X-Content-Type-Options': 'nosniff' };

  if (file === 'configuracao') {
    const quote = await getPlannerQuote(id);
    if (!quote) return new Response(null, { status: 404, headers });
    return Response.json(
      { version: quote.configVersion, ...quote.config },
      {
        headers: {
          ...headers,
          'Content-Disposition': `attachment; filename="planner-${id}.json"`,
        },
      }
    );
  }

  const asset = await getPlannerQuoteAsset(id, file);
  if (!asset) return new Response(null, { status: 404, headers });

  const isPreview = file.startsWith('preview-');
  const disposition = isPreview ? 'inline' : `attachment; filename="planner-${id}-${file}.${asset.mime === 'image/jpeg' ? 'jpg' : 'png'}"`;

  return new Response(new Uint8Array(asset.content), {
    headers: {
      ...headers,
      'Content-Type': asset.mime,
      'Content-Disposition': disposition,
    },
  });
};

