import { describe, it, expect } from 'vitest';
import {
  MUG_PRINT_DIMENSIONS,
  FRAME_DIMENSIONS,
  getAspectRatio,
  clampValue,
  calculateBoundedOffset,
  buildMockupWhatsAppMessage,
} from './customizer';

describe('Customizer Utilities', () => {
  describe('getAspectRatio', () => {
    it('should calculate mug print area aspect ratio for 20x9 cm', () => {
      const ratio = getAspectRatio(MUG_PRINT_DIMENSIONS);
      expect(ratio).toBeCloseTo(2.2222, 2);
    });

    it('should calculate frame aspect ratio for 30x40 cm', () => {
      const ratio = getAspectRatio(FRAME_DIMENSIONS);
      expect(ratio).toBe(0.75);
    });

    it('should return fallback 1 when height is zero or negative', () => {
      expect(getAspectRatio({ widthCm: 10, heightCm: 0 })).toBe(1);
    });
  });

  describe('clampValue and calculateBoundedOffset', () => {
    it('should clamp values between min and max bounds', () => {
      expect(clampValue(0.5, 1, 3)).toBe(1);
      expect(clampValue(2, 1, 3)).toBe(2);
      expect(clampValue(4, 1, 3)).toBe(3);
    });

    it('should constrain offset within symmetric range', () => {
      expect(calculateBoundedOffset(150, 100)).toBe(100);
      expect(calculateBoundedOffset(-120, 100)).toBe(-100);
      expect(calculateBoundedOffset(50, 100)).toBe(50);
    });
  });

  describe('buildMockupWhatsAppMessage', () => {
    it('should format message containing product title and mockup url', () => {
      const message = buildMockupWhatsAppMessage(
        'Caneca Branca Personalizada',
        'https://example.test/uploads/mockups/caneca-123.png'
      );
      expect(message).toContain('*Caneca Branca Personalizada*');
      expect(message).toContain('https://example.test/uploads/mockups/caneca-123.png');
      expect(message).toContain('consultar o valor final');
    });
  });
});

