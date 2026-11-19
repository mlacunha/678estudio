import { initDatabase, migrateStationery, migrateCatalogShowcase, migrateDynamicCatalog, getDatabasePath } from './database';
import { describe, it, expect, beforeEach } from 'vitest';
import { randomUUID } from 'node:crypto';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { createClient, type Client } from '@libsql/client';
import {
  getActiveCategories,
  getHomeCategories,
  getMenuCategories,
  getAllCategories,
  getCategoryById,
  getCategoryBySlug,
  isPublishedInternalDestination,
  resolveCategoryBySlugOrAlias,
  listAdminCategoriesWithCounts,
  createCategory,
  updateCategory,
  toggleCategoryActive,
  toggleCategoryShowOnHome,
  deleteCategory,
  getActiveProductsByCategory,
  getHomeFeaturedProducts,
  listAdminProductsPaginated,
  resolveValidLinkedArteId,
  getAllProducts,
  getProductById,
  createProduct,
  updateProduct,
  toggleProductActive,
  toggleProductFeatured,
  deleteProduct,
  replaceProductImage,
} from './catalogRepository';
import { validateProductActionOverride } from '../pages/api/products/index';
import { validateCategoryPayload } from '../pages/api/categories/index';
import { createArtCategory, createArteWithVersion } from './artLibraryRepository';
import type { Product } from '../types/catalog';

describe('Catalog Repository with SQLite', () => {
  let testClient: Client;

  beforeEach(async () => {
    testClient = createClient({ url: ':memory:' });
  });

  it('shares initialization between simultaneous reads on a fresh database', async () => {
    const [categories, products, frames] = await Promise.all([
      getActiveCategories(testClient),
      getAllProducts(testClient),
      getActiveProductsByCategory('quadros', testClient),
    ]);

    expect(categories).toHaveLength(4);
    expect(products).toHaveLength(12);
    expect(frames).toHaveLength(3);
  });

  it('replaces only the image of the selected product and refuses stale replacements', async () => {
    const product = (await getProductById('prod-c1', testClient))!;
    const imageUrl = '/uploads/catalog-test.webp';
    expect(await replaceProductImage(product, imageUrl, testClient)).toBe(true);
    expect(await replaceProductImage(product, '/uploads/stale.webp', testClient)).toBe(false);
    expect(await getProductById(product.id, testClient)).toEqual({ ...product, imageUrl });
  });

  describe('Categories Operations', () => {
    it('defaults existing categories to visible and keeps menu visibility independent of publication and home', async () => {
      const published = await getActiveCategories(testClient);
      expect(await getMenuCategories(testClient)).toEqual(published);
      expect(published.every(category => category.showOnMenu)).toBe(true);

      const validated = validateCategoryPayload({ slug: 'colecao-reservada', title: 'Coleção Reservada', showOnMenu: false });
      expect(validated.category?.showOnMenu).toBe(false);
      const id = 'cat-reservada';
      await createCategory({ id, ...validated.category! }, testClient);
      expect((await getMenuCategories(testClient)).some(category => category.id === id)).toBe(false);
      expect((await getHomeCategories(testClient)).some(category => category.id === id)).toBe(true);
      expect(await isPublishedInternalDestination('/colecoes/colecao-reservada', testClient)).toBe(true);
      expect((await listAdminCategoriesWithCounts(testClient)).find(category => category.id === id)?.showOnMenu).toBe(false);

      const saved = (await getCategoryById(id, testClient))!;
      await updateCategory({ ...saved, showOnMenu: true, showOnHome: false }, testClient);
      expect((await getMenuCategories(testClient)).some(category => category.id === id)).toBe(true);
      expect((await getHomeCategories(testClient)).some(category => category.id === id)).toBe(false);

      await toggleCategoryActive(id, false, testClient);
      expect((await getMenuCategories(testClient)).some(category => category.id === id)).toBe(false);
      expect(await isPublishedInternalDestination('/colecoes/colecao-reservada', testClient)).toBe(false);
    });
    it('validates published collection destinations without removing saved product references', async () => {
      const category = (await getCategoryBySlug('quadros', testClient))!;
      const product = (await getProductById('prod-c1', testClient))!;
      const href = '/colecoes/quadros';
      await updateProduct({ ...product, actionType: 'details', actionHref: href }, testClient);
      expect(await isPublishedInternalDestination(href, testClient)).toBe(true);
      expect(await isPublishedInternalDestination('/colecoes/nao-cadastrada', testClient)).toBe(false);
      expect(await isPublishedInternalDestination('/canecas', testClient)).toBe(true);
      await toggleCategoryActive(category.id, false, testClient);
      expect(await isPublishedInternalDestination(href, testClient)).toBe(false);
      expect(await getProductById(product.id, testClient)).toMatchObject({ actionType: 'details', actionHref: href });
    });
    it('should retrieve active categories ordered by display_order', async () => {
      const categories = await getActiveCategories(testClient);
      expect(categories.length).toBeGreaterThan(0);
      expect(categories.every((c) => c.isActive)).toBe(true);

      for (let i = 0; i < categories.length - 1; i++) {
        expect(categories[i].displayOrder).toBeLessThanOrEqual(categories[i + 1].displayOrder);
      }
    });

    it('should return all categories regardless of active state', async () => {
      const allCategories = await getAllCategories(testClient);
      expect(allCategories.length).toBeGreaterThan(0);
    });
  });

  describe('Products Operations', () => {
    it('should retrieve active products for a specific category ordered by display_order', async () => {
      const quadros = await getActiveProductsByCategory('quadros', testClient);
      expect(quadros.length).toBeGreaterThan(0);
      expect(quadros.every((p) => p.categorySlug === 'quadros')).toBe(true);
      expect(quadros.every((p) => p.isActive)).toBe(true);
    });

    it('should find a product by its id', async () => {
      const product = await getProductById('prod-c1', testClient);
      expect(product).not.toBeNull();
      expect(product?.name).toBe('Caneca Pure White Signature');
    });

    it('should return null when searching for an unrecorded product id', async () => {
      const product = await getProductById('inexistente', testClient);
      expect(product).toBeNull();
    });

    it('should insert a new product and retrieve it correctly', async () => {
      const newProduct: Product = {
        id: 'prod-test-1',
        categorySlug: 'canecas',
        name: 'Caneca Teste Edição Ouro',
        tagline: 'Linha exclusiva de teste',
        description: 'Descrição de teste unitário',
        featuredBadge: 'Novidade',
        imageUrl: '/images/demo/caneca-branca.jpg',
        order: 99,
        isActive: true,
        isProvisional: false,
      };

      await createProduct(newProduct, testClient);
      const retrieved = await getProductById('prod-test-1', testClient);

      expect(retrieved).not.toBeNull();
      expect(retrieved?.name).toBe('Caneca Teste Edição Ouro');
      expect(retrieved?.featuredBadge).toBe('Novidade');
    });

    it('should update an existing product fields', async () => {
      const product = await getProductById('prod-q1', testClient);
      expect(product).not.toBeNull();

      if (product) {
        const updated = {
          ...product,
          name: 'Quadro Geometria Dourada Atualizado',
          order: 10,
        };
        await updateProduct(updated, testClient);

        const retrieved = await getProductById('prod-q1', testClient);
        expect(retrieved?.name).toBe('Quadro Geometria Dourada Atualizado');
        expect(retrieved?.order).toBe(10);
      }
    });

    it('should toggle product active status and hide from active queries', async () => {
      await toggleProductActive('prod-c1', false, testClient);
      const activeCanecas = await getActiveProductsByCategory('canecas', testClient);
      expect(activeCanecas.some((p) => p.id === 'prod-c1')).toBe(false);

      const all = await getAllProducts(testClient);
      const found = all.find((p) => p.id === 'prod-c1');
      expect(found?.isActive).toBe(false);
    });

    it('should delete a product permanently', async () => {
      await deleteProduct('prod-c2', testClient);
      const deleted = await getProductById('prod-c2', testClient);
      expect(deleted).toBeNull();
    });
  });

  it('migrates stationery once, retaining archived images and quote assets', async () => {
   const client = createClient({ url: ':memory:' });
   try {
     await initDatabase(client);
     // Recreate the prior state to exercise the migration with administrator data.
     await client.execute("DELETE FROM schema_migrations WHERE id = 'stationery-families-v2'");
     await client.execute("DELETE FROM products WHERE id LIKE 'family-%'");
     await client.execute("UPDATE products SET image_url = '/uploads/admin-original.webp', is_active = 1, is_provisional = 0 WHERE id = 'prod-p1'");
     await client.execute("INSERT INTO agenda_quotes VALUES ('old', 'old-draft', 'Agenda Clássica', '2026-01-01', 'requested', 1, '{}')");
     await client.execute("INSERT INTO agenda_quote_assets VALUES ('old', 'preview-1', 'image/png', X'010203')");
     await migrateStationery(client);
     const active = await getActiveProductsByCategory('papelaria', client);
     expect(active.map(p => p.name)).toEqual(['Agendas', 'Planners', 'Cadernos Personalizados']);
     expect((await getProductById('prod-p1', client))).toMatchObject({ isActive: false, imageUrl: '/uploads/admin-original.webp' });
     expect(active[1].imageUrl).toBe('/uploads/admin-original.webp');
     expect(active[1].isProvisional).toBe(false);
     await client.execute("UPDATE products SET image_url = '/uploads/family-custom.webp' WHERE id = 'family-agendas'");
     await migrateStationery(client);
     expect((await getProductById('family-agendas', client))?.imageUrl).toBe('/uploads/family-custom.webp');
     expect((await client.execute('SELECT hex(content) AS bytes FROM agenda_quote_assets')).rows[0].bytes).toBe('010203');
     await client.execute("INSERT INTO agenda_quote_assets VALUES ('old', 'preview-8', 'image/png', X'04')");
   } finally { client.close(); }
 });

  it('it should return featured products on home or fallback to first 4 active ordered products', async () => {
    const client = createClient({ url: ':memory:' });
    try {
      await initDatabase(client);
      const fallback = await getHomeFeaturedProducts('canecas', 4, client);
      expect(fallback.length).toBeGreaterThan(0);
      expect(fallback.length).toBeLessThanOrEqual(4);
      expect(fallback.every((p) => p.isActive)).toBe(true);

      const firstProduct = fallback[0];
      const firstId = firstProduct.id;
      await updateProduct({ ...firstProduct, isFeatured: true }, client);
      await createProduct(
        {
          id: 'prod-featured-extra',
          name: 'Caneca Destaque Extra',
          categorySlug: 'canecas',
          tagline: 'Teste destaque',
          description: 'Descrição teste',
          imageUrl: '/images/demo/mug-1.png',
          isActive: true,
          isProvisional: false,
          isFeatured: true,
          order: 10,
        },
        client,
      );
      await createProduct(
        {
          id: 'prod-featured-hidden',
          name: 'Caneca Destaque Oculta',
          categorySlug: 'canecas',
          tagline: 'Oculta',
          description: 'Descrição oculta',
          imageUrl: '/images/demo/mug-1.png',
          isActive: false,
          isProvisional: false,
          isFeatured: true,
          order: 11,
        },
        client,
      );

      const featuredOnly = await getHomeFeaturedProducts('canecas', 4, client);
      expect(featuredOnly.map((p) => p.name)).toContain('Caneca Destaque Extra');
      expect(featuredOnly.map((p) => p.name)).not.toContain('Caneca Destaque Oculta');
      expect(featuredOnly).toHaveLength(2);

      await migrateCatalogShowcase(client);
      const afterMigration = await getProductById(firstId, client);
      expect(afterMigration?.isFeatured).toBe(true);
    } finally {
      client.close();
    }
  });

  it('it should validate linkedArteId compatibility and publication status', async () => {
    const client = createClient({ url: ':memory:' });
    try {
      await initDatabase(client);
      const cat = await createArtCategory({ name: 'Coleção Teste' }, client);
      const baseVer = {
        originalFilename: 'art.png',
        originalMime: 'image/png',
        originalExt: 'png',
        width: 1000,
        height: 1000,
        thumbWidth: 400,
        thumbHeight: 400,
        previewWidth: 1000,
        previewHeight: 1000,
        fileSize: 5000,
      };
      const mugArtId = randomUUID();
      const frameArtId = randomUUID();
      const draftArtId = randomUUID();

      await createArteWithVersion(
        { id: mugArtId, code: 'TST-01', title: 'Arte Caneca', categoryIds: [cat.id], productTypes: ['caneca'], isPublished: true, version: baseVer },
        client,
      );
      await createArteWithVersion(
        { id: frameArtId, code: 'TST-02', title: 'Arte Quadro', categoryIds: [cat.id], productTypes: ['quadro'], isPublished: true, version: baseVer },
        client,
      );
      await createArteWithVersion(
        { id: draftArtId, code: 'TST-03', title: 'Arte Rascunho', categoryIds: [cat.id], productTypes: ['caneca'], isPublished: false, version: baseVer },
        client,
      );

      expect(await resolveValidLinkedArteId(mugArtId, 'canecas', client)).toBe(mugArtId);
      expect(await resolveValidLinkedArteId(frameArtId, 'canecas', client)).toBeUndefined();
      expect(await resolveValidLinkedArteId(frameArtId, 'quadros', client)).toBe(frameArtId);
      expect(await resolveValidLinkedArteId(draftArtId, 'canecas', client)).toBeUndefined();
      expect(await resolveValidLinkedArteId('not-a-uuid', 'canecas', client)).toBeUndefined();
      expect(await resolveValidLinkedArteId(mugArtId, 'papelaria', client)).toBeUndefined();
    } finally {
      client.close();
    }
  });

  it('it should migrate products and gallery_works to category_id and preserve relations when slug changes', async () => {
    const client = createClient({ url: ':memory:' });
    try {
      await initDatabase(client);

      const prodCols = (await client.execute("PRAGMA table_info('products')")).rows.map(r => String(r.name));
      expect(prodCols).toContain('category_id');
      expect(prodCols).not.toContain('category_slug');

      const workCols = (await client.execute("PRAGMA table_info('gallery_works')")).rows.map(r => String(r.name));
      expect(workCols).toContain('category_id');
      expect(workCols).not.toContain('category_slug');

      const quadrosCat = await getCategoryBySlug('quadros', client);
      expect(quadrosCat).toMatchObject({
        id: 'cat-quadros',
        layoutType: 'carousel',
        destinationType: 'internal_page',
        destinationHref: '/quadros',
        defaultProductAction: 'customizer',
        defaultProductHref: '/personalizar/quadro',
      });

      await updateCategory({ ...quadrosCat!, slug: 'quadros-autorais', title: 'Quadros Autorais' }, client);
      const renamedFrames = await getActiveProductsByCategory('quadros-autorais', client);
      expect(renamedFrames).toHaveLength(3);
      expect(renamedFrames[0].categoryId).toBe('cat-quadros');
      expect(renamedFrames[0].categorySlug).toBe('quadros-autorais');
      expect(renamedFrames[0].categoryTitle).toBe('Quadros Autorais');

      await expect(deleteCategory('cat-quadros', client)).rejects.toThrow('Não é possível excluir a categoria');

      await createCategory(
        {
          id: 'cat-brindes',
          slug: 'brindes',
          title: 'Brindes Corporativos',
          subtitle: 'Linha empresarial',
          description: 'Presentes personalizados',
          badge: 'Novo',
          displayOrder: 10,
        },
        client,
      );
      expect((await getCategoryById('cat-brindes', client))?.slug).toBe('brindes');
      await deleteCategory('cat-brindes', client);
      expect(await getCategoryById('cat-brindes', client)).toBeNull();
    } finally {
      client.close();
    }
  });

  it('it should abort migration and rollback if orphan category_slug exists', async () => {
    const client = createClient({ url: ':memory:' });
    try {
      await client.execute(`
        CREATE TABLE categories (
          id TEXT PRIMARY KEY, slug TEXT UNIQUE NOT NULL, title TEXT NOT NULL,
          subtitle TEXT NOT NULL, description TEXT NOT NULL, badge TEXT NOT NULL,
          display_order INTEGER NOT NULL, is_active INTEGER NOT NULL DEFAULT 1
        )
      `);
      await client.execute(`
        CREATE TABLE products (
          id TEXT PRIMARY KEY, category_slug TEXT NOT NULL, name TEXT NOT NULL,
          tagline TEXT NOT NULL, description TEXT NOT NULL, featured_badge TEXT,
          image_url TEXT NOT NULL, display_order INTEGER NOT NULL,
          is_active INTEGER NOT NULL DEFAULT 1, is_provisional INTEGER NOT NULL DEFAULT 1,
          is_featured INTEGER NOT NULL DEFAULT 0, linked_arte_id TEXT
        )
      `);
      await client.execute(`
        CREATE TABLE gallery_works (
          id TEXT PRIMARY KEY, title TEXT NOT NULL, description TEXT NOT NULL,
          category_slug TEXT NOT NULL, work_date TEXT, instagram TEXT NOT NULL,
          published INTEGER NOT NULL, featured INTEGER NOT NULL, display_order INTEGER NOT NULL,
          created_at TEXT NOT NULL, updated_at TEXT NOT NULL, published_at TEXT, version INTEGER NOT NULL DEFAULT 1
        )
      `);
      await client.execute(
        "INSERT INTO categories VALUES ('cat-canecas', 'canecas', 'Canecas', 'Sub', 'Desc', 'Badge', 1, 1)",
      );
      await client.execute(
        "INSERT INTO products VALUES ('p-orphan', 'categoria-inexistente', 'Produto Órfão', '', '', NULL, '/img.png', 1, 1, 0, 0, NULL)",
      );

      await expect(migrateDynamicCatalog(client)).rejects.toThrow('Migração interrompida');

      const prodColsAfter = (await client.execute("PRAGMA table_info('products')")).rows.map(r => String(r.name));
      expect(prodColsAfter).toContain('category_slug');
      const orphanRow = await client.execute("SELECT id FROM products WHERE id = 'p-orphan'");
      expect(orphanRow.rows).toHaveLength(1);
    } finally {
      client.close();
    }
  });

  it('it should paginate and filter products in SQL via listAdminProductsPaginated', async () => {
    const client = createClient({ url: ':memory:' });
    try {
      await initDatabase(client);
      const page1 = await listAdminProductsPaginated({ page: 1, pageSize: 5 }, client);
      expect(page1.items).toHaveLength(5);
      expect(page1.total).toBe(12);
      expect(page1.totalPages).toBe(3);

      const searchRes = await listAdminProductsPaginated({ q: 'Geometria', pageSize: 10 }, client);
      expect(searchRes.total).toBe(1);
      expect(searchRes.items[0].name).toContain('Geometria');

      const catRes = await listAdminProductsPaginated({ categoryId: 'cat-canecas', status: 'active' }, client);
      expect(catRes.total).toBe(2);
      expect(catRes.items.every(p => p.categoryId === 'cat-canecas')).toBe(true);
    } finally {
      client.close();
    }
  });

  it('it should migrate a representative copy of studio678.db and pass backup engine verification', async () => {
    const liveDbPath = getDatabasePath();
    if (!fs.existsSync(liveDbPath)) return;

    const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), '678-011a-'));
    const preCopy = path.join(tmpDir, 'pre.db');
    const postCopy = path.join(tmpDir, 'post.db');
    try {
      fs.copyFileSync(liveDbPath, preCopy);
      fs.copyFileSync(liveDbPath, postCopy);

      const preClient = createClient({ url: `file:${preCopy.replace(/\\/g, '/')}` });
      const preProdCount = Number((await preClient.execute('SELECT COUNT(*) AS c FROM products')).rows[0].c);
      const preCatCount = Number((await preClient.execute('SELECT COUNT(*) AS c FROM categories')).rows[0].c);
      preClient.close();

      const postClient = createClient({ url: `file:${postCopy.replace(/\\/g, '/')}` });
      await initDatabase(postClient);
      const postProdCount = Number((await postClient.execute('SELECT COUNT(*) AS c FROM products')).rows[0].c);
      const postCatCount = Number((await postClient.execute('SELECT COUNT(*) AS c FROM categories')).rows[0].c);
      const fkCheck = await postClient.execute('PRAGMA foreign_key_check');
      postClient.close();

      expect(postCatCount).toBe(preCatCount);
      expect(postProdCount).toBe(preProdCount);
      expect(fkCheck.rows).toHaveLength(0);

      const pyScript = [
        'import sys',
        `sys.path.insert(0, ${JSON.stringify(path.resolve(process.cwd(), 'src/server/backup').replace(/\\/g, '/'))})`,
        'from pathlib import Path',
        'import engine',
        `engine.verify_database(Path(${JSON.stringify(preCopy.replace(/\\/g, '/'))}))`,
        `engine.verify_database(Path(${JSON.stringify(postCopy.replace(/\\/g, '/'))}))`,
        'print("BACKUP_ENGINE_OK")',
      ].join('; ');
      const out = execFileSync('python', ['-c', pyScript], { encoding: 'utf8' }).trim();
      expect(out).toBe('BACKUP_ENGINE_OK');
    } finally {
      try {
        fs.rmSync(tmpDir, { recursive: true, force: true, maxRetries: 5, retryDelay: 50 });
      } catch {
        // Ignore Windows transient file lock on temp test DB
      }
    }
  });

  it('it should track category slug history, prevent collisions and resolve aliases', async () => {
    const client = createClient({ url: ':memory:' });
    try {
      await initDatabase(client);

      const canecas = await getCategoryById('cat-canecas', client);
      expect(canecas?.slug).toBe('canecas');

      // Rename 'canecas' -> 'canecas-ceramica'
      await updateCategory({ ...canecas!, slug: 'canecas-ceramica' }, client);

      // Direct lookup on new slug
      const direct = await resolveCategoryBySlugOrAlias('canecas-ceramica', client);
      expect(direct).toMatchObject({ isAlias: false, canonicalSlug: 'canecas-ceramica' });

      // Alias lookup on old slug 'canecas'
      const alias = await resolveCategoryBySlugOrAlias('canecas', client);
      expect(alias).toMatchObject({ isAlias: true, canonicalSlug: 'canecas-ceramica' });
      expect(alias?.category.id).toBe('cat-canecas');

      // Another category cannot steal the historical slug 'canecas'
      await expect(
        createCategory(
          {
            id: 'cat-outra',
            slug: 'canecas',
            title: 'Outra',
            subtitle: '',
            description: '',
            badge: '',
          },
          client,
        ),
      ).rejects.toThrow('já está em uso ou pertence ao histórico');

      const quadros = await getCategoryById('cat-quadros', client);
      await expect(updateCategory({ ...quadros!, slug: 'canecas' }, client)).rejects.toThrow(
        'já está em uso ou pertence ao histórico',
      );

      // Reverting 'cat-canecas' back to its own previous slug 'canecas' is allowed
      await updateCategory({ ...canecas!, slug: 'canecas' }, client);
      const reverted = await resolveCategoryBySlugOrAlias('canecas', client);
      expect(reverted).toMatchObject({ isAlias: false, canonicalSlug: 'canecas' });
      const oldIntermediate = await resolveCategoryBySlugOrAlias('canecas-ceramica', client);
      expect(oldIntermediate).toMatchObject({ isAlias: true, canonicalSlug: 'canecas' });

      const summary = await listAdminCategoriesWithCounts(client);
      const canecasSummary = summary.find(c => c.id === 'cat-canecas');
      expect(canecasSummary?.aliases).toContain('canecas-ceramica');
      expect(canecasSummary?.productCount).toBe(2);

      await toggleCategoryShowOnHome('cat-canecas', false, client);
      expect((await getCategoryById('cat-canecas', client))?.showOnHome).toBe(false);
      await toggleCategoryActive('cat-canecas', false, client);
      expect((await getCategoryById('cat-canecas', client))?.isActive).toBe(false);

      await toggleProductFeatured('prod-c1', true, client);
      expect((await getProductById('prod-c1', client))?.isFeatured).toBe(true);
    } finally {
      client.close();
    }
  });

  it('it should validate internal destinations and reject external URLs', () => {
    expect(validateProductActionOverride('customizer', '/personalizar/caneca', 'Criar').actionHref).toBe(
      '/personalizar/caneca',
    );
    expect(validateProductActionOverride('customizer', 'https://evil.example/x', '').error).toBeDefined();
    expect(validateProductActionOverride('details', '/canecas', '').actionHref).toBe('/canecas');
    expect(validateProductActionOverride('details', '/rota-inexistente', '').error).toBeDefined();

    const validCat = validateCategoryPayload({
      title: 'Corporativo',
      slug: 'corporativo',
      layoutType: 'grid',
      destinationType: 'collection',
      defaultProductAction: 'customizer',
      defaultProductHref: '/personalizar/agenda',
    });
    expect(validCat.error).toBeUndefined();
    expect(validCat.category?.destinationHref).toBe('/colecoes/corporativo');

    const invalidCat = validateCategoryPayload({
      title: 'Inválida',
      slug: 'invalida',
      destinationType: 'internal_page',
      destinationHref: 'https://externo.com',
    });
    expect(invalidCat.error).toBeDefined();
  });
});
