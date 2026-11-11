import { agendaFormats, agendaLayouts, agendaLogoTypes, agendaStyles, maxAgendaLogoBytes } from '../server/agenda/options.mjs';

type Preview = { page: number; pdfPage: number; section: string; src: string };

export function initAgendaCustomizer() {
  const form = document.querySelector<HTMLFormElement>('#agenda-form')!;
  const fields = document.querySelector<HTMLFieldSetElement>('#agenda-fields')!;
  const logo = document.querySelector<HTMLInputElement>('#agenda-logo')!;
  const removeLogo = document.querySelector<HTMLButtonElement>('#agenda-remove-logo')!;
  const watermark = document.querySelector<HTMLInputElement>('#agenda-watermark')!;
  const customColors = document.querySelector<HTMLInputElement>('#agenda-custom-colors')!;
  const colors = document.querySelector<HTMLFieldSetElement>('#agenda-colors')!;
  const submit = document.querySelector<HTMLButtonElement>('#agenda-submit')!;
  const error = document.querySelector<HTMLParagraphElement>('#agenda-error')!;
  const styleDetail = document.querySelector<HTMLParagraphElement>('#agenda-style-detail')!;
  const status = document.querySelector<HTMLParagraphElement>('#agenda-status')!;
  const results = document.querySelector<HTMLElement>('#agenda-results')!;
  const placeholder = document.querySelector<HTMLDivElement>('#agenda-placeholder')!;
  const summary = document.querySelector<HTMLParagraphElement>('#agenda-summary')!;
  const gallery = document.querySelector<HTMLDivElement>('#agenda-gallery')!;
  const quoteButton = document.querySelector<HTMLButtonElement>('#agenda-quote')!;
  const quoteStatus = document.querySelector<HTMLParagraphElement>('#agenda-quote-status')!;
  const quoteReference = document.querySelector<HTMLAnchorElement>('#agenda-quote-reference')!;
  const dialog = document.querySelector<HTMLDialogElement>('#agenda-dialog')!;
  const enlarged = document.querySelector<HTMLImageElement>('#agenda-enlarged')!;
  const viewport = document.querySelector<HTMLDivElement>('#agenda-image-viewport')!;
  const zoom = document.querySelector<HTMLButtonElement>('#agenda-zoom')!;
  const title = document.querySelector<HTMLHeadingElement>('#agenda-dialog-title')!;
  const prev = document.querySelector<HTMLButtonElement>('#agenda-prev')!;
  const next = document.querySelector<HTMLButtonElement>('#agenda-next')!;
  let images: Preview[] = [];
  let current = 0;
  let draft: string | undefined;
  let savedDraft: string | undefined;
  const quoteLabel = 'Solicitar orçamento pelo WhatsApp';

  function showReference(path: string) {
    if (!/^\/agenda\/orcamento\/[0-9a-f-]{36}$/.test(path)) return;
    quoteReference.href = path;
    quoteReference.hidden = false;
  }

  function saveOptions() {
    try {
      const options = Object.fromEntries([...new FormData(form)].filter(([key, value]) => key !== 'logo' && key !== 'watermark' && typeof value === 'string'));
      sessionStorage.setItem('678-agenda-opcoes', JSON.stringify(options));
    } catch { /* O formulário funciona sem armazenamento do navegador. */ }
  }

  try {
    const options = JSON.parse(sessionStorage.getItem('678-agenda-opcoes') ?? '{}');
    for (const name of ['year', 'format', 'layout', 'style', 'primary', 'secondary']) {
      const field = form.elements.namedItem(name);
      const value = options[name];
      if (!field || typeof value !== 'string') continue;
      if (field instanceof RadioNodeList) {
        if ([...field].some(input => input instanceof HTMLInputElement && input.value === value)) field.value = value;
      } else if (field instanceof HTMLSelectElement) {
        if ([...field.options].some(option => option.value === value)) field.value = value;
      } else if (field instanceof HTMLInputElement && /^#[0-9a-f]{6}$/i.test(value)) field.value = value;
    }
    customColors.checked = Boolean(options.primary && options.secondary);
    const reference = sessionStorage.getItem('678-agenda-referencia');
    if (reference) showReference(reference);
  } catch { /* Opções padrão quando a sessão não pode ser recuperada. */ }

  function refreshOptions() {
    const style = agendaStyles[(form.elements.namedItem('style') as RadioNodeList).value as keyof typeof agendaStyles];
    styleDetail.textContent = style.detail;
    watermark.disabled = !logo.files?.length;
    removeLogo.hidden = watermark.disabled;
    if (watermark.disabled) watermark.checked = false;
    colors.disabled = colors.hidden = !customColors.checked;
    if (!customColors.checked) {
      (form.elements.namedItem('primary') as HTMLInputElement).value = style.primary;
      (form.elements.namedItem('secondary') as HTMLInputElement).value = style.secondary;
    }
  }

  function showPage(index: number) {
    if (index < 0 || index >= images.length) return;
    current = index;
    const { pdfPage, section, src } = images[index];
    title.textContent = `${section} · Página ${pdfPage} · ${index + 1}/${images.length}`;
    enlarged.src = src;
    enlarged.alt = `Prévia ampliada da página ${pdfPage} da agenda`;
    prev.disabled = index === 0;
    next.disabled = index === images.length - 1;
    viewport.scrollTo(0, 0);
  }

  function showError(message: string) {
    error.hidden = !message;
    error.textContent = message;
  }

  refreshOptions();
  form.addEventListener('change', () => {
    refreshOptions();
    saveOptions();
    showError('');
    if (images.length) {
      status.textContent = 'Opções alteradas. Gere novas prévias para atualizar.';
      quoteStatus.textContent = 'Atualize as prévias para solicitar um orçamento com estas opções.';
    }
    draft = undefined;
    quoteButton.disabled = true;
    quoteButton.textContent = quoteLabel;
  });
  removeLogo.addEventListener('click', () => {
    logo.value = '';
    logo.dispatchEvent(new Event('change', { bubbles: true }));
    logo.focus();
  });
  prev.addEventListener('click', () => showPage(current - 1));
  next.addEventListener('click', () => showPage(current + 1));
  zoom.addEventListener('click', () => {
    const active = enlarged.toggleAttribute('data-zoom');
    zoom.setAttribute('aria-pressed', String(active));
    viewport.scrollTo(0, 0);
  });
  dialog.addEventListener('close', () => {
    enlarged.removeAttribute('data-zoom');
    zoom.setAttribute('aria-pressed', 'false');
  });
  dialog.addEventListener('keydown', event => {
    if (event.target === viewport && enlarged.hasAttribute('data-zoom')) return;
    if (event.key === 'ArrowLeft') showPage(current - 1);
    if (event.key === 'ArrowRight') showPage(current + 1);
  });

  quoteButton.addEventListener('click', async () => {
    if (!draft || quoteButton.disabled || fields.disabled) return;
    const token = draft;
    saveOptions();
    fields.disabled = true;
    quoteButton.disabled = true;
    quoteButton.textContent = 'Salvando solicitação…';
    quoteStatus.textContent = 'Salvando a configuração e as prévias antes de abrir o WhatsApp.';
    // Reserva a aba no clique para manter o personalizador aberto durante o envio.
    let popup: Window | null = null;
    try {
      popup = window.open('', '_blank');
      if (popup) {
        popup.opener = null;
        popup.document.title = 'Preparando seu orçamento | 678 Estudio';
        if (popup.document.body) popup.document.body.textContent = 'Salvando sua solicitação de orçamento…';
      }
    } catch { /* Se a aba estiver indisponível, usamos a navegação atual. */ }
    const data = new FormData();
    data.set('draft', token);
    const abort = new AbortController();
    const timer = window.setTimeout(() => abort.abort(), 15_000);
    try {
      const response = await fetch('/api/agenda/quote', { method: 'POST', body: data, signal: abort.signal });
      const payload = await response.json();
      if (!response.ok) {
        if (response.status === 410) draft = undefined;
        quoteStatus.textContent = payload.error || 'Não foi possível solicitar o orçamento. Tente novamente.';
        popup?.close();
        return;
      }
      savedDraft = token;
      showReference(payload.referencePath);
      try { sessionStorage.setItem('678-agenda-referencia', payload.referencePath); } catch { /* Referência visível na página. */ }
      if (!payload.whatsappUrl) {
        quoteStatus.textContent = 'Solicitação salva. O WhatsApp está indisponível no momento. Guarde sua referência.';
        popup?.close();
        return;
      }
      quoteStatus.textContent = 'Solicitação salva. Envie a mensagem no WhatsApp para concluir o contato.';
      if (popup && !popup.closed) {
        try {
          popup.location.replace(payload.whatsappUrl);
          return;
        } catch { popup.close(); }
      }
      window.location.assign(payload.whatsappUrl);
    } catch {
      popup?.close();
      quoteStatus.textContent = 'Não foi possível confirmar a solicitação. Tente novamente pelo mesmo botão.';
    } finally {
      window.clearTimeout(timer);
      fields.disabled = false;
      quoteButton.disabled = !draft;
      quoteButton.textContent = savedDraft === token ? 'Abrir WhatsApp' : quoteLabel;
    }
  });

  form.addEventListener('submit', async event => {
    event.preventDefault();
    if (fields.disabled) return;
    showError('');
    const file = logo.files?.[0];
    if (file && (!agendaLogoTypes.includes(file.type) || !file.size || file.size > maxAgendaLogoBytes)) {
      showError('Selecione um arquivo PNG ou JPEG de até 2 MB.');
      logo.focus();
      return;
    }
    const data = new FormData(form);
    if (!file) data.delete('logo');
    fields.disabled = true;
    quoteButton.disabled = true;
    gallery.setAttribute('aria-busy', 'true');
    status.textContent = 'Gerando páginas da sua agenda…';
    submit.textContent = 'Gerando prévias…';
    const abort = new AbortController();
    const timer = window.setTimeout(() => abort.abort(), 90_000);
    try {
      const response = await fetch(form.action, { method: 'POST', body: data, signal: abort.signal });
      const payload = await response.json();
      if (!response.ok) {
        showError(payload.error || 'Não foi possível gerar as prévias. Tente novamente.');
        status.textContent = images.length ? 'Mostrando as últimas prévias geradas.' : '';
        return;
      }
      images = payload.images;
      draft = payload.draft;
      quoteStatus.textContent = 'Ao solicitar, salvamos as prévias e abrimos o WhatsApp. Quem tiver o link da referência poderá ver as prévias.';
      quoteButton.textContent = quoteLabel;
      const layout = agendaLayouts[data.get('layout') as keyof typeof agendaLayouts];
      const style = agendaStyles[data.get('style') as keyof typeof agendaStyles];
      const format = agendaFormats[data.get('format') as keyof typeof agendaFormats];
      summary.textContent = `${data.get('year')} · ${layout.label} · ${format.label} · ${style.label}`;
      summary.hidden = false;
      placeholder.hidden = true;
      gallery.replaceChildren(...images.map(({ pdfPage, section, src }, index) => {
        const button = document.createElement('button');
        button.type = 'button';
        button.className = 'min-w-0 rounded-xl border border-line bg-surface-muted p-2 text-left hover:border-accent';
        button.setAttribute('aria-label', `Ampliar ${section}, página ${pdfPage}`);
        const image = new Image();
        image.src = src;
        image.alt = `Prévia da página ${pdfPage} da agenda`;
        image.className = 'block aspect-[148/210] w-full bg-white object-contain';
        const label = document.createElement('span');
        label.textContent = `${section} · Página ${pdfPage} · Ampliar`;
        label.className = 'mt-2 block px-1 text-xs font-medium text-ink-secondary';
        button.append(image, label);
        button.addEventListener('click', () => { showPage(index); dialog.showModal(); });
        return button;
      }));
      status.textContent = `${images.length} páginas prontas`;
      if (!window.matchMedia('(min-width: 1024px)').matches) results.scrollIntoView({ block: 'start' });
    } catch {
      showError('Não foi possível carregar as prévias. Verifique a conexão e tente novamente.');
      status.textContent = images.length ? 'Mostrando as últimas prévias geradas.' : '';
    } finally {
      window.clearTimeout(timer);
      fields.disabled = false;
      quoteButton.disabled = !draft;
      gallery.removeAttribute('aria-busy');
      submit.textContent = 'Visualizar minha agenda';
    }
  });
}
