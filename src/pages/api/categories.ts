import type { APIRoute } from 'astro';
import { getActiveCategories, getAllCategories } from '../../db/catalogRepository';

export const prerender = false;

export const GET: APIRoute = async ({ url }) => {
  try {
    const showAll = url.searchParams.get('all') === 'true';
    const categories = showAll ? await getAllCategories() : await getActiveCategories();

    return new Response(JSON.stringify({ success: true, data: categories }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    return new Response(JSON.stringify({ success: false, error: 'Falha ao buscar categorias' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};

