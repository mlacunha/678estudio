export type CalendarModality = 'annual' | 'monthly' | 'desk';
export type CalendarFormat = 'A4' | 'A3';
export type CalendarOrientation = 'portrait' | 'landscape';
export type WeekStart = 'sunday' | 'monday';
export type CalendarTemplateId = 'minimalist' | 'photographic' | 'editorial';
export type HolidayCategory = 'federal-national' | 'religious' | 'optional' | 'local';

export interface CalendarHoliday {
  month: number; // 1..12
  day: number; // 1..31
  name: string;
  category: HolidayCategory;
  source: string;
}

export interface CalendarImagePlacement {
  scale: number; // 1.0 .. 2.5
  anchorX: number; // 0 .. 1
  anchorY: number; // 0 .. 1
}

export interface CalendarConfig {
  modality: CalendarModality;
  year: number;
  format: CalendarFormat;
  orientation: CalendarOrientation;
  weekStart: WeekStart;
  templateId: CalendarTemplateId;
  title: string;
  subtitle: string;
  includeFederalHolidays: boolean;
  includeGoodFriday: boolean;
  includeBleed: boolean;
  imagePlacement: CalendarImagePlacement;
}

export interface CalendarDayCell {
  day: number | null;
  month: number;
  year: number;
  weekdayIndex: number; // 0 = Sunday .. 6 = Saturday
  isWeekend: boolean;
  isSunday: boolean;
  holiday: CalendarHoliday | null;
}

export interface CalendarMonthGrid {
  month: number; // 1..12
  name: string;
  shortName: string;
  daysInMonth: number;
  weeks: CalendarDayCell[][];
}

export interface AnnualCalendarData {
  year: number;
  isLeap: boolean;
  totalDays: number;
  weekStart: WeekStart;
  weekdayLabels: string[];
  holidays: CalendarHoliday[];
  months: CalendarMonthGrid[];
}

export type MonthlyTemplateId = 'photographic' | 'institutional' | 'advertising';
export type MonthlyPageKey = 'cover' | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12;

export interface AdvertiserVisibility {
  showLogo: boolean;
  showName: boolean;
  showSlogan: boolean;
  showPhone: boolean;
  showWhatsapp: boolean;
  showWebsite: boolean;
  showAddress: boolean;
  showQrCode: boolean;
}

export interface AdvertiserIdentity {
  name: string;
  slogan: string;
  phone: string;
  whatsapp: string;
  website: string;
  address: string;
  qrText: string;
  primaryColor: string;
  accentColor: string;
  visibility: AdvertiserVisibility;
}

export interface MonthlyCalendarConfig {
  year: number;
  format: 'A4';
  orientation: 'portrait';
  weekStart: WeekStart;
  templateId: MonthlyTemplateId;
  includeCover: boolean;
  includeFederalHolidays: boolean;
  includeGoodFriday: boolean;
  includeBleed: boolean;
  wireOMarginMm: number; // padrão 18 mm, configurável
  advertiser: AdvertiserIdentity;
  sharedPlacement: CalendarImagePlacement;
}

export interface DeskBaseConfig {
  syncWithAdvertiser: boolean;
  primaryColor: string;
  accentColor: string;
  name: string;
  slogan: string;
  phone: string;
  whatsapp: string;
  website: string;
  qrText: string;
  showLogo: boolean;
  showName: boolean;
  showSlogan: boolean;
  showPhone: boolean;
  showWhatsapp: boolean;
  showWebsite: boolean;
  showQrCode: boolean;
  frontHeightMm: number;
  foldAllowanceMm: number;
}

export interface DeskCalendarConfig {
  year: number;
  sheetWidthMm: number; // padrão 200 mm, parametrizável
  sheetHeightMm: number; // padrão 120 mm, parametrizável
  weekStart: WeekStart;
  templateId: MonthlyTemplateId;
  includeCover: boolean;
  includeFederalHolidays: boolean;
  includeGoodFriday: boolean;
  includeBleed: boolean;
  wireOMarginMm: number; // padrão 14 mm para mesa
  advertiser: AdvertiserIdentity;
  base: DeskBaseConfig;
  sharedPlacement: CalendarImagePlacement;
}
