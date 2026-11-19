import sharp from 'sharp';
import { describe, expect, it } from 'vitest';
import { compileCoverPdf, generateCoverPreviewPng } from './compiler.mjs';
import { normalizeCoverPhotoBuffer } from './photo';

describe('Cover Typst Compiler Integration', () => {
  it.each(['classic', 'modern'])('positions the logo on the front of %s covers', async style => {
    const photoBuffer = await sharp({
      create: { width: 120, height: 40, channels: 3, background: '#ff00ff' },
    }).png().toBuffer();
    const options = { style, photoBuffer };
    const [top, bottom, combined, back] = await Promise.all([
      generateCoverPreviewPng({ ...options, logoPosition: 'top' }),
      generateCoverPreviewPng({ ...options, logoPosition: 'bottom' }),
      generateCoverPreviewPng({ ...options, logoPosition: 'bottom', target: 'combined-a4' }),
      generateCoverPreviewPng({ ...options, logoPosition: 'top', target: 'back-a5' }),
    ]);

    const logoPixels = async (png: Buffer, left: number, top: number, width: number, height: number) => {
      const data = await sharp(png).extract({ left, top, width, height }).removeAlpha().raw().toBuffer();
      for (let index = 0; index < data.length; index += 3) {
        if (data[index] === 255 && data[index + 1] === 0 && data[index + 2] === 255) return true;
      }
      return false;
    };
    const { width, height } = await sharp(top).metadata();
    const coverWidth = width!;
    const coverHeight = height!;
    const quarter = Math.floor(coverHeight / 4);
    expect(await logoPixels(top, 0, 0, coverWidth, quarter)).toBe(true);
    expect(await logoPixels(top, 0, coverHeight - quarter, coverWidth, quarter)).toBe(false);
    expect(await logoPixels(bottom, 0, 0, coverWidth, quarter)).toBe(false);
    expect(await logoPixels(bottom, 0, coverHeight - quarter, coverWidth, quarter)).toBe(true);
    expect(await logoPixels(combined, 0, 0, coverWidth, coverHeight)).toBe(false);
    expect(await logoPixels(combined, coverWidth, coverHeight - quarter, coverWidth, quarter)).toBe(true);
    expect(await logoPixels(back, 0, 0, coverWidth, coverHeight)).toBe(false);
  });

  it('should compile Classic A5 front cover with 3mm bleed', async () => {
    const pdfBuffer = await compileCoverPdf({
      target: 'front-a5',
      bleed: '3mm',
      style: 'classic',
      typography: 'editorial',
      title: 'Caderno de Receitas',
      name: 'Chef Helena',
      subtitle: 'Edição Especial',
      colors: {
        primary: '#1e293b',
        secondary: '#f8fafc',
        text: '#ffffff',
        accent: '#c5a059',
      },
    });

    expect(pdfBuffer).toBeInstanceOf(Buffer);
    expect(pdfBuffer.length).toBeGreaterThan(1000);
    expect(pdfBuffer.subarray(0, 4).toString()).toBe('%PDF');
  });

  it('should compile Modern A5 front and back covers with 5mm bleed', async () => {
    const frontPdf = await compileCoverPdf({
      target: 'front-a5',
      bleed: '5mm',
      style: 'modern',
      typography: 'geometric',
      title: 'Planner 2027',
      name: 'M. Alves',
      subtitle: 'Foco & Estratégia',
      colors: {
        primary: '#4a1525',
        secondary: '#fffdfa',
        text: '#ffffff',
        accent: '#e2c499',
      },
    });

    const backPdf = await compileCoverPdf({
      target: 'back-a5',
      bleed: '5mm',
      style: 'modern',
      typography: 'geometric',
      colors: {
        primary: '#4a1525',
        secondary: '#fffdfa',
        text: '#ffffff',
        accent: '#e2c499',
      },
    });

    expect(frontPdf.subarray(0, 4).toString()).toBe('%PDF');
    expect(backPdf.subarray(0, 4).toString()).toBe('%PDF');
  });

  it('should compile Combined A4 Landscape with center cut line', async () => {
    const combinedPdf = await compileCoverPdf({
      target: 'combined-a4',
      style: 'classic',
      typography: 'editorial',
      title: 'Diário Pessoal',
      name: 'Ana Rocha',
      subtitle: 'Momentos & Memórias',
      colors: {
        primary: '#1c3327',
        secondary: '#fbfaf5',
        text: '#ffffff',
        accent: '#82a37e',
      },
    });

    expect(combinedPdf.subarray(0, 4).toString()).toBe('%PDF');
    expect(combinedPdf.length).toBeGreaterThan(2000);
  });

  it('should generate real PNG preview for Photographic cover', async () => {
    const previewPng = await generateCoverPreviewPng({
      target: 'front-a5',
      style: 'photographic',
      typography: 'editorial',
      title: 'Livro de Memórias',
      name: 'Família Rocha',
      subtitle: 'Nossa Jornada',
      colors: {
        primary: '#18181b',
        secondary: '#fafafa',
        text: '#ffffff',
        accent: '#a1a1aa',
      },
    });

    expect(previewPng).toBeInstanceOf(Buffer);
    expect(previewPng.length).toBeGreaterThan(1000);
    // Assinatura de PNG (89 50 4E 47)
    expect(previewPng[0]).toBe(0x89);
    expect(previewPng[1]).toBe(0x50);
    expect(previewPng[2]).toBe(0x4e);
    expect(previewPng[3]).toBe(0x47);
  });

  it('should render Photographic cover with JPEG and PNG photos without returning the input photo', async () => {
    const samplePng = await sharp({
      create: { width: 400, height: 300, channels: 3, background: { r: 210, g: 120, b: 80 } },
    })
      .png()
      .toBuffer();

    const sampleJpeg = await sharp({
      create: { width: 400, height: 300, channels: 3, background: { r: 60, g: 140, b: 190 } },
    })
      .jpeg({ quality: 90 })
      .toBuffer();

    const normalizedPng = await normalizeCoverPhotoBuffer(samplePng);
    const normalizedJpeg = await normalizeCoverPhotoBuffer(sampleJpeg);
    expect(normalizedPng).not.toBeNull();
    expect(normalizedJpeg).not.toBeNull();
    expect(normalizedPng?.mime).toBe('image/png');
    expect(normalizedJpeg?.mime).toBe('image/jpeg');

    const renderedFromPng = await generateCoverPreviewPng({
      target: 'front-a5',
      style: 'photographic',
      typography: 'editorial',
      title: 'Álbum PNG',
      name: 'Teste PNG',
      photoBuffer: normalizedPng!.normalized,
    });
    expect(renderedFromPng.equals(samplePng)).toBe(false);
    expect(renderedFromPng.equals(normalizedPng!.normalized)).toBe(false);
    const metaPng = await sharp(renderedFromPng).metadata();
    // A5 em 144 ppi tem proporção retrato (altura > largura), diferente da foto 400x300
    expect((metaPng.height ?? 0) > (metaPng.width ?? 0)).toBe(true);

    const renderedFromJpeg = await generateCoverPreviewPng({
      target: 'front-a5',
      style: 'photographic',
      typography: 'modern',
      title: 'Álbum JPEG',
      name: 'Teste JPEG',
      photoBuffer: normalizedJpeg!.normalized,
    });
    expect(renderedFromJpeg.subarray(0, 4)).toEqual(Buffer.from([0x89, 0x50, 0x4e, 0x47]));
    const metaJpeg = await sharp(renderedFromJpeg).metadata();
    expect((metaJpeg.height ?? 0) > (metaJpeg.width ?? 0)).toBe(true);

    const pdfWithPhoto = await compileCoverPdf({
      target: 'front-a5',
      bleed: '3mm',
      style: 'photographic',
      typography: 'editorial',
      title: 'Livro de Memórias',
      name: 'Família Rocha',
      photoBuffer: normalizedJpeg!.normalized,
    });
    expect(pdfWithPhoto.subarray(0, 4).toString()).toBe('%PDF');
  }, 30_000);
});

