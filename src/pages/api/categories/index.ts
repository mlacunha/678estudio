import type { APIRoute } from 'astro';
import { randomUUID } from 'node:crypto';
import {
  createCategory,
  listAdminCategoriesWithCounts,
  validateCategorySlugFormat,
} from '../../../db/catalogRepository';
import {
  isValidCustomizerDestination,
  isValidInternalDestination,
  type CategoryDestinationType,
  type CategoryLayoutType,
  type ProductActionType,
} from '../../../data/internalDestinations';
import type { ProductCategory } from '../../../types/catalog';

export const prerender = false;

const json = (data: unknown, status = 200) =>
  new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });

export function validateCategoryPayload(body: Record<string, unknown>): {
  category?: Omit<ProductCategory, 'id'>;
  error?: string;
} {
  const title = typeof body.title === 'string' ? body.title.trim() : '';
  const rawSlug = typeof body.slug === 'string' ? body.slug.trim() : '';
  if (!title || !rawSlug) {
    return { error: 'Nome/título e slug da categoria são obrigatórios.' };
  }

  let slug: string;
  try {
    slug = validateCategorySlugFormat(rawSlug);
  } catch (err) {
    return { error: (err as Error).message };
  }

  const layoutType = (body.layoutType ? String(body.layoutType) : 'carousel') as CategoryLayoutType;
  if (!['carousel', 'grid', 'banner'].includes(layoutType)) {
    return { error: 'Layout de apresentação inválido.' };
  }

  const destinationType = (body.destinationType ? String(body.destinationType) : 'collection') as CategoryDestinationType;
  if (!['collection', 'internal_page'].includes(destinationType)) {
    return { error: 'Tipo de destino da categoria inválido.' };
  }

  const rawDestHref = typeof body.destinationHref === 'string' ? body.destinationHref.trim() : '';
  let destinationHref: string;
  if (destinationType === 'internal_page') {
    if (!rawDestHref || !isValidInternalDestination(rawDestHref)) {
      return { error: 'Selecione uma página interna válida para o destino da categoria.' };
    }
    destinationHref = rawDestHref;
  } else {
    destinationHref = slug === 'canecas' ? '/canecas' : slug === 'quadros' ? '/quadros' : `/colecoes/${slug}`;
  }

  const defaultProductAction = (
    body.defaultProductAction ? String(body.defaultProductAction) : 'quote'
  ) as ProductActionType;
  if (!['details', 'customizer', 'quote'].includes(defaultProductAction)) {
    return { error: 'Comportamento padrão dos produtos inválido.' };
  }

  const rawDefaultHref = typeof body.defaultProductHref === 'string' ? body.defaultProductHref.trim() : '';
  let defaultProductHref: string | undefined;
  if (defaultProductAction === 'customizer' && rawDefaultHref) {
    if (!isValidCustomizerDestination(rawDefaultHref)) {
      return { error: 'Personalizador padrão selecionado inválido.' };
    }
    defaultProductHref = rawDefaultHref;
  } else if (defaultProductAction === 'details' && rawDefaultHref) {
    if (!isValidInternalDestination(rawDefaultHref)) {
      return { error: 'Destino padrão selecionado inválido.' };
    }
    defaultProductHref = rawDefaultHref;
  }

  return {
    category: {
      slug,
      title,
      subtitle: typeof body.subtitle === 'string' ? body.subtitle.trim() : '',
      description: typeof body.description === 'string' ? body.description.trim() : '',
      badge: typeof body.badge === 'string' ? body.badge.trim() : '',
      coverImageUrl:
        typeof body.coverImageUrl === 'string' && body.coverImageUrl.trim() ? body.coverImageUrl.trim() : undefined,
      displayOrder: Number.isFinite(Number(body.displayOrder)) ? Number(body.displayOrder) : 0,
      isActive: body.isActive !== false,
      showOnHome: body.showOnHome !== false,
      showOnMenu: body.showOnMenu !== false,
      layoutType,
      destinationType,
      destinationHref,
      defaultProductAction,
      defaultProductHref,
    },
  };
}

export const GET: APIRoute = async () => {
  try {
    const categories = await listAdminCategoriesWithCounts();
    return json({ success: true, data: categories }, 200);
  } catch {
    return json({ success: false, error: 'Falha ao listar categorias' }, 500);
  }
};

export const POST: APIRoute = async ({ request }) => {
  try {
    const body = (await request.json()) as Record<string, unknown>;
    const validated = validateCategoryPayload(body);
    if (validated.error || !validated.category) {
      return json({ success: false, error: validated.error ?? 'Dados inválidos' }, 400);
    }

    const category: ProductCategory = {
      id: `cat-${randomUUID().slice(0, 8)}`,
      ...validated.category,
    };

    await createCategory(category);
    return json({ success: true, data: category }, 201);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Falha ao criar categoria';
    return json({ success: false, error: message }, 400);
  }
};
