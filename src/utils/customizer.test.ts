import { describe, it, expect } from 'vitest';
import {
  MUG_PRINT_DIMENSIONS,
  MUG_PRINT_WIDTHS,
  FRAME_DIMENSIONS,
  getMugPrintBand,
  getAspectRatio,
  clampValue,
  calculateBoundedOffset,
  buildMockupWhatsAppMessage,
} from './customizer';

describe('Customizer Utilities', () => {
  describe('getAspectRatio', () => {
    it('should calculate the default mug print area aspect ratio for 21x9 cm', () => {
      const ratio = getAspectRatio(MUG_PRINT_DIMENSIONS);
      expect(ratio).toBeCloseTo(21 / 9, 4);
    });

    it('should calculate frame aspect ratio for 30x40 cm', () => {
      const ratio = getAspectRatio(FRAME_DIMENSIONS);
      expect(ratio).toBe(0.75);
    });

    it('should return fallback 1 when height is zero or negative', () => {
      expect(getAspectRatio({ widthCm: 10, heightCm: 0 })).toBe(1);
    });
  });

  it('widens only the print arc and leaves an equal clearance on both sides of the handle', () => {
    const bands = MUG_PRINT_WIDTHS.map(getMugPrintBand);
    expect(bands.map(band => band.height)).toEqual([1.98, 1.98, 1.98]);
    expect(bands[1].thetaLength / bands[0].thetaLength).toBeCloseTo(21 / 20);
    expect(bands[2].thetaLength / bands[0].thetaLength).toBeCloseTo(22 / 20);
    for (const band of bands) {
      const left = band.thetaStart - Math.PI / 2;
      const right = Math.PI * 2.5 - (band.thetaStart + band.thetaLength);
      expect(left).toBeCloseTo(right);
      expect(left).toBeGreaterThan(Math.PI / 12);
    }
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

