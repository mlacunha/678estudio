import {
  maxPlannerLogoBytes,
  plannerFormats,
  plannerLogoTypes,
  plannerModels,
  plannerModes,
  plannerStyles,
  plannerTypographies,
} from '../server/planner/options.mjs';

type SectionPreview = {
  id: string;
  label: string;
  detail: string;
  src: string;
};

const QUOTE_LABEL = 'Solicitar orçamento pelo WhatsApp';

export function initPlannerCustomizer(): void {
  const form = document.querySelector<HTMLFormElement>('#planner-form')!;
  if (!form) return;

  const fields = document.querySelector<HTMLFieldSetElement>('#planner-fields')!;
  const logo = document.querySelector<HTMLInputElement>('#planner-logo')!;
  const removeLogo = document.querySelector<HTMLButtonElement>('#planner-remove-logo')!;
  const watermark = document.querySelector<HTMLInputElement>('#planner-watermark')!;
  const submit = document.querySelector<HTMLButtonElement>('#planner-submit')!;
  const error = document.querySelector<HTMLParagraphElement>('#planner-error')!;
  const modeDetail = document.querySelector<HTMLParagraphElement>('#planner-mode-detail')!;
  const styleDetail = document.querySelector<HTMLParagraphElement>('#planner-style-detail')!;
  const typoDetail = document.querySelector<HTMLParagraphElement>('#planner-typography-detail')!;
  const yearContainer = document.querySelector<HTMLDivElement>('#planner-year-container')!;
  const yearSelect = document.querySelector<HTMLSelectElement>('#planner-year')!;
  const status = document.querySelector<HTMLParagraphElement>('#planner-status')!;
  const results = document.querySelector<HTMLElement>('#planner-results')!;
  const placeholder = document.querySelector<HTMLDivElement>('#planner-placeholder')!;
  const summary = document.querySelector<HTMLParagraphElement>('#planner-summary')!;
  const gallery = document.querySelector<HTMLDivElement>('#planner-gallery')!;
  const quoteButton = document.querySelector<HTMLButtonElement>('#planner-quote')!;
  const quoteStatus = document.querySelector<HTMLParagraphElement>('#planner-quote-status')!;
  const quoteReference = document.querySelector<HTMLAnchorElement>('#planner-quote-reference')!;
  const dialog = document.querySelector<HTMLDialogElement>('#planner-dialog')!;
  const enlarged = document.querySelector<HTMLImageElement>('#planner-enlarged')!;
  const viewport = document.querySelector<HTMLDivElement>('#planner-image-viewport')!;
  const zoom = document.querySelector<HTMLButtonElement>('#planner-zoom')!;
  const title = document.querySelector<HTMLHeadingElement>('#planner-dialog-title')!;
  const prev = document.querySelector<HTMLButtonElement>('#planner-prev')!;
  const next = document.querySelector<HTMLButtonElement>('#planner-next')!;

  let previews: SectionPreview[] = [];
  let currentIndex = 0;
  let draftToken: string | undefined;
  let savedToken: string | undefined;

  function showReference(path: string): void {
    if (!quoteReference) return;
    quoteReference.href = path;
    quoteReference.hidden = false;
  }

  function saveStoredOptions(): void {
    try {
      const data = Object.fromEntries(
        [...new FormData(form)].filter(
          ([key, value]) => key !== 'logo' && key !== 'watermark' && typeof value === 'string'
        )
      );
      sessionStorage.setItem('678-planner-opcoes', JSON.stringify(data));
    } catch {
      // Navegação sem storage
    }
  }

  function restoreStoredOptions(): void {
    try {
      const stored = JSON.parse(sessionStorage.getItem('678-planner-opcoes') ?? '{}');
      for (const [key, value] of Object.entries(stored)) {
        if (typeof value !== 'string') continue;
        const field = form.elements.namedItem(key);
        if (field instanceof RadioNodeList) {
          field.value = value;
        } else if (field instanceof HTMLSelectElement || field instanceof HTMLInputElement) {
          field.value = value;
        }
      }
      const ref = sessionStorage.getItem('678-planner-referencia');
      if (ref) showReference(ref);
    } catch {
      // Opções padrão
    }
  }

  function refreshOptions(): void {
    const modeValue = (form.elements.namedItem('mode') as RadioNodeList)?.value as keyof typeof plannerModes;
    const mode = plannerModes[modeValue] ?? plannerModes.dated;
    if (modeDetail) modeDetail.textContent = mode.detail;

    const isUndated = modeValue === 'undated';
    if (yearContainer) yearContainer.hidden = isUndated;
    if (yearSelect) yearSelect.disabled = isUndated;

    const styleValue = (form.elements.namedItem('style') as RadioNodeList)?.value as keyof typeof plannerStyles;
    const style = plannerStyles[styleValue] ?? plannerStyles.classic;
    if (styleDetail) styleDetail.textContent = style.detail;

    const typoValue = (form.elements.namedItem('typography') as RadioNodeList)?.value as keyof typeof plannerTypographies;
    const typo = plannerTypographies[typoValue] ?? plannerTypographies.modern;
    if (typoDetail) typoDetail.textContent = typo.detail;

    const hasLogo = Boolean(logo?.files?.length);
    if (watermark) {
      watermark.disabled = !hasLogo;
      if (!hasLogo) watermark.checked = false;
    }
    if (removeLogo) removeLogo.hidden = !hasLogo;
  }

  function showModalPage(index: number): void {
    if (index < 0 || index >= previews.length) return;
    currentIndex = index;
    const item = previews[index];
    if (title) title.textContent = `${item.label} · Seção ${index + 1}/${previews.length}`;
    enlarged.src = item.src;
    enlarged.alt = `Prévia da seção ${item.label} do Planner Essencial`;
    if (prev) prev.disabled = index === 0;
    if (next) next.disabled = index === previews.length - 1;
    viewport?.scrollTo(0, 0);
  }

  function showError(message: string): void {
    if (!error) return;
    error.hidden = !message;
    error.textContent = message;
  }

  function createPreviewCard(item: SectionPreview, index: number): HTMLButtonElement {
    const button = document.createElement('button');
    button.type = 'button';
    button.className =
      'group min-w-0 rounded-xl border border-line bg-surface-muted p-2 text-left transition hover:border-accent hover:shadow-md';
    button.setAttribute('aria-label', `Ampliar ${item.label}`);

    const img = new Image();
    img.src = item.src;
    img.alt = `Prévia da seção ${item.label}`;
    img.className = 'block aspect-[148/210] w-full rounded bg-white object-contain shadow-inner';

    const caption = document.createElement('span');
    caption.className = 'mt-2 block px-1 text-xs font-semibold text-ink group-hover:text-accent';
    caption.textContent = item.label;

    const detailText = document.createElement('span');
    detailText.className = 'block px-1 text-[11px] text-ink-muted';
    detailText.textContent = item.detail;

    button.append(img, caption, detailText);
    button.addEventListener('click', () => {
      showModalPage(index);
      dialog.showModal();
    });
    return button;
  }

  function handleFormChange(): void {
    refreshOptions();
    saveStoredOptions();
    showError('');
    if (previews.length && status && quoteStatus) {
      status.textContent = 'Opções alteradas. Gere novas prévias para atualizar.';
      quoteStatus.textContent = 'Atualize as prévias para solicitar um orçamento com estas opções.';
    }
    draftToken = undefined;
    quoteButton.disabled = true;
    quoteButton.textContent = QUOTE_LABEL;
  }

  async function handleQuoteClick(): Promise<void> {
    if (!draftToken || quoteButton.disabled || fields.disabled) return;
    const token = draftToken;
    saveStoredOptions();
    fields.disabled = true;
    quoteButton.disabled = true;
    quoteButton.textContent = 'Salvando solicitação…';
    if (quoteStatus) quoteStatus.textContent = 'Salvando a configuração e as prévias antes de abrir o WhatsApp.';

    let popup: Window | null = null;
    try {
      popup = window.open('', '_blank');
      if (popup) {
        popup.opener = null;
        popup.document.title = 'Preparando seu orçamento | 678 Estudio';
        if (popup.document.body) popup.document.body.textContent = 'Salvando sua solicitação de orçamento…';
      }
    } catch {
      // Bloqueador de popups ativo
    }

    const payloadData = new FormData();
    payloadData.set('draft', token);
    const abort = new AbortController();
    const timer = window.setTimeout(() => abort.abort(), 15_000);

    try {
      const response = await fetch('/api/planner/quote', { method: 'POST', body: payloadData, signal: abort.signal });
      const payload = await response.json();
      if (!response.ok) {
        if (response.status === 410) draftToken = undefined;
        if (quoteStatus) quoteStatus.textContent = payload.error || 'Não foi possível solicitar o orçamento.';
        popup?.close();
        return;
      }
      savedToken = token;
      showReference(payload.referencePath);
      try {
        sessionStorage.setItem('678-planner-referencia', payload.referencePath);
      } catch {
        // Sem storage
      }
      if (!payload.whatsappUrl) {
        if (quoteStatus) quoteStatus.textContent = 'Solicitação salva. O WhatsApp está indisponível no momento.';
        popup?.close();
        return;
      }
      if (quoteStatus) quoteStatus.textContent = 'Solicitação salva. Envie a mensagem no WhatsApp para concluir.';
      if (popup && !popup.closed) {
        try {
          popup.location.replace(payload.whatsappUrl);
          return;
        } catch {
          popup.close();
        }
      }
      window.location.assign(payload.whatsappUrl);
    } catch {
      popup?.close();
      if (quoteStatus) quoteStatus.textContent = 'Não foi possível confirmar a solicitação. Tente novamente.';
    } finally {
      window.clearTimeout(timer);
      fields.disabled = false;
      quoteButton.disabled = !draftToken;
      quoteButton.textContent = savedToken === token ? 'Abrir WhatsApp' : QUOTE_LABEL;
    }
  }

  async function handleFormSubmit(event: SubmitEvent): Promise<void> {
    event.preventDefault();
    if (fields.disabled) return;
    showError('');

    const file = logo?.files?.[0];
    if (file && (!plannerLogoTypes.includes(file.type) || !file.size || file.size > maxPlannerLogoBytes)) {
      showError('Selecione um arquivo PNG ou JPEG de até 2 MB.');
      logo?.focus();
      return;
    }

    const formData = new FormData(form);
    if (!file) formData.delete('logo');

    fields.disabled = true;
    quoteButton.disabled = true;
    gallery.setAttribute('aria-busy', 'true');
    if (status) status.textContent = 'Gerando páginas do seu planner…';
    submit.textContent = 'Gerando prévias…';

    const abort = new AbortController();
    const timer = window.setTimeout(() => abort.abort(), 90_000);

    try {
      const response = await fetch(form.action, { method: 'POST', body: formData, signal: abort.signal });
      const payload = await response.json();
      if (!response.ok) {
        showError(payload.error || 'Não foi possível gerar as prévias. Tente novamente.');
        if (status) status.textContent = previews.length ? 'Mostrando as últimas prévias geradas.' : '';
        return;
      }

      previews = payload.previews ?? [];
      draftToken = payload.draft;
      if (quoteStatus) {
        quoteStatus.textContent =
          'Ao solicitar, salvamos as prévias e abrimos o WhatsApp da equipe 678 Estudio com seu pedido.';
      }
      quoteButton.textContent = QUOTE_LABEL;

      const model = plannerModels[formData.get('model') as keyof typeof plannerModels]?.label ?? 'Planner Essencial';
      const mode = plannerModes[formData.get('mode') as keyof typeof plannerModes]?.label ?? 'Datado';
      const year = formData.get('mode') === 'dated' ? ` ${formData.get('year')}` : '';
      const style = plannerStyles[formData.get('style') as keyof typeof plannerStyles]?.label ?? 'Clássico';
      const typo = plannerTypographies[formData.get('typography') as keyof typeof plannerTypographies]?.label ?? 'Moderna';
      const format = plannerFormats[formData.get('format') as keyof typeof plannerFormats]?.label ?? 'A5';

      if (summary) {
        summary.textContent = `${model} · ${mode}${year} · Formato ${format} · Estilo ${style} · Tipografia ${typo}`;
        summary.hidden = false;
      }
      if (placeholder) placeholder.hidden = true;

      gallery.replaceChildren(...previews.map((item, index) => createPreviewCard(item, index)));
      if (status) status.textContent = `${previews.length} seções reais prontas`;

      if (!window.matchMedia('(min-width: 1024px)').matches && results) {
        results.scrollIntoView({ block: 'start' });
      }
    } catch {
      showError('Não foi possível carregar as prévias. Verifique a conexão e tente novamente.');
      if (status) status.textContent = previews.length ? 'Mostrando as últimas prévias geradas.' : '';
    } finally {
      window.clearTimeout(timer);
      fields.disabled = false;
      quoteButton.disabled = !draftToken;
      gallery.removeAttribute('aria-busy');
      submit.textContent = 'Visualizar meu planner';
    }
  }

  // Setup event listeners
  restoreStoredOptions();
  refreshOptions();

  form.addEventListener('change', handleFormChange);
  form.addEventListener('submit', handleFormSubmit);
  quoteButton.addEventListener('click', handleQuoteClick);

  removeLogo?.addEventListener('click', () => {
    if (!logo) return;
    logo.value = '';
    logo.dispatchEvent(new Event('change', { bubbles: true }));
    logo.focus();
  });

  prev?.addEventListener('click', () => showModalPage(currentIndex - 1));
  next?.addEventListener('click', () => showModalPage(currentIndex + 1));

  zoom?.addEventListener('click', () => {
    const active = enlarged.toggleAttribute('data-zoom');
    zoom.setAttribute('aria-pressed', String(active));
    viewport?.scrollTo(0, 0);
  });

  dialog.addEventListener('close', () => {
    enlarged.removeAttribute('data-zoom');
    zoom?.setAttribute('aria-pressed', 'false');
  });

  dialog.addEventListener('keydown', (event) => {
    if (event.target === viewport && enlarged.hasAttribute('data-zoom')) return;
    if (event.key === 'ArrowLeft') showModalPage(currentIndex - 1);
    if (event.key === 'ArrowRight') showModalPage(currentIndex + 1);
  });
}

