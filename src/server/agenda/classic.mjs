import { execFile } from 'node:child_process';
import { cp, mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { promisify } from 'node:util';
import { agendaFormats, agendaLayouts, agendaStyles } from './options.mjs';

const run = promisify(execFile);

export const classicLayouts = Object.keys(agendaLayouts);
const previewPages = [1, 2, 3];

/** @typedef {{ layout: string, year: number, style?: string, format?: string,
 * colors?: { primary: string, secondary: string }, customColors?: boolean, logo?: Buffer, watermark?: boolean }} AgendaConfig */

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
    args.push(resolve(root, 'classic.typ'), preview?.output ?? '-');

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
    await compileClassicAgenda(config, { pages: previewPages, output: join(directory, 'page-{p}.png'), prefix: true });
    return await Promise.all(previewPages.map(async page => {
      const image = await readFile(join(directory, `page-${page}.png`));
      return { page, src: `data:image/png;base64,${image.toString('base64')}` };
    }));
  } finally {
    await rm(directory, { recursive: true, force: true });
  }
}
