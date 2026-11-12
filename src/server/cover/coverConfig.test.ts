import { describe, expect, it } from 'vitest';
import {
  getContrastRatio,
  hexToRgb,
  parseCoverConfig,
  parseCoverCrop,
  validateCoverColors,
} from './coverConfig';
import { attachCoverToConfigJson, extractCoverFromConfigJson } from './quoteAdapter';

describe('Cover Configuration & Validation', () => {
  it('should parse valid hex to RGB', () => {
    expect(hexToRgb('#ffffff')).toEqual({ r: 255, g: 255, b: 255 });
    expect(hexToRgb('#000000')).toEqual({ r: 0, g: 0, b: 0 });
    expect(hexToRgb('1e293b')).toEqual({ r: 30, g: 41, b: 59 });
    expect(hexToRgb('invalid')).toBeNull();
  });

  it('should calculate accurate WCAG contrast ratio', () => {
    const blackOnWhite = getContrastRatio('#000000', '#ffffff');
    expect(blackOnWhite).toBeGreaterThan(20);

    const whiteOnDark = getContrastRatio('#ffffff', '#1e293b');
    expect(whiteOnDark).toBeGreaterThan(10);
  });

  it('should adjust text color if contrast is below 3:1', () => {
    // Texto cinza escuro sobre fundo escuro
    const adjusted = validateCoverColors({
      primary: '#1e293b',
      text: '#2d3748', // Baixo contraste
    });
    // Deve corrigir para branco
    expect(getContrastRatio(adjusted.text, adjusted.primary)).toBeGreaterThanOrEqual(3.0);
  });

  it('should clamp crop parameters between safe bounds', () => {
    const crop = parseCoverCrop({ zoom: 350, offsetX: -150, offsetY: 200 });
    expect(crop.zoom).toBe(250);
    expect(crop.offsetX).toBe(-100);
    expect(crop.offsetY).toBe(100);
  });

  it('should parse full cover configuration with fallback defaults', () => {
    const parsed = parseCoverConfig({
      style: 'modern',
      typography: 'geometric',
      title: '  Minha Agenda 2027  ',
      name: 'M. Alves',
      colors: { primary: '#1e293b' },
      hasCustomImage: true,
      imageCrop: { zoom: 120 },
    });

    expect(parsed.style).toBe('modern');
    expect(parsed.typography).toBe('geometric');
    expect(parsed.title).toBe('Minha Agenda 2027');
    expect(parsed.name).toBe('M. Alves');
    expect(parsed.hasCustomImage).toBe(true);
    expect(parsed.imageCrop?.zoom).toBe(120);
  });

  it('should extract and attach cover configuration in quote JSON seamlessly', () => {
    const originalJson = JSON.stringify({ year: 2027, layout: 'daily' });
    const coverConfig = parseCoverConfig({
      style: 'classic',
      title: 'Caderno de Testes',
      name: 'Studio',
    });

    const enrichedJson = attachCoverToConfigJson(originalJson, coverConfig);
    const retrieved = extractCoverFromConfigJson(enrichedJson);

    expect(retrieved).not.toBeNull();
    expect(retrieved?.style).toBe('classic');
    expect(retrieved?.title).toBe('Caderno de Testes');

    const parsedFull = JSON.parse(enrichedJson);
    expect(parsedFull.year).toBe(2027);
    expect(parsedFull.layout).toBe('daily');
  });
});

