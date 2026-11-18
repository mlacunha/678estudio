import { execFile } from 'node:child_process';
import { cp, mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { promisify } from 'node:util';
import { isAgendaColor } from '../agenda/classic.mjs';
import { comboPalette, comboPreviewSections, plannerModels, plannerModes, plannerStyles, plannerTypographies, plannerSections } from './options.mjs';

const run = promisify(execFile);

export const isPlannerColor = isAgendaColor;

/**
 * @typedef {{
 *   model?: string,
 *   mode?: 'dated' | 'undated',
 *   year?: number,
 *   format?: string,
 *   style?: string,
 *   typography?: 'modern' | 'geometric' | 'editorial',
 *   colors?: { primary: string, secondary: string, accent?: string },
 *   customColors?: boolean,
 *   watermark?: boolean,
 *   personalizationName?: string,
 *   logo?: Buffer,
 *   template?: string,
 *   section?: string
 * }} PlannerConfig
 */

/**
 * Compila um miolo ou páginas selecionadas via Typst CLI.
 * @param {PlannerConfig} config
 * @param {{ pages?: number[], output?: string, format?: 'pdf' | 'png' | 'svg' }} [options]
 * @returns {Promise<Buffer>}
 */
export async function compilePlanner(config, options = {}) {
  const {
    model = 'planner-essencial',
    mode = 'dated',
    year = 2027,
    format = 'a5',
    style = 'classic',
    typography = 'modern',
    colors,
    customColors = Boolean(colors),
    watermark = false,
    personalizationName = '',
    logo,
    section = 'all',
  } = config;

  if (!Object.hasOwn(plannerModels, model)) {
    throw new RangeError(`Modelo de planner inválido: ${model}`);
  }
  if (!Object.hasOwn(plannerModes, mode)) {
    throw new RangeError(`Modalidade de planner inválida: ${mode}`);
  }
  if (!Object.hasOwn(plannerStyles, style)) {
    throw new RangeError(`Estilo visual de planner inválido: ${style}`);
  }
  if (!Object.hasOwn(plannerTypographies, typography)) {
    throw new RangeError(`Tipografia de planner inválida: ${typography}`);
  }
  if (watermark && !logo) {
    throw new RangeError('A marca-d’água exige uma logomarca válida.');
  }
  if (colors && (!isPlannerColor(colors.primary) || !isPlannerColor(colors.secondary))) {
    throw new RangeError('Cores do planner com contraste insuficiente no papel.');
  }

  const templates = resolve('src/server/planner/typst');
  const fontsPath = resolve(templates, 'fonts');
  const workspace = logo ? await mkdtemp(join(tmpdir(), '678-planner-logo-')) : undefined;

  try {
    const root = workspace ?? templates;
    if (workspace) {
      await cp(templates, workspace, { recursive: true });
      await writeFile(join(workspace, 'logo.png'), logo);
    }

    const stylePalette = model === 'planner-combo-v1'
      ? comboPalette
      : plannerStyles[/** @type {keyof typeof plannerStyles} */ (style)];
    const palette = colors
      ? {
          primary: colors.primary,
          secondary: colors.secondary,
          accent: customColors ? colors.secondary : (colors.accent || stylePalette.accent),
        }
      : stylePalette;
    const args = [
      'compile',
      '--root', root,
      '--font-path', fontsPath,
      '--jobs', '2',
      '--input', `model=${model}`,
      '--input', `mode=${mode}`,
      '--input', `year=${year}`,
      '--input', `format=${format}`,
      '--input', `style=${style}`,
      '--input', `typography=${typography}`,
      '--input', `primary=${palette.primary}`,
      '--input', `secondary=${palette.secondary}`,
      '--input', `accent=${palette.accent || palette.secondary}`,
      '--input', `section=${section}`,
    ];

    if (personalizationName) {
      args.push('--input', `personalization_name=${personalizationName}`);
    }
    if (customColors) {
      args.push('--input', 'custom-colors=true');
    }
    if (logo) {
      args.push('--input', 'logo=true');
    }
    if (watermark && logo) {
      args.push('--input', 'watermark=true');
    }

    const outputFormat = options.format ?? (options.output?.endsWith('.png') ? 'png' : 'pdf');
    args.push('--format', outputFormat);

    if (options.pages?.length) {
      args.push('--pages', options.pages.join(','));
    }

    args.push(resolve(root, plannerModels[/** @type {keyof typeof plannerModels} */ (model)].file), options.output ?? '-');

    const { stdout, stderr } = await run(process.env.TYPST_BINARY || 'typst', args, {
      encoding: 'buffer',
      maxBuffer: 32 * 1024 * 1024,
      timeout: 60_000,
      windowsHide: true,
    });

    if (stderr.length) {
      const errText = stderr.toString().trimEnd();
      if (!errText.includes('warning:')) {
        // Log apenas se não for warning inofensivo
      }
    }

    return stdout;
  } finally {
    if (workspace) {
      await rm(workspace, { recursive: true, force: true });
    }
  }
}

export const compilePlannerEssencial = compilePlanner;

/**
 * Renderiza páginas do miolo completo para preservar paginação e margens espelhadas.
 * @param {PlannerConfig} config
 */
export async function renderComboPreviews(config) {
  const directory = await mkdtemp(join(tmpdir(), '678-planner-combo-'));
  try {
    const calendar = JSON.parse(await readFile(resolve('src/server/planner/typst/data',
      config.mode === 'undated' ? 'weeks-undated.json' : `weeks-${config.year ?? 2027}.json`), 'utf8'));
    const pageCount = 10 + calendar.months.length * 16 + calendar.totalWeeks * 2 + 8;
    const pages = comboPreviewSections.map(section => {
      const page = section.fromEnd ? pageCount - section.page
        : section.afterFirstMonthWeeks ? section.page + calendar.months[0].weeks.length * 2
        : section.page;
      return { id: section.id, label: section.label, detail: section.detail, page };
    });
    await compilePlanner(config, {
      pages: pages.map(section => section.page),
      output: join(directory, 'preview-{p}.png'),
      format: 'png',
    });
    return await Promise.all(pages.map(async ({ page, ...section }) => ({
      ...section,
      png: await readFile(join(directory, `preview-${page}.png`)),
    })));
  } finally {
    await rm(directory, { recursive: true, force: true });
  }
}

/**
 * Renderiza uma prévia individual em PNG base64 para uma das 8 seções.
 * @param {PlannerConfig} config
 * @param {string} sectionId
 * @returns {Promise<string>} Data URL da imagem PNG
 */
export async function renderPlannerSectionPreview(config, sectionId) {
  const directory = await mkdtemp(join(tmpdir(), '678-planner-prev-'));
  try {
    const outputPath = join(directory, 'preview-{p}.png');
    await compilePlannerEssencial({ ...config, section: sectionId }, {
      output: outputPath,
      pages: [1],
      format: 'png',
    });
    const imgBuffer = await readFile(join(directory, 'preview-1.png'));
    return `data:image/png;base64,${imgBuffer.toString('base64')}`;
  } finally {
    await rm(directory, { recursive: true, force: true });
  }
}

/**
 * Renderiza todas as 8 prévias do Planner Essencial.
 * @param {PlannerConfig} config
 * @returns {Promise<Array<{ id: string, label: string, detail: string, src: string }>>}
 */
export async function renderAllPlannerPreviews(config) {
  if (config.model === 'planner-combo-v1') {
    return (await renderComboPreviews(config)).map(({ png, ...section }) => ({
      ...section, src: `data:image/png;base64,${png.toString('base64')}`,
    }));
  }
  const results = [];
  for (const section of plannerSections) {
    try {
      const src = await renderPlannerSectionPreview(config, section.id);
      results.push({ ...section, src });
    } catch {
      // Fallback gracioso se Typst não estiver disponível
      results.push({ ...section, src: '' });
    }
  }
  return results;
}

