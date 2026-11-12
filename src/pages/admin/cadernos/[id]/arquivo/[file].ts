import type { APIRoute } from 'astro';
import { getNotebookQuote, getNotebookQuoteAsset } from '../../../../../db/notebookQuotes';

export const prerender = false;

export const GET: APIRoute = async ({ params }) => {
  const id = params.id ?? '';
  const file = params.file ?? '';
  const headers = { 'Cache-Control': 'no-store', 'X-Content-Type-Options': 'nosniff' };

  if (file === 'configuracao') {
    const quote = await getNotebookQuote(id);
    if (!quote) return new Response(null, { status: 404, headers });
    return Response.json(
      { version: quote.configVersion, ...quote.config },
      {
        headers: {
          ...headers,
          'Content-Disposition': `attachment; filename="caderno-${id}.json"`,
        },
      },
    );
  }

  const asset = await getNotebookQuoteAsset(id, file);
  if (!asset) return new Response(null, { status: 404, headers });

  const isPreview = file.startsWith('preview-');
  const ext = asset.mime === 'image/jpeg' ? 'jpg' : 'png';
  const disposition = isPreview ? 'inline' : `attachment; filename="caderno-${id}-${file}.${ext}"`;

  return new Response(new Uint8Array(asset.content), {
    headers: {
      ...headers,
      'Content-Type': asset.mime,
      'Content-Disposition': disposition,
    },
  });
};

