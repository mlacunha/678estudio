import type { APIRoute } from 'astro';
import { getPlannerQuoteByDraft, savePlannerQuote } from '../../../db/plannerQuotes';
import { getRequestStudioSettings } from '../../../db/studioSettings';
import { discardPlannerDraft, getPlannerDraft } from '../../../server/planner/drafts';
import {
  plannerQuoteLabels,
  plannerQuotePath,
  isPlannerReference,
} from '../../../server/planner/quoteConfig';
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

    if (typeof token !== 'string' || !isPlannerReference(token)) {
      return reply({ error: 'Solicitação inválida. Gere as prévias novamente.' }, 400);
    }

    let quote = await getPlannerQuoteByDraft(token);
    if (!quote) {
      const draft = getPlannerDraft(token);
      quote = draft ? await savePlannerQuote(token, draft.config, draft.assets) : await getPlannerQuoteByDraft(token);
      if (!quote) {
        return reply({ error: 'A prévia expirou. Gere as páginas novamente para solicitar o orçamento.' }, 410);
      }
      discardPlannerDraft(token);
    }

    const referencePath = plannerQuotePath(quote.id);
    const { whatsapp } = await getRequestStudioSettings(locals);
    const [model, mode, style, typography, format] = plannerQuoteLabels(quote.config);

    const colorsText = quote.config.customColors
      ? `personalizadas (${quote.config.colors.primary} e ${quote.config.colors.secondary})`
      : `padrão do estilo (${quote.config.colors.primary} e ${quote.config.colors.secondary})`;

    const message = [
      `Olá, equipe 678 Estudio! Gostaria de um orçamento para o *${quote.product}*.`,
      `Modelo: ${model} · Formato: ${format}`,
      `Modalidade: ${mode} · Estilo: ${style} · Tipografia: ${typography}`,
      `Cores: ${colorsText}`,
      `Nome personalizado: ${quote.config.personalizationName ?? 'não informado'}`,
      `Logomarca: ${quote.config.logo ? 'sim' : 'não'} · Marca-d’água: ${quote.config.watermark ? 'sim' : 'não'}`,
      `Referência e prévias: ${new URL(referencePath, origin).href}`,
    ].join('\n');

    return reply({
      referencePath,
      whatsappUrl: buildWhatsAppLink(whatsapp, message) ?? null,
    });
  } catch (error) {
    return reply({ error: 'Não foi possível confirmar a solicitação. Tente novamente.' }, 500);
  }
};

