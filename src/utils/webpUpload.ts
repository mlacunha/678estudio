import { getStudioWebpSize } from './studioWebp';

export const MAX_FILE_BYTES = 1024 * 1024;

export async function readBoundedForm(request: Request, contentType: string, maxBytes: number) {
  const reader = request.body?.getReader();
  if (!reader) return;
  const parts: Uint8Array[] = [];
  let size = 0;
  try {
    while (true) {
      const { value, done } = await reader.read();
      if (done) break;
      size += value.byteLength;
      if (size > maxBytes) {
        void reader.cancel().catch(() => {});
        return;
      }
      parts.push(value);
    }
    return await new Response(Uint8Array.from(Buffer.concat(parts, size)), { headers: { 'Content-Type': contentType } }).formData();
  } finally {
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
