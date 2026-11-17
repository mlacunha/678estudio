import type {
  CalendarConfig,
  CalendarFormat,
  CalendarImagePlacement,
  CalendarOrientation,
  CalendarTemplateId,
} from './types';

export const MM_TO_PT = 72 / 25.4;
export const BLEED_MM = 3;
export const SAFE_MARGIN_MM = 12;

export const PAPER_SIZES_MM: Record<CalendarFormat, { width: number; height: number }> = {
  A4: { width: 210, height: 297 },
  A3: { width: 297, height: 420 },
};

export interface RectMm {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface CalendarTemplateTheme {
  id: CalendarTemplateId;
  name: string;
  description: string;
  pageBg: string;
  cardBg: string;
  cardBorder: string;
  photoBg: string;
  photoBorder: string;
  ink: string;
  inkMuted: string;
  accent: string;
  weekendInk: string;
  holidayFill: string;
  holidayInk: string;
  religiousFill: string;
  religiousInk: string;
  divider: string;
  headingFont: 'sans' | 'serif';
  photoRatioPortrait: number; // % da área útil vertical destinada à foto
  photoRatioLandscape: number; // % da área útil horizontal destinada à foto
  fullBleedPhoto: boolean;
}

export const CALENDAR_TEMPLATES: Record<CalendarTemplateId, CalendarTemplateTheme> = {
  minimalist: {
    id: 'minimalist',
    name: 'Minimalista',
    description: 'Linhas finas, respiro generoso e tipografia limpa.',
    pageBg: '#ffffff',
    cardBg: '#ffffff',
    cardBorder: '#e7e5e4',
    photoBg: '#f5f5f4',
    photoBorder: '#d6d3d1',
    ink: '#1c1917',
    inkMuted: '#78716c',
    accent: '#b45309',
    weekendInk: '#78716c',
    holidayFill: '#fef3c7',
    holidayInk: '#92400e',
    religiousFill: '#f5f5f4',
    religiousInk: '#57534e',
    divider: '#e7e5e4',
    headingFont: 'sans',
    photoRatioPortrait: 0.25,
    photoRatioLandscape: 0.30,
    fullBleedPhoto: false,
  },
  photographic: {
    id: 'photographic',
    name: 'Fotográfico',
    description: 'Destaque amplo para fotografia ou ilustração em moldura cheia.',
    pageBg: '#fafaf9',
    cardBg: '#ffffff',
    cardBorder: '#e7e5e4',
    photoBg: '#e7e5e4',
    photoBorder: '#d6d3d1',
    ink: '#18181b',
    inkMuted: '#52525b',
    accent: '#0f766e',
    weekendInk: '#71717a',
    holidayFill: '#ccfbf1',
    holidayInk: '#115e59',
    religiousFill: '#f4f4f5',
    religiousInk: '#3f3f46',
    divider: '#d4d4d8',
    headingFont: 'sans',
    photoRatioPortrait: 0.34,
    photoRatioLandscape: 0.38,
    fullBleedPhoto: true,
  },
  editorial: {
    id: 'editorial',
    name: 'Editorial elegante',
    description: 'Papel creme suave, cabeçalho clássico em serifa e acento terracota.',
    pageBg: '#faf7f2',
    cardBg: '#fffdf9',
    cardBorder: '#e5ddd0',
    photoBg: '#f1ebe0',
    photoBorder: '#c9bba6',
    ink: '#29211b',
    inkMuted: '#6d5e52',
    accent: '#8b3a2b',
    weekendInk: '#7c6b5d',
    holidayFill: '#f5dfd9',
    holidayInk: '#7a2e20',
    religiousFill: '#efe8dc',
    religiousInk: '#5c4d41',
    divider: '#ddd3c3',
    headingFont: 'serif',
    photoRatioPortrait: 0.27,
    photoRatioLandscape: 0.32,
    fullBleedPhoto: false,
  },
};

export interface AnnualLayoutGeometry {
  trimWidthMm: number;
  trimHeightMm: number;
  pageWidthMm: number;
  pageHeightMm: number;
  bleedMm: number;
  trimBox: RectMm;
  safeBox: RectMm;
  photoBox: RectMm;
  headerBox: RectMm;
  gridBox: RectMm;
  footerBox: RectMm;
  gridCols: number;
  gridRows: number;
}

export function getTrimDimensionsMm(format: CalendarFormat, orientation: CalendarOrientation) {
  const base = PAPER_SIZES_MM[format];
  return orientation === 'landscape'
    ? { widthMm: base.height, heightMm: base.width }
    : { widthMm: base.width, heightMm: base.height };
}

/** Calcula a geometria compartilhada entre a prévia SVG e o PDF vetorial. */
export function computeAnnualLayout(config: CalendarConfig): AnnualLayoutGeometry {
  const theme = CALENDAR_TEMPLATES[config.templateId];
  const { widthMm: trimWidthMm, heightMm: trimHeightMm } = getTrimDimensionsMm(config.format, config.orientation);
  const bleedMm = config.includeBleed ? BLEED_MM : 0;
  const pageWidthMm = trimWidthMm + bleedMm * 2;
  const pageHeightMm = trimHeightMm + bleedMm * 2;

  const trimBox: RectMm = { x: bleedMm, y: bleedMm, width: trimWidthMm, height: trimHeightMm };
  const safeBox: RectMm = {
    x: bleedMm + SAFE_MARGIN_MM,
    y: bleedMm + SAFE_MARGIN_MM,
    width: trimWidthMm - SAFE_MARGIN_MM * 2,
    height: trimHeightMm - SAFE_MARGIN_MM * 2,
  };

  const footerHeight = 10;
  const headerHeight = config.orientation === 'landscape' ? 16 : 18;
  const gap = 5;

  if (config.orientation === 'landscape') {
    const leftColW = Math.round(safeBox.width * theme.photoRatioLandscape * 10) / 10;
    const photoBox: RectMm = theme.fullBleedPhoto
      ? { x: 0, y: 0, width: bleedMm + SAFE_MARGIN_MM + leftColW, height: pageHeightMm }
      : { x: safeBox.x, y: safeBox.y, width: leftColW, height: safeBox.height - footerHeight - 2 };

    const rightX = (theme.fullBleedPhoto ? bleedMm + SAFE_MARGIN_MM + leftColW : photoBox.x + photoBox.width) + gap + 2;
    const rightW = safeBox.x + safeBox.width - rightX;
    const headerBox: RectMm = { x: rightX, y: safeBox.y, width: rightW, height: headerHeight };
    const gridY = headerBox.y + headerHeight + gap;
    const gridH = safeBox.y + safeBox.height - footerHeight - gridY;
    const gridBox: RectMm = { x: rightX, y: gridY, width: rightW, height: gridH };
    const footerBox: RectMm = { x: safeBox.x, y: safeBox.y + safeBox.height - footerHeight + 2, width: safeBox.width, height: footerHeight - 2 };

    return {
      trimWidthMm,
      trimHeightMm,
      pageWidthMm,
      pageHeightMm,
      bleedMm,
      trimBox,
      safeBox,
      photoBox,
      headerBox,
      gridBox,
      footerBox,
      gridCols: 4,
      gridRows: 3,
    };
  }

  // Portrait (3 colunas × 4 linhas)
  const photoH = Math.round(safeBox.height * theme.photoRatioPortrait * 10) / 10;
  const photoBox: RectMm = theme.fullBleedPhoto
    ? { x: 0, y: 0, width: pageWidthMm, height: bleedMm + SAFE_MARGIN_MM + photoH }
    : { x: safeBox.x, y: safeBox.y, width: safeBox.width, height: photoH };

  const headerY = (theme.fullBleedPhoto ? bleedMm + SAFE_MARGIN_MM + photoH : photoBox.y + photoBox.height) + gap;
  const headerBox: RectMm = { x: safeBox.x, y: headerY, width: safeBox.width, height: headerHeight };
  const gridY = headerBox.y + headerHeight + gap;
  const gridH = safeBox.y + safeBox.height - footerHeight - gridY;
  const gridBox: RectMm = { x: safeBox.x, y: gridY, width: safeBox.width, height: gridH };
  const footerBox: RectMm = { x: safeBox.x, y: safeBox.y + safeBox.height - footerHeight + 2, width: safeBox.width, height: footerHeight - 2 };

  return {
    trimWidthMm,
    trimHeightMm,
    pageWidthMm,
    pageHeightMm,
    bleedMm,
    trimBox,
    safeBox,
    photoBox,
    headerBox,
    gridBox,
    footerBox,
    gridCols: 3,
    gridRows: 4,
  };
}

/** Calcula o retângulo de enquadramento cover dentro de uma caixa alvo, idêntico na prévia e no PDF. */
export function computeCoverCropRect(
  srcWidth: number,
  srcHeight: number,
  box: RectMm,
  placement: CalendarImagePlacement,
): RectMm {
  const safeSrcW = Math.max(1, srcWidth);
  const safeSrcH = Math.max(1, srcHeight);
  const scale = Math.max(1, Math.min(2.5, placement.scale || 1));
  const anchorX = Math.max(0, Math.min(1, placement.anchorX ?? 0.5));
  const anchorY = Math.max(0, Math.min(1, placement.anchorY ?? 0.5));

  const coverFactor = Math.max(box.width / safeSrcW, box.height / safeSrcH) * scale;
  const drawW = safeSrcW * coverFactor;
  const drawH = safeSrcH * coverFactor;

  return {
    x: box.x + (box.width - drawW) * anchorX,
    y: box.y + (box.height - drawH) * anchorY,
    width: drawW,
    height: drawH,
  };
}
