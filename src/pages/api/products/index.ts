import type { APIRoute } from 'astro';
import {
  getActiveProductsByCategory,
  getAllProducts,
  listAdminProductsPaginated,
  createProduct,
  getCategoryById,
  getCategoryBySlug,
  isPublishedInternalDestination,
  resolveValidLinkedArteId,
} from '../../../db/catalogRepository';
import {
  isValidCustomizerDestination,
  isValidInternalDestination,
  type ProductActionType,
} from '../../../data/internalDestinations';
import type { Product } from '../../../types/catalog';

export const prerender = false;

const json = (data: unknown, status = 200) =>
  new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });

export function validateProductActionOverride(
  rawType: unknown,
  rawHref: unknown,
  rawCtaLabel: unknown,
  savedDetailsHref?: string,
): { actionType?: ProductActionType; actionHref?: string; ctaLabel?: string; error?: string } {
  const typeStr = typeof rawType === 'string' ? rawType.trim() : '';
  const hrefStr = typeof rawHref === 'string' ? rawHref.trim() : '';
  const ctaLabel = typeof rawCtaLabel === 'string' && rawCtaLabel.trim() ? rawCtaLabel.trim().slice(0, 60) : undefined;

  if (!typeStr) {
    return { actionType: undefined, actionHref: undefined, ctaLabel };
  }
  if (typeStr !== 'details' && typeStr !== 'customizer' && typeStr !== 'quote') {
    return { error: 'Comportamento do produto inválido.' };
  }
  if (typeStr === 'quote') {
    return { actionType: 'quote', actionHref: undefined, ctaLabel };
  }
  if (!hrefStr) {
    return { error: 'Selecione uma rota interna válida para o destino do produto.' };
  }
  if (typeStr === 'customizer' && !isValidCustomizerDestination(hrefStr)) {
    return { error: 'Personalizador selecionado inválido.' };
  }
  if (typeStr === 'details' && hrefStr !== savedDetailsHref && !isValidInternalDestination(hrefStr)) {
    return { error: 'Página interna selecionada inválida.' };
  }
  return { actionType: typeStr, actionHref: hrefStr, ctaLabel };
}

export const GET: APIRoute = async ({ url }) => {
  try {
    const paginated = url.searchParams.get('paginated') === 'true' || url.searchParams.has('page');
    if (paginated) {
      const statusParam = url.searchParams.get('status');
      const featuredParam = url.searchParams.get('featured');
      const result = await listAdminProductsPaginated({
        q: url.searchParams.get('q') ?? undefined,
        categoryId: url.searchParams.get('categoryId') ?? undefined,
        categorySlug: url.searchParams.get('category') ?? undefined,
        status: statusParam === 'active' || statusParam === 'inactive' ? statusParam : 'all',
        featured: featuredParam === 'featured' || featuredParam === 'regular' ? featuredParam : 'all',
        page: Number(url.searchParams.get('page') || 1),
        pageSize: Number(url.searchParams.get('pageSize') || 10),
      });
      return json({ success: true, ...result }, 200);
    }

    const category = url.searchParams.get('category');
    const showAll = url.searchParams.get('all') === 'true';

    if (category && !showAll) {
      const products = await getActiveProductsByCategory(category);
      return json({ success: true, data: products }, 200);
    }

    const products = await getAllProducts();
    const filtered = category
      ? products.filter(p => p.categorySlug === category || p.categoryId === category)
      : products;

    return json({ success: true, data: filtered }, 200);
  } catch {
    return json({ success: false, error: 'Falha ao buscar produtos' }, 500);
  }
};

export const POST: APIRoute = async ({ request }) => {
  try {
    const body = await request.json();
    const categoryKey = String(body.categoryId || body.categorySlug || '').trim();

    if (!body.name || !categoryKey || !body.imageUrl) {
      return json({ success: false, error: 'Campos obrigatórios ausentes' }, 400);
    }

    const category = (await getCategoryById(categoryKey)) ?? (await getCategoryBySlug(categoryKey));
    if (!category) {
      return json({ success: false, error: 'Categoria selecionada não existe.' }, 400);
    }

    const actionCheck = validateProductActionOverride(body.actionType, body.actionHref, body.ctaLabel);
    if (actionCheck.error) {
      return json({ success: false, error: actionCheck.error }, 400);
    }
    if (actionCheck.actionType === 'details' && actionCheck.actionHref &&
        !(await isPublishedInternalDestination(actionCheck.actionHref))) {
      return json({ success: false, error: 'A coleção de destino precisa existir e estar publicada.' }, 400);
    }

    const rawLinkedArteId = body.linkedArteId ? String(body.linkedArteId).trim() : '';
    let linkedArteId: string | undefined;
    if (rawLinkedArteId) {
      linkedArteId = await resolveValidLinkedArteId(
        rawLinkedArteId,
        category.id,
        undefined,
        actionCheck.actionHref ?? category.defaultProductHref,
      );
      if (!linkedArteId) {
        return json(
          {
            success: false,
            error: 'A arte vinculada não existe, está inativa ou não é compatível com esta categoria/destino.',
          },
          400,
        );
      }
    }

    const product: Product = {
      id: body.id || `prod-${Date.now()}`,
      categoryId: category.id,
      categorySlug: category.slug,
      categoryTitle: category.title,
      name: String(body.name).trim(),
      tagline: String(body.tagline || '').trim(),
      description: String(body.description || '').trim(),
      featuredBadge: body.featuredBadge ? String(body.featuredBadge).trim() : undefined,
      imageUrl: String(body.imageUrl).trim(),
      order: Number(body.order ?? 99),
      isActive: body.isActive !== false,
      isProvisional: Boolean(body.isProvisional),
      isFeatured: Boolean(body.isFeatured),
      linkedArteId,
      actionType: actionCheck.actionType,
      actionHref: actionCheck.actionHref,
      ctaLabel: actionCheck.ctaLabel,
    };

    await createProduct(product);
    return json({ success: true, data: product }, 201);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Falha ao criar produto';
    return json({ success: false, error: message }, 500);
  }
};
