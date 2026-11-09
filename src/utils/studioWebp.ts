import { hasImageSignature } from './uploadImages';

export function getStudioWebpSize(buffer: Buffer): { width: number; height: number } | undefined {
  if (buffer.length < 30 || !hasImageSignature(buffer, 'image/webp') ||
      buffer.readUInt32LE(4) !== buffer.length - 8) return;
  let canvasSize: { width: number; height: number } | undefined;
  let frameSize: { width: number; height: number } | undefined;
  let colorProfile = false;
  let needsColorProfile = false;

  // Canvas may emit VP8 directly, or wrap it in VP8X with an ICC color profile.
  for (let offset = 12; offset < buffer.length;) {
    const data = offset + 8;
    if (data > buffer.length) return;
    const tag = buffer.toString('ascii', offset, offset + 4);
    const length = buffer.readUInt32LE(offset + 4);
    const next = data + length + (length % 2);
    if (next > buffer.length) return;
    if (tag === 'VP8X' && offset === 12 && length === 10 && (buffer[data] & ~0x20) === 0) {
      needsColorProfile = Boolean(buffer[data] & 0x20);
      canvasSize = { width: 1 + buffer.readUIntLE(data + 4, 3), height: 1 + buffer.readUIntLE(data + 7, 3) };
    } else if (tag === 'ICCP' && needsColorProfile && !colorProfile && !frameSize && length > 0) {
      colorProfile = true;
    } else if (tag === 'VP8 ' && !frameSize && length > 10 &&
        (buffer[data] & 1) === 0 && buffer.readUIntBE(data + 3, 3) === 0x9d012a) {
      frameSize = { width: buffer.readUInt16LE(data + 6) & 0x3fff, height: buffer.readUInt16LE(data + 8) & 0x3fff };
    } else {
      return;
    }
    offset = next;
  }

  if (!frameSize?.width || !frameSize.height || colorProfile !== needsColorProfile ||
      (canvasSize && (canvasSize.width !== frameSize.width || canvasSize.height !== frameSize.height))) return;
  return frameSize;
}
