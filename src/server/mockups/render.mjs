import { readFile } from 'node:fs/promises';
import { join, resolve } from 'node:path';
import { promisify } from 'node:util';
import { gunzip } from 'node:zlib';
import sharp from 'sharp';
import { mugMockups } from './options.mjs';
import { prepareSlotImage } from './prepare-input.mjs';

const unzip = promisify(gunzip);
const templates = resolve('src/server/mockups/templates');
const bytesPerPixel = 16;
const toneStops = [0, 64, 128, 192, 255];

export async function normalizeMugArtwork(bytes) {
  const source = sharp(bytes, { limitInputPixels: 16_000_000, failOn: 'warning' });
  const { format, pages } = await source.metadata();
  if (!['png', 'jpeg', 'webp'].includes(format) || (pages ?? 1) !== 1) {
    throw new Error('Formato de arte inválido.');
  }
  return source.rotate().toColourspace('srgb').png().toBuffer();
}

export async function renderMugMockup(id, artwork, { fit } = {}) {
  if (!mugMockups.some(model => model.id === id)) throw new RangeError('Modelo de mockup inválido.');
  const directory = join(templates, id);
  const manifest = JSON.parse(await readFile(join(directory, 'manifest.json'), 'utf8'));
  const { width, height, slots, profile } = manifest;
  const base = await readFile(join(directory, 'base.png'));
  // Calibration is measured in the PSD's embedded color space, including Adobe RGB in model 11.
  const output = await sharp(base, { ignoreIcc: true }).ensureAlpha().raw().toBuffer();
  const prepared = new Map();

  for (const slot of slots) {
    const placement = { ...slot.placement, ...(fit ? { fit } : {}) };
    const key = JSON.stringify([slot.input, placement]);
    if (!prepared.has(key)) {
      const png = await prepareSlotImage(artwork, slot.input, placement);
      const pixels = sharp(png).removeAlpha();
      if (profile) pixels.withIccProfile(join(directory, profile));
      prepared.set(key, await pixels.raw().toBuffer());
    }
    const map = await unzip(await readFile(join(directory, slot.file)), {
      maxOutputLength: slot.width * slot.height * bytesPerPixel,
    });
    if (map.length !== slot.width * slot.height * bytesPerPixel) throw new Error('Mapa de composição incompleto.');
    applySlot(output, width, slot, map, prepared.get(key));
  }

  const png = await sharp(output, { raw: { width, height, channels: 4 } }).png().toBuffer();
  return withOriginalPngMetadata(png, base);
}

const colorAndDensityChunks = new Set(['iCCP', 'sRGB', 'gAMA', 'cHRM', 'pHYs']);

function pngChunks(png) {
  const chunks = [];
  for (let start = 8; start + 12 <= png.length;) {
    const end = start + 12 + png.readUInt32BE(start);
    chunks.push({ type: png.toString('ascii', start + 4, start + 8), bytes: png.subarray(start, end) });
    start = end;
  }
  return chunks;
}

function withOriginalPngMetadata(png, base) {
  const [header, ...chunks] = pngChunks(png);
  const originalMetadata = pngChunks(base).filter(chunk => colorAndDensityChunks.has(chunk.type));
  return Buffer.concat([
    png.subarray(0, 8),
    header.bytes,
    ...originalMetadata.map(chunk => chunk.bytes),
    ...chunks.filter(chunk => !colorAndDensityChunks.has(chunk.type)).map(chunk => chunk.bytes),
  ]);
}

function applySlot(output, width, slot, map, image) {
  const inputWidth = slot.input.width;
  const inputHeight = slot.input.height;
  for (let row = 0; row < slot.height; row++) {
    let dst = ((slot.top + row) * width + slot.left) * 4;
    let offset = row * slot.width * bytesPerPixel;
    for (let col = 0; col < slot.width; col++, dst += 4, offset += bytesPerPixel) {
      if (!(map[offset + 13] | map[offset + 14] | map[offset + 15])) continue;
      const x = map.readUInt16LE(offset) * (inputWidth - 1) / 65535;
      const y = map.readUInt16LE(offset + 2) * (inputHeight - 1) / 65535;
      const x0 = Math.floor(x);
      const y0 = Math.floor(y);
      const x1 = Math.min(x0 + 1, inputWidth - 1);
      const y1 = Math.min(y0 + 1, inputHeight - 1);
      const dx = x - x0;
      const dy = y - y0;
      const tl = (y0 * inputWidth + x0) * 3;
      const tr = (y0 * inputWidth + x1) * 3;
      const bl = (y1 * inputWidth + x0) * 3;
      const br = (y1 * inputWidth + x1) * 3;
      for (let c = 0; c < 3; c++) {
        const upper = image[tl + c] * (1 - dx) + image[tr + c] * dx;
        const lower = image[bl + c] * (1 - dx) + image[br + c] * dx;
        const sample = upper * (1 - dy) + lower * dy;
        const segment = Math.min(3, Math.floor(sample / 64));
        const lowerTone = segment ? map[offset + 4 + (segment - 1) * 3 + c] : 0;
        const upperTone = map[offset + 4 + segment * 3 + c];
        const weight = (sample - toneStops[segment]) / (toneStops[segment + 1] - toneStops[segment]);
        const tone = lowerTone + (upperTone - lowerTone) * weight;
        output[dst + c] = Math.min(255, output[dst + c] + Math.round(tone));
      }
    }
  }
}
