import type { APIRoute } from 'astro';
import { randomUUID } from 'node:crypto';
import { deleteGalleryWork, GalleryConflict, GalleryInputError, saveGalleryWork } from '../../../db/galleryRepository';
import { GALLERY_ID, GALLERY_LARGE_SIZE, GALLERY_THUMB_SIZE, MAX_GALLERY_PHOTOS, readWorkFields } from '../../../utils/gallery';
import { removeGalleryFiles, removeGalleryPhotos, writeGalleryPhoto } from '../../../utils/galleryImages';
import { MAX_FILE_BYTES, readBoundedForm, readUploadedWebp } from '../../../utils/webpUpload';

export const prerender = false;
const MAX_REQUEST = 2 * MAX_GALLERY_PHOTOS * MAX_FILE_BYTES + 64 * 1024;
const failure = (error: string, status: number) => Response.json({ error }, { status });

export const POST: APIRoute = async ({ request }) => {
  const contentType = request.headers.get('content-type') ?? '';
  if (!contentType.toLowerCase().startsWith('multipart/form-data;')) return failure('Envio inválido.', 415);
  if (Number(request.headers.get('content-length')) > MAX_REQUEST) return failure('Envio acima do limite.', 413);
  const form = await readBoundedForm(request, contentType, MAX_REQUEST).catch(() => null);
  if (!form) return failure('Envio inválido ou acima do limite.', 400);

  const key = form.get('id');
  const version = Number(form.get('version'));
  if (typeof key !== 'string' || (key && !GALLERY_ID.test(key)) || !Number.isSafeInteger(version) ||
      (key ? version <= 0 : version !== 0)) return failure('Trabalho inválido.', 400);
  const id = key || randomUUID();
  const created: string[] = [];
  let committed = false;
  try {
    if (form.get('intent') === 'delete') {
      if (!key || form.get('confirmation') !== 'on') return failure('Confirme a exclusão do trabalho.', 400);
      const removed = await deleteGalleryWork(id, version);
      await removeGalleryPhotos(removed);
      return Response.json({ url: '/admin/trabalhos?excluido=1' });
    }
    const thumbs = form.getAll('thumbnail');
    const largeImages = form.getAll('large');
    const retained = form.getAll('retain').map(String);
    if (thumbs.length !== largeImages.length || thumbs.length + retained.length > MAX_GALLERY_PHOTOS ||
        retained.some(photo => !GALLERY_ID.test(photo))) return failure('Confira a seleção de até oito fotografias.', 400);
    let fields;
    try {
      fields = readWorkFields(form);
    } catch (error) {
      return failure((error as Error).message, 400);
    }
    const images = await Promise.all(thumbs.map(async (thumb, index) => ({
      thumb: await readUploadedWebp(thumb, GALLERY_THUMB_SIZE),
      large: await readUploadedWebp(largeImages[index], GALLERY_LARGE_SIZE),
    })));
    const additions = [];
    for (const { thumb, large } of images) {
      if (!thumb || !large || thumb.width > large.width || thumb.height > large.height ||
          Math.abs(thumb.width * large.height - thumb.height * large.width) > Math.max(large.width, large.height)) {
        return failure('Envie versões WebP válidas, de até 1 MB cada e com a mesma proporção.', 415);
      }
      additions.push({
        id: randomUUID(), width: large.width, height: large.height, thumbWidth: thumb.width, thumbHeight: thumb.height,
        thumb: thumb.buffer, large: large.buffer,
      });
    }
    const cover = String(form.get('cover') ?? '');
    const newCover = /^new:(\d+)$/.exec(cover);
    const coverId = newCover ? additions[Number(newCover[1])]?.id ?? '' : cover;
    for (const photo of additions) await writeGalleryPhoto(photo.id, photo.thumb, photo.large, created);
    const removed = await saveGalleryWork(id, version, fields, retained, additions, coverId, form.get('confirmation') === 'on');
    committed = true;
    await removeGalleryPhotos(removed);
    return Response.json({ url: `/admin/trabalhos/${id}?salvo=1` }, { status: key ? 200 : 201 });
  } catch (error) {
    if (error instanceof GalleryInputError) return failure(error.message, 400);
    if (error instanceof GalleryConflict) return failure('Este trabalho mudou. Recarregue a página antes de salvar.', 409);
    console.error('Falha ao gravar trabalho da galeria.', error);
    return failure('Não foi possível concluir a operação.', 500);
  } finally {
    if (!committed) await removeGalleryFiles(created);
  }
};
