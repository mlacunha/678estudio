let active = 0;
let paused = false;
let onIdle: (() => void) | undefined;

export async function serveDuringMaintenance(request: Request, pathname: string, next: () => Promise<Response>) {
  if (paused) return new Response('O estúdio está em manutenção. Tente novamente em instantes.', {
    status: 503, headers: { 'Cache-Control': 'no-store', 'Retry-After': '5' },
  });
  // Estas ações coordenam a pausa e não podem esperar por si mesmas.
  if (request.method === 'POST' && /^\/admin\/backup\/(baixar|validar|restaurar)\/?$/.test(pathname)) return next();
  active += 1;
  try {
    return await next();
  } finally {
    active -= 1;
    if (!active) onIdle?.();
  }
}

export async function pauseUntilIdle() {
  if (paused) return false;
  paused = true;
  if (!active) return true;
  const drained = await new Promise<boolean>(resolve => {
    const timer = setTimeout(() => resolve(false), 15_000);
    onIdle = () => {
      clearTimeout(timer);
      resolve(true);
    };
  });
  onIdle = undefined;
  if (!drained) resumeRequests();
  return drained;
}

export function resumeRequests() {
  paused = false;
}
