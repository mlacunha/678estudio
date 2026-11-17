import type { APIRoute } from 'astro';
import {
  calendarQuotePath,
  saveCalendarQuote,
  type CalendarQuoteAsset,
  type CalendarQuoteConfig,
} from '../../../db/calendarQuotes';
import { getRequestStudioSettings } from '../../../db/studioSettings';
import { getPublicOrigin } from '../../../utils/publicOrigin';
import { buildWhatsAppLink } from '../../../utils/whatsapp';

export const prerender = false;
const MAX_TOTAL_BYTES = 25 * 1024 * 1024;
const ALLOWED_IMAGE_MIMES = new Set(['image/png', 'image/jpeg', 'image/webp']);
const VALID_ASSET_NAME = /^(logo|image-(?:all|cover|[1-9]|1[0-2]))$/;

function reply(body: object, status = 200) {
  return Response.json(body, { status, headers: { 'Cache-Control': 'no-store' } });
}

function sanitizeConfig(raw: unknown): CalendarQuoteConfig | null {
  if (!raw || typeof raw !== 'object') return null;
  const r = raw as Record<string, unknown>;
  const modality = r.modality === 'monthly'
    ? 'monthly'
    : r.modality === 'desk'
      ? 'desk'
      : r.modality === 'annual'
        ? 'annual'
        : null;
  if (!modality) return null;
  const year = Number(r.year);
  if (!Number.isInteger(year) || year < 2024 || year > 2100) return null;

  return {
    modality,
    year,
    templateId: String(r.templateId || 'minimalist').slice(0, 40),
    format: r.format === 'A3' ? 'A3' : 'A4',
    orientation: r.orientation === 'landscape' ? 'landscape' : 'portrait',
    weekStart: r.weekStart === 'monday' ? 'monday' : 'sunday',
    includeFederalHolidays: Boolean(r.includeFederalHolidays),
    includeGoodFriday: Boolean(r.includeGoodFriday),
    includeBleed: Boolean(r.includeBleed),
    wireOMarginMm: r.wireOMarginMm ? Number(r.wireOMarginMm) : undefined,
    includeCover: r.includeCover !== undefined ? Boolean(r.includeCover) : undefined,
    title: typeof r.title === 'string' ? r.title.slice(0, 80) : undefined,
    subtitle: typeof r.subtitle === 'string' ? r.subtitle.slice(0, 120) : undefined,
    imagePlacement: {
      scale: Number((r.imagePlacement as Record<string, unknown> | undefined)?.scale ?? 1),
      anchorX: Number((r.imagePlacement as Record<string, unknown> | undefined)?.anchorX ?? 0.5),
      anchorY: Number((r.imagePlacement as Record<string, unknown> | undefined)?.anchorY ?? 0.5),
    },
    imageScope: r.imageScope === 'page' ? 'page' : 'all',
    libraryArtCodes: (r.libraryArtCodes && typeof r.libraryArtCodes === 'object')
      ? (r.libraryArtCodes as Record<string, string>)
      : undefined,
    advertiser: (r.advertiser && typeof r.advertiser === 'object')
      ? (r.advertiser as CalendarQuoteConfig['advertiser'])
      : undefined,
    sheetWidthMm: r.sheetWidthMm ? Number(r.sheetWidthMm) : undefined,
    sheetHeightMm: r.sheetHeightMm ? Number(r.sheetHeightMm) : undefined,
    base: (r.base && typeof r.base === 'object')
      ? (r.base as CalendarQuoteConfig['base'])
      : undefined,
    assetNames: [],
  };
}

export const POST: APIRoute = async ({ request, url, locals }) => {
  try {
    const origin = getPublicOrigin(url.origin);
    const requestOrigin = request.headers.get('Origin');
    if (request.headers.get('Sec-Fetch-Site') === 'cross-site' || (requestOrigin && requestOrigin !== origin)) {
      return reply({ error: 'Abra o personalizador no site para solicitar o orçamento.' }, 403);
    }

    const contentLength = Number(request.headers.get('Content-Length') || 0);
    if (contentLength > MAX_TOTAL_BYTES) {
      return reply({ error: 'Os arquivos enviados excedem o limite permitido.' }, 413);
    }

    const form = await request.formData().catch(() => null);
    if (!form) return reply({ error: 'Dados do orçamento inválidos.' }, 400);

    let parsedRaw: unknown;
    try {
      parsedRaw = JSON.parse(String(form.get('config') || ''));
    } catch {
      return reply({ error: 'Configuração do calendário inválida.' }, 400);
    }

    const config = sanitizeConfig(parsedRaw);
    if (!config) return reply({ error: 'Parâmetros do calendário inválidos.' }, 400);

    const assets: CalendarQuoteAsset[] = [];
    for (const [key, value] of form.entries()) {
      if (!VALID_ASSET_NAME.test(key) || !(value instanceof File) || value.size === 0) continue;
      if (!ALLOWED_IMAGE_MIMES.has(value.type)) {
        return reply({ error: `Formato não suportado para ${key}. Use PNG, JPG ou WebP.` }, 400);
      }
      assets.push({
        name: key,
        mime: value.type,
        content: Buffer.from(await value.arrayBuffer()),
      });
    }
    config.assetNames = assets.map(a => a.name);

    const quote = await saveCalendarQuote(config, assets);
    const referencePath = calendarQuotePath(quote.id);
    const { whatsapp } = await getRequestStudioSettings(locals);

    const formatDesc = config.modality === 'desk'
      ? `${config.sheetWidthMm ?? 200}×${config.sheetHeightMm ?? 120} mm Paisagem (Base triangular)`
      : `${config.format} ${config.orientation === 'landscape' ? 'Paisagem' : 'Retrato'}`;
    const lines = [
      `Olá, equipe 678 Estudio! Gostaria de um orçamento para *${quote.product}*.`,
      `• Ano: ${config.year} · Formato: ${formatDesc}`,
      `• Modelo: ${config.templateId}${config.modality !== 'annual' ? ` · ${config.includeCover ? '13 págs. (com capa)' : '12 págs.'}` : ''}`,
      config.advertiser?.name ? `• Anunciante: ${config.advertiser.name}` : '',
      `• Referência da personalização: ${new URL(referencePath, origin).href}`,
    ].filter(Boolean);

    return reply({
      id: quote.id,
      referencePath,
      whatsappUrl: buildWhatsAppLink(whatsapp, lines.join('\n')) ?? null,
    });
  } catch (error) {
    console.error('Falha ao registrar solicitação de calendário', error);
    return reply({ error: 'Não foi possível registrar a solicitação. Tente novamente.' }, 500);
  }
};
