import { PDFDocument } from 'pdf-lib';
import { describe, expect, it } from 'vitest';
import {
  agendaPreviewSections,
  agendaTotalPages,
  compileClassicAgenda,
  renderAgendaPreview,
} from './classic.mjs';

describe('Motor de Agendas Clássicas (v2) — Ciclos Mensais, Contatos, Calendário Seguinte e Colofão', () => {
  it('it should calculate 8 preview sections including monthly finance, contacts and next-year calendar', () => {
    const sections1dpp = agendaPreviewSections({ year: 2027, layout: 'daily-1dpp' });
    expect(sections1dpp).toHaveLength(8);
    expect(sections1dpp.map((item) => item.section)).toEqual([
      'Abertura',
      'Calendário anual',
      'Dados pessoais',
      'Planejamento mensal',
      'Layout diário',
      'Controle financeiro mensal',
      'Cadastro de contatos',
      'Calendário do ano seguinte',
    ]);
    // Janeiro tem 31 dias -> Planejamento na pág 4, dias nas págs 5..35, Controle financeiro na pág 36
    expect(sections1dpp[5].pdfPage).toBe(36);
    expect(sections1dpp[7].pdfPage).toBe(399);

    const sections2dpp = agendaPreviewSections({ year: 2027, layout: 'daily-2dpp' });
    // Janeiro em 2dpp tem ceil(31/2) = 16 páginas (5..20) -> Controle financeiro na pág 21
    expect(sections2dpp[5].pdfPage).toBe(21);
    expect(sections2dpp[7].pdfPage).toBe(221);
  });

  it('it should compile daily-1dpp with exact 400 pages in both normal (2027) and leap (2028) years', async () => {
    for (const year of [2027, 2028]) {
      const pdfBytes = await compileClassicAgenda({
        layout: 'daily-1dpp',
        year,
        style: 'classic',
        format: 'a5',
        studio: {
          instagram: '@678estudio',
          whatsapp: '+5511999999999',
          email: 'contato@678estudio.com.br',
        },
      });
      const doc = await PDFDocument.load(pdfBytes);
      expect(doc.getPageCount()).toBe(agendaTotalPages({ year, layout: 'daily-1dpp' }));
      expect(doc.getPageCount()).toBe(400);
    }
  }, 60_000);

  it('it should compile daily-2dpp with exact 222 pages in both normal (2027) and leap (2028) years without mixing months', async () => {
    for (const year of [2027, 2028]) {
      const pdfBytes = await compileClassicAgenda({
        layout: 'daily-2dpp',
        year,
        style: 'commercial',
        format: 'a5',
      });
      const doc = await PDFDocument.load(pdfBytes);
      expect(doc.getPageCount()).toBe(agendaTotalPages({ year, layout: 'daily-2dpp' }));
      expect(doc.getPageCount()).toBe(222);
    }
  }, 60_000);

  it('it should compile weekly layout with exact 90 pages in both 2027 and 2028 without duplicating cross-month weeks', async () => {
    for (const year of [2027, 2028]) {
      const pdfBytes = await compileClassicAgenda({
        layout: 'weekly',
        year,
        style: 'feminine',
        format: 'a5',
      });
      const doc = await PDFDocument.load(pdfBytes);
      expect(doc.getPageCount()).toBe(agendaTotalPages({ year, layout: 'weekly' }));
      expect(doc.getPageCount()).toBe(90);
    }
  }, 60_000);

  it('it should render all 8 PNG previews including monthly finance, contacts and next-year calendar', async () => {
    const previews = await renderAgendaPreview({
      layout: 'weekly',
      year: 2027,
      style: 'classic',
      format: 'a5',
    });
    expect(previews).toHaveLength(8);
    for (const item of previews) {
      expect(item.src.startsWith('data:image/png;base64,')).toBe(true);
      expect(item.src.length).toBeGreaterThan(1500);
    }
  }, 60_000);
});

