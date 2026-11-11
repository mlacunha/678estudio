import { describe, expect, it } from 'vitest';
import { compilePlannerEssencial } from './essencial.mjs';

function countPdfPages(buffer: Buffer): number {
  const text = buffer.toString('binary');
  const matches = text.match(/\/Type\s*\/Page\b/g);
  return matches ? matches.length : 0;
}

describe('Motor de compilação Typst do Planner Essencial', () => {
  const baseConfig = {
    template: 'planner-essencial-v1',
    model: 'planner-essencial',
    mode: 'dated' as const,
    year: 2027,
    format: 'a5',
    style: 'classic',
    typography: 'modern' as const,
    colors: { primary: '#1f2937', secondary: '#2563eb', accent: '#cca032' },
    customColors: false,
    personalizationName: 'Mariana Teste',
  };

  it('compila prévia em PNG com tipografia Moderna (Inter)', async () => {
    const pngBuffer = await compilePlannerEssencial(
      {
        ...baseConfig,
        typography: 'modern',
        section: 'abertura',
      },
      { format: 'png', pages: [1] }
    );

    expect(pngBuffer).toBeInstanceOf(Buffer);
    expect(pngBuffer.length).toBeGreaterThan(1000);
    expect(pngBuffer[0]).toBe(0x89);
    expect(pngBuffer[1]).toBe(0x50);
    expect(pngBuffer[2]).toBe(0x4e);
    expect(pngBuffer[3]).toBe(0x47);
  }, 30_000);

  it('compila prévia em PNG com tipografia Geométrica (Manrope)', async () => {
    const pngBuffer = await compilePlannerEssencial(
      {
        ...baseConfig,
        typography: 'geometric',
        section: 'financeiro',
        style: 'commercial',
      },
      { format: 'png', pages: [1] }
    );

    expect(pngBuffer).toBeInstanceOf(Buffer);
    expect(pngBuffer.length).toBeGreaterThan(1000);
    expect(pngBuffer[0]).toBe(0x89);
  }, 30_000);

  it('compila prévia em PNG com tipografia Editorial (DM Serif & DM Sans)', async () => {
    const pngBuffer = await compilePlannerEssencial(
      {
        ...baseConfig,
        typography: 'editorial',
        section: 'semanal',
        style: 'feminine',
      },
      { format: 'png', pages: [1] }
    );

    expect(pngBuffer).toBeInstanceOf(Buffer);
    expect(pngBuffer.length).toBeGreaterThan(1000);
    expect(pngBuffer[0]).toBe(0x89);
  }, 30_000);

  it('compila planner em modalidade não datada com tipografia Geométrica', async () => {
    const pngBuffer = await compilePlannerEssencial(
      {
        ...baseConfig,
        mode: 'undated',
        year: undefined,
        typography: 'geometric',
        section: 'semanal',
      },
      { format: 'png', pages: [1] }
    );

    expect(pngBuffer).toBeInstanceOf(Buffer);
    expect(pngBuffer.length).toBeGreaterThan(1000);
  }, 30_000);

  it('incorpora fonte Inter no PDF compilado com tipografia Moderna', async () => {
    const pdfBuffer = await compilePlannerEssencial(
      {
        ...baseConfig,
        typography: 'modern',
        section: 'abertura',
      },
      { format: 'pdf' }
    );

    const pdfText = pdfBuffer.toString('binary');
    expect(pdfText).toContain('Inter');
  }, 30_000);

  it('incorpora fonte Manrope no PDF compilado com tipografia Geométrica', async () => {
    const pdfBuffer = await compilePlannerEssencial(
      {
        ...baseConfig,
        typography: 'geometric',
        section: 'abertura',
      },
      { format: 'pdf' }
    );

    const pdfText = pdfBuffer.toString('binary');
    expect(pdfText).toContain('Manrope');
  }, 30_000);

  it('incorpora DM Serif Display e DM Sans no PDF compilado com tipografia Editorial', async () => {
    const pdfBuffer = await compilePlannerEssencial(
      {
        ...baseConfig,
        typography: 'editorial',
        section: 'abertura',
      },
      { format: 'pdf' }
    );

    const pdfText = pdfBuffer.toString('binary');
    expect(pdfText.includes('DMSerifDisplay') || pdfText.includes('DM Serif Display') || pdfText.includes('DMSans') || pdfText.includes('DM Sans')).toBe(true);
  }, 30_000);

  it('compila documento completo em PDF no formato A5 com 184 páginas (Datado 2027)', async () => {
    const pdfBuffer = await compilePlannerEssencial(
      {
        ...baseConfig,
        year: 2027,
        typography: 'editorial',
        section: 'all',
      },
      { format: 'pdf' }
    );

    expect(pdfBuffer).toBeInstanceOf(Buffer);
    const pages = countPdfPages(pdfBuffer);
    expect(pages).toBe(184);

    const pdfHeader = pdfBuffer.subarray(0, 5).toString('ascii');
    expect(pdfHeader).toBe('%PDF-');
  }, 60_000);

  it('compila documento completo em PDF no formato A5 com 184 páginas (Datado 2028 - Bissexto)', async () => {
    const pdfBuffer = await compilePlannerEssencial(
      {
        ...baseConfig,
        year: 2028,
        typography: 'modern',
        section: 'all',
      },
      { format: 'pdf' }
    );

    expect(pdfBuffer).toBeInstanceOf(Buffer);
    const pages = countPdfPages(pdfBuffer);
    expect(pages).toBe(184);
  }, 60_000);

  it('compila documento completo em PDF no formato A5 com 184 páginas (Não Datado / 52 semanas)', async () => {
    const pdfBuffer = await compilePlannerEssencial(
      {
        ...baseConfig,
        mode: 'undated',
        year: undefined,
        typography: 'geometric',
        section: 'all',
      },
      { format: 'pdf' }
    );

    expect(pdfBuffer).toBeInstanceOf(Buffer);
    const pages = countPdfPages(pdfBuffer);
    expect(pages).toBe(184);
  }, 60_000);
});
