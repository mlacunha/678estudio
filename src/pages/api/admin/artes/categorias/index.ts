import type { APIRoute } from 'astro';
import {
  ArtRepositoryError,
  createArtCategory,
  listArtCategories,
} from '../../../../../db/artLibraryRepository';

export const prerender = false;

export const GET: APIRoute = async ({ url }) => {
  try {
    const includeInactive = url.searchParams.get('all') !== 'false';
    const data = await listArtCategories(includeInactive);
    return Response.json({ success: true, data });
  } catch {
    return Response.json({ success: false, error: 'Falha ao listar categorias de artes.' }, { status: 500 });
  }
};

export const POST: APIRoute = async ({ request }) => {
  try {
    const body = await request.json().catch(() => null);
    if (!body || typeof body.name !== 'string') {
      return Response.json({ success: false, error: 'Informe o nome da categoria.' }, { status: 400 });
    }
    const created = await createArtCategory({
      name: body.name,
      slug: typeof body.slug === 'string' ? body.slug : undefined,
      displayOrder: typeof body.displayOrder === 'number' ? body.displayOrder : undefined,
    });
    return Response.json({ success: true, data: created }, { status: 201 });
  } catch (error) {
    if (error instanceof ArtRepositoryError) {
      return Response.json({ success: false, error: error.message }, { status: error.status });
    }
    return Response.json({ success: false, error: 'Falha ao criar categoria.' }, { status: 500 });
  }
};

