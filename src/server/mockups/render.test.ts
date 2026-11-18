import sharp from 'sharp';
import { createHash } from 'node:crypto';
import { describe, expect, it } from 'vitest';
import { mugMockups } from './options.mjs';
import { normalizeMugArtwork, renderMugMockup } from './render.mjs';
import { combinePlacement, framedArtwork, instanceGeometry, mugFrame, neutralAdjustment, parseMugPlacement, slotFrame } from './placement.mjs';
import { getMugInstances } from './manifest.mjs';

describe('Commercial mug mockups', () => {
  it('shares the native crop with the visual editor and centers or changes fit independently', () => {
    const photo = { width: 80, height: 40 };
    const slot = { width: 100, height: 100 };
    const native = { fit: 'cover' as const, scale: 1, anchorX: 0, anchorY: 0.5 };
    expect(instanceGeometry(photo, slot, native, null).rect).toEqual({ width: 200, height: 100, x: 0, y: 0 });
    expect(instanceGeometry(photo, slot, native, null, { ...neutralAdjustment, centered: true }).rect)
      .toEqual({ width: 200, height: 100, x: -50, y: 0 });
    expect(instanceGeometry(photo, slot, native, null, { ...neutralAdjustment, fit: 'contain' }).rect)
      .toEqual({ width: 100, height: 50, x: 0, y: 25 });
  });
  it('ships all four original scenes and replaces the visible artwork at native resolution', async () => {
    const artwork = async (background: string) => normalizeMugArtwork(
      await sharp({ create: { width: 420, height: 180, channels: 3, background } }).png().toBuffer(),
    );
    const light = await artwork('#eeeeee');
    const dark = await artwork('#202b55');

    for (const { id, width, height } of mugMockups) {
      const lightOutput = await renderMugMockup(id, light);
      const darkOutput = await renderMugMockup(id, dark);
      expect(await sharp(darkOutput).metadata()).toMatchObject({
        format: 'png', width, height, density: id === '9' || id === '10' ? 200 : 72,
        hasProfile: id === '11',
      });
      expect(darkOutput.equals(lightOutput)).toBe(false);
      const sample = { left: 0, top: 0, width: 10, height: 10 };
      const corner = (image: Buffer) => sharp(image).extract(sample).raw().toBuffer();
      expect(await corner(darkOutput)).toEqual(await corner(lightOutput));
    }
  }, 30_000);

  it('rejects unsupported uploads and template paths', async () => {
    const svg = Buffer.from('<svg xmlns="http://www.w3.org/2000/svg" width="12" height="12"/>');
    await expect(normalizeMugArtwork(svg)).rejects.toThrow('Formato de arte inválido');
    await expect(renderMugMockup('../3', Buffer.alloc(0))).rejects.toThrow('Modelo de mockup inválido');
  });

  it('reproduces the previous engine pixel for pixel in original mode, including DPI and ICC', async () => {
    // Hashes captured from the unmodified origin/main renderer using this same deterministic fixture.
    const baselines = [
      ['3', '014d2670e33050f8724912e89e8eb99c4e49a401df3f5aafe553fe4f537419c2', 72],
      ['9', '5384be9b5899085c6a1015b95404eb3218dc582f11c8e2f9bcd86c22b95aec8b', 200],
      ['10', '322cd6df7af7967b38ece31c45e16217576b34b378f2949a6940a65d6fa5f45a', 200],
      ['11', 'c1c1640b0539faea4e7622783680e9b38dc53024b19091ac2204f92d7e53f1e2', 72],
    ] as const;
    const hash = (bytes: Buffer) => createHash('sha256').update(bytes).digest('hex');
    const bytes = Buffer.from(Array.from({ length: 24 * 16 * 3 }, (_, i) => (i * 37 + Math.floor(i / 37) * 13) % 256));
    const art = await sharp(bytes, { raw: { width: 24, height: 16, channels: 3 } }).png().toBuffer();
    for (const [id, pixels, expectedDpi] of baselines) {
      const image = await renderMugMockup(id, art, { placement: { mode: 'original' } });
      const { density, icc } = await sharp(image).metadata();
      expect(density).toBe(expectedDpi);
      expect(icc ? hash(icc) : null).toBe(
        id === '11' ? 'e5f6ffb83b6d3491301dd750975684cc5cc2a1951c994a14b08cfdaa0d75a041' : null,
      );
      expect(hash(await sharp(image, { ignoreIcc: true }).raw().toBuffer())).toBe(pixels);
    }
  }, 30_000);

  it('centers contain and cover without stretching and composes percentage adjustments', () => {
    const square = { width: 50, height: 50 };
    const global = { fit: 'contain' as const, ...neutralAdjustment };
    expect(framedArtwork(square, mugFrame, global)).toEqual({ x: 5.5, y: 0, width: 9, height: 9 });
    expect(framedArtwork(square, mugFrame, { ...global, fit: 'cover' })).toEqual({ x: 0, y: -5.5, width: 20, height: 20 });
    const small = framedArtwork(square, mugFrame, { ...global, zoom: 50, offsetX: -10, offsetY: 20 });
    expect(small).toEqual({ x: 5.75, y: 4.05, width: 4.5, height: 4.5 });
    const combined = combinePlacement({ ...global, zoom: 150, offsetX: -20 }, { zoom: 120, offsetX: 25, offsetY: -15 });
    expect(combined).toEqual({ fit: 'contain', zoom: 180, offsetX: 5, offsetY: -15 });
    const horizontal = { width: 30, height: 10 };
    const left = framedArtwork(horizontal, mugFrame, { ...global, fit: 'cover' }, { anchorX: 0.15 });
    const right = framedArtwork(horizontal, mugFrame, { ...global, fit: 'cover' }, { anchorX: 0.85 });
    expect(left.width / left.height).toBe(3);
    expect(left.x).toBeGreaterThan(right.x);
    expect(slotFrame({ width: 1000, height: 1000 }, { anchorX: 0.2, anchorY: 0.5 }))
      .toEqual({ x: 0, y: 275, width: 1000, height: 450 });
  });

  it('rejects unknown shapes, modes, non-finite numbers and out-of-range adjustments', () => {
    const valid = { mode: 'custom', global: { fit: 'cover', ...neutralAdjustment }, local: neutralAdjustment };
    expect(parseMugPlacement(JSON.stringify(valid))).toEqual(valid);
    expect(parseMugPlacement('{"mode":"original"}')).toEqual({ mode: 'original' });
    for (const input of [
      '{"mode":"manual"}', '[]', 'null', '{"mode":"original","local":{}}',
      JSON.stringify({ ...valid, global: { ...valid.global, fit: 'fill' } }),
      JSON.stringify({ ...valid, local: { ...neutralAdjustment, zoom: 301 } }),
      JSON.stringify({ ...valid, local: { ...neutralAdjustment, offsetY: -101 } }),
      JSON.stringify({ ...valid, local: { ...neutralAdjustment, zoom: Infinity } }),
      JSON.stringify(valid).replace('"zoom":100', '"zoom":1e309'),
    ]) expect(() => parseMugPlacement(input)).toThrow();
  });

  it('isolates two different zooms and restores just one caneca in original mode', async () => {
    const art = await sharp({ create: { width: 48, height: 20, channels: 3, background: '#385a91' } }).png().toBuffer();
    const model = '10';
    const [left, right] = await getMugInstances(model);
    const raw = async (instances: Record<string, typeof neutralAdjustment>) =>
      sharp(await renderMugMockup(model, art, { placement: { mode: 'original', instances } })).ensureAlpha().raw().toBuffer();
    const zoomIn = { ...neutralAdjustment, zoom: 150 };
    const zoomOut = { ...neutralAdjustment, zoom: 65 };
    const before = await raw({});
    const leftOnly = await raw({ [left.id]: zoomIn });
    const rightOnly = await raw({ [right.id]: zoomOut });
    const both = await raw({ [left.id]: zoomIn, [right.id]: zoomOut });
    expect(await raw({ [left.id]: neutralAdjustment, [right.id]: zoomOut })).toEqual(rightOnly);
    const strip = (bytes: Buffer, from: number, to: number) => Buffer.concat(
      Array.from({ length: 1000 }, (_, row) => bytes.subarray((row * 1000 + from) * 4, (row * 1000 + to) * 4)),
    );
    expect(strip(leftOnly, 600, 900)).toEqual(strip(before, 600, 900));
    expect(strip(rightOnly, 70, 500)).toEqual(strip(before, 70, 500));
    expect(strip(both, 70, 500)).toEqual(strip(leftOnly, 70, 500));
    expect(strip(both, 600, 900)).toEqual(strip(rightOnly, 600, 900));
    expect(strip(both, 70, 500).equals(strip(before, 70, 500))).toBe(false);
    expect(strip(both, 600, 900).equals(strip(before, 600, 900))).toBe(false);
  }, 30_000);

  it('keeps neutral slot values identical with the previously calibrated custom transform', async () => {
    const art = await sharp({ create: { width: 20, height: 9, channels: 3, background: '#73477c' } }).png().toBuffer();
    const placement = { mode: 'custom' as const, global: { ...neutralAdjustment, fit: 'cover' as const }, local: neutralAdjustment };
    const baseline = await renderMugMockup('9', art, { placement });
    const neutral = await renderMugMockup('9', art, {
      placement: { ...placement, instances: { 'caneca-meio': neutralAdjustment } },
    });
    expect(neutral).toEqual(baseline);
  }, 30_000);
});
