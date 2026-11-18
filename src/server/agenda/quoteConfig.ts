import { agendaFormats, agendaLayouts, agendaStyles, agendaTemplates, legalAgendaPalettes, legalAgendaTemplate } from './options.mjs';
import { computeEasterSunday, getHolidaysForYear } from '../../scripts/calendar/holidays';
import type { CoverConfig } from '../cover/coverConfig';

export const agendaProduct = 'Agenda Clássica';
export const legalAgendaProduct = 'Agenda Jurídica';
export const agendaConfigVersion = 1;
export const previewNumbers = [1, 2, 3, 4, 5, 6, 7, 8] as const;
export const isAgendaReference = (value: string) => /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/.test(value);

export type QuoteConfig = {
  template: keyof typeof agendaTemplates;
  legalPalette?: keyof typeof legalAgendaPalettes;
  legalFinance?: boolean;
  previews?: { page: number; pdfPage: number; section: string }[];
  year: number;
  format: keyof typeof agendaFormats;
  layout: keyof typeof agendaLayouts;
  style: keyof typeof agendaStyles;
  colors: { primary: string; secondary: string };
  customColors: boolean;
  watermark: boolean;
  logo: null | { originalName: string; original: 'original'; normalized: 'logo' };
  cover?: CoverConfig;
};

export type PreviewName = `preview-${typeof previewNumbers[number]}`;
export type QuoteAsset = {
  name: PreviewName | 'original' | 'logo' | 'cover_image' | 'cover_image_original';
  mime: string;
  content: Buffer;
};

export function agendaQuotePath(id: string) {
  return `/agenda/orcamento/${id}`;
}

export function agendaQuoteLabels(config: QuoteConfig) {
  const style = config.template === legalAgendaTemplate
    ? config.customColors ? 'Cores personalizadas' : legalAgendaPalettes[config.legalPalette ?? 'blue'].label
    : agendaStyles[config.style].label;
  return [String(config.year), agendaFormats[config.format].label, agendaLayouts[config.layout].label,
    config.legalFinance ? `${style} · Controle financeiro mensal` : style];
}

export function agendaLegalDates(year: number) {
  return [year, year + 1].flatMap(calendarYear => {
    const easter = computeEasterSunday(calendarYear);
    const dates = getHolidaysForYear(calendarYear, { includeGoodFriday: true });
    for (const [offset, name] of [[-47, 'Carnaval'], [0, 'Páscoa'], [60, 'Corpus Christi']] as const) {
      const date = new Date(Date.UTC(calendarYear, easter.month - 1, easter.day + offset));
      dates.push({ month: date.getUTCMonth() + 1, day: date.getUTCDate(), name, category: 'religious', source: '' });
    }
    return dates.sort((a, b) => a.month - b.month || a.day - b.day)
      .map(({ month, day, name }) => ({ year: calendarYear, month, day, name }));
  });
}

const dateFormat = new Intl.DateTimeFormat('pt-BR', {
  dateStyle: 'short', timeStyle: 'short', timeZone: 'America/Sao_Paulo',
});

export function formatAgendaQuoteDate(date: string) {
  return dateFormat.format(new Date(date));
}
