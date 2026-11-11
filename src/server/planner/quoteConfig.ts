import { plannerFormats, plannerModels, plannerModes, plannerStyles, plannerTypographies } from './options.mjs';

export const plannerProduct = 'Planner Essencial';
export const plannerConfigVersion = 1;
export const plannerPreviewSections = [
  'abertura',
  'anual',
  'mensal',
  'semanal',
  'habitos',
  'financeiro',
  'revisao',
  'anotacoes',
] as const;

export type PlannerPreviewSection = typeof plannerPreviewSections[number];

export const isPlannerReference = (value: string): boolean =>
  /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/.test(value);

export type PlannerQuoteConfig = {
  template: 'planner-essencial-v1';
  model: keyof typeof plannerModels;
  mode: keyof typeof plannerModes;
  year?: number;
  format: keyof typeof plannerFormats;
  style: keyof typeof plannerStyles;
  typography?: keyof typeof plannerTypographies;
  colors: { primary: string; secondary: string; accent: string };
  customColors: boolean;
  watermark?: boolean;
  personalizationName?: string;
  logo: null | { originalName: string; original: 'original'; normalized: 'logo' };
  sections?: string[];
};

export type PlannerAssetRole =
  | 'original'
  | 'logo'
  | `preview-${PlannerPreviewSection}`;

export type PlannerQuoteAsset = {
  name: PlannerAssetRole;
  mime: string;
  content: Buffer;
};

export function plannerQuotePath(id: string): string {
  return `/planner/orcamento/${id}`;
}

export function plannerQuoteLabels(config: PlannerQuoteConfig): string[] {
  const modeLabel = config.mode === 'dated' && config.year ? String(config.year) : plannerModes.undated.label;
  const typoLabel = plannerTypographies[config.typography ?? 'modern']?.label ?? 'Moderna';
  return [
    plannerModels[config.model]?.label ?? plannerProduct,
    modeLabel,
    plannerStyles[config.style]?.label ?? 'Clássico',
    typoLabel,
    plannerFormats[config.format]?.label ?? 'A5',
  ];
}

const dateFormat = new Intl.DateTimeFormat('pt-BR', {
  dateStyle: 'short',
  timeStyle: 'short',
  timeZone: 'America/Sao_Paulo',
});

export function formatPlannerQuoteDate(date: string): string {
  return dateFormat.format(new Date(date));
}

