import type { APIRoute } from 'astro';
import { randomUUID } from 'node:crypto';
import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { getImageType, getUploadPath, hasImageSignature, MAX_IMAGE_BYTES } from '../../utils/uploadImages';

export const prerender = false;

export const POST: APIRoute = async ({ request }) => {
  if (Number(request.headers.get('content-length')) > MAX_IMAGE_BYTES + 64 * 1024) {
    return Response.json({ success: false, error: 'O limite por imagem é 10 MB' }, { status: 413 });
  }

  try {
    const formData = await request.formData().catch(() => null);
    const file = formData?.get('file');

    if (!file || !(file instanceof File)) {
      return Response.json({ success: false, error: 'Arquivo inválido ou ausente' }, { status: 400 });
    }

    if (file.size > MAX_IMAGE_BYTES) {
      return Response.json({ success: false, error: 'O limite por imagem é 10 MB' }, { status: 413 });
    }

    const extension = path.extname(file.name).toLowerCase();
    const type = getImageType(file.name);
    const buffer = Buffer.from(await file.arrayBuffer());
    if (!type || !hasImageSignature(buffer, type)) {
      return Response.json({ success: false, error: 'Envie uma imagem JPEG, PNG, WebP ou GIF válida' }, { status: 415 });
    }

    const filename = `${randomUUID()}${extension}`;
    await mkdir(getUploadPath(''), { recursive: true });
    await writeFile(getUploadPath(filename), buffer, { flag: 'wx' });

    return Response.json({ success: true, url: `/uploads/${filename}` }, { status: 201 });
  } catch {
    return Response.json({ success: false, error: 'Falha no upload da imagem' }, { status: 500 });
  }
};

