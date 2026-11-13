import type { APIRoute } from 'astro';
import {
  addArteVersion,
  ArtRepositoryError,
  getNextArteVersionNumber,
} from '../../../../../db/artLibraryRepository';
import { ART_UUID_PATTERN } from '../../../../../utils/artLibrary';
import {
  ArtImageValidationError,
  processArtImage,
  removeArtFiles,
  writeArtVersionFiles,
} from '../../../../../utils/artLibraryImages';

export const prerender = false;

export const POST: APIRoute = async ({ params, request }) => {
  const id = params.id ?? '';
  if (!ART_UUID_PATTERN.test(id)) {
    return Response.json({ success: false, error: 'Identificador inválido.' }, { status: 400 });
  }

  const form = await request.formData().catch(() => null);
  const file = form?.get('file');
  if (!(file instanceof File) || file.size === 0) {
    return Response.json({ success: false, error: 'Selecione uma imagem válida para a nova versão.' }, { status: 400 });
  }

  let writtenPaths: string[] = [];
  try {
    const nextVersion = await getNextArteVersionNumber(id);
    const buffer = Buffer.from(await file.arrayBuffer());
    const processed = await processArtImage(buffer);
    writtenPaths = await writeArtVersionFiles(id, nextVersion, processed);

    const updated = await addArteVersion(id, nextVersion, {
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
    });

    return Response.json({ success: true, data: updated }, { status: 201 });
  } catch (error) {
    await removeArtFiles(writtenPaths);
    if (error instanceof ArtImageValidationError || error instanceof ArtRepositoryError) {
      return Response.json({ success: false, error: error.message }, { status: error.status });
    }
    return Response.json({ success: false, error: 'Falha ao publicar nova versão da arte.' }, { status: 500 });
  }
};

