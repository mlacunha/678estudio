import { PDFDocument } from 'pdf-lib';
import sharp from 'sharp';
import { describe, expect, it } from 'vitest';
import { exportAnnualCalendarPdf, exportDeskCalendarPdf, exportMonthlyWireOPdf } from './pdfExport';
import {
  DEFAULT_DESK_BASE_FOLD_MM,
  DEFAULT_DESK_BASE_FRONT_HEIGHT_MM,
  DEFAULT_DESK_SHEET_HEIGHT_MM,
  DEFAULT_DESK_SHEET_WIDTH_MM,
  DEFAULT_DESK_WIREO_MARGIN_MM,
} from './deskTemplates';
import { computeMonthlyPageLayout, DEFAULT_WIREO_MARGIN_MM } from './monthlyTemplates';
import { MM_TO_PT } from './templates';
import type { CalendarConfig, DeskCalendarConfig, MonthlyCalendarConfig } from './types';

function makeConfig(overrides: Partial<CalendarConfig> = {}): CalendarConfig {
  return {
    modality: 'annual',
    year: 2027,
    format: 'A4',
    orientation: 'portrait',
    weekStart: 'sunday',
    templateId: 'minimalist',
    title: 'Calendário 678 Estudio',
    subtitle: 'Edição Anual',
    includeFederalHolidays: true,
    includeGoodFriday: false,
    includeBleed: false,
    imagePlacement: { scale: 1, anchorX: 0.5, anchorY: 0.5 },
    ...overrides,
  };
}

describe('calendar pdfExport', () => {
  it('it should generate a 1-page A4 portrait PDF with exact physical dimensions in points', async () => {
    const bytes = await exportAnnualCalendarPdf(makeConfig({ format: 'A4', orientation: 'portrait', includeBleed: false }));
    const doc = await PDFDocument.load(bytes);
    expect(doc.getPageCount()).toBe(1);
    const { width, height } = doc.getPage(0).getSize();
    expect(width).toBeCloseTo(210 * MM_TO_PT, 1);
    expect(height).toBeCloseTo(297 * MM_TO_PT, 1);
  });

  it('it should generate an A3 landscape PDF including 3mm bleed on all edges when enabled', async () => {
    const bytes = await exportAnnualCalendarPdf(makeConfig({ format: 'A3', orientation: 'landscape', includeBleed: true }));
    const doc = await PDFDocument.load(bytes);
    expect(doc.getPageCount()).toBe(1);
    const { width, height } = doc.getPage(0).getSize();
    expect(width).toBeCloseTo((420 + 6) * MM_TO_PT, 1);
    expect(height).toBeCloseTo((297 + 6) * MM_TO_PT, 1);
  });

  it('it should embed high-resolution PNG or JPEG photography into the PDF without failing', async () => {
    const pngBuf = await sharp({
      create: { width: 1200, height: 800, channels: 3, background: { r: 180, g: 83, b: 9 } },
    }).png().toBuffer();

    const bytes = await exportAnnualCalendarPdf(
      makeConfig({ templateId: 'photographic', includeBleed: true }),
      { bytes: new Uint8Array(pngBuf), mime: 'image/png' },
    );
    const doc = await PDFDocument.load(bytes);
    expect(doc.getPageCount()).toBe(1);
    expect(bytes.length).toBeGreaterThan(5000);
  });
});

function makeMonthlyConfig(overrides: Partial<MonthlyCalendarConfig> = {}): MonthlyCalendarConfig {
  return {
    year: 2027,
    format: 'A4',
    orientation: 'portrait',
    weekStart: 'sunday',
    templateId: 'advertising',
    includeCover: false,
    includeFederalHolidays: true,
    includeGoodFriday: false,
    includeBleed: false,
    wireOMarginMm: DEFAULT_WIREO_MARGIN_MM,
    advertiser: {
      name: 'Cooperativa Vale Verde',
      slogan: 'Conectando campo e cidade desde 1998',
      phone: '(11) 4002-8922',
      whatsapp: '(11) 99999-0000',
      website: 'https://valeverde.coop.br',
      address: 'Av. Central, 450 - Centro',
      qrText: 'https://valeverde.coop.br',
      primaryColor: '#14532d',
      accentColor: '#d97706',
      visibility: {
        showLogo: true,
        showName: true,
        showSlogan: true,
        showPhone: true,
        showWhatsapp: true,
        showWebsite: true,
        showAddress: true,
        showQrCode: true,
      },
    },
    sharedPlacement: { scale: 1, anchorX: 0.5, anchorY: 0.5 },
    ...overrides,
  };
}

describe('monthly Wire-O calendar pdfExport', () => {
  it('it should generate 12 A4 portrait pages without cover and respect configurable Wire-O reserve', async () => {
    const cfg = makeMonthlyConfig({ includeCover: false, wireOMarginMm: 20 });
    const layout = computeMonthlyPageLayout(cfg, 1);
    expect(layout.wireOMarginMm).toBe(20);
    expect(layout.safeBox.y).toBeGreaterThanOrEqual(20);

    const bytes = await exportMonthlyWireOPdf(cfg, {});
    const doc = await PDFDocument.load(bytes);
    expect(doc.getPageCount()).toBe(12);
    const { width, height } = doc.getPage(0).getSize();
    expect(width).toBeCloseTo(210 * MM_TO_PT, 1);
    expect(height).toBeCloseTo(297 * MM_TO_PT, 1);
  });

  it('it should generate 13 A4 portrait pages with cover, bleed, transparent PNG logo, photo, and QR code', async () => {
    const logoPng = await sharp({
      create: { width: 320, height: 140, channels: 4, background: { r: 20, g: 83, b: 45, alpha: 0 } },
    }).png().toBuffer();
    const photoPng = await sharp({
      create: { width: 1200, height: 800, channels: 3, background: { r: 217, g: 119, b: 6 } },
    }).png().toBuffer();

    const bytes = await exportMonthlyWireOPdf(
      makeMonthlyConfig({ includeCover: true, includeBleed: true, templateId: 'institutional' }),
      { 1: { bytes: new Uint8Array(photoPng), mime: 'image/png' } },
      { bytes: new Uint8Array(logoPng), mime: 'image/png' },
    );
    const doc = await PDFDocument.load(bytes);
    expect(doc.getPageCount()).toBe(13);
    const { width, height } = doc.getPage(0).getSize();
    expect(width).toBeCloseTo((210 + 6) * MM_TO_PT, 1);
    expect(height).toBeCloseTo((297 + 6) * MM_TO_PT, 1);
  });
});

describe('desk Wire-O calendar pdfExport', () => {
  it('it should generate 14 pages (cover + 12 horizontal 200x120 mm leaves + triangular base sheet) with bleed', async () => {
    const logoPng = await sharp({
      create: { width: 300, height: 120, channels: 4, background: { r: 20, g: 83, b: 45, alpha: 0 } },
    }).png().toBuffer();
    const photoPng = await sharp({
      create: { width: 1200, height: 720, channels: 3, background: { r: 180, g: 83, b: 9 } },
    }).png().toBuffer();

    const cfg: DeskCalendarConfig = {
      year: 2027,
      sheetWidthMm: DEFAULT_DESK_SHEET_WIDTH_MM,
      sheetHeightMm: DEFAULT_DESK_SHEET_HEIGHT_MM,
      weekStart: 'sunday',
      templateId: 'advertising',
      includeCover: true,
      includeFederalHolidays: true,
      includeGoodFriday: false,
      includeBleed: true,
      wireOMarginMm: DEFAULT_DESK_WIREO_MARGIN_MM,
      advertiser: {
        name: 'Gráfica Horizonte',
        slogan: 'Impressão sob medida',
        phone: '(11) 3000-1000',
        whatsapp: '(11) 99000-1000',
        website: 'https://graficahorizonte.com.br',
        address: 'Av. Paulista, 100',
        qrText: 'https://graficahorizonte.com.br',
        primaryColor: '#1e293b',
        accentColor: '#d97706',
        visibility: {
          showLogo: true,
          showName: true,
          showSlogan: true,
          showPhone: true,
          showWhatsapp: true,
          showWebsite: true,
          showAddress: true,
          showQrCode: true,
        },
      },
      base: {
        syncWithAdvertiser: false,
        primaryColor: '#0f172a',
        accentColor: '#f59e0b',
        name: 'Gráfica Horizonte 2027',
        slogan: 'Brinde Corporativo',
        phone: '(11) 3000-1000',
        whatsapp: '(11) 99000-1000',
        website: 'https://graficahorizonte.com.br',
        qrText: 'https://graficahorizonte.com.br',
        showLogo: true,
        showName: true,
        showSlogan: true,
        showPhone: true,
        showWhatsapp: true,
        showWebsite: true,
        showQrCode: true,
        frontHeightMm: DEFAULT_DESK_BASE_FRONT_HEIGHT_MM,
        foldAllowanceMm: DEFAULT_DESK_BASE_FOLD_MM,
      },
      sharedPlacement: { scale: 1, anchorX: 0.5, anchorY: 0.5 },
    };

    const bytes = await exportDeskCalendarPdf(
      cfg,
      { 1: { bytes: new Uint8Array(photoPng), mime: 'image/png' } },
      { bytes: new Uint8Array(logoPng), mime: 'image/png' },
    );
    const doc = await PDFDocument.load(bytes);
    expect(doc.getPageCount()).toBe(14);
    const leafSize = doc.getPage(0).getSize();
    expect(leafSize.width).toBeCloseTo(206 * MM_TO_PT, 1);
    expect(leafSize.height).toBeCloseTo(126 * MM_TO_PT, 1);
    const baseSize = doc.getPage(13).getSize();
    expect(baseSize.width).toBeCloseTo(206 * MM_TO_PT, 1);
    expect(baseSize.height).toBeCloseTo((36 + 24 + 6) * MM_TO_PT, 1);
  });
});
