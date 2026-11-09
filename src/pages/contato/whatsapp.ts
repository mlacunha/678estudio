import type { APIRoute } from 'astro';
import { getRequestStudioSettings } from '../../db/studioSettings';
import { buildWhatsAppLink, formatWhatsAppMessage, WHATSAPP_UNAVAILABLE } from '../../utils/whatsapp';

export const prerender = false;

export const GET: APIRoute = async ({ url, locals }) => {
  const { whatsapp } = await getRequestStudioSettings(locals);
  const message = url.searchParams.get('text') || formatWhatsAppMessage();
  const location = buildWhatsAppLink(whatsapp, message);
  const headers = { 'Cache-Control': 'no-store' };
  return location
    ? new Response(null, { status: 302, headers: { ...headers, Location: location } })
    : new Response(WHATSAPP_UNAVAILABLE, { status: 503, headers: { ...headers, 'Content-Type': 'text/plain; charset=utf-8' } });
};
