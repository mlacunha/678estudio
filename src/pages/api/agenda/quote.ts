import type { APIRoute } from 'astro';
import { getAgendaQuoteByDraft, saveAgendaQuote } from '../../../db/agendaQuotes';
import { getRequestStudioSettings } from '../../../db/studioSettings';
import { discardAgendaDraft, getAgendaDraft } from '../../../server/agenda/drafts';
import { agendaQuoteLabels, agendaQuotePath, isAgendaReference } from '../../../server/agenda/quoteConfig';
import { getPublicOrigin } from '../../../utils/publicOrigin';
import { readBoundedForm } from '../../../utils/webpUpload';
import { buildWhatsAppLink } from '../../../utils/whatsapp';

export const prerender = false;
const maxBodyBytes = 2048;

function reply(body: object, status = 200) {
  return Response.json(body, { status, headers: { 'Cache-Control': 'no-store' } });
}

export const POST: APIRoute = async ({ request, url, locals }) => {
  try {
    const origin = getPublicOrigin(url.origin);
    const requestOrigin = request.headers.get('Origin');
    if (request.headers.get('Sec-Fetch-Site') === 'cross-site' || (requestOrigin && requestOrigin !== origin)) {
      return reply({ error: 'Abra o personalizador no site para solicitar o orçamento.' }, 403);
    }
    const contentType = request.headers.get('Content-Type') ?? '';
    if (!/^multipart\/form-data\s*;/i.test(contentType) || Number(request.headers.get('Content-Length')) > maxBodyBytes) {
      return reply({ error: 'Solicitação inválida. Gere as prévias novamente.' }, 400);
    }
    const signal = AbortSignal.any([request.signal, AbortSignal.timeout(5_000)]);
    const form = await readBoundedForm(request, contentType, maxBodyBytes, signal).catch(() => null);
    const token = form?.get('draft');
    if (typeof token !== 'string' || !isAgendaReference(token)) {
      return reply({ error: 'Solicitação inválida. Gere as prévias novamente.' }, 400);
    }

    let quote = await getAgendaQuoteByDraft(token);
    if (!quote) {
      const draft = getAgendaDraft(token);
      quote = draft ? await saveAgendaQuote(token, draft.config, draft.assets) : await getAgendaQuoteByDraft(token);
      if (!quote) return reply({ error: 'A prévia expirou. Gere as páginas novamente para solicitar o orçamento.' }, 410);
      discardAgendaDraft(token);
    }

    const referencePath = agendaQuotePath(quote.id);
    const { whatsapp } = await getRequestStudioSettings(locals);
    const [year, format, layout, style] = agendaQuoteLabels(quote.config);
    const message = [
      `Olá, equipe 678 Estudio! Gostaria de um orçamento para a *${quote.product}*.`,
      `Ano: ${year} · Formato: ${format}`,
      `Layout: ${layout} · Estilo: ${style}`,
      `Logomarca: ${quote.config.logo ? 'sim' : 'não'} · Marca-d’água: ${quote.config.watermark ? 'sim' : 'não'}`,
      `Referência e prévias: ${new URL(referencePath, origin).href}`,
    ].join('\n');
    return reply({ referencePath, whatsappUrl: buildWhatsAppLink(whatsapp, message) ?? null });
  } catch (error) {
    console.error('Falha ao registrar solicitação de agenda', error);
    return reply({ error: 'Não foi possível confirmar a solicitação. Tente novamente.' }, 500);
  }
};
