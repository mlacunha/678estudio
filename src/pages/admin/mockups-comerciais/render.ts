import type { APIRoute } from 'astro';
import { maxMugArtworkBytes, mugMockups } from '../../../server/mockups/options.mjs';
import { normalizeMugArtwork, renderMugMockup } from '../../../server/mockups/render.mjs';
import { readBoundedForm } from '../../../utils/webpUpload';

export const prerender = false;
let rendering = false;
const maxBodyBytes = maxMugArtworkBytes + 16 * 1024;

function failure(error: string, status: number) {
  return Response.json({ error }, { status });
}

export const POST: APIRoute = async ({ request }) => {
  if (request.headers.get('Sec-Fetch-Site') === 'cross-site') return failure('Origem não autorizada.', 403);
  const type = request.headers.get('Content-Type') ?? '';
  if (!/^multipart\/form-data\s*;/i.test(type)) return failure('Envie a arte pelo formulário.', 415);
  if (Number(request.headers.get('Content-Length')) > maxBodyBytes) return failure('A arte deve ter até 8 MB.', 413);
  if (rendering) return failure('Há outro mockup em geração. Tente novamente em instantes.', 503);

  rendering = true;
  try {
    const deadline = AbortSignal.any([request.signal, AbortSignal.timeout(15_000)]);
    const form = await readBoundedForm(request, type, maxBodyBytes, deadline).catch(() => null);
    if (deadline.aborted) return failure('O envio da arte demorou demais.', 408);
    if (form === null) return failure('Formulário de mockup inválido.', 400);
    if (!form) return failure('A arte deve ter até 8 MB.', 413);

    const model = form.get('model');
    if (typeof model !== 'string' || !mugMockups.some(item => item.id === model)) {
      return failure('Escolha um modelo de mockup válido.', 400);
    }

    const artwork = form.get('artwork');
    if (!(artwork instanceof File) || !artwork.size) return failure('Selecione uma imagem de arte.', 400);
    if (artwork.size > maxMugArtworkBytes) return failure('A arte deve ter até 8 MB.', 413);
    const normalized = await normalizeMugArtwork(Buffer.from(await artwork.arrayBuffer())).catch(() => null);
    if (!normalized) return failure('Use um PNG, JPEG ou WebP estático válido de até 16 megapixels.', 422);

    const png = await renderMugMockup(model, normalized);
    return new Response(new Uint8Array(png), {
      headers: { 'Content-Type': 'image/png', 'X-Content-Type-Options': 'nosniff' },
    });
  } catch (error) {
    console.error('Falha na geração de mockup comercial:', error);
    return failure('Não foi possível gerar o mockup. Tente novamente.', 500);
  } finally {
    rendering = false;
  }
};
