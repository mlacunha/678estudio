import type { APIRoute } from 'astro';
import {
  ArtRepositoryError,
  deactivateArte,
  getAdminArte,
  updateArteMetadata,
} from '../../../../db/artLibraryRepository';
import { ART_UUID_PATTERN, parseArtProductTypes } from '../../../../utils/artLibrary';

export const prerender = false;

export const GET: APIRoute = async ({ params }) => {
  const id = params.id ?? '';
  if (!ART_UUID_PATTERN.test(id)) {
    return Response.json({ success: false, error: 'Identificador inválido.' }, { status: 400 });
  }
  const arte = await getAdminArte(id);
  if (!arte) return Response.json({ success: false, error: 'Arte não encontrada.' }, { status: 404 });
  return Response.json({ success: true, data: arte });
};

export const PATCH: APIRoute = async ({ params, request }) => {
  const id = params.id ?? '';
  if (!ART_UUID_PATTERN.test(id)) {
    return Response.json({ success: false, error: 'Identificador inválido.' }, { status: 400 });
  }
  try {
    const body = await request.json().catch(() => null);
    if (!body || typeof body !== 'object') {
      return Response.json({ success: false, error: 'Payload inválido.' }, { status: 400 });
    }
    const updated = await updateArteMetadata(id, {
      code: typeof body.code === 'string' ? body.code : undefined,
      title: typeof body.title === 'string' ? body.title : undefined,
      description: typeof body.description === 'string' ? body.description : undefined,
      categoryIds: Array.isArray(body.categoryIds)
        ? body.categoryIds.map((v: unknown) => String(v).trim()).filter(Boolean)
        : undefined,
      productTypes: Array.isArray(body.productTypes) ? parseArtProductTypes(body.productTypes) : undefined,
      isPublished: typeof body.isPublished === 'boolean' ? body.isPublished : undefined,
      isActive: typeof body.isActive === 'boolean' ? body.isActive : undefined,
    });
    return Response.json({ success: true, data: updated });
  } catch (error) {
    if (error instanceof ArtRepositoryError) {
      return Response.json({ success: false, error: error.message }, { status: error.status });
    }
    return Response.json({ success: false, error: 'Falha ao atualizar a arte.' }, { status: 500 });
  }
};

export const DELETE: APIRoute = async ({ params }) => {
  const id = params.id ?? '';
  if (!ART_UUID_PATTERN.test(id)) {
    return Response.json({ success: false, error: 'Identificador inválido.' }, { status: 400 });
  }
  try {
    const deactivated = await deactivateArte(id);
    return Response.json({ success: true, data: deactivated });
  } catch (error) {
    if (error instanceof ArtRepositoryError) {
      return Response.json({ success: false, error: error.message }, { status: error.status });
    }
    return Response.json({ success: false, error: 'Falha ao desativar a arte.' }, { status: 500 });
  }
};

