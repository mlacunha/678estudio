import type { APIRoute } from 'astro';
import { listPublicArtes } from '../../../db/artLibraryRepository';
import { ART_PRODUCT_TYPES } from '../../../utils/artLibrary';

export const prerender = false;

export const GET: APIRoute = async ({ url }) => {
  const product = (url.searchParams.get('produto') ?? '').trim().toLowerCase();
  if (!ART_PRODUCT_TYPES.includes(product as (typeof ART_PRODUCT_TYPES)[number])) {
    return Response.json(
      { success: false, error: 'Informe um produto válido (caneca ou quadro).' },
      { status: 400, headers: { 'Cache-Control': 'no-store' } },
    );
  }

  const pageParam = Number(url.searchParams.get('pagina') ?? '1');
  const limitParam = Number(url.searchParams.get('limite') ?? '12');
  const page = Number.isInteger(pageParam) && pageParam >= 1 ? pageParam : 1;
  const limit = Number.isInteger(limitParam) && limitParam >= 1 ? Math.min(48, limitParam) : 12;

  try {
    const data = await listPublicArtes({
      productType: product,
      category: url.searchParams.get('categoria') ?? undefined,
      q: url.searchParams.get('q') ?? undefined,
      page,
      limit,
    });
    return Response.json(
      { success: true, data },
      { status: 200, headers: { 'Cache-Control': 'public, max-age=60' } },
    );
  } catch {
    return Response.json({ success: false, error: 'Falha ao consultar a biblioteca de artes.' }, { status: 500 });
  }
};

