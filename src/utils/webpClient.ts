import { loadArtwork } from './customizerClient';

const QUALITY = 0.82;
const MAX_ART_BYTES = 10 * 1024 * 1024;

export function isWebpSource(file: File): boolean {
  return file.size > 0 && file.size <= MAX_ART_BYTES && ['image/jpeg', 'image/png', 'image/webp'].includes(file.type);
}

export async function loadWebpSource(file: File): Promise<HTMLImageElement> {
  if (!isWebpSource(file)) {
    throw new Error('Envie uma imagem JPG, PNG ou WebP de até 10 MB.');
  }
  return loadArtwork(file);
}

export function encodeWebp(source: HTMLCanvasElement | HTMLImageElement, maxSide: number, square = false): Promise<Blob> {
  const sourceWidth = source instanceof HTMLImageElement ? source.naturalWidth : source.width;
  const sourceHeight = source instanceof HTMLImageElement ? source.naturalHeight : source.height;
  const scale = Math.min(1, maxSide / Math.max(sourceWidth, sourceHeight));
  const width = Math.max(1, Math.round(sourceWidth * scale));
  const height = Math.max(1, Math.round(sourceHeight * scale));
  const canvas = document.createElement('canvas');
  canvas.width = square ? Math.max(width, height) : width;
  canvas.height = square ? canvas.width : height;
  const context = canvas.getContext('2d', { alpha: false });
  if (!context) throw new Error('Não foi possível preparar a imagem.');
  context.fillStyle = '#262422';
  context.fillRect(0, 0, canvas.width, canvas.height);
  context.imageSmoothingQuality = 'high';
  context.drawImage(source, Math.floor((canvas.width - width) / 2), Math.floor((canvas.height - height) / 2), width, height);

  return new Promise((resolve, reject) => {
    canvas.toBlob(blob => {
      if (blob?.type === 'image/webp') resolve(blob);
      else reject(new Error('Este navegador não conseguiu exportar WebP.'));
    }, 'image/webp', QUALITY);
  });
}
