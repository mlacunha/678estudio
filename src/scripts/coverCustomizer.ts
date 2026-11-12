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

  function updatePaletteColors() {
    if (!paletteSelect || !primaryInput || !accentInput) return;
    const selected = paletteSelect.selectedOptions[0];
    if (selected) {
      if (selected.dataset.primary) primaryInput.value = selected.dataset.primary;
      if (selected.dataset.accent) accentInput.value = selected.dataset.accent;
    }
  }

  paletteSelect?.addEventListener('change', () => {
    updatePaletteColors();
    triggerPreviewRefresh();
  });

  let debounceTimer: any = null;
  function triggerPreviewRefresh() {
    clearTimeout(debounceTimer);
    debounceTimer = setTimeout(fetchCoverPreview, 350);
  }

  async function fetchCoverPreview() {
    if (!coverPreviewImg) return;
    const style = (form?.querySelector('input[name="cover_style"]:checked') as HTMLInputElement)?.value || 'classic';
    const typography = (form?.querySelector('select[name="cover_typography"]') as HTMLSelectElement)?.value || 'editorial';
    const title = (form?.querySelector('input[name="cover_title"]') as HTMLInputElement)?.value || '678 Estudio';
    const name = (form?.querySelector('input[name="cover_name"]') as HTMLInputElement)?.value || '';
    const subtitle = (form?.querySelector('input[name="cover_subtitle"]') as HTMLInputElement)?.value || '';
    const primary = primaryInput?.value || '#1e293b';
    const accent = accentInput?.value || '#c5a059';

    const formData = new FormData();
    formData.append('target', 'front-a5');
    formData.append('style', style);
    formData.append('typography', typography);
    formData.append('title', title);
    formData.append('name', name);
    formData.append('subtitle', subtitle);
    formData.append('color_primary', primary);
    formData.append('color_accent', accent);

    if (photoInput?.files && photoInput.files[0]) {
      formData.append('photo', photoInput.files[0]);
    }

    try {
      const res = await fetch('/api/cover/preview', {
        method: 'POST',
        body: formData,
      });
      if (res.ok) {
        const blob = await res.blob();
        const url = URL.createObjectURL(blob);
        coverPreviewImg.src = url;
      }
    } catch {
      // Ignora falhas de preview transitórias
    }
  }

  // Escuta inputs de capa
  form.querySelectorAll('input[name^="cover_"], select[name^="cover_"]').forEach(el => {
    el.addEventListener('input', triggerPreviewRefresh);
    el.addEventListener('change', triggerPreviewRefresh);
  });

  photoInput?.addEventListener('change', triggerPreviewRefresh);

  // Gatilho inicial
  triggerPreviewRefresh();
}

