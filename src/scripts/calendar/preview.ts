import { buildAnnualCalendarData } from './dateEngine';
import { CALENDAR_TEMPLATES, computeAnnualLayout, computeCoverCropRect } from './templates';
import type { CalendarConfig } from './types';

function escapeXml(value: string): string {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}

export interface PreviewImageSource {
  dataUrl: string;
  width: number;
  height: number;
}

/** Gera a prévia vetorial SVG fiel às proporções físicas e ao enquadramento do PDF final. */
export function renderAnnualCalendarSvg(config: CalendarConfig, image: PreviewImageSource | null): string {
  const data = buildAnnualCalendarData({
    year: config.year,
    weekStart: config.weekStart,
    includeFederalHolidays: config.includeFederalHolidays,
    includeGoodFriday: config.includeGoodFriday,
  });
  const theme = CALENDAR_TEMPLATES[config.templateId];
  const layout = computeAnnualLayout(config);
  const scaleFactor = layout.trimWidthMm >= 290 && config.orientation === 'portrait' ? 1.28 : 1;
  const headingFamily = theme.headingFont === 'serif'
    ? 'Georgia, "Times New Roman", serif'
    : 'system-ui, -apple-system, "Segoe UI", sans-serif';
  const bodyFamily = 'system-ui, -apple-system, "Segoe UI", sans-serif';

  const parts: string[] = [];
  parts.push(
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${layout.pageWidthMm} ${layout.pageHeightMm}" width="100%" height="100%" role="img" aria-label="Prévia do calendário anual ${data.year}">`,
  );
  parts.push('<defs>');
  parts.push(
    `<clipPath id="cal-photo-clip"><rect x="${layout.photoBox.x}" y="${layout.photoBox.y}" width="${layout.photoBox.width}" height="${layout.photoBox.height}" rx="${theme.fullBleedPhoto ? 0 : 2}" /></clipPath>`,
  );
  parts.push('</defs>');

  // Fundo da folha
  parts.push(`<rect x="0" y="0" width="${layout.pageWidthMm}" height="${layout.pageHeightMm}" fill="${theme.pageBg}" />`);

  // Área da foto / arte
  parts.push(
    `<rect x="${layout.photoBox.x}" y="${layout.photoBox.y}" width="${layout.photoBox.width}" height="${layout.photoBox.height}" rx="${theme.fullBleedPhoto ? 0 : 2}" fill="${theme.photoBg}" />`,
  );
  if (image?.dataUrl) {
    const crop = computeCoverCropRect(image.width, image.height, layout.photoBox, config.imagePlacement);
    parts.push(
      `<image href="${escapeXml(image.dataUrl)}" x="${crop.x}" y="${crop.y}" width="${crop.width}" height="${crop.height}" preserveAspectRatio="none" clip-path="url(#cal-photo-clip)" />`,
    );
  } else {
    const cx = layout.photoBox.x + layout.photoBox.width / 2;
    const cy = layout.photoBox.y + layout.photoBox.height / 2;
    parts.push(
      `<text x="${cx}" y="${cy}" text-anchor="middle" dominant-baseline="middle" font-family="${bodyFamily}" font-size="${4.2 * scaleFactor}" fill="${theme.inkMuted}">Envie uma foto ou escolha uma arte na Biblioteca</text>`,
    );
  }

  if (!theme.fullBleedPhoto) {
    parts.push(
      `<rect x="${layout.photoBox.x}" y="${layout.photoBox.y}" width="${layout.photoBox.width}" height="${layout.photoBox.height}" rx="2" fill="none" stroke="${theme.photoBorder}" stroke-width="0.35" />`,
    );
    if (config.templateId === 'editorial') {
      parts.push(
        `<rect x="${layout.photoBox.x + 1.4}" y="${layout.photoBox.y + 1.4}" width="${layout.photoBox.width - 2.8}" height="${layout.photoBox.height - 2.8}" rx="1.2" fill="none" stroke="${theme.photoBorder}" stroke-width="0.2" />`,
      );
    }
  }

  // Cabeçalho
  const yearFontSize = 11.5 * scaleFactor;
  const titleFontSize = 5.4 * scaleFactor;
  const subFontSize = 3.2 * scaleFactor;
  const headerBottomY = layout.headerBox.y + layout.headerBox.height;

  parts.push(
    `<text x="${layout.headerBox.x}" y="${layout.headerBox.y + yearFontSize * 0.85}" font-family="${headingFamily}" font-size="${yearFontSize}" font-weight="700" fill="${theme.ink}">${data.year}</text>`,
  );
  const titleText = config.title.trim() || 'Calendário Anual';
  parts.push(
    `<text x="${layout.headerBox.x + layout.headerBox.width}" y="${layout.headerBox.y + 6.5 * scaleFactor}" text-anchor="end" font-family="${headingFamily}" font-size="${titleFontSize}" font-weight="600" fill="${theme.accent}">${escapeXml(titleText)}</text>`,
  );
  if (config.subtitle.trim()) {
    parts.push(
      `<text x="${layout.headerBox.x + layout.headerBox.width}" y="${layout.headerBox.y + 11.2 * scaleFactor}" text-anchor="end" font-family="${bodyFamily}" font-size="${subFontSize}" fill="${theme.inkMuted}">${escapeXml(config.subtitle.trim())}</text>`,
    );
  }
  parts.push(
    `<line x1="${layout.headerBox.x}" y1="${headerBottomY - 1}" x2="${layout.headerBox.x + layout.headerBox.width}" y2="${headerBottomY - 1}" stroke="${theme.divider}" stroke-width="0.35" />`,
  );

  // Grade dos 12 meses
  const colGap = 3.5;
  const rowGap = 3.5;
  const cellW = (layout.gridBox.width - colGap * (layout.gridCols - 1)) / layout.gridCols;
  const cellH = (layout.gridBox.height - rowGap * (layout.gridRows - 1)) / layout.gridRows;

  data.months.forEach((month, idx) => {
    const col = idx % layout.gridCols;
    const row = Math.floor(idx / layout.gridCols);
    const mx = layout.gridBox.x + col * (cellW + colGap);
    const my = layout.gridBox.y + row * (cellH + rowGap);

    parts.push(
      `<rect x="${mx}" y="${my}" width="${cellW}" height="${cellH}" rx="1.6" fill="${theme.cardBg}" stroke="${theme.cardBorder}" stroke-width="0.25" />`,
    );

    const padX = 2.4;
    const monthTitleY = my + 5.2;
    parts.push(
      `<text x="${mx + padX}" y="${monthTitleY}" font-family="${headingFamily}" font-size="${3.4 * scaleFactor}" font-weight="700" fill="${theme.accent}">${escapeXml(month.name.toUpperCase())}</text>`,
    );

    const innerW = cellW - padX * 2;
    const dayColW = innerW / 7;
    const weekHeaderY = my + 9.2;

    data.weekdayLabels.forEach((lbl, dIdx) => {
      const lx = mx + padX + dayColW * (dIdx + 0.5);
      const isSunCol = (data.weekStart === 'sunday' && dIdx === 0) || (data.weekStart === 'monday' && dIdx === 6);
      parts.push(
        `<text x="${lx}" y="${weekHeaderY}" text-anchor="middle" font-family="${bodyFamily}" font-size="${2.2 * scaleFactor}" font-weight="700" fill="${isSunCol ? theme.accent : theme.inkMuted}">${lbl}</text>`,
      );
    });

    const rowsTop = weekHeaderY + 1.8;
    const rowsAvail = my + cellH - rowsTop - 1.5;
    const rowStep = rowsAvail / 6;

    month.weeks.forEach((week, wIdx) => {
      const cy = rowsTop + rowStep * (wIdx + 0.55);
      week.forEach((cell, dIdx) => {
        if (cell.day === null) return;
        const cx = mx + padX + dayColW * (dIdx + 0.5);

        if (cell.holiday) {
          const isRel = cell.holiday.category === 'religious';
          const fill = isRel ? theme.religiousFill : theme.holidayFill;
          const pillW = Math.min(dayColW * 0.86, rowStep * 0.92);
          const pillH = rowStep * 0.78;
          parts.push(
            `<rect x="${cx - pillW / 2}" y="${cy - pillH / 2 - 0.3}" width="${pillW}" height="${pillH}" rx="1.1" fill="${fill}" />`,
          );
        }

        let inkColor = theme.ink;
        let weight = '400';
        if (cell.holiday) {
          inkColor = cell.holiday.category === 'religious' ? theme.religiousInk : theme.holidayInk;
          weight = '700';
        } else if (cell.isWeekend) {
          inkColor = theme.weekendInk;
        }

        parts.push(
          `<text x="${cx}" y="${cy}" text-anchor="middle" dominant-baseline="middle" font-family="${bodyFamily}" font-size="${2.55 * scaleFactor}" font-weight="${weight}" fill="${inkColor}">${cell.day}</text>`,
        );
      });
    });
  });

  // Rodapé com legenda explícita de feriados
  const footerY = layout.footerBox.y + 4.5;
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
  parts.push(
    `<text x="${layout.footerBox.x}" y="${footerY}" font-family="${bodyFamily}" font-size="${2.05 * scaleFactor}" fill="${theme.inkMuted}">${escapeXml(legendText)}</text>`,
  );

  // Guia visual sutil de corte quando sangria (3 mm) está habilitada
  if (layout.bleedMm > 0) {
    parts.push(
      `<rect x="${layout.trimBox.x}" y="${layout.trimBox.y}" width="${layout.trimBox.width}" height="${layout.trimBox.height}" fill="none" stroke="${theme.accent}" stroke-width="0.25" stroke-dasharray="1.8 1.2" opacity="0.65" />`,
    );
  }

  parts.push('</svg>');
  return parts.join('');
}
