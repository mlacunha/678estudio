// Shared client logic for cover preview & customizer tab switching

export function setupCoverCustomizer(options: {
  formId: string;
  coverPreviewId: string;
  mockupPreviewId?: string;
}) {
  const form = document.getElementById(options.formId) as HTMLFormElement | null;
  if (!form) return;

  const paletteSelect = document.getElementById('cover-palette-select') as HTMLSelectElement | null;
  const primaryInput = form.querySelector('input[name="cover_color_primary"]') as HTMLInputElement | null;
  const accentInput = form.querySelector('input[name="cover_color_accent"]') as HTMLInputElement | null;
  const photoInput = document.getElementById('cover-photo-input') as HTMLInputElement | null;
  const coverPreviewImg = document.getElementById(options.coverPreviewId) as HTMLImageElement | null;
  const coverPlaceholder = document.getElementById('cover-preview-placeholder') as HTMLDivElement | null;
  const coverStatus = document.getElementById('cover-preview-status') as HTMLParagraphElement | null;
  const coverError = document.getElementById('cover-preview-error') as HTMLParagraphElement | null;
  const sideFrontBtn = document.getElementById('cover-side-front') as HTMLButtonElement | null;
  const sideBackBtn = document.getElementById('cover-side-back') as HTMLButtonElement | null;

  let currentTarget: 'front-a5' | 'back-a5' = 'front-a5';
  let currentObjectUrl: string | null = null;
  let activeController: AbortController | null = null;
  let debounceTimer: ReturnType<typeof setTimeout> | null = null;

  function showError(message: string) {
    if (!coverError) return;
    coverError.textContent = message;
    coverError.hidden = !message;
  }

  function setLoading(loading: boolean) {
    if (coverStatus) {
      coverStatus.textContent = loading
        ? 'Gerando prévia da capa…'
        : 'Prévia em escala real com margem de segurança e refile A5.';
    }
    if (coverPreviewImg && loading && !currentObjectUrl && coverPlaceholder) {
      coverPlaceholder.hidden = false;
    }
  }

  function updatePaletteColors() {
    if (!paletteSelect || !primaryInput || !accentInput) return;
    const selected = paletteSelect.selectedOptions[0];
    if (selected) {
      if (selected.dataset.primary) primaryInput.value = selected.dataset.primary;
      if (selected.dataset.accent) accentInput.value = selected.dataset.accent;
    }
  }

  function updateSideButtons() {
    if (!sideFrontBtn || !sideBackBtn) return;
    const isFront = currentTarget === 'front-a5';
    sideFrontBtn.classList.toggle('border-accent', isFront);
    sideFrontBtn.classList.toggle('text-accent', isFront);
    sideFrontBtn.classList.toggle('font-semibold', isFront);
    sideFrontBtn.classList.toggle('border-control', !isFront);
    sideFrontBtn.classList.toggle('text-ink-muted', !isFront);

    sideBackBtn.classList.toggle('border-accent', !isFront);
    sideBackBtn.classList.toggle('text-accent', !isFront);
    sideBackBtn.classList.toggle('font-semibold', !isFront);
    sideBackBtn.classList.toggle('border-control', isFront);
    sideBackBtn.classList.toggle('text-ink-muted', isFront);
  }

  sideFrontBtn?.addEventListener('click', () => {
    currentTarget = 'front-a5';
    updateSideButtons();
    triggerPreviewRefresh(0);
  });

  sideBackBtn?.addEventListener('click', () => {
    currentTarget = 'back-a5';
    updateSideButtons();
    triggerPreviewRefresh(0);
  });

  paletteSelect?.addEventListener('change', () => {
    updatePaletteColors();
    triggerPreviewRefresh();
  });

  function triggerPreviewRefresh(delayMs = 300) {
    if (debounceTimer) clearTimeout(debounceTimer);
    debounceTimer = setTimeout(fetchCoverPreview, delayMs);
  }

  async function readApiError(res: Response): Promise<string> {
    try {
      const contentType = res.headers.get('content-type') || '';
      if (contentType.includes('application/json')) {
        const data = await res.json();
        if (data?.error && typeof data.error === 'string') return data.error;
      }
      const text = await res.text();
      if (text && text.length < 200) return text;
    } catch {
      // Fallback abaixo
    }
    return `Não foi possível gerar a prévia da capa (HTTP ${res.status}).`;
  }

  async function fetchCoverPreview() {
    if (!coverPreviewImg) return;

    activeController?.abort();
    const controller = new AbortController();
    activeController = controller;

    const style = (form?.querySelector('input[name="cover_style"]:checked') as HTMLInputElement)?.value || 'classic';
    const typography = (form?.querySelector('select[name="cover_typography"]') as HTMLSelectElement)?.value || 'editorial';
    const title = (form?.querySelector('input[name="cover_title"]') as HTMLInputElement)?.value || '678 Estudio';
    const name = (form?.querySelector('input[name="cover_name"]') as HTMLInputElement)?.value || '';
    const subtitle = (form?.querySelector('input[name="cover_subtitle"]') as HTMLInputElement)?.value || '';
    const primary = primaryInput?.value || '#1e293b';
    const accent = accentInput?.value || '#c5a059';
    const selectedPalette = paletteSelect?.selectedOptions[0];
    const secondary = selectedPalette?.dataset.secondary || '#f8fafc';
    const text = selectedPalette?.dataset.text || '#ffffff';

    const formData = new FormData();
    formData.append('target', currentTarget);
    formData.append('style', style);
    formData.append('typography', typography);
    formData.append('title', title);
    formData.append('name', name);
    formData.append('subtitle', subtitle);
    formData.append('color_primary', primary);
    formData.append('color_secondary', secondary);
    formData.append('color_text', text);
    formData.append('color_accent', accent);

    if (photoInput?.files && photoInput.files[0]) {
      formData.append('photo', photoInput.files[0]);
    }

    setLoading(true);
    showError('');

    try {
      const res = await fetch('/api/cover/preview', {
        method: 'POST',
        body: formData,
        signal: controller.signal,
      });

      if (!res.ok) {
        const message = await readApiError(res);
        showError(message);
        if (coverStatus) {
          coverStatus.textContent = currentObjectUrl
            ? 'Falha ao atualizar a prévia. Mantendo a última imagem válida.'
            : 'Falha ao gerar a prévia da capa.';
        }
        return;
      }

      const blob = await res.blob();
      if (!blob.size || !blob.type.startsWith('image/')) {
        showError('O servidor retornou uma resposta inválida para a prévia da capa.');
        return;
      }

      const nextUrl = URL.createObjectURL(blob);
      const previousUrl = currentObjectUrl;
      currentObjectUrl = nextUrl;

      coverPreviewImg.src = nextUrl;
      coverPreviewImg.hidden = false;
      if (coverPlaceholder) coverPlaceholder.hidden = true;
      if (previousUrl) URL.revokeObjectURL(previousUrl);
      setLoading(false);
    } catch (err: any) {
      if (err?.name === 'AbortError') return;
      showError('Erro de conexão ao gerar a prévia da capa. Tente novamente.');
      if (coverStatus) {
        coverStatus.textContent = currentObjectUrl
          ? 'Sem conexão com o servidor. Mantendo a última prévia válida.'
          : 'Não foi possível carregar a prévia da capa.';
      }
    }
  }

  form.querySelectorAll('input[name^="cover_"], select[name^="cover_"]').forEach(el => {
    el.addEventListener('input', () => triggerPreviewRefresh());
    el.addEventListener('change', () => triggerPreviewRefresh(50));
  });

  photoInput?.addEventListener('change', () => triggerPreviewRefresh(0));

  triggerPreviewRefresh(0);
}

/** Wires the two-tab form navigation (Cover vs Inner) and preview toggle. */
export function setupCustomizerTabs(options: {
  formId: string;
  placeholderId: string;
  galleryId: string;
}) {
  const form = document.getElementById(options.formId);
  const tabBtnCover = document.getElementById('tab-btn-cover');
  const tabBtnInner = document.getElementById('tab-btn-inner');
  const tabPaneCover = document.getElementById('tab-pane-cover');
  const tabPaneInner = document.getElementById('tab-pane-inner');
  const toggleViewCover = document.getElementById('toggle-view-cover');
  const toggleViewInner = document.getElementById('toggle-view-inner');
  const coverContainer = document.getElementById('cover-preview-container');
  const innerPlaceholder = document.getElementById(options.placeholderId);
  const innerGallery = document.getElementById(options.galleryId);

  function showTab(tab: 'cover' | 'inner') {
    const isCover = tab === 'cover';
    tabPaneCover?.toggleAttribute('hidden', !isCover);
    tabPaneInner?.toggleAttribute('hidden', isCover);
    tabBtnCover?.classList.toggle('bg-surface', isCover);
    tabBtnCover?.classList.toggle('text-accent', isCover);
    tabBtnCover?.classList.toggle('shadow-sm', isCover);
    tabBtnCover?.classList.toggle('text-ink-muted', !isCover);
    tabBtnInner?.classList.toggle('bg-surface', !isCover);
    tabBtnInner?.classList.toggle('text-accent', !isCover);
    tabBtnInner?.classList.toggle('shadow-sm', !isCover);
    tabBtnInner?.classList.toggle('text-ink-muted', isCover);
  }

  function showPreview(view: 'cover' | 'inner') {
    const isCover = view === 'cover';
    coverContainer?.toggleAttribute('hidden', !isCover);
    if (isCover) {
      innerPlaceholder?.setAttribute('hidden', '');
      innerGallery?.setAttribute('hidden', '');
    } else if (!innerGallery?.children.length) {
      innerPlaceholder?.removeAttribute('hidden');
      innerGallery?.setAttribute('hidden', '');
    } else {
      innerPlaceholder?.setAttribute('hidden', '');
      innerGallery?.removeAttribute('hidden');
    }
    toggleViewCover?.classList.toggle('text-accent', isCover);
    toggleViewInner?.classList.toggle('text-accent', !isCover);
  }

  tabBtnCover?.addEventListener('click', () => { showTab('cover'); showPreview('cover'); });
  tabBtnInner?.addEventListener('click', () => { showTab('inner'); showPreview('inner'); });
  toggleViewCover?.addEventListener('click', () => showPreview('cover'));
  toggleViewInner?.addEventListener('click', () => showPreview('inner'));
  form?.addEventListener('submit', () => showPreview('inner'));
}
