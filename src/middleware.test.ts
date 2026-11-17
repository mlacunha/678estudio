import type { APIContext } from 'astro';
import { afterEach, expect, it, vi } from 'vitest';
import { onRequest } from './middleware';

vi.mock('astro:middleware', () => ({ defineMiddleware: (middleware: unknown) => middleware }));

afterEach(() => vi.unstubAllEnvs());

it.each([
  '/admin', '/admin/produtos', '/admin/categorias',
  '/api/products', '/api/products/prod-c1', '/api/categories', '/api/categories/cat-quadros',
  '/admin/trabalhos/gravar', '/admin/trabalhos/imagem/photo', '/admin/agenda-classica.pdf',
  '/admin/agendas', '/admin/agendas/uma-referencia/arquivo/original', '/admin/agendas/uma-referencia/arquivo/configuracao',
  '/admin/backup', '/admin/backup/baixar', '/admin/backup/validar', '/admin/backup/restaurar',
])('protects administrative requests to %s', async (route) => {
  vi.stubEnv('ADMIN_USERNAME', 'test-admin');
  vi.stubEnv('ADMIN_PASSWORD', 'test-password');
  vi.stubEnv('PUBLIC_ORIGIN', 'https://example.test');
  const url = new URL(route, 'https://example.test');
  const next = vi.fn(async () => new Response(null, { status: 303 }));
  const submit = (headers: HeadersInit) => onRequest({
    url, request: new Request(url, { method: 'POST', headers }),
  } as APIContext, next);

  expect((await submit({}))?.status).toBe(401);
  const Authorization = 'Basic ' + Buffer.from('test-admin:test-password').toString('base64');
  expect((await submit({ Authorization, Origin: 'https://other.example.test' }))?.status).toBe(403);
  expect(next).not.toHaveBeenCalled();
  expect((await submit({ Authorization, Origin: url.origin }))?.status).toBe(303);
  expect(next).toHaveBeenCalledOnce();
});

it.each(['/admin', '/admin/produtos', '/admin/categorias'])(
  'it should return 503 when credentials are unset and 401 Basic Auth challenge when unauthenticated on %s',
  async (route) => {
    vi.stubEnv('ADMIN_USERNAME', '');
    vi.stubEnv('ADMIN_PASSWORD', '');
    const url = new URL(route, 'http://127.0.0.1:4321');
    const next = vi.fn(async () => new Response('<html>ok</html>', { status: 200 }));

    const res503 = await onRequest({ url, request: new Request(url, { method: 'GET' }) } as APIContext, next);
    expect(res503?.status).toBe(503);

    vi.stubEnv('ADMIN_USERNAME', 'test-admin');
    vi.stubEnv('ADMIN_PASSWORD', 'test-password');

    const res401 = await onRequest({ url, request: new Request(url, { method: 'GET' }) } as APIContext, next);
    expect(res401?.status).toBe(401);
    expect(res401?.headers.get('WWW-Authenticate')).toBe('Basic realm="678 Estudio", charset="UTF-8"');

    const Authorization = 'Basic ' + Buffer.from('test-admin:test-password').toString('base64');
    const res200 = await onRequest(
      { url, request: new Request(url, { method: 'GET', headers: { Authorization } }) } as APIContext,
      next,
    );
    expect(res200?.status).toBe(200);
    expect(res200?.headers.get('Cache-Control')).toBe('no-store');
  },
);
