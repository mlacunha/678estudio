import type { APIRoute } from 'astro';
import { randomUUID } from 'node:crypto';
import { mkdir, writeFile } from 'node:fs/promises';
import { getUploadPath, hasImageSignature, MAX_IMAGE_BYTES, MAX_MOCKUP_PAYLOAD_BYTES } from '../../../utils/uploadImages';

export const prerender = false;

export const POST: APIRoute = async ({ request, url }) => {
  if (Number(request.headers.get('content-length')) > MAX_MOCKUP_PAYLOAD_BYTES) {
    return Response.json({ success: false, error: 'O limite por mockup é 10 MB' }, { status: 413 });
  }

  try {
    const body = await request.json().catch(() => null);
    const imageBase64 = body?.imageBase64;

    if (!imageBase64 || typeof imageBase64 !== 'string') {
      return Response.json({ success: false, error: 'Dados de imagem ausentes' }, { status: 400 });
    }

    if (imageBase64.length > MAX_MOCKUP_PAYLOAD_BYTES) {
      return Response.json({ success: false, error: 'O limite por mockup é 10 MB' }, { status: 413 });
    }

    const base64Data = imageBase64.replace(/^data:image\/png;base64,/, '');
    if (!/^[a-zA-Z0-9+/]+={0,2}$/.test(base64Data)) {
      return Response.json({ success: false, error: 'Dados de PNG inválidos' }, { status: 400 });
    }
    const buffer = Buffer.from(base64Data, 'base64');
    if (buffer.length > MAX_IMAGE_BYTES) {
      return Response.json({ success: false, error: 'O limite por mockup é 10 MB' }, { status: 413 });
    }
    if (!hasImageSignature(buffer, 'image/png')) {
      return Response.json({ success: false, error: 'Dados de PNG inválidos' }, { status: 400 });
    }

    const filename = `mockups/mockup-${randomUUID()}.png`;
    await mkdir(getUploadPath('mockups'), { recursive: true });
    await writeFile(getUploadPath(filename), buffer, { flag: 'wx' });

    const relativePath = `/uploads/${filename}`;
    const origin = url.origin;
    const fullMockupUrl = `${origin}${relativePath}`;

    return Response.json({ success: true, relativeUrl: relativePath, fullUrl: fullMockupUrl }, { status: 201 });
  } catch {
    return Response.json({ success: false, error: 'Falha ao salvar mockup temporário' }, { status: 500 });
  }
};

