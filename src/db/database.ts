import { createClient, type Client } from '@libsql/client';
import fs from 'node:fs';
import path from 'node:path';
import { CATEGORIES, PRODUCTS } from '../data/mockCatalog';

let dbClientInstance: Client | null = null;

export function getDatabasePath(): string {
  const dataDir = path.resolve(process.cwd(), 'data');
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }
  return path.join(dataDir, 'studio678.db');
}

export function getDbClient(): Client {
  if (dbClientInstance) {
    return dbClientInstance;
  }
  const dbPath = getDatabasePath();
  dbClientInstance = createClient({
    url: `file:${dbPath.replace(/\\/g, '/')}`,
  });
  return dbClientInstance;
}

export async function initDatabase(client: Client = getDbClient()): Promise<void> {
  await client.execute(`
    CREATE TABLE IF NOT EXISTS categories (
      id TEXT PRIMARY KEY,
      slug TEXT UNIQUE NOT NULL,
      title TEXT NOT NULL,
      subtitle TEXT NOT NULL,
      description TEXT NOT NULL,
      badge TEXT NOT NULL,
      display_order INTEGER NOT NULL,
      is_active INTEGER NOT NULL DEFAULT 1
    )
  `);

  await client.execute(`
    CREATE TABLE IF NOT EXISTS products (
      id TEXT PRIMARY KEY,
      category_slug TEXT NOT NULL,
      name TEXT NOT NULL,
      tagline TEXT NOT NULL,
      description TEXT NOT NULL,
      featured_badge TEXT,
      image_url TEXT NOT NULL,
      display_order INTEGER NOT NULL,
      is_active INTEGER NOT NULL DEFAULT 1,
      is_provisional INTEGER NOT NULL DEFAULT 1
    )
  `);

  await seedInitialDataIfEmpty(client);
}

async function seedInitialDataIfEmpty(client: Client): Promise<void> {
  const catCountResult = await client.execute('SELECT COUNT(*) as count FROM categories');
  const count = Number(catCountResult.rows[0]?.count ?? 0);

  if (count > 0) return;

  for (let index = 0; index < CATEGORIES.length; index++) {
    const category = CATEGORIES[index];
    await client.execute({
      sql: `INSERT INTO categories (id, slug, title, subtitle, description, badge, display_order, is_active)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      args: [category.id, category.slug, category.title, category.subtitle, category.description, category.badge, index + 1, 1],
    });
  }

  for (let index = 0; index < PRODUCTS.length; index++) {
    const prod = PRODUCTS[index];
    await client.execute({
      sql: `INSERT INTO products (id, category_slug, name, tagline, description, featured_badge, image_url, display_order, is_active, is_provisional)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      args: [prod.id, prod.categorySlug, prod.name, prod.tagline, prod.description, prod.featuredBadge ?? null, prod.imageUrl, prod.order, prod.isActive ? 1 : 0, prod.isProvisional ? 1 : 0],
    });
  }
}

