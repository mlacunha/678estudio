import { describe, expect, it, vi } from 'vitest';
import { POST } from '../../pages/admin/mockups-comerciais/render';
import { normalizeMugArtwork, renderMugMockup } from './render.mjs';

vi.mock('./render.mjs', () => ({
  normalizeMugArtwork: vi.fn(async () => Buffer.from('normalized')),
  renderMugMockup: vi.fn(async () => Buffer.from('PNG')),
}));

const custom = {
  mode: 'custom',
  global: { fit: 'cover', zoom: 125, offsetX: -10, offsetY: 6 },
  local: { zoom: 90, offsetX: 2, offsetY: -11 },
};

function call({ model = '9', placement, content = 'image', overrides = {}, headers }: {
  model?: string; placement?: string | string[]; content?: string; overrides?: Record<string, string>; headers?: HeadersInit;
} = {}) {
  const body = new FormData();
  body.set('model', model);
  if (content) body.set('artwork', new Blob([content], { type: 'image/png' }), 'art.png');
  for (const [slot, image] of Object.entries(overrides)) {
    body.set('artwork-' + slot, new Blob([image], { type: 'image/png' }), 'slot.png');
  }
  for (const value of placement === undefined ? [] : [placement].flat()) body.append('placement', value);
  const request = new Request('http://localhost/admin/mockups-comerciais/render', { method: 'POST', body, headers });
  return POST({ request } as Parameters<typeof POST>[0]);
}

describe('rota de enquadramento dos mockups', () => {
  it('envia a composição validada ao motor e mantém suporte a formulários anteriores', async () => {
    const response = await call({ placement: JSON.stringify(custom) });
    expect(response.status).toBe(200);
    expect(response.headers.get('content-type')).toBe('image/png');
    expect(vi.mocked(renderMugMockup)).toHaveBeenLastCalledWith('9', Buffer.from('normalized'), { placement: custom });
    expect((await call()).status).toBe(200);
    expect(vi.mocked(renderMugMockup)).toHaveBeenLastCalledWith('9', Buffer.from('normalized'), { placement: undefined });
  });

  it('rejeita modelo, enquadramento, origem, limite e arte inválidos', async () => {
    expect((await call({ model: 'invalid' })).status).toBe(400);
    expect((await call({ placement: '{broken' })).status).toBe(400);
    expect((await call({ placement: ['{"mode":"original"}', '{"mode":"original"}'] })).status).toBe(400);
    expect((await call({ headers: { 'Sec-Fetch-Site': 'cross-site' } })).status).toBe(403);
    expect((await call({ headers: { 'Content-Length': String(17 * 1024 * 1024) } })).status).toBe(413);
    vi.mocked(normalizeMugArtwork).mockRejectedValueOnce(new Error('invalid image'));
    expect((await call()).status).toBe(422);
  });

  it('aceita correções independentes na cena 9 e rejeita IDs externos', async () => {
    const adjustment = (zoom: number, offsetX = 0) => ({ zoom, offsetX, offsetY: 0 });
    const placement = { mode: 'original', instances: {
      'caneca-esquerda': adjustment(155), 'caneca-meio': adjustment(70), 'caneca-direita': adjustment(100, 18),
    } };
    expect((await call({ placement: JSON.stringify(placement) })).status).toBe(200);
    expect(vi.mocked(renderMugMockup)).toHaveBeenLastCalledWith('9', Buffer.from('normalized'), { placement });
    expect((await call({ placement: JSON.stringify({ mode: 'original', instances: { 'arte-superior': adjustment(110) } }) })).status).toBe(200);
    for (const id of ['caneca-centro', 'papeis-sobrepostos']) {
      expect((await call({ placement: JSON.stringify({ mode: 'original', instances: { [id]: adjustment(110) } }) })).status).toBe(400);
    }
  });

  it('aceita uma arte específica para a faixa e exige imagens nos demais espaços sem arte geral', async () => {
    expect((await call({ overrides: { 'arte-superior': 'imagem da faixa' } })).status).toBe(200);
    expect(vi.mocked(renderMugMockup)).toHaveBeenLastCalledWith('9', Buffer.from('normalized'), {
      placement: undefined, artworks: { 'arte-superior': Buffer.from('normalized') },
    });
    expect((await call({ content: '', overrides: { 'arte-superior': 'imagem da faixa' } })).status).toBe(400);
  });
});
