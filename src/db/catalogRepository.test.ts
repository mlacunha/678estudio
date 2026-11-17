import { initDatabase, migrateStationery, migrateCatalogShowcase } from './database';
import { describe, it, expect, beforeEach } from 'vitest';
import { randomUUID } from 'node:crypto';
import { createClient, type Client } from '@libsql/client';
import {
  getActiveCategories,
  getAllCategories,
  getActiveProductsByCategory,
  getHomeFeaturedProducts,
  resolveValidLinkedArteId,
  getAllProducts,
  getProductById,
  createProduct,
  updateProduct,
  toggleProductActive,
  deleteProduct,
  replaceProductImage,
} from './catalogRepository';
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
