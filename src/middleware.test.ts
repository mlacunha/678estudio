import type { APIContext } from 'astro';
import { afterEach, expect, it, vi } from 'vitest';
import { onRequest } from './middleware';

vi.mock('astro:middleware', () => ({ defineMiddleware: (middleware: unknown) => middleware }));

afterEach(() => vi.unstubAllEnvs());

it.each([
  '/admin', '/admin/trabalhos/gravar', '/admin/trabalhos/imagem/photo', '/admin/agenda-classica.pdf',
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
