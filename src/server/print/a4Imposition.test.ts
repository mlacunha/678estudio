import { PDFDocument, StandardFonts } from 'pdf-lib';
import { describe, expect, it } from 'vitest';
import { GET as getAgendaPdf } from '../../pages/admin/agenda-classica.pdf';
import { GET as getCalibrationPdf } from '../../pages/admin/impressao-a4/calibracao.pdf';
import {
  A4_LANDSCAPE_HEIGHT_PT,
  A4_LANDSCAPE_WIDTH_PT,
  A5_HEIGHT_PT,
  A5_WIDTH_PT,
  SAFE_SCALE_FACTOR,
  buildA4ImpositionPlan,
  generateA4CalibrationPdf,
  getSlotPlacement,
  imposeA5ToA4Backs,
  imposeA5ToA4Fronts,
  parseA4PrintQuery,
  simulateCutAndStack,
} from './a4Imposition';

async function createSampleA5Pdf(pageCount: number): Promise<Uint8Array> {
  const doc = await PDFDocument.create();
  const font = await doc.embedFont(StandardFonts.Helvetica);
  for (let i = 1; i <= pageCount; i++) {
    const page = doc.addPage([A5_WIDTH_PT, A5_HEIGHT_PT]);
    page.drawText(`Página A5 ${i}`, { x: 40, y: A5_HEIGHT_PT - 60, size: 16, font });
  }
  return doc.save();
}

describe('a4Imposition — matemática Cut & Stack e correspondência Frente/Verso', () => {
  it('it should build an exact Cut & Stack plan for 8 A5 pages (4 A5 leaves = 2 A4 sheets)', () => {
    const plan = buildA4ImpositionPlan(8, { stackMode: 'cut-stack', flipMode: 'short-edge' });
    expect(plan).toHaveLength(2);

    // Folha A4 #1: esquerda = Folha A5 #1 (págs 1,2), direita = Folha A5 #3 (págs 5,6)
    expect(plan[0].frontLeft).toEqual({ pageIndex: 0, rotation: 0 });
    expect(plan[0].frontRight).toEqual({ pageIndex: 4, rotation: 0 });
    expect(plan[0].backLeft).toEqual({ pageIndex: 5, rotation: 0 });
    expect(plan[0].backRight).toEqual({ pageIndex: 1, rotation: 0 });

    // Folha A4 #2: esquerda = Folha A5 #2 (págs 3,4), direita = Folha A5 #4 (págs 7,8)
    expect(plan[1].frontLeft).toEqual({ pageIndex: 2, rotation: 0 });
    expect(plan[1].frontRight).toEqual({ pageIndex: 6, rotation: 0 });
    expect(plan[1].backLeft).toEqual({ pageIndex: 7, rotation: 0 });
    expect(plan[1].backRight).toEqual({ pageIndex: 3, rotation: 0 });
  });

  it('it should reconstruct pages 1..N in exact reading order after cutting and stacking Left pile on Right pile', () => {
    for (const totalPages of [4, 6, 8, 90, 184, 222, 400]) {
      for (const flipMode of ['short-edge', 'long-edge'] as const) {
        const plan = buildA4ImpositionPlan(totalPages, { stackMode: 'cut-stack', flipMode });
        const finalOrder = simulateCutAndStack(plan, { stackMode: 'cut-stack', flipMode });
        const expected = Array.from({ length: totalPages }, (_, i) => i + 1);
        expect(finalOrder).toEqual(expected);
      }
    }
  });

  it('it should rotate verso pages by 180 degrees and keep left/right columns when flipMode is long-edge', () => {
    const plan = buildA4ImpositionPlan(4, { stackMode: 'cut-stack', flipMode: 'long-edge' });
    expect(plan).toHaveLength(1);
    expect(plan[0].frontLeft).toEqual({ pageIndex: 0, rotation: 0 });
    expect(plan[0].frontRight).toEqual({ pageIndex: 2, rotation: 0 });
    expect(plan[0].backLeft).toEqual({ pageIndex: 1, rotation: 180 });
    expect(plan[0].backRight).toEqual({ pageIndex: 3, rotation: 180 });
  });

  it('it should compute centered safe-margin coordinates (96% scale) for common A4 printers', () => {
    const fullLeft = getSlotPlacement(0, 0, 'full');
    expect(fullLeft.x).toBeCloseTo(0, 3);
    expect(fullLeft.width).toBeCloseTo(A5_WIDTH_PT, 3);

    const safeLeft = getSlotPlacement(0, 0, 'safe');
    expect(safeLeft.width).toBeCloseTo(A5_WIDTH_PT * SAFE_SCALE_FACTOR, 3);
    expect(safeLeft.height).toBeCloseTo(A5_HEIGHT_PT * SAFE_SCALE_FACTOR, 3);
    expect(safeLeft.x).toBeGreaterThan(8);
    expect(safeLeft.y).toBeGreaterThan(11);

    const safeRightRotated = getSlotPlacement(1, 180, 'safe');
    expect(safeRightRotated.x).toBeLessThan(A4_LANDSCAPE_WIDTH_PT - 8);
    expect(safeRightRotated.rotation).toBe(180);
  });

  it('it should generate vector A4 Fronts and Backs PDFs with exact A4 landscape dimensions and reverse verso option', async () => {
    const sampleA5 = await createSampleA5Pdf(12);
    const fronts = await imposeA5ToA4Fronts(sampleA5, { stackMode: 'cut-stack', scaleMode: 'safe' });
    const backsReverse = await imposeA5ToA4Backs(sampleA5, {
      stackMode: 'cut-stack',
      flipMode: 'short-edge',
      versoOrder: 'reverse',
      scaleMode: 'safe',
    });

    const frontDoc = await PDFDocument.load(fronts);
    const backDoc = await PDFDocument.load(backsReverse);
    expect(frontDoc.getPageCount()).toBe(3);
    expect(backDoc.getPageCount()).toBe(3);

    const { width, height } = frontDoc.getPage(0).getSize();
    expect(width).toBeCloseTo(A4_LANDSCAPE_WIDTH_PT, 2);
    expect(height).toBeCloseTo(A4_LANDSCAPE_HEIGHT_PT, 2);
  });

  it('it should generate a 2-page A4 Calibration PDF for physical printer verification', async () => {
    const calibration = await generateA4CalibrationPdf({ flipMode: 'short-edge', scaleMode: 'safe' });
    const doc = await PDFDocument.load(calibration);
    expect(doc.getPageCount()).toBe(2);
    const { width, height } = doc.getPage(0).getSize();
    expect(width).toBeCloseTo(A4_LANDSCAPE_WIDTH_PT, 2);
    expect(height).toBeCloseTo(A4_LANDSCAPE_HEIGHT_PT, 2);
  });

  it('it should validate query parameters strictly and reject invalid options', () => {
    const valid = parseA4PrintQuery(new URLSearchParams('modo=a4-versos&empilhamento=cut-stack&virada=long-edge&ordem=reverse&escala=safe'));
    expect(valid.valid).toBe(true);

    const invalid = parseA4PrintQuery(new URLSearchParams('modo=livreto-dobrado'));
    expect(invalid.valid).toBe(false);
  });
});

describe('Endpoints Administrativos de Impressão A4 e Calibração', () => {
  it('it should serve a valid 2-page A4 Calibration PDF with custom flip and scale parameters', async () => {
    const url = new URL('http://localhost/admin/impressao-a4/calibracao.pdf?virada=long-edge&escala=safe');
    const response = await getCalibrationPdf({ url } as never);
    expect(response.status).toBe(200);
    expect(response.headers.get('Content-Type')).toBe('application/pdf');
    expect(response.headers.get('Content-Disposition')).toContain('calibracao-a4-corte-a5-long-edge-safe.pdf');

    const bytes = new Uint8Array(await response.arrayBuffer());
    const doc = await PDFDocument.load(bytes);
    expect(doc.getPageCount()).toBe(2);
  });

  it('it should reject invalid calibration parameters with HTTP 400', async () => {
    const url = new URL('http://localhost/admin/impressao-a4/calibracao.pdf?virada=invalida');
    const response = await getCalibrationPdf({ url } as never);
    expect(response.status).toBe(400);
  });

  it('it should serve A4 Fronts and A4 Backs PDFs for an Agenda with 23 A4 sheets (from 90 A5 pages in weekly layout)', async () => {
    const frontsUrl = new URL(
      'http://localhost/admin/agenda-classica.pdf?layout=weekly&ano=2027&modo=a4-frentes&empilhamento=cut-stack&escala=safe',
    );
    const frontsRes = await getAgendaPdf({ url: frontsUrl } as never);
    expect(frontsRes.status).toBe(200);
    expect(frontsRes.headers.get('Content-Disposition')).toContain('agenda-classica-2027-weekly-a4-frentes.pdf');

    const frontsDoc = await PDFDocument.load(new Uint8Array(await frontsRes.arrayBuffer()));
    expect(frontsDoc.getPageCount()).toBe(23);

    const backsUrl = new URL(
      'http://localhost/admin/agenda-classica.pdf?layout=weekly&ano=2027&modo=a4-versos&virada=short-edge&ordem=reverse',
    );
    const backsRes = await getAgendaPdf({ url: backsUrl } as never);
    expect(backsRes.status).toBe(200);
    expect(backsRes.headers.get('Content-Disposition')).toContain('agenda-classica-2027-weekly-a4-versos.pdf');

    const backsDoc = await PDFDocument.load(new Uint8Array(await backsRes.arrayBuffer()));
    expect(backsDoc.getPageCount()).toBe(23);
  }, 60_000);
});
