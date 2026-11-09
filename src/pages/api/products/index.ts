import type { APIRoute } from 'astro';
import { getActiveProductsByCategory, getAllProducts, createProduct } from '../../../db/catalogRepository';
import type { Product } from '../../../types/catalog';

export const prerender = false;

export const GET: APIRoute = async ({ url }) => {
  try {
    const category = url.searchParams.get('category');
    const showAll = url.searchParams.get('all') === 'true';

    if (category && !showAll) {
      const products = await getActiveProductsByCategory(category);
      return new Response(JSON.stringify({ success: true, data: products }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const products = await getAllProducts();
    const filtered = category ? products.filter((p) => p.categorySlug === category) : products;

    return new Response(JSON.stringify({ success: true, data: filtered }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    return new Response(JSON.stringify({ success: false, error: 'Falha ao buscar produtos' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};

export const POST: APIRoute = async ({ request }) => {
  try {
    const body = await request.json();

    if (!body.name || !body.categorySlug || !body.imageUrl) {
      return new Response(JSON.stringify({ success: false, error: 'Campos obrigatórios ausentes' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const product: Product = {
      id: body.id || `prod-${Date.now()}`,
      categorySlug: body.categorySlug,
      name: String(body.name).trim(),
      tagline: String(body.tagline || '').trim(),
      description: String(body.description || '').trim(),
      featuredBadge: body.featuredBadge ? String(body.featuredBadge).trim() : undefined,
      imageUrl: String(body.imageUrl).trim(),
      order: Number(body.order || 99),
      isActive: body.isActive !== false,
      isProvisional: Boolean(body.isProvisional),
    };

    await createProduct(product);

    return new Response(JSON.stringify({ success: true, data: product }), {
      status: 201,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    return new Response(JSON.stringify({ success: false, error: 'Falha ao criar produto' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};

