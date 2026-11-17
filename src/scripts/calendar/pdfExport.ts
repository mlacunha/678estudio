import {
  clip,
  closePath,
  endPath,
  lineTo,
  moveTo,
  PDFDocument,
  popGraphicsState,
  pushGraphicsState,
  rgb,
  StandardFonts,
  type PDFFont,
} from 'pdf-lib';
import { buildAnnualCalendarData } from './dateEngine';
import { computeDeskBaseGeometry, computeDeskPageLayout, DESK_TEMPLATES, resolveEffectiveBase } from './deskTemplates';
import { computeContainRect, computeMonthlyPageLayout, MONTHLY_TEMPLATES } from './monthlyTemplates';
import { buildQrMatrix } from './qrMatrix';
import { CALENDAR_TEMPLATES, computeAnnualLayout, computeCoverCropRect, MM_TO_PT, type RectMm } from './templates';
import type { CalendarConfig, DeskCalendarConfig, MonthlyCalendarConfig, MonthlyPageKey } from './types';

export interface PdfRasterImageInput {
  bytes: Uint8Array;
  mime: 'image/png' | 'image/jpeg';
}

function hexToRgb(hex: string) {
  const clean = hex.replace('#', '');
  const n = Number.parseInt(clean, 16);
  const r = ((n >> 16) & 255) / 255;
  const g = ((n >> 8) & 255) / 255;
  const b = (n & 255) / 255;
  return rgb(r, g, b);
}

function toPdfRect(rect: RectMm, pageHeightMm: number) {
  return {
    x: rect.x * MM_TO_PT,
    y: (pageHeightMm - rect.y - rect.height) * MM_TO_PT,
    width: rect.width * MM_TO_PT,
    height: rect.height * MM_TO_PT,
  };
}

function toPdfY(topYmm: number, pageHeightMm: number) {
  return (pageHeightMm - topYmm) * MM_TO_PT;
}

function drawRightAlignedText(
  page: ReturnType<PDFDocument['addPage']>,
  text: string,
  rightXpt: number,
  yPt: number,
  sizePt: number,
  font: PDFFont,
  colorHex: string,
) {
  const width = font.widthOfTextAtSize(text, sizePt);
  page.drawText(text, { x: rightXpt - width, y: yPt, size: sizePt, font, color: hexToRgb(colorHex) });
}

function drawCenteredText(
  page: ReturnType<PDFDocument['addPage']>,
  text: string,
  centerXpt: number,
  yPt: number,
  sizePt: number,
  font: PDFFont,
  colorHex: string,
) {
  const width = font.widthOfTextAtSize(text, sizePt);
  page.drawText(text, { x: centerXpt - width / 2, y: yPt, size: sizePt, font, color: hexToRgb(colorHex) });
}

/** Gera o PDF vetorial de impressão (A4/A3) utilizando pdf-lib e fontes padrão incorporadas. */
export async function exportAnnualCalendarPdf(
  config: CalendarConfig,
  imageInput: PdfRasterImageInput | null = null,
): Promise<Uint8Array> {
  const data = buildAnnualCalendarData({
    year: config.year,
    weekStart: config.weekStart,
    includeFederalHolidays: config.includeFederalHolidays,
    includeGoodFriday: config.includeGoodFriday,
  });
  const theme = CALENDAR_TEMPLATES[config.templateId];
  const layout = computeAnnualLayout(config);
  const scaleFactor = layout.trimWidthMm >= 290 && config.orientation === 'portrait' ? 1.28 : 1;

  const pdfDoc = await PDFDocument.create();
  pdfDoc.setTitle(`Calendário Anual ${data.year} - 678 Estudio`);
  pdfDoc.setAuthor('678 Estudio');

  const pageWidthPt = layout.pageWidthMm * MM_TO_PT;
  const pageHeightPt = layout.pageHeightMm * MM_TO_PT;
  const page = pdfDoc.addPage([pageWidthPt, pageHeightPt]);

  const sansRegular = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const sansBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
  const serifBold = theme.headingFont === 'serif'
    ? await pdfDoc.embedFont(StandardFonts.TimesRomanBold)
    : sansBold;

  // Fundo da página
  page.drawRectangle({ x: 0, y: 0, width: pageWidthPt, height: pageHeightPt, color: hexToRgb(theme.pageBg) });

  // Área da foto / arte com recorte vetorial exato
  const photoPdf = toPdfRect(layout.photoBox, layout.pageHeightMm);
  page.drawRectangle({
    x: photoPdf.x,
    y: photoPdf.y,
    width: photoPdf.width,
    height: photoPdf.height,
    color: hexToRgb(theme.photoBg),
  });

  if (imageInput) {
    const embedded = imageInput.mime === 'image/jpeg'
      ? await pdfDoc.embedJpg(imageInput.bytes)
      : await pdfDoc.embedPng(imageInput.bytes);
    const cropMm = computeCoverCropRect(embedded.width, embedded.height, layout.photoBox, config.imagePlacement);
    const cropPdf = toPdfRect(cropMm, layout.pageHeightMm);

    page.pushOperators(
      pushGraphicsState(),
      moveTo(photoPdf.x, photoPdf.y),
      lineTo(photoPdf.x + photoPdf.width, photoPdf.y),
      lineTo(photoPdf.x + photoPdf.width, photoPdf.y + photoPdf.height),
      lineTo(photoPdf.x, photoPdf.y + photoPdf.height),
      closePath(),
      clip(),
      endPath(),
    );
    page.drawImage(embedded, {
      x: cropPdf.x,
      y: cropPdf.y,
      width: cropPdf.width,
      height: cropPdf.height,
    });
    page.pushOperators(popGraphicsState());
  }

  if (!theme.fullBleedPhoto) {
    page.drawRectangle({
      x: photoPdf.x,
      y: photoPdf.y,
      width: photoPdf.width,
      height: photoPdf.height,
      borderColor: hexToRgb(theme.photoBorder),
      borderWidth: 0.35 * MM_TO_PT,
    });
    if (config.templateId === 'editorial') {
      const inset = 1.4 * MM_TO_PT;
      page.drawRectangle({
        x: photoPdf.x + inset,
        y: photoPdf.y + inset,
        width: photoPdf.width - inset * 2,
        height: photoPdf.height - inset * 2,
        borderColor: hexToRgb(theme.photoBorder),
        borderWidth: 0.2 * MM_TO_PT,
      });
    }
  }

  // Cabeçalho
  const yearSizePt = 11.5 * scaleFactor * MM_TO_PT * 0.86;
  const titleSizePt = 5.4 * scaleFactor * MM_TO_PT * 0.86;
  const subSizePt = 3.2 * scaleFactor * MM_TO_PT * 0.86;
  const headerBottomYmm = layout.headerBox.y + layout.headerBox.height;

  page.drawText(String(data.year), {
    x: layout.headerBox.x * MM_TO_PT,
    y: toPdfY(layout.headerBox.y + 11.5 * scaleFactor * 0.85, layout.pageHeightMm),
    size: yearSizePt,
    font: serifBold,
    color: hexToRgb(theme.ink),
  });

  const titleText = config.title.trim() || 'Calendário Anual';
  drawRightAlignedText(
    page,
    titleText,
    (layout.headerBox.x + layout.headerBox.width) * MM_TO_PT,
    toPdfY(layout.headerBox.y + 6.5 * scaleFactor, layout.pageHeightMm),
    titleSizePt,
    serifBold,
    theme.accent,
  );

  if (config.subtitle.trim()) {
    drawRightAlignedText(
      page,
      config.subtitle.trim(),
      (layout.headerBox.x + layout.headerBox.width) * MM_TO_PT,
      toPdfY(layout.headerBox.y + 11.2 * scaleFactor, layout.pageHeightMm),
      subSizePt,
      sansRegular,
      theme.inkMuted,
    );
  }

  const divY = toPdfY(headerBottomYmm - 1, layout.pageHeightMm);
  page.drawLine({
    start: { x: layout.headerBox.x * MM_TO_PT, y: divY },
    end: { x: (layout.headerBox.x + layout.headerBox.width) * MM_TO_PT, y: divY },
    thickness: 0.35 * MM_TO_PT,
    color: hexToRgb(theme.divider),
  });

  // Grade vetorial dos 12 meses
  const colGap = 3.5;
  const rowGap = 3.5;
  const cellW = (layout.gridBox.width - colGap * (layout.gridCols - 1)) / layout.gridCols;
  const cellH = (layout.gridBox.height - rowGap * (layout.gridRows - 1)) / layout.gridRows;

  data.months.forEach((month, idx) => {
    const col = idx % layout.gridCols;
    const row = Math.floor(idx / layout.gridCols);
    const mx = layout.gridBox.x + col * (cellW + colGap);
    const my = layout.gridBox.y + row * (cellH + rowGap);
    const cardPdf = toPdfRect({ x: mx, y: my, width: cellW, height: cellH }, layout.pageHeightMm);

    page.drawRectangle({
      x: cardPdf.x,
      y: cardPdf.y,
      width: cardPdf.width,
      height: cardPdf.height,
      color: hexToRgb(theme.cardBg),
      borderColor: hexToRgb(theme.cardBorder),
      borderWidth: 0.25 * MM_TO_PT,
    });

    const padX = 2.4;
    const monthFontSize = 3.4 * scaleFactor * MM_TO_PT * 0.85;
    page.drawText(month.name.toUpperCase(), {
      x: (mx + padX) * MM_TO_PT,
      y: toPdfY(my + 5.2, layout.pageHeightMm),
      size: monthFontSize,
      font: serifBold,
      color: hexToRgb(theme.accent),
    });

    const innerW = cellW - padX * 2;
    const dayColW = innerW / 7;
    const weekHeaderY = my + 9.2;
    const weekFontSize = 2.2 * scaleFactor * MM_TO_PT * 0.85;

    data.weekdayLabels.forEach((lbl, dIdx) => {
      const lx = (mx + padX + dayColW * (dIdx + 0.5)) * MM_TO_PT;
      const isSunCol = (data.weekStart === 'sunday' && dIdx === 0) || (data.weekStart === 'monday' && dIdx === 6);
      drawCenteredText(
        page,
        lbl,
        lx,
        toPdfY(weekHeaderY, layout.pageHeightMm),
        weekFontSize,
        sansBold,
        isSunCol ? theme.accent : theme.inkMuted,
      );
    });

    const rowsTop = weekHeaderY + 1.8;
    const rowsAvail = my + cellH - rowsTop - 1.5;
    const rowStep = rowsAvail / 6;
    const dayFontSize = 2.55 * scaleFactor * MM_TO_PT * 0.85;

    month.weeks.forEach((week, wIdx) => {
      const cyMm = rowsTop + rowStep * (wIdx + 0.55);
      week.forEach((cell, dIdx) => {
        if (cell.day === null) return;
        const cxMm = mx + padX + dayColW * (dIdx + 0.5);

        if (cell.holiday) {
          const isRel = cell.holiday.category === 'religious';
          const pillW = Math.min(dayColW * 0.86, rowStep * 0.92);
          const pillH = rowStep * 0.78;
          const pillPdf = toPdfRect(
            { x: cxMm - pillW / 2, y: cyMm - pillH / 2 - 0.3, width: pillW, height: pillH },
            layout.pageHeightMm,
          );
          page.drawRectangle({
            x: pillPdf.x,
            y: pillPdf.y,
            width: pillPdf.width,
            height: pillPdf.height,
            color: hexToRgb(isRel ? theme.religiousFill : theme.holidayFill),
          });
        }

        let inkColor = theme.ink;
        let font = sansRegular;
        if (cell.holiday) {
          inkColor = cell.holiday.category === 'religious' ? theme.religiousInk : theme.holidayInk;
          font = sansBold;
        } else if (cell.isWeekend) {
          inkColor = theme.weekendInk;
        }

        drawCenteredText(
          page,
          String(cell.day),
          cxMm * MM_TO_PT,
          toPdfY(cyMm + 0.75, layout.pageHeightMm),
          dayFontSize,
          font,
          inkColor,
        );
      });
    });
  });

  // Rodapé com legenda explícita
  const legendItems: string[] = [];
  if (config.includeFederalHolidays && data.holidays.length > 0) {
    const fed = data.holidays
      .filter(h => h.category === 'federal-national')
      .map(h => `${String(h.day).padStart(2, '0')}/${String(h.month).padStart(2, '0')} ${h.name}`);
    legendItems.push(`Feriados nacionais: ${fed.join(' · ')}`);
  }
  if (config.includeGoodFriday) {
    const gf = data.holidays.find(h => h.category === 'religious');
    if (gf) {
      legendItems.push(`Data religiosa (opcional): ${String(gf.day).padStart(2, '0')}/${String(gf.month).padStart(2, '0')} ${gf.name}`);
    }
  }
  const legendText = legendItems.join(' | ') || `678 Estudio · Calendário Anual ${data.year}`;
  page.drawText(legendText, {
    x: layout.footerBox.x * MM_TO_PT,
    y: toPdfY(layout.footerBox.y + 4.5, layout.pageHeightMm),
    size: 2.05 * scaleFactor * MM_TO_PT * 0.85,
    font: sansRegular,
    color: hexToRgb(theme.inkMuted),
  });

  // Marcas de corte nos cantos quando sangria está habilitada
  if (layout.bleedMm > 0) {
    drawPdfCropMarks(page, layout.trimBox, layout.pageHeightMm, theme.inkMuted);
  }

  return pdfDoc.save();
}

function drawPdfCropMarks(
  page: ReturnType<PDFDocument['addPage']>,
  trimBox: RectMm,
  pageHeightMm: number,
  colorHex: string,
) {
  const t = toPdfRect(trimBox, pageHeightMm);
  const markLen = 2.2 * MM_TO_PT;
  const markColor = hexToRgb(colorHex);
  const corners = [
    [t.x, t.y, -1, 0, 0, -1],
    [t.x + t.width, t.y, 1, 0, 0, -1],
    [t.x, t.y + t.height, -1, 0, 0, 1],
    [t.x + t.width, t.y + t.height, 1, 0, 0, 1],
  ];
  for (const [cx, cy, dx, dy1, dx2, dy] of corners) {
    page.drawLine({ start: { x: cx, y: cy }, end: { x: cx + dx * markLen, y: cy + dy1 * markLen }, thickness: 0.4, color: markColor });
    page.drawLine({ start: { x: cx, y: cy }, end: { x: cx + dx2 * markLen, y: cy + dy * markLen }, thickness: 0.4, color: markColor });
  }
}

function drawPdfQrCode(
  page: ReturnType<PDFDocument['addPage']>,
  qrText: string,
  box: RectMm,
  pageHeightMm: number,
  darkHex: string,
) {
  const matrix = buildQrMatrix(qrText);
  if (!matrix) return;
  const qrPdf = toPdfRect(box, pageHeightMm);
  page.drawRectangle({
    x: qrPdf.x,
    y: qrPdf.y,
    width: qrPdf.width,
    height: qrPdf.height,
    color: rgb(1, 1, 1),
    borderColor: hexToRgb('#d6d3d1'),
    borderWidth: 0.25 * MM_TO_PT,
  });

  const padPt = 1.2 * MM_TO_PT;
  const innerPt = qrPdf.width - padPt * 2;
  const cellPt = innerPt / matrix.size;
  const darkColor = hexToRgb(darkHex);

  for (let r = 0; r < matrix.size; r++) {
    for (let c = 0; c < matrix.size; c++) {
      if (!matrix.rows[r][c]) continue;
      page.drawRectangle({
        x: qrPdf.x + padPt + c * cellPt,
        y: qrPdf.y + qrPdf.height - padPt - (r + 1) * cellPt,
        width: cellPt + 0.08,
        height: cellPt + 0.08,
        color: darkColor,
      });
    }
  }
}

function buildMonthlyContactLines(config: MonthlyCalendarConfig): string[] {
  const { advertiser } = config;
  const v = advertiser.visibility;
  const lines: string[] = [];
  const line1: string[] = [];
  if (v.showPhone && advertiser.phone.trim()) line1.push(`Tel: ${advertiser.phone.trim()}`);
  if (v.showWhatsapp && advertiser.whatsapp.trim()) line1.push(`WhatsApp: ${advertiser.whatsapp.trim()}`);
  if (line1.length) lines.push(line1.join('  ·  '));
  if (v.showWebsite && advertiser.website.trim()) lines.push(advertiser.website.trim());
  if (v.showAddress && advertiser.address.trim()) lines.push(advertiser.address.trim());
  return lines;
}

/** Gera PDF multipágina vetorial (12 ou 13 páginas A4 Retrato) para Calendário Mensal Wire-O. */
export async function exportMonthlyWireOPdf(
  config: MonthlyCalendarConfig,
  pageImages: Partial<Record<MonthlyPageKey, PdfRasterImageInput | null>>,
  logoInput: PdfRasterImageInput | null = null,
): Promise<Uint8Array> {
  const data = buildAnnualCalendarData({
    year: config.year,
    weekStart: config.weekStart,
    includeFederalHolidays: config.includeFederalHolidays,
    includeGoodFriday: config.includeGoodFriday,
  });
  const theme = MONTHLY_TEMPLATES[config.templateId];
  const { advertiser } = config;
  const vis = advertiser.visibility;
  const primary = advertiser.primaryColor || '#1c1917';
  const accent = advertiser.accentColor || '#b45309';

  const pdfDoc = await PDFDocument.create();
  pdfDoc.setTitle(`Calendário Mensal Wire-O ${data.year} - ${advertiser.name || '678 Estudio'}`);
  pdfDoc.setAuthor('678 Estudio');

  const sansRegular = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const sansBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
  const headingBold = theme.headingFont === 'serif'
    ? await pdfDoc.embedFont(StandardFonts.TimesRomanBold)
    : sansBold;

  const embedCache = new Map<PdfRasterImageInput, Awaited<ReturnType<PDFDocument['embedPng']>>>();
  const embedCached = async (input: PdfRasterImageInput | null | undefined) => {
    if (!input) return null;
    const hit = embedCache.get(input);
    if (hit) return hit;
    const emb = input.mime === 'image/jpeg' ? await pdfDoc.embedJpg(input.bytes) : await pdfDoc.embedPng(input.bytes);
    embedCache.set(input, emb);
    return emb;
  };

  const embeddedLogo = vis.showLogo ? await embedCached(logoInput) : null;
  const pageKeys: MonthlyPageKey[] = config.includeCover
    ? ['cover', 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12]
    : [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12];

  for (const pageKey of pageKeys) {
    const layout = computeMonthlyPageLayout(config, pageKey);
    const pageWidthPt = layout.pageWidthMm * MM_TO_PT;
    const pageHeightPt = layout.pageHeightMm * MM_TO_PT;
    const page = pdfDoc.addPage([pageWidthPt, pageHeightPt]);

    page.drawRectangle({ x: 0, y: 0, width: pageWidthPt, height: pageHeightPt, color: hexToRgb(theme.pageBg) });

    // Cabeçalho
    if (pageKey === 'cover') {
      const titleXmm = vis.showLogo && embeddedLogo ? layout.logoBox.x + layout.logoBox.width + 5 : layout.headerBox.x;
      if (vis.showLogo && embeddedLogo) {
        const lr = toPdfRect(computeContainRect(embeddedLogo.width, embeddedLogo.height, layout.logoBox), layout.pageHeightMm);
        page.drawImage(embeddedLogo, { x: lr.x, y: lr.y, width: lr.width, height: lr.height });
      }
      if (vis.showName && advertiser.name.trim()) {
        page.drawText(advertiser.name.trim(), {
          x: titleXmm * MM_TO_PT,
          y: toPdfY(layout.headerBox.y + 11, layout.pageHeightMm),
          size: 8.5 * MM_TO_PT * 0.85,
          font: headingBold,
          color: hexToRgb(primary),
        });
      }
      if (vis.showSlogan && advertiser.slogan.trim()) {
        page.drawText(advertiser.slogan.trim(), {
          x: titleXmm * MM_TO_PT,
          y: toPdfY(layout.headerBox.y + 18, layout.pageHeightMm),
          size: 4.2 * MM_TO_PT * 0.85,
          font: sansRegular,
          color: hexToRgb(theme.inkMuted),
        });
      }
      drawRightAlignedText(
        page,
        String(data.year),
        (layout.headerBox.x + layout.headerBox.width) * MM_TO_PT,
        toPdfY(layout.headerBox.y + 15, layout.pageHeightMm),
        14 * MM_TO_PT * 0.85,
        headingBold,
        accent,
      );
      const lineY = toPdfY(layout.headerBox.y + layout.headerBox.height - 2, layout.pageHeightMm);
      page.drawLine({
        start: { x: layout.headerBox.x * MM_TO_PT, y: lineY },
        end: { x: (layout.headerBox.x + layout.headerBox.width) * MM_TO_PT, y: lineY },
        thickness: 0.6 * MM_TO_PT,
        color: hexToRgb(accent),
      });
    } else {
      const month = data.months[pageKey - 1];
      if (theme.hasPromoBanner) {
        const hb = toPdfRect(layout.headerBox, layout.pageHeightMm);
        page.drawRectangle({ x: hb.x, y: hb.y, width: hb.width, height: hb.height, color: hexToRgb(primary) });
        if (vis.showLogo && embeddedLogo) {
          const lb = toPdfRect(layout.logoBox, layout.pageHeightMm);
          page.drawRectangle({ x: lb.x - 2, y: lb.y - 2, width: lb.width + 4, height: lb.height + 4, color: rgb(1, 1, 1), opacity: 0.95 });
          const lr = toPdfRect(computeContainRect(embeddedLogo.width, embeddedLogo.height, layout.logoBox), layout.pageHeightMm);
          page.drawImage(embeddedLogo, { x: lr.x, y: lr.y, width: lr.width, height: lr.height });
        }
        const brandXmm = vis.showLogo && embeddedLogo ? layout.logoBox.x + layout.logoBox.width + 4 : layout.headerBox.x + 5;
        if (vis.showName && advertiser.name.trim()) {
          page.drawText(advertiser.name.trim(), {
            x: brandXmm * MM_TO_PT,
            y: toPdfY(layout.headerBox.y + 11.5, layout.pageHeightMm),
            size: 6.2 * MM_TO_PT * 0.85,
            font: headingBold,
            color: rgb(1, 1, 1),
          });
        }
        if (vis.showSlogan && advertiser.slogan.trim()) {
          page.drawText(advertiser.slogan.trim(), {
            x: brandXmm * MM_TO_PT,
            y: toPdfY(layout.headerBox.y + 18, layout.pageHeightMm),
            size: 3.4 * MM_TO_PT * 0.85,
            font: sansRegular,
            color: hexToRgb('#f5f5f4'),
          });
        }
        drawRightAlignedText(
          page,
          month.name.toUpperCase(),
          (layout.headerBox.x + layout.headerBox.width - 5) * MM_TO_PT,
          toPdfY(layout.headerBox.y + 13, layout.pageHeightMm),
          7.2 * MM_TO_PT * 0.85,
          headingBold,
          '#ffffff',
        );
        drawRightAlignedText(
          page,
          String(data.year),
          (layout.headerBox.x + layout.headerBox.width - 5) * MM_TO_PT,
          toPdfY(layout.headerBox.y + 20, layout.pageHeightMm),
          4.4 * MM_TO_PT * 0.85,
          sansBold,
          accent,
        );
      } else {
        page.drawText(month.name.toUpperCase(), {
          x: layout.headerBox.x * MM_TO_PT,
          y: toPdfY(layout.headerBox.y + 10.5, layout.pageHeightMm),
          size: 9.5 * MM_TO_PT * 0.85,
          font: headingBold,
          color: hexToRgb(primary),
        });
        drawRightAlignedText(
          page,
          String(data.year),
          (layout.headerBox.x + layout.headerBox.width) * MM_TO_PT,
          toPdfY(layout.headerBox.y + 10.5, layout.pageHeightMm),
          9 * MM_TO_PT * 0.85,
          headingBold,
          accent,
        );
        if (config.templateId === 'institutional') {
          const subParts: string[] = [];
          if (vis.showName && advertiser.name.trim()) subParts.push(advertiser.name.trim());
          if (vis.showSlogan && advertiser.slogan.trim()) subParts.push(advertiser.slogan.trim());
          if (subParts.length) {
            page.drawText(subParts.join(' · '), {
              x: layout.headerBox.x * MM_TO_PT,
              y: toPdfY(layout.headerBox.y + 18, layout.pageHeightMm),
              size: 3.6 * MM_TO_PT * 0.85,
              font: sansRegular,
              color: hexToRgb(theme.inkMuted),
            });
          }
        }
        const lineY = toPdfY(layout.headerBox.y + layout.headerBox.height - 1.5, layout.pageHeightMm);
        page.drawLine({
          start: { x: layout.headerBox.x * MM_TO_PT, y: lineY },
          end: { x: (layout.headerBox.x + layout.headerBox.width) * MM_TO_PT, y: lineY },
          thickness: 0.55 * MM_TO_PT,
          color: hexToRgb(accent),
        });
      }
    }

    // Área da foto com recorte vetorial
    const photoPdf = toPdfRect(layout.photoBox, layout.pageHeightMm);
    page.drawRectangle({ x: photoPdf.x, y: photoPdf.y, width: photoPdf.width, height: photoPdf.height, color: hexToRgb('#f5f5f4') });
    const imgInput = pageImages[pageKey] ?? (pageKey === 'cover' ? pageImages[1] : pageImages[1]);
    const embeddedPhoto = await embedCached(imgInput);
    if (embeddedPhoto) {
      const cropPdf = toPdfRect(computeCoverCropRect(embeddedPhoto.width, embeddedPhoto.height, layout.photoBox, config.sharedPlacement), layout.pageHeightMm);
      page.pushOperators(
        pushGraphicsState(),
        moveTo(photoPdf.x, photoPdf.y),
        lineTo(photoPdf.x + photoPdf.width, photoPdf.y),
        lineTo(photoPdf.x + photoPdf.width, photoPdf.y + photoPdf.height),
        lineTo(photoPdf.x, photoPdf.y + photoPdf.height),
        closePath(),
        clip(),
        endPath(),
      );
      page.drawImage(embeddedPhoto, { x: cropPdf.x, y: cropPdf.y, width: cropPdf.width, height: cropPdf.height });
      page.pushOperators(popGraphicsState());
    }
    page.drawRectangle({
      x: photoPdf.x,
      y: photoPdf.y,
      width: photoPdf.width,
      height: photoPdf.height,
      borderColor: hexToRgb(theme.cardBorder),
      borderWidth: 0.3 * MM_TO_PT,
    });

    // Grade mensal (1..12)
    if (pageKey !== 'cover') {
      const month = data.months[pageKey - 1];
      const gx = layout.gridBox.x;
      const gy = layout.gridBox.y;
      const gw = layout.gridBox.width;
      const gh = layout.gridBox.height;
      const holidayBandH = 8;
      const calH = gh - holidayBandH;

      const calPdf = toPdfRect({ x: gx, y: gy, width: gw, height: calH }, layout.pageHeightMm);
      page.drawRectangle({
        x: calPdf.x,
        y: calPdf.y,
        width: calPdf.width,
        height: calPdf.height,
        color: hexToRgb(theme.cardBg),
        borderColor: hexToRgb(theme.cardBorder),
        borderWidth: 0.3 * MM_TO_PT,
      });

      const weekHeadH = 8.5;
      const whPdf = toPdfRect({ x: gx, y: gy, width: gw, height: weekHeadH }, layout.pageHeightMm);
      page.drawRectangle({ x: whPdf.x, y: whPdf.y, width: whPdf.width, height: whPdf.height, color: hexToRgb(primary), opacity: 0.08 });

      const colW = gw / 7;
      const weekNames = config.weekStart === 'monday'
        ? ['SEG', 'TER', 'QUA', 'QUI', 'SEX', 'SÁB', 'DOM']
        : ['DOM', 'SEG', 'TER', 'QUA', 'QUI', 'SEX', 'SÁB'];
      weekNames.forEach((lbl, dIdx) => {
        const isSunCol = (config.weekStart === 'sunday' && dIdx === 0) || (config.weekStart === 'monday' && dIdx === 6);
        drawCenteredText(
          page,
          lbl,
          (gx + colW * (dIdx + 0.5)) * MM_TO_PT,
          toPdfY(gy + 5.7, layout.pageHeightMm),
          3.1 * MM_TO_PT * 0.85,
          sansBold,
          isSunCol ? accent : theme.inkMuted,
        );
      });

      const rowCount = Math.max(5, month.weeks.length);
      const rowH = (calH - weekHeadH) / rowCount;
      const numSizePt = (config.templateId === 'advertising' ? 6.2 : 5.4) * MM_TO_PT * 0.85;

      month.weeks.forEach((week, wIdx) => {
        const cyMm = gy + weekHeadH + rowH * (wIdx + 0.52);
        if (wIdx > 0) {
          const lineY = toPdfY(gy + weekHeadH + rowH * wIdx, layout.pageHeightMm);
          page.drawLine({
            start: { x: gx * MM_TO_PT, y: lineY },
            end: { x: (gx + gw) * MM_TO_PT, y: lineY },
            thickness: 0.2 * MM_TO_PT,
            color: hexToRgb(theme.cardBorder),
          });
        }
        week.forEach((cell, dIdx) => {
          if (cell.day === null) return;
          const cxMm = gx + colW * (dIdx + 0.5);
          if (cell.holiday) {
            const pillPdf = toPdfRect(
              { x: cxMm - colW * 0.36, y: cyMm - rowH * 0.36, width: colW * 0.72, height: rowH * 0.72 },
              layout.pageHeightMm,
            );
            page.drawRectangle({
              x: pillPdf.x,
              y: pillPdf.y,
              width: pillPdf.width,
              height: pillPdf.height,
              color: hexToRgb(cell.holiday.category === 'religious' ? theme.religiousFill : theme.holidayFill),
            });
          }
          let color = theme.ink;
          let font = config.templateId === 'advertising' ? sansBold : sansRegular;
          if (cell.holiday) {
            color = cell.holiday.category === 'religious' ? theme.religiousInk : theme.holidayInk;
            font = sansBold;
          } else if (cell.isWeekend) {
            color = theme.weekendInk;
          }
          drawCenteredText(page, String(cell.day), cxMm * MM_TO_PT, toPdfY(cyMm + 1.5, layout.pageHeightMm), numSizePt, font, color);
        });
      });

      const monthHolidays = data.holidays.filter(h => h.month === month.month);
      const legText = monthHolidays.length
        ? monthHolidays.map(h => `${String(h.day).padStart(2, '0')}/${String(h.month).padStart(2, '0')} ${h.name}${h.category === 'religious' ? ' (religioso)' : ''}`).join('  ·  ')
        : 'Sem feriados nacionais federais neste mês';
      page.drawText(legText, {
        x: (gx + 1) * MM_TO_PT,
        y: toPdfY(gy + calH + 5.2, layout.pageHeightMm),
        size: 2.7 * MM_TO_PT * 0.85,
        font: sansRegular,
        color: hexToRgb(theme.inkMuted),
      });
    }

    // Rodapé institucional
    const footPdf = toPdfRect(layout.footerBox, layout.pageHeightMm);
    page.drawRectangle({
      x: footPdf.x,
      y: footPdf.y,
      width: footPdf.width,
      height: footPdf.height,
      color: hexToRgb(primary),
      opacity: theme.hasPromoBanner ? 0.07 : 0.04,
      borderColor: hexToRgb(theme.cardBorder),
      borderWidth: 0.3 * MM_TO_PT,
    });

    let textStartXmm = layout.footerBox.x + 4;
    if (!theme.hasPromoBanner && vis.showLogo && embeddedLogo && pageKey !== 'cover') {
      const lr = toPdfRect(computeContainRect(embeddedLogo.width, embeddedLogo.height, layout.logoBox), layout.pageHeightMm);
      page.drawImage(embeddedLogo, { x: lr.x, y: lr.y, width: lr.width, height: lr.height });
      textStartXmm = layout.logoBox.x + layout.logoBox.width + 4;
    }

    let textYmm = layout.footerBox.y + 8;
    if (vis.showName && advertiser.name.trim()) {
      page.drawText(advertiser.name.trim(), {
        x: textStartXmm * MM_TO_PT,
        y: toPdfY(textYmm, layout.pageHeightMm),
        size: 4.6 * MM_TO_PT * 0.85,
        font: headingBold,
        color: hexToRgb(primary),
      });
      textYmm += 5;
    }
    if (vis.showSlogan && advertiser.slogan.trim() && !theme.hasPromoBanner && pageKey !== 'cover') {
      page.drawText(advertiser.slogan.trim(), {
        x: textStartXmm * MM_TO_PT,
        y: toPdfY(textYmm, layout.pageHeightMm),
        size: 3.1 * MM_TO_PT * 0.85,
        font: sansRegular,
        color: hexToRgb(accent),
      });
      textYmm += 4.5;
    }
    for (const line of buildMonthlyContactLines(config)) {
      page.drawText(line, {
        x: textStartXmm * MM_TO_PT,
        y: toPdfY(textYmm, layout.pageHeightMm),
        size: 3.0 * MM_TO_PT * 0.85,
        font: sansRegular,
        color: hexToRgb(theme.inkMuted),
      });
      textYmm += 4.3;
    }

    if (vis.showQrCode && advertiser.qrText.trim()) {
      drawPdfQrCode(page, advertiser.qrText, layout.qrBox, layout.pageHeightMm, primary);
    }

    if (layout.bleedMm > 0) {
      drawPdfCropMarks(page, layout.trimBox, layout.pageHeightMm, theme.inkMuted);
    }
  }

  return pdfDoc.save();
}

/** Gera PDF vetorial interno de produção para Calendário de Mesa Wire-O (folhas horizontais + lâmina da base triangular). */
export async function exportDeskCalendarPdf(
  config: DeskCalendarConfig,
  pageImages: Partial<Record<MonthlyPageKey, PdfRasterImageInput | null>>,
  logoInput: PdfRasterImageInput | null = null,
): Promise<Uint8Array> {
  const data = buildAnnualCalendarData({
    year: config.year,
    weekStart: config.weekStart,
    includeFederalHolidays: config.includeFederalHolidays,
    includeGoodFriday: config.includeGoodFriday,
  });
  const theme = DESK_TEMPLATES[config.templateId];
  const { advertiser } = config;
  const vis = advertiser.visibility;
  const primary = advertiser.primaryColor || '#1c1917';
  const accent = advertiser.accentColor || '#b45309';

  const pdfDoc = await PDFDocument.create();
  pdfDoc.setTitle(`Calendário de Mesa Wire-O ${data.year} - ${advertiser.name || '678 Estudio'}`);
  pdfDoc.setAuthor('678 Estudio');

  const sansRegular = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const sansBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
  const headingBold = theme.headingFont === 'serif'
    ? await pdfDoc.embedFont(StandardFonts.TimesRomanBold)
    : sansBold;

  const embedCache = new Map<PdfRasterImageInput, Awaited<ReturnType<PDFDocument['embedPng']>>>();
  const embedCached = async (input: PdfRasterImageInput | null | undefined) => {
    if (!input) return null;
    const hit = embedCache.get(input);
    if (hit) return hit;
    const emb = input.mime === 'image/jpeg' ? await pdfDoc.embedJpg(input.bytes) : await pdfDoc.embedPng(input.bytes);
    embedCache.set(input, emb);
    return emb;
  };

  const embeddedLogo = await embedCached(logoInput);
  const pageKeys: MonthlyPageKey[] = config.includeCover
    ? ['cover', 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12]
    : [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12];

  for (const pageKey of pageKeys) {
    const layout = computeDeskPageLayout(config, pageKey);
    const pageWidthPt = layout.pageWidthMm * MM_TO_PT;
    const pageHeightPt = layout.pageHeightMm * MM_TO_PT;
    const page = pdfDoc.addPage([pageWidthPt, pageHeightPt]);

    page.drawRectangle({ x: 0, y: 0, width: pageWidthPt, height: pageHeightPt, color: hexToRgb(theme.pageBg) });

    // Foto
    const photoPdf = toPdfRect(layout.photoBox, layout.pageHeightMm);
    page.drawRectangle({ x: photoPdf.x, y: photoPdf.y, width: photoPdf.width, height: photoPdf.height, color: hexToRgb('#f5f5f4') });
    const embeddedPhoto = await embedCached(pageImages[pageKey] ?? pageImages[1]);
    if (embeddedPhoto) {
      const cropPdf = toPdfRect(computeCoverCropRect(embeddedPhoto.width, embeddedPhoto.height, layout.photoBox, config.sharedPlacement), layout.pageHeightMm);
      page.pushOperators(
        pushGraphicsState(),
        moveTo(photoPdf.x, photoPdf.y),
        lineTo(photoPdf.x + photoPdf.width, photoPdf.y),
        lineTo(photoPdf.x + photoPdf.width, photoPdf.y + photoPdf.height),
        lineTo(photoPdf.x, photoPdf.y + photoPdf.height),
        closePath(),
        clip(),
        endPath(),
      );
      page.drawImage(embeddedPhoto, { x: cropPdf.x, y: cropPdf.y, width: cropPdf.width, height: cropPdf.height });
      page.pushOperators(popGraphicsState());
    }
    page.drawRectangle({
      x: photoPdf.x,
      y: photoPdf.y,
      width: photoPdf.width,
      height: photoPdf.height,
      borderColor: hexToRgb(theme.cardBorder),
      borderWidth: 0.3 * MM_TO_PT,
    });

    if (pageKey === 'cover') {
      let textYmm = layout.headerBox.y + 8;
      if (vis.showLogo && embeddedLogo) {
        const lr = toPdfRect(computeContainRect(embeddedLogo.width, embeddedLogo.height, layout.logoBox), layout.pageHeightMm);
        page.drawImage(embeddedLogo, { x: lr.x, y: lr.y, width: lr.width, height: lr.height });
        textYmm = layout.logoBox.y + layout.logoBox.height + 9;
      }
      if (vis.showName && advertiser.name.trim()) {
        page.drawText(advertiser.name.trim(), {
          x: layout.headerBox.x * MM_TO_PT,
          y: toPdfY(textYmm, layout.pageHeightMm),
          size: 6.4 * MM_TO_PT * 0.85,
          font: headingBold,
          color: hexToRgb(primary),
        });
        textYmm += 5.5;
      }
      if (vis.showSlogan && advertiser.slogan.trim()) {
        page.drawText(advertiser.slogan.trim(), {
          x: layout.headerBox.x * MM_TO_PT,
          y: toPdfY(textYmm, layout.pageHeightMm),
          size: 3.4 * MM_TO_PT * 0.85,
          font: sansRegular,
          color: hexToRgb(theme.inkMuted),
        });
      }
      page.drawText(String(data.year), {
        x: layout.headerBox.x * MM_TO_PT,
        y: toPdfY(layout.footerBox.y + 9, layout.pageHeightMm),
        size: 11 * MM_TO_PT * 0.85,
        font: headingBold,
        color: hexToRgb(accent),
      });
    } else {
      const month = data.months[pageKey - 1];
      if (theme.hasPromoBanner) {
        const hb = toPdfRect(layout.headerBox, layout.pageHeightMm);
        page.drawRectangle({ x: hb.x, y: hb.y, width: hb.width, height: hb.height, color: hexToRgb(primary) });
        if (vis.showLogo && embeddedLogo) {
          const lb = toPdfRect(layout.logoBox, layout.pageHeightMm);
          page.drawRectangle({ x: lb.x - 1.5, y: lb.y - 1.5, width: lb.width + 3, height: lb.height + 3, color: rgb(1, 1, 1), opacity: 0.95 });
          const lr = toPdfRect(computeContainRect(embeddedLogo.width, embeddedLogo.height, layout.logoBox), layout.pageHeightMm);
          page.drawImage(embeddedLogo, { x: lr.x, y: lr.y, width: lr.width, height: lr.height });
        }
        const brandXmm = vis.showLogo && embeddedLogo ? layout.logoBox.x + layout.logoBox.width + 4 : layout.headerBox.x + 4;
        if (vis.showName && advertiser.name.trim()) {
          page.drawText(advertiser.name.trim(), {
            x: brandXmm * MM_TO_PT,
            y: toPdfY(layout.headerBox.y + 8, layout.pageHeightMm),
            size: 4.6 * MM_TO_PT * 0.85,
            font: headingBold,
            color: rgb(1, 1, 1),
          });
        }
        if (vis.showSlogan && advertiser.slogan.trim()) {
          page.drawText(advertiser.slogan.trim(), {
            x: brandXmm * MM_TO_PT,
            y: toPdfY(layout.headerBox.y + 13, layout.pageHeightMm),
            size: 2.8 * MM_TO_PT * 0.85,
            font: sansRegular,
            color: hexToRgb('#f5f5f4'),
          });
        }
        drawRightAlignedText(
          page,
          `${month.name.toUpperCase()} ${data.year}`,
          (layout.headerBox.x + layout.headerBox.width - 4) * MM_TO_PT,
          toPdfY(layout.headerBox.y + 11, layout.pageHeightMm),
          6.4 * MM_TO_PT * 0.85,
          headingBold,
          '#ffffff',
        );
      } else {
        page.drawText(month.name.toUpperCase(), {
          x: layout.headerBox.x * MM_TO_PT,
          y: toPdfY(layout.headerBox.y + 9.5, layout.pageHeightMm),
          size: 7.2 * MM_TO_PT * 0.85,
          font: headingBold,
          color: hexToRgb(primary),
        });
        drawRightAlignedText(
          page,
          String(data.year),
          (layout.headerBox.x + layout.headerBox.width) * MM_TO_PT,
          toPdfY(layout.headerBox.y + 9.5, layout.pageHeightMm),
          7 * MM_TO_PT * 0.85,
          headingBold,
          accent,
        );
        const lineY = toPdfY(layout.headerBox.y + layout.headerBox.height - 1.2, layout.pageHeightMm);
        page.drawLine({
          start: { x: layout.headerBox.x * MM_TO_PT, y: lineY },
          end: { x: (layout.headerBox.x + layout.headerBox.width) * MM_TO_PT, y: lineY },
          thickness: 0.45 * MM_TO_PT,
          color: hexToRgb(accent),
        });
      }

      const gx = layout.gridBox.x;
      const gy = layout.gridBox.y;
      const gw = layout.gridBox.width;
      const gh = layout.gridBox.height;
      const calPdf = toPdfRect(layout.gridBox, layout.pageHeightMm);
      page.drawRectangle({
        x: calPdf.x,
        y: calPdf.y,
        width: calPdf.width,
        height: calPdf.height,
        color: hexToRgb(theme.cardBg),
        borderColor: hexToRgb(theme.cardBorder),
        borderWidth: 0.25 * MM_TO_PT,
      });

      const weekHeadH = 6.5;
      const whPdf = toPdfRect({ x: gx, y: gy, width: gw, height: weekHeadH }, layout.pageHeightMm);
      page.drawRectangle({ x: whPdf.x, y: whPdf.y, width: whPdf.width, height: whPdf.height, color: hexToRgb(primary), opacity: 0.08 });

      const colW = gw / 7;
      const weekNames = config.weekStart === 'monday'
        ? ['SEG', 'TER', 'QUA', 'QUI', 'SEX', 'SÁB', 'DOM']
        : ['DOM', 'SEG', 'TER', 'QUA', 'QUI', 'SEX', 'SÁB'];
      weekNames.forEach((lbl, dIdx) => {
        const isSunCol = (config.weekStart === 'sunday' && dIdx === 0) || (config.weekStart === 'monday' && dIdx === 6);
        drawCenteredText(
          page,
          lbl,
          (gx + colW * (dIdx + 0.5)) * MM_TO_PT,
          toPdfY(gy + 4.3, layout.pageHeightMm),
          2.5 * MM_TO_PT * 0.85,
          sansBold,
          isSunCol ? accent : theme.inkMuted,
        );
      });

      const rowCount = Math.max(5, month.weeks.length);
      const rowH = (gh - weekHeadH) / rowCount;
      const numSizePt = (config.templateId === 'advertising' ? 4.3 : 3.9) * MM_TO_PT * 0.85;
      month.weeks.forEach((week, wIdx) => {
        const cyMm = gy + weekHeadH + rowH * (wIdx + 0.54);
        week.forEach((cell, dIdx) => {
          if (cell.day === null) return;
          const cxMm = gx + colW * (dIdx + 0.5);
          if (cell.holiday) {
            const pillPdf = toPdfRect(
              { x: cxMm - colW * 0.36, y: cyMm - rowH * 0.36, width: colW * 0.72, height: rowH * 0.72 },
              layout.pageHeightMm,
            );
            page.drawRectangle({
              x: pillPdf.x,
              y: pillPdf.y,
              width: pillPdf.width,
              height: pillPdf.height,
              color: hexToRgb(cell.holiday.category === 'religious' ? theme.religiousFill : theme.holidayFill),
            });
          }
          let color = theme.ink;
          let font = config.templateId === 'advertising' ? sansBold : sansRegular;
          if (cell.holiday) {
            color = cell.holiday.category === 'religious' ? theme.religiousInk : theme.holidayInk;
            font = sansBold;
          } else if (cell.isWeekend) {
            color = theme.weekendInk;
          }
          drawCenteredText(page, String(cell.day), cxMm * MM_TO_PT, toPdfY(cyMm + 1.1, layout.pageHeightMm), numSizePt, font, color);
        });
      });

      const monthHolidays = data.holidays.filter(h => h.month === month.month);
      const legText = monthHolidays.length
        ? monthHolidays.map(h => `${String(h.day).padStart(2, '0')}/${String(h.month).padStart(2, '0')} ${h.name}`).join('  ·  ')
        : `${advertiser.name.trim() || '678 Estudio'} · ${data.year}`;
      page.drawText(legText, {
        x: layout.footerBox.x * MM_TO_PT,
        y: toPdfY(layout.footerBox.y + 6, layout.pageHeightMm),
        size: 2.4 * MM_TO_PT * 0.85,
        font: sansRegular,
        color: hexToRgb(theme.inkMuted),
      });
    }

    if (layout.bleedMm > 0) {
      drawPdfCropMarks(page, layout.trimBox, layout.pageHeightMm, theme.inkMuted);
    }
  }

  // Lâmina final da Base Triangular (frente personalizada + reservas de dobra/fixação)
  const baseGeom = computeDeskBaseGeometry(config);
  const baseCfg = resolveEffectiveBase(config);
  const baseWpt = baseGeom.pageWidthMm * MM_TO_PT;
  const baseHpt = baseGeom.pageHeightMm * MM_TO_PT;
  const basePage = pdfDoc.addPage([baseWpt, baseHpt]);
  const basePrimary = baseCfg.primaryColor || '#1c1917';
  const baseAccent = baseCfg.accentColor || '#b45309';

  basePage.drawRectangle({ x: 0, y: 0, width: baseWpt, height: baseHpt, color: hexToRgb(basePrimary) });
  const frontBandPdf = toPdfRect(
    { x: baseGeom.trimBox.x, y: baseGeom.trimBox.y + baseGeom.foldAllowanceMm, width: baseGeom.trimBox.width, height: 2.2 },
    baseGeom.pageHeightMm,
  );
  basePage.drawRectangle({ x: frontBandPdf.x, y: frontBandPdf.y, width: frontBandPdf.width, height: frontBandPdf.height, color: hexToRgb(baseAccent) });

  let baseTextXmm = baseGeom.frontSafeBox.x;
  if (baseCfg.showLogo && embeddedLogo) {
    const lb = toPdfRect(baseGeom.logoBox, baseGeom.pageHeightMm);
    basePage.drawRectangle({ x: lb.x - 2, y: lb.y - 2, width: lb.width + 4, height: lb.height + 4, color: rgb(1, 1, 1), opacity: 0.96 });
    const lr = toPdfRect(computeContainRect(embeddedLogo.width, embeddedLogo.height, baseGeom.logoBox), baseGeom.pageHeightMm);
    basePage.drawImage(embeddedLogo, { x: lr.x, y: lr.y, width: lr.width, height: lr.height });
    baseTextXmm = baseGeom.logoBox.x + baseGeom.logoBox.width + 5;
  }

  let baseYmm = baseGeom.frontSafeBox.y + 8;
  if (baseCfg.showName && baseCfg.name.trim()) {
    basePage.drawText(baseCfg.name.trim(), {
      x: baseTextXmm * MM_TO_PT,
      y: toPdfY(baseYmm, baseGeom.pageHeightMm),
      size: 5.4 * MM_TO_PT * 0.85,
      font: headingBold,
      color: rgb(1, 1, 1),
    });
    baseYmm += 5.5;
  }
  if (baseCfg.showSlogan && baseCfg.slogan.trim()) {
    basePage.drawText(baseCfg.slogan.trim(), {
      x: baseTextXmm * MM_TO_PT,
      y: toPdfY(baseYmm, baseGeom.pageHeightMm),
      size: 3.3 * MM_TO_PT * 0.85,
      font: sansRegular,
      color: hexToRgb('#f5f5f4'),
    });
    baseYmm += 5;
  }
  const baseContacts: string[] = [];
  if (baseCfg.showPhone && baseCfg.phone.trim()) baseContacts.push(`Tel: ${baseCfg.phone.trim()}`);
  if (baseCfg.showWhatsapp && baseCfg.whatsapp.trim()) baseContacts.push(`WhatsApp: ${baseCfg.whatsapp.trim()}`);
  if (baseContacts.length) {
    basePage.drawText(baseContacts.join('  ·  '), {
      x: baseTextXmm * MM_TO_PT,
      y: toPdfY(baseYmm, baseGeom.pageHeightMm),
      size: 3.0 * MM_TO_PT * 0.85,
      font: sansRegular,
      color: hexToRgb('#e7e5e4'),
    });
    baseYmm += 4.5;
  }
  if (baseCfg.showWebsite && baseCfg.website.trim()) {
    basePage.drawText(baseCfg.website.trim(), {
      x: baseTextXmm * MM_TO_PT,
      y: toPdfY(baseYmm, baseGeom.pageHeightMm),
      size: 3.0 * MM_TO_PT * 0.85,
      font: sansRegular,
      color: hexToRgb(baseAccent),
    });
  }

  if (baseCfg.showQrCode && baseCfg.qrText.trim()) {
    drawPdfQrCode(basePage, baseCfg.qrText, baseGeom.qrBox, baseGeom.pageHeightMm, basePrimary);
  }

  if (baseGeom.bleedMm > 0) {
    drawPdfCropMarks(basePage, baseGeom.trimBox, baseGeom.pageHeightMm, '#ffffff');
  }

  return pdfDoc.save();
}
