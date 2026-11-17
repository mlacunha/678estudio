import type { APIRoute } from 'astro';
import {
  getProductById,
  updateProduct,
  toggleProductActive,
  toggleProductFeatured,
  deleteProduct,
  getCategoryById,
  getCategoryBySlug,
  resolveValidLinkedArteId,
} from '../../../db/catalogRepository';
import { validateProductActionOverride } from './index';
import type { Product } from '../../../types/catalog';

export const prerender = false;

const json = (data: unknown, status = 200) =>
  new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });

export const GET: APIRoute = async ({ params }) => {
  const id = params.id;
  if (!id) {
    return json({ success: false, error: 'ID ausente' }, 400);
  }

  const product = await getProductById(id);
  if (!product) {
    return json({ success: false, error: 'Produto não encontrado' }, 404);
  }

  return json({ success: true, data: product }, 200);
};

export const PUT: APIRoute = async ({ params, request }) => {
  const id = params.id;
  if (!id) {
    return json({ success: false, error: 'ID ausente' }, 400);
  }

  try {
    const body = await request.json();
    const existing = await getProductById(id);

    if (!existing) {
      return json({ success: false, error: 'Produto não encontrado' }, 404);
    }

    if (body.toggleActive !== undefined) {
      await toggleProductActive(id, Boolean(body.toggleActive));
      return json({ success: true }, 200);
    }

    if (body.toggleFeatured !== undefined) {
      await toggleProductFeatured(id, Boolean(body.toggleFeatured));
      return json({ success: true }, 200);
    }

    const targetCategoryKey = String(
      body.categoryId || body.categorySlug || existing.categoryId || existing.categorySlug,
    ).trim();
    const category = (await getCategoryById(targetCategoryKey)) ?? (await getCategoryBySlug(targetCategoryKey));
    if (!category) {
      return json({ success: false, error: 'Categoria selecionada não existe.' }, 400);
    }

    const actionCheck =
      body.actionType !== undefined || body.actionHref !== undefined || body.ctaLabel !== undefined
        ? validateProductActionOverride(
            body.actionType !== undefined ? body.actionType : existing.actionType,
            body.actionHref !== undefined ? body.actionHref : existing.actionHref,
            body.ctaLabel !== undefined ? body.ctaLabel : existing.ctaLabel,
          )
        : {
            actionType: existing.actionType,
            actionHref: existing.actionHref,
            ctaLabel: existing.ctaLabel,
          };

    if (actionCheck.error) {
      return json({ success: false, error: actionCheck.error }, 400);
    }

    let nextLinkedArteId = existing.linkedArteId;
    if (body.linkedArteId !== undefined) {
      const rawLinked = body.linkedArteId ? String(body.linkedArteId).trim() : '';
      if (!rawLinked) {
        nextLinkedArteId = undefined;
      } else {
        const valid = await resolveValidLinkedArteId(
          rawLinked,
          category.id,
          undefined,
          actionCheck.actionHref ?? category.defaultProductHref,
        );
        if (!valid) {
          return json(
            {
              success: false,
              error: 'A arte vinculada não existe, está inativa ou não é compatível com esta categoria/destino.',
            },
            400,
          );
        }
        nextLinkedArteId = valid;
      }
    }

    const updated: Product = {
      ...existing,
      categoryId: category.id,
      categorySlug: category.slug,
      categoryTitle: category.title,
      name: body.name ? String(body.name).trim() : existing.name,
      tagline: body.tagline !== undefined ? String(body.tagline).trim() : existing.tagline,
      description: body.description !== undefined ? String(body.description).trim() : existing.description,
      featuredBadge:
        body.featuredBadge !== undefined
          ? body.featuredBadge
            ? String(body.featuredBadge).trim()
            : undefined
          : existing.featuredBadge,
      imageUrl: body.imageUrl ? String(body.imageUrl).trim() : existing.imageUrl,
      order: body.order !== undefined ? Number(body.order) : existing.order,
      isActive: body.isActive !== undefined ? Boolean(body.isActive) : existing.isActive,
      isFeatured: body.isFeatured !== undefined ? Boolean(body.isFeatured) : existing.isFeatured,
      linkedArteId: nextLinkedArteId,
      actionType: actionCheck.actionType,
      actionHref: actionCheck.actionHref,
      ctaLabel: actionCheck.ctaLabel,
    };

    await updateProduct(updated);
    return json({ success: true, data: updated }, 200);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Erro ao atualizar produto';
    return json({ success: false, error: message }, 500);
  }
};

export const DELETE: APIRoute = async ({ params }) => {
  const id = params.id;
  if (!id) {
    return json({ success: false, error: 'ID ausente' }, 400);
  }

  try {
    const existing = await getProductById(id);
    if (!existing) {
      return json({ success: false, error: 'Produto não encontrado' }, 404);
    }

    await deleteProduct(id);
    return json({ success: true, message: 'Produto excluído' }, 200);
  } catch {
    return json({ success: false, error: 'Erro ao excluir produto' }, 500);
  }
};
