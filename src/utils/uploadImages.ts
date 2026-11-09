import path from 'node:path';

export const MAX_IMAGE_BYTES = 10 * 1024 * 1024;
export const MAX_MOCKUP_PAYLOAD_BYTES = Math.ceil(MAX_IMAGE_BYTES / 3) * 4 + 1024;

const imageTypes = new Map([
  ['.jpg', 'image/jpeg'],
  ['.jpeg', 'image/jpeg'],
  ['.png', 'image/png'],
  ['.gif', 'image/gif'],
  ['.webp', 'image/webp'],
]);

export function getImageType(filename: string): string | undefined {
  return imageTypes.get(path.extname(filename).toLowerCase());
}

export function getUploadPath(filename: string): string {
  return path.resolve(process.cwd(), 'public', 'uploads', filename);
}

export function hasImageSignature(buffer: Buffer, type: string): boolean {
  switch (type) {
    case 'image/jpeg':
      return buffer.subarray(0, 3).equals(Buffer.from([0xff, 0xd8, 0xff]));
    case 'image/png':
      return buffer.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]));
    case 'image/gif':
      return ['GIF87a', 'GIF89a'].includes(buffer.toString('ascii', 0, 6));
    case 'image/webp':
      return buffer.toString('ascii', 0, 4) === 'RIFF' && buffer.toString('ascii', 8, 12) === 'WEBP';
    default:
      return false;
  }
}
