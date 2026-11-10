import { mkdtemp, readFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import sharp from 'sharp';
import { compileClassicAgenda, isAgendaColor, renderAgendaPreview } from './agenda/classic.mjs';

it('aceita cores hexadecimais com contraste no papel branco', () => {
  expect(isAgendaColor('#5e548e')).toBe(true);
  expect(isAgendaColor('#ffffff')).toBe(false);
  expect(isAgendaColor('red')).toBe(false);
});

it.each([
  { layout: '../../arquivo', year: 2027 },
  { layout: 'weekly', year: 2027.5 },
  { layout: 'weekly', year: 9999 },
  { layout: 'weekly', year: 2027, style: 'constructor' },
  { layout: 'weekly', year: 2027, format: 'a4' },
  { layout: 'weekly', year: 2027, watermark: true },
])('rejeita a configuração $layout / $year antes de compilar', async config => {
  await expect(compileClassicAgenda(config)).rejects.toThrow(RangeError);
});

describe.runIf(process.env.AGENDA_TYPST_TEST === '1')('compilação local com Typst', () => {
  it.each([
    ['daily-1dpp', 2027, 365],
    ['daily-1dpp', 2028, 366],
    ['daily-2dpp', 2027, 183],
    ['weekly', 2027, 53],
    ['weekly', 2012, 54],
  ])('gera %s de %i com %i páginas', async (layout, year, pages) => {
    const pdf = await compileClassicAgenda({ layout, year });
    expect(pdf.subarray(0, 5).toString()).toBe('%PDF-');
    // Na saída da versão fixada do Typst, a árvore de páginas é um objeto em texto.
    const count = pdf.subarray(0, 4096).toString('latin1').match(/\/Type\s*\/Pages\s*\/Count\s+(\d+)/);
    expect(Number(count?.[1])).toBe(pages);
  }, 70_000);

  it('exporta somente as páginas solicitadas para prévia', async () => {
    const dir = await mkdtemp(join(tmpdir(), 'agenda-test-'));
    try {
      await compileClassicAgenda({ layout: 'weekly', year: 2027 }, {
        pages: [2, 4],
        output: join(dir, 'pagina-{p}.png'),
      });
      for (const page of [2, 4]) {
        const png = await readFile(join(dir, `pagina-${page}.png`));
        expect(png.subarray(0, 8).toString('hex')).toBe('89504e470d0a1a0a');
      }
      await expect(readFile(join(dir, 'pagina-1.png'))).rejects.toMatchObject({ code: 'ENOENT' });
    } finally {
      await rm(dir, { recursive: true, force: true });
    }
  }, 70_000);

  it.each([
    ['daily-1dpp', 366],
    ['daily-2dpp', 183],
    ['weekly', 53],
  ])('gera os três estilos no layout %s com a mesma paginação', async (layout, pages) => {
    const outputs = [];
    for (const style of ['classic', 'commercial', 'feminine']) {
      const config = { year: 2028, layout, style, format: 'a5' };
      const pdf = await compileClassicAgenda(config);
      const count = pdf.subarray(0, 4096).toString('latin1').match(/\/Type\s*\/Pages\s*\/Count\s+(\d+)/);
      expect(Number(count?.[1])).toBe(pages);
      const images = await renderAgendaPreview(config);
      expect(images.map(image => image.page)).toEqual([1, 2, 3]);
      outputs.push(images[0].src);
    }
    expect(new Set(outputs).size).toBe(3);
  }, 180_000);

  it('mostra logo, marca-d’água e cores e mantém a prévia igual ao miolo completo', async () => {
    const directory = await mkdtemp(join(tmpdir(), '678-agenda-fidelidade-'));
    try {
      const logo = await sharp({ create: { width: 120, height: 60, channels: 4, background: '#d40013' } }).png().toBuffer();
      const base = { layout: 'weekly', year: 2027, style: 'feminine' };
      const colors = { primary: '#095c39', secondary: '#403287' };
      const preview = async config => (await renderAgendaPreview(config))[1].src;
      const plain = await preview(base);
      const colored = await preview({ ...base, colors });
      const footer = await preview({ ...base, colors, logo });
      const config = { ...base, colors, logo, watermark: true };
      const branded = await preview(config);
      expect(new Set([plain, colored, footer, branded]).size).toBe(4);
      const output = join(directory, 'page.png');
      await compileClassicAgenda(config, { pages: [2], output });
      const full = await readFile(output);
      expect(`data:image/png;base64,${full.toString('base64')}` === branded).toBe(true);
      const { data, info } = await sharp(full).raw().toBuffer({ resolveWithObject: true });
      expect(info.width).toBeLessThan(info.height);
      const center = (Math.floor(info.height / 2) * info.width + Math.floor(info.width / 2)) * info.channels;
      expect(data[center + 1]).toBeLessThan(250);
    } finally {
      await rm(directory, { recursive: true, force: true });
    }
  }, 90_000);
});
