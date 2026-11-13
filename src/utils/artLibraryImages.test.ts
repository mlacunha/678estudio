import { mkdtemp, readFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { randomUUID } from 'node:crypto';
import sharp from 'sharp';
import { afterEach, describe, expect, it } from 'vitest';
import { detectImageFormat, runWithConcurrency } from './artLibrary';
import {
  ArtImageValidationError,
  getArtFilePath,
  processArtImage,
  writeArtVersionFiles,
} from './artLibraryImages';

const tempDirs: string[] = [];

afterEach(async () => {
  delete process.env.ART_LIBRARY_MAX_BYTES;
  delete process.env.ART_LIBRARY_MIN_DIMENSION;
  delete process.env.ART_LIBRARY_MAX_DIMENSION;
  await Promise.all(tempDirs.splice(0).map(dir => rm(dir, { recursive: true, force: true })));
});

describe('artLibrary & artLibraryImages', () => {
  it('should detect real image formats and reject spoofed bytes', async () => {
    const png = await sharp({ create: { width: 120, height: 120, channels: 4, background: '#c04868' } }).png().toBuffer();
    const jpg = await sharp({ create: { width: 120, height: 120, channels: 3, background: '#224466' } }).jpeg().toBuffer();
    const webp = await sharp({ create: { width: 120, height: 120, channels: 3, background: '#336633' } }).webp().toBuffer();

    expect(detectImageFormat(png)?.ext).toBe('png');
    expect(detectImageFormat(jpg)?.ext).toBe('jpg');
    expect(detectImageFormat(webp)?.ext).toBe('webp');
    expect(detectImageFormat(Buffer.from('<svg></svg>'))).toBeNull();
    expect(detectImageFormat(Buffer.from('not-an-image'))).toBeNull();
  });

  it('should reject invalid or out-of-bounds images with clear errors', async () => {
    await expect(processArtImage(Buffer.from('<svg>fake</svg>'))).rejects.toThrow(ArtImageValidationError);

    const tiny = await sharp({ create: { width: 40, height: 40, channels: 3, background: '#111111' } }).png().toBuffer();
    await expect(processArtImage(tiny)).rejects.toThrow(/Dimensões mínimas/);

    process.env.ART_LIBRARY_MAX_BYTES = '100';
    const normal = await sharp({ create: { width: 200, height: 200, channels: 3, background: '#111111' } }).png().toBuffer();
    await expect(processArtImage(normal)).rejects.toThrow(/excede o limite/);
  });

  it('should generate thumb, preview and preserve exact original bytes across versions', async () => {
    const originalCwd = process.cwd();
    const tempRoot = await mkdtemp(join(tmpdir(), 'art-lib-img-'));
    tempDirs.push(tempRoot);
    process.chdir(tempRoot);

    try {
      const id = randomUUID();
      const v1Input = await sharp({ create: { width: 2000, height: 1200, channels: 4, background: '#aa2255' } }).png().toBuffer();
      const v2Input = await sharp({ create: { width: 1800, height: 1800, channels: 3, background: '#2255aa' } }).jpeg().toBuffer();

      const p1 = await processArtImage(v1Input);
      const p2 = await processArtImage(v2Input);
      await writeArtVersionFiles(id, 1, p1);
      await writeArtVersionFiles(id, 2, p2);

      expect(p1.thumbWidth).toBeLessThanOrEqual(400);
      expect(p1.previewWidth).toBeLessThanOrEqual(1600);

      const v1OrigOnDisk = await readFile(getArtFilePath(id, 1, 'orig', 'png'));
      const v2OrigOnDisk = await readFile(getArtFilePath(id, 2, 'orig', 'jpg'));
      expect(v1OrigOnDisk.equals(v1Input)).toBe(true);
      expect(v2OrigOnDisk.equals(v2Input)).toBe(true);
    } finally {
      process.chdir(originalCwd);
    }
  });

  it('should process batch tasks with bounded concurrency', async () => {
    let active = 0;
    let peak = 0;
    const results = await runWithConcurrency([1, 2, 3, 4, 5], 2, async value => {
      active++;
      peak = Math.max(peak, active);
      await new Promise(resolve => setTimeout(resolve, 10));
      active--;
      return value * 2;
    });
    expect(peak).toBeLessThanOrEqual(2);
    expect(results).toEqual([2, 4, 6, 8, 10]);
  });
});

