import type { APIRoute } from 'astro';
import { getNotebookQuoteByDraft, saveNotebookQuote } from '../../../db/notebookQuotes';
import { getRequestStudioSettings } from '../../../db/studioSettings';
import { discardNotebookDraft, getNotebookDraft } from '../../../server/caderno/drafts';
import {
  isNotebookReference,
  notebookQuoteLabels,
  notebookQuotePath,
} from '../../../server/caderno/quoteConfig';
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

    if (typeof token !== 'string' || !isNotebookReference(token)) {
      return reply({ error: 'Solicitação inválida. Gere as prévias novamente.' }, 400);
    }

    let quote = await getNotebookQuoteByDraft(token);
    if (!quote) {
      const draft = getNotebookDraft(token);
      quote = draft ? await saveNotebookQuote(token, draft.config, draft.assets) : await getNotebookQuoteByDraft(token);
      if (!quote) {
        return reply({ error: 'A prévia expirou. Gere as páginas novamente para solicitar o orçamento.' }, 410);
      }
      discardNotebookDraft(token);
    }

    const referencePath = notebookQuotePath(quote.id);
    const { whatsapp } = await getRequestStudioSettings(locals);
    const [modelLabel, style, typography, format] = notebookQuoteLabels(quote.config);

    const colorsText = quote.config.customColors
      ? `personalizadas (${quote.config.colors.primary} e ${quote.config.colors.secondary})`
      : `padrão do estilo (${quote.config.colors.primary} e ${quote.config.colors.secondary})`;

    const lines = [
      `Olá, equipe 678 Estudio! Gostaria de um orçamento para o *${quote.product}*.`,
      `Modelo: ${modelLabel} · Formato: ${format}`,
      `Estilo: ${style} · Tipografia: ${typography}`,
      `Cores: ${colorsText}`,
      `Título: ${quote.config.title ?? modelLabel}`,
      `Identificação: ${quote.config.personalizationName ?? 'não informada'}`,
    ];

    if (quote.config.dedication) {
      lines.push(`Dedicatória: "${quote.config.dedication}"`);
    }

    lines.push(
      `Logomarca: ${quote.config.logo ? 'sim' : 'não'} · Marca-d’água: ${quote.config.watermark ? 'sim' : 'não'}`,
      `Referência e prévias: ${new URL(referencePath, origin).href}`,
    );

    return reply({
      referencePath,
      whatsappUrl: buildWhatsAppLink(whatsapp, lines.join('\n')) ?? null,
    });
  } catch {
    return reply({ error: 'Não foi possível confirmar a solicitação. Tente novamente.' }, 500);
  }
};

