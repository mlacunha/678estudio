import { agendaFormats, agendaLayouts, agendaStyles } from './options.mjs';
import type { CoverConfig } from '../cover/coverConfig';

export const agendaProduct = 'Agenda Clássica';
export const agendaConfigVersion = 1;
export const previewNumbers = [1, 2, 3, 4, 5, 6, 7, 8] as const;
export const isAgendaReference = (value: string) => /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/.test(value);

export type QuoteConfig = {
  template: 'agenda-classica-v1' | 'agenda-classica-v2';
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
  return [String(config.year), agendaFormats[config.format].label, agendaLayouts[config.layout].label, agendaStyles[config.style].label];
}

const dateFormat = new Intl.DateTimeFormat('pt-BR', {
  dateStyle: 'short', timeStyle: 'short', timeZone: 'America/Sao_Paulo',
});

export function formatAgendaQuoteDate(date: string) {
  return dateFormat.format(new Date(date));
}
