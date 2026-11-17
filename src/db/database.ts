import { createClient, type Client, type InStatement } from '@libsql/client';
import fs from 'node:fs';
import path from 'node:path';
import { CATEGORIES, PRODUCTS } from '../data/mockCatalog';

let dbClientInstance: Client | null = null;
const initialization = new WeakMap<Client, Promise<void>>();

export function getDatabasePath(): string {
  if (process.env.STUDIO_DB_PATH?.trim()) {
    return path.resolve(process.env.STUDIO_DB_PATH.trim());
  }
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
      name TEXT NOT NULL,
      mime TEXT NOT NULL, content BLOB NOT NULL, PRIMARY KEY (quote_id, name)
    )`,
    'CREATE INDEX IF NOT EXISTS agenda_quotes_created ON agenda_quotes (created_at DESC, id DESC)',
    `CREATE TABLE IF NOT EXISTS planner_quotes (
      id TEXT PRIMARY KEY, draft_token TEXT NOT NULL UNIQUE, product TEXT NOT NULL,
      created_at TEXT NOT NULL, status TEXT NOT NULL,
      config_version INTEGER NOT NULL, config_json TEXT NOT NULL
    )`,
    `CREATE TABLE IF NOT EXISTS planner_quote_assets (
      quote_id TEXT NOT NULL REFERENCES planner_quotes(id) ON DELETE CASCADE,
      name TEXT NOT NULL,
      mime TEXT NOT NULL, content BLOB NOT NULL, PRIMARY KEY (quote_id, name)
    )`,
    'CREATE INDEX IF NOT EXISTS planner_quotes_created ON planner_quotes (created_at DESC, id DESC)',
    `CREATE TABLE IF NOT EXISTS notebook_quotes (
      id TEXT PRIMARY KEY, draft_token TEXT NOT NULL UNIQUE, product TEXT NOT NULL,
      created_at TEXT NOT NULL, status TEXT NOT NULL,
      config_version INTEGER NOT NULL, config_json TEXT NOT NULL
    )`,
    `CREATE TABLE IF NOT EXISTS notebook_quote_assets (
      quote_id TEXT NOT NULL REFERENCES notebook_quotes(id) ON DELETE CASCADE,
      name TEXT NOT NULL,
      mime TEXT NOT NULL, content BLOB NOT NULL, PRIMARY KEY (quote_id, name)
    )`,
    'CREATE INDEX IF NOT EXISTS notebook_quotes_created ON notebook_quotes (created_at DESC, id DESC)',
    `CREATE TABLE IF NOT EXISTS calendar_quotes (
      id TEXT PRIMARY KEY, product TEXT NOT NULL,
      created_at TEXT NOT NULL, status TEXT NOT NULL CHECK (status = 'requested'),
      config_version INTEGER NOT NULL, config_json TEXT NOT NULL
    )`,
    `CREATE TABLE IF NOT EXISTS calendar_quote_assets (
      quote_id TEXT NOT NULL REFERENCES calendar_quotes(id) ON DELETE CASCADE,
      name TEXT NOT NULL,
      mime TEXT NOT NULL, content BLOB NOT NULL, PRIMARY KEY (quote_id, name)
    )`,
    'CREATE INDEX IF NOT EXISTS calendar_quotes_created ON calendar_quotes (created_at DESC, id DESC)',
    'CREATE INDEX IF NOT EXISTS notebook_quotes_created ON notebook_quotes (created_at DESC, id DESC)',
  ], 'write');
  await migrateStationery(client);
  await migrateArtLibrary(client);
  await migrateCatalogShowcase(client);
  await migrateDynamicCatalog(client);
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
      const prodColsRes = await tx.execute("PRAGMA table_info('products')");
      const prodCols = new Set(prodColsRes.rows.map(r => String(r.name)));
      const useCategoryId = prodCols.has('category_id') && !prodCols.has('category_slug');
      const families = [
        ['family-agendas', 'Agendas', 'Agenda Clássica: um dia por página, dois dias por página ou semanal. Estilos Clássico, Comercial e Feminino.', '%Agenda%', 1],
        ['family-planners', 'Planners', 'Planner Essencial em preparação: planejamento anual, mensal e semanal, metas, finanças, hábitos, revisão mensal e anotações. Estilos Clássico, Comercial e Feminino.', '%Planner%', 2],
        ['family-cadernos', 'Cadernos Personalizados', 'Em preparação: miolos pautado, pontilhado, quadriculado e branco. Estilos Clássico, Comercial e Feminino.', '%Caderno%', 3],
      ] as const;
      for (const [id, name, description, match, order] of families) {
        if (useCategoryId) {
          await tx.execute({
            sql: `INSERT OR IGNORE INTO products (id, category_id, name, tagline, description, image_url, display_order, is_active, is_provisional)
              VALUES (?, (SELECT id FROM categories WHERE slug = 'papelaria'), ?, ?, ?, COALESCE((SELECT image_url FROM products WHERE category_id = (SELECT id FROM categories WHERE slug = 'papelaria') AND id NOT LIKE 'family-%' ORDER BY (name LIKE ?) DESC, is_provisional ASC, display_order LIMIT 1), '/images/demo/planner-executivo.jpg'), ?, 1, COALESCE((SELECT is_provisional FROM products WHERE category_id = (SELECT id FROM categories WHERE slug = 'papelaria') AND id NOT LIKE 'family-%' ORDER BY (name LIKE ?) DESC, is_provisional ASC, display_order LIMIT 1), 1))`,
            args: [id, name, name, description, match, order, match],
          });
        } else {
          await tx.execute({
            sql: `INSERT OR IGNORE INTO products (id, category_slug, name, tagline, description, image_url, display_order, is_active, is_provisional)
              VALUES (?, 'papelaria', ?, ?, ?, COALESCE((SELECT image_url FROM products WHERE category_slug = 'papelaria' AND id NOT LIKE 'family-%' ORDER BY (name LIKE ?) DESC, is_provisional ASC, display_order LIMIT 1), '/images/demo/planner-executivo.jpg'), ?, 1, COALESCE((SELECT is_provisional FROM products WHERE category_slug = 'papelaria' AND id NOT LIKE 'family-%' ORDER BY (name LIKE ?) DESC, is_provisional ASC, display_order LIMIT 1), 1))`,
            args: [id, name, name, description, match, order, match],
          });
        }
      }
      if (useCategoryId) {
        await tx.execute("UPDATE products SET is_active = 0 WHERE category_id = (SELECT id FROM categories WHERE slug = 'papelaria') AND id NOT IN ('family-agendas', 'family-planners', 'family-cadernos', 'family-calendarios')");
      } else {
        await tx.execute("UPDATE products SET is_active = 0 WHERE category_slug = 'papelaria' AND id NOT IN ('family-agendas', 'family-planners', 'family-cadernos')");
      }
      await tx.execute(`CREATE TABLE agenda_quote_assets_v2 (
        quote_id TEXT NOT NULL REFERENCES agenda_quotes(id) ON DELETE CASCADE,
        name TEXT NOT NULL CHECK (name IN ('original', 'logo', 'preview-1', 'preview-2', 'preview-3', 'preview-4', 'preview-5', 'preview-6', 'preview-7', 'preview-8')),
        mime TEXT NOT NULL, content BLOB NOT NULL, PRIMARY KEY (quote_id, name))`);
      await tx.execute('INSERT INTO agenda_quote_assets_v2 SELECT * FROM agenda_quote_assets');
      await tx.execute('DROP TABLE agenda_quote_assets');
      await tx.execute('ALTER TABLE agenda_quote_assets_v2 RENAME TO agenda_quote_assets');
      await tx.execute("INSERT INTO schema_migrations VALUES ('stationery-families-v2')");
    }
    const notebooksApplied = await tx.execute("SELECT id FROM schema_migrations WHERE id = 'stationery-notebooks-v1'");
    if (!notebooksApplied.rows.length) {
      await tx.execute({
        sql: "UPDATE products SET description = ?, tagline = ? WHERE id = 'family-cadernos'",
        args: [
          'Caderno de Receitas (140 págs), Diário Pessoal não datado (160 págs) e Livro de Memórias com 52 aberturas duplas (120 págs). Estilos Clássico, Executivo e Afetivo.',
          'Caderno de Receitas, Diário Pessoal e Livro de Memórias em A5',
        ],
      });
      await tx.execute({
        sql: "UPDATE products SET description = ?, tagline = ? WHERE id = 'family-planners'",
        args: [
          'Planner Essencial: planejamento anual, mensal e semanal, metas, finanças, hábitos, revisão mensal e anotações. Estilos Clássico, Comercial e Feminino.',
          'Planner Essencial A5 datado ou permanente',
        ],
      });
      await tx.execute("INSERT INTO schema_migrations VALUES ('stationery-notebooks-v1')");
    }
    const agendaCoverApplied = await tx.execute("SELECT id FROM schema_migrations WHERE id = 'agenda-cover-assets-v1'");
    if (!agendaCoverApplied.rows.length) {
      await tx.execute(`CREATE TABLE agenda_quote_assets_v3 (
        quote_id TEXT NOT NULL REFERENCES agenda_quotes(id) ON DELETE CASCADE,
        name TEXT NOT NULL,
        mime TEXT NOT NULL, content BLOB NOT NULL, PRIMARY KEY (quote_id, name))`);
      await tx.execute('INSERT INTO agenda_quote_assets_v3 SELECT * FROM agenda_quote_assets');
      await tx.execute('DROP TABLE agenda_quote_assets');
      await tx.execute('ALTER TABLE agenda_quote_assets_v3 RENAME TO agenda_quote_assets');
      await tx.execute("INSERT INTO schema_migrations VALUES ('agenda-cover-assets-v1')");
    }
    await tx.commit();
  } catch (error) { await tx.rollback(); throw error; }
  finally { tx.close(); }
}

/** Cria as tabelas da Biblioteca de Artes de forma idempotente e versionada. */
export async function migrateArtLibrary(client: Client): Promise<void> {
  await client.execute('CREATE TABLE IF NOT EXISTS schema_migrations (id TEXT PRIMARY KEY)');
  const tx = await client.transaction('write');
  try {
    const applied = await tx.execute("SELECT id FROM schema_migrations WHERE id = 'art-library-v1'");
    if (!applied.rows.length) {
      await tx.execute(`CREATE TABLE IF NOT EXISTS arte_categorias (
        id TEXT PRIMARY KEY,
        slug TEXT NOT NULL UNIQUE,
        name TEXT NOT NULL,
        display_order INTEGER NOT NULL DEFAULT 0,
        is_active INTEGER NOT NULL DEFAULT 1,
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL
      )`);
      await tx.execute(`CREATE TABLE IF NOT EXISTS artes (
        id TEXT PRIMARY KEY,
        code TEXT NOT NULL UNIQUE,
        title TEXT NOT NULL,
        description TEXT NOT NULL DEFAULT '',
        current_version INTEGER NOT NULL DEFAULT 1,
        is_published INTEGER NOT NULL DEFAULT 0,
        is_active INTEGER NOT NULL DEFAULT 1,
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL
      )`);
      await tx.execute(`CREATE TABLE IF NOT EXISTS arte_versoes (
        arte_id TEXT NOT NULL REFERENCES artes(id) ON DELETE CASCADE,
        version INTEGER NOT NULL,
        original_filename TEXT NOT NULL,
        original_mime TEXT NOT NULL,
        original_ext TEXT NOT NULL,
        width INTEGER NOT NULL,
        height INTEGER NOT NULL,
        thumb_width INTEGER NOT NULL,
        thumb_height INTEGER NOT NULL,
        preview_width INTEGER NOT NULL,
        preview_height INTEGER NOT NULL,
        file_size INTEGER NOT NULL,
        created_at TEXT NOT NULL,
        PRIMARY KEY (arte_id, version)
      )`);
      await tx.execute(`CREATE TABLE IF NOT EXISTS arte_categoria_rel (
        arte_id TEXT NOT NULL REFERENCES artes(id) ON DELETE CASCADE,
        categoria_id TEXT NOT NULL REFERENCES arte_categorias(id) ON DELETE CASCADE,
        PRIMARY KEY (arte_id, categoria_id)
      )`);
      await tx.execute(`CREATE TABLE IF NOT EXISTS arte_produtos (
        arte_id TEXT NOT NULL REFERENCES artes(id) ON DELETE CASCADE,
        product_type TEXT NOT NULL,
        PRIMARY KEY (arte_id, product_type)
      )`);
      await tx.execute('CREATE INDEX IF NOT EXISTS artes_admin_filter ON artes (is_active, is_published, updated_at DESC)');
      await tx.execute('CREATE INDEX IF NOT EXISTS arte_produtos_type ON arte_produtos (product_type, arte_id)');
      await tx.execute("INSERT INTO schema_migrations VALUES ('art-library-v1')");
    }
    const batchTitleApplied = await tx.execute("SELECT id FROM schema_migrations WHERE id = 'art-library-batch-title-v1'");
    if (!batchTitleApplied.rows.length) {
      const cols = await tx.execute("PRAGMA table_info('artes')");
      const hasBatchTitle = cols.rows.some(row => String(row.name) === 'batch_title');
      if (!hasBatchTitle) {
        await tx.execute("ALTER TABLE artes ADD COLUMN batch_title TEXT NOT NULL DEFAULT ''");
      }
      await tx.execute("INSERT INTO schema_migrations VALUES ('art-library-batch-title-v1')");
    }
    const groupDescApplied = await tx.execute("SELECT id FROM schema_migrations WHERE id = 'art-library-group-description-v1'");
    if (!groupDescApplied.rows.length) {
      const cols = await tx.execute("PRAGMA table_info('artes')");
      const hasGroupDesc = cols.rows.some(row => String(row.name) === 'group_description');
      if (!hasGroupDesc) {
        await tx.execute("ALTER TABLE artes ADD COLUMN group_description TEXT NOT NULL DEFAULT ''");
      }
      await tx.execute("INSERT INTO schema_migrations VALUES ('art-library-group-description-v1')");
    }
    await tx.commit();
  } catch (error) {
    await tx.rollback();
    throw error;
  } finally {
    tx.close();
  }
}

/** Migração incremental para destacar produtos na Home e vincular arte opcional da Biblioteca. */
export async function migrateCatalogShowcase(client: Client): Promise<void> {
  await client.execute('CREATE TABLE IF NOT EXISTS schema_migrations (id TEXT PRIMARY KEY)');
  const applied = await client.execute("SELECT id FROM schema_migrations WHERE id = 'catalog-showcase-v1'");
  if (applied.rows.length > 0) return;

  const colsRes = await client.execute("PRAGMA table_info('products')");
  const colNames = new Set(colsRes.rows.map(r => String(r.name)));

  const tx = await client.transaction('write');
  try {
    if (!colNames.has('is_featured')) {
      await tx.execute('ALTER TABLE products ADD COLUMN is_featured INTEGER NOT NULL DEFAULT 0');
    }
    if (!colNames.has('linked_arte_id')) {
      await tx.execute('ALTER TABLE products ADD COLUMN linked_arte_id TEXT');
    }
    await tx.execute("INSERT OR IGNORE INTO schema_migrations (id) VALUES ('catalog-showcase-v1')");
    await tx.commit();
  } catch (error) {
    await tx.rollback();
    throw error;
  } finally {
    tx.close();
  }
}

/**
 * Migração estrutural para catálogo dinâmico (Feature 011-A):
 * - Evolui categories com metadados de vitrine, layout e destinos.
 * - Migra products e gallery_works de category_slug para category_id (FK estável).
 * - Interrompe e faz rollback se houver qualquer referência órfã sem categoria correspondente.
 */
export async function migrateDynamicCatalog(client: Client): Promise<void> {
  await client.execute('CREATE TABLE IF NOT EXISTS schema_migrations (id TEXT PRIMARY KEY)');
  await client.execute(`
    CREATE TABLE IF NOT EXISTS category_slug_aliases (
      slug TEXT PRIMARY KEY,
      category_id TEXT NOT NULL REFERENCES categories(id) ON DELETE CASCADE,
      created_at TEXT NOT NULL
    )
  `);
  const applied = await client.execute("SELECT id FROM schema_migrations WHERE id = 'catalog-dynamic-v1'");
  if (applied.rows.length > 0) return;

  const tx = await client.transaction('write');
  try {
    const catColsRes = await tx.execute("PRAGMA table_info('categories')");
    const catCols = new Set(catColsRes.rows.map(r => String(r.name)));

    const newCatCols: ReadonlyArray<[string, string]> = [
      ['cover_image_url', 'TEXT'],
      ['show_on_home', 'INTEGER NOT NULL DEFAULT 1'],
      ['layout_type', "TEXT NOT NULL DEFAULT 'carousel'"],
      ['destination_type', "TEXT NOT NULL DEFAULT 'collection'"],
      ['destination_href', 'TEXT'],
      ['default_product_action', "TEXT NOT NULL DEFAULT 'quote'"],
      ['default_product_href', 'TEXT'],
    ];
    for (const [colName, colDef] of newCatCols) {
      if (!catCols.has(colName)) {
        await tx.execute(`ALTER TABLE categories ADD COLUMN ${colName} ${colDef}`);
      }
    }

    await tx.execute(
      "UPDATE categories SET layout_type = 'carousel', destination_type = 'internal_page', destination_href = '/quadros', default_product_action = 'customizer', default_product_href = '/personalizar/quadro' WHERE slug = 'quadros' AND destination_href IS NULL",
    );
    await tx.execute(
      "UPDATE categories SET layout_type = 'carousel', destination_type = 'internal_page', destination_href = '/canecas', default_product_action = 'customizer', default_product_href = '/personalizar/caneca' WHERE slug = 'canecas' AND destination_href IS NULL",
    );
    await tx.execute(
      "UPDATE categories SET layout_type = 'grid', destination_type = 'collection', destination_href = '/colecoes/papelaria', default_product_action = 'customizer', default_product_href = NULL WHERE slug = 'papelaria' AND destination_href IS NULL",
    );
    await tx.execute(
      "UPDATE categories SET layout_type = 'carousel', destination_type = 'collection', destination_href = '/colecoes/artesanato', default_product_action = 'quote', default_product_href = NULL WHERE slug = 'artesanato' AND destination_href IS NULL",
    );
    await tx.execute("UPDATE categories SET destination_href = '/colecoes/' || slug WHERE destination_href IS NULL");

    const prodColsRes = await tx.execute("PRAGMA table_info('products')");
    const prodCols = new Set(prodColsRes.rows.map(r => String(r.name)));

    if (prodCols.has('category_slug')) {
      const orphanProducts = await tx.execute(
        'SELECT id, name, category_slug FROM products WHERE category_slug NOT IN (SELECT slug FROM categories)',
      );
      if (orphanProducts.rows.length > 0) {
        const list = orphanProducts.rows
          .map(r => `${String(r.id)} (${String(r.name)} -> slug '${String(r.category_slug)}')`)
          .join(', ');
        throw new Error(`Migração interrompida: produtos com category_slug sem categoria correspondente: ${list}`);
      }
    }

    const workColsRes = await tx.execute("PRAGMA table_info('gallery_works')");
    const workCols = new Set(workColsRes.rows.map(r => String(r.name)));

    if (workCols.has('category_slug')) {
      const orphanWorks = await tx.execute(
        'SELECT id, title, category_slug FROM gallery_works WHERE category_slug NOT IN (SELECT slug FROM categories)',
      );
      if (orphanWorks.rows.length > 0) {
        const list = orphanWorks.rows
          .map(r => `${String(r.id)} (${String(r.title)} -> slug '${String(r.category_slug)}')`)
          .join(', ');
        throw new Error(`Migração interrompida: trabalhos da galeria com category_slug sem categoria correspondente: ${list}`);
      }
    }

    if (prodCols.has('category_slug') || !prodCols.has('category_id')) {
      await tx.execute(`
        CREATE TABLE products_v2 (
          id TEXT PRIMARY KEY,
          category_id TEXT NOT NULL REFERENCES categories(id) ON DELETE RESTRICT,
          name TEXT NOT NULL,
          tagline TEXT NOT NULL,
          description TEXT NOT NULL,
          featured_badge TEXT,
          image_url TEXT NOT NULL,
          display_order INTEGER NOT NULL,
          is_active INTEGER NOT NULL DEFAULT 1,
          is_provisional INTEGER NOT NULL DEFAULT 1,
          is_featured INTEGER NOT NULL DEFAULT 0,
          linked_arte_id TEXT,
          action_type TEXT CHECK (action_type IS NULL OR action_type IN ('details', 'customizer', 'quote')),
          action_href TEXT,
          cta_label TEXT
        )
      `);
      await tx.execute(`
        INSERT INTO products_v2 (
          id, category_id, name, tagline, description, featured_badge, image_url,
          display_order, is_active, is_provisional, is_featured, linked_arte_id,
          action_type, action_href, cta_label
        )
        SELECT
          p.id, c.id, p.name, p.tagline, p.description, p.featured_badge, p.image_url,
          p.display_order, p.is_active, p.is_provisional,
          COALESCE(p.is_featured, 0), p.linked_arte_id,
          NULL, NULL, NULL
        FROM products p
        INNER JOIN categories c ON c.slug = p.category_slug
      `);
      await tx.execute('DROP TABLE products');
      await tx.execute('ALTER TABLE products_v2 RENAME TO products');
    } else {
      const extraProdCols: ReadonlyArray<[string, string]> = [
        ['action_type', "TEXT CHECK (action_type IS NULL OR action_type IN ('details', 'customizer', 'quote'))"],
        ['action_href', 'TEXT'],
        ['cta_label', 'TEXT'],
      ];
      for (const [colName, colDef] of extraProdCols) {
        if (!prodCols.has(colName)) {
          await tx.execute(`ALTER TABLE products ADD COLUMN ${colName} ${colDef}`);
        }
      }
    }

    await tx.execute(
      'CREATE INDEX IF NOT EXISTS idx_products_category_order ON products (category_id, is_active, is_featured, display_order)',
    );

    await tx.execute(
      "UPDATE products SET action_type = 'customizer', action_href = '/personalizar/agenda', cta_label = 'Personalizar agenda' WHERE id = 'family-agendas' AND action_href IS NULL",
    );
    await tx.execute(
      "UPDATE products SET action_type = 'customizer', action_href = '/personalizar/planner', cta_label = 'Criar planner' WHERE id = 'family-planners' AND action_href IS NULL",
    );
    await tx.execute(
      "UPDATE products SET action_type = 'customizer', action_href = '/personalizar/caderno', cta_label = 'Personalizar caderno' WHERE id = 'family-cadernos' AND action_href IS NULL",
    );

    if (workCols.has('category_slug') || !workCols.has('category_id')) {
      await tx.execute(`
        CREATE TABLE gallery_photos_v2 (
          id TEXT PRIMARY KEY,
          work_id TEXT NOT NULL,
          position INTEGER NOT NULL,
          width INTEGER NOT NULL,
          height INTEGER NOT NULL,
          thumb_width INTEGER NOT NULL,
          thumb_height INTEGER NOT NULL
        )
      `);
      await tx.execute(
        'INSERT INTO gallery_photos_v2 (id, work_id, position, width, height, thumb_width, thumb_height) SELECT id, work_id, position, width, height, thumb_width, thumb_height FROM gallery_photos',
      );
      await tx.execute('DROP TABLE gallery_photos');

      await tx.execute(`
        CREATE TABLE gallery_works_v2 (
          id TEXT PRIMARY KEY,
          title TEXT NOT NULL,
          description TEXT NOT NULL,
          category_id TEXT NOT NULL REFERENCES categories(id) ON DELETE RESTRICT,
          work_date TEXT,
          instagram TEXT NOT NULL,
          published INTEGER NOT NULL,
          featured INTEGER NOT NULL,
          display_order INTEGER NOT NULL,
          created_at TEXT NOT NULL,
          updated_at TEXT NOT NULL,
          published_at TEXT,
          version INTEGER NOT NULL DEFAULT 1
        )
      `);
      await tx.execute(`
        INSERT INTO gallery_works_v2 (
          id, title, description, category_id, work_date, instagram,
          published, featured, display_order, created_at, updated_at, published_at, version
        )
        SELECT
          w.id, w.title, w.description, c.id, w.work_date, w.instagram,
          w.published, w.featured, w.display_order, w.created_at, w.updated_at, w.published_at, w.version
        FROM gallery_works w
        INNER JOIN categories c ON c.slug = w.category_slug
      `);
      await tx.execute('DROP TABLE gallery_works');
      await tx.execute('ALTER TABLE gallery_works_v2 RENAME TO gallery_works');

      await tx.execute(`
        CREATE TABLE gallery_photos (
          id TEXT PRIMARY KEY,
          work_id TEXT NOT NULL REFERENCES gallery_works(id),
          position INTEGER NOT NULL,
          width INTEGER NOT NULL,
          height INTEGER NOT NULL,
          thumb_width INTEGER NOT NULL,
          thumb_height INTEGER NOT NULL,
          UNIQUE(work_id, position)
        )
      `);
      await tx.execute(
        'INSERT INTO gallery_photos (id, work_id, position, width, height, thumb_width, thumb_height) SELECT id, work_id, position, width, height, thumb_width, thumb_height FROM gallery_photos_v2',
      );
      await tx.execute('DROP TABLE gallery_photos_v2');
      await tx.execute('CREATE INDEX IF NOT EXISTS gallery_public_order ON gallery_works (published, featured, display_order)');
      await tx.execute('CREATE INDEX IF NOT EXISTS idx_gallery_works_category ON gallery_works (category_id, published, display_order)');
    }

    const fkErrors = await tx.execute('PRAGMA foreign_key_check');
    if (fkErrors.rows.length > 0) {
      throw new Error('Falha de integridade referencial após migração catalog-dynamic-v1.');
    }

    await tx.execute("INSERT OR IGNORE INTO schema_migrations (id) VALUES ('catalog-dynamic-v1')");
    await tx.commit();
  } catch (error) {
    await tx.rollback();
    throw error;
  } finally {
    tx.close();
  }
}
