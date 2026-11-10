import { afterEach, expect, it, vi } from 'vitest';
import { pauseUntilIdle, resumeRequests, serveDuringMaintenance } from './maintenance';

afterEach(resumeRequests);

it('aguarda handlers ativos e rejeita novos pedidos antes da pausa controlada', async () => {
  let finish!: () => void;
  const running = new Promise<Response>(resolve => { finish = () => resolve(new Response('concluído')); });
  const request = new Request('https://studio.example/api/upload', { method: 'POST' });
  const handler = serveDuringMaintenance(request, '/api/upload', () => running);
  const drained = vi.fn();
  const pause = pauseUntilIdle().then(drained);
  const next = vi.fn(async () => new Response('nova alteração'));
  expect((await serveDuringMaintenance(request, '/api/upload', next)).status).toBe(503);
  expect(next).not.toHaveBeenCalled();
  expect(drained).not.toHaveBeenCalled();
  finish();
  await handler;
  await pause;
  expect(drained).toHaveBeenCalledWith(true);
  resumeRequests();
  expect((await serveDuringMaintenance(request, '/api/upload', next)).status).toBe(200);
});

it('a ação que iniciou a pausa não fica aguardando o próprio handler', async () => {
  const request = new Request('https://studio.example/admin/backup/restaurar', { method: 'POST' });
  const response = await serveDuringMaintenance(request, '/admin/backup/restaurar', async () =>
    new Response(null, { status: await pauseUntilIdle() ? 202 : 503 }));
  expect(response.status).toBe(202);
});
