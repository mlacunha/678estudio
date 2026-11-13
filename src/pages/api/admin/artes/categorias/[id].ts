import type { APIRoute } from 'astro';
import {
  ArtRepositoryError,
  deleteArtCategory,
  updateArtCategory,
} from '../../../../../db/artLibraryRepository';

export const prerender = false;

export const PATCH: APIRoute = async ({ params, request }) => {
  const id = params.id ?? '';
  try {
    const body = await request.json().catch(() => null);
    if (!body || typeof body !== 'object') {
      return Response.json({ success: false, error: 'Payload inválido.' }, { status: 400 });
    }
    const updated = await updateArtCategory(id, {
      name: typeof body.name === 'string' ? body.name : undefined,
      slug: typeof body.slug === 'string' ? body.slug : undefined,
      displayOrder: typeof body.displayOrder === 'number' ? body.displayOrder : undefined,
      isActive: typeof body.isActive === 'boolean' ? body.isActive : undefined,
    });
    return Response.json({ success: true, data: updated });
  } catch (error) {
    if (error instanceof ArtRepositoryError) {
      return Response.json({ success: false, error: error.message }, { status: error.status });
    }
    return Response.json({ success: false, error: 'Falha ao atualizar categoria.' }, { status: 500 });
  }
};

export const DELETE: APIRoute = async ({ params }) => {
  const id = params.id ?? '';
  try {
    await deleteArtCategory(id);
    return Response.json({ success: true });
  } catch (error) {
    if (error instanceof ArtRepositoryError) {
      return Response.json({ success: false, error: error.message }, { status: error.status });
    }
    return Response.json({ success: false, error: 'Falha ao excluir categoria.' }, { status: 500 });
  }
};

