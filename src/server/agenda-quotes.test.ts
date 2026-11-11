import type { APIContext } from 'astro';
import { createClient, type Client } from '@libsql/client';
import { randomUUID } from 'node:crypto';
import sharp from 'sharp';
import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import { getAgendaQuote, getAgendaQuoteAsset, listAgendaQuotes, saveAgendaQuote } from '../db/agendaQuotes';
import { POST as preview } from '../pages/api/agenda/preview';
import { POST as quote } from '../pages/api/agenda/quote';
import { GET as publicPreview } from '../pages/agenda/orcamento/[id]/previa/[page]';
import { GET as privateFile } from '../pages/admin/agendas/[id]/arquivo/[file]';
import { POST as pdf } from '../pages/admin/agenda-classica.pdf';
import { discardAgendaDraft, getAgendaDraft, storeAgendaDraft } from './agenda/drafts';
import type { QuoteAsset, QuoteConfig } from './agenda/quoteConfig';
import { DEFAULT_STUDIO_SETTINGS, saveStudioSettings } from '../db/studioSettings';

const mocked = vi.hoisted(() => ({ client: undefined as Client | undefined }));
vi.mock('../db/database', async importOriginal => ({
  ...await importOriginal<typeof import('../db/database')>(),
  getDbClient: () => mocked.client,
}));

const base = 'https://studio.example';
const config: QuoteConfig = {
  template: 'agenda-classica-v1', year: 2028, format: 'a5', layout: 'daily-2dpp',
  style: 'feminine', colors: { primary: '#095c39', secondary: '#403287' },
  customColors: true, watermark: true,
  logo: { originalName: 'logomarca.jpg', original: 'original', normalized: 'logo' },
};

function context(path: string, form?: FormData, params = {}, headers?: HeadersInit) {
  const url = new URL(path, base);
  const request = new Request(url, { method: form ? 'POST' : 'GET', body: form, headers });
  return { url, request, params, locals: {} } as APIContext;
}

function requestQuote(token: string, headers?: HeadersInit) {
  const form = new FormData();
  form.set('draft', token);
  return quote(context('/api/agenda/quote', form, {}, headers));
}

beforeEach(() => {
  vi.stubEnv('PUBLIC_ORIGIN', base);
  mocked.client = createClient({ url: ':memory:' });
});

afterEach(() => {
  mocked.client?.close();
  vi.unstubAllEnvs();
});

it('salva a configuração e os arquivos e retorna a mesma referência em novas tentativas', async () => {
  const original = Buffer.from('original');
  const images = Buffer.from('previa-salva');
  const assets: QuoteAsset[] = [
    { name: 'original', mime: 'image/jpeg', content: original },
    { name: 'logo', mime: 'image/png', content: Buffer.from('normalizado') },
    { name: 'preview-1', mime: 'image/png', content: images },
  ];
  // Inicializa a base antes de iniciar as transações concorrentes.
  await saveStudioSettings({ ...DEFAULT_STUDIO_SETTINGS, whatsapp: '5511912345678' });
  const token = storeAgendaDraft(config, assets);
  const [first, second] = await Promise.all([requestQuote(token), requestQuote(token)]);
  expect(first.status).toBe(200);
  expect(second.status).toBe(200);
  const saved = await first.json();
  expect(await second.json()).toEqual(saved);
  expect(getAgendaDraft(token)).toBeUndefined();
  const id = saved.referencePath.split('/').at(-1);
  expect(id).not.toBe(token);
  const whatsapp = new URL(saved.whatsappUrl);
  expect(whatsapp.origin + whatsapp.pathname).toBe('https://wa.me/5511912345678');
  expect(whatsapp.searchParams.get('text')).toContain('Dois dias por página');
  expect(whatsapp.searchParams.get('text')).toContain(base + saved.referencePath);

  expect((await getAgendaQuote(id))?.config).toEqual(config);
  expect((await listAgendaQuotes(1)).quotes).toMatchObject([{ id, configVersion: 1, status: 'requested', product: 'Agenda Clássica' }]);
  expect((await getAgendaQuoteAsset(id, 'original'))?.content).toEqual(original);
  expect(await (await requestQuote(token)).json()).toEqual(saved);
  expect((await publicPreview(context('', undefined, { id, page: '1' }))).status).toBe(200);
  expect((await publicPreview(context('', undefined, { id, page: 'original' }))).status).toBe(404);
  expect((await publicPreview(context('', undefined, { id: token, page: '1' }))).status).toBe(404);
  const file = await privateFile(context('', undefined, { id, file: 'original' }));
  expect(file.headers.get('Content-Disposition')).toContain('attachment');
  expect(Buffer.from(await file.arrayBuffer())).toEqual(original);
  expect(await (await privateFile(context('', undefined, { id, file: 'configuracao' }))).json()).toEqual({ version: 1, ...config });
});

it('mantém o pedido salvo mesmo com o WhatsApp indisponível e rejeita tokens inválidos ou expirados', async () => {
  const token = storeAgendaDraft({ ...config, watermark: false, logo: null }, []);
  expect((await requestQuote(token, { Origin: 'https://outside.example' })).status).toBe(403);
  expect((await requestQuote('invalido')).status).toBe(400);
  expect((await requestQuote(randomUUID())).status).toBe(410);
  const saved = await (await requestQuote(token)).json();
  expect(saved.whatsappUrl).toBeNull();
  expect((await listAgendaQuotes(1)).quotes).toHaveLength(1);
  expect(await (await requestQuote(token)).json()).toEqual(saved);
});

it('reverte a solicitação inteira se um arquivo falhar no lote', async () => {
  const token = randomUUID();
  const asset: QuoteAsset = { name: 'preview-1', mime: 'image/png', content: Buffer.from('png') };
  await expect(saveAgendaQuote(token, config, [asset, asset])).rejects.toThrow();
  expect((await listAgendaQuotes(1)).quotes).toHaveLength(0);
  expect((await requestQuote(token)).status).toBe(410);
});

it.runIf(process.env.AGENDA_TYPST_TEST === '1')('associa as oito prévias exatas e regenera o PDF anual com a logo salva', async () => {
  const original = await sharp({ create: { width: 250, height: 100, channels: 3, background: '#aa2356' } }).jpeg().toBuffer();
  const form = new FormData();
  for (const [key, value] of Object.entries({
    year: '2028', layout: config.layout, format: config.format, style: config.style,
    ...config.colors, watermark: 'true',
  })) form.set(key, value);
  form.set('logo', new File([Uint8Array.from(original)], 'logomarca.jpg', { type: 'image/jpeg' }));
  const response = await preview(context('/api/agenda/preview', form));
  expect(response.status).toBe(200);
  const { images, draft } = await response.json();
  try {
    const saved = await (await requestQuote(draft)).json();
    const id = saved.referencePath.split('/').at(-1);
    for (const { page, src } of images) {
      const png = await publicPreview(context('', undefined, { id, page: String(page) }));
      expect(png.headers.get('Content-Type')).toBe('image/png');
      expect(Buffer.from(await png.arrayBuffer())).toEqual(Buffer.from(src.split(',')[1], 'base64'));
    }
    expect(images).toHaveLength(8);
    const result = await pdf(context(`/admin/agenda-classica.pdf?pedido=${id}`));
    expect(result.status).toBe(200);
    const annual = Buffer.from(await result.arrayBuffer());
    expect(annual.subarray(0, 5).toString()).toBe('%PDF-');
    expect(annual.subarray(0, 4096).toString('latin1')).toMatch(/\/Type\s*\/Pages\s*\/Count\s+200\b/);
    expect(annual.includes(Buffer.from('/Subtype/Image'))).toBe(true);
    expect((await getAgendaQuote(id))?.config).toEqual({ ...config, template: 'agenda-classica-v2', previews: images.map(({ page, pdfPage, section }: { page: number; pdfPage: number; section: string }) => ({ page, pdfPage, section })) });
  } finally {
    discardAgendaDraft(draft);
  }
}, 120_000);

it.runIf(process.env.AGENDA_TYPST_TEST === '1')('regenera pedidos anteriores com o template original de 183 páginas', async () => {
  const old = { ...config, logo: null, watermark: false };
  const saved = await saveAgendaQuote(randomUUID(), old, []);
  const response = await pdf(context(`/admin/agenda-classica.pdf?pedido=${saved.id}`));
  expect(response.status).toBe(200);
  const bytes = Buffer.from(await response.arrayBuffer());
  expect(bytes.subarray(0, 4096).toString('latin1')).toMatch(/\/Type\s*\/Pages\s*\/Count\s+183\b/);
}, 70_000);
