import { getStudioWebpSize } from './studioWebp';

export const MAX_FILE_BYTES = 1024 * 1024;

export async function readBoundedForm(request: Request, contentType: string, maxBytes: number, signal?: AbortSignal) {
  const reader = request.body?.getReader();
  if (!reader) return;
  const cancel = () => { void reader.cancel().catch(() => {}); };
  signal?.addEventListener('abort', cancel, { once: true });
  const parts: Uint8Array[] = [];
  let size = 0;
  try {
    if (signal?.aborted) { cancel(); return; }
    while (true) {
      const { value, done } = await reader.read();
      if (done) break;
      size += value.byteLength;
      if (size > maxBytes) {
        cancel();
        return;
      }
      parts.push(value);
    }
    if (!signal?.aborted) {
      return await new Response(Uint8Array.from(Buffer.concat(parts, size)), { headers: { 'Content-Type': contentType } }).formData();
    }
  } finally {
    signal?.removeEventListener('abort', cancel);
    reader.releaseLock();
  }
}

export async function readUploadedWebp(entry: FormDataEntryValue | null, maxSide: number, square = false) {
  if (!(entry instanceof File) || entry.type !== 'image/webp' || entry.size > MAX_FILE_BYTES) return;
  const buffer = Buffer.from(await entry.arrayBuffer());
  const size = getStudioWebpSize(buffer);
  if (size && Math.max(size.width, size.height) <= maxSide && (!square || size.width === size.height)) {
    return { buffer, ...size };
  }
}
