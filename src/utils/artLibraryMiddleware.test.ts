import type { APIContext } from 'astro';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { onRequest } from '../middleware';

vi.mock('astro:middleware', () => ({ defineMiddleware: (middleware: unknown) => middleware }));

afterEach(() => vi.unstubAllEnvs());

describe('art library admin middleware protection', () => {
  it.each([
    '/admin/artes',
    '/api/admin/artes',
    '/api/admin/artes/categorias',
    '/api/admin/artes/00000000-0000-4000-8000-000000000000/imagem?variante=orig',
  ])('should protect %s with Basic Auth and Origin validation on writes', async route => {
    vi.stubEnv('ADMIN_USERNAME', 'test-admin');
    vi.stubEnv('ADMIN_PASSWORD', 'test-password');
    vi.stubEnv('PUBLIC_ORIGIN', 'https://example.test');
    const url = new URL(route, 'https://example.test');
    const next = vi.fn(async () => new Response('ok', { status: 200 }));
    const auth = 'Basic ' + Buffer.from('test-admin:test-password').toString('base64');

    const unauth = await onRequest({ url, request: new Request(url, { method: 'GET' }) } as APIContext, next);
    expect(unauth?.status).toBe(401);

    const crossOriginWrite = await onRequest({
      url,
      request: new Request(url, { method: 'POST', headers: { Authorization: auth, Origin: 'https://evil.example' } }),
    } as APIContext, next);
    expect(crossOriginWrite?.status).toBe(403);
    expect(next).not.toHaveBeenCalled();

    const validGet = await onRequest({
      url,
      request: new Request(url, { method: 'GET', headers: { Authorization: auth } }),
    } as APIContext, next);
    expect(validGet?.status).toBe(200);
    expect(next).toHaveBeenCalledOnce();
  });
});

