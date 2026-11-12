import type { APIRoute } from 'astro';
import { generateCoverPreviewPng } from '../../../server/cover/compiler.mjs';
import { parseCoverConfig } from '../../../server/cover/coverConfig';
import { normalizeCoverPhotoBuffer, normalizeCoverPhotoFile } from '../../../server/cover/photo';

export const prerender = false;

function jsonError(message: string, status: number): Response {
  return new Response(JSON.stringify({ error: message }), {
    status,
    headers: {
      'Content-Type': 'application/json',
      'Cache-Control': 'no-store',
    },
  });
}

export const POST: APIRoute = async ({ request }) => {
  try {
    const contentType = request.headers.get('content-type') || '';
    let target = 'front-a5';
    let coverConfig = parseCoverConfig({});
    let photoBuffer: Buffer | null = null;

    if (contentType.includes('multipart/form-data')) {
      const formData = await request.formData();
      target = String(formData.get('target') || 'front-a5');

      const colors = {
        primary: (formData.get('color_primary') as string) || undefined,
        secondary: (formData.get('color_secondary') as string) || undefined,
        text: (formData.get('color_text') as string) || undefined,
        accent: (formData.get('color_accent') as string) || undefined,
      };

      coverConfig = parseCoverConfig({
        style: formData.get('style'),
        typography: formData.get('typography'),
        title: formData.get('title'),
        name: formData.get('name'),
        subtitle: formData.get('subtitle'),
        colors,
      });

      const photoFile = formData.get('photo');
      if (photoFile instanceof File && photoFile.size > 0) {
        const normalized = await normalizeCoverPhotoFile(photoFile, 1400);
        if (!normalized) {
          return jsonError('Envie uma fotografia PNG ou JPEG válida de até 5 MB.', 400);
        }
        photoBuffer = normalized.normalized;
      }
    } else if (contentType.includes('application/json')) {
      const body = await request.json();
      target = body?.target || 'front-a5';
      coverConfig = parseCoverConfig(body);
      if (typeof body?.photoBase64 === 'string' && body.photoBase64.length > 0) {
        const raw = Buffer.from(body.photoBase64, 'base64');
        const normalized = await normalizeCoverPhotoBuffer(raw, 1400);
        if (!normalized) {
          return jsonError('A fotografia enviada não é um PNG ou JPEG válido de até 5 MB.', 400);
        }
        photoBuffer = normalized.normalized;
      }
    } else {
      return jsonError('Formato de requisição inválido. Envie multipart/form-data ou JSON.', 415);
    }

    const png = await generateCoverPreviewPng({
      target,
      style: coverConfig.style,
      typography: coverConfig.typography,
      title: coverConfig.title || '678 Estudio',
      name: coverConfig.name,
      subtitle: coverConfig.subtitle,
      colors: coverConfig.colors,
      photoBuffer,
    });

    return new Response(new Uint8Array(png), {
      status: 200,
      headers: {
        'Content-Type': 'image/png',
        'Cache-Control': 'no-store',
      },
    });
  } catch (err: any) {
    return jsonError(err?.message || 'Não foi possível gerar a prévia da capa.', 500);
  }
};
