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

function call({ model = '9', placement, content = 'image', headers }: {
  model?: string; placement?: string | string[]; content?: string; headers?: HeadersInit;
} = {}) {
  const body = new FormData();
  body.set('model', model);
  body.set('artwork', new Blob([content], { type: 'image/png' }), 'art.png');
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
    expect((await call({ headers: { 'Content-Length': String(9 * 1024 * 1024) } })).status).toBe(413);
    vi.mocked(normalizeMugArtwork).mockRejectedValueOnce(new Error('invalid image'));
    expect((await call()).status).toBe(422);
  });
});
