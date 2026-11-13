interface ArtCategory {
  id: string;
  slug: string;
  name: string;
  displayOrder: number;
  isActive: boolean;
}

interface ArtVersion {
  version: number;
  originalFilename: string;
  originalExt: string;
  width: number;
  height: number;
  fileSize: number;
  createdAt: string;
}

interface ArtItem {
  id: string;
  code: string;
  title: string;
  description: string;
  groupDescription: string;
  currentVersion: number;
  isPublished: boolean;
  isActive: boolean;
  categories: Array<{ id: string; slug: string; name: string }>;
  products: string[];
  versionInfo: ArtVersion | null;
}

const PRODUCT_NAMES: Record<string, string> = {
  caneca: 'Caneca',
  quadro: 'Quadro',
};

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

function createEl<K extends keyof HTMLElementTagNameMap>(
  tag: K,
  className?: string,
  text?: string,
): HTMLElementTagNameMap[K] {
  const el = document.createElement(tag);
  if (className) el.className = className;
  if (text !== undefined) el.textContent = text;
  return el;
}

function initAdminArtes(): void {
  const seedNode = document.getElementById('initial-art-library-data');
  if (!seedNode) return;
  const seed = JSON.parse(seedNode.textContent || '{}') as { categories: ArtCategory[]; artes: ArtItem[] };

  let categories = seed.categories ?? [];
  let artes = seed.artes ?? [];

  const counterEl = document.getElementById('artes-counter');
  const categoryListEl = document.getElementById('categories-list');
  const categoryStatusEl = document.getElementById('category-status');
  const formNewCategory = document.getElementById('form-new-category') as HTMLFormElement | null;
  const inputCategoryName = document.getElementById('input-category-name') as HTMLInputElement | null;

  const formUpload = document.getElementById('form-upload-artes') as HTMLFormElement | null;
  const inputFiles = document.getElementById('input-arte-files') as HTMLInputElement | null;
  const filesHintEl = document.getElementById('upload-files-hint');
  const singleFieldsEl = document.getElementById('single-arte-fields');
  const inputGroupDesc = document.getElementById('input-arte-group-description') as HTMLTextAreaElement | null;
  const inputTitle = document.getElementById('input-arte-title') as HTMLInputElement | null;
  const inputCode = document.getElementById('input-arte-code') as HTMLInputElement | null;
  const inputUploadPublished = document.getElementById('input-upload-published') as HTMLInputElement | null;
  const uploadCatsEl = document.getElementById('upload-categories-container');
  const uploadStatusEl = document.getElementById('upload-status');
  const btnSubmitUpload = document.getElementById('btn-submit-upload') as HTMLButtonElement | null;

  const filterQ = document.getElementById('filter-q') as HTMLInputElement | null;
  const filterCat = document.getElementById('filter-category') as HTMLSelectElement | null;
  const filterProd = document.getElementById('filter-product') as HTMLSelectElement | null;
  const filterStatus = document.getElementById('filter-status') as HTMLSelectElement | null;
  const artesGridEl = document.getElementById('artes-grid');
  const artesStatusEl = document.getElementById('artes-list-status');

  const modalPreview = document.getElementById('modal-preview') as HTMLDialogElement | null;
  const previewTitleEl = document.getElementById('preview-title');
  const previewMetaEl = document.getElementById('preview-meta');
  const previewImgEl = document.getElementById('preview-image') as HTMLImageElement | null;
  const previewVersionsEl = document.getElementById('preview-versions');
  const btnClosePreview = document.getElementById('btn-close-preview');

  const modalEdit = document.getElementById('modal-edit') as HTMLDialogElement | null;
  const btnCloseEdit = document.getElementById('btn-close-edit');
  const formEdit = document.getElementById('form-edit-arte') as HTMLFormElement | null;
  const editIdEl = document.getElementById('edit-arte-id') as HTMLInputElement | null;
  const editCodeEl = document.getElementById('edit-arte-code') as HTMLInputElement | null;
  const editTitleEl = document.getElementById('edit-arte-title') as HTMLInputElement | null;
  const editDescEl = document.getElementById('edit-arte-description') as HTMLTextAreaElement | null;
  const editGroupDescEl = document.getElementById('edit-arte-group-description') as HTMLTextAreaElement | null;
  const editCatsEl = document.getElementById('edit-categories-container');
  const editPublishedEl = document.getElementById('edit-arte-published') as HTMLInputElement | null;
  const editActiveEl = document.getElementById('edit-arte-active') as HTMLInputElement | null;
  const editStatusEl = document.getElementById('edit-status');

  const formNewVersion = document.getElementById('form-new-version') as HTMLFormElement | null;
  const inputNewVersionFile = document.getElementById('input-new-version-file') as HTMLInputElement | null;
  const versionStatusEl = document.getElementById('version-status');
  const btnSubmitVersion = document.getElementById('btn-submit-version') as HTMLButtonElement | null;

  function renderCategoryCheckboxes(container: HTMLElement | null, name: string, selectedIds: string[] = []): void {
    if (!container) return;
    container.replaceChildren();
    const active = categories.filter(c => c.isActive || selectedIds.includes(c.id));
    if (!active.length) {
      container.appendChild(createEl('span', 'text-xs text-ink-muted', 'Nenhuma categoria cadastrada.'));
      return;
    }
    for (const cat of active) {
      const label = createEl('label', 'inline-flex items-center gap-1.5 rounded-md border border-line bg-canvas px-2.5 py-1 text-xs cursor-pointer');
      const input = document.createElement('input');
      input.type = 'checkbox';
      input.name = name;
      input.value = cat.id;
      input.checked = selectedIds.includes(cat.id);
      input.className = 'accent-accent';
      label.append(input, createEl('span', undefined, cat.name));
      container.appendChild(label);
    }
  }

  function renderCategories(): void {
    if (categoryListEl) {
      categoryListEl.replaceChildren();
      if (!categories.length) {
        categoryListEl.appendChild(createEl('li', 'p-3 text-xs text-ink-muted', 'Nenhuma categoria criada ainda.'));
      }
      for (const cat of categories) {
        const li = createEl('li', 'flex items-center justify-between gap-2 p-2.5');
        const info = createEl('div', 'min-w-0');
        info.appendChild(createEl('span', `font-medium ${cat.isActive ? 'text-ink' : 'line-through text-ink-muted'}`, cat.name));
        info.appendChild(createEl('span', 'ml-2 text-[11px] text-ink-muted', `/${cat.slug}`));

        const actions = createEl('div', 'flex items-center gap-1.5 shrink-0');
        const btnRename = createEl('button', 'rounded border border-line px-2 py-1 text-[11px] hover:border-accent', 'Renomear');
        btnRename.type = 'button';
        btnRename.addEventListener('click', () => renameCategory(cat));

        const btnToggle = createEl(
          'button',
          'rounded border border-line px-2 py-1 text-[11px] hover:border-accent',
          cat.isActive ? 'Desativar' : 'Reativar',
        );
        btnToggle.type = 'button';
        btnToggle.addEventListener('click', () => toggleCategory(cat));

        actions.append(btnRename, btnToggle);
        li.append(info, actions);
        categoryListEl.appendChild(li);
      }
    }

    if (filterCat) {
      const prev = filterCat.value;
      filterCat.replaceChildren(new Option('Todas', ''));
      for (const cat of categories) {
        filterCat.appendChild(new Option(cat.isActive ? cat.name : `${cat.name} (inativa)`, cat.id));
      }
      filterCat.value = prev;
    }

    const checkedUpload = Array.from(document.querySelectorAll<HTMLInputElement>('input[name="upload-categories"]:checked')).map(el => el.value);
    renderCategoryCheckboxes(uploadCatsEl, 'upload-categories', checkedUpload);
  }

  async function refreshCategories(): Promise<void> {
    const res = await fetch('/api/admin/artes/categorias?all=true');
    const json = await res.json();
    if (res.ok && json.success) {
      categories = json.data;
      renderCategories();
    }
  }

  async function renameCategory(cat: ArtCategory): Promise<void> {
    const nextName = window.prompt('Novo nome da categoria:', cat.name)?.trim();
    if (!nextName || nextName === cat.name) return;
    const res = await fetch(`/api/admin/artes/categorias/${cat.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: nextName }),
    });
    const json = await res.json();
    if (categoryStatusEl) categoryStatusEl.textContent = res.ok ? 'Categoria atualizada.' : (json.error || 'Erro ao atualizar.');
    if (res.ok) {
      await refreshCategories();
      await refreshArtes();
    }
  }

  async function toggleCategory(cat: ArtCategory): Promise<void> {
    const res = await fetch(`/api/admin/artes/categorias/${cat.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ isActive: !cat.isActive }),
    });
    const json = await res.json();
    if (categoryStatusEl) categoryStatusEl.textContent = res.ok ? 'Situação da categoria atualizada.' : (json.error || 'Erro ao atualizar.');
    if (res.ok) await refreshCategories();
  }

  async function refreshArtes(): Promise<void> {
    const params = new URLSearchParams();
    if (filterQ?.value.trim()) params.set('q', filterQ.value.trim());
    if (filterCat?.value) params.set('categoria', filterCat.value);
    if (filterProd?.value) params.set('produto', filterProd.value);
    if (filterStatus?.value) params.set('situacao', filterStatus.value);

    const res = await fetch(`/api/admin/artes?${params.toString()}`);
    const json = await res.json();
    if (!res.ok || !json.success) {
      if (artesStatusEl) artesStatusEl.textContent = json.error || 'Falha ao carregar artes.';
      return;
    }
    artes = json.data;
    renderArtes();
  }

  function renderArtes(): void {
    if (counterEl) {
      counterEl.textContent = `${artes.length} ${artes.length === 1 ? 'arte encontrada' : 'artes encontradas'}`;
    }
    if (!artesGridEl) return;
    artesGridEl.replaceChildren();

    if (!artes.length) {
      artesGridEl.appendChild(
        createEl('p', 'col-span-full rounded-xl border border-line bg-surface p-6 text-center text-sm text-ink-secondary', 'Nenhuma arte encontrada com os filtros atuais.'),
      );
      return;
    }

    for (const arte of artes) {
      const card = createEl('article', 'flex flex-col overflow-hidden rounded-xl border border-line bg-surface shadow-sm');

      const mediaBox = createEl('div', 'relative aspect-square bg-canvas flex items-center justify-center overflow-hidden border-b border-line');
      const img = document.createElement('img');
      img.src = `/api/admin/artes/${arte.id}/imagem?variante=thumb&versao=${arte.currentVersion}`;
      img.alt = arte.title;
      img.loading = 'lazy';
      img.className = 'h-full w-full object-contain p-2';
      mediaBox.appendChild(img);

      const badgeStatus = !arte.isActive
        ? createEl('span', 'absolute top-2 left-2 rounded-full bg-ink-muted px-2.5 py-0.5 text-[10px] font-semibold text-canvas', 'Desativada')
        : arte.isPublished
          ? createEl('span', 'absolute top-2 left-2 rounded-full bg-success px-2.5 py-0.5 text-[10px] font-semibold text-canvas', 'Publicada')
          : createEl('span', 'absolute top-2 left-2 rounded-full bg-surface border border-line px-2.5 py-0.5 text-[10px] font-semibold text-ink-secondary', 'Rascunho');
      const badgeVersion = createEl('span', 'absolute top-2 right-2 rounded-full bg-canvas/90 border border-line px-2 py-0.5 text-[10px] font-semibold text-ink', `v${arte.currentVersion}`);
      mediaBox.append(badgeStatus, badgeVersion);

      const body = createEl('div', 'flex flex-1 flex-col p-4 space-y-2');
      body.appendChild(createEl('p', 'text-[11px] font-semibold tracking-wider text-accent', arte.code));
      body.appendChild(createEl('h3', 'text-sm font-semibold text-ink line-clamp-2', arte.title));
      if (arte.groupDescription) {
        body.appendChild(createEl('p', 'text-[11px] text-ink-secondary line-clamp-2', arte.groupDescription));
      }

      if (arte.versionInfo) {
        body.appendChild(
          createEl(
            'p',
            'text-[11px] text-ink-muted',
            `${arte.versionInfo.width}×${arte.versionInfo.height} px · ${formatBytes(arte.versionInfo.fileSize)} · ${arte.versionInfo.originalExt.toUpperCase()}`,
          ),
        );
      }

      const tags = createEl('div', 'flex flex-wrap gap-1 pt-1');
      for (const prod of arte.products) {
        tags.appendChild(createEl('span', 'rounded bg-accent/10 px-2 py-0.5 text-[10px] font-semibold text-accent', PRODUCT_NAMES[prod] || prod));
      }
      for (const cat of arte.categories) {
        tags.appendChild(createEl('span', 'rounded border border-line bg-canvas px-2 py-0.5 text-[10px] text-ink-secondary', cat.name));
      }
      body.appendChild(tags);

      const actions = createEl('div', 'mt-auto pt-3 border-t border-line grid grid-cols-2 gap-2 text-xs');
      const btnPreview = createEl('button', 'rounded-md border border-line py-1.5 font-medium hover:border-accent', 'Prévia');
      btnPreview.type = 'button';
      btnPreview.addEventListener('click', () => openPreviewModal(arte.id));

      const linkOriginal = createEl('a', 'flex items-center justify-center rounded-md border border-line py-1.5 font-medium hover:border-accent', 'Original ↓');
      linkOriginal.href = `/api/admin/artes/${arte.id}/imagem?variante=orig&versao=${arte.currentVersion}&download=1`;

      const btnEdit = createEl('button', 'rounded-md border border-line py-1.5 font-medium hover:border-accent', 'Editar');
      btnEdit.type = 'button';
      btnEdit.addEventListener('click', () => openEditModal(arte));

      const btnTogglePub = createEl(
        'button',
        'rounded-md border border-line py-1.5 font-medium hover:border-accent',
        !arte.isActive ? 'Reativar' : arte.isPublished ? 'Ocultar' : 'Publicar',
      );
      btnTogglePub.type = 'button';
      btnTogglePub.addEventListener('click', () => quickToggleStatus(arte));

      actions.append(btnPreview, linkOriginal, btnEdit, btnTogglePub);

      if (arte.isActive) {
        const btnDeactivate = createEl('button', 'col-span-2 rounded-md border border-line py-1 text-[11px] text-ink-muted hover:border-danger hover:text-danger', 'Desativar arte');
        btnDeactivate.type = 'button';
        btnDeactivate.addEventListener('click', () => deactivateItem(arte));
        actions.appendChild(btnDeactivate);
      }

      body.appendChild(actions);
      card.append(mediaBox, body);
      artesGridEl.appendChild(card);
    }
  }

  async function openPreviewModal(arteId: string): Promise<void> {
    if (!modalPreview) return;
    const res = await fetch(`/api/admin/artes/${arteId}`);
    const json = await res.json();
    if (!res.ok || !json.success) return;
    const detail = json.data as ArtItem & { versions: ArtVersion[] };

    if (previewTitleEl) previewTitleEl.textContent = `${detail.code} — ${detail.title}`;
    if (previewMetaEl) {
      const dims = detail.versionInfo ? `${detail.versionInfo.width}×${detail.versionInfo.height} px` : '';
      previewMetaEl.textContent = `Versão atual: v${detail.currentVersion} ${dims ? `· ${dims}` : ''}`;
    }
    if (previewImgEl) {
      previewImgEl.src = `/api/admin/artes/${detail.id}/imagem?variante=preview&versao=${detail.currentVersion}`;
    }
    if (previewVersionsEl) {
      previewVersionsEl.replaceChildren();
      for (const ver of detail.versions) {
        const li = createEl('li', 'flex flex-wrap items-center justify-between gap-2 p-2.5');
        li.appendChild(
          createEl('span', undefined, `v${ver.version} · ${ver.originalFilename} (${ver.width}×${ver.height} px, ${formatBytes(ver.fileSize)})`),
        );
        const dl = createEl('a', 'font-semibold text-accent hover:underline', 'Baixar original');
        dl.href = `/api/admin/artes/${detail.id}/imagem?variante=orig&versao=${ver.version}&download=1`;
        li.appendChild(dl);
        previewVersionsEl.appendChild(li);
      }
    }
    modalPreview.showModal();
  }

  function openEditModal(arte: ArtItem): void {
    if (!modalEdit || !editIdEl || !editCodeEl || !editTitleEl || !editDescEl || !editPublishedEl || !editActiveEl) return;
    editIdEl.value = arte.id;
    editCodeEl.value = arte.code;
    editTitleEl.value = arte.title;
    editDescEl.value = arte.description;
    if (editGroupDescEl) editGroupDescEl.value = arte.groupDescription;
    editPublishedEl.checked = arte.isPublished;
    editActiveEl.checked = arte.isActive;
    for (const box of document.querySelectorAll<HTMLInputElement>('input[name="edit-products"]')) {
      box.checked = arte.products.includes(box.value);
    }
    renderCategoryCheckboxes(editCatsEl, 'edit-categories', arte.categories.map(c => c.id));
    if (editStatusEl) editStatusEl.textContent = '';
    if (versionStatusEl) versionStatusEl.textContent = '';
    if (inputNewVersionFile) inputNewVersionFile.value = '';
    modalEdit.showModal();
  }

  async function quickToggleStatus(arte: ArtItem): Promise<void> {
    const payload = !arte.isActive
      ? { isActive: true, isPublished: true }
      : { isPublished: !arte.isPublished };
    const res = await fetch(`/api/admin/artes/${arte.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    if (res.ok) await refreshArtes();
  }

  async function deactivateItem(arte: ArtItem): Promise<void> {
    const res = await fetch(`/api/admin/artes/${arte.id}`, { method: 'DELETE' });
    if (res.ok) {
      if (artesStatusEl) artesStatusEl.textContent = `Arte ${arte.code} desativada (arquivos preservados).`;
      await refreshArtes();
    }
  }

  formNewCategory?.addEventListener('submit', async event => {
    event.preventDefault();
    if (!inputCategoryName?.value.trim()) return;
    const res = await fetch('/api/admin/artes/categorias', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: inputCategoryName.value.trim() }),
    });
    const json = await res.json();
    if (categoryStatusEl) categoryStatusEl.textContent = res.ok ? 'Categoria criada.' : (json.error || 'Erro ao criar categoria.');
    if (res.ok) {
      inputCategoryName.value = '';
      await refreshCategories();
    }
  });

  inputFiles?.addEventListener('change', () => {
    const count = inputFiles.files?.length ?? 0;
    if (filesHintEl) {
      filesHintEl.textContent = count === 0
        ? 'Nenhum arquivo selecionado.'
        : count === 1
          ? `1 arquivo selecionado: ${inputFiles.files![0].name}`
          : `${count} arquivos selecionados para envio em lote.`;
    }
    if (singleFieldsEl) singleFieldsEl.classList.toggle('opacity-60', count > 1);
    if (inputTitle) inputTitle.disabled = count > 1;
    if (inputCode) inputCode.disabled = count > 1;
  });

  formUpload?.addEventListener('submit', async event => {
    event.preventDefault();
    const files = inputFiles?.files;
    if (!files?.length || !btnSubmitUpload) return;

    const formData = new FormData();
    for (const file of Array.from(files)) formData.append('files', file);
    for (const prod of document.querySelectorAll<HTMLInputElement>('input[name="upload-products"]:checked')) {
      formData.append('products', prod.value);
    }
    for (const cat of document.querySelectorAll<HTMLInputElement>('input[name="upload-categories"]:checked')) {
      formData.append('categories', cat.value);
    }
    if (inputGroupDesc?.value.trim()) formData.append('groupDescription', inputGroupDesc.value.trim());
    if (files.length === 1) {
      if (inputTitle?.value.trim()) formData.append('title', inputTitle.value.trim());
      if (inputCode?.value.trim()) formData.append('code', inputCode.value.trim());
    }
    formData.append('published', String(Boolean(inputUploadPublished?.checked)));

    btnSubmitUpload.disabled = true;
    if (uploadStatusEl) uploadStatusEl.textContent = 'Processando e gerando miniaturas/prévias…';
    try {
      const res = await fetch('/api/admin/artes', { method: 'POST', body: formData });
      const json = await res.json();
      if (res.ok) {
        const createdCount = json.created?.length ?? 0;
        const errCount = json.errors?.length ?? 0;
        if (uploadStatusEl) {
          uploadStatusEl.textContent = errCount
            ? `${createdCount} arte(s) enviada(s); ${errCount} falharam (${json.errors[0].filename}: ${json.errors[0].error}).`
            : `${createdCount} arte(s) enviada(s) com sucesso.`;
        }
        formUpload.reset();
        if (inputTitle) inputTitle.disabled = false;
        if (inputCode) inputCode.disabled = false;
        for (const box of document.querySelectorAll<HTMLInputElement>('input[name="upload-products"]')) box.checked = true;
        if (inputUploadPublished) inputUploadPublished.checked = true;
        if (filesHintEl) filesHintEl.textContent = 'Nenhum arquivo selecionado.';
        await refreshArtes();
      } else if (uploadStatusEl) {
        uploadStatusEl.textContent = json.error || 'Falha no envio das imagens.';
      }
    } finally {
      btnSubmitUpload.disabled = false;
    }
  });

  formEdit?.addEventListener('submit', async event => {
    event.preventDefault();
    const id = editIdEl?.value;
    if (!id) return;
    const products = Array.from(document.querySelectorAll<HTMLInputElement>('input[name="edit-products"]:checked')).map(el => el.value);
    const categoryIds = Array.from(document.querySelectorAll<HTMLInputElement>('input[name="edit-categories"]:checked')).map(el => el.value);

    const res = await fetch(`/api/admin/artes/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        code: editCodeEl?.value.trim(),
        title: editTitleEl?.value.trim(),
        description: editDescEl?.value.trim(),
        groupDescription: editGroupDescEl?.value.trim() ?? '',
        productTypes: products,
        categoryIds,
        isPublished: Boolean(editPublishedEl?.checked),
        isActive: Boolean(editActiveEl?.checked),
      }),
    });
    const json = await res.json();
    if (editStatusEl) editStatusEl.textContent = res.ok ? 'Alterações salvas.' : (json.error || 'Erro ao salvar.');
    if (res.ok) await refreshArtes();
  });

  formNewVersion?.addEventListener('submit', async event => {
    event.preventDefault();
    const id = editIdEl?.value;
    const file = inputNewVersionFile?.files?.[0];
    if (!id || !file || !btnSubmitVersion) return;

    const formData = new FormData();
    formData.append('file', file);
    btnSubmitVersion.disabled = true;
    if (versionStatusEl) versionStatusEl.textContent = 'Gerando nova versão e preservando a anterior…';
    try {
      const res = await fetch(`/api/admin/artes/${id}/versao`, { method: 'POST', body: formData });
      const json = await res.json();
      if (versionStatusEl) {
        versionStatusEl.textContent = res.ok
          ? `Versão v${json.data.currentVersion} publicada com sucesso.`
          : (json.error || 'Falha ao enviar nova versão.');
      }
      if (res.ok) {
        if (inputNewVersionFile) inputNewVersionFile.value = '';
        await refreshArtes();
      }
    } finally {
      btnSubmitVersion.disabled = false;
    }
  });

  btnClosePreview?.addEventListener('click', () => modalPreview?.close());
  btnCloseEdit?.addEventListener('click', () => modalEdit?.close());
  for (const el of [filterQ, filterCat, filterProd, filterStatus]) {
    el?.addEventListener(el === filterQ ? 'input' : 'change', () => { void refreshArtes(); });
  }

  renderCategories();
  renderArtes();
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initAdminArtes);
} else {
  initAdminArtes();
}

