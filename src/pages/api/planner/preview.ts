import type { APIRoute } from 'astro';
import { compilePlannerEssencial } from '../../../server/planner/essencial.mjs';
import { storePlannerDraft } from '../../../server/planner/drafts';
import type { PlannerAssetRole, PlannerQuoteAsset, PlannerQuoteConfig } from '../../../server/planner/quoteConfig';
import {
  plannerFormats,
  plannerModels,
  plannerModes,
  plannerStyles,
  plannerTypographies,
  plannerYears,
  plannerSections,
  maxPlannerLogoBytes,
} from '../../../server/planner/options.mjs';
import { getPublicOrigin } from '../../../utils/publicOrigin';
import { readBoundedForm } from '../../../utils/webpUpload';

export const prerender = false;
const maxBodyBytes = maxPlannerLogoBytes + 16 * 1024;
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
    return reply({ error: 'Já estamos gerando outra prévia. Aguarde alguns segundos.' }, 503, { 'Retry-After': '2' });
  }

  generating = true;
  try {
    const deadline = AbortSignal.any([request.signal, AbortSignal.timeout(15_000)]);
    const form = await readBoundedForm(request, contentType, maxBodyBytes, deadline).catch(() => null);
    if (deadline.aborted) return reply({ error: 'O envio demorou demais. Tente novamente.' }, 408);
    if (!form) return reply({ error: 'O formulário enviado está incompleto ou a logo ultrapassa 2 MB.' }, 400);

    const model = String(form.get('model') || 'planner-essencial');
    const mode = String(form.get('mode') || 'dated') as 'dated' | 'undated';
    const yearValue = form.get('year');
    const year = yearValue ? Number(yearValue) : 2027;
    const format = String(form.get('format') || 'a5');
    const style = String(form.get('style') || 'classic');
    const typography = String(form.get('typography') || 'modern');
    const personalizationName = String(form.get('personalizationName') || '').trim();

    if (!Object.hasOwn(plannerModels, model) || !Object.hasOwn(plannerModes, mode)
      || !Object.hasOwn(plannerFormats, format) || !Object.hasOwn(plannerStyles, style)
      || !Object.hasOwn(plannerTypographies, typography)) {
      return reply({ error: 'Selecione opções válidas de modelo, modalidade, formato, estilo e tipografia.' }, 400);
    }

    if (mode === 'dated' && (!year || !plannerYears.includes(year))) {
      return reply({ error: 'Escolha um ano válido para a modalidade datada.' }, 400);
    }

    const palette = plannerStyles[style as keyof typeof plannerStyles];
    const config: PlannerQuoteConfig = {
      template: 'planner-essencial-v1',
      model: model as keyof typeof plannerModels,
      mode,
      year: mode === 'dated' ? year : undefined,
      format: format as keyof typeof plannerFormats,
      style: style as keyof typeof plannerStyles,
      typography: typography as keyof typeof plannerTypographies,
      colors: { primary: palette.primary, secondary: palette.secondary, accent: palette.accent },
      customColors: false,
      personalizationName: personalizationName || undefined,
      logo: null,
      sections: plannerSections.map(s => s.id),
    };

    const assets: PlannerQuoteAsset[] = [];
    const logoFile = form.get('logo');
    let logoBuffer: Buffer | undefined;

    if (logoFile instanceof File && logoFile.size > 0) {
      logoBuffer = Buffer.from(await logoFile.arrayBuffer());
      config.logo = {
        originalName: logoFile.name,
        original: 'original',
        normalized: 'logo',
      };
      assets.push({ name: 'logo', mime: logoFile.type || 'image/png', content: logoBuffer });
    }

    // Renderizar as prévias reais Typst para as seções em memória
    const previews: Array<{ id: string; label: string; detail: string; src: string }> = [];

    for (const section of plannerSections) {
      try {
        const pngBuffer = await compilePlannerEssencial({
          ...config,
          logo: logoBuffer,
          section: section.id,
        }, { format: 'png', pages: [1] });

        const base64 = pngBuffer.toString('base64');
        previews.push({
          id: section.id,
          label: section.label,
          detail: section.detail,
          src: `data:image/png;base64,${base64}`,
        });

        assets.push({
          name: `preview-${section.id}` as PlannerAssetRole,
          mime: 'image/png',
          content: pngBuffer,
        });
      } catch {
        previews.push({
          id: section.id,
          label: section.label,
          detail: section.detail,
          src: '',
        });
      }
    }

    const draftToken = storePlannerDraft(config, assets);
    return reply({ draft: draftToken, previews });
  } catch (error) {
    return reply({ error: 'Não foi possível gerar as prévias do planner. Tente novamente.' }, 500);
  } finally {
    generating = false;
  }
};

