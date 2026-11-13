import type { APIRoute } from 'astro';
import { randomUUID } from 'node:crypto';
import {
  ArtRepositoryError,
  createArteWithVersion,
  listAdminArtes,
  type AdminArteFilters,
} from '../../../../db/artLibraryRepository';
import {
  ART_BATCH_CONCURRENCY,
  parseArtProductTypes,
  runWithConcurrency,
  titleFromFilename,
} from '../../../../utils/artLibrary';
import {
  ArtImageValidationError,
  processArtImage,
  removeArtFiles,
  writeArtVersionFiles,
} from '../../../../utils/artLibraryImages';

export const prerender = false;

export const GET: APIRoute = async ({ url }) => {
  try {
    const statusParam = url.searchParams.get('situacao') ?? 'active';
    const validStatuses = new Set(['active', 'published', 'draft', 'inactive', 'all']);
    const status = (validStatuses.has(statusParam) ? statusParam : 'active') as AdminArteFilters['status'];
    const data = await listAdminArtes({
      q: url.searchParams.get('q') ?? undefined,
      categoryId: url.searchParams.get('categoria') ?? undefined,
      productType: url.searchParams.get('produto') ?? undefined,
      status,
    });
    return Response.json({ success: true, data });
  } catch {
    return Response.json({ success: false, error: 'Falha ao consultar a biblioteca de artes.' }, { status: 500 });
  }
};

export const POST: APIRoute = async ({ request }) => {
  const form = await request.formData().catch(() => null);
  if (!form) {
    return Response.json({ success: false, error: 'Formulário inválido.' }, { status: 400 });
  }

  const files = form.getAll('files').filter((entry): entry is File => entry instanceof File && entry.size > 0);
  if (!files.length) {
    const single = form.get('file');
    if (single instanceof File && single.size > 0) files.push(single);
  }
  if (!files.length) {
    return Response.json({ success: false, error: 'Selecione ao menos uma imagem para enviar.' }, { status: 400 });
  }

  const productTypes = parseArtProductTypes(form.getAll('products'));
  if (!productTypes.length) {
    return Response.json({ success: false, error: 'Selecione ao menos um produto compatível (Caneca ou Quadro).' }, { status: 400 });
  }

  const categoryIds = form.getAll('categories').map(v => String(v).trim()).filter(Boolean);
  const isPublished = String(form.get('published') ?? 'true') !== 'false';
  const customTitle = String(form.get('title') ?? '').trim();
  const customCode = String(form.get('code') ?? '').trim();
  const description = String(form.get('description') ?? '').trim();
  const isSingle = files.length === 1;

  const outcomes = await runWithConcurrency(files, ART_BATCH_CONCURRENCY, async file => {
    const arteId = randomUUID();
    let writtenPaths: string[] = [];
    try {
      const buffer = Buffer.from(await file.arrayBuffer());
      const processed = await processArtImage(buffer);
      writtenPaths = await writeArtVersionFiles(arteId, 1, processed);

      const created = await createArteWithVersion({
        id: arteId,
        code: isSingle && customCode ? customCode : undefined,
        title: isSingle && customTitle ? customTitle : titleFromFilename(file.name),
        description,
        categoryIds,
        productTypes,
        isPublished,
        version: {
          originalFilename: file.name.slice(0, 200) || `arte.${processed.originalFormat.ext}`,
          originalMime: processed.originalFormat.mime,
          originalExt: processed.originalFormat.ext,
          width: processed.width,
          height: processed.height,
          thumbWidth: processed.thumbWidth,
          thumbHeight: processed.thumbHeight,
          previewWidth: processed.previewWidth,
          previewHeight: processed.previewHeight,
          fileSize: processed.fileSize,
        },
      });
      return { ok: true as const, arte: created };
    } catch (error) {
      await removeArtFiles(writtenPaths);
      const message = error instanceof ArtImageValidationError || error instanceof ArtRepositoryError
        ? error.message
        : 'Falha ao processar a imagem.';
      const status = error instanceof ArtImageValidationError || error instanceof ArtRepositoryError ? error.status : 500;
      return { ok: false as const, filename: file.name, error: message, status };
    }
  });

  const created = outcomes.filter(item => item.ok).map(item => item.arte);
  const errors = outcomes.filter(item => !item.ok).map(({ filename, error, status }) => ({ filename, error, status }));

  if (!created.length && errors.length) {
    return Response.json({ success: false, error: errors[0].error, errors }, { status: errors[0].status });
  }
  return Response.json({ success: true, created, errors }, { status: errors.length ? 207 : 201 });
};

