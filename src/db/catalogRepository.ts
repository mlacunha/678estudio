import type { Client } from '@libsql/client';
import { getDbClient, initDatabase } from './database';
import {
  getCollectionDestinationSlug,
  isValidInternalDestination,
  resolveArteProductType,
  type CategoryDestinationType,
  type CategoryLayoutType,
  type ProductActionType,
} from '../data/internalDestinations';
import type {
  AdminCategorySummary,
  AdminProductFilters,
  CategorySlug,
  CategorySlugAlias,
  PaginatedProducts,
  Product,
  ProductCategory,
} from '../types/catalog';

export const CATEGORY_SLUG_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
export const RESERVED_CATEGORY_SLUGS = new Set([
  'admin',
  'api',
  'personalizar',
  'trabalhos',
  'colecoes',
  'uploads',
  'images',
]);

export function validateCategorySlugFormat(slug: string): string {
  const normalized = slug.trim().toLowerCase();
  if (!normalized || normalized.length > 64 || !CATEGORY_SLUG_PATTERN.test(normalized)) {
    throw new Error('O slug deve conter apenas letras minúsculas, números e hífens (ex: brindes-corporativos).');
  }
  if (RESERVED_CATEGORY_SLUGS.has(normalized)) {
    throw new Error(`O slug "${normalized}" é reservado pelo sistema.`);
  }
  return normalized;
}

const PRODUCT_SELECT = `
  SELECT
    p.*,
    c.slug AS category_slug,
    c.title AS category_title
  FROM products p
  INNER JOIN categories c ON c.id = p.category_id
`;

function mapRowToCategory(
  row: Record<string, unknown>,
): ProductCategory & { displayOrder: number; isActive: boolean; showOnHome: boolean } {
  return {
    id: String(row.id),
    slug: String(row.slug) as CategorySlug,
    title: String(row.title),
    subtitle: String(row.subtitle ?? ''),
    description: String(row.description ?? ''),
    badge: String(row.badge ?? ''),
    coverImageUrl: row.cover_image_url ? String(row.cover_image_url) : undefined,
    displayOrder: Number(row.display_order ?? 0),
    isActive: Boolean(row.is_active),
    showOnHome: row.show_on_home !== undefined ? Boolean(row.show_on_home) : true,
    layoutType: (row.layout_type ? String(row.layout_type) : 'carousel') as CategoryLayoutType,
    destinationType: (row.destination_type ? String(row.destination_type) : 'collection') as CategoryDestinationType,
    destinationHref: row.destination_href ? String(row.destination_href) : undefined,
    defaultProductAction: (row.default_product_action ? String(row.default_product_action) : 'quote') as ProductActionType,
    defaultProductHref: row.default_product_href ? String(row.default_product_href) : undefined,
  };
}

function mapRowToProduct(row: Record<string, unknown>): Product {
  return {
    id: String(row.id),
    categoryId: String(row.category_id),
    categorySlug: String(row.category_slug) as CategorySlug,
    categoryTitle: row.category_title ? String(row.category_title) : undefined,
    name: String(row.name),
    tagline: String(row.tagline ?? ''),
    description: String(row.description ?? ''),
    featuredBadge: row.featured_badge ? String(row.featured_badge) : undefined,
    imageUrl: String(row.image_url),
    order: Number(row.display_order),
    isActive: Boolean(row.is_active),
    isProvisional: Boolean(row.is_provisional),
    isFeatured: Boolean(row.is_featured),
    linkedArteId: row.linked_arte_id ? String(row.linked_arte_id) : undefined,
    actionType: row.action_type ? (String(row.action_type) as ProductActionType) : undefined,
    actionHref: row.action_href ? String(row.action_href) : undefined,
    ctaLabel: row.cta_label ? String(row.cta_label) : undefined,
  };
}

export async function getActiveCategories(client: Client = getDbClient()) {
  await initDatabase(client);
  const result = await client.execute({
    sql: 'SELECT * FROM categories WHERE is_active = 1 ORDER BY display_order ASC',
    args: [],
  });
  return result.rows.map(mapRowToCategory);
}

export async function getHomeCategories(client: Client = getDbClient()) {
  await initDatabase(client);
  const result = await client.execute({
    sql: 'SELECT * FROM categories WHERE is_active = 1 AND show_on_home = 1 ORDER BY display_order ASC',
    args: [],
  });
  return result.rows.map(mapRowToCategory);
}

export async function getAllCategories(client: Client = getDbClient()) {
  await initDatabase(client);
  const result = await client.execute({
    sql: 'SELECT * FROM categories ORDER BY display_order ASC',
    args: [],
  });
  return result.rows.map(mapRowToCategory);
}

export async function getCategoryById(id: string, client: Client = getDbClient()) {
  await initDatabase(client);
  const result = await client.execute({
    sql: 'SELECT * FROM categories WHERE id = ?',
    args: [id],
  });
  return result.rows.length > 0 ? mapRowToCategory(result.rows[0]) : null;
}

export async function getCategoryBySlug(slug: string, client: Client = getDbClient()) {
  await initDatabase(client);
  const result = await client.execute({
    sql: 'SELECT * FROM categories WHERE slug = ?',
    args: [slug],
  });
  return result.rows.length > 0 ? mapRowToCategory(result.rows[0]) : null;
}

export async function isPublishedInternalDestination(href: string, client?: Client): Promise<boolean> {
  const slug = getCollectionDestinationSlug(href);
  if (!slug) return isValidInternalDestination(href);
  const resolved = await resolveCategoryBySlugOrAlias(slug, client);
  return resolved?.category.isActive === true;
}

const requestDestinations = new WeakMap<App.Locals, Map<string, Promise<boolean>>>();

export function getRequestInternalDestinationAvailability(locals: App.Locals, href: string): Promise<boolean> {
  const slug = getCollectionDestinationSlug(href);
  if (!slug) return Promise.resolve(isValidInternalDestination(href));
  let destinations = requestDestinations.get(locals);
  if (!destinations) {
    destinations = new Map();
    requestDestinations.set(locals, destinations);
  }
  const cached = destinations.get(slug);
  if (cached) return cached;
  const availability = isPublishedInternalDestination(href);
  destinations.set(slug, availability);
  return availability;
}

export async function resolveCategoryBySlugOrAlias(
  slug: string,
  client: Client = getDbClient(),
): Promise<{
  category: ProductCategory & { displayOrder: number; isActive: boolean; showOnHome: boolean };
  isAlias: boolean;
  canonicalSlug: string;
} | null> {
  await initDatabase(client);
  const clean = slug.trim().toLowerCase();
  if (!clean) return null;

  const direct = await getCategoryBySlug(clean, client);
  if (direct) {
    return { category: direct, isAlias: false, canonicalSlug: direct.slug };
  }

  const aliasRes = await client.execute({
    sql: `SELECT c.* FROM category_slug_aliases a
          INNER JOIN categories c ON c.id = a.category_id
          WHERE a.slug = ? LIMIT 1`,
    args: [clean],
  });
  if (aliasRes.rows.length === 0) return null;
  const cat = mapRowToCategory(aliasRes.rows[0]);
  return { category: cat, isAlias: true, canonicalSlug: cat.slug };
}

export async function listCategorySlugAliases(
  categoryId?: string,
  client: Client = getDbClient(),
): Promise<CategorySlugAlias[]> {
  await initDatabase(client);
  const res = categoryId
    ? await client.execute({
        sql: 'SELECT slug, category_id, created_at FROM category_slug_aliases WHERE category_id = ? ORDER BY created_at DESC',
        args: [categoryId],
      })
    : await client.execute('SELECT slug, category_id, created_at FROM category_slug_aliases ORDER BY created_at DESC');
  return res.rows.map(r => ({
    slug: String(r.slug),
    categoryId: String(r.category_id),
    createdAt: String(r.created_at),
  }));
}

export async function listAdminCategoriesWithCounts(
  client: Client = getDbClient(),
): Promise<AdminCategorySummary[]> {
  await initDatabase(client);
  const [cats, prodRows, workRows, aliasRows] = await Promise.all([
    getAllCategories(client),
    client.execute('SELECT category_id, COUNT(*) AS cnt FROM products GROUP BY category_id'),
    client.execute('SELECT category_id, COUNT(*) AS cnt FROM gallery_works GROUP BY category_id'),
    listCategorySlugAliases(undefined, client),
  ]);
  const prodByCat = new Map(prodRows.rows.map(r => [String(r.category_id), Number(r.cnt)]));
  const workByCat = new Map(workRows.rows.map(r => [String(r.category_id), Number(r.cnt)]));
  const aliasesByCat = new Map<string, string[]>();
  for (const al of aliasRows) {
    const list = aliasesByCat.get(al.categoryId) ?? [];
    list.push(al.slug);
    aliasesByCat.set(al.categoryId, list);
  }
  return cats.map(c => ({
    ...c,
    productCount: prodByCat.get(c.id) ?? 0,
    workCount: workByCat.get(c.id) ?? 0,
    aliases: aliasesByCat.get(c.id) ?? [],
  }));
}

export async function createCategory(category: ProductCategory, client: Client = getDbClient()): Promise<void> {
  await initDatabase(client);
  const normalizedSlug = validateCategorySlugFormat(category.slug);

  const [existingSlug, existingAlias] = await Promise.all([
    client.execute({ sql: 'SELECT id FROM categories WHERE slug = ?', args: [normalizedSlug] }),
    client.execute({ sql: 'SELECT category_id FROM category_slug_aliases WHERE slug = ?', args: [normalizedSlug] }),
  ]);
  if (existingSlug.rows.length > 0 || existingAlias.rows.length > 0) {
    throw new Error('Este slug já está em uso ou pertence ao histórico de uma categoria.');
  }

  const destType = category.destinationType ?? 'collection';
  const destHref =
    destType === 'collection'
      ? `/colecoes/${normalizedSlug}`
      : (category.destinationHref || `/colecoes/${normalizedSlug}`);

  await client.execute({
    sql: `INSERT INTO categories (
            id, slug, title, subtitle, description, badge, cover_image_url,
            display_order, is_active, show_on_home, layout_type,
            destination_type, destination_href, default_product_action, default_product_href
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    args: [
      category.id,
      normalizedSlug,
      category.title,
      category.subtitle ?? '',
      category.description ?? '',
      category.badge ?? '',
      category.coverImageUrl ?? null,
      category.displayOrder ?? 0,
      category.isActive !== false ? 1 : 0,
      category.showOnHome !== false ? 1 : 0,
      category.layoutType ?? 'carousel',
      destType,
      destHref,
      category.defaultProductAction ?? 'quote',
      category.defaultProductHref ?? null,
    ],
  });
}

export async function updateCategory(category: ProductCategory, client: Client = getDbClient()): Promise<void> {
  await initDatabase(client);
  const normalizedSlug = validateCategorySlugFormat(category.slug);

  const tx = await client.transaction('write');
  try {
    const currentRes = await tx.execute({ sql: 'SELECT * FROM categories WHERE id = ?', args: [category.id] });
    if (currentRes.rows.length === 0) {
      throw new Error('Categoria não encontrada.');
    }
    const current = mapRowToCategory(currentRes.rows[0]);

    if (normalizedSlug !== current.slug) {
      const [conflictCat, conflictAlias] = await Promise.all([
        tx.execute({
          sql: 'SELECT id FROM categories WHERE slug = ? AND id != ?',
          args: [normalizedSlug, category.id],
        }),
        tx.execute({
          sql: 'SELECT category_id FROM category_slug_aliases WHERE slug = ? AND category_id != ?',
          args: [normalizedSlug, category.id],
        }),
      ]);
      if (conflictCat.rows.length > 0 || conflictAlias.rows.length > 0) {
        throw new Error('Este slug já está em uso ou pertence ao histórico de outra categoria.');
      }

      await tx.execute({
        sql: 'DELETE FROM category_slug_aliases WHERE slug = ? AND category_id = ?',
        args: [normalizedSlug, category.id],
      });
      await tx.execute({
        sql: 'INSERT OR REPLACE INTO category_slug_aliases (slug, category_id, created_at) VALUES (?, ?, ?)',
        args: [current.slug, category.id, new Date().toISOString()],
      });
    }

    const destType = category.destinationType ?? 'collection';
    let destHref = category.destinationHref;
    if (destType === 'collection') {
      destHref =
        normalizedSlug === 'canecas'
          ? '/canecas'
          : normalizedSlug === 'quadros'
            ? '/quadros'
            : `/colecoes/${normalizedSlug}`;
    } else if (!destHref) {
      destHref = `/colecoes/${normalizedSlug}`;
    }

    await tx.execute({
      sql: `UPDATE categories
            SET slug = ?, title = ?, subtitle = ?, description = ?, badge = ?, cover_image_url = ?,
                display_order = ?, is_active = ?, show_on_home = ?, layout_type = ?,
                destination_type = ?, destination_href = ?, default_product_action = ?, default_product_href = ?
            WHERE id = ?`,
      args: [
        normalizedSlug,
        category.title,
        category.subtitle ?? '',
        category.description ?? '',
        category.badge ?? '',
        category.coverImageUrl ?? null,
        category.displayOrder ?? 0,
        category.isActive !== false ? 1 : 0,
        category.showOnHome !== false ? 1 : 0,
        category.layoutType ?? 'carousel',
        destType,
        destHref,
        category.defaultProductAction ?? 'quote',
        category.defaultProductHref ?? null,
        category.id,
      ],
    });

    await tx.commit();
  } catch (error) {
    await tx.rollback();
    throw error;
  } finally {
    tx.close();
  }
}

export async function toggleCategoryActive(id: string, isActive: boolean, client: Client = getDbClient()): Promise<void> {
  await initDatabase(client);
  await client.execute({
    sql: 'UPDATE categories SET is_active = ? WHERE id = ?',
    args: [isActive ? 1 : 0, id],
  });
}

export async function toggleCategoryShowOnHome(
  id: string,
  showOnHome: boolean,
  client: Client = getDbClient(),
): Promise<void> {
  await initDatabase(client);
  await client.execute({
    sql: 'UPDATE categories SET show_on_home = ? WHERE id = ?',
    args: [showOnHome ? 1 : 0, id],
  });
}

export async function deleteCategory(id: string, client: Client = getDbClient()): Promise<void> {
  await initDatabase(client);
  const [prodCountRes, workCountRes] = await Promise.all([
    client.execute({ sql: 'SELECT COUNT(*) AS cnt FROM products WHERE category_id = ?', args: [id] }),
    client.execute({ sql: 'SELECT COUNT(*) AS cnt FROM gallery_works WHERE category_id = ?', args: [id] }),
  ]);
  const prodCount = Number(prodCountRes.rows[0]?.cnt ?? 0);
  const workCount = Number(workCountRes.rows[0]?.cnt ?? 0);
  if (prodCount > 0 || workCount > 0) {
    throw new Error(
      `Não é possível excluir a categoria: existem ${prodCount} produto(s) e ${workCount} trabalho(s) vinculados.`,
    );
  }
  await client.execute({ sql: 'DELETE FROM categories WHERE id = ?', args: [id] });
}

export async function getActiveProductsByCategory(
  categorySlugOrId: string,
  client: Client = getDbClient(),
): Promise<Product[]> {
  await initDatabase(client);
  const result = await client.execute({
    sql: `${PRODUCT_SELECT}
          WHERE (c.slug = ? OR p.category_id = ?) AND p.is_active = 1
          ORDER BY p.display_order ASC, p.name ASC`,
    args: [categorySlugOrId, categorySlugOrId],
  });
  return result.rows.map(mapRowToProduct);
}

export async function getAllProducts(client: Client = getDbClient()): Promise<Product[]> {
  await initDatabase(client);
  const result = await client.execute({
    sql: `${PRODUCT_SELECT} ORDER BY c.slug ASC, p.display_order ASC`,
    args: [],
  });
  return result.rows.map(mapRowToProduct);
}

export async function getProductById(id: string, client: Client = getDbClient()): Promise<Product | null> {
  await initDatabase(client);
  const result = await client.execute({
    sql: `${PRODUCT_SELECT} WHERE p.id = ?`,
    args: [id],
  });
  return result.rows.length > 0 ? mapRowToProduct(result.rows[0]) : null;
}

export async function getHomeFeaturedProducts(
  categorySlugOrId: string,
  limit = 4,
  client: Client = getDbClient(),
): Promise<Product[]> {
  await initDatabase(client);
  const featuredRes = await client.execute({
    sql: `${PRODUCT_SELECT}
          WHERE (c.slug = ? OR p.category_id = ?) AND p.is_active = 1 AND p.is_featured = 1
          ORDER BY p.display_order ASC LIMIT ?`,
    args: [categorySlugOrId, categorySlugOrId, limit],
  });
  if (featuredRes.rows.length > 0) {
    return featuredRes.rows.map(mapRowToProduct);
  }
  const fallbackRes = await client.execute({
    sql: `${PRODUCT_SELECT}
          WHERE (c.slug = ? OR p.category_id = ?) AND p.is_active = 1
          ORDER BY p.display_order ASC LIMIT ?`,
    args: [categorySlugOrId, categorySlugOrId, limit],
  });
  return fallbackRes.rows.map(mapRowToProduct);
}

function buildAdminProductWhere(filters: AdminProductFilters): { whereSql: string; args: Array<string | number> } {
  const clauses: string[] = [];
  const args: Array<string | number> = [];

  if (filters.categoryId?.trim()) {
    clauses.push('(p.category_id = ? OR c.slug = ?)');
    args.push(filters.categoryId.trim(), filters.categoryId.trim());
  } else if (filters.categorySlug?.trim()) {
    clauses.push('(c.slug = ? OR p.category_id = ?)');
    args.push(filters.categorySlug.trim(), filters.categorySlug.trim());
  }
  if (filters.status === 'active') clauses.push('p.is_active = 1');
  else if (filters.status === 'inactive') clauses.push('p.is_active = 0');

  if (filters.featured === 'featured') clauses.push('p.is_featured = 1');
  else if (filters.featured === 'regular') clauses.push('p.is_featured = 0');

  if (filters.q?.trim()) {
    const pattern = `%${filters.q.trim()}%`;
    clauses.push('(p.name LIKE ? OR p.tagline LIKE ? OR p.description LIKE ? OR p.featured_badge LIKE ?)');
    args.push(pattern, pattern, pattern, pattern);
  }
  return { whereSql: clauses.length > 0 ? `WHERE ${clauses.join(' AND ')}` : '', args };
}

export async function listAdminProductsPaginated(
  filters: AdminProductFilters = {},
  client: Client = getDbClient(),
): Promise<PaginatedProducts> {
  await initDatabase(client);
  const pageSize = Math.min(Math.max(Number(filters.pageSize) || 10, 1), 100);
  const requestedPage = Math.max(Number(filters.page) || 1, 1);
  const { whereSql, args } = buildAdminProductWhere(filters);

  const countRes = await client.execute({
    sql: `SELECT COUNT(*) AS cnt FROM products p INNER JOIN categories c ON c.id = p.category_id ${whereSql}`,
    args,
  });
  const total = Number(countRes.rows[0]?.cnt ?? 0);
  const totalPages = Math.max(Math.ceil(total / pageSize), 1);
  const page = Math.min(requestedPage, totalPages);
  const offset = (page - 1) * pageSize;

  const itemsRes = await client.execute({
    sql: `${PRODUCT_SELECT} ${whereSql} ORDER BY c.display_order ASC, p.display_order ASC, p.name ASC LIMIT ? OFFSET ?`,
    args: [...args, pageSize, offset],
  });
  return {
    items: itemsRes.rows.map(mapRowToProduct),
    total,
    page,
    pageSize,
    totalPages,
  };
}

/** Valida se a arte existe, está ativa/publicada e é compatível com a categoria ou destino do produto. */
export async function resolveValidLinkedArteId(
  arteId: string | undefined,
  categorySlugOrId: string,
  client: Client = getDbClient(),
  actionHref?: string,
): Promise<string | undefined> {
  const clean = (arteId ?? '').trim();
  if (!clean) return undefined;

  await initDatabase(client);
  let effectiveHref = actionHref;
  let effectiveSlug = categorySlugOrId;
  const catRes = await client.execute({
    sql: 'SELECT slug, default_product_href FROM categories WHERE id = ? OR slug = ? LIMIT 1',
    args: [categorySlugOrId, categorySlugOrId],
  });
  if (catRes.rows.length > 0) {
    effectiveSlug = String(catRes.rows[0].slug);
    if (!effectiveHref && catRes.rows[0].default_product_href) {
      effectiveHref = String(catRes.rows[0].default_product_href);
    }
  }
  const productType = resolveArteProductType(effectiveHref, effectiveSlug);
  if (!productType) return undefined;

  const res = await client.execute({
    sql: `SELECT a.id FROM artes a
          INNER JOIN arte_produtos p ON p.arte_id = a.id
          WHERE a.id = ? AND a.is_active = 1 AND a.is_published = 1 AND p.product_type = ?
          LIMIT 1`,
    args: [clean, productType],
  });
  return res.rows.length > 0 ? String(res.rows[0].id) : undefined;
}

async function resolveCategoryIdForProduct(product: Product, client: Client): Promise<string> {
  const key = (product.categoryId || product.categorySlug || '').trim();
  const res = await client.execute({
    sql: 'SELECT id FROM categories WHERE id = ? OR slug = ? LIMIT 1',
    args: [key, key],
  });
  if (res.rows.length === 0) {
    throw new Error(`Categoria inválida ou inexistente: ${key}`);
  }
  return String(res.rows[0].id);
}

export async function createProduct(product: Product, client: Client = getDbClient()): Promise<void> {
  await initDatabase(client);
  const categoryId = await resolveCategoryIdForProduct(product, client);
  await client.execute({
    sql: `INSERT INTO products (
            id, category_id, name, tagline, description, featured_badge, image_url,
            display_order, is_active, is_provisional, is_featured, linked_arte_id,
            action_type, action_href, cta_label
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    args: [
      product.id,
      categoryId,
      product.name,
      product.tagline,
      product.description,
      product.featuredBadge ?? null,
      product.imageUrl,
      product.order,
      product.isActive ? 1 : 0,
      product.isProvisional ? 1 : 0,
      product.isFeatured ? 1 : 0,
      product.linkedArteId ?? null,
      product.actionType ?? null,
      product.actionHref ?? null,
      product.ctaLabel ?? null,
    ],
  });
}

export async function updateProduct(product: Product, client: Client = getDbClient()): Promise<void> {
  await initDatabase(client);
  const categoryId = await resolveCategoryIdForProduct(product, client);
  await client.execute({
    sql: `UPDATE products
          SET category_id = ?, name = ?, tagline = ?, description = ?, featured_badge = ?,
              image_url = ?, display_order = ?, is_active = ?, is_featured = ?, linked_arte_id = ?,
              action_type = ?, action_href = ?, cta_label = ?
          WHERE id = ?`,
    args: [
      categoryId,
      product.name,
      product.tagline,
      product.description,
      product.featuredBadge ?? null,
      product.imageUrl,
      product.order,
      product.isActive ? 1 : 0,
      product.isFeatured ? 1 : 0,
      product.linkedArteId ?? null,
      product.actionType ?? null,
      product.actionHref ?? null,
      product.ctaLabel ?? null,
      product.id,
    ],
  });
}

export async function toggleProductActive(id: string, isActive: boolean, client: Client = getDbClient()): Promise<void> {
  await initDatabase(client);
  await client.execute({
    sql: 'UPDATE products SET is_active = ? WHERE id = ?',
    args: [isActive ? 1 : 0, id],
  });
}

export async function toggleProductFeatured(
  id: string,
  isFeatured: boolean,
  client: Client = getDbClient(),
): Promise<void> {
  await initDatabase(client);
  await client.execute({
    sql: 'UPDATE products SET is_featured = ? WHERE id = ?',
    args: [isFeatured ? 1 : 0, id],
  });
}

export async function replaceProductImage(product: Product, imageUrl: string, client: Client = getDbClient()): Promise<boolean> {
  await initDatabase(client);
  const categoryId = await resolveCategoryIdForProduct(product, client);
  const result = await client.execute({
    sql: 'UPDATE products SET image_url = ? WHERE id = ? AND category_id = ? AND image_url = ?',
    args: [imageUrl, product.id, categoryId, product.imageUrl],
  });
  return result.rowsAffected === 1;
}

export async function deleteProduct(id: string, client: Client = getDbClient()): Promise<void> {
  await initDatabase(client);
  await client.execute({
    sql: 'DELETE FROM products WHERE id = ?',
    args: [id],
  });
}
