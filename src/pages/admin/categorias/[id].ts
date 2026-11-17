import type { APIRoute } from 'astro';
import { randomUUID } from 'node:crypto';
import {
  createCategory,
  deleteCategory,
  getCategoryById,
  listAdminCategoriesWithCounts,
  toggleCategoryActive,
  toggleCategoryShowOnHome,
  updateCategory,
} from '../../../db/catalogRepository';
import { validateCategoryPayload } from '../../api/categories/index';
import type { ProductCategory } from '../../../types/catalog';

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

  if (id === 'list') {
    const categories = await listAdminCategoriesWithCounts();
    return json({ success: true, data: categories }, 200);
  }

  const category = await getCategoryById(id);
  if (!category) {
    return json({ success: false, error: 'Categoria não encontrada' }, 404);
  }

  return json({ success: true, data: category }, 200);
};

export const POST: APIRoute = async ({ params, request }) => {
  if (params.id && params.id !== 'novo') {
    return json({ success: false, error: 'Rota inválida para criação' }, 400);
  }

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

export const PUT: APIRoute = async ({ params, request }) => {
  const id = params.id;
  if (!id) {
    return json({ success: false, error: 'ID ausente' }, 400);
  }

  try {
    const body = (await request.json()) as Record<string, unknown>;
    const existing = await getCategoryById(id);
    if (!existing) {
      return json({ success: false, error: 'Categoria não encontrada' }, 404);
    }

    if (body.toggleActive !== undefined) {
      await toggleCategoryActive(id, Boolean(body.toggleActive));
      return json({ success: true }, 200);
    }

    if (body.toggleShowOnHome !== undefined) {
      await toggleCategoryShowOnHome(id, Boolean(body.toggleShowOnHome));
      return json({ success: true }, 200);
    }

    const merged = {
      ...existing,
      ...body,
    };
    const validated = validateCategoryPayload(merged);
    if (validated.error || !validated.category) {
      return json({ success: false, error: validated.error ?? 'Dados inválidos' }, 400);
    }

    const updated: ProductCategory = {
      id: existing.id,
      ...validated.category,
    };

    await updateCategory(updated);
    return json({ success: true, data: updated }, 200);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Erro ao atualizar categoria';
    return json({ success: false, error: message }, 400);
  }
};

export const DELETE: APIRoute = async ({ params }) => {
  const id = params.id;
  if (!id) {
    return json({ success: false, error: 'ID ausente' }, 400);
  }

  try {
    const existing = await getCategoryById(id);
    if (!existing) {
      return json({ success: false, error: 'Categoria não encontrada' }, 404);
    }

    await deleteCategory(id);
    return json({ success: true, message: 'Categoria excluída' }, 200);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Não foi possível excluir a categoria';
    return json({ success: false, error: message }, 409);
  }
};
