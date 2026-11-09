import type { APIRoute } from 'astro';
import { getProductById, updateProduct, toggleProductActive, deleteProduct } from '../../../db/catalogRepository';
import type { Product } from '../../../types/catalog';

export const prerender = false;

export const GET: APIRoute = async ({ params }) => {
  const id = params.id;
  if (!id) {
    return new Response(JSON.stringify({ success: false, error: 'ID ausente' }), { status: 400 });
  }

  const product = await getProductById(id);
  if (!product) {
    return new Response(JSON.stringify({ success: false, error: 'Produto não encontrado' }), { status: 404 });
  }

  return new Response(JSON.stringify({ success: true, data: product }), { status: 200 });
};

export const PUT: APIRoute = async ({ params, request }) => {
  const id = params.id;
  if (!id) {
    return new Response(JSON.stringify({ success: false, error: 'ID ausente' }), { status: 400 });
  }

  try {
    const body = await request.json();
    const existing = await getProductById(id);

    if (!existing) {
      return new Response(JSON.stringify({ success: false, error: 'Produto não encontrado' }), { status: 404 });
    }

    if (body.toggleActive !== undefined) {
      await toggleProductActive(id, Boolean(body.toggleActive));
      return new Response(JSON.stringify({ success: true }), { status: 200 });
    }

    const updated: Product = {
      ...existing,
      categorySlug: body.categorySlug || existing.categorySlug,
      name: body.name ? String(body.name).trim() : existing.name,
      tagline: body.tagline !== undefined ? String(body.tagline).trim() : existing.tagline,
      description: body.description !== undefined ? String(body.description).trim() : existing.description,
      featuredBadge: body.featuredBadge !== undefined ? (body.featuredBadge ? String(body.featuredBadge).trim() : undefined) : existing.featuredBadge,
      imageUrl: body.imageUrl ? String(body.imageUrl).trim() : existing.imageUrl,
      order: body.order !== undefined ? Number(body.order) : existing.order,
      isActive: body.isActive !== undefined ? Boolean(body.isActive) : existing.isActive,
    };

    await updateProduct(updated);
    return new Response(JSON.stringify({ success: true, data: updated }), { status: 200 });
  } catch (error) {
    return new Response(JSON.stringify({ success: false, error: 'Erro ao atualizar produto' }), { status: 500 });
  }
};

export const DELETE: APIRoute = async ({ params }) => {
  const id = params.id;
  if (!id) {
    return new Response(JSON.stringify({ success: false, error: 'ID ausente' }), { status: 400 });
  }

  try {
    const existing = await getProductById(id);
    if (!existing) {
      return new Response(JSON.stringify({ success: false, error: 'Produto não encontrado' }), { status: 404 });
    }

    await deleteProduct(id);
    return new Response(JSON.stringify({ success: true, message: 'Produto excluído' }), { status: 200 });
  } catch (error) {
    return new Response(JSON.stringify({ success: false, error: 'Erro ao excluir produto' }), { status: 500 });
  }
};

