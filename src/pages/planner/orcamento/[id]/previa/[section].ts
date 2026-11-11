import type { APIRoute } from 'astro';
import { getPlannerQuoteAsset } from '../../../../../db/plannerQuotes';
import { plannerPreviewSections, type PlannerPreviewSection } from '../../../../../server/planner/quoteConfig';

export const prerender = false;

export const GET: APIRoute = async ({ params }) => {
  const headers = {
    'Cache-Control': 'no-store',
    'X-Robots-Tag': 'noindex, nofollow',
    'X-Content-Type-Options': 'nosniff',
  };
  const section = params.section ?? '';
  if (!plannerPreviewSections.includes(section as PlannerPreviewSection)) {
    return new Response(null, { status: 404, headers });
  }
  const preview = await getPlannerQuoteAsset(params.id ?? '', `preview-${section}`);
  if (!preview || preview.mime !== 'image/png') {
    return new Response(null, { status: 404, headers });
  }
  return new Response(new Uint8Array(preview.content), {
    headers: { ...headers, 'Content-Type': 'image/png' },
  });
};

