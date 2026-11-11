import type { APIRoute } from 'astro';
import { isAgendaColor, renderAgendaPreview } from '../../../server/agenda/classic.mjs';
import { normalizeAgendaLogo } from '../../../server/agenda/logo';
import { storeAgendaDraft } from '../../../server/agenda/drafts';
import type { PreviewName, QuoteAsset, QuoteConfig } from '../../../server/agenda/quoteConfig';
import { agendaFormats, agendaLayouts, agendaStyles, agendaYears, maxAgendaLogoBytes } from '../../../server/agenda/options.mjs';
import { getPublicOrigin } from '../../../utils/publicOrigin';
import { readBoundedForm } from '../../../utils/webpUpload';

export const prerender = false;
const maxBodyBytes = maxAgendaLogoBytes + 16 * 1024;
let generating = false;

function reply(body: object, status = 200, headers?: HeadersInit) {
  const response = Response.json(body, { status, headers });
  response.headers.set('Cache-Control', 'no-store');
  return response;
}

export const POST: APIRoute = async ({ request, url }) => {
  const origin = request.headers.get('Origin');
  if (request.headers.get('Sec-Fetch-Site') === 'cross-site' || (origin && origin !== getPublicOrigin(url.origin))) {
    return reply({ error: 'Abra o personalizador no site para gerar as prévias.' }, 403);
  }
  const contentType = request.headers.get('Content-Type') ?? '';
  if (!/^multipart\/form-data\s*;/i.test(contentType)) {
    return reply({ error: 'Envie as opções pelo formulário do personalizador.' }, 415);
  }
  if (Number(request.headers.get('Content-Length')) > maxBodyBytes) {
    return reply({ error: 'A logomarca deve ter até 2 MB.' }, 413);
  }
  if (generating) {
    return reply({ error: 'Já estamos gerando outra prévia. Aguarde alguns segundos e tente novamente.' }, 503, { 'Retry-After': '3' });
  }

  generating = true;
  try {
    const deadline = AbortSignal.any([request.signal, AbortSignal.timeout(8_000)]);
    const form = await readBoundedForm(request, contentType, maxBodyBytes, deadline).catch(() => null);
    if (deadline.aborted) return reply({ error: 'O envio demorou demais. Tente novamente.' }, 408);
    if (form === null) return reply({ error: 'O formulário enviado está incompleto.' }, 400);
    if (!form) return reply({ error: 'A logomarca deve ter até 2 MB.' }, 413);

    const yearValue = form.get('year');
    const year = Number(yearValue);
    const layout = form.get('layout');
    const format = form.get('format');
    const style = form.get('style');
    if (String(year) !== yearValue || !agendaYears.includes(year) || typeof layout !== 'string' || !Object.hasOwn(agendaLayouts, layout)
      || typeof format !== 'string' || !Object.hasOwn(agendaFormats, format)
      || typeof style !== 'string' || !Object.hasOwn(agendaStyles, style)) {
      return reply({ error: 'Escolha um ano, layout, formato e estilo disponíveis.' }, 400);
    }
    const primary = form.get('primary');
    const secondary = form.get('secondary');
    let colors: QuoteConfig['colors'] | undefined;
    if (primary !== null || secondary !== null) {
      if (typeof primary !== 'string' || typeof secondary !== 'string' || !isAgendaColor(primary) || !isAgendaColor(secondary)) {
        return reply({ error: 'Selecione duas cores com contraste suficiente no papel branco. Experimente tons mais escuros.' }, 400);
      }
      colors = { primary: primary.toLowerCase(), secondary: secondary.toLowerCase() };
    }
    const logoFile = form.get('logo');
    if (logoFile !== null && !(logoFile instanceof File)) {
      return reply({ error: 'Envie a logomarca em PNG ou JPEG.' }, 400);
    }
    const logo = logoFile?.size ? await normalizeAgendaLogo(logoFile) : undefined;
    if ((logoFile?.size || logoFile?.name) && !logo) {
      return reply({ error: 'Use uma logomarca PNG ou JPEG válida, de até 2 MB e 4 megapixels.' }, 400);
    }
    const watermark = form.get('watermark') === 'true';
    if (watermark && !logo) return reply({ error: 'Envie uma logomarca para usar a marca-d’água.' }, 400);

    const palette = agendaStyles[style as QuoteConfig['style']];
    const config: QuoteConfig = {
      template: 'agenda-classica-v2', year, layout: layout as QuoteConfig['layout'],
      format: format as QuoteConfig['format'], style: style as QuoteConfig['style'],
      colors: colors ?? { primary: palette.primary, secondary: palette.secondary },
      customColors: Boolean(colors), watermark,
      logo: logo && logoFile ? { originalName: logoFile.name.slice(0, 255), original: 'original', normalized: 'logo' } : null,
    };
    const images = await renderAgendaPreview({ ...config, logo: logo?.normalized });
    config.previews = images.map(({ page, pdfPage, section }) => ({ page, pdfPage, section }));
    const assets: QuoteAsset[] = images.map(({ page, src }) => ({
      name: `preview-${page}` as PreviewName, mime: 'image/png',
      content: Buffer.from(src.slice('data:image/png;base64,'.length), 'base64'),
    }));
    if (logo && logoFile) {
      assets.push(
        { name: 'original', mime: logoFile.type, content: logo.original },
        { name: 'logo', mime: 'image/png', content: logo.normalized },
      );
    }
    return reply({ images, draft: storeAgendaDraft(config, assets) });
  } catch (error) {
    console.error('Falha na prévia da agenda', error instanceof Error ? error.message : error);
    return reply({ error: 'Não foi possível gerar as prévias. Tente novamente em alguns instantes.' }, 500);
  } finally {
    generating = false;
  }
};
