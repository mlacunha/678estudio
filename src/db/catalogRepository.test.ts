import { describe, it, expect, beforeEach } from 'vitest';
import { createClient, type Client } from '@libsql/client';
import {
  getActiveCategories,
  getAllCategories,
  getActiveProductsByCategory,
  getAllProducts,
  getProductById,
  createProduct,
  updateProduct,
  toggleProductActive,
  deleteProduct,
} from './catalogRepository';
import type { Product } from '../types/catalog';

describe('Catalog Repository with SQLite', () => {
  let testClient: Client;

  beforeEach(async () => {
    testClient = createClient({ url: ':memory:' });
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

