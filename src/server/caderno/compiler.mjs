import { execFile } from 'node:child_process';
import { cp, mkdtemp, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { promisify } from 'node:util';
import { isAgendaColor } from '../agenda/classic.mjs';
import {
  notebookFormats,
  notebookModels,
  notebookStyles,
  notebookTypographies,
} from './options.mjs';

const run = promisify(execFile);

export const isNotebookColor = isAgendaColor;

function validateNotebookConfig(config) {
  const {
    model = 'caderno-receitas',
    format = 'a5',
    style = 'classic',
    typography = 'modern',
    colors,
    watermark = false,
    logo,
  } = config;

  if (!Object.hasOwn(notebookModels, model)) {
    throw new RangeError(`Modelo de caderno inválido: ${model}`);
  }
  if (!Object.hasOwn(notebookFormats, format)) {
    throw new RangeError(`Formato de caderno inválido: ${format}`);
  }
  if (!Object.hasOwn(notebookStyles, style)) {
    throw new RangeError(`Estilo visual de caderno inválido: ${style}`);
  }
  if (!Object.hasOwn(notebookTypographies, typography)) {
    throw new RangeError(`Tipografia de caderno inválida: ${typography}`);
  }
  if (watermark && !logo) {
    throw new RangeError('A marca-d’água exige uma logomarca válida.');
  }
  if (colors && (!isNotebookColor(colors.primary) || !isNotebookColor(colors.secondary))) {
    throw new RangeError('Cores do caderno com contraste insuficiente no papel.');
  }
}

function buildTypstInputArgs(config, root, fontsPath) {
  const {
    model = 'caderno-receitas',
    format = 'a5',
    style = 'classic',
    typography = 'modern',
    colors,
    customColors = Boolean(colors),
    watermark = false,
    title = '',
    personalizationName = '',
    dedication = '',
    logo,
    section = 'all',
    studio = {},
  } = config;

  const stylePalette = notebookStyles[style];
  const palette = colors
    ? {
        primary: colors.primary,
        secondary: colors.secondary,
        accent: customColors ? colors.secondary : (colors.accent || stylePalette.accent),
      }
    : stylePalette;

  const args = [
    '--root', root,
    '--font-path', fontsPath,
    '--input', `model=${model}`,
    '--input', `format=${format}`,
    '--input', `style=${style}`,
    '--input', `typography=${typography}`,
    '--input', `primary=${palette.primary}`,
    '--input', `secondary=${palette.secondary}`,
    '--input', `accent=${palette.accent || palette.secondary}`,
    '--input', `section=${section}`,
  ];

  if (title) args.push('--input', `title=${title}`);
  if (personalizationName) args.push('--input', `personalization_name=${personalizationName}`);
  if (dedication) args.push('--input', `dedication=${dedication}`);
  if (studio.instagram) args.push('--input', `studio_instagram=${studio.instagram}`);
  if (studio.site) args.push('--input', `studio_site=${studio.site}`);
  if (studio.whatsapp) args.push('--input', `studio_whatsapp=${studio.whatsapp}`);
  if (studio.email) args.push('--input', `studio_email=${studio.email}`);
  if (customColors) args.push('--input', 'custom-colors=true');
  if (logo) args.push('--input', 'logo=true');
  if (watermark && logo) args.push('--input', 'watermark=true');

  return args;
}

/**
 * Compila o miolo completo A5 ou uma seção individual de Caderno Personalizado via Typst CLI.
 * @param {object} config
 * @param {{ pages?: number[], output?: string, format?: 'pdf' | 'png' | 'svg' }} [options]
 * @returns {Promise<Buffer>}
 */
export async function compileNotebook(config = {}, options = {}) {
  validateNotebookConfig(config);

  const templates = resolve('src/server/caderno/typst');
  const fontsPath = resolve('src/server/planner/typst/fonts');
  const workspace = config.logo ? await mkdtemp(join(tmpdir(), '678-caderno-logo-')) : undefined;

  try {
    const root = workspace ?? templates;
    if (workspace) {
      await cp(templates, workspace, { recursive: true });
      await writeFile(join(workspace, 'logo.png'), config.logo);
    }

    const outputFormat = options.format ?? (options.output?.endsWith('.png') ? 'png' : 'pdf');
    const args = [
      'compile',
      '--jobs', '2',
      ...buildTypstInputArgs(config, root, fontsPath),
      '--format', outputFormat,
    ];

    if (options.pages?.length) {
      args.push('--pages', options.pages.join(','));
    }

    args.push(resolve(root, 'caderno.typ'), options.output ?? '-');

    const { stdout } = await run(process.env.TYPST_BINARY || 'typst', args, {
      encoding: 'buffer',
      maxBuffer: 32 * 1024 * 1024,
      timeout: 60_000,
      windowsHide: true,
    });

    return stdout;
  } finally {
    if (workspace) {
      await rm(workspace, { recursive: true, force: true });
    }
  }
}

/**
 * Consulta metadados das 52 aberturas duplas do Livro de Memórias para validação de paridade.
 * @param {object} [config]
 * @returns {Promise<Array<{ kind: string, index: number, page: number }>>}
 */
export async function queryMemoriasSpreads(config = {}) {
  const fullConfig = { ...config, model: 'livro-memorias', section: 'all' };
  validateNotebookConfig(fullConfig);

  const templates = resolve('src/server/caderno/typst');
  const fontsPath = resolve('src/server/planner/typst/fonts');
  const args = [
    'query',
    ...buildTypstInputArgs(fullConfig, templates, fontsPath),
    '--field', 'value',
    resolve(templates, 'caderno.typ'),
    '<memoria-spread>',
  ];

  const { stdout } = await run(process.env.TYPST_BINARY || 'typst', args, {
    encoding: 'utf8',
    maxBuffer: 8 * 1024 * 1024,
    timeout: 60_000,
    windowsHide: true,
  });

  return JSON.parse(stdout);
}

