import {
  notebookFormats,
  notebookModels,
  notebookStyles,
  notebookTypographies,
} from './options.mjs';

export const notebookProduct = 'Caderno Personalizado';
export const notebookConfigVersion = 1;

export const notebookPreviewSections = [
  'abertura',
  'medidas',
  'indice',
  'ficha',
  'ficha-par',
  'intencoes',
  'escrita',
  'escrita-impar',
  'citacoes',
  'dedicatoria',
  'sumario',
  'memoria-esquerda',
  'memoria-direita',
  'recordacoes',
  'anotacoes',
] as const;

export type NotebookPreviewSection = (typeof notebookPreviewSections)[number];

export const isNotebookReference = (value: string): boolean =>
  /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/.test(value);

export type NotebookQuoteConfig = {
  template: 'caderno-personalizado-v1';
  model: keyof typeof notebookModels;
  format: keyof typeof notebookFormats;
  style: keyof typeof notebookStyles;
  typography: keyof typeof notebookTypographies;
  colors: { primary: string; secondary: string; accent: string };
  customColors: boolean;
  watermark?: boolean;
  title?: string;
  personalizationName?: string;
  dedication?: string;
  logo: null | { originalName: string; original: 'original'; normalized: 'logo' };
  sections?: string[];
};

export type NotebookAssetRole =
  | 'original'
  | 'logo'
  | `preview-${NotebookPreviewSection}`;

export type NotebookQuoteAsset = {
  name: NotebookAssetRole;
  mime: string;
  content: Buffer;
};

export function notebookQuotePath(id: string): string {
  return `/caderno/orcamento/${id}`;
}

export function notebookProductLabel(config: NotebookQuoteConfig): string {
  return notebookModels[config.model]?.label ?? notebookProduct;
}

export function notebookQuoteLabels(config: NotebookQuoteConfig): string[] {
  const modelInfo = notebookModels[config.model];
  const typoLabel = notebookTypographies[config.typography ?? 'modern']?.label ?? 'Moderna';
  return [
    modelInfo?.label ?? notebookProduct,
    notebookStyles[config.style]?.label ?? 'Clássico',
    typoLabel,
    notebookFormats[config.format]?.label ?? 'A5 (148 × 210 mm)',
  ];
}

const dateFormat = new Intl.DateTimeFormat('pt-BR', {
  dateStyle: 'short',
  timeStyle: 'short',
  timeZone: 'America/Sao_Paulo',
});

export function formatNotebookQuoteDate(date: string): string {
  return dateFormat.format(new Date(date));
}

