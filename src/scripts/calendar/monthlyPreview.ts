import { buildAnnualCalendarData } from './dateEngine';
import { computeContainRect, computeMonthlyPageLayout, MONTHLY_TEMPLATES } from './monthlyTemplates';
import type { PreviewImageSource } from './preview';
import { buildQrMatrix } from './qrMatrix';
import { computeCoverCropRect } from './templates';
import type { MonthlyCalendarConfig, MonthlyPageKey } from './types';

function escapeXml(value: string): string {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}

function renderQrSvg(qrText: string, x: number, y: number, size: number, darkColor: string): string {
  const matrix = buildQrMatrix(qrText);
  if (!matrix) return '';
  const pad = 1.2;
  const inner = size - pad * 2;
  const cell = inner / matrix.size;
  const parts: string[] = [
    `<rect x="${x}" y="${y}" width="${size}" height="${size}" rx="1.2" fill="#ffffff" stroke="#d6d3d1" stroke-width="0.25" />`,
  ];
  for (let r = 0; r < matrix.size; r++) {
    for (let c = 0; c < matrix.size; c++) {
      if (!matrix.rows[r][c]) continue;
      parts.push(
        `<rect x="${(x + pad + c * cell).toFixed(3)}" y="${(y + pad + r * cell).toFixed(3)}" width="${(cell + 0.04).toFixed(3)}" height="${(cell + 0.04).toFixed(3)}" fill="${darkColor}" />`,
      );
    }
  }
  return parts.join('');
}

function buildContactLines(config: MonthlyCalendarConfig): string[] {
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

/** Gera a prévia vetorial SVG de uma página (Capa ou Mês 1..12) do Calendário Mensal Wire-O. */
export function renderMonthlyCalendarSvg(
  config: MonthlyCalendarConfig,
  pageKey: MonthlyPageKey,
  pageImage: PreviewImageSource | null,
  logoImage: PreviewImageSource | null,
): string {
  const data = buildAnnualCalendarData({
    year: config.year,
    weekStart: config.weekStart,
    includeFederalHolidays: config.includeFederalHolidays,
    includeGoodFriday: config.includeGoodFriday,
  });
  const theme = MONTHLY_TEMPLATES[config.templateId];
  const layout = computeMonthlyPageLayout(config, pageKey);
  const { advertiser } = config;
  const vis = advertiser.visibility;
  const primary = advertiser.primaryColor || '#1c1917';
  const accent = advertiser.accentColor || '#b45309';
  const headingFamily = theme.headingFont === 'serif'
    ? 'Georgia, "Times New Roman", serif'
    : 'system-ui, -apple-system, "Segoe UI", sans-serif';
  const bodyFamily = 'system-ui, -apple-system, "Segoe UI", sans-serif';

  const parts: string[] = [];
  parts.push(
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${layout.pageWidthMm} ${layout.pageHeightMm}" width="100%" height="100%" role="img" aria-label="Prévia calendário mensal ${pageKey}">`,
  );
  parts.push('<defs>');
  parts.push(
    `<clipPath id="cal-monthly-photo-clip"><rect x="${layout.photoBox.x}" y="${layout.photoBox.y}" width="${layout.photoBox.width}" height="${layout.photoBox.height}" rx="2" /></clipPath>`,
  );
  parts.push('</defs>');

  parts.push(`<rect x="0" y="0" width="${layout.pageWidthMm}" height="${layout.pageHeightMm}" fill="${theme.pageBg}" />`);

  // Reserva técnica Wire-O (guia visual apenas na prévia)
  parts.push(
    `<rect x="${layout.wireOBox.x}" y="${layout.wireOBox.y}" width="${layout.wireOBox.width}" height="${layout.wireOBox.height}" fill="#f5f5f4" opacity="0.65" />`,
  );
  parts.push(
    `<line x1="${layout.wireOBox.x}" y1="${layout.wireOBox.y + layout.wireOBox.height}" x2="${layout.wireOBox.x + layout.wireOBox.width}" y2="${layout.wireOBox.y + layout.wireOBox.height}" stroke="#a8a29e" stroke-width="0.25" stroke-dasharray="1.5 1.2" />`,
  );
  for (let px = layout.wireOBox.x + 14; px <= layout.wireOBox.x + layout.wireOBox.width - 14; px += 12) {
    parts.push(`<circle cx="${px}" cy="${layout.wireOBox.y + layout.wireOMarginMm * 0.48}" r="1.7" fill="#d6d3d1" stroke="#a8a29e" stroke-width="0.25" />`);
  }
  parts.push(
    `<text x="${layout.trimBox.x + layout.trimBox.width - 6}" y="${layout.wireOBox.y + layout.wireOMarginMm - 1.5}" text-anchor="end" font-family="${bodyFamily}" font-size="2.2" fill="#78716c">Reserva Wire-O (${layout.wireOMarginMm} mm)</text>`,
  );

  // Cabeçalho
  if (pageKey === 'cover') {
    const titleX = vis.showLogo && logoImage ? layout.logoBox.x + layout.logoBox.width + 5 : layout.headerBox.x;
    if (vis.showLogo && logoImage) {
      const lr = computeContainRect(logoImage.width, logoImage.height, layout.logoBox);
      parts.push(`<image href="${escapeXml(logoImage.dataUrl)}" x="${lr.x}" y="${lr.y}" width="${lr.width}" height="${lr.height}" preserveAspectRatio="none" />`);
    }
    if (vis.showName && advertiser.name.trim()) {
      parts.push(`<text x="${titleX}" y="${layout.headerBox.y + 11}" font-family="${headingFamily}" font-size="8.5" font-weight="700" fill="${primary}">${escapeXml(advertiser.name.trim())}</text>`);
    }
    if (vis.showSlogan && advertiser.slogan.trim()) {
      parts.push(`<text x="${titleX}" y="${layout.headerBox.y + 18}" font-family="${bodyFamily}" font-size="4.2" fill="${theme.inkMuted}">${escapeXml(advertiser.slogan.trim())}</text>`);
    }
    parts.push(`<text x="${layout.headerBox.x + layout.headerBox.width}" y="${layout.headerBox.y + 15}" text-anchor="end" font-family="${headingFamily}" font-size="14" font-weight="700" fill="${accent}">${data.year}</text>`);
    parts.push(`<line x1="${layout.headerBox.x}" y1="${layout.headerBox.y + layout.headerBox.height - 2}" x2="${layout.headerBox.x + layout.headerBox.width}" y2="${layout.headerBox.y + layout.headerBox.height - 2}" stroke="${accent}" stroke-width="0.6" />`);
  } else {
    const month = data.months[pageKey - 1];
    if (theme.hasPromoBanner) {
      parts.push(`<rect x="${layout.headerBox.x}" y="${layout.headerBox.y}" width="${layout.headerBox.width}" height="${layout.headerBox.height}" rx="2" fill="${primary}" />`);
      if (vis.showLogo && logoImage) {
        const lr = computeContainRect(logoImage.width, logoImage.height, layout.logoBox);
        parts.push(`<rect x="${layout.logoBox.x - 1}" y="${layout.logoBox.y - 1}" width="${layout.logoBox.width + 2}" height="${layout.logoBox.height + 2}" rx="1.5" fill="#ffffff" opacity="0.95" />`);
        parts.push(`<image href="${escapeXml(logoImage.dataUrl)}" x="${lr.x}" y="${lr.y}" width="${lr.width}" height="${lr.height}" preserveAspectRatio="none" />`);
      }
      const brandX = vis.showLogo && logoImage ? layout.logoBox.x + layout.logoBox.width + 4 : layout.headerBox.x + 5;
      if (vis.showName && advertiser.name.trim()) {
        parts.push(`<text x="${brandX}" y="${layout.headerBox.y + 11.5}" font-family="${headingFamily}" font-size="6.2" font-weight="700" fill="#ffffff">${escapeXml(advertiser.name.trim())}</text>`);
      }
      if (vis.showSlogan && advertiser.slogan.trim()) {
        parts.push(`<text x="${brandX}" y="${layout.headerBox.y + 18}" font-family="${bodyFamily}" font-size="3.4" fill="#f5f5f4">${escapeXml(advertiser.slogan.trim())}</text>`);
      }
      parts.push(`<text x="${layout.headerBox.x + layout.headerBox.width - 5}" y="${layout.headerBox.y + 13}" text-anchor="end" font-family="${headingFamily}" font-size="7.2" font-weight="700" fill="#ffffff">${escapeXml(month.name.toUpperCase())}</text>`);
      parts.push(`<text x="${layout.headerBox.x + layout.headerBox.width - 5}" y="${layout.headerBox.y + 20}" text-anchor="end" font-family="${bodyFamily}" font-size="4.4" font-weight="600" fill="${accent}">${data.year}</text>`);
    } else {
      parts.push(`<text x="${layout.headerBox.x}" y="${layout.headerBox.y + 10.5}" font-family="${headingFamily}" font-size="9.5" font-weight="700" fill="${primary}">${escapeXml(month.name.toUpperCase())}</text>`);
      parts.push(`<text x="${layout.headerBox.x + layout.headerBox.width}" y="${layout.headerBox.y + 10.5}" text-anchor="end" font-family="${headingFamily}" font-size="9" font-weight="700" fill="${accent}">${data.year}</text>`);
      if (config.templateId === 'institutional') {
        const subParts: string[] = [];
        if (vis.showName && advertiser.name.trim()) subParts.push(advertiser.name.trim());
        if (vis.showSlogan && advertiser.slogan.trim()) subParts.push(advertiser.slogan.trim());
        if (subParts.length) {
          parts.push(`<text x="${layout.headerBox.x}" y="${layout.headerBox.y + 18}" font-family="${bodyFamily}" font-size="3.6" fill="${theme.inkMuted}">${escapeXml(subParts.join(' · '))}</text>`);
        }
      }
      parts.push(`<line x1="${layout.headerBox.x}" y1="${layout.headerBox.y + layout.headerBox.height - 1.5}" x2="${layout.headerBox.x + layout.headerBox.width}" y2="${layout.headerBox.y + layout.headerBox.height - 1.5}" stroke="${accent}" stroke-width="0.55" />`);
    }
  }

  // Área da foto
  parts.push(`<rect x="${layout.photoBox.x}" y="${layout.photoBox.y}" width="${layout.photoBox.width}" height="${layout.photoBox.height}" rx="2" fill="#f5f5f4" />`);
  if (pageImage?.dataUrl) {
    const crop = computeCoverCropRect(pageImage.width, pageImage.height, layout.photoBox, config.sharedPlacement);
    parts.push(`<image href="${escapeXml(pageImage.dataUrl)}" x="${crop.x}" y="${crop.y}" width="${crop.width}" height="${crop.height}" preserveAspectRatio="none" clip-path="url(#cal-monthly-photo-clip)" />`);
  } else {
    parts.push(`<text x="${layout.photoBox.x + layout.photoBox.width / 2}" y="${layout.photoBox.y + layout.photoBox.height / 2}" text-anchor="middle" dominant-baseline="middle" font-family="${bodyFamily}" font-size="4.4" fill="#78716c">Adicione uma foto global ou exclusiva para esta página</text>`);
  }
  parts.push(`<rect x="${layout.photoBox.x}" y="${layout.photoBox.y}" width="${layout.photoBox.width}" height="${layout.photoBox.height}" rx="2" fill="none" stroke="${theme.cardBorder}" stroke-width="0.3" />`);

  // Grade do mês (páginas 1..12)
  if (pageKey !== 'cover') {
    const month = data.months[pageKey - 1];
    const gx = layout.gridBox.x;
    const gy = layout.gridBox.y;
    const gw = layout.gridBox.width;
    const gh = layout.gridBox.height;
    const holidayBandH = 8;
    const calH = gh - holidayBandH;

    parts.push(`<rect x="${gx}" y="${gy}" width="${gw}" height="${calH}" rx="2" fill="${theme.cardBg}" stroke="${theme.cardBorder}" stroke-width="0.3" />`);

    const colW = gw / 7;
    const weekNames = config.weekStart === 'monday'
      ? ['SEG', 'TER', 'QUA', 'QUI', 'SEX', 'SÁB', 'DOM']
      : ['DOM', 'SEG', 'TER', 'QUA', 'QUI', 'SEX', 'SÁB'];

    const weekHeadH = 8.5;
    parts.push(`<rect x="${gx}" y="${gy}" width="${gw}" height="${weekHeadH}" rx="2" fill="${primary}" opacity="0.08" />`);
    weekNames.forEach((lbl, dIdx) => {
      const isSunCol = (config.weekStart === 'sunday' && dIdx === 0) || (config.weekStart === 'monday' && dIdx === 6);
      parts.push(`<text x="${gx + colW * (dIdx + 0.5)}" y="${gy + 5.7}" text-anchor="middle" font-family="${bodyFamily}" font-size="3.1" font-weight="700" fill="${isSunCol ? accent : theme.inkMuted}">${lbl}</text>`);
    });

    const rowCount = Math.max(5, month.weeks.length);
    const rowH = (calH - weekHeadH) / rowCount;
    const numSize = config.templateId === 'advertising' ? 6.2 : 5.4;

    month.weeks.forEach((week, wIdx) => {
      const cy = gy + weekHeadH + rowH * (wIdx + 0.52);
      week.forEach((cell, dIdx) => {
        const cx = gx + colW * (dIdx + 0.5);
        if (wIdx > 0 && dIdx === 0) {
          parts.push(`<line x1="${gx}" y1="${gy + weekHeadH + rowH * wIdx}" x2="${gx + gw}" y2="${gy + weekHeadH + rowH * wIdx}" stroke="${theme.cardBorder}" stroke-width="0.2" />`);
        }
        if (cell.day === null) return;
        if (cell.holiday) {
          const fill = cell.holiday.category === 'religious' ? theme.religiousFill : theme.holidayFill;
          parts.push(`<rect x="${cx - colW * 0.36}" y="${cy - rowH * 0.36}" width="${colW * 0.72}" height="${rowH * 0.72}" rx="1.4" fill="${fill}" />`);
        }
        let color = theme.ink;
        let weight = config.templateId === 'advertising' ? '700' : '500';
        if (cell.holiday) {
          color = cell.holiday.category === 'religious' ? theme.religiousInk : theme.holidayInk;
          weight = '700';
        } else if (cell.isWeekend) {
          color = theme.weekendInk;
        }
        parts.push(`<text x="${cx}" y="${cy}" text-anchor="middle" dominant-baseline="middle" font-family="${bodyFamily}" font-size="${numSize}" font-weight="${weight}" fill="${color}">${cell.day}</text>`);
      });
    });

    const monthHolidays = data.holidays.filter(h => h.month === month.month);
    const legText = monthHolidays.length
      ? monthHolidays.map(h => `${String(h.day).padStart(2, '0')}/${String(h.month).padStart(2, '0')} ${h.name}${h.category === 'religious' ? ' (religioso)' : ''}`).join('  ·  ')
      : 'Sem feriados nacionais federais neste mês';
    parts.push(`<text x="${gx + 1}" y="${gy + calH + 5.2}" font-family="${bodyFamily}" font-size="2.7" fill="${theme.inkMuted}">${escapeXml(legText)}</text>`);
  }

  // Rodapé institucional unificado
  const fx = layout.footerBox.x;
  const fy = layout.footerBox.y;
  const fw = layout.footerBox.width;
  const fh = layout.footerBox.height;
  parts.push(`<rect x="${fx}" y="${fy}" width="${fw}" height="${fh}" rx="2" fill="${primary}" opacity="${theme.hasPromoBanner ? '0.07' : '0.04'}" stroke="${theme.cardBorder}" stroke-width="0.3" />`);

  let textStartX = fx + 4;
  if (!theme.hasPromoBanner && vis.showLogo && logoImage && pageKey !== 'cover') {
    const lr = computeContainRect(logoImage.width, logoImage.height, layout.logoBox);
    parts.push(`<image href="${escapeXml(logoImage.dataUrl)}" x="${lr.x}" y="${lr.y}" width="${lr.width}" height="${lr.height}" preserveAspectRatio="none" />`);
    textStartX = layout.logoBox.x + layout.logoBox.width + 4;
  }

  let textY = fy + 8;
  if (vis.showName && advertiser.name.trim()) {
    parts.push(`<text x="${textStartX}" y="${textY}" font-family="${headingFamily}" font-size="4.6" font-weight="700" fill="${primary}">${escapeXml(advertiser.name.trim())}</text>`);
    textY += 5;
  }
  if (vis.showSlogan && advertiser.slogan.trim() && !theme.hasPromoBanner && pageKey !== 'cover') {
    parts.push(`<text x="${textStartX}" y="${textY}" font-family="${bodyFamily}" font-size="3.1" fill="${accent}">${escapeXml(advertiser.slogan.trim())}</text>`);
    textY += 4.5;
  }
  for (const line of buildContactLines(config)) {
    parts.push(`<text x="${textStartX}" y="${textY}" font-family="${bodyFamily}" font-size="3.0" fill="${theme.inkMuted}">${escapeXml(line)}</text>`);
    textY += 4.3;
  }

  if (vis.showQrCode && advertiser.qrText.trim()) {
    parts.push(renderQrSvg(advertiser.qrText, layout.qrBox.x, layout.qrBox.y, layout.qrBox.width, primary));
  }

  if (layout.bleedMm > 0) {
    parts.push(`<rect x="${layout.trimBox.x}" y="${layout.trimBox.y}" width="${layout.trimBox.width}" height="${layout.trimBox.height}" fill="none" stroke="${accent}" stroke-width="0.25" stroke-dasharray="1.8 1.2" opacity="0.6" />`);
  }

  parts.push('</svg>');
  return parts.join('');
}
