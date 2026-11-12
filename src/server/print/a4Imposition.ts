import { PDFDocument, StandardFonts, degrees, rgb, type PDFPage } from 'pdf-lib';

export const A5_WIDTH_PT = 420.945;
export const A5_HEIGHT_PT = 595.276;
export const A4_LANDSCAPE_WIDTH_PT = A5_WIDTH_PT * 2;
export const A4_LANDSCAPE_HEIGHT_PT = A5_HEIGHT_PT;
export const SAFE_SCALE_FACTOR = 0.96;

export type A4PrintMode = 'a5' | 'a4-frentes' | 'a4-versos';
export type A4StackMode = 'cut-stack' | 'sequential';
export type A4FlipMode = 'short-edge' | 'long-edge';
export type A4VersoOrder = 'normal' | 'reverse';
export type A4ScaleMode = 'full' | 'safe';

export interface A4ImpositionOptions {
  stackMode?: A4StackMode;
  flipMode?: A4FlipMode;
  versoOrder?: A4VersoOrder;
  scaleMode?: A4ScaleMode;
}

export interface A4SheetSlot {
  pageIndex: number | null;
  rotation: 0 | 180;
}

export interface A4ImpositionSheet {
  sheetNumber: number;
  frontLeft: A4SheetSlot;
  frontRight: A4SheetSlot;
  backLeft: A4SheetSlot;
  backRight: A4SheetSlot;
}

const VALID_MODES = new Set<A4PrintMode>(['a5', 'a4-frentes', 'a4-versos']);
const VALID_STACKS = new Set<A4StackMode>(['cut-stack', 'sequential']);
const VALID_FLIPS = new Set<A4FlipMode>(['short-edge', 'long-edge']);
const VALID_ORDERS = new Set<A4VersoOrder>(['normal', 'reverse']);
const VALID_SCALES = new Set<A4ScaleMode>(['full', 'safe']);

export function parseA4PrintQuery(params: URLSearchParams):
  | { valid: true; mode: A4PrintMode; options: Required<A4ImpositionOptions> }
  | { valid: false; error: string } {
  const mode = (params.get('modo') ?? 'a5') as A4PrintMode;
  const stackMode = (params.get('empilhamento') ?? 'cut-stack') as A4StackMode;
  const flipMode = (params.get('virada') ?? 'short-edge') as A4FlipMode;
  const versoOrder = (params.get('ordem') ?? 'normal') as A4VersoOrder;
  const scaleMode = (params.get('escala') ?? 'full') as A4ScaleMode;

  if (!VALID_MODES.has(mode)) return { valid: false, error: 'Modo de impressão inválido.' };
  if (!VALID_STACKS.has(stackMode)) return { valid: false, error: 'Modo de empilhamento inválido.' };
  if (!VALID_FLIPS.has(flipMode)) return { valid: false, error: 'Orientação de virada do verso inválida.' };
  if (!VALID_ORDERS.has(versoOrder)) return { valid: false, error: 'Ordem de alimentação dos versos inválida.' };
  if (!VALID_SCALES.has(scaleMode)) return { valid: false, error: 'Modo de escala inválido.' };

  return { valid: true, mode, options: { stackMode, flipMode, versoOrder, scaleMode } };
}

function resolveLeafPages(leafIndex: number | null, pageCount: number) {
  if (leafIndex === null) return { front: null, back: null };
  const front = leafIndex * 2 < pageCount ? leafIndex * 2 : null;
  const back = leafIndex * 2 + 1 < pageCount ? leafIndex * 2 + 1 : null;
  return { front, back };
}

export function buildA4ImpositionPlan(
  pageCount: number,
  options: A4ImpositionOptions = {},
): A4ImpositionSheet[] {
  if (!Number.isInteger(pageCount) || pageCount < 1) {
    throw new RangeError('A quantidade de páginas A5 deve ser um inteiro positivo.');
  }
  const stackMode = options.stackMode ?? 'cut-stack';
  const flipMode = options.flipMode ?? 'short-edge';
  const totalLeaves = Math.ceil(pageCount / 2);
  const totalSheets = Math.ceil(totalLeaves / 2);
  const sheets: A4ImpositionSheet[] = [];

  for (let s = 0; s < totalSheets; s++) {
    const leftLeaf = stackMode === 'cut-stack' ? s : s * 2;
    const rawRight = stackMode === 'cut-stack' ? s + totalSheets : s * 2 + 1;
    const rightLeaf = rawRight < totalLeaves ? rawRight : null;
    const left = resolveLeafPages(leftLeaf, pageCount);
    const right = resolveLeafPages(rightLeaf, pageCount);

    const backLeft: A4SheetSlot = flipMode === 'short-edge'
      ? { pageIndex: right.back, rotation: 0 }
      : { pageIndex: left.back, rotation: 180 };
    const backRight: A4SheetSlot = flipMode === 'short-edge'
      ? { pageIndex: left.back, rotation: 0 }
      : { pageIndex: right.back, rotation: 180 };

    sheets.push({
      sheetNumber: s + 1,
      frontLeft: { pageIndex: left.front, rotation: 0 },
      frontRight: { pageIndex: right.front, rotation: 0 },
      backLeft,
      backRight,
    });
  }
  return sheets;
}

export function simulateCutAndStack(
  plan: A4ImpositionSheet[],
  options: Pick<A4ImpositionOptions, 'flipMode' | 'stackMode'> = {},
): number[] {
  const flipMode = options.flipMode ?? 'short-edge';
  const stackMode = options.stackMode ?? 'cut-stack';
  const leftPile: number[] = [];
  const rightPile: number[] = [];

  for (const sheet of plan) {
    const leftBack = flipMode === 'short-edge' ? sheet.backRight.pageIndex : sheet.backLeft.pageIndex;
    const rightBack = flipMode === 'short-edge' ? sheet.backLeft.pageIndex : sheet.backRight.pageIndex;
    if (sheet.frontLeft.pageIndex !== null) leftPile.push(sheet.frontLeft.pageIndex + 1);
    if (leftBack !== null) leftPile.push(leftBack + 1);
    if (sheet.frontRight.pageIndex !== null) rightPile.push(sheet.frontRight.pageIndex + 1);
    if (rightBack !== null) rightPile.push(rightBack + 1);
  }
  if (stackMode === 'cut-stack') return [...leftPile, ...rightPile];

  const sequential: number[] = [];
  for (let i = 0; i < plan.length; i++) {
    sequential.push(...leftPile.slice(i * 2, i * 2 + 2), ...rightPile.slice(i * 2, i * 2 + 2));
  }
  return sequential;
}

export function getSlotPlacement(slotIndex: 0 | 1, rotation: 0 | 180, scaleMode: A4ScaleMode = 'full') {
  const scale = scaleMode === 'safe' ? SAFE_SCALE_FACTOR : 1;
  const width = A5_WIDTH_PT * scale;
  const height = A5_HEIGHT_PT * scale;
  const padX = (A5_WIDTH_PT - width) / 2;
  const padY = (A5_HEIGHT_PT - height) / 2;
  const baseLeft = slotIndex * A5_WIDTH_PT + padX;
  const x = rotation === 180 ? baseLeft + width : baseLeft;
  const y = rotation === 180 ? padY + height : padY;
  return { x, y, width, height, rotation };
}

function drawCutTickMarks(page: PDFPage, dashed = false) {
  const gray = rgb(0.68, 0.68, 0.68);
  if (dashed) {
    page.drawLine({
      start: { x: A5_WIDTH_PT, y: 12 },
      end: { x: A5_WIDTH_PT, y: A4_LANDSCAPE_HEIGHT_PT - 12 },
      thickness: 0.6,
      color: gray,
      dashArray: [5, 5],
    });
    return;
  }
  page.drawLine({ start: { x: A5_WIDTH_PT, y: 0 }, end: { x: A5_WIDTH_PT, y: 8 }, thickness: 0.4, color: gray });
  page.drawLine({
    start: { x: A5_WIDTH_PT, y: A4_LANDSCAPE_HEIGHT_PT - 8 },
    end: { x: A5_WIDTH_PT, y: A4_LANDSCAPE_HEIGHT_PT },
    thickness: 0.4,
    color: gray,
  });
}

async function renderImposedSide(
  a5PdfBytes: Uint8Array,
  side: 'front' | 'back',
  options: A4ImpositionOptions = {},
  dashedCutLine = false,
): Promise<Uint8Array> {
  const srcDoc = await PDFDocument.load(a5PdfBytes);
  const pageCount = srcDoc.getPageCount();
  const plan = buildA4ImpositionPlan(pageCount, options);
  const orderedSheets = side === 'back' && options.versoOrder === 'reverse' ? [...plan].reverse() : plan;
  const outDoc = await PDFDocument.create();
  const scaleMode = options.scaleMode ?? 'full';

  const indicesToEmbed = Array.from({ length: pageCount }, (_, idx) => idx);
  const embeddedPages = await outDoc.embedPdf(srcDoc, indicesToEmbed);

  for (const sheet of orderedSheets) {
    const page = outDoc.addPage([A4_LANDSCAPE_WIDTH_PT, A4_LANDSCAPE_HEIGHT_PT]);
    const leftSlot = side === 'front' ? sheet.frontLeft : sheet.backLeft;
    const rightSlot = side === 'front' ? sheet.frontRight : sheet.backRight;

    for (const [slotIdx, slot] of [[0, leftSlot], [1, rightSlot]] as const) {
      if (slot.pageIndex === null) continue;
      const embedded = embeddedPages[slot.pageIndex];
      const placement = getSlotPlacement(slotIdx, slot.rotation, scaleMode);
      page.drawPage(embedded, {
        x: placement.x,
        y: placement.y,
        width: placement.width,
        height: placement.height,
        rotate: degrees(placement.rotation),
      });
    }
    drawCutTickMarks(page, dashedCutLine);
  }
  return outDoc.save();
}

export async function imposeA5ToA4Fronts(
  a5PdfBytes: Uint8Array,
  options: A4ImpositionOptions = {},
): Promise<Uint8Array> {
  return renderImposedSide(a5PdfBytes, 'front', options);
}

export async function imposeA5ToA4Backs(
  a5PdfBytes: Uint8Array,
  options: A4ImpositionOptions = {},
): Promise<Uint8Array> {
  return renderImposedSide(a5PdfBytes, 'back', options);
}

export async function renderSelectedA4Output(
  a5PdfBytes: Uint8Array,
  mode: A4PrintMode,
  options: A4ImpositionOptions = {},
): Promise<Uint8Array> {
  if (mode === 'a4-frentes') return imposeA5ToA4Fronts(a5PdfBytes, options);
  if (mode === 'a4-versos') return imposeA5ToA4Backs(a5PdfBytes, options);
  return a5PdfBytes;
}

async function createSyntheticCalibrationA5Pdf(flipMode: A4FlipMode, scaleMode: A4ScaleMode): Promise<Uint8Array> {
  const doc = await PDFDocument.create();
  const fontBold = await doc.embedFont(StandardFonts.HelveticaBold);
  const fontRegular = await doc.embedFont(StandardFonts.Helvetica);
  const labels = [
    { num: '1', side: 'FRENTE (Folha A5 #1)', pos: 'Metade Esquerda da Frente A4' },
    { num: '2', side: 'VERSO DA PAG. 1 (Folha A5 #1)', pos: 'Deve sair atras da Pagina 1' },
    { num: '3', side: 'FRENTE (Folha A5 #2)', pos: 'Metade Direita da Frente A4' },
    { num: '4', side: 'VERSO DA PAG. 3 (Folha A5 #2)', pos: 'Deve sair atras da Pagina 3' },
  ];

  for (const item of labels) {
    const page = doc.addPage([A5_WIDTH_PT, A5_HEIGHT_PT]);
    page.drawRectangle({
      x: 18,
      y: 18,
      width: A5_WIDTH_PT - 36,
      height: A5_HEIGHT_PT - 36,
      borderColor: rgb(0.2, 0.2, 0.2),
      borderWidth: 1.5,
    });
    page.drawText('^ TOPO DA PAGINA A5 (CABECALHO PARA CIMA) ^', {
      x: 42,
      y: A5_HEIGHT_PT - 46,
      size: 11,
      font: fontBold,
      color: rgb(0.12, 0.12, 0.12),
    });
    page.drawText(`PAGINA A5`, { x: 145, y: 420, size: 18, font: fontBold, color: rgb(0.35, 0.35, 0.35) });
    page.drawText(item.num, { x: 175, y: 310, size: 110, font: fontBold, color: rgb(0.1, 0.1, 0.1) });
    page.drawText(item.side, { x: 48, y: 245, size: 13, font: fontBold, color: rgb(0.15, 0.15, 0.15) });
    page.drawText(item.pos, { x: 48, y: 222, size: 11, font: fontRegular, color: rgb(0.3, 0.3, 0.3) });
    page.drawText(`Configuracao ativa: virada=${flipMode} | escala=${scaleMode === 'safe' ? '96% (segura)' : '100%'}`, {
      x: 42,
      y: 115,
      size: 9.5,
      font: fontBold,
      color: rgb(0.2, 0.2, 0.2),
    });
    page.drawText('1. Imprima a Pagina 1 deste PDF (Frente A4) e recoloque a folha na bandeja.', {
      x: 42,
      y: 85,
      size: 8.5,
      font: fontRegular,
    });
    page.drawText('2. Imprima a Pagina 2 deste PDF (Verso A4) e corte ao meio em 148,5 mm.', {
      x: 42,
      y: 70,
      size: 8.5,
      font: fontRegular,
    });
    page.drawText('3. Confira se a Pag. 2 ficou atras da Pag. 1 com o TOPO alinhado para cima.', {
      x: 42,
      y: 55,
      size: 8.5,
      font: fontRegular,
    });
  }
  return doc.save();
}

export async function generateA4CalibrationPdf(
  options: Pick<A4ImpositionOptions, 'flipMode' | 'scaleMode'> = {},
): Promise<Uint8Array> {
  const flipMode = options.flipMode ?? 'short-edge';
  const scaleMode = options.scaleMode ?? 'full';
  const syntheticA5 = await createSyntheticCalibrationA5Pdf(flipMode, scaleMode);
  const frontsBytes = await renderImposedSide(syntheticA5, 'front', { flipMode, scaleMode }, true);
  const backsBytes = await renderImposedSide(syntheticA5, 'back', { flipMode, scaleMode }, true);

  const merged = await PDFDocument.create();
  const frontDoc = await PDFDocument.load(frontsBytes);
  const backDoc = await PDFDocument.load(backsBytes);
  const [frontPage] = await merged.copyPages(frontDoc, [0]);
  const [backPage] = await merged.copyPages(backDoc, [0]);
  merged.addPage(frontPage);
  merged.addPage(backPage);
  return merged.save();
}

