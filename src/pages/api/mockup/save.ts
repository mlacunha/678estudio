import type { APIRoute } from 'astro';
import { randomUUID } from 'node:crypto';
import { mkdir, readdir, writeFile } from 'node:fs/promises';
import { getUploadPath, hasImageSignature, MAX_IMAGE_BYTES, MAX_MOCKUP_PAYLOAD_BYTES } from '../../../utils/uploadImages';
import { getPublicOrigin } from '../../../utils/publicOrigin';
import { getRequestStudioSettings } from '../../../db/studioSettings';

export const prerender = false;

const WINDOW_MS = 60_000;
const MAX_REQUESTS = 20;
const MAX_STORED_MOCKUPS = 200;
const BODY_TIMEOUT_MS = 15_000;
let windowEnd = 0;
let requestCount = 0;
let saving = false;

async function readPayload(request: Request): Promise<Buffer | 408 | 413> {
  const reader = request.body?.getReader();
  if (!reader) return Buffer.alloc(0);

  const chunks: Uint8Array[] = [];
  let size = 0;
  let timedOut = false;
  const timer = setTimeout(() => {
    timedOut = true;
    void reader.cancel().catch(() => {});
  }, BODY_TIMEOUT_MS);
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (timedOut) return 408;
      if (done) return Buffer.concat(chunks, size);
      size += value.byteLength;
      if (size > MAX_MOCKUP_PAYLOAD_BYTES) {
        void reader.cancel().catch(() => {});
        return 413;
      }
      chunks.push(value);
    }
  } finally {
    clearTimeout(timer);
    reader.releaseLock();
  }
}

const payloadTooLarge = () =>
  Response.json({ success: false, error: 'O limite por mockup é 10 MB' }, {
    status: 413,
    headers: { Connection: 'close' },
  });

export const POST: APIRoute = async ({ request, url, locals }) => {
  if (Number(request.headers.get('content-length')) > MAX_MOCKUP_PAYLOAD_BYTES) {
    return payloadTooLarge();
  }
  if (request.headers.get('content-type')?.split(';')[0].trim().toLowerCase() !== 'application/json') {
    return Response.json({ success: false, error: 'Formato de requisição inválido' }, {
      status: 415,
      headers: { Connection: 'close' },
    });
  }

  const now = Date.now();
  if (now >= windowEnd) {
    windowEnd = now + WINDOW_MS;
    requestCount = 0;
  }
  if (requestCount >= MAX_REQUESTS) {
    return Response.json({ success: false, error: 'Limite de geração atingido. Tente novamente em instantes.' }, {
      status: 429,
      headers: { Connection: 'close', 'Retry-After': String(Math.ceil((windowEnd - now) / 1000)) },
    });
  }
  requestCount++;

  if (saving) {
    return Response.json({ success: false, error: 'Outra prévia está sendo processada. Tente novamente.' }, {
      status: 429,
      headers: { Connection: 'close', 'Retry-After': '2' },
    });
  }
  saving = true;

  try {
    const payload = await readPayload(request);
    if (payload === 413) return payloadTooLarge();
    if (payload === 408) {
      return Response.json({ success: false, error: 'Tempo de envio excedido.' }, {
        status: 408,
        headers: { Connection: 'close' },
      });
    }

    let imageBase64: unknown;
    try {
      imageBase64 = JSON.parse(payload.toString('utf8'))?.imageBase64;
    } catch {
      return Response.json({ success: false, error: 'Dados de imagem inválidos' }, { status: 400 });
    }

    if (!imageBase64 || typeof imageBase64 !== 'string') {
      return Response.json({ success: false, error: 'Dados de imagem ausentes' }, { status: 400 });
    }

    if (imageBase64.length > MAX_MOCKUP_PAYLOAD_BYTES) {
      return payloadTooLarge();
    }

    const base64Data = imageBase64.replace(/^data:image\/png;base64,/, '');
    if (!/^[a-zA-Z0-9+/]+={0,2}$/.test(base64Data)) {
      return Response.json({ success: false, error: 'Dados de PNG inválidos' }, { status: 400 });
    }
    const buffer = Buffer.from(base64Data, 'base64');
    if (buffer.length > MAX_IMAGE_BYTES) {
      return payloadTooLarge();
    }
    if (!hasImageSignature(buffer, 'image/png')) {
      return Response.json({ success: false, error: 'Dados de PNG inválidos' }, { status: 400 });
    }

    const origin = getPublicOrigin(url.origin);
    const directory = getUploadPath('mockups');
    await mkdir(directory, { recursive: true });
    const entries = await readdir(directory);
    if (entries.length >= MAX_STORED_MOCKUPS) {
      return Response.json({ success: false, error: 'Armazenamento de prévias cheio.' }, { status: 507 });
    }

    const filename = `mockups/mockup-${randomUUID()}.png`;
    await writeFile(getUploadPath(filename), buffer, { flag: 'wx' });
    const relativePath = `/uploads/${filename}`;
    const fullMockupUrl = `${origin}${relativePath}`;

    const { whatsapp } = await getRequestStudioSettings(locals);
    return Response.json({
      success: true, relativeUrl: relativePath, fullUrl: fullMockupUrl, whatsappAvailable: Boolean(whatsapp),
    }, { status: 201 });
  } catch {
    return Response.json({ success: false, error: 'Falha ao salvar mockup temporário' }, { status: 500 });
  } finally {
    saving = false;
  }
};

