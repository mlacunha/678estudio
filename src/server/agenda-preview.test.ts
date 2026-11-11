import type { APIContext } from 'astro';
import sharp from 'sharp';
import { afterEach, expect, it, vi } from 'vitest';
import { POST } from '../pages/api/agenda/preview';
import { renderAgendaPreview } from './agenda/classic.mjs';
import { getAgendaDraft } from './agenda/drafts';

vi.mock('./agenda/classic.mjs', async importOriginal => ({
  ...await importOriginal<typeof import('./agenda/classic.mjs')>(),
  renderAgendaPreview: vi.fn(),
}));

const render = vi.mocked(renderAgendaPreview);
const url = new URL('https://studio.example/api/agenda/preview');
const options = () => {
  const form = new FormData();
  for (const [key, value] of Object.entries({ year: '2027', layout: 'weekly', format: 'a5', style: 'classic' })) {
    form.set(key, value);
  }
  return form;
};
const post = (body: FormData, headers?: HeadersInit) =>
  POST({ url, request: new Request(url, { method: 'POST', body, headers }) } as APIContext);

afterEach(() => {
  vi.unstubAllEnvs();
  render.mockReset();
});

it.each([
  ['year', '2029'], ['style', 'constructor'], ['format', 'a4'],
  ['layout', 'vertical'], ['watermark', 'true'], ['primary', '#ffffff'],
])('rejeita %s inválido antes do Typst', async (field, value) => {
  const form = options();
  form.set(field, value);
  expect((await post(form)).status).toBe(400);
  expect(render).not.toHaveBeenCalled();
});

it('rejeita origem externa e corpo maior que o limite', async () => {
  vi.stubEnv('PUBLIC_ORIGIN', url.origin);
  expect((await post(options(), { Origin: 'https://other.example' })).status).toBe(403);
  expect((await post(options(), { 'Content-Length': '3000000' })).status).toBe(413);
  const oversized = options();
  oversized.set('logo', new File([new Uint8Array(3_000_000)], 'logo.png', { type: 'image/png' }));
  expect((await post(oversized)).status).toBe(413);
  expect(render).not.toHaveBeenCalled();
});

it('rejeita imagens inválidas mesmo quando a assinatura PNG é válida', async () => {
  const form = options();
  form.set('logo', new File([Uint8Array.from([137, 80, 78, 71, 13, 10, 26, 10])], 'quebrado.png', { type: 'image/png' }));
  expect((await post(form)).status).toBe(400);
  expect(render).not.toHaveBeenCalled();
});

it('normaliza a logo e devolve somente imagens com cache desabilitado', async () => {
  const form = options();
  const jpeg = await sharp({ create: { width: 600, height: 300, channels: 3, background: '#c04868' } }).jpeg().toBuffer();
  form.set('logo', new File([Uint8Array.from(jpeg)], 'logo.jpg', { type: 'image/jpeg' }));
  form.set('watermark', 'true');
  form.set('primary', '#095c39');
  form.set('secondary', '#403287');
  const images = [{ page: 1, pdfPage: 1, section: 'Abertura', src: 'data:image/png;base64,teste' }];
  render.mockResolvedValue(images);
  const response = await post(form);
  expect(response.status).toBe(200);
  expect(response.headers.get('Cache-Control')).toBe('no-store');
  const payload = await response.json();
  expect(payload).toEqual({ images, draft: expect.any(String) });
  const draft = getAgendaDraft(payload.draft);
  expect(draft?.config).toMatchObject({ customColors: true, watermark: true, logo: { originalName: 'logo.jpg' } });
  expect(draft?.assets.find(asset => asset.name === 'original')?.content).toEqual(jpeg);
  const config = render.mock.calls[0][0];
  expect(config.colors).toEqual({ primary: '#095c39', secondary: '#403287' });
  expect(config.watermark).toBe(true);
  const logo = await sharp(config.logo!).metadata();
  expect(logo).toMatchObject({ format: 'png', width: 512, height: 256 });
});

it('limita concorrência e aceita uma nova solicitação após concluir', async () => {
  const first = post(options());
  const busy = await post(options());
  expect(busy.status).toBe(503);
  expect(busy.headers.get('Retry-After')).toBeTruthy();
  render.mockResolvedValue([]);
  expect((await first).status).toBe(200);
  expect((await post(options())).status).toBe(200);
});
