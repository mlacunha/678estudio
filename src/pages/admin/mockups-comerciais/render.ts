import type { APIRoute } from 'astro';
import { maxMugArtworkBytes, mugMockups } from '../../../server/mockups/options.mjs';
import { normalizeMugArtwork, renderMugMockup } from '../../../server/mockups/render.mjs';
import { parseMugPlacement } from '../../../server/mockups/placement.mjs';
import { getMugInstances } from '../../../server/mockups/manifest.mjs';
import { readBoundedForm } from '../../../utils/webpUpload';

export const prerender = false;
let rendering = false;
const maxBodyBytes = maxMugArtworkBytes * 2 + 16 * 1024;

function failure(error: string, status: number) {
  return Response.json({ error }, { status });
}

export const POST: APIRoute = async ({ request }) => {
  if (request.headers.get('Sec-Fetch-Site') === 'cross-site') return failure('Origem não autorizada.', 403);
  const type = request.headers.get('Content-Type') ?? '';
  if (!/^multipart\/form-data\s*;/i.test(type)) return failure('Envie a arte pelo formulário.', 415);
  if (Number(request.headers.get('Content-Length')) > maxBodyBytes) return failure('O conjunto de artes deve ter até 16 MB.', 413);
  if (rendering) return failure('Há outro mockup em geração. Tente novamente em instantes.', 503);

  rendering = true;
  try {
    const deadline = AbortSignal.any([request.signal, AbortSignal.timeout(15_000)]);
    const form = await readBoundedForm(request, type, maxBodyBytes, deadline).catch(() => null);
    if (deadline.aborted) return failure('O envio da arte demorou demais.', 408);
    if (form === null) return failure('Formulário de mockup inválido.', 400);
    if (!form) return failure('O conjunto de artes deve ter até 16 MB.', 413);

    const model = form.get('model');
    if (typeof model !== 'string' || !mugMockups.some(item => item.id === model)) {
      return failure('Escolha um modelo de mockup válido.', 400);
    }

    const instances = await getMugInstances(model);
    const values = form.getAll('placement');
    let placement: ReturnType<typeof parseMugPlacement> | undefined;
    if (values.length) {
      const [json] = values;
      if (values.length !== 1 || typeof json !== 'string' || json.length > 1024) {
        return failure('Enquadramento inválido.', 400);
      }
      try { placement = parseMugPlacement(json, instances.map(instance => instance.id)); }
      catch { return failure('Enquadramento inválido.', 400); }
    }

    const artwork = form.get('artwork');
    const sources = new Map<string, File>();
    if (artwork instanceof File && artwork.size) sources.set('all', artwork);
    for (const instance of instances) {
      const file = form.get('artwork-' + instance.id);
      if (file instanceof File && file.size) sources.set(instance.id, file);
    }
    if (!sources.has('all') && instances.some(instance => !sources.has(instance.id))) {
      return failure('Carregue uma arte para todos os espaços ou escolha uma em cada espaço.', 400);
    }
    const normalized: Record<string, Buffer> = {};
    for (const [id, file] of sources) {
      if (file.size > maxMugArtworkBytes) return failure('Cada arte deve ter até 8 MB.', 413);
      const image = await normalizeMugArtwork(Buffer.from(await file.arrayBuffer())).catch(() => null);
      if (!image) return failure('Use imagens PNG, JPEG ou WebP estáticas de até 16 megapixels.', 422);
      normalized[id] = image;
    }

    const { all, ...artworks } = normalized;
    const png = await renderMugMockup(model, all ?? Object.values(artworks)[0], {
      placement, ...(Object.keys(artworks).length ? { artworks } : {}),
    });
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
