import {
  coverStyles,
  coverTypographies,
  defaultCoverColors,
} from './options.mjs';

export interface CoverColors {
  primary: string;
  secondary: string;
  text: string;
  accent?: string;
}

export interface CoverCrop {
  zoom: number; // 100 a 250 (%)
  offsetX: number; // -100 a 100 (%)
  offsetY: number; // -100 a 100 (%)
}

export interface CoverConfig {
  style: 'classic' | 'modern' | 'photographic';
  typography: 'modern' | 'geometric' | 'editorial';
  title: string;
  name: string;
  subtitle?: string;
  colors: CoverColors;
  hasCustomImage: boolean;
  imageCrop?: CoverCrop;
  origin?: 'custom_upload' | 'studio_library';
  libraryAssetId?: string;
}

// Relative luminance and WCAG 2.1 contrast calculation
export function hexToRgb(hex: string): { r: number; g: number; b: number } | null {
  const clean = hex.replace('#', '').trim();
  if (!/^[0-9a-fA-F]{3}$|^[0-9a-fA-F]{6}$/.test(clean)) return null;
  const full = clean.length === 3 ? clean.split('').map(c => c + c).join('') : clean;
  const num = parseInt(full, 16);
  return {
    r: (num >> 16) & 255,
    g: (num >> 8) & 255,
    b: num & 255,
  };
}

export function relativeLuminance(r: number, g: number, b: number): number {
  const [rs, gs, bs] = [r, g, b].map(c => {
    const s = c / 255;
    return s <= 0.03928 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
  });
  return 0.2126 * rs + 0.7152 * gs + 0.0722 * bs;
}

export function getContrastRatio(hex1: string, hex2: string): number {
  const rgb1 = hexToRgb(hex1);
  const rgb2 = hexToRgb(hex2);
  if (!rgb1 || !rgb2) return 1;
  const lum1 = relativeLuminance(rgb1.r, rgb1.g, rgb1.b);
  const lum2 = relativeLuminance(rgb2.r, rgb2.g, rgb2.b);
  const brightest = Math.max(lum1, lum2);
  const darkest = Math.min(lum1, lum2);
  return (brightest + 0.05) / (darkest + 0.05);
}

export function validateCoverColors(colors: Partial<CoverColors>): CoverColors {
  const primary = colors.primary && /^#[0-9a-fA-F]{6}$/.test(colors.primary) ? colors.primary : defaultCoverColors.primary;
  const secondary = colors.secondary && /^#[0-9a-fA-F]{6}$/.test(colors.secondary) ? colors.secondary : defaultCoverColors.secondary;
  let text = colors.text && /^#[0-9a-fA-F]{6}$/.test(colors.text) ? colors.text : defaultCoverColors.text;

  // Garantir contraste mínimo de 3:1 com a cor primária de fundo
  const ratio = getContrastRatio(text, primary);
  if (ratio < 3.0) {
    const whiteRatio = getContrastRatio('#ffffff', primary);
    const darkRatio = getContrastRatio('#111827', primary);
    text = whiteRatio >= darkRatio ? '#ffffff' : '#111827';
  }

  const accent = colors.accent && /^#[0-9a-fA-F]{6}$/.test(colors.accent) ? colors.accent : defaultCoverColors.accent;

  return { primary, secondary, text, accent };
}

export function parseCoverCrop(input: any): CoverCrop {
  if (!input || typeof input !== 'object') {
    return { zoom: 100, offsetX: 0, offsetY: 0 };
  }
  const zoom = Math.min(250, Math.max(100, Number(input.zoom) || 100));
  const offsetX = Math.min(100, Math.max(-100, Number(input.offsetX) || 0));
  const offsetY = Math.min(100, Math.max(-100, Number(input.offsetY) || 0));
  return { zoom, offsetX, offsetY };
}

export function parseCoverConfig(input: any): CoverConfig {
  if (!input || typeof input !== 'object') {
    return {
      style: 'classic',
      typography: 'editorial',
      title: '678 Estudio',
      name: '',
      subtitle: '',
      colors: defaultCoverColors,
      hasCustomImage: false,
      imageCrop: { zoom: 100, offsetX: 0, offsetY: 0 },
      origin: 'custom_upload',
    };
  }

  const style = (input.style in coverStyles ? input.style : 'classic') as CoverConfig['style'];
  const typography = (input.typography in coverTypographies ? input.typography : 'editorial') as CoverConfig['typography'];
  const title = typeof input.title === 'string' ? input.title.trim().slice(0, 100) : '';
  const name = typeof input.name === 'string' ? input.name.trim().slice(0, 80) : '';
  const subtitle = typeof input.subtitle === 'string' ? input.subtitle.trim().slice(0, 80) : undefined;
  const colors = validateCoverColors(input.colors || {});
  const hasCustomImage = Boolean(input.hasCustomImage);
  const imageCrop = parseCoverCrop(input.imageCrop);
  const origin = input.origin === 'studio_library' ? 'studio_library' : 'custom_upload';
  const libraryAssetId = typeof input.libraryAssetId === 'string' ? input.libraryAssetId : undefined;

  return {
    style,
    typography,
    title,
    name,
    subtitle,
    colors,
    hasCustomImage,
    imageCrop,
    origin,
    libraryAssetId,
  };
}
