import type { APIRoute } from 'astro';
import { readFile } from 'node:fs/promises';
import { getImageType, getUploadPath, hasImageSignature } from '../../utils/uploadImages';

export const prerender = false;

export const GET: APIRoute = async ({ params }) => {
  const file = params.file;
  if (!file || !/^(?:mockups\/)?[a-zA-Z0-9_-]+\.[a-zA-Z0-9]+$/.test(file)) {
    return new Response(null, { status: 404 });
  }

  const type = getImageType(file);
  if (!type) return new Response(null, { status: 404 });

  try {
    const image = await readFile(getUploadPath(file));
    if (!hasImageSignature(image, type)) return new Response(null, { status: 404 });

    return new Response(new Uint8Array(image), {
      headers: {
        'Content-Type': type,
        'X-Content-Type-Options': 'nosniff',
      },
    });
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
      return new Response(null, { status: 404 });
    }
    throw error;
  }
};
