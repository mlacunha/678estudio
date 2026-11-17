import { connectArtLibraryPicker } from '../utils/artLibraryClient';
import { WHATSAPP_UNAVAILABLE } from '../utils/whatsapp';
import { CALENDAR_MONTH_NAMES } from './calendar/dateEngine';
import { renderDeskAssembledSvg, renderDeskPageSvg } from './calendar/deskPreview';
import {
  computeDeskPageLayout,
  DEFAULT_DESK_BASE_FOLD_MM,
  DEFAULT_DESK_BASE_FRONT_HEIGHT_MM,
  DEFAULT_DESK_SHEET_HEIGHT_MM,
  DEFAULT_DESK_SHEET_WIDTH_MM,
  DEFAULT_DESK_WIREO_MARGIN_MM,
} from './calendar/deskTemplates';
import { renderMonthlyCalendarSvg } from './calendar/monthlyPreview';
import { computeMonthlyPageLayout, DEFAULT_WIREO_MARGIN_MM } from './calendar/monthlyTemplates';
import { renderAnnualCalendarSvg, type PreviewImageSource } from './calendar/preview';
import { computeAnnualLayout } from './calendar/templates';
import type {
  CalendarConfig,
  CalendarFormat,
  CalendarModality,
  CalendarOrientation,
  CalendarTemplateId,
  DeskCalendarConfig,
  MonthlyCalendarConfig,
  MonthlyPageKey,
  MonthlyTemplateId,
  WeekStart,
} from './calendar/types';

interface LoadedCalendarImage extends PreviewImageSource {
  label: string;
  blob: Blob;
  libraryCode?: string;
}

async function blobToDataUrl(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result || ''));
    reader.onerror = () => reject(new Error('Falha ao ler a imagem.'));
    reader.readAsDataURL(blob);
  });
}

async function loadImageDimensions(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error('Não foi possível carregar a imagem selecionada.'));
    img.src = src;
  });
}

async function loadCalendarImageFromBlob(blob: Blob, label: string, libraryCode?: string): Promise<LoadedCalendarImage> {
  const dataUrl = await blobToDataUrl(blob);
  const imgEl = await loadImageDimensions(dataUrl);
  return { dataUrl, width: imgEl.naturalWidth, height: imgEl.naturalHeight, label, blob, libraryCode };
}

function getOrderedMonthlyPages(includeCover: boolean): MonthlyPageKey[] {
  return includeCover ? ['cover', 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12] : [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12];
}

function buildMonthlyPageLabel(pageKey: MonthlyPageKey): string {
  return pageKey === 'cover' ? 'Capa' : `${pageKey}. ${CALENDAR_MONTH_NAMES[pageKey - 1]}`;
}

export function initCalendarCustomizer(): void {
  const root = document.querySelector<HTMLElement>('[data-calendar-root]');
  if (!root) return;

  const previewStage = document.getElementById('calendar-preview-stage');
  const badgePaper = document.getElementById('calendar-badge-paper');
  const statusEl = document.getElementById('calendar-status');
  const fileLabelEl = document.getElementById('calendar-art-filename');
  const uploadInput = document.getElementById('input-calendar-art') as HTMLInputElement | null;
  const btnClearArt = document.getElementById('btn-clear-calendar-art');
  const btnQuote = document.getElementById('btn-calendar-quote') as HTMLButtonElement | null;
  const quoteResultBox = document.getElementById('calendar-quote-result');
  const quoteRefLink = document.getElementById('calendar-quote-ref') as HTMLAnchorElement | null;
  const whatsappLink = document.getElementById('btn-calendar-whatsapp') as HTMLAnchorElement | null;

  const modalityTabs = document.querySelectorAll<HTMLButtonElement>('[data-cal-modality]');
  const monthlyNav = document.getElementById('cal-monthly-nav');
  const monthlyPageSel = document.getElementById('cal-monthly-page') as HTMLSelectElement | null;
  const btnPrevPage = document.getElementById('btn-cal-prev-page');
  const btnNextPage = document.getElementById('btn-cal-next-page');
  const monthlyScopeBox = document.getElementById('cal-monthly-image-scope');
  const annualTplWrap = document.getElementById('cal-annual-tpl-wrap');
  const monthlyTplWrap = document.getElementById('cal-monthly-tpl-wrap');
  const annualPaperRow = document.getElementById('cal-annual-paper-row');
  const monthlyOptionsBox = document.getElementById('cal-monthly-options');
  const annualTitlesRow = document.getElementById('cal-annual-titles-row');
  const advertiserPanel = document.getElementById('cal-advertiser-panel');
  const deskViewBar = document.getElementById('cal-desk-view-bar');
  const deskViewBtns = document.querySelectorAll<HTMLButtonElement>('[data-desk-view]');
  const deskBasePanel = document.getElementById('cal-desk-base-panel');
  const monthlyFormatNote = document.getElementById('cal-monthly-format-note');
  const baseSyncCheck = document.getElementById('cal-base-sync') as HTMLInputElement | null;
  const baseCustomFields = document.getElementById('cal-base-custom-fields');

  let deskPreviewMode: 'assembled' | 'sheet' = 'assembled';

  const yearInput = document.getElementById('cal-year') as HTMLSelectElement | null;
  const formatSelect = document.getElementById('cal-format') as HTMLSelectElement | null;
  const orientationSelect = document.getElementById('cal-orientation') as HTMLSelectElement | null;
  const weekStartSelect = document.getElementById('cal-week-start') as HTMLSelectElement | null;
  const templateSelect = document.getElementById('cal-template') as HTMLSelectElement | null;
  const monthlyTemplateSelect = document.getElementById('cal-monthly-template') as HTMLSelectElement | null;
  const titleInput = document.getElementById('cal-title') as HTMLInputElement | null;
  const subtitleInput = document.getElementById('cal-subtitle') as HTMLInputElement | null;
  const includeCoverCheck = document.getElementById('cal-include-cover') as HTMLInputElement | null;
  const wireOMarginInput = document.getElementById('cal-wireo-margin') as HTMLInputElement | null;
  const federalCheck = document.getElementById('cal-federal-holidays') as HTMLInputElement | null;
  const goodFridayCheck = document.getElementById('cal-good-friday') as HTMLInputElement | null;
  const bleedCheck = document.getElementById('cal-bleed') as HTMLInputElement | null;
  const scaleRange = document.getElementById('cal-img-scale') as HTMLInputElement | null;
  const anchorXRange = document.getElementById('cal-img-x') as HTMLInputElement | null;
  const anchorYRange = document.getElementById('cal-img-y') as HTMLInputElement | null;

  const advLogoInput = document.getElementById('cal-adv-logo') as HTMLInputElement | null;
  const advLogoName = document.getElementById('cal-adv-logo-name');
  const btnClearLogo = document.getElementById('btn-clear-adv-logo');
  const advNameIn = document.getElementById('cal-adv-name') as HTMLInputElement | null;
  const advSloganIn = document.getElementById('cal-adv-slogan') as HTMLInputElement | null;
  const advPhoneIn = document.getElementById('cal-adv-phone') as HTMLInputElement | null;
  const advWhatsappIn = document.getElementById('cal-adv-whatsapp') as HTMLInputElement | null;
  const advWebsiteIn = document.getElementById('cal-adv-website') as HTMLInputElement | null;
  const advAddressIn = document.getElementById('cal-adv-address') as HTMLInputElement | null;
  const advQrIn = document.getElementById('cal-adv-qr') as HTMLInputElement | null;
  const advColor1In = document.getElementById('cal-adv-color1') as HTMLInputElement | null;
  const advColor2In = document.getElementById('cal-adv-color2') as HTMLInputElement | null;

  let activeModality: CalendarModality = 'annual';
  let activeMonthlyPage: MonthlyPageKey = 'cover';

  const annualConfig: CalendarConfig = {
    modality: 'annual',
    year: 2027,
    format: 'A4',
    orientation: 'portrait',
    weekStart: 'sunday',
    templateId: 'minimalist',
    title: 'Calendário Anual',
    subtitle: '678 Estudio · Papelaria Personalizada',
    includeFederalHolidays: true,
    includeGoodFriday: false,
    includeBleed: false,
    imagePlacement: { scale: 1, anchorX: 0.5, anchorY: 0.5 },
  };

  const monthlyConfig: MonthlyCalendarConfig = {
    year: 2027,
    format: 'A4',
    orientation: 'portrait',
    weekStart: 'sunday',
    templateId: 'photographic',
    includeCover: true,
    includeFederalHolidays: true,
    includeGoodFriday: false,
    includeBleed: false,
    wireOMarginMm: DEFAULT_WIREO_MARGIN_MM,
    advertiser: {
      name: '',
      slogan: '',
      phone: '',
      whatsapp: '',
      website: '',
      address: '',
      qrText: '',
      primaryColor: '#1c1917',
      accentColor: '#b45309',
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
  };

  const deskConfig: DeskCalendarConfig = {
    year: 2027,
    sheetWidthMm: DEFAULT_DESK_SHEET_WIDTH_MM,
    sheetHeightMm: DEFAULT_DESK_SHEET_HEIGHT_MM,
    weekStart: 'sunday',
    templateId: 'photographic',
    includeCover: true,
    includeFederalHolidays: true,
    includeGoodFriday: false,
    includeBleed: false,
    wireOMarginMm: DEFAULT_DESK_WIREO_MARGIN_MM,
    advertiser: monthlyConfig.advertiser,
    base: {
      syncWithAdvertiser: true,
      primaryColor: '#1c1917',
      accentColor: '#b45309',
      name: '',
      slogan: '',
      phone: '',
      whatsapp: '',
      website: '',
      qrText: '',
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
    sharedPlacement: monthlyConfig.sharedPlacement,
  };

  let annualImage: LoadedCalendarImage | null = null;
  let sharedMonthlyImage: LoadedCalendarImage | null = null;
  const monthlyPageImages: Partial<Record<MonthlyPageKey, LoadedCalendarImage | null>> = {};
  let logoImage: LoadedCalendarImage | null = null;
  let loadSeq = 0;

  const stepTabs = document.querySelectorAll<HTMLButtonElement>('[data-cal-step-tab]');
  const stepPanels = document.querySelectorAll<HTMLElement>('[data-cal-step-panel]');
  const goStepBtns = document.querySelectorAll<HTMLButtonElement>('[data-cal-go-step]');
  const reviewSummaryEl = document.getElementById('cal-review-summary');

  const setActiveStep = (stepId: string) => {
    for (const tab of stepTabs) {
      const active = tab.dataset.calStepTab === stepId;
      tab.setAttribute('aria-selected', active ? 'true' : 'false');
      tab.classList.toggle('bg-action', active);
      tab.classList.toggle('text-on-action', active);
      tab.classList.toggle('shadow-sm', active);
      tab.classList.toggle('text-ink-secondary', !active);
    }
    for (const panel of stepPanels) {
      panel.hidden = panel.dataset.calStepPanel !== stepId;
    }
  };

  for (const tab of stepTabs) {
    tab.addEventListener('click', () => {
      if (tab.dataset.calStepTab) setActiveStep(tab.dataset.calStepTab);
    });
  }
  for (const btn of goStepBtns) {
    btn.addEventListener('click', () => {
      if (btn.dataset.calGoStep) setActiveStep(btn.dataset.calGoStep);
    });
  }

  const renderReviewSummary = () => {
    if (!reviewSummaryEl) return;
    let items: Array<[string, string]>;
    if (activeModality === 'desk') {
      items = [
        ['Modalidade', `Mesa Wire-O (${deskConfig.includeCover ? '13 págs. com capa' : '12 págs.'})`],
        ['Ano', String(deskConfig.year)],
        ['Formato', `${deskConfig.sheetWidthMm}×${deskConfig.sheetHeightMm} mm Paisagem · Wire-O ${deskConfig.wireOMarginMm} mm`],
        ['Modelo visual', deskConfig.templateId],
        ['Semana / Feriados', `${deskConfig.weekStart === 'monday' ? 'Segunda' : 'Domingo'} · Federais: ${deskConfig.includeFederalHolidays ? 'Sim' : 'Não'}${deskConfig.includeGoodFriday ? ' + Sexta-feira Santa' : ''}`],
        ['Base triangular', deskConfig.base.syncWithAdvertiser ? 'Mesma identidade da empresa' : (deskConfig.base.name || 'Personalizada à parte')],
        ['Anunciante', deskConfig.advertiser.name || 'Não informado'],
        ['Acabamento', deskConfig.includeBleed ? 'Sangria de 3 mm' : 'Padrão sem sangria'],
      ];
    } else if (activeModality === 'monthly') {
      items = [
        ['Modalidade', `Mensal Parede Wire-O (${monthlyConfig.includeCover ? '13 págs. com capa' : '12 págs.'})`],
        ['Ano', String(monthlyConfig.year)],
        ['Formato', `A4 Retrato · Wire-O ${monthlyConfig.wireOMarginMm} mm`],
        ['Modelo visual', monthlyConfig.templateId],
        ['Semana / Feriados', `${monthlyConfig.weekStart === 'monday' ? 'Segunda' : 'Domingo'} · Federais: ${monthlyConfig.includeFederalHolidays ? 'Sim' : 'Não'}${monthlyConfig.includeGoodFriday ? ' + Sexta-feira Santa' : ''}`],
        ['Acabamento', monthlyConfig.includeBleed ? 'Sangria de 3 mm' : 'Padrão sem sangria'],
        ['Anunciante', monthlyConfig.advertiser.name || 'Não informado'],
        ['Logomarca / QR', `${logoImage ? logoImage.label : 'Sem logo'} · QR: ${monthlyConfig.advertiser.qrText ? 'Configurado' : 'Não'}`],
      ];
    } else {
      items = [
        ['Modalidade', 'Anual (1 página)'],
        ['Ano', String(annualConfig.year)],
        ['Formato', `${annualConfig.format} ${annualConfig.orientation === 'landscape' ? 'Paisagem' : 'Retrato'}`],
        ['Modelo visual', annualConfig.templateId],
        ['Semana / Feriados', `${annualConfig.weekStart === 'monday' ? 'Segunda' : 'Domingo'} · Federais: ${annualConfig.includeFederalHolidays ? 'Sim' : 'Não'}${annualConfig.includeGoodFriday ? ' + Sexta-feira Santa' : ''}`],
        ['Acabamento', annualConfig.includeBleed ? 'Sangria de 3 mm' : 'Padrão sem sangria'],
        ['Imagem', annualImage ? annualImage.label : 'Somente grade'],
      ];
    }
    reviewSummaryEl.innerHTML = items
      .map(([k, v]) => `<div class="rounded-xl border border-line bg-canvas p-2.5"><dt class="text-ink-muted">${k}</dt><dd class="font-semibold text-ink mt-0.5 truncate">${v}</dd></div>`)
      .join('');
  };

  const getCurrentMonthlyImage = () => monthlyPageImages[activeMonthlyPage] ?? sharedMonthlyImage;
  const getImageScope = () => (document.querySelector<HTMLInputElement>('input[name="cal-img-scope"]:checked')?.value === 'page' ? 'page' : 'all');

  const invalidateQuote = () => {
    if (quoteResultBox) quoteResultBox.hidden = true;
  };

  const syncMonthlyPageOptions = () => {
    if (!monthlyPageSel) return;
    const coverOn = activeModality === 'desk' ? deskConfig.includeCover : monthlyConfig.includeCover;
    const pages = getOrderedMonthlyPages(coverOn);
    if (!pages.includes(activeMonthlyPage)) activeMonthlyPage = pages[0];
    monthlyPageSel.innerHTML = '';
    for (const p of pages) monthlyPageSel.add(new Option(buildMonthlyPageLabel(p), String(p)));
    monthlyPageSel.value = String(activeMonthlyPage);
  };

  const syncPlacementDisabled = () => {
    const hasImg = activeModality === 'annual' ? Boolean(annualImage) : Boolean(getCurrentMonthlyImage());
    if (scaleRange) scaleRange.disabled = !hasImg;
    if (anchorXRange) anchorXRange.disabled = !hasImg;
    if (anchorYRange) anchorYRange.disabled = !hasImg;
  };

  const syncModalityUi = () => {
    const isAnnual = activeModality === 'annual';
    const isDesk = activeModality === 'desk';
    for (const tab of modalityTabs) {
      const active = tab.dataset.calModality === activeModality;
      tab.setAttribute('aria-selected', active ? 'true' : 'false');
      tab.classList.toggle('bg-action', active);
      tab.classList.toggle('text-on-action', active);
      tab.classList.toggle('text-ink-secondary', !active);
    }
    if (monthlyNav) monthlyNav.hidden = isAnnual;
    if (deskViewBar) deskViewBar.hidden = !isDesk;
    if (monthlyScopeBox) monthlyScopeBox.hidden = isAnnual;
    if (annualTplWrap) annualTplWrap.hidden = !isAnnual;
    if (monthlyTplWrap) monthlyTplWrap.hidden = isAnnual;
    if (annualPaperRow) annualPaperRow.hidden = !isAnnual;
    if (monthlyOptionsBox) monthlyOptionsBox.hidden = isAnnual;
    if (annualTitlesRow) annualTitlesRow.hidden = !isAnnual;
    if (advertiserPanel) advertiserPanel.hidden = isAnnual;
    if (deskBasePanel) deskBasePanel.hidden = !isDesk;
    if (monthlyFormatNote) {
      monthlyFormatNote.textContent = isDesk
        ? 'Formato horizontal 200 × 120 mm com Wire-O superior e base triangular personalizável.'
        : 'Formato A4 Retrato (210 × 297 mm) com reserva superior configurável para perfuração Wire-O.';
    }
    if (wireOMarginInput) {
      wireOMarginInput.value = String(isDesk ? deskConfig.wireOMarginMm : monthlyConfig.wireOMarginMm);
    }
    if (includeCoverCheck) {
      includeCoverCheck.checked = isDesk ? deskConfig.includeCover : monthlyConfig.includeCover;
    }
    syncMonthlyPageOptions();
    syncPlacementDisabled();
    invalidateQuote();
  };

  const render = () => {
    if (activeModality === 'desk') {
      if (deskPreviewMode === 'assembled') {
        if (previewStage) {
          previewStage.style.aspectRatio = '240 / 192';
          previewStage.innerHTML = renderDeskAssembledSvg(deskConfig, activeMonthlyPage, getCurrentMonthlyImage(), logoImage);
        }
        if (badgePaper) {
          badgePaper.textContent = `Mesa Montada (200×120 mm) · ${buildMonthlyPageLabel(activeMonthlyPage)} · ${deskConfig.year}`;
        }
      } else {
        const layout = computeDeskPageLayout(deskConfig, activeMonthlyPage);
        if (previewStage) {
          previewStage.style.aspectRatio = `${layout.pageWidthMm} / ${layout.pageHeightMm}`;
          previewStage.innerHTML = renderDeskPageSvg(deskConfig, activeMonthlyPage, getCurrentMonthlyImage(), logoImage);
        }
        if (badgePaper) {
          badgePaper.textContent = `Folha Mesa ${deskConfig.sheetWidthMm}×${deskConfig.sheetHeightMm} mm · ${buildMonthlyPageLabel(activeMonthlyPage)} · ${deskConfig.year}`;
        }
      }
    } else if (activeModality === 'monthly') {
      const layout = computeMonthlyPageLayout(monthlyConfig, activeMonthlyPage);
      if (previewStage) {
        previewStage.style.aspectRatio = `${layout.pageWidthMm} / ${layout.pageHeightMm}`;
        previewStage.innerHTML = renderMonthlyCalendarSvg(monthlyConfig, activeMonthlyPage, getCurrentMonthlyImage(), logoImage);
      }
      if (badgePaper) {
        badgePaper.textContent = `A4 Retrato · Wire-O · ${buildMonthlyPageLabel(activeMonthlyPage)} · ${monthlyConfig.year}`;
      }
    } else {
      const layout = computeAnnualLayout(annualConfig);
      if (previewStage) {
        previewStage.style.aspectRatio = `${layout.pageWidthMm} / ${layout.pageHeightMm}`;
        previewStage.innerHTML = renderAnnualCalendarSvg(annualConfig, annualImage);
      }
      if (badgePaper) {
        const ori = annualConfig.orientation === 'landscape' ? 'Paisagem' : 'Retrato';
        badgePaper.textContent = `${annualConfig.format} ${ori} · ${annualConfig.year}${annualConfig.includeBleed ? ' · Sangria 3 mm' : ''}`;
      }
    }
    renderReviewSummary();
  };

  const applyLoadedImage = (next: LoadedCalendarImage) => {
    if (activeModality !== 'annual') {
      if (getImageScope() === 'page') monthlyPageImages[activeMonthlyPage] = next;
      else sharedMonthlyImage = next;
    } else {
      annualImage = next;
    }
    if (fileLabelEl) fileLabelEl.textContent = next.label;
    syncPlacementDisabled();
    invalidateQuote();
    render();
  };

  for (const tab of modalityTabs) {
    tab.addEventListener('click', () => {
      const m = tab.dataset.calModality;
      activeModality = m === 'desk' ? 'desk' : m === 'monthly' ? 'monthly' : 'annual';
      syncModalityUi();
      render();
    });
  }

  for (const btn of deskViewBtns) {
    btn.addEventListener('click', () => {
      deskPreviewMode = btn.dataset.deskView === 'sheet' ? 'sheet' : 'assembled';
      for (const b of deskViewBtns) {
        const active = b === btn;
        b.classList.toggle('bg-action', active);
        b.classList.toggle('text-on-action', active);
        b.classList.toggle('text-ink-secondary', !active);
      }
      render();
    });
  }

  monthlyPageSel?.addEventListener('change', () => {
    const val = monthlyPageSel.value;
    activeMonthlyPage = val === 'cover' ? 'cover' : (Number(val) as MonthlyPageKey);
    syncPlacementDisabled();
    render();
  });

  const stepPage = (delta: number) => {
    const coverOn = activeModality === 'desk' ? deskConfig.includeCover : monthlyConfig.includeCover;
    const pages = getOrderedMonthlyPages(coverOn);
    const idx = pages.indexOf(activeMonthlyPage);
    activeMonthlyPage = pages[(idx + delta + pages.length) % pages.length];
    if (monthlyPageSel) monthlyPageSel.value = String(activeMonthlyPage);
    syncPlacementDisabled();
    render();
  };
  btnPrevPage?.addEventListener('click', () => stepPage(-1));
  btnNextPage?.addEventListener('click', () => stepPage(1));

  yearInput?.addEventListener('change', () => {
    const y = Number(yearInput.value) || 2027;
    annualConfig.year = y;
    monthlyConfig.year = y;
    deskConfig.year = y;
    invalidateQuote();
    render();
  });
  formatSelect?.addEventListener('change', () => { annualConfig.format = formatSelect.value as CalendarFormat; invalidateQuote(); render(); });
  orientationSelect?.addEventListener('change', () => { annualConfig.orientation = orientationSelect.value as CalendarOrientation; invalidateQuote(); render(); });
  weekStartSelect?.addEventListener('change', () => {
    const ws = weekStartSelect.value as WeekStart;
    annualConfig.weekStart = ws;
    monthlyConfig.weekStart = ws;
    deskConfig.weekStart = ws;
    invalidateQuote();
    render();
  });
  templateSelect?.addEventListener('change', () => { annualConfig.templateId = templateSelect.value as CalendarTemplateId; invalidateQuote(); render(); });
  monthlyTemplateSelect?.addEventListener('change', () => {
    const tid = monthlyTemplateSelect.value as MonthlyTemplateId;
    monthlyConfig.templateId = tid;
    deskConfig.templateId = tid;
    invalidateQuote();
    render();
  });
  titleInput?.addEventListener('input', () => { annualConfig.title = titleInput.value; invalidateQuote(); render(); });
  subtitleInput?.addEventListener('input', () => { annualConfig.subtitle = subtitleInput.value; invalidateQuote(); render(); });
  includeCoverCheck?.addEventListener('change', () => {
    if (activeModality === 'desk') deskConfig.includeCover = includeCoverCheck.checked;
    else monthlyConfig.includeCover = includeCoverCheck.checked;
    syncModalityUi();
    render();
  });
  wireOMarginInput?.addEventListener('input', () => {
    const v = Number(wireOMarginInput.value);
    if (activeModality === 'desk') deskConfig.wireOMarginMm = v || DEFAULT_DESK_WIREO_MARGIN_MM;
    else monthlyConfig.wireOMarginMm = v || DEFAULT_WIREO_MARGIN_MM;
    invalidateQuote();
    render();
  });
  federalCheck?.addEventListener('change', () => {
    annualConfig.includeFederalHolidays = federalCheck.checked;
    monthlyConfig.includeFederalHolidays = federalCheck.checked;
    deskConfig.includeFederalHolidays = federalCheck.checked;
    invalidateQuote();
    render();
  });
  goodFridayCheck?.addEventListener('change', () => {
    annualConfig.includeGoodFriday = goodFridayCheck.checked;
    monthlyConfig.includeGoodFriday = goodFridayCheck.checked;
    deskConfig.includeGoodFriday = goodFridayCheck.checked;
    invalidateQuote();
    render();
  });
  bleedCheck?.addEventListener('change', () => {
    annualConfig.includeBleed = bleedCheck.checked;
    monthlyConfig.includeBleed = bleedCheck.checked;
    deskConfig.includeBleed = bleedCheck.checked;
    invalidateQuote();
    render();
  });

  scaleRange?.addEventListener('input', () => { const v = Number(scaleRange.value) / 100; annualConfig.imagePlacement.scale = v; monthlyConfig.sharedPlacement.scale = v; invalidateQuote(); render(); });
  anchorXRange?.addEventListener('input', () => { const v = Number(anchorXRange.value) / 100; annualConfig.imagePlacement.anchorX = v; monthlyConfig.sharedPlacement.anchorX = v; invalidateQuote(); render(); });
  anchorYRange?.addEventListener('input', () => { const v = Number(anchorYRange.value) / 100; annualConfig.imagePlacement.anchorY = v; monthlyConfig.sharedPlacement.anchorY = v; invalidateQuote(); render(); });

  const bindAdvText = (el: HTMLInputElement | null, key: 'name' | 'slogan' | 'phone' | 'whatsapp' | 'website' | 'address' | 'qrText' | 'primaryColor' | 'accentColor') => {
    el?.addEventListener('input', () => {
      monthlyConfig.advertiser[key] = el.value;
      invalidateQuote();
      render();
    });
  };
  bindAdvText(advNameIn, 'name');
  bindAdvText(advSloganIn, 'slogan');
  bindAdvText(advPhoneIn, 'phone');
  bindAdvText(advWhatsappIn, 'whatsapp');
  bindAdvText(advWebsiteIn, 'website');
  bindAdvText(advAddressIn, 'address');
  bindAdvText(advQrIn, 'qrText');
  bindAdvText(advColor1In, 'primaryColor');
  bindAdvText(advColor2In, 'accentColor');

  const visMap: Array<[string, keyof MonthlyCalendarConfig['advertiser']['visibility']]> = [
    ['vis-logo', 'showLogo'], ['vis-name', 'showName'], ['vis-slogan', 'showSlogan'],
    ['vis-phone', 'showPhone'], ['vis-whatsapp', 'showWhatsapp'], ['vis-website', 'showWebsite'],
    ['vis-address', 'showAddress'], ['vis-qr', 'showQrCode'],
  ];
  for (const [id, key] of visMap) {
    const chk = document.getElementById(id) as HTMLInputElement | null;
    chk?.addEventListener('change', () => { monthlyConfig.advertiser.visibility[key] = chk.checked; invalidateQuote(); render(); });
  }

  baseSyncCheck?.addEventListener('change', () => {
    deskConfig.base.syncWithAdvertiser = baseSyncCheck.checked;
    if (baseCustomFields) baseCustomFields.hidden = baseSyncCheck.checked;
    invalidateQuote();
    render();
  });

  const baseTextBindings: Array<[string, 'name' | 'slogan' | 'phone' | 'whatsapp' | 'website' | 'qrText' | 'primaryColor' | 'accentColor']> = [
    ['cal-base-name', 'name'], ['cal-base-slogan', 'slogan'], ['cal-base-phone', 'phone'],
    ['cal-base-whatsapp', 'whatsapp'], ['cal-base-website', 'website'], ['cal-base-qr', 'qrText'],
    ['cal-base-color1', 'primaryColor'], ['cal-base-color2', 'accentColor'],
  ];
  for (const [id, key] of baseTextBindings) {
    const el = document.getElementById(id) as HTMLInputElement | null;
    el?.addEventListener('input', () => { deskConfig.base[key] = el.value; invalidateQuote(); render(); });
  }

  const baseVisBindings: Array<[string, 'showLogo' | 'showName' | 'showSlogan' | 'showPhone' | 'showWhatsapp' | 'showWebsite' | 'showQrCode']> = [
    ['base-vis-logo', 'showLogo'], ['base-vis-name', 'showName'], ['base-vis-slogan', 'showSlogan'],
    ['base-vis-phone', 'showPhone'], ['base-vis-whatsapp', 'showWhatsapp'], ['base-vis-website', 'showWebsite'],
    ['base-vis-qr', 'showQrCode'],
  ];
  for (const [id, key] of baseVisBindings) {
    const chk = document.getElementById(id) as HTMLInputElement | null;
    chk?.addEventListener('change', () => { deskConfig.base[key] = chk.checked; invalidateQuote(); render(); });
  }

  advLogoInput?.addEventListener('change', async () => {
    const file = advLogoInput.files?.[0];
    if (!file) return;
    try {
      logoImage = await loadCalendarImageFromBlob(file, file.name);
      if (advLogoName) advLogoName.textContent = file.name;
      invalidateQuote();
      render();
    } catch (err) {
      if (statusEl) statusEl.textContent = err instanceof Error ? err.message : 'Erro ao carregar logomarca.';
    }
  });

  btnClearLogo?.addEventListener('click', () => {
    logoImage = null;
    if (advLogoInput) advLogoInput.value = '';
    if (advLogoName) advLogoName.textContent = 'Nenhuma logomarca';
    invalidateQuote();
    render();
  });

  uploadInput?.addEventListener('change', async () => {
    const file = uploadInput.files?.[0];
    if (!file) return;
    const seq = ++loadSeq;
    if (fileLabelEl) fileLabelEl.textContent = `Carregando ${file.name}…`;
    try {
      const next = await loadCalendarImageFromBlob(file, file.name);
      if (seq !== loadSeq) return;
      applyLoadedImage(next);
      if (statusEl) statusEl.textContent = 'Imagem aplicada na prévia comercial.';
    } catch (err) {
      if (statusEl) statusEl.textContent = err instanceof Error ? err.message : 'Erro ao carregar imagem.';
    }
  });

  btnClearArt?.addEventListener('click', () => {
    if (activeModality !== 'annual') {
      if (getImageScope() === 'page') delete monthlyPageImages[activeMonthlyPage];
      else sharedMonthlyImage = null;
    } else {
      annualImage = null;
    }
    if (uploadInput) uploadInput.value = '';
    if (fileLabelEl) fileLabelEl.textContent = 'Nenhuma imagem selecionada';
    syncPlacementDisabled();
    invalidateQuote();
    render();
  });

  connectArtLibraryPicker(document.querySelector<HTMLElement>('[data-art-picker-root]'), {
    onSelect: async art => {
      const seq = ++loadSeq;
      if (fileLabelEl) fileLabelEl.textContent = `Carregando ${art.code}…`;
      try {
        const res = await fetch(art.previewUrl);
        if (!res.ok) throw new Error('Falha ao baixar imagem da Biblioteca.');
        const blob = await res.blob();
        const next = await loadCalendarImageFromBlob(blob, `${art.code} · ${art.title}`, art.code);
        if (seq !== loadSeq) return;
        applyLoadedImage(next);
        if (statusEl) statusEl.textContent = 'Arte da Biblioteca aplicada com sucesso.';
      } catch (err) {
        if (statusEl) statusEl.textContent = err instanceof Error ? err.message : 'Erro ao carregar arte.';
      }
    },
  });

  btnQuote?.addEventListener('click', async () => {
    btnQuote.disabled = true;
    if (statusEl) statusEl.textContent = 'Registrando solicitação de orçamento…';
    try {
      const form = new FormData();
      const libraryArtCodes: Record<string, string> = {};
      if (activeModality === 'monthly' || activeModality === 'desk') {
        const activeCfg = activeModality === 'desk' ? deskConfig : monthlyConfig;
        if (sharedMonthlyImage?.libraryCode) libraryArtCodes.all = sharedMonthlyImage.libraryCode;
        for (const key of getOrderedMonthlyPages(activeCfg.includeCover)) {
          const img = monthlyPageImages[key];
          if (img?.blob) form.append(`image-${key}`, img.blob, `image-${key}.png`);
          if (img?.libraryCode) libraryArtCodes[String(key)] = img.libraryCode;
        }
        if (sharedMonthlyImage?.blob) form.append('image-all', sharedMonthlyImage.blob, 'image-all.png');
        if (logoImage?.blob) form.append('logo', logoImage.blob, 'logo.png');
        form.append('config', JSON.stringify({
          modality: activeModality,
          year: activeCfg.year,
          templateId: activeCfg.templateId,
          format: 'A4',
          orientation: activeModality === 'desk' ? 'landscape' : 'portrait',
          weekStart: activeCfg.weekStart,
          includeFederalHolidays: activeCfg.includeFederalHolidays,
          includeGoodFriday: activeCfg.includeGoodFriday,
          includeBleed: activeCfg.includeBleed,
          wireOMarginMm: activeCfg.wireOMarginMm,
          includeCover: activeCfg.includeCover,
          imagePlacement: activeCfg.sharedPlacement,
          imageScope: getImageScope(),
          libraryArtCodes,
          advertiser: activeCfg.advertiser,
          ...(activeModality === 'desk' ? {
            sheetWidthMm: deskConfig.sheetWidthMm,
            sheetHeightMm: deskConfig.sheetHeightMm,
            base: deskConfig.base,
          } : {}),
        }));
      } else {
        if (annualImage?.libraryCode) libraryArtCodes.all = annualImage.libraryCode;
        if (annualImage?.blob) form.append('image-all', annualImage.blob, 'image-all.png');
        form.append('config', JSON.stringify({
          modality: 'annual',
          year: annualConfig.year,
          templateId: annualConfig.templateId,
          format: annualConfig.format,
          orientation: annualConfig.orientation,
          weekStart: annualConfig.weekStart,
          includeFederalHolidays: annualConfig.includeFederalHolidays,
          includeGoodFriday: annualConfig.includeGoodFriday,
          includeBleed: annualConfig.includeBleed,
          title: annualConfig.title,
          subtitle: annualConfig.subtitle,
          imagePlacement: annualConfig.imagePlacement,
          libraryArtCodes,
        }));
      }

      const res = await fetch('/api/calendario/quote', { method: 'POST', body: form });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'Falha ao registrar solicitação.');

      if (quoteRefLink) {
        quoteRefLink.href = json.referencePath;
        quoteRefLink.textContent = `${window.location.origin}${json.referencePath}`;
      }
      if (whatsappLink) {
        if (json.whatsappUrl) {
          whatsappLink.href = json.whatsappUrl;
          whatsappLink.removeAttribute('aria-disabled');
        } else {
          whatsappLink.removeAttribute('href');
          whatsappLink.setAttribute('aria-disabled', 'true');
        }
      }
      if (quoteResultBox) quoteResultBox.hidden = false;
      if (statusEl) statusEl.textContent = json.whatsappUrl ? 'Solicitação registrada! Clique em Enviar pedido pelo WhatsApp.' : `Solicitação registrada. ${WHATSAPP_UNAVAILABLE}`;
    } catch (err) {
      if (statusEl) statusEl.textContent = err instanceof Error ? err.message : 'Erro ao solicitar orçamento.';
    } finally {
      btnQuote.disabled = false;
    }
  });

  whatsappLink?.addEventListener('click', (e) => {
    if (whatsappLink.getAttribute('aria-disabled') === 'true') {
      e.preventDefault();
      if (statusEl) statusEl.textContent = WHATSAPP_UNAVAILABLE;
    }
  });

  setActiveStep('choose');
  syncModalityUi();
  render();
}
