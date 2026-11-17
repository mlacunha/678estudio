import { buildAnnualCalendarData } from './dateEngine';
import { computeDeskPageLayout, DESK_TEMPLATES, resolveEffectiveBase } from './deskTemplates';
import { computeContainRect } from './monthlyTemplates';
import type { PreviewImageSource } from './preview';
import { buildQrMatrix } from './qrMatrix';
import { computeCoverCropRect } from './templates';
import type { DeskCalendarConfig, MonthlyPageKey } from './types';

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
  const pad = 1.0;
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

function buildDeskSheetInner(
  config: DeskCalendarConfig,
  pageKey: MonthlyPageKey,
  pageImage: PreviewImageSource | null,
  logoImage: PreviewImageSource | null,
  showWireOGuide: boolean,
): string {
  const data = buildAnnualCalendarData({
    year: config.year,
    weekStart: config.weekStart,
    includeFederalHolidays: config.includeFederalHolidays,
    includeGoodFriday: config.includeGoodFriday,
  });
  const theme = DESK_TEMPLATES[config.templateId];
  const layout = computeDeskPageLayout(config, pageKey);
  const { advertiser } = config;
  const vis = advertiser.visibility;
  const primary = advertiser.primaryColor || '#1c1917';
  const accent = advertiser.accentColor || '#b45309';
  const headingFamily = theme.headingFont === 'serif'
    ? 'Georgia, "Times New Roman", serif'
    : 'system-ui, -apple-system, "Segoe UI", sans-serif';
  const bodyFamily = 'system-ui, -apple-system, "Segoe UI", sans-serif';

  const parts: string[] = [];
  parts.push('<defs>');
  parts.push(`<clipPath id="desk-photo-clip"><rect x="${layout.photoBox.x}" y="${layout.photoBox.y}" width="${layout.photoBox.width}" height="${layout.photoBox.height}" rx="2" /></clipPath>`);
  parts.push('</defs>');
  parts.push(`<rect x="0" y="0" width="${layout.pageWidthMm}" height="${layout.pageHeightMm}" fill="${theme.pageBg}" />`);

  if (showWireOGuide) {
    parts.push(`<rect x="${layout.wireOBox.x}" y="${layout.wireOBox.y}" width="${layout.wireOBox.width}" height="${layout.wireOBox.height}" fill="#f5f5f4" opacity="0.65" />`);
    parts.push(`<line x1="${layout.wireOBox.x}" y1="${layout.wireOBox.y + layout.wireOBox.height}" x2="${layout.wireOBox.x + layout.wireOBox.width}" y2="${layout.wireOBox.y + layout.wireOBox.height}" stroke="#a8a29e" stroke-width="0.25" stroke-dasharray="1.5 1.2" />`);
    for (let px = layout.wireOBox.x + 12; px <= layout.wireOBox.x + layout.wireOBox.width - 12; px += 12) {
      parts.push(`<circle cx="${px}" cy="${layout.wireOBox.y + layout.wireOMarginMm * 0.48}" r="1.5" fill="#d6d3d1" stroke="#a8a29e" stroke-width="0.25" />`);
    }
    parts.push(`<text x="${layout.trimBox.x + layout.trimBox.width - 5}" y="${layout.wireOBox.y + layout.wireOMarginMm - 1.4}" text-anchor="end" font-family="${bodyFamily}" font-size="2.1" fill="#78716c">Reserva Wire-O (${layout.wireOMarginMm} mm)</text>`);
  }

  // Foto
  parts.push(`<rect x="${layout.photoBox.x}" y="${layout.photoBox.y}" width="${layout.photoBox.width}" height="${layout.photoBox.height}" rx="2" fill="#f5f5f4" />`);
  if (pageImage?.dataUrl) {
    const crop = computeCoverCropRect(pageImage.width, pageImage.height, layout.photoBox, config.sharedPlacement);
    parts.push(`<image href="${escapeXml(pageImage.dataUrl)}" x="${crop.x}" y="${crop.y}" width="${crop.width}" height="${crop.height}" preserveAspectRatio="none" clip-path="url(#desk-photo-clip)" />`);
  } else {
    parts.push(`<text x="${layout.photoBox.x + layout.photoBox.width / 2}" y="${layout.photoBox.y + layout.photoBox.height / 2}" text-anchor="middle" dominant-baseline="middle" font-family="${bodyFamily}" font-size="3.4" fill="#78716c">Foto horizontal</text>`);
  }
  parts.push(`<rect x="${layout.photoBox.x}" y="${layout.photoBox.y}" width="${layout.photoBox.width}" height="${layout.photoBox.height}" rx="2" fill="none" stroke="${theme.cardBorder}" stroke-width="0.3" />`);

  if (pageKey === 'cover') {
    let textY = layout.headerBox.y + 8;
    if (vis.showLogo && logoImage) {
      const lr = computeContainRect(logoImage.width, logoImage.height, layout.logoBox);
      parts.push(`<image href="${escapeXml(logoImage.dataUrl)}" x="${lr.x}" y="${lr.y}" width="${lr.width}" height="${lr.height}" preserveAspectRatio="none" />`);
      textY = layout.logoBox.y + layout.logoBox.height + 9;
    }
    if (vis.showName && advertiser.name.trim()) {
      parts.push(`<text x="${layout.headerBox.x}" y="${textY}" font-family="${headingFamily}" font-size="6.4" font-weight="700" fill="${primary}">${escapeXml(advertiser.name.trim())}</text>`);
      textY += 5.5;
    }
    if (vis.showSlogan && advertiser.slogan.trim()) {
      parts.push(`<text x="${layout.headerBox.x}" y="${textY}" font-family="${bodyFamily}" font-size="3.4" fill="${theme.inkMuted}">${escapeXml(advertiser.slogan.trim())}</text>`);
    }
    parts.push(`<text x="${layout.headerBox.x}" y="${layout.footerBox.y + 9}" font-family="${headingFamily}" font-size="11" font-weight="700" fill="${accent}">${data.year}</text>`);
    parts.push(`<text x="${layout.headerBox.x + layout.headerBox.width}" y="${layout.footerBox.y + 9}" text-anchor="end" font-family="${bodyFamily}" font-size="3.2" fill="${theme.inkMuted}">Calendário de Mesa</text>`);
  } else {
    const month = data.months[pageKey - 1];
    // Cabeçalho horizontal
    if (theme.hasPromoBanner) {
      parts.push(`<rect x="${layout.headerBox.x}" y="${layout.headerBox.y}" width="${layout.headerBox.width}" height="${layout.headerBox.height}" rx="1.8" fill="${primary}" />`);
      if (vis.showLogo && logoImage) {
        const lr = computeContainRect(logoImage.width, logoImage.height, layout.logoBox);
        parts.push(`<rect x="${layout.logoBox.x - 1}" y="${layout.logoBox.y - 1}" width="${layout.logoBox.width + 2}" height="${layout.logoBox.height + 2}" rx="1.2" fill="#ffffff" opacity="0.95" />`);
        parts.push(`<image href="${escapeXml(logoImage.dataUrl)}" x="${lr.x}" y="${lr.y}" width="${lr.width}" height="${lr.height}" preserveAspectRatio="none" />`);
      }
      const brandX = vis.showLogo && logoImage ? layout.logoBox.x + layout.logoBox.width + 4 : layout.headerBox.x + 4;
      if (vis.showName && advertiser.name.trim()) {
        parts.push(`<text x="${brandX}" y="${layout.headerBox.y + 8}" font-family="${headingFamily}" font-size="4.6" font-weight="700" fill="#ffffff">${escapeXml(advertiser.name.trim())}</text>`);
      }
      if (vis.showSlogan && advertiser.slogan.trim()) {
        parts.push(`<text x="${brandX}" y="${layout.headerBox.y + 13}" font-family="${bodyFamily}" font-size="2.8" fill="#f5f5f4">${escapeXml(advertiser.slogan.trim())}</text>`);
      }
      parts.push(`<text x="${layout.headerBox.x + layout.headerBox.width - 4}" y="${layout.headerBox.y + 11}" text-anchor="end" font-family="${headingFamily}" font-size="6.4" font-weight="700" fill="#ffffff">${escapeXml(month.name.toUpperCase())} ${data.year}</text>`);
    } else {
      parts.push(`<text x="${layout.headerBox.x}" y="${layout.headerBox.y + 9.5}" font-family="${headingFamily}" font-size="7.2" font-weight="700" fill="${primary}">${escapeXml(month.name.toUpperCase())}</text>`);
      if (config.templateId === 'institutional' && vis.showName && advertiser.name.trim()) {
        parts.push(`<text x="${layout.headerBox.x + layout.headerBox.width / 2}" y="${layout.headerBox.y + 9.5}" text-anchor="middle" font-family="${bodyFamily}" font-size="3.4" font-weight="600" fill="${theme.inkMuted}">${escapeXml(advertiser.name.trim())}</text>`);
      }
      parts.push(`<text x="${layout.headerBox.x + layout.headerBox.width}" y="${layout.headerBox.y + 9.5}" text-anchor="end" font-family="${headingFamily}" font-size="7" font-weight="700" fill="${accent}">${data.year}</text>`);
      parts.push(`<line x1="${layout.headerBox.x}" y1="${layout.headerBox.y + layout.headerBox.height - 1.2}" x2="${layout.headerBox.x + layout.headerBox.width}" y2="${layout.headerBox.y + layout.headerBox.height - 1.2}" stroke="${accent}" stroke-width="0.45" />`);
    }

    // Grade horizontal legível
    const gx = layout.gridBox.x;
    const gy = layout.gridBox.y;
    const gw = layout.gridBox.width;
    const gh = layout.gridBox.height;
    parts.push(`<rect x="${gx}" y="${gy}" width="${gw}" height="${gh}" rx="1.6" fill="${theme.cardBg}" stroke="${theme.cardBorder}" stroke-width="0.25" />`);

    const colW = gw / 7;
    const weekHeadH = 6.5;
    const weekNames = config.weekStart === 'monday'
      ? ['SEG', 'TER', 'QUA', 'QUI', 'SEX', 'SÁB', 'DOM']
      : ['DOM', 'SEG', 'TER', 'QUA', 'QUI', 'SEX', 'SÁB'];
    parts.push(`<rect x="${gx}" y="${gy}" width="${gw}" height="${weekHeadH}" rx="1.6" fill="${primary}" opacity="0.08" />`);
    weekNames.forEach((lbl, dIdx) => {
      const isSunCol = (config.weekStart === 'sunday' && dIdx === 0) || (config.weekStart === 'monday' && dIdx === 6);
      parts.push(`<text x="${gx + colW * (dIdx + 0.5)}" y="${gy + 4.3}" text-anchor="middle" font-family="${bodyFamily}" font-size="2.5" font-weight="700" fill="${isSunCol ? accent : theme.inkMuted}">${lbl}</text>`);
    });

    const rowCount = Math.max(5, month.weeks.length);
    const rowH = (gh - weekHeadH) / rowCount;
    const numSize = config.templateId === 'advertising' ? 4.3 : 3.9;
    month.weeks.forEach((week, wIdx) => {
      const cy = gy + weekHeadH + rowH * (wIdx + 0.54);
      if (wIdx > 0) {
        parts.push(`<line x1="${gx}" y1="${gy + weekHeadH + rowH * wIdx}" x2="${gx + gw}" y2="${gy + weekHeadH + rowH * wIdx}" stroke="${theme.cardBorder}" stroke-width="0.18" />`);
      }
      week.forEach((cell, dIdx) => {
        if (cell.day === null) return;
        const cx = gx + colW * (dIdx + 0.5);
        if (cell.holiday) {
          const fill = cell.holiday.category === 'religious' ? theme.religiousFill : theme.holidayFill;
          parts.push(`<rect x="${cx - colW * 0.36}" y="${cy - rowH * 0.36}" width="${colW * 0.72}" height="${rowH * 0.72}" rx="1.1" fill="${fill}" />`);
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

    // Rodapé compacto com feriados do mês
    const monthHolidays = data.holidays.filter(h => h.month === month.month);
    const legText = monthHolidays.length
      ? monthHolidays.map(h => `${String(h.day).padStart(2, '0')}/${String(h.month).padStart(2, '0')} ${h.name}`).join('  ·  ')
      : `${advertiser.name.trim() || '678 Estudio'} · ${data.year}`;
    parts.push(`<text x="${layout.footerBox.x}" y="${layout.footerBox.y + 6}" font-family="${bodyFamily}" font-size="2.4" fill="${theme.inkMuted}">${escapeXml(legText)}</text>`);
  }

  if (layout.bleedMm > 0) {
    parts.push(`<rect x="${layout.trimBox.x}" y="${layout.trimBox.y}" width="${layout.trimBox.width}" height="${layout.trimBox.height}" fill="none" stroke="${accent}" stroke-width="0.25" stroke-dasharray="1.8 1.2" opacity="0.6" />`);
  }
  return parts.join('');
}

/** Prévia da folha individual horizontal (200 × 120 mm). */
export function renderDeskPageSvg(
  config: DeskCalendarConfig,
  pageKey: MonthlyPageKey,
  pageImage: PreviewImageSource | null,
  logoImage: PreviewImageSource | null,
): string {
  const layout = computeDeskPageLayout(config, pageKey);
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${layout.pageWidthMm} ${layout.pageHeightMm}" width="100%" height="100%" role="img" aria-label="Prévia folha calendário de mesa">${buildDeskSheetInner(config, pageKey, pageImage, logoImage, true)}</svg>`;
}

/** Prévia do calendário de mesa montado com Wire-O superior e base triangular personalizada. */
export function renderDeskAssembledSvg(
  config: DeskCalendarConfig,
  pageKey: MonthlyPageKey,
  pageImage: PreviewImageSource | null,
  logoImage: PreviewImageSource | null,
): string {
  const layout = computeDeskPageLayout(config, pageKey);
  const base = resolveEffectiveBase(config);
  const primary = base.primaryColor || '#1c1917';
  const accent = base.accentColor || '#b45309';
  const bodyFamily = 'system-ui, -apple-system, "Segoe UI", sans-serif';

  const parts: string[] = [];
  parts.push('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 240 192" width="100%" height="100%" role="img" aria-label="Prévia do calendário de mesa montado">');
  parts.push('<defs><linearGradient id="desk-bg" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stop-color="#f7f3ec"/><stop offset="100%" stop-color="#ebe4d8"/></linearGradient></defs>');
  parts.push('<rect x="0" y="0" width="240" height="192" fill="url(#desk-bg)" />');

  // Sombra da base sobre a mesa + aba traseira do cavalete triangular
  parts.push('<ellipse cx="120" cy="177" rx="104" ry="8" fill="#000000" opacity="0.14" />');
  parts.push(`<polygon points="24,18 216,18 225,171 15,171" fill="${primary}" opacity="0.20" />`);

  // Frente da base triangular (rodapé estrutural visível abaixo das folhas)
  const baseY = 136;
  const baseH = 38;
  parts.push(`<polygon points="20,${baseY} 220,${baseY} 224,${baseY + baseH} 16,${baseY + baseH}" fill="${primary}" />`);
  parts.push(`<rect x="20" y="${baseY}" width="200" height="2.2" fill="${accent}" />`);

  let textX = 26;
  if (base.showLogo && logoImage) {
    const lr = computeContainRect(logoImage.width, logoImage.height, { x: 26, y: baseY + 5, width: 28, height: 28 });
    parts.push(`<rect x="25" y="${baseY + 4}" width="30" height="30" rx="2" fill="#ffffff" opacity="0.96" />`);
    parts.push(`<image href="${escapeXml(logoImage.dataUrl)}" x="${lr.x}" y="${lr.y}" width="${lr.width}" height="${lr.height}" preserveAspectRatio="none" />`);
    textX = 60;
  }

  let ty = baseY + 13;
  if (base.showName && base.name.trim()) {
    parts.push(`<text x="${textX}" y="${ty}" font-family="${bodyFamily}" font-size="5.6" font-weight="700" fill="#ffffff">${escapeXml(base.name.trim())}</text>`);
    ty += 5.5;
  }
  if (base.showSlogan && base.slogan.trim()) {
    parts.push(`<text x="${textX}" y="${ty}" font-family="${bodyFamily}" font-size="3.4" fill="#f5f5f4" opacity="0.9">${escapeXml(base.slogan.trim())}</text>`);
    ty += 5;
  }
  const contacts: string[] = [];
  if (base.showPhone && base.phone.trim()) contacts.push(`Tel: ${base.phone.trim()}`);
  if (base.showWhatsapp && base.whatsapp.trim()) contacts.push(`WhatsApp: ${base.whatsapp.trim()}`);
  if (contacts.length) {
    parts.push(`<text x="${textX}" y="${ty}" font-family="${bodyFamily}" font-size="3.1" fill="#e7e5e4">${escapeXml(contacts.join('  ·  '))}</text>`);
    ty += 4.5;
  }
  if (base.showWebsite && base.website.trim()) {
    parts.push(`<text x="${textX}" y="${ty}" font-family="${bodyFamily}" font-size="3.1" fill="${accent}">${escapeXml(base.website.trim())}</text>`);
  }

  if (base.showQrCode && base.qrText.trim()) {
    parts.push(renderQrSvg(base.qrText, 187, baseY + 5.5, 27, primary));
  }

  // Bloco de folhas + folha ativa
  parts.push('<rect x="20.5" y="19" width="199" height="118" rx="1.5" fill="#d6d3d1" />');
  parts.push(`<svg x="20" y="18" width="200" height="118" viewBox="0 0 ${layout.pageWidthMm} ${layout.pageHeightMm}">${buildDeskSheetInner(config, pageKey, pageImage, logoImage, false)}</svg>`);
  parts.push('<rect x="20" y="18" width="200" height="118" rx="1" fill="none" stroke="#a8a29e" stroke-width="0.4" />');

  // Anéis Wire-O metálicos no topo
  for (let wx = 30; wx <= 210; wx += 12) {
    parts.push(`<rect x="${wx - 1.4}" y="12.5" width="2.8" height="11" rx="1.3" fill="#57534e" stroke="#292524" stroke-width="0.3" />`);
    parts.push(`<rect x="${wx - 0.6}" y="13.2" width="1.0" height="9.4" rx="0.5" fill="#d6d3d1" opacity="0.6" />`);
  }

  parts.push('</svg>');
  return parts.join('');
}
