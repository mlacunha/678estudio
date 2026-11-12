import type { APIRoute } from 'astro';
import { generateCoverPreviewPng } from '../../../server/cover/compiler.mjs';
import { parseCoverConfig } from '../../../server/cover/coverConfig';

export const POST: APIRoute = async ({ request }) => {
  try {
    const contentType = request.headers.get('content-type') || '';
    let target = 'front-a5';
    let coverConfig: any = {};
    let photoBuffer: Buffer | null = null;

    if (contentType.includes('multipart/form-data')) {
      const formData = await request.formData();
      target = (formData.get('target') as string) || 'front-a5';

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
        photoBuffer = Buffer.from(await photoFile.arrayBuffer());
      }
    } else {
      const body = await request.json();
      target = body.target || 'front-a5';
      coverConfig = parseCoverConfig(body);
      if (body.photoBase64) {
        photoBuffer = Buffer.from(body.photoBase64, 'base64');
      }
    }

    const png = await generateCoverPreviewPng({
      target,
      style: coverConfig.style,
      typography: coverConfig.typography,
      title: coverConfig.title,
      name: coverConfig.name,
      subtitle: coverConfig.subtitle,
      colors: coverConfig.colors,
      photoBuffer,
    });

    return new Response(png, {
      status: 200,
      headers: {
        'Content-Type': 'image/png',
        'Cache-Control': 'no-store',
      },
    });
  } catch (err: any) {
    return new Response(JSON.stringify({ error: err?.message || 'Falha na prévia de capa' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};

