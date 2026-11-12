import { parseCoverConfig, type CoverConfig } from './coverConfig';
import { normalizeCoverPhotoFile } from './photo';

export type CoverOrderAsset = {
  name: 'cover_image' | 'cover_image_original';
  mime: string;
  content: Buffer;
};

export type CoverOrderExtraction =
  | { ok: true; cover: CoverConfig; assets: CoverOrderAsset[] }
  | { ok: false; status: number; error: string };

/**
 * Extracts and validates cover configuration and optional uploaded cover photo
 * from a personalizer FormData payload (shared across Caderno, Agenda, and Planner).
 */
export async function extractCoverFromForm(
  form: FormData,
  defaults: { title: string; name?: string },
): Promise<CoverOrderExtraction> {
  const coverPhotoFile = form.get('cover_photo');
  if (coverPhotoFile !== null && !(coverPhotoFile instanceof File)) {
    return { ok: false, status: 400, error: 'Envie a fotografia da capa em PNG ou JPEG.' };
  }

  const normalized = coverPhotoFile?.size
    ? await normalizeCoverPhotoFile(coverPhotoFile, 2400)
    : undefined;
  if ((coverPhotoFile?.size || coverPhotoFile?.name) && !normalized) {
    return { ok: false, status: 400, error: 'Use uma fotografia de capa PNG ou JPEG válida de até 5 MB.' };
  }

  const cover = parseCoverConfig({
    style: form.get('cover_style'),
    typography: form.get('cover_typography'),
    title: form.get('cover_title') || defaults.title,
    name: form.get('cover_name') || defaults.name || '',
    subtitle: form.get('cover_subtitle'),
    colors: {
      primary: (form.get('cover_color_primary') as string) || undefined,
      secondary: (form.get('cover_color_secondary') as string) || undefined,
      text: (form.get('cover_color_text') as string) || undefined,
      accent: (form.get('cover_color_accent') as string) || undefined,
    },
    hasCustomImage: Boolean(normalized),
  });

  const assets: CoverOrderAsset[] = normalized
    ? [
        { name: 'cover_image', mime: 'image/png', content: normalized.normalized },
        { name: 'cover_image_original', mime: normalized.mime, content: normalized.original },
      ]
    : [];

  return { ok: true, cover, assets };
}

