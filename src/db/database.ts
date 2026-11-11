import { createClient, type Client, type InStatement } from '@libsql/client';
import fs from 'node:fs';
import path from 'node:path';
import { CATEGORIES, PRODUCTS } from '../data/mockCatalog';

let dbClientInstance: Client | null = null;
const initialization = new WeakMap<Client, Promise<void>>();

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

export function initDatabase(client: Client = getDbClient()): Promise<void> {
  let pending = initialization.get(client);
  if (!pending) {
    pending = createSchemaAndSeed(client).catch((error) => {
      initialization.delete(client);
      throw error;
    });
    initialization.set(client, pending);
  }
  return pending;
}

async function createSchemaAndSeed(client: Client): Promise<void> {
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

  await client.execute(`
    CREATE TABLE IF NOT EXISTS site_settings (
      id INTEGER PRIMARY KEY CHECK (id = 1),
      whatsapp TEXT NOT NULL,
      instagram TEXT NOT NULL,
      facebook TEXT NOT NULL,
      email TEXT NOT NULL
    )
  `);

  await seedInitialDataIfEmpty(client);
  await client.batch([
    `CREATE TABLE IF NOT EXISTS gallery_works (
      id TEXT PRIMARY KEY, title TEXT NOT NULL, description TEXT NOT NULL,
      category_slug TEXT NOT NULL REFERENCES categories(slug), work_date TEXT,
      instagram TEXT NOT NULL, published INTEGER NOT NULL, featured INTEGER NOT NULL,
      display_order INTEGER NOT NULL, created_at TEXT NOT NULL, updated_at TEXT NOT NULL, published_at TEXT,
      version INTEGER NOT NULL DEFAULT 1
    )`,
    `CREATE TABLE IF NOT EXISTS gallery_photos (
      id TEXT PRIMARY KEY, work_id TEXT NOT NULL REFERENCES gallery_works(id),
      position INTEGER NOT NULL, width INTEGER NOT NULL, height INTEGER NOT NULL,
      thumb_width INTEGER NOT NULL, thumb_height INTEGER NOT NULL,
      UNIQUE(work_id, position)
    )`,
    'CREATE INDEX IF NOT EXISTS gallery_public_order ON gallery_works (published, featured, display_order)',
    `CREATE TABLE IF NOT EXISTS agenda_quotes (
      id TEXT PRIMARY KEY, draft_token TEXT NOT NULL UNIQUE, product TEXT NOT NULL,
      created_at TEXT NOT NULL, status TEXT NOT NULL CHECK (status = 'requested'),
      config_version INTEGER NOT NULL, config_json TEXT NOT NULL
    )`,
    `CREATE TABLE IF NOT EXISTS agenda_quote_assets (
      quote_id TEXT NOT NULL REFERENCES agenda_quotes(id) ON DELETE CASCADE,
      name TEXT NOT NULL CHECK (name IN ('original', 'logo', 'preview-1', 'preview-2', 'preview-3')),
      mime TEXT NOT NULL, content BLOB NOT NULL, PRIMARY KEY (quote_id, name)
    )`,
    'CREATE INDEX IF NOT EXISTS agenda_quotes_created ON agenda_quotes (created_at DESC, id DESC)',
  ], 'write');
  await migrateStationery(client);

}

async function seedInitialDataIfEmpty(client: Client): Promise<void> {
  const catCountResult = await client.execute('SELECT COUNT(*) as count FROM categories');
  const count = Number(catCountResult.rows[0]?.count ?? 0);

  if (count > 0) return;

  const statements: InStatement[] = [];
  for (let index = 0; index < CATEGORIES.length; index++) {
    const category = CATEGORIES[index];
    statements.push({
      sql: `INSERT INTO categories (id, slug, title, subtitle, description, badge, display_order, is_active)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      args: [category.id, category.slug, category.title, category.subtitle, category.description, category.badge, index + 1, 1],
    });
  }

  for (let index = 0; index < PRODUCTS.length; index++) {
    const prod = PRODUCTS[index];
    statements.push({
      sql: `INSERT INTO products (id, category_slug, name, tagline, description, featured_badge, image_url, display_order, is_active, is_provisional)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      args: [prod.id, prod.categorySlug, prod.name, prod.tagline, prod.description, prod.featuredBadge ?? null, prod.imageUrl, prod.order, prod.isActive ? 1 : 0, prod.isProvisional ? 1 : 0],
    });
  }
  await client.batch(statements, 'write');
}


// Transactional and versioned: old rows and uploaded images remain recoverable.
export async function migrateStationery(client: Client): Promise<void> {
  await client.execute('CREATE TABLE IF NOT EXISTS schema_migrations (id TEXT PRIMARY KEY)');
  const tx = await client.transaction('write');
  try {
    const applied = await tx.execute("SELECT id FROM schema_migrations WHERE id = 'stationery-families-v2'");
    if (!applied.rows.length) {
      await tx.execute("UPDATE categories SET title = 'Papelaria Personalizada' WHERE slug = 'papelaria'");
      const families = [
        ['family-agendas', 'Agendas', 'Agenda Clássica: um dia por página, dois dias por página ou semanal. Estilos Clássico, Comercial e Feminino.', '%Agenda%', 1],
        ['family-planners', 'Planners', 'Planner Essencial em preparação: planejamento anual, mensal e semanal, metas, finanças, hábitos, revisão mensal e anotações. Estilos Clássico, Comercial e Feminino.', '%Planner%', 2],
        ['family-cadernos', 'Cadernos Personalizados', 'Em preparação: miolos pautado, pontilhado, quadriculado e branco. Estilos Clássico, Comercial e Feminino.', '%Caderno%', 3],
      ] as const;
      for (const [id, name, description, match, order] of families) {
        await tx.execute({
          sql: `INSERT OR IGNORE INTO products (id, category_slug, name, tagline, description, image_url, display_order, is_active, is_provisional)
            VALUES (?, 'papelaria', ?, ?, ?, COALESCE((SELECT image_url FROM products WHERE category_slug = 'papelaria' AND id NOT LIKE 'family-%' ORDER BY (name LIKE ?) DESC, is_provisional ASC, display_order LIMIT 1), '/images/demo/planner-executivo.jpg'), ?, 1, COALESCE((SELECT is_provisional FROM products WHERE category_slug = 'papelaria' AND id NOT LIKE 'family-%' ORDER BY (name LIKE ?) DESC, is_provisional ASC, display_order LIMIT 1), 1))`,
          args: [id, name, name, description, match, order, match],
        });
      }
      await tx.execute("UPDATE products SET is_active = 0 WHERE category_slug = 'papelaria' AND id NOT IN ('family-agendas', 'family-planners', 'family-cadernos')");
      await tx.execute(`CREATE TABLE agenda_quote_assets_v2 (
        quote_id TEXT NOT NULL REFERENCES agenda_quotes(id) ON DELETE CASCADE,
        name TEXT NOT NULL CHECK (name IN ('original', 'logo', 'preview-1', 'preview-2', 'preview-3', 'preview-4', 'preview-5', 'preview-6', 'preview-7', 'preview-8')),
        mime TEXT NOT NULL, content BLOB NOT NULL, PRIMARY KEY (quote_id, name))`);
      await tx.execute('INSERT INTO agenda_quote_assets_v2 SELECT * FROM agenda_quote_assets');
      await tx.execute('DROP TABLE agenda_quote_assets');
      await tx.execute('ALTER TABLE agenda_quote_assets_v2 RENAME TO agenda_quote_assets');
      await tx.execute("INSERT INTO schema_migrations VALUES ('stationery-families-v2')");
    }
    await tx.commit();
  } catch (error) { await tx.rollback(); throw error; }
  finally { tx.close(); }
}
