import fs from 'node:fs';
import path from 'node:path';
import { createClient, type Client } from '@libsql/client';
import { PDFDocument } from 'pdf-lib';
import sharp from 'sharp';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { getNotebookQuote, listNotebookQuotes } from '../../db/notebookQuotes';
import { compileNotebook, isNotebookColor, queryMemoriasSpreads } from './compiler.mjs';
import { notebookModels, notebookSectionsByModel, notebookTotalPages } from './options.mjs';
import {
  A4_LANDSCAPE_HEIGHT_PT,
  A4_LANDSCAPE_WIDTH_PT,
  A5_HEIGHT_PT,
  buildA4ImpositionPlan,
  imposeA5ToA4Backs,
  imposeA5ToA4Fronts,
  simulateCutAndStack,
} from '../print/a4Imposition';
import { POST as postPreview } from '../../pages/api/caderno/preview';
import { POST as postQuote } from '../../pages/api/caderno/quote';
import { GET as getPublicPreview } from '../../pages/caderno/orcamento/[id]/previa/[section]';
import { GET as getAdminFile } from '../../pages/admin/cadernos/[id]/arquivo/[file]';
import { GET as getAdminPdf } from '../../pages/admin/cadernos/[id]/pdf';

const mocked = vi.hoisted(() => ({ client: undefined as Client | undefined }));
vi.mock('../../db/database', async (importOriginal) => ({
  ...(await importOriginal<typeof import('../../db/database')>()),
  getDbClient: () => mocked.client!,
}));

const runTypst = process.env.AGENDA_TYPST_TEST === '1';

async function saveHomologationSpread(memPdfConfig: Record<string, unknown>, outDir: string): Promise<void> {
  const page6Png = await compileNotebook(memPdfConfig, { format: 'png', pages: [6] });
  const page7Png = await compileNotebook(memPdfConfig, { format: 'png', pages: [7] });
  const meta6 = await sharp(page6Png).metadata();
  const w = meta6.width || 839;
  const h = meta6.height || 1191;
  const gutter = 14;

  const spreadPng = await sharp({
    create: {
      width: w * 2 + gutter,
      height: h,
      channels: 4,
      background: { r: 214, g: 209, b: 202, alpha: 1 },
    },
  })
    .composite([
      { input: page6Png, left: 0, top: 0 },
      { input: page7Png, left: w + gutter, top: 0 },
    ])
    .png()
    .toBuffer();

  fs.writeFileSync(path.join(outDir, 'amostra-livro-memorias-abertura-dupla-p6-p7.png'), spreadPng);
}

describe('Cadernos Personalizados — compiler & validation', () => {
  beforeEach(() => {
    mocked.client = createClient({ url: ':memory:' });
  });

  afterEach(() => {
    mocked.client?.close();
  });

  it('it should validate notebook colors and reject low-contrast palettes', () => {
    expect(isNotebookColor('#1f2937')).toBe(true);
    expect(isNotebookColor('#4a1d2f')).toBe(true);
    expect(isNotebookColor('#ffffff')).toBe(false);
    expect(isNotebookColor('#fef08a')).toBe(false);
  });

  it('it should reject invalid models, styles, typographies, and watermark without logo', async () => {
    await expect(compileNotebook({ model: 'invalido' })).rejects.toThrow(/Modelo de caderno inválido/);
    await expect(compileNotebook({ style: 'neon' })).rejects.toThrow(/Estilo visual de caderno inválido/);
    await expect(compileNotebook({ typography: 'comic' })).rejects.toThrow(/Tipografia de caderno inválida/);
    await expect(compileNotebook({ watermark: true })).rejects.toThrow(/marca-d’água exige uma logomarca/);
    await expect(
      compileNotebook({ colors: { primary: '#ffffff', secondary: '#eeeeee' } }),
    ).rejects.toThrow(/contraste insuficiente/);
  });

  it.skipIf(!runTypst)(
    'it should compile all 3 notebook models in A5 with exact page counts (140, 160, and 120 pages) and valid A5 dimensions',
    async () => {
      const outDir = process.env.HOMOLOGATION_DIR;
      for (const modelId of Object.keys(notebookModels) as Array<keyof typeof notebookModels>) {
        const config = {
          model: modelId,
          style: modelId === 'livro-memorias' ? 'feminine' : modelId === 'caderno-receitas' ? 'commercial' : 'classic',
          typography: modelId === 'diario-pessoal' ? 'modern' : 'editorial',
          title: notebookModels[modelId].defaultTitle,
          personalizationName: 'Helena Rocha · 678 Estudio',
          dedication:
            modelId === 'livro-memorias'
              ? 'Para guardar cada viagem, encontro, abraço e risada da nossa história.'
              : '',
          studio: {
            instagram: '@678estudio',
            site: '678estudio.com.br',
            whatsapp: '+55 11 99999-0000',
            email: 'contato@678estudio.com.br',
          },
        };

        const pdfBuffer = await compileNotebook(config, { format: 'pdf' });
        const pdfDoc = await PDFDocument.load(pdfBuffer);
        const expectedCount = notebookTotalPages[modelId];
        expect(pdfDoc.getPageCount()).toBe(expectedCount);

        const { width, height } = pdfDoc.getPage(0).getSize();
        expect(width).toBeCloseTo(419.53, 1);
        expect(height).toBeCloseTo(A5_HEIGHT_PT, 1);

        if (outDir && fs.existsSync(outDir)) {
          fs.writeFileSync(path.join(outDir, `homologacao-${modelId}-${expectedCount}p-a5.pdf`), pdfBuffer);
          const colophonPng = await compileNotebook(config, { format: 'png', pages: [expectedCount] });
          fs.writeFileSync(path.join(outDir, `amostra-${modelId}-colofao-p${expectedCount}.png`), colophonPng);
          if (modelId === 'livro-memorias') {
            await saveHomologationSpread(config, outDir);
          }
        }
      }
    },
    120_000,
  );

  it.skipIf(!runTypst)(
    'it should guarantee that all 52 double spreads of Livro de Memórias start on an even left page (6..108) and finish on the next odd right page (7..109)',
    async () => {
      const spreads = await queryMemoriasSpreads({
        style: 'feminine',
        typography: 'editorial',
        title: 'Nossas Memórias',
        personalizationName: 'Família Rocha',
        dedication: 'Aos dias que moram para sempre em nós.',
      });

      expect(spreads).toHaveLength(104);

      for (let i = 1; i <= 52; i++) {
        const leftEntry = spreads[(i - 1) * 2];
        const rightEntry = spreads[(i - 1) * 2 + 1];
        const expectedEvenPage = 2 * i + 4;
        const expectedOddPage = 2 * i + 5;

        expect(leftEntry).toEqual({
          kind: 'memoria-esquerda',
          index: i,
          page: expectedEvenPage,
        });
        expect(leftEntry.page % 2).toBe(0);

        expect(rightEntry).toEqual({
          kind: 'memoria-direita',
          index: i,
          page: expectedOddPage,
        });
        expect(rightEntry.page % 2).toBe(1);
        expect(rightEntry.page).toBe(leftEntry.page + 1);
      }
    },
    60_000,
  );

  it.skipIf(!runTypst)(
    'it should render PNG previews for all 6 sections of each thematic notebook model',
    async () => {
      for (const [modelId, sections] of Object.entries(notebookSectionsByModel)) {
        expect(sections).toHaveLength(6);
        for (const section of sections) {
          const png = await compileNotebook(
            {
              model: modelId,
              style: 'classic',
              typography: 'modern',
              section: section.id,
            },
            { format: 'png', pages: [1] },
          );
          expect(png.subarray(0, 4).toString('hex')).toBe('89504e47');
        }
      }
    },
    120_000,
  );

  it.skipIf(!runTypst)(
    'it should impose all 3 notebook models into A4 Cut & Stack with 35, 40, and 30 A4 sheets respectively',
    async () => {
      const outDir = process.env.HOMOLOGATION_DIR;
      const expectedSheets: Record<string, number> = {
        'caderno-receitas': 35,
        'diario-pessoal': 40,
        'livro-memorias': 30,
      };

      for (const [modelId, sheets] of Object.entries(expectedSheets)) {
        const a5Buffer = await compileNotebook({ model: modelId }, { format: 'pdf' });
        const a5Bytes = new Uint8Array(a5Buffer);
        const plan = buildA4ImpositionPlan(sheets * 4, { stackMode: 'cut-stack', flipMode: 'short-edge' });
        expect(plan).toHaveLength(sheets);

        const simulatedOrder = simulateCutAndStack(plan, { stackMode: 'cut-stack', flipMode: 'short-edge' });
        expect(simulatedOrder).toEqual(Array.from({ length: sheets * 4 }, (_, i) => i + 1));

        const frontsPdf = await imposeA5ToA4Fronts(a5Bytes, { stackMode: 'cut-stack', scaleMode: 'safe' });
        const backsPdf = await imposeA5ToA4Backs(a5Bytes, {
          stackMode: 'cut-stack',
          flipMode: 'short-edge',
          scaleMode: 'safe',
        });

        const frontsDoc = await PDFDocument.load(frontsPdf);
        const backsDoc = await PDFDocument.load(backsPdf);
        expect(frontsDoc.getPageCount()).toBe(sheets);
        expect(backsDoc.getPageCount()).toBe(sheets);

        const { width, height } = frontsDoc.getPage(0).getSize();
        expect(width).toBeCloseTo(A4_LANDSCAPE_WIDTH_PT, 1);
        expect(height).toBeCloseTo(A4_LANDSCAPE_HEIGHT_PT, 1);

        if (outDir && fs.existsSync(outDir)) {
          fs.writeFileSync(path.join(outDir, `homologacao-${modelId}-a4-frentes.pdf`), frontsPdf);
          fs.writeFileSync(path.join(outDir, `homologacao-${modelId}-a4-versos.pdf`), backsPdf);
        }
      }
    },
    120_000,
  );

  it.skipIf(!runTypst)(
    'it should execute the full end-to-end flow for all 3 models (with logo, watermark, and custom colors): preview -> quote -> admin list -> asset recovery -> A5 and A4 PDFs',
    async () => {
      const sampleLogo = await sharp({
        create: { width: 240, height: 100, channels: 4, background: { r: 30, g: 64, b: 175, alpha: 1 } },
      })
        .png()
        .toBuffer();

      const scenarios = [
        {
          model: 'caderno-receitas',
          style: 'commercial',
          typography: 'geometric',
          title: 'Receitas da Família',
          personalizationName: 'Chef Lucas',
          primary: '#0f172a',
          secondary: '#1e40af',
          withLogo: true,
          watermark: 'true',
          expectedA5Pages: 140,
          expectedA4Sheets: 35,
        },
        {
          model: 'diario-pessoal',
          style: 'classic',
          typography: 'modern',
          title: 'Diário Pessoal Atemporal',
          personalizationName: 'Mariana Costa',
          withLogo: false,
          watermark: 'false',
          expectedA5Pages: 160,
          expectedA4Sheets: 40,
        },
        {
          model: 'livro-memorias',
          style: 'feminine',
          typography: 'editorial',
          title: 'Livro de Memórias da Família',
          personalizationName: 'Helena & Pedro',
          dedication: 'Para lembrar de cada viagem e encontro especial.',
          withLogo: true,
          watermark: 'true',
          expectedA5Pages: 120,
          expectedA4Sheets: 30,
        },
      ] as const;

      for (const item of scenarios) {
        const previewForm = new FormData();
        previewForm.set('model', item.model);
        previewForm.set('format', 'a5');
        previewForm.set('style', item.style);
        previewForm.set('typography', item.typography);
        previewForm.set('title', item.title);
        previewForm.set('personalizationName', item.personalizationName);
        if ('dedication' in item && item.dedication) previewForm.set('dedication', item.dedication);
        if ('primary' in item && item.primary) {
          previewForm.set('primary', item.primary);
          previewForm.set('secondary', item.secondary);
        }
        if (item.withLogo) {
          previewForm.set('logo', new File([Uint8Array.from(sampleLogo)], 'marca.png', { type: 'image/png' }));
          previewForm.set('watermark', item.watermark);
        }

        const previewRes = await postPreview({
          request: new Request('http://localhost:4321/api/caderno/preview', {
            method: 'POST',
            body: previewForm,
            headers: { Origin: 'http://localhost:4321' },
          }),
          url: new URL('http://localhost:4321/api/caderno/preview'),
        } as never);
        expect(previewRes.status).toBe(200);
        const previewJson = await previewRes.json();
        expect(previewJson.previews).toHaveLength(6);

        const quoteForm = new FormData();
        quoteForm.set('draft', previewJson.draft);
        const quoteRes = await postQuote({
          request: new Request('http://localhost:4321/api/caderno/quote', {
            method: 'POST',
            body: quoteForm,
            headers: { Origin: 'http://localhost:4321' },
          }),
          url: new URL('http://localhost:4321/api/caderno/quote'),
          locals: {},
        } as never);
        expect(quoteRes.status).toBe(200);
        const quoteJson = await quoteRes.json();
        const quoteId = quoteJson.referencePath.split('/').pop()!;

        const savedQuote = await getNotebookQuote(quoteId);
        expect(savedQuote?.config.model).toBe(item.model);
        expect(savedQuote?.config.title).toBe(item.title);

        const firstSection = previewJson.previews[0].id;
        const pubPrevRes = await getPublicPreview({ params: { id: quoteId, section: firstSection } } as never);
        expect(pubPrevRes.status).toBe(200);

        const configRes = await getAdminFile({ params: { id: quoteId, file: 'configuracao' } } as never);
        expect(configRes.status).toBe(200);

        const a5Res = await getAdminPdf({
          params: { id: quoteId },
          url: new URL(`http://localhost:4321/admin/cadernos/${quoteId}/pdf?modo=a5`),
          locals: {},
        } as never);
        expect(a5Res.status).toBe(200);
        const a5Doc = await PDFDocument.load(new Uint8Array(await a5Res.arrayBuffer()));
        expect(a5Doc.getPageCount()).toBe(item.expectedA5Pages);

        const frontsRes = await getAdminPdf({
          params: { id: quoteId },
          url: new URL(`http://localhost:4321/admin/cadernos/${quoteId}/pdf?modo=a4-frentes&escala=safe`),
          locals: {},
        } as never);
        expect(frontsRes.status).toBe(200);
        const frontsDoc = await PDFDocument.load(new Uint8Array(await frontsRes.arrayBuffer()));
        expect(frontsDoc.getPageCount()).toBe(item.expectedA4Sheets);

        const backsRes = await getAdminPdf({
          params: { id: quoteId },
          url: new URL(`http://localhost:4321/admin/cadernos/${quoteId}/pdf?modo=a4-versos&escala=safe`),
          locals: {},
        } as never);
        expect(backsRes.status).toBe(200);
        const backsDoc = await PDFDocument.load(new Uint8Array(await backsRes.arrayBuffer()));
        expect(backsDoc.getPageCount()).toBe(item.expectedA4Sheets);
      }

      const allSaved = await listNotebookQuotes(1);
      expect(allSaved.quotes).toHaveLength(3);
    },
    180_000,
  );
});
