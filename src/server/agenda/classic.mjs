import { execFile } from 'node:child_process';
import { cp, mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { promisify } from 'node:util';
import { agendaFormats, agendaLayouts, agendaStyles } from './options.mjs';

const run = promisify(execFile);

export const classicLayouts = Object.keys(agendaLayouts);
export function agendaPreviewSections({ year, layout }) {
  const start = new Date(Date.UTC(year, 0, 1));
  const days = (new Date(Date.UTC(year + 1, 0, 1)) - start) / 86400000;
  const weekday = (start.getUTCDay() + 6) % 7;
  const count = layout === 'daily-1dpp' ? days : layout === 'daily-2dpp' ? Math.ceil(days / 2) : Math.ceil((days + weekday) / 7);
  /** @type {[number, string][]} */
  const sections = [
    [1, 'Abertura'], [2, 'Calendário anual'], [3, 'Dados pessoais'], [4, 'Planejamento mensal'],
    [16, layout === 'weekly' ? 'Layout semanal' : 'Layout diário'], [17, 'Continuação do layout'],
    [16 + count, 'Controle financeiro'], [17 + count, 'Anotações'],
  ];
  return sections.map(([pdfPage, section], index) => ({ page: index + 1, pdfPage, section }));
}

/** @typedef {{ layout: string, year: number, style?: string, format?: string,
 * colors?: { primary: string, secondary: string }, customColors?: boolean, logo?: Buffer, watermark?: boolean, template?: string }} AgendaConfig */

/** @param {unknown} color */
export function isAgendaColor(color) {
  if (typeof color !== 'string' || !/^#[0-9a-f]{6}$/i.test(color)) return false;
  const [r, g, b] = [1, 3, 5].map(start => {
    const channel = Number.parseInt(color.slice(start, start + 2), 16) / 255;
    return channel <= 0.04045 ? channel / 12.92 : ((channel + 0.055) / 1.055) ** 2.4;
  });
  return 1.05 / (0.2126 * r + 0.7152 * g + 0.0722 * b + 0.05) >= 3;
}

/** @param {unknown} layout @param {unknown} year */
export function isClassicAgendaConfig(layout, year) {
  return typeof layout === 'string' && classicLayouts.includes(layout)
    && typeof year === 'number' && Number.isInteger(year) && year >= 1900 && year <= 9998;
}

/**
 * @param {AgendaConfig} config
 * @param {{ pages: number[], output: string, prefix?: boolean }} [preview]
 */
export async function compileClassicAgenda(config, preview) {
  const { layout, year, style = 'classic', format = 'a5', colors, customColors = Boolean(colors), logo, watermark } = config;
  if (!isClassicAgendaConfig(layout, year) || !Object.hasOwn(agendaStyles, style)
    || !Object.hasOwn(agendaFormats, format) || (watermark && !logo)
    || (config.template !== undefined && !['agenda-classica-v1', 'agenda-classica-v2'].includes(config.template))
    || (colors && (!isAgendaColor(colors.primary) || !isAgendaColor(colors.secondary)))) {
    throw new RangeError('Configuração de agenda inválida.');
  }

  const templates = resolve('src/server/agenda/typst');
  const workspace = logo ? await mkdtemp(join(tmpdir(), '678-agenda-logo-')) : undefined;
  try {
    const root = workspace ?? templates;
    if (workspace) {
      await cp(templates, workspace, { recursive: true });
      await writeFile(join(workspace, 'logo.png'), logo);
    }
    const args = [
      'compile', '--root', root,
      '--font-path', resolve(templates, 'fonts'), '--ignore-system-fonts', '--ignore-embedded-fonts',
      '--jobs', '2', '--input', `layout=${layout}`, '--input', `year=${year}`,
      '--input', `style=${style}`, '--input', `format=${format}`,
    ];
    const palette = colors ?? agendaStyles[/** @type {keyof typeof agendaStyles} */ (style)];
    args.push('--input', `primary=${palette.primary}`, '--input', `secondary=${palette.secondary}`);
    if (customColors) args.push('--input', 'custom-colors=true');
    if (logo) args.push('--input', 'logo=true');
    if (watermark) args.push('--input', 'watermark=true');
    if (preview?.prefix) args.push('--input', `preview-limit=${Math.max(...preview.pages)}`);
    if (preview) args.push('--format', 'png', '--pages', preview.pages.join(','));
    else args.push('--format', 'pdf');
    args.push(resolve(root, config.template === 'agenda-classica-v1' ? 'classic-v1.typ' : 'classic.typ'), preview?.output ?? '-');

    const { stdout, stderr } = await run(process.env.TYPST_BINARY || 'typst', args, {
      encoding: 'buffer',
      maxBuffer: preview?.prefix ? 256 * 1024 : 16 * 1024 * 1024,
      timeout: preview?.prefix ? 15_000 : 60_000,
      windowsHide: true,
    });
    if (stderr.length) console.warn(stderr.toString().trimEnd());
    return stdout;
  } finally {
    if (workspace) await rm(workspace, { recursive: true, force: true });
  }
}

/** @param {AgendaConfig} config */
export async function renderAgendaPreview(config) {
  const directory = await mkdtemp(join(tmpdir(), '678-agenda-preview-'));
  try {
    const sections = config.template === 'agenda-classica-v1'
      ? [1, 2, 3].map(page => ({ page, pdfPage: page, section: 'Layout da agenda' }))
      : agendaPreviewSections(config);
    await compileClassicAgenda(config, { pages: sections.map(item => item.pdfPage), output: join(directory, 'page-{p}.png') });
    return await Promise.all(sections.map(async item => {
      const image = await readFile(join(directory, `page-${item.pdfPage}.png`));
      return { ...item, src: `data:image/png;base64,${image.toString('base64')}` };
    }));
  } finally {
    await rm(directory, { recursive: true, force: true });
  }
}
