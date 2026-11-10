import { createHash, timingSafeEqual } from 'node:crypto';
import { defineMiddleware } from 'astro:middleware';
import { getPublicOrigin } from './utils/publicOrigin';
import { serveDuringMaintenance } from './server/backup/maintenance';

const digest = (value: string) => createHash('sha256').update(value).digest();

export const onRequest = defineMiddleware(async ({ request, url }, next) => {
  let pathname: string;
  try {
    pathname = decodeURI(url.pathname);
  } catch {
    return new Response('Endereço inválido.', { status: 400 });
  }
  // O catálogo serve imagens prontas e não usa o otimizador SSR.
  if (/^\/_image\/?$/.test(pathname)) return new Response(null, { status: 404 });

  const protectedRoute =
    /^\/(admin|api\/products|api\/upload)(\/|$)/.test(pathname) ||
    (/^\/api\/categories\/?$/.test(pathname) && url.searchParams.get('all') === 'true');

  const serve = () => serveDuringMaintenance(request, pathname, next);
  if (!protectedRoute) return serve();

  const headers = { 'Cache-Control': 'no-store' };
  const { ADMIN_USERNAME: username, ADMIN_PASSWORD: password } = process.env;
  if (!username || username.includes(':') || !password) {
    return new Response('Administração indisponível.', { status: 503, headers });
  }

  const token = request.headers.get('Authorization')?.match(/^Basic ([A-Za-z0-9+/]+={0,2})$/i)?.[1];
  const credentials = token ? Buffer.from(token, 'base64').toString('utf8') : '';
  if (!timingSafeEqual(digest(credentials), digest(`${username}:${password}`))) {
    return new Response('Autenticação necessária.', {
      status: 401,
      headers: { ...headers, 'WWW-Authenticate': 'Basic realm="678 Estudio", charset="UTF-8"' },
    });
  }

  const origin = request.headers.get('Origin');
  if (origin && !['GET', 'HEAD', 'OPTIONS'].includes(request.method) && origin !== getPublicOrigin(url.origin)) {
    return new Response('Origem não autorizada.', { status: 403, headers });
  }

  const response = await serve();
  response.headers.set('Cache-Control', 'no-store');
  return response;
});
