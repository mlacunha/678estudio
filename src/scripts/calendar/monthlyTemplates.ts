import { BLEED_MM, PAPER_SIZES_MM, SAFE_MARGIN_MM, type RectMm } from './templates';
import type { MonthlyCalendarConfig, MonthlyPageKey, MonthlyTemplateId } from './types';

export const DEFAULT_WIREO_MARGIN_MM = 18;

export interface MonthlyTemplateTheme {
  id: MonthlyTemplateId;
  name: string;
  description: string;
  pageBg: string;
  cardBg: string;
  cardBorder: string;
  ink: string;
  inkMuted: string;
  weekendInk: string;
  holidayFill: string;
  holidayInk: string;
  religiousFill: string;
  religiousInk: string;
  headingFont: 'sans' | 'serif';
  headerHeightMm: number;
  photoHeightMm: number;
  footerHeightMm: number;
  qrSizeMm: number;
  hasPromoBanner: boolean;
}

export const MONTHLY_TEMPLATES: Record<MonthlyTemplateId, MonthlyTemplateTheme> = {
  photographic: {
    id: 'photographic',
    name: 'Fotográfico',
    description: 'Foto ampla do mês com faixa sutil de título e rodapé compacto.',
    pageBg: '#ffffff',
    cardBg: '#ffffff',
    cardBorder: '#e7e5e4',
    ink: '#1c1917',
    inkMuted: '#57534e',
    weekendInk: '#78716c',
    holidayFill: '#fef3c7',
    holidayInk: '#92400e',
    religiousFill: '#f5f5f4',
    religiousInk: '#57534e',
    headingFont: 'sans',
    headerHeightMm: 14,
    photoHeightMm: 112,
    footerHeightMm: 30,
    qrSizeMm: 22,
    hasPromoBanner: false,
  },
  institutional: {
    id: 'institutional',
    name: 'Institucional',
    description: 'Cabeçalho com marca e slogan, grade equilibrada e rodapé completo.',
    pageBg: '#fcfbf9',
    cardBg: '#ffffff',
    cardBorder: '#e5e0d8',
    ink: '#1f2937',
    inkMuted: '#4b5563',
    weekendInk: '#6b7280',
    holidayFill: '#e0f2fe',
    holidayInk: '#075985',
    religiousFill: '#f3f4f6',
    religiousInk: '#4b5563',
    headingFont: 'serif',
    headerHeightMm: 24,
    photoHeightMm: 86,
    footerHeightMm: 34,
    qrSizeMm: 24,
    hasPromoBanner: false,
  },
  advertising: {
    id: 'advertising',
    name: 'Publicitário',
    description: 'Alto impacto comercial com faixa institucional, grade forte e QR em destaque.',
    pageBg: '#ffffff',
    cardBg: '#ffffff',
    cardBorder: '#d6d3d1',
    ink: '#111827',
    inkMuted: '#4b5563',
    weekendInk: '#6b7280',
    holidayFill: '#fee2e2',
    holidayInk: '#991b1b',
    religiousFill: '#f3f4f6',
    religiousInk: '#374151',
    headingFont: 'sans',
    headerHeightMm: 28,
    photoHeightMm: 88,
    footerHeightMm: 38,
    qrSizeMm: 28,
    hasPromoBanner: true,
  },
};

export interface MonthlyPageGeometry {
  trimWidthMm: number;
  trimHeightMm: number;
  pageWidthMm: number;
  pageHeightMm: number;
  bleedMm: number;
  wireOMarginMm: number;
  trimBox: RectMm;
  wireOBox: RectMm;
  safeBox: RectMm;
  headerBox: RectMm;
  photoBox: RectMm;
  gridBox: RectMm;
  footerBox: RectMm;
  qrBox: RectMm;
  logoBox: RectMm;
}

/** Calcula o retângulo contain preservando proporção (ideal para logomarcas com transparência). */
export function computeContainRect(srcWidth: number, srcHeight: number, box: RectMm): RectMm {
  const w = Math.max(1, srcWidth);
  const h = Math.max(1, srcHeight);
  const factor = Math.min(box.width / w, box.height / h);
  const drawW = w * factor;
  const drawH = h * factor;
  return {
    x: box.x + (box.width - drawW) / 2,
    y: box.y + (box.height - drawH) / 2,
    width: drawW,
    height: drawH,
  };
}

/** Calcula a geometria A4 Retrato compartilhada entre prévia SVG e PDF multipágina Wire-O. */
export function computeMonthlyPageLayout(
  config: MonthlyCalendarConfig,
  pageKey: MonthlyPageKey,
): MonthlyPageGeometry {
  const theme = MONTHLY_TEMPLATES[config.templateId];
  const base = PAPER_SIZES_MM[config.format];
  const trimWidthMm = base.width;
  const trimHeightMm = base.height;
  const bleedMm = config.includeBleed ? BLEED_MM : 0;
  const pageWidthMm = trimWidthMm + bleedMm * 2;
  const pageHeightMm = trimHeightMm + bleedMm * 2;
  const wireOMarginMm = Math.max(12, Math.min(26, Number(config.wireOMarginMm) || DEFAULT_WIREO_MARGIN_MM));

  const trimBox: RectMm = { x: bleedMm, y: bleedMm, width: trimWidthMm, height: trimHeightMm };
  const wireOBox: RectMm = { x: bleedMm, y: bleedMm, width: trimWidthMm, height: wireOMarginMm };

  const safeTop = bleedMm + wireOMarginMm + 3;
  const safeBottom = bleedMm + trimHeightMm - SAFE_MARGIN_MM;
  const safeBox: RectMm = {
    x: bleedMm + SAFE_MARGIN_MM,
    y: safeTop,
    width: trimWidthMm - SAFE_MARGIN_MM * 2,
    height: safeBottom - safeTop,
  };

  if (pageKey === 'cover') {
    const headerBox: RectMm = { x: safeBox.x, y: safeBox.y, width: safeBox.width, height: 32 };
    const footerBox: RectMm = {
      x: safeBox.x,
      y: safeBox.y + safeBox.height - theme.footerHeightMm,
      width: safeBox.width,
      height: theme.footerHeightMm,
    };
    const photoY = headerBox.y + headerBox.height + 6;
    const photoBox: RectMm = {
      x: safeBox.x,
      y: photoY,
      width: safeBox.width,
      height: footerBox.y - photoY - 8,
    };
    const qrBox: RectMm = {
      x: footerBox.x + footerBox.width - theme.qrSizeMm - 2,
      y: footerBox.y + (footerBox.height - theme.qrSizeMm) / 2,
      width: theme.qrSizeMm,
      height: theme.qrSizeMm,
    };
    const logoBox: RectMm = { x: safeBox.x, y: safeBox.y + 2, width: 34, height: 22 };
    return {
      trimWidthMm,
      trimHeightMm,
      pageWidthMm,
      pageHeightMm,
      bleedMm,
      wireOMarginMm,
      trimBox,
      wireOBox,
      safeBox,
      headerBox,
      photoBox,
      gridBox: { x: safeBox.x, y: photoY, width: safeBox.width, height: 0 },
      footerBox,
      qrBox,
      logoBox,
    };
  }

  const gap = 4.5;
  const headerBox: RectMm = { x: safeBox.x, y: safeBox.y, width: safeBox.width, height: theme.headerHeightMm };
  const photoBox: RectMm = {
    x: safeBox.x,
    y: headerBox.y + headerBox.height + gap,
    width: safeBox.width,
    height: theme.photoHeightMm,
  };
  const footerBox: RectMm = {
    x: safeBox.x,
    y: safeBox.y + safeBox.height - theme.footerHeightMm,
    width: safeBox.width,
    height: theme.footerHeightMm,
  };
  const gridY = photoBox.y + photoBox.height + gap;
  const gridBox: RectMm = {
    x: safeBox.x,
    y: gridY,
    width: safeBox.width,
    height: footerBox.y - gridY - gap,
  };
  const qrBox: RectMm = {
    x: footerBox.x + footerBox.width - theme.qrSizeMm - 2,
    y: footerBox.y + (footerBox.height - theme.qrSizeMm) / 2,
    width: theme.qrSizeMm,
    height: theme.qrSizeMm,
  };
  const logoBox: RectMm = theme.hasPromoBanner
    ? { x: headerBox.x + 3, y: headerBox.y + 3, width: 28, height: headerBox.height - 6 }
    : { x: footerBox.x + 2, y: footerBox.y + 3, width: 26, height: footerBox.height - 6 };

  return {
    trimWidthMm,
    trimHeightMm,
    pageWidthMm,
    pageHeightMm,
    bleedMm,
    wireOMarginMm,
    trimBox,
    wireOBox,
    safeBox,
    headerBox,
    photoBox,
    gridBox,
    footerBox,
    qrBox,
    logoBox,
  };
}
