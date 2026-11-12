import { describe, expect, it } from 'vitest';
import { compileCoverPdf, generateCoverPreviewPng } from './compiler.mjs';

describe('Cover Typst Compiler Integration', () => {
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
});

