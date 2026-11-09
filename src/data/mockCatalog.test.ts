import { describe, it, expect } from 'vitest';
import { CATEGORIES, PRODUCTS, getActiveProductsByCategory } from './mockCatalog';

describe('Catalog Data & Helpers', () => {
  describe('getActiveProductsByCategory', () => {
    it('should return only active products for the given category ordered by order property', () => {
      const quadros = getActiveProductsByCategory('quadros');
      expect(quadros.length).toBeGreaterThan(0);
      expect(quadros.every((product) => product.categorySlug === 'quadros')).toBe(true);
      expect(quadros.every((product) => product.isActive)).toBe(true);

      for (let i = 0; i < quadros.length - 1; i++) {
        expect(quadros[i].order).toBeLessThanOrEqual(quadros[i + 1].order);
      }
    });

    it('should return empty array for non-existent category', () => {
      const items = getActiveProductsByCategory('categoria-inexistente');
      expect(items).toEqual([]);
    });
  });

  describe('Provisional Data Integrity', () => {
    it('should have all mock products clearly flagged as provisional', () => {
      expect(PRODUCTS.every((product) => product.isProvisional)).toBe(true);
    });

    it('should cover all registered categories with products', () => {
      CATEGORIES.forEach((category) => {
        const items = getActiveProductsByCategory(category.slug);
        expect(items.length).toBeGreaterThan(0);
      });
    });
  });
});

