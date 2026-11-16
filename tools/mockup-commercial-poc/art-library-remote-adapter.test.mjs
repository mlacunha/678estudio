import { afterEach, describe, expect, it, vi } from 'vitest';
import { createRemoteArtLibraryAdapter, normalizeRemoteBaseUrl } from './art-library-remote-adapter.mjs';

describe('normalizeRemoteBaseUrl', () => {
  it('it should accept https URLs and return origin only', () => {
    expect(normalizeRemoteBaseUrl('https://678estudio.com.br/admin/artes')).toBe('https://678estudio.com.br');
  });

  it('it should accept localhost and 127.0.0.1 over http for testing', () => {
    expect(normalizeRemoteBaseUrl('http://127.0.0.1:4346/admin')).toBe('http://127.0.0.1:4346');
    expect(normalizeRemoteBaseUrl('http://localhost:4321')).toBe('http://localhost:4321');
  });

  it('it should reject non-https remote URLs and malformed URLs', () => {
    expect(() => normalizeRemoteBaseUrl('http://example.com')).toThrow(/HTTPS/i);
    expect(() => normalizeRemoteBaseUrl('not-a-url')).toThrow(/inválida/i);
  });
});

describe('createRemoteArtLibraryAdapter', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('it should start disconnected without exposing credentials', () => {
    const adapter = createRemoteArtLibraryAdapter({ defaultUrl: 'https://678estudio.com.br' });
    expect(adapter.getStatus()).toEqual({
      connected: false,
      baseUrl: null,
      defaultUrl: 'https://678estudio.com.br',
    });
  });

  it('it should reject invalid credentials with 401 and keep disconnected state', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ status: 401, ok: false }));
    const adapter = createRemoteArtLibraryAdapter();
    await expect(
      adapter.connect({ baseUrl: 'https://678estudio.com.br', username: 'admin', password: 'wrong' }),
    ).rejects.toThrow(/401/);
    expect(adapter.getStatus().connected).toBe(false);
  });

  it('it should authenticate, list arts with filters, fetch orig image, and clear session on 401 or disconnect', async () => {
    const fetchMock = vi.fn(async url => {
      if (url.includes('/api/admin/artes/categorias')) {
        return {
          status: 200,
          ok: true,
          json: async () => ({ data: [{ id: 'cat-1', slug: 'floral', name: 'Floral' }] }),
        };
      }
      if (url.includes('/api/admin/artes?')) {
        return {
          status: 200,
          ok: true,
          json: async () => ({
            data: [
              {
                id: '11111111-1111-4111-8111-111111111111',
                code: 'ART-0001',
                title: 'Panorâmica Teste',
                description: 'Desc',
                groupDescription: 'Grupo',
                currentVersion: 2,
                isPublished: true,
                versionInfo: { width: 2100, height: 900, originalExt: 'png', fileSize: 1234 },
                categories: [{ id: 'cat-1', slug: 'floral', name: 'Floral' }],
                products: ['caneca'],
              },
            ],
          }),
        };
      }
      if (url.includes('/imagem?')) {
        return {
          status: 200,
          ok: true,
          headers: new Headers({ 'content-type': 'image/png' }),
          arrayBuffer: async () => Uint8Array.from([137, 80, 78, 71]).buffer,
        };
      }
      return { status: 404, ok: false };
    });
    vi.stubGlobal('fetch', fetchMock);

    const adapter = createRemoteArtLibraryAdapter();
    const status = await adapter.connect({
      baseUrl: 'https://678estudio.com.br',
      username: 'admin',
      password: 'secret',
    });
    expect(status.connected).toBe(true);
    expect(status.baseUrl).toBe('https://678estudio.com.br');

    const listed = await adapter.listArtes({ q: 'Panorâmica', product: 'caneca', categoryId: 'cat-1' });
    expect(listed.items).toHaveLength(1);
    expect(listed.items[0].code).toBe('ART-0001');
    expect(listed.categories).toHaveLength(1);

    const img = await adapter.readArtVariant('11111111-1111-4111-8111-111111111111', 2, 'orig');
    expect(img.mime).toBe('image/png');
    expect(img.buffer.length).toBe(4);

    // Simulate expired session (401)
    fetchMock.mockResolvedValueOnce({ status: 401, ok: false });
    await expect(
      adapter.readArtVariant('11111111-1111-4111-8111-111111111111', 2, 'thumb'),
    ).rejects.toThrow(/401/);
    expect(adapter.getStatus().connected).toBe(false);

    adapter.disconnect();
    expect(adapter.getStatus().connected).toBe(false);
  });
});
