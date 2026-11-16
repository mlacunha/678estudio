import { readFileSync } from 'node:fs';
import sharp from 'sharp';

/** Calcula posição e dimensões finais da imagem de entrada dentro do slot sem deformar proporções. */
export function computeSlotPlacement(srcW, srcH, targetW, targetH, options = {}) {
  const fit = options.fit ?? 'contain';
  const scale = Number.isFinite(Number(options.scale)) ? Math.max(0.2, Math.min(4, Number(options.scale))) : 1.0;
  const anchorX = Number.isFinite(Number(options.anchorX)) ? Number(options.anchorX) : 0.5;
  const anchorY = Number.isFinite(Number(options.anchorY)) ? Number(options.anchorY) : 0.5;

  const baseScale = fit === 'contain'
    ? Math.min(targetW / srcW, targetH / srcH)
    : Math.max(targetW / srcW, targetH / srcH);
  const effectiveScale = baseScale * scale;
  const scaledW = Math.max(1, Math.round(srcW * effectiveScale));
  const scaledH = Math.max(1, Math.round(srcH * effectiveScale));
  const dx = Math.round((targetW - scaledW) * anchorX);
  const dy = Math.round((targetH - scaledH) * anchorY);

  return { fit, scale, anchorX, anchorY, scaledW, scaledH, dx, dy };
}

/** Prepara uma imagem (PNG, JPEG ou WebP) aplicando enquadramento/recorte para o slot alvo. */
export async function prepareSlotImage(input, expectedSize, options = {}) {
  const source = Buffer.isBuffer(input) ? input : readFileSync(input);
  const rotated = sharp(source).rotate();
  const meta = await rotated.metadata();
  const srcW = meta.width || expectedSize.width;
  const srcH = meta.height || expectedSize.height;
  const { scaledW, scaledH, dx, dy } = computeSlotPlacement(srcW, srcH, expectedSize.width, expectedSize.height, options);
  const background = options.background ?? { r: 255, g: 255, b: 255, alpha: 1 };

  const resizedBuf = await rotated.resize(scaledW, scaledH, { fit: 'fill' }).png().toBuffer();

  const extractLeft = Math.max(0, -dx);
  const extractTop = Math.max(0, -dy);
  const destLeft = Math.max(0, dx);
  const destTop = Math.max(0, dy);
  const visibleW = Math.min(scaledW - extractLeft, expectedSize.width - destLeft);
  const visibleH = Math.min(scaledH - extractTop, expectedSize.height - destTop);

  if (visibleW <= 0 || visibleH <= 0) {
    return sharp({
      create: { width: expectedSize.width, height: expectedSize.height, channels: 4, background },
    }).png().toBuffer();
  }

  const croppedBuf = await sharp(resizedBuf)
    .extract({ left: extractLeft, top: extractTop, width: visibleW, height: visibleH })
    .toBuffer();

  return sharp({
    create: { width: expectedSize.width, height: expectedSize.height, channels: 4, background },
  })
    .composite([{ input: croppedBuf, left: destLeft, top: destTop }])
    .png()
    .toBuffer();
}
