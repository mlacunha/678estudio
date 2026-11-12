import type { APIRoute } from 'astro';
import { normalizeAgendaLogo } from '../../../server/agenda/logo';
import { compileNotebook, isNotebookColor } from '../../../server/caderno/compiler.mjs';
import { storeNotebookDraft } from '../../../server/caderno/drafts';
import { parseCoverConfig } from '../../../server/cover/coverConfig';
import { maxCoverPhotoBytes, normalizeCoverPhotoFile } from '../../../server/cover/photo';
import type {
  NotebookAssetRole,
  NotebookQuoteAsset,
  NotebookQuoteConfig,
} from '../../../server/caderno/quoteConfig';
import {
  maxNotebookLogoBytes,
  notebookFormats,
  notebookModels,
  notebookSectionsByModel,
  notebookStyles,
  notebookTypographies,
} from '../../../server/caderno/options.mjs';
import { getPublicOrigin } from '../../../utils/publicOrigin';
import { readBoundedForm } from '../../../utils/webpUpload';

export const prerender = false;
const maxBodyBytes = maxNotebookLogoBytes + maxCoverPhotoBytes + 64 * 1024;
let generating = false;

function reply(body: object, status = 200, headers?: HeadersInit) {
  const response = Response.json(body, { status, headers });
  response.headers.set('Cache-Control', 'no-store');
  return response;
}

function parseCustomColors(form: FormData): NotebookQuoteConfig['colors'] | null | 'invalid' {
  const primary = form.get('primary');
  const secondary = form.get('secondary');
  if (primary === null && secondary === null) return null;
  if (
    typeof primary !== 'string'
    || typeof secondary !== 'string'
    || !isNotebookColor(primary)
    || !isNotebookColor(secondary)
  ) {
    return 'invalid';
  }
  const pLower = primary.toLowerCase();
  const sLower = secondary.toLowerCase();
  return { primary: pLower, secondary: sLower, accent: sLower };
}

async function renderModelPreviews(
  config: NotebookQuoteConfig,
  logoBuffer: Buffer | undefined,
): Promise<{
  previews: Array<{ id: string; label: string; detail: string; src: string }>;
  previewAssets: NotebookQuoteAsset[];
}> {
  const sections = notebookSectionsByModel[config.model];
  const previews: Array<{ id: string; label: string; detail: string; src: string }> = [];
  const previewAssets: NotebookQuoteAsset[] = [];

  for (const section of sections) {
    try {
      const pngBuffer = await compileNotebook(
        {
          ...config,
          logo: logoBuffer,
          section: section.id,
        },
        { format: 'png', pages: [1] },
      );

      previews.push({
        id: section.id,
        label: section.label,
        detail: section.detail,
        src: `data:image/png;base64,${pngBuffer.toString('base64')}`,
      });
      previewAssets.push({
        name: `preview-${section.id}` as NotebookAssetRole,
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

  return { previews, previewAssets };
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
    if (form === null) return reply({ error: 'O formulário enviado está incompleto.' }, 400);
    if (!form) return reply({ error: 'A logomarca deve ter até 2 MB.' }, 413);

    const model = String(form.get('model') || 'caderno-receitas');
    const format = String(form.get('format') || 'a5');
    const style = String(form.get('style') || 'classic');
    const typography = String(form.get('typography') || 'modern');
    const title = String(form.get('title') || '').trim().slice(0, 60);
    const personalizationName = String(form.get('personalizationName') || '').trim().slice(0, 60);
    const dedication = String(form.get('dedication') || '').trim().slice(0, 240);

    if (
      !Object.hasOwn(notebookModels, model)
      || !Object.hasOwn(notebookFormats, format)
      || !Object.hasOwn(notebookStyles, style)
      || !Object.hasOwn(notebookTypographies, typography)
    ) {
      return reply({ error: 'Selecione opções válidas de modelo, formato, estilo e tipografia.' }, 400);
    }

    const customColorsObj = parseCustomColors(form);
    if (customColorsObj === 'invalid') {
      return reply(
        { error: 'Selecione duas cores com contraste suficiente no papel branco. Experimente tons mais escuros.' },
        400,
      );
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
    if (watermark && !logo) {
      return reply({ error: 'Envie uma logomarca para usar a marca-d’água.' }, 400);
    }

    const coverPhotoFile = form.get('cover_photo');
    if (coverPhotoFile !== null && !(coverPhotoFile instanceof File)) {
      return reply({ error: 'Envie a fotografia da capa em PNG ou JPEG.' }, 400);
    }
    const normalizedCoverPhoto = coverPhotoFile?.size
      ? await normalizeCoverPhotoFile(coverPhotoFile, 2400)
      : undefined;
    if ((coverPhotoFile?.size || coverPhotoFile?.name) && !normalizedCoverPhoto) {
      return reply({ error: 'Use uma fotografia de capa PNG ou JPEG válida de até 5 MB.' }, 400);
    }

    const coverConfig = parseCoverConfig({
      style: form.get('cover_style'),
      typography: form.get('cover_typography'),
      title: form.get('cover_title') || title || notebookModels[model as keyof typeof notebookModels].label,
      name: form.get('cover_name') || personalizationName,
      subtitle: form.get('cover_subtitle'),
      colors: {
        primary: (form.get('cover_color_primary') as string) || undefined,
        secondary: (form.get('cover_color_secondary') as string) || undefined,
        text: (form.get('cover_color_text') as string) || undefined,
        accent: (form.get('cover_color_accent') as string) || undefined,
      },
      hasCustomImage: Boolean(normalizedCoverPhoto),
    });

    const modelKey = model as keyof typeof notebookModels;
    const palette = notebookStyles[style as keyof typeof notebookStyles];
    const config: NotebookQuoteConfig = {
      template: 'caderno-personalizado-v1',
      model: modelKey,
      format: format as keyof typeof notebookFormats,
      style: style as keyof typeof notebookStyles,
      typography: typography as keyof typeof notebookTypographies,
      colors: customColorsObj ?? { primary: palette.primary, secondary: palette.secondary, accent: palette.accent },
      customColors: Boolean(customColorsObj),
      watermark,
      title: title || undefined,
      personalizationName: personalizationName || undefined,
      dedication: modelKey === 'livro-memorias' && dedication ? dedication : undefined,
      logo: logo && logoFile
        ? { originalName: logoFile.name.slice(0, 255), original: 'original', normalized: 'logo' }
        : null,
      sections: notebookSectionsByModel[modelKey].map(s => s.id),
      cover: coverConfig,
    };

    const assets: NotebookQuoteAsset[] = [];
    if (logo && logoFile) {
      assets.push(
        { name: 'original', mime: logoFile.type, content: logo.original },
        { name: 'logo', mime: 'image/png', content: logo.normalized },
      );
    }
    if (normalizedCoverPhoto) {
      assets.push(
        { name: 'cover_image', mime: 'image/png', content: normalizedCoverPhoto.normalized },
        { name: 'cover_image_original', mime: normalizedCoverPhoto.mime, content: normalizedCoverPhoto.original },
      );
    }

    const { previews, previewAssets } = await renderModelPreviews(config, logo?.normalized);
    assets.push(...previewAssets);

    const draftToken = storeNotebookDraft(config, assets);
    return reply({ draft: draftToken, previews });
  } catch {
    return reply({ error: 'Não foi possível gerar as prévias do caderno. Tente novamente.' }, 500);
  } finally {
    generating = false;
  }
};

