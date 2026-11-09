import { describe, it, expect } from 'vitest';
import { buildWhatsAppLink, buildWhatsAppQuotePath, formatWhatsAppMessage } from './whatsapp';

describe('WhatsApp Utilities', () => {
  describe('formatWhatsAppMessage', () => {
    it('should format default message when no product is specified', () => {
      const message = formatWhatsAppMessage();
      expect(message).toContain('Olá, equipe 678 Estudio!');
      expect(message).toContain('orçamento personalizado');
    });

    it('should include product and category details when provided', () => {
      const message = formatWhatsAppMessage({
        productName: 'Caneca Cerâmica Fosca',
        categoryTitle: 'Canecas',
      });
      expect(message).toContain('Produto de interesse: *Caneca Cerâmica Fosca*');
      expect(message).toContain('Categoria: *Canecas*');
    });

    it('should include mockup URL reference when provided', () => {
      const message = formatWhatsAppMessage({
        mockupUrl: 'https://example.test/mockup-temp/quadro-123.jpg',
      });
      expect(message).toContain('Referência/Mockup: https://example.test/mockup-temp/quadro-123.jpg');
    });

    it('should return custom message directly when provided', () => {
      const message = formatWhatsAppMessage({
        customMessage: '   Mensagem customizada direta   ',
      });
      expect(message).toBe('Mensagem customizada direta');
    });
  });

  describe('buildWhatsAppLink', () => {
    it('should generate valid WhatsApp URL with encoded message', () => {
      const path = buildWhatsAppQuotePath({ productName: 'Quadro Decorativo 30x40', categoryTitle: 'Quadros' });
      const message = new URL(path, 'https://example.test').searchParams.get('text')!;
      const link = new URL(buildWhatsAppLink('+1 (202) 555-0100', message)!);
      expect(link.origin + link.pathname).toBe('https://wa.me/12025550100');
      expect(link.searchParams.get('text')).toContain('Quadro Decorativo 30x40');
      expect(link.searchParams.get('text')).toContain('Categoria: *Quadros*');
    });

    it('omits links without a valid destination', () => {
      expect(buildWhatsAppLink('', 'Orçamento')).toBeUndefined();
      expect(buildWhatsAppLink('invalid', 'Orçamento')).toBeUndefined();
    });
  });
});

