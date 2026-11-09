import type { APIRoute } from 'astro';
import { randomUUID } from 'node:crypto';
import { mkdir, open, unlink } from 'node:fs/promises';
import { getProductById, replaceProductImage } from '../../../db/catalogRepository';
import { getCatalogLargeImage } from '../../../utils/catalogImages';
import { MAX_FILE_BYTES, readBoundedForm, readUploadedWebp } from '../../../utils/webpUpload';
import { getUploadPath } from '../../../utils/uploadImages';

export const prerender = false;
const MAX_REQUEST_BYTES = 2 * MAX_FILE_BYTES + 16 * 1024;

const failure = (error: string, status: number) => Response.json({ error }, { status });

export const POST: APIRoute = async ({ request }) => {
  const contentType = request.headers.get('content-type') ?? '';
  if (!contentType.toLowerCase().startsWith('multipart/form-data;')) return failure('Envie as duas versões em WebP.', 415);
  if (Number(request.headers.get('content-length')) > MAX_REQUEST_BYTES) return failure('As imagens excedem o limite de envio.', 413);

  const form = await readBoundedForm(request, contentType, MAX_REQUEST_BYTES).catch(() => null);
  if (!form) return failure('Envio inválido ou acima do limite.', 400);
  const id = form.get('productId');
  const previousImage = form.get('previousImage');
  if (typeof id !== 'string' || !id || typeof previousImage !== 'string' || form.get('confirmed') !== 'on') {
    return failure('Selecione o produto e confirme a substituição da imagem.', 400);
  }

  const [thumbnail, large] = await Promise.all([readUploadedWebp(form.get('thumbnail'), 480, true), readUploadedWebp(form.get('large'), 1200)]);
  if (!thumbnail || !large) return failure('Envie duas imagens WebP válidas, de até 1 MB cada, nos tamanhos do Estúdio.', 415);

  const createdPaths: string[] = [];
  let published = false;
  try {
    const product = await getProductById(id);
    if (!product || !['canecas', 'quadros'].includes(product.categorySlug)) return failure('Produto não disponível no Estúdio.', 404);
    if (product.imageUrl !== previousImage) return failure('A imagem do produto mudou. Atualize a página e confirme a substituição novamente.', 409);

    const filename = `catalog-${randomUUID()}`;
    const imageUrl = `/uploads/${filename}.webp`;
    await mkdir(getUploadPath(''), { recursive: true });
    for (const [name, buffer] of [[`${filename}.webp`, thumbnail.buffer], [`${filename}-large.webp`, large.buffer]] as const) {
      const path = getUploadPath(name);
      const file = await open(path, 'wx');
      createdPaths.push(path);
      try {
        await file.writeFile(buffer);
      } finally {
        await file.close();
      }
    }
    published = await replaceProductImage(product, imageUrl);
    if (!published) return failure('O produto mudou. Atualize a página antes de salvar novamente.', 409);
    return Response.json({ imageUrl, largeUrl: getCatalogLargeImage(imageUrl) }, { status: 201 });
  } catch (error) {
    console.error('Falha ao publicar imagem do catálogo', error);
    return failure('Não foi possível publicar a imagem.', 500);
  } finally {
    if (!published) {
      await Promise.all(createdPaths.map(path => unlink(path).catch(error => {
        console.error('Falha ao remover arquivo de publicação incompleta', error);
      })));
    }
  }
};
