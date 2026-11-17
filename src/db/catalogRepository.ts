import type { Client } from '@libsql/client';
import { getDbClient, initDatabase } from './database';
import type { Product, ProductCategory, CategorySlug } from '../types/catalog';

function mapRowToCategory(row: Record<string, unknown>): ProductCategory & { displayOrder: number; isActive: boolean } {
  return {
    id: String(row.id),
    slug: String(row.slug) as CategorySlug,
    title: String(row.title),
    subtitle: String(row.subtitle),
    description: String(row.description),
    badge: String(row.badge),
    displayOrder: Number(row.display_order),
    isActive: Boolean(row.is_active),
  };
}

function mapRowToProduct(row: Record<string, unknown>): Product {
  return {
    id: String(row.id),
    categorySlug: String(row.category_slug) as CategorySlug,
    name: String(row.name),
    tagline: String(row.tagline),
    description: String(row.description),
    featuredBadge: row.featured_badge ? String(row.featured_badge) : undefined,
    imageUrl: String(row.image_url),
    order: Number(row.display_order),
    isActive: Boolean(row.is_active),
    isProvisional: Boolean(row.is_provisional),
    isFeatured: Boolean(row.is_featured),
    linkedArteId: row.linked_arte_id ? String(row.linked_arte_id) : undefined,
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

export async function getAllCategories(client: Client = getDbClient()) {
  await initDatabase(client);
  const result = await client.execute({
    sql: 'SELECT * FROM categories ORDER BY display_order ASC',
    args: [],
  });
  return result.rows.map(mapRowToCategory);
}

export async function getActiveProductsByCategory(categorySlug: string, client: Client = getDbClient()): Promise<Product[]> {
  await initDatabase(client);
  const result = await client.execute({
    sql: 'SELECT * FROM products WHERE category_slug = ? AND is_active = 1 ORDER BY display_order ASC',
    args: [categorySlug],
  });
  return result.rows.map(mapRowToProduct);
}

export async function getAllProducts(client: Client = getDbClient()): Promise<Product[]> {
  await initDatabase(client);
  const result = await client.execute({
    sql: 'SELECT * FROM products ORDER BY category_slug ASC, display_order ASC',
    args: [],
  });
  return result.rows.map(mapRowToProduct);
}

export async function getProductById(id: string, client: Client = getDbClient()): Promise<Product | null> {
  await initDatabase(client);
  const result = await client.execute({
    sql: 'SELECT * FROM products WHERE id = ?',
    args: [id],
  });
  if (result.rows.length === 0) return null;
  return mapRowToProduct(result.rows[0]);
}

export async function getHomeFeaturedProducts(
  categorySlug: string,
  limit = 4,
  client: Client = getDbClient(),
): Promise<Product[]> {
  await initDatabase(client);
  const featuredRes = await client.execute({
    sql: 'SELECT * FROM products WHERE category_slug = ? AND is_active = 1 AND is_featured = 1 ORDER BY display_order ASC LIMIT ?',
    args: [categorySlug, limit],
  });
  if (featuredRes.rows.length > 0) {
    return featuredRes.rows.map(mapRowToProduct);
  }
  const fallbackRes = await client.execute({
    sql: 'SELECT * FROM products WHERE category_slug = ? AND is_active = 1 ORDER BY display_order ASC LIMIT ?',
    args: [categorySlug, limit],
  });
  return fallbackRes.rows.map(mapRowToProduct);
}

/** Valida se a arte existe, está ativa/publicada e é compatível com a categoria do produto. */
export async function resolveValidLinkedArteId(
  arteId: string | undefined,
  categorySlug: string,
  client: Client = getDbClient(),
): Promise<string | undefined> {
  const clean = (arteId ?? '').trim();
  if (!clean) return undefined;
  const productType = categorySlug === 'canecas' ? 'caneca' : categorySlug === 'quadros' ? 'quadro' : null;
  if (!productType) return undefined;

  await initDatabase(client);
  const res = await client.execute({
    sql: `SELECT a.id FROM artes a
          INNER JOIN arte_produtos p ON p.arte_id = a.id
          WHERE a.id = ? AND a.is_active = 1 AND a.is_published = 1 AND p.product_type = ?
          LIMIT 1`,
    args: [clean, productType],
  });
  return res.rows.length > 0 ? String(res.rows[0].id) : undefined;
}

export async function createProduct(product: Product, client: Client = getDbClient()): Promise<void> {
  await initDatabase(client);
  await client.execute({
    sql: `INSERT INTO products (id, category_slug, name, tagline, description, featured_badge, image_url, display_order, is_active, is_provisional, is_featured, linked_arte_id)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    args: [
      product.id,
      product.categorySlug,
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
    ],
  });
}

export async function updateProduct(product: Product, client: Client = getDbClient()): Promise<void> {
  await initDatabase(client);
  await client.execute({
    sql: `UPDATE products 
          SET category_slug = ?, name = ?, tagline = ?, description = ?, featured_badge = ?, image_url = ?, display_order = ?, is_active = ?, is_featured = ?, linked_arte_id = ?
          WHERE id = ?`,
    args: [
      product.categorySlug,
      product.name,
      product.tagline,
      product.description,
      product.featuredBadge ?? null,
      product.imageUrl,
      product.order,
      product.isActive ? 1 : 0,
      product.isFeatured ? 1 : 0,
      product.linkedArteId ?? null,
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

export async function replaceProductImage(product: Product, imageUrl: string, client: Client = getDbClient()): Promise<boolean> {
  await initDatabase(client);
  const result = await client.execute({
    sql: 'UPDATE products SET image_url = ? WHERE id = ? AND category_slug = ? AND image_url = ?',
    args: [imageUrl, product.id, product.categorySlug, product.imageUrl],
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

