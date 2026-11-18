import sharp from 'sharp';
import { describe, expect, it } from 'vitest';
import { mugMockups } from './options.mjs';
import { normalizeMugArtwork, renderMugMockup } from './render.mjs';

describe('Commercial mug mockups', () => {
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
});
