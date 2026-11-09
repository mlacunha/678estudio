import { describe, it, expect } from 'vitest';
import { buildWhatsAppLink, formatWhatsAppMessage, DEFAULT_STUDIO_PHONE } from './whatsapp';

describe('WhatsApp Utilities', () => {
  describe('formatWhatsAppMessage', () => {
    it('should format default message when no product is specified', () => {
      const message = formatWhatsAppMessage({ phoneNumber: DEFAULT_STUDIO_PHONE });
      expect(message).toContain('Olá, equipe 678 Estudio!');
      expect(message).toContain('orçamento personalizado');
    });

    it('should include product and category details when provided', () => {
      const message = formatWhatsAppMessage({
        phoneNumber: DEFAULT_STUDIO_PHONE,
        productName: 'Caneca Cerâmica Fosca',
        categoryTitle: 'Canecas',
      });
      expect(message).toContain('Produto de interesse: *Caneca Cerâmica Fosca*');
      expect(message).toContain('Categoria: *Canecas*');
    });

    it('should include mockup URL reference when provided', () => {
      const message = formatWhatsAppMessage({
        phoneNumber: DEFAULT_STUDIO_PHONE,
        mockupUrl: 'https://example.test/mockup-temp/quadro-123.jpg',
      });
      expect(message).toContain('Referência/Mockup: https://example.test/mockup-temp/quadro-123.jpg');
    });

    it('should return custom message directly when provided', () => {
      const message = formatWhatsAppMessage({
        phoneNumber: DEFAULT_STUDIO_PHONE,
        customMessage: '   Mensagem customizada direta   ',
      });
      expect(message).toBe('Mensagem customizada direta');
    });
  });

  describe('buildWhatsAppLink', () => {
    it('should generate valid WhatsApp URL with encoded message', () => {
      const link = buildWhatsAppLink({
        phoneNumber: '+55 (11) 99999-9999',
        productName: 'Quadro Decorativo 30x40',
      });
      expect(link.startsWith('https://wa.me/5511999999999?text=')).toBe(true);
      expect(link).toContain(encodeURIComponent('Quadro Decorativo 30x40'));
    });

    it('should use default phone number when none is supplied', () => {
      const link = buildWhatsAppLink();
      expect(link.startsWith(`https://wa.me/${DEFAULT_STUDIO_PHONE}?text=`)).toBe(true);
    });
  });
});

