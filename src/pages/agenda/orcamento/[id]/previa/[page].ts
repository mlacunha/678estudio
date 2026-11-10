import type { APIRoute } from 'astro';
import { getAgendaQuoteAsset } from '../../../../../db/agendaQuotes';
import type { PreviewName } from '../../../../../server/agenda/quoteConfig';

export const prerender = false;

export const GET: APIRoute = async ({ params }) => {
  const headers = { 'Cache-Control': 'no-store', 'X-Robots-Tag': 'noindex, nofollow', 'X-Content-Type-Options': 'nosniff' };
  if (!/^[1-3]$/.test(params.page ?? '')) return new Response(null, { status: 404, headers });
  const preview = await getAgendaQuoteAsset(params.id ?? '', `preview-${params.page}` as PreviewName);
  if (!preview || preview.mime !== 'image/png') return new Response(null, { status: 404, headers });
  return new Response(new Uint8Array(preview.content), { headers: { ...headers, 'Content-Type': 'image/png' } });
};
