import { BLEED_MM, type RectMm } from './templates';
import type { DeskBaseConfig, DeskCalendarConfig, MonthlyPageKey, MonthlyTemplateId } from './types';

export const DEFAULT_DESK_SHEET_WIDTH_MM = 200;
export const DEFAULT_DESK_SHEET_HEIGHT_MM = 120;
export const DEFAULT_DESK_WIREO_MARGIN_MM = 14;
export const DEFAULT_DESK_BASE_FRONT_HEIGHT_MM = 36;
export const DEFAULT_DESK_BASE_FOLD_MM = 12;

export interface DeskTheme {
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
  photoWidthRatio: number;
  headerHeightMm: number;
  hasPromoBanner: boolean;
}

export const DESK_TEMPLATES: Record<MonthlyTemplateId, DeskTheme> = {
  photographic: {
    id: 'photographic',
    name: 'Fotográfico',
    description: 'Foto horizontal ampla à esquerda e grade nítida à direita.',
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
    photoWidthRatio: 0.46,
    headerHeightMm: 14,
    hasPromoBanner: false,
  },
  institutional: {
    id: 'institutional',
    name: 'Institucional',
    description: 'Cabeçalho corporativo horizontal, foto média e grade equilibrada.',
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
    photoWidthRatio: 0.38,
    headerHeightMm: 16,
    hasPromoBanner: false,
  },
  advertising: {
    id: 'advertising',
    name: 'Publicitário',
    description: 'Faixa institucional no topo, numeração forte e destaque comercial.',
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
    photoWidthRatio: 0.39,
    headerHeightMm: 18,
    hasPromoBanner: true,
  },
};

export interface DeskPageGeometry {
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
  logoBox: RectMm;
}

export interface DeskBaseGeometry {
  trimWidthMm: number;
  trimHeightMm: number;
  pageWidthMm: number;
  pageHeightMm: number;
  bleedMm: number;
  frontHeightMm: number;
  foldAllowanceMm: number;
  trimBox: RectMm;
  topBindingSafeBox: RectMm;
  frontSafeBox: RectMm;
  bottomFoldBox: RectMm;
  logoBox: RectMm;
  qrBox: RectMm;
}

/** Resolve os dados efetivos da base (herdados do anunciante ou personalizados à parte). */
export function resolveEffectiveBase(config: DeskCalendarConfig): DeskBaseConfig {
  if (!config.base.syncWithAdvertiser) return config.base;
  const adv = config.advertiser;
  return {
    ...config.base,
    primaryColor: adv.primaryColor,
    accentColor: adv.accentColor,
    name: adv.name,
    slogan: adv.slogan,
    phone: adv.phone,
    whatsapp: adv.whatsapp,
    website: adv.website,
    qrText: adv.qrText,
    showLogo: adv.visibility.showLogo,
    showName: adv.visibility.showName,
    showSlogan: adv.visibility.showSlogan,
    showPhone: adv.visibility.showPhone,
    showWhatsapp: adv.visibility.showWhatsapp,
    showWebsite: adv.visibility.showWebsite,
    showQrCode: adv.visibility.showQrCode,
  };
}

/** Calcula a geometria horizontal (padrão 200 × 120 mm) das folhas do calendário de mesa. */
export function computeDeskPageLayout(config: DeskCalendarConfig, pageKey: MonthlyPageKey): DeskPageGeometry {
  const theme = DESK_TEMPLATES[config.templateId];
  const trimWidthMm = Math.max(120, Number(config.sheetWidthMm) || DEFAULT_DESK_SHEET_WIDTH_MM);
  const trimHeightMm = Math.max(80, Number(config.sheetHeightMm) || DEFAULT_DESK_SHEET_HEIGHT_MM);
  const bleedMm = config.includeBleed ? BLEED_MM : 0;
  const pageWidthMm = trimWidthMm + bleedMm * 2;
  const pageHeightMm = trimHeightMm + bleedMm * 2;
  const wireOMarginMm = Math.max(10, Math.min(22, Number(config.wireOMarginMm) || DEFAULT_DESK_WIREO_MARGIN_MM));

  const marginX = 8;
  const marginBottom = 7;
  const trimBox: RectMm = { x: bleedMm, y: bleedMm, width: trimWidthMm, height: trimHeightMm };
  const wireOBox: RectMm = { x: bleedMm, y: bleedMm, width: trimWidthMm, height: wireOMarginMm };

  const safeTop = bleedMm + wireOMarginMm + 2;
  const safeBottom = bleedMm + trimHeightMm - marginBottom;
  const safeBox: RectMm = {
    x: bleedMm + marginX,
    y: safeTop,
    width: trimWidthMm - marginX * 2,
    height: safeBottom - safeTop,
  };

  if (pageKey === 'cover') {
    const photoW = Math.round(safeBox.width * 0.52 * 10) / 10;
    const photoBox: RectMm = { x: safeBox.x, y: safeBox.y, width: photoW, height: safeBox.height };
    const rightX = photoBox.x + photoBox.width + 6;
    const rightW = safeBox.x + safeBox.width - rightX;
    const logoBox: RectMm = { x: rightX, y: safeBox.y + 2, width: 30, height: 18 };
    const headerBox: RectMm = { x: rightX, y: safeBox.y, width: rightW, height: safeBox.height - 16 };
    const footerBox: RectMm = { x: rightX, y: safeBox.y + safeBox.height - 14, width: rightW, height: 14 };
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
      gridBox: { x: rightX, y: safeBox.y, width: rightW, height: 0 },
      footerBox,
      logoBox,
    };
  }

  const headerBox: RectMm = { x: safeBox.x, y: safeBox.y, width: safeBox.width, height: theme.headerHeightMm };
  const contentTop = headerBox.y + headerBox.height + 3.5;
  const footerHeight = 9;
  const contentHeight = safeBox.y + safeBox.height - footerHeight - contentTop - 2;
  const photoW = Math.round(safeBox.width * theme.photoWidthRatio * 10) / 10;
  const photoBox: RectMm = { x: safeBox.x, y: contentTop, width: photoW, height: contentHeight };
  const gridX = photoBox.x + photoBox.width + 5;
  const gridBox: RectMm = { x: gridX, y: contentTop, width: safeBox.x + safeBox.width - gridX, height: contentHeight };
  const footerBox: RectMm = { x: safeBox.x, y: safeBox.y + safeBox.height - footerHeight, width: safeBox.width, height: footerHeight };
  const logoBox: RectMm = { x: headerBox.x + 2, y: headerBox.y + 2, width: 22, height: headerBox.height - 4 };

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
    logoBox,
  };
}

/** Calcula a geometria parametrizada da base triangular (frente visível + regiões de dobra e fixação). */
export function computeDeskBaseGeometry(config: DeskCalendarConfig): DeskBaseGeometry {
  const trimWidthMm = Math.max(120, Number(config.sheetWidthMm) || DEFAULT_DESK_SHEET_WIDTH_MM);
  const frontHeightMm = Math.max(26, Number(config.base.frontHeightMm) || DEFAULT_DESK_BASE_FRONT_HEIGHT_MM);
  const foldAllowanceMm = Math.max(8, Number(config.base.foldAllowanceMm) || DEFAULT_DESK_BASE_FOLD_MM);
  const trimHeightMm = frontHeightMm + foldAllowanceMm * 2;
  const bleedMm = config.includeBleed ? BLEED_MM : 0;
  const pageWidthMm = trimWidthMm + bleedMm * 2;
  const pageHeightMm = trimHeightMm + bleedMm * 2;

  const trimBox: RectMm = { x: bleedMm, y: bleedMm, width: trimWidthMm, height: trimHeightMm };
  const topBindingSafeBox: RectMm = { x: bleedMm, y: bleedMm, width: trimWidthMm, height: foldAllowanceMm };
  const frontSafeBox: RectMm = {
    x: bleedMm + 8,
    y: bleedMm + foldAllowanceMm + 3,
    width: trimWidthMm - 16,
    height: frontHeightMm - 6,
  };
  const bottomFoldBox: RectMm = {
    x: bleedMm,
    y: bleedMm + foldAllowanceMm + frontHeightMm,
    width: trimWidthMm,
    height: foldAllowanceMm,
  };
  const qrSize = Math.min(24, frontSafeBox.height - 2);
  const qrBox: RectMm = {
    x: frontSafeBox.x + frontSafeBox.width - qrSize,
    y: frontSafeBox.y + (frontSafeBox.height - qrSize) / 2,
    width: qrSize,
    height: qrSize,
  };
  const logoBox: RectMm = {
    x: frontSafeBox.x,
    y: frontSafeBox.y + 1,
    width: 24,
    height: frontSafeBox.height - 2,
  };

  return {
    trimWidthMm,
    trimHeightMm,
    pageWidthMm,
    pageHeightMm,
    bleedMm,
    frontHeightMm,
    foldAllowanceMm,
    trimBox,
    topBindingSafeBox,
    frontSafeBox,
    bottomFoldBox,
    logoBox,
    qrBox,
  };
}
