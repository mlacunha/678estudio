import {
  maxNotebookLogoBytes,
  notebookFormats,
  notebookLogoTypes,
  notebookModels,
  notebookStyles,
  notebookTypographies,
} from '../server/caderno/options.mjs';

type SectionPreview = {
  id: string;
  label: string;
  detail: string;
  src: string;
};

const QUOTE_LABEL = 'Solicitar orçamento pelo WhatsApp';

type NotebookElements = {
  form: HTMLFormElement;
  fields: HTMLFieldSetElement;
  logo: HTMLInputElement;
  removeLogo: HTMLButtonElement;
  watermark: HTMLInputElement;
  customColors: HTMLInputElement;
  colors: HTMLFieldSetElement;
  dedicationBox: HTMLDivElement;
  dedicationInput: HTMLTextAreaElement;
  submit: HTMLButtonElement;
  error: HTMLParagraphElement;
  modelDetail: HTMLParagraphElement;
  styleDetail: HTMLParagraphElement;
  typoDetail: HTMLParagraphElement;
  status: HTMLParagraphElement;
  results: HTMLElement;
  placeholder: HTMLDivElement;
  summary: HTMLParagraphElement;
  gallery: HTMLDivElement;
  quoteButton: HTMLButtonElement;
  quoteStatus: HTMLParagraphElement;
  quoteReference: HTMLAnchorElement;
  dialog: HTMLDialogElement;
  enlarged: HTMLImageElement;
  viewport: HTMLDivElement;
  zoom: HTMLButtonElement;
  title: HTMLHeadingElement;
  prev: HTMLButtonElement;
  next: HTMLButtonElement;
};

function queryElements(): NotebookElements | null {
  const form = document.querySelector<HTMLFormElement>('#notebook-form');
  if (!form) return null;
  return {
    form,
    fields: document.querySelector<HTMLFieldSetElement>('#notebook-fields')!,
    logo: document.querySelector<HTMLInputElement>('#notebook-logo')!,
    removeLogo: document.querySelector<HTMLButtonElement>('#notebook-remove-logo')!,
    watermark: document.querySelector<HTMLInputElement>('#notebook-watermark')!,
    customColors: document.querySelector<HTMLInputElement>('#notebook-custom-colors')!,
    colors: document.querySelector<HTMLFieldSetElement>('#notebook-colors')!,
    dedicationBox: document.querySelector<HTMLDivElement>('#notebook-dedication-container')!,
    dedicationInput: document.querySelector<HTMLTextAreaElement>('#notebook-dedication')!,
    submit: document.querySelector<HTMLButtonElement>('#notebook-submit')!,
    error: document.querySelector<HTMLParagraphElement>('#notebook-error')!,
    modelDetail: document.querySelector<HTMLParagraphElement>('#notebook-model-detail')!,
    styleDetail: document.querySelector<HTMLParagraphElement>('#notebook-style-detail')!,
    typoDetail: document.querySelector<HTMLParagraphElement>('#notebook-typography-detail')!,
    status: document.querySelector<HTMLParagraphElement>('#notebook-status')!,
    results: document.querySelector<HTMLElement>('#notebook-results')!,
    placeholder: document.querySelector<HTMLDivElement>('#notebook-placeholder')!,
    summary: document.querySelector<HTMLParagraphElement>('#notebook-summary')!,
    gallery: document.querySelector<HTMLDivElement>('#notebook-gallery')!,
    quoteButton: document.querySelector<HTMLButtonElement>('#notebook-quote')!,
    quoteStatus: document.querySelector<HTMLParagraphElement>('#notebook-quote-status')!,
    quoteReference: document.querySelector<HTMLAnchorElement>('#notebook-quote-reference')!,
    dialog: document.querySelector<HTMLDialogElement>('#notebook-dialog')!,
    enlarged: document.querySelector<HTMLImageElement>('#notebook-enlarged')!,
    viewport: document.querySelector<HTMLDivElement>('#notebook-image-viewport')!,
    zoom: document.querySelector<HTMLButtonElement>('#notebook-zoom')!,
    title: document.querySelector<HTMLHeadingElement>('#notebook-dialog-title')!,
    prev: document.querySelector<HTMLButtonElement>('#notebook-prev')!,
    next: document.querySelector<HTMLButtonElement>('#notebook-next')!,
  };
}

function saveOptionsToSession(form: HTMLFormElement): void {
  try {
    const data = Object.fromEntries(
      [...new FormData(form)].filter(
        ([key, value]) => key !== 'logo' && key !== 'watermark' && typeof value === 'string',
      ),
    );
    sessionStorage.setItem('678-caderno-opcoes', JSON.stringify(data));
  } catch {
    // Sem sessionStorage
  }
}

function restoreOptionsFromSession(el: NotebookElements): void {
  try {
    const stored = JSON.parse(sessionStorage.getItem('678-caderno-opcoes') ?? '{}');
    for (const [key, value] of Object.entries(stored)) {
      if (typeof value !== 'string') continue;
      const field = el.form.elements.namedItem(key);
      if (field instanceof RadioNodeList) {
        field.value = value;
      } else if (
        field instanceof HTMLSelectElement
        || field instanceof HTMLInputElement
        || field instanceof HTMLTextAreaElement
      ) {
        field.value = value;
      }
    }
    el.customColors.checked = Boolean(stored.primary && stored.secondary);
    const ref = sessionStorage.getItem('678-caderno-referencia');
    if (ref) {
      el.quoteReference.href = ref;
      el.quoteReference.hidden = false;
    }
  } catch {
    // Opções padrão
  }
}

function syncOptionDetails(el: NotebookElements): void {
  const modelKey = (el.form.elements.namedItem('model') as RadioNodeList)?.value as keyof typeof notebookModels;
  const model = notebookModels[modelKey] ?? notebookModels['caderno-receitas'];
  el.modelDetail.textContent = model.detail;

  const isMemorias = modelKey === 'livro-memorias';
  el.dedicationBox.hidden = !isMemorias;
  el.dedicationInput.disabled = !isMemorias;

  const styleKey = (el.form.elements.namedItem('style') as RadioNodeList)?.value as keyof typeof notebookStyles;
  const style = notebookStyles[styleKey] ?? notebookStyles.classic;
  el.styleDetail.textContent = style.detail;

  const typoKey = (el.form.elements.namedItem('typography') as RadioNodeList)?.value as keyof typeof notebookTypographies;
  const typo = notebookTypographies[typoKey] ?? notebookTypographies.modern;
  el.typoDetail.textContent = typo.detail;

  const hasLogo = Boolean(el.logo?.files?.length);
  el.watermark.disabled = !hasLogo;
  if (!hasLogo) el.watermark.checked = false;
  el.removeLogo.hidden = !hasLogo;

  el.colors.disabled = el.colors.hidden = !el.customColors.checked;
  if (!el.customColors.checked) {
    const pInput = el.form.elements.namedItem('primary') as HTMLInputElement | null;
    const sInput = el.form.elements.namedItem('secondary') as HTMLInputElement | null;
    if (pInput) pInput.value = style.primary;
    if (sInput) sInput.value = style.secondary;
  }
}

function createPreviewCard(item: SectionPreview, index: number, onOpen: (i: number) => void): HTMLButtonElement {
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
  button.addEventListener('click', () => onOpen(index));
  return button;
}

function buildSummaryLine(formData: FormData): string {
  const modelKey = formData.get('model') as keyof typeof notebookModels;
  const model = notebookModels[modelKey]?.label ?? 'Caderno Personalizado';
  const style = notebookStyles[formData.get('style') as keyof typeof notebookStyles]?.label ?? 'Clássico';
  const typo = notebookTypographies[formData.get('typography') as keyof typeof notebookTypographies]?.label ?? 'Moderna';
  const format = notebookFormats[formData.get('format') as keyof typeof notebookFormats]?.label ?? 'A5';
  return `${model} · Formato ${format} · Estilo ${style} · Tipografia ${typo}`;
}

export function initNotebookCustomizer(): void {
  const el = queryElements();
  if (!el) return;

  let previews: SectionPreview[] = [];
  let currentIndex = 0;
  let draftToken: string | undefined;
  let savedToken: string | undefined;

  function showError(message: string): void {
    el!.error.hidden = !message;
    el!.error.textContent = message;
  }

  function showModalPage(index: number): void {
    if (index < 0 || index >= previews.length) return;
    currentIndex = index;
    const item = previews[index];
    el!.title.textContent = `${item.label} · Seção ${index + 1}/${previews.length}`;
    el!.enlarged.src = item.src;
    el!.enlarged.alt = `Prévia da seção ${item.label}`;
    el!.prev.disabled = index === 0;
    el!.next.disabled = index === previews.length - 1;
    el!.viewport.scrollTo(0, 0);
  }

  function handleFormChange(): void {
    syncOptionDetails(el!);
    saveOptionsToSession(el!.form);
    showError('');
    if (previews.length) {
      el!.status.textContent = 'Opções alteradas. Gere novas prévias para atualizar.';
      el!.quoteStatus.textContent = 'Atualize as prévias para solicitar um orçamento com estas opções.';
    }
    draftToken = undefined;
    el!.quoteButton.disabled = true;
    el!.quoteButton.textContent = QUOTE_LABEL;
  }

  async function submitQuoteRequest(): Promise<void> {
    if (!draftToken || el!.quoteButton.disabled || el!.fields.disabled) return;
    const token = draftToken;
    saveOptionsToSession(el!.form);
    el!.fields.disabled = true;
    el!.quoteButton.disabled = true;
    el!.quoteButton.textContent = 'Salvando solicitação…';
    el!.quoteStatus.textContent = 'Salvando a configuração e as prévias antes de abrir o WhatsApp.';

    const payloadData = new FormData();
    payloadData.set('draft', token);

    try {
      const response = await fetch('/api/caderno/quote', { method: 'POST', body: payloadData });
      const payload = await response.json();
      if (!response.ok) {
        if (response.status === 410) draftToken = undefined;
        el!.quoteStatus.textContent = payload.error || 'Não foi possível solicitar o orçamento.';
        return;
      }
      savedToken = token;
      el!.quoteReference.href = payload.referencePath;
      el!.quoteReference.hidden = false;
      try {
        sessionStorage.setItem('678-caderno-referencia', payload.referencePath);
      } catch {
        // Sem storage
      }
      if (!payload.whatsappUrl) {
        el!.quoteStatus.textContent = 'Solicitação salva. O WhatsApp está indisponível no momento.';
        return;
      }
      el!.quoteStatus.textContent = 'Solicitação salva. Envie a mensagem no WhatsApp para concluir.';
      window.location.assign(payload.whatsappUrl);
    } catch {
      el!.quoteStatus.textContent = 'Não foi possível confirmar a solicitação. Tente novamente.';
    } finally {
      el!.fields.disabled = false;
      el!.quoteButton.disabled = !draftToken;
      el!.quoteButton.textContent = savedToken === token ? 'Abrir WhatsApp' : QUOTE_LABEL;
    }
  }

  async function handleFormSubmit(event: SubmitEvent): Promise<void> {
    event.preventDefault();
    if (el!.fields.disabled) return;
    showError('');

    const file = el!.logo.files?.[0];
    if (file && (!notebookLogoTypes.has(file.type) || !file.size || file.size > maxNotebookLogoBytes)) {
      showError('Selecione um arquivo PNG ou JPEG de até 2 MB.');
      el!.logo.focus();
      return;
    }

    const formData = new FormData(el!.form);
    if (!file) formData.delete('logo');

    el!.fields.disabled = true;
    el!.quoteButton.disabled = true;
    el!.gallery.setAttribute('aria-busy', 'true');
    el!.status.textContent = 'Gerando páginas do seu caderno…';
    el!.submit.textContent = 'Gerando prévias…';

    try {
      const response = await fetch(el!.form.action, { method: 'POST', body: formData });
      const payload = await response.json();
      if (!response.ok) {
        showError(payload.error || 'Não foi possível gerar as prévias. Tente novamente.');
        el!.status.textContent = previews.length ? 'Mostrando as últimas prévias geradas.' : '';
        return;
      }

      previews = payload.previews ?? [];
      draftToken = payload.draft;
      el!.quoteStatus.textContent =
        'Ao solicitar, salvamos as prévias e abrimos o WhatsApp da equipe 678 Estudio com seu pedido.';
      el!.quoteButton.textContent = QUOTE_LABEL;
      el!.summary.textContent = buildSummaryLine(formData);
      el!.summary.hidden = false;
      el!.placeholder.hidden = true;

      const cards = previews.map((item, idx) =>
        createPreviewCard(item, idx, (i) => {
          showModalPage(i);
          el!.dialog.showModal();
        }),
      );
      el!.gallery.replaceChildren(...cards);
      el!.status.textContent = `${previews.length} seções reais prontas`;
    } catch {
      showError('Não foi possível carregar as prévias. Verifique a conexão e tente novamente.');
    } finally {
      el!.fields.disabled = false;
      el!.quoteButton.disabled = !draftToken;
      el!.gallery.removeAttribute('aria-busy');
      el!.submit.textContent = 'Visualizar meu caderno';
    }
  }

  restoreOptionsFromSession(el);
  syncOptionDetails(el);

  el.form.addEventListener('change', handleFormChange);
  el.form.addEventListener('submit', handleFormSubmit);
  el.quoteButton.addEventListener('click', submitQuoteRequest);
  el.removeLogo.addEventListener('click', () => {
    el.logo.value = '';
    el.logo.dispatchEvent(new Event('change', { bubbles: true }));
    el.logo.focus();
  });
  el.prev.addEventListener('click', () => showModalPage(currentIndex - 1));
  el.next.addEventListener('click', () => showModalPage(currentIndex + 1));
  el.zoom.addEventListener('click', () => {
    const active = el.enlarged.toggleAttribute('data-zoom');
    el.zoom.setAttribute('aria-pressed', String(active));
    el.viewport.scrollTo(0, 0);
  });
}

