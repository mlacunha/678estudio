export interface SelectedLibraryArt {
  id: string;
  code: string;
  title: string;
  version: number;
  width: number;
  height: number;
  thumbUrl: string;
  previewUrl: string;
}

interface CategoryOption {
  id: string;
  slug: string;
  name: string;
}

export interface ArtLibraryPickerController {
  clearSelection: () => void;
  setMode: (mode: 'upload' | 'library') => void;
}

/** Conecta um componente ArtLibraryPicker ao personalizador correspondente. */
export function connectArtLibraryPicker(
  root: HTMLElement | null,
  options: {
    onSelect: (art: SelectedLibraryArt) => void;
  },
): ArtLibraryPickerController | null {
  if (!root) return null;

  const product = root.dataset.product ?? '';
  const tabUpload = root.querySelector<HTMLButtonElement>('[data-art-mode="upload"]');
  const tabLibrary = root.querySelector<HTMLButtonElement>('[data-art-mode="library"]');
  const panelUpload = root.querySelector<HTMLElement>('[data-art-panel="upload"]');
  const panelLibrary = root.querySelector<HTMLElement>('[data-art-panel="library"]');
  const searchInput = root.querySelector<HTMLInputElement>('[data-art-search]');
  const categoriesEl = root.querySelector<HTMLElement>('[data-art-categories]');
  const gridEl = root.querySelector<HTMLElement>('[data-art-grid]');
  const statusEl = root.querySelector<HTMLElement>('[data-art-picker-status]');
  const loadMoreBtn = root.querySelector<HTMLButtonElement>('[data-art-load-more]');

  let activeCategory = '';
  let currentPage = 1;
  let hasMore = false;
  let loading = false;
  let loadedOnce = false;
  let selectedId: string | null = null;
  let items: SelectedLibraryArt[] = [];
  let categories: CategoryOption[] = [];
  let searchTimer: number | undefined;
  let requestCounter = 0;

  function setMode(mode: 'upload' | 'library'): void {
    const isLibrary = mode === 'library';
    if (panelUpload) panelUpload.hidden = isLibrary;
    if (panelLibrary) panelLibrary.hidden = !isLibrary;

    if (tabUpload && tabLibrary) {
      tabUpload.setAttribute('aria-selected', String(!isLibrary));
      tabLibrary.setAttribute('aria-selected', String(isLibrary));
      for (const cls of ['bg-surface', 'text-ink', 'shadow-sm']) {
        tabUpload.classList.toggle(cls, !isLibrary);
        tabLibrary.classList.toggle(cls, isLibrary);
      }
      for (const cls of ['text-ink-secondary']) {
        tabUpload.classList.toggle(cls, isLibrary);
        tabLibrary.classList.toggle(cls, !isLibrary);
      }
    }

    if (isLibrary && !loadedOnce) {
      void fetchPage(1, false);
    }
  }

  function renderCategories(): void {
    if (!categoriesEl) return;
    categoriesEl.replaceChildren();
    const allBtn = document.createElement('button');
    allBtn.type = 'button';
    allBtn.textContent = 'Todas';
    allBtn.className = categoryClass(activeCategory === '');
    allBtn.addEventListener('click', () => {
      if (activeCategory === '') return;
      activeCategory = '';
      renderCategories();
      void fetchPage(1, false);
    });
    categoriesEl.appendChild(allBtn);

    for (const cat of categories) {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.textContent = cat.name;
      btn.className = categoryClass(activeCategory === cat.id);
      btn.addEventListener('click', () => {
        activeCategory = activeCategory === cat.id ? '' : cat.id;
        renderCategories();
        void fetchPage(1, false);
      });
      categoriesEl.appendChild(btn);
    }
  }

  function categoryClass(active: boolean): string {
    return active
      ? 'rounded-full border border-accent bg-accent/15 px-2.5 py-1 text-[11px] font-semibold text-accent'
      : 'rounded-full border border-line bg-surface px-2.5 py-1 text-[11px] font-medium text-ink-secondary hover:border-accent';
  }

  function renderGrid(): void {
    if (!gridEl) return;
    gridEl.replaceChildren();

    for (const art of items) {
      const isSelected = art.id === selectedId;
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.dataset.artId = art.id;
      btn.dataset.artCode = art.code;
      btn.setAttribute('aria-pressed', String(isSelected));
      btn.className = `group flex flex-col overflow-hidden rounded-lg border text-left transition-all ${
        isSelected
          ? 'border-accent ring-2 ring-accent/30 bg-accent/5'
          : 'border-line bg-surface hover:border-accent'
      }`;

      const thumbWrap = document.createElement('div');
      thumbWrap.className = 'aspect-square w-full bg-canvas p-1.5 flex items-center justify-center overflow-hidden';
      const img = document.createElement('img');
      img.src = art.thumbUrl;
      img.alt = art.title;
      img.loading = 'lazy';
      img.className = 'max-h-full max-w-full object-contain';
      thumbWrap.appendChild(img);

      const meta = document.createElement('div');
      meta.className = 'p-1.5 border-t border-line w-full';
      const codeEl = document.createElement('p');
      codeEl.className = 'text-[10px] font-semibold text-accent truncate';
      codeEl.textContent = `${art.code} · v${art.version}`;
      const titleEl = document.createElement('p');
      titleEl.className = 'text-[11px] font-medium text-ink truncate';
      titleEl.textContent = art.title;
      meta.append(codeEl, titleEl);

      btn.append(thumbWrap, meta);
      btn.addEventListener('click', () => {
        selectedId = art.id;
        renderGrid();
        options.onSelect(art);
      });
      gridEl.appendChild(btn);
    }
  }

  async function fetchPage(page: number, append: boolean): Promise<void> {
    if (!product) return;
    const reqId = ++requestCounter;
    loading = true;
    if (loadMoreBtn) loadMoreBtn.disabled = true;
    if (statusEl) statusEl.textContent = 'Carregando artes da biblioteca…';

    const params = new URLSearchParams({
      produto: product,
      pagina: String(page),
      limite: '12',
    });
    if (activeCategory) params.set('categoria', activeCategory);
    if (searchInput?.value.trim()) params.set('q', searchInput.value.trim());

    try {
      const response = await fetch(`/api/artes?${params.toString()}`);
      const json = await response.json();
      if (reqId !== requestCounter) return;
      if (!response.ok || !json.success) {
        throw new Error(json.error || 'Falha ao carregar biblioteca.');
      }

      loadedOnce = true;
      currentPage = json.data.page;
      hasMore = Boolean(json.data.hasMore);
      categories = json.data.categories ?? [];
      items = append ? [...items, ...json.data.items] : json.data.items;

      renderCategories();
      renderGrid();
      if (loadMoreBtn) loadMoreBtn.hidden = !hasMore;
      if (statusEl) {
        statusEl.textContent = items.length ? '' : 'Nenhuma arte disponível com os filtros atuais.';
      }
    } catch {
      if (reqId === requestCounter && statusEl) {
        statusEl.textContent = 'Não foi possível carregar a biblioteca de artes. Tente novamente.';
      }
    } finally {
      if (reqId === requestCounter) {
        loading = false;
        if (loadMoreBtn) loadMoreBtn.disabled = false;
      }
    }
  }

  tabUpload?.addEventListener('click', () => setMode('upload'));
  tabLibrary?.addEventListener('click', () => setMode('library'));

  searchInput?.addEventListener('input', () => {
    window.clearTimeout(searchTimer);
    searchTimer = window.setTimeout(() => {
      void fetchPage(1, false);
    }, 250);
  });

  loadMoreBtn?.addEventListener('click', () => {
    if (!loading && hasMore) void fetchPage(currentPage + 1, true);
  });

  return {
    clearSelection: () => {
      if (!selectedId) return;
      selectedId = null;
      renderGrid();
    },
    setMode,
  };
}

