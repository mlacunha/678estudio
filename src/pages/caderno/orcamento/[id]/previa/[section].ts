import type { APIRoute } from 'astro';
import { getNotebookQuoteAsset } from '../../../../../db/notebookQuotes';
import { notebookPreviewSections, type NotebookPreviewSection } from '../../../../../server/caderno/quoteConfig';

export const prerender = false;

export const GET: APIRoute = async ({ params }) => {
  const headers = {
    'Cache-Control': 'no-store',
    'X-Robots-Tag': 'noindex, nofollow',
    'X-Content-Type-Options': 'nosniff',
  };
  const section = params.section ?? '';
  if (!notebookPreviewSections.includes(section as NotebookPreviewSection)) {
    return new Response(null, { status: 404, headers });
  }
  const preview = await getNotebookQuoteAsset(params.id ?? '', `preview-${section}`);
  if (!preview || preview.mime !== 'image/png') {
    return new Response(null, { status: 404, headers });
  }
  return new Response(new Uint8Array(preview.content), {
    headers: { ...headers, 'Content-Type': 'image/png' },
  });
};

