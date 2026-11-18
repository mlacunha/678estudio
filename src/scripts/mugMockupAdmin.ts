import { maxMugArtworkBytes } from '../server/mockups/options.mjs';
import {
  combinePlacement, framedArtwork, hasAdjustment, instanceGeometry, mugFrame, neutralAdjustment, placementLimits,
  type Adjustment, type Frame, type InstanceAdjustment, type InstanceAdjustments, type Placement,
} from '../server/mockups/placement.mjs';
import type { MugInstance } from '../server/mockups/manifest.mjs';
import { downloadMugFile, encodeMugExport, type MugExportFormat } from './mugMockupExport';
import { createMugMockupZip } from './mugMockupZip';

const controlKeys = ['zoom', 'offsetX', 'offsetY'] as const;
const directions: Record<string, [number, number]> = {
  ArrowLeft: [-1, 0], ArrowRight: [1, 0], ArrowUp: [0, -1], ArrowDown: [0, 1],
};
const clamp = (value: number) => Math.round(Math.max(-placementLimits.offset, Math.min(placementLimits.offset, value)));
type Control = typeof controlKeys[number];
type Result = { name: string; blob: Blob; url: string; key: string };

export function initMugMockupAdmin() {
  const form = document.querySelector<HTMLFormElement>('#mug-mockup-form')!;
  const fields = document.querySelector<HTMLFieldSetElement>('#mug-mockup-fields')!;
  const upload = document.querySelector<HTMLInputElement>('#mug-artwork')!;
  const error = document.querySelector<HTMLParagraphElement>('#mug-mockup-error')!;
  const status = document.querySelector<HTMLParagraphElement>('#mug-mockup-status')!;
  const gallery = document.querySelector<HTMLDivElement>('#mug-mockup-results')!;
  const zip = document.querySelector<HTMLButtonElement>('#mug-download-zip')!;
  const format = document.querySelector<HTMLSelectElement>('#mug-export-format')!;
  const template = document.querySelector<HTMLTemplateElement>('#mug-mockup-result')!;
  const slotTemplate = document.querySelector<HTMLTemplateElement>('#mug-instance-editor')!;
  const globalControls = document.querySelector<HTMLFieldSetElement>('#mug-global-placement')!;
  const fit = document.querySelector<HTMLSelectElement>('#mug-fit')!;
  const surface = document.querySelector<HTMLDivElement>('#mug-art-frame')!;
  const art = document.querySelector<HTMLImageElement>('#mug-frame-art')!;
  const empty = document.querySelector<HTMLElement>('#mug-frame-empty')!;
  const generate = document.querySelector<HTMLButtonElement>('#mug-generate')!;
  const modelSelect = document.querySelector<HTMLSelectElement>('#mug-model')!;
  const resultImage = document.querySelector<HTMLImageElement>('#mug-result-image')!;
  const resultDownload = document.querySelector<HTMLButtonElement>('#mug-result-download')!;
  const library = document.querySelector<HTMLDialogElement>('#mug-library')!;
  const libraryChoice = library.querySelector<HTMLSelectElement>('[data-library-choice]')!;
  const libraryStatus = library.querySelector<HTMLElement>('[data-library-status]')!;
  const libraryApply = library.querySelector<HTMLButtonElement>('[data-library-apply]')!;
  const slotFiles = new Map<string, Map<string, {file: File; url: string}>>();
  let allArtwork: File | undefined;
  let useLibrary: ((file: File) => void) | undefined;
  const cards = new Map<string, HTMLElement>();
  const results = new Map<string, Result>();
  const corrections = new Map<string, Adjustment>();
  const instanceCorrections = new Map<string, InstanceAdjustments>();
  const instanceEditors = new Map<string, () => void>();
  const failures = new Map<string, string>();
  let global: Frame = { fit: 'contain', ...neutralAdjustment };
  let artUrl = '';
  let rendering = false;
  let zipping = false;

  const selected = () => modelSelect.selectedOptions[0];
  const localFor = (id: string) => corrections.get(id) ?? neutralAdjustment;
  const locallyAdjusted = (id: string) => controlKeys.some(key => localFor(id)[key] !== neutralAdjustment[key]);

  function placement(id: string): Placement {
    const active = Object.entries(instanceCorrections.get(id) ?? {})
      .filter(([, adjustment]) => hasAdjustment(adjustment)).sort(([a], [b]) => a.localeCompare(b));
    const instances = active.length ? { instances: Object.fromEntries(active) } : {};
    if (fit.value === 'original' && !locallyAdjusted(id)) return { mode: 'original', ...instances };
    return { mode: 'custom', global, local: localFor(id), ...instances };
  }

  function current(id: string) {
    const result = results.get(id);
    return result?.key === JSON.stringify(placement(id)) ? result : undefined;
  }

  function showError(message: string) {
    error.textContent = message;
    error.hidden = !message;
  }

  function showControls(root: ParentNode, adjustment: Adjustment) {
    for (const key of controlKeys) {
      const input = root.querySelector<HTMLInputElement>(`[data-control="${key}"]`)!;
      const output = root.querySelector<HTMLOutputElement>(`[data-value="${key}"]`)!;
      const value = adjustment[key];
      input.value = String(value);
      output.value = key === 'zoom' ? `${value}%` : value === 0 ? '0% · Centro' : `${value > 0 ? '+' : ''}${value}%`;
    }
  }

  function drawFrame() {
    if (!art.naturalWidth) return;
    const reference: Frame = fit.value === 'original' ? { fit: 'contain', ...neutralAdjustment } : global;
    const rect = framedArtwork({ width: art.naturalWidth, height: art.naturalHeight }, mugFrame, reference);
    art.style.left = `${rect.x / mugFrame.width * 100}%`;
    art.style.top = `${rect.y / mugFrame.height * 100}%`;
    art.style.width = `${rect.width / mugFrame.width * 100}%`;
    art.style.height = `${rect.height / mugFrame.height * 100}%`;
    art.hidden = false;
    empty.hidden = true;
  }

  function renderState() {
    const id = selected().value;
    const result = results.get(id);
    const ready = current(id);
    for (const [modelId, card] of cards) {
      card.hidden = modelId !== id;
      card.querySelector<HTMLFieldSetElement>('[data-local]')!.disabled = rendering || zipping;
      card.querySelector<HTMLButtonElement>('[data-local-render]')!.disabled = Boolean(current(modelId));
      card.querySelector<HTMLFieldSetElement>('[data-instance-controls]')!.disabled = rendering || zipping;
      if (modelId === id) instanceEditors.get(id)?.();
    }
    resultImage.hidden = !result;
    if (result && resultImage.getAttribute('src') !== result.url) resultImage.src = result.url;
    if (!result) resultImage.removeAttribute('src');
    resultImage.alt = selected().text;
    resultDownload.hidden = !ready;
    resultDownload.disabled = rendering || zipping || !ready;
    resultDownload.textContent = 'Baixar ' + format.selectedOptions[0].text;
    zip.hidden = !ready;
    zip.disabled = rendering || zipping || !ready;
    format.disabled = rendering || zipping;
    generate.disabled = rendering || zipping || Boolean(ready);
    generate.textContent = result ? 'Atualizar foto do mockup' : 'Gerar foto do mockup';
    if (!rendering) status.textContent = failures.get(id)
      ?? (ready ? 'Foto atualizada.' : result ? 'Enquadramento alterado. Atualize a foto para baixar.' : 'A foto do modelo selecionado aparecerá aqui.');
  }

  async function openLibrary(apply: (file: File) => void) {
    useLibrary = apply;
    libraryChoice.replaceChildren();
    libraryApply.disabled = true;
    libraryStatus.textContent = 'Carregando biblioteca…';
    library.showModal();
    try {
      const response = await fetch('/api/admin/artes');
      if (!response.ok) throw new Error();
      const payload = await response.json();
      for (const item of payload.data ?? []) {
        libraryChoice.add(new Option(item.title, item.id));
      }
      libraryApply.disabled = !libraryChoice.options.length;
      libraryStatus.textContent = libraryApply.disabled ? 'Nenhuma arte disponível.' : '';
    } catch {
      libraryStatus.textContent = 'Não foi possível abrir a biblioteca.';
    }
  }

  libraryApply.addEventListener('click', async () => {
    const apply = useLibrary;
    const choice = libraryChoice.selectedOptions[0];
    if (!apply || !choice) return;
    libraryApply.disabled = true;
    try {
      const response = await fetch(`/api/admin/artes/${encodeURIComponent(choice.value)}/imagem?variante=orig`);
      if (!response.ok) throw new Error();
      const blob = await response.blob();
      if (!library.open || useLibrary !== apply) return;
      apply(new File([blob], choice.text, { type: blob.type }));
      library.close();
    } catch {
      libraryStatus.textContent = 'Não foi possível carregar esta arte.';
    } finally {
      libraryApply.disabled = false;
    }
  });

  function updateGlobal() {
    showControls(globalControls, global);
    drawFrame();
    failures.clear();
    renderState();
  }

  function setManual() {
    fit.value = 'manual';
  }

  function restoreOriginal() {
    global = { fit: 'contain', ...neutralAdjustment };
    fit.value = 'original';
    corrections.clear();
    instanceCorrections.clear();
    for (const card of cards.values()) showControls(card.querySelector('[data-local]')!, neutralAdjustment);
  }

  function setupInstanceEditor(id: string, card: HTMLElement, model: HTMLOptionElement) {
    const instances: MugInstance[] = JSON.parse(model.dataset.instances ?? '[]');
    const editors = card.querySelector<HTMLElement>('[data-mug-editors]')!;
    const refresh = instances.map(instance => {
      const tile = slotTemplate.content.firstElementChild!.cloneNode(true) as HTMLElement;
      tile.dataset.instance = instance.id;
      tile.querySelector('h4')!.textContent = instance.framing ? instance.label : 'Caneca ' + instance.label;
      const surface = tile.querySelector<HTMLElement>('[data-slot-surface]')!;
      surface.style.aspectRatio = `${instance.input.width} / ${instance.input.height}`;
      surface.setAttribute('aria-label', `Recorte da caneca ${instance.label}. Use as setas para mover a arte.`);
      const clip = tile.querySelector<HTMLElement>('[data-slot-clip]')!;
      const picture = tile.querySelector<HTMLImageElement>('[data-slot-art]')!;
      const fitSelect = tile.querySelector<HTMLSelectElement>('[data-slot-fit]')!;
      const fileInput = tile.querySelector<HTMLInputElement>('[data-slot-upload]')!;
      const clear = tile.querySelector<HTMLButtonElement>('[data-slot-clear]')!;
      const sources = slotFiles.get(id) ?? new Map<string, {file: File; url: string}>();
      slotFiles.set(id, sources);
      function assign(file?: File) {
        if (file && file.size > maxMugArtworkBytes) {
          showError('Cada arte deve ter até 8 MB.');
          return;
        }
        const old = sources.get(instance.id);
        if (old) URL.revokeObjectURL(old.url);
        if (file) sources.set(instance.id, { file, url: URL.createObjectURL(file) });
        else sources.delete(instance.id);
        const previous = results.get(id);
        if (previous) URL.revokeObjectURL(previous.url);
        results.delete(id);
        failures.delete(id);
        showError('');
        renderState();
      }
      fileInput.addEventListener('change', () => assign(fileInput.files?.[0]));
      clear.addEventListener('click', () => { fileInput.value = ''; assign(); });
      tile.querySelector('[data-slot-library]')!.addEventListener('click', () =>
        void openLibrary(file => { fileInput.value = ''; assign(file); }));

      const read = (): InstanceAdjustment => instanceCorrections.get(id)?.[instance.id] ?? neutralAdjustment;

      function write(adjustment: InstanceAdjustment) {
        instanceCorrections.set(id, { ...instanceCorrections.get(id), [instance.id]: adjustment });
        failures.delete(id);
        renderState();
      }

      function geometry() {
        const framing = placement(id);
        const modelPlacement = !instance.framing && framing.mode === 'custom' ? combinePlacement(framing.global, framing.local) : null;
        return instanceGeometry(
          { width: picture.naturalWidth, height: picture.naturalHeight }, instance.input, instance.calibration, modelPlacement, read(),
        );
      }

      tile.addEventListener('input', event => {
        const input = event.target as HTMLInputElement;
        const key = input.dataset.control as Control;
        if (key) write({ ...read(), [key]: Number(input.value) });
      });
      fitSelect.addEventListener('change', () => {
        const { fit: _, ...adjustment } = read();
        const chosen = fitSelect.value;
        write(chosen === 'contain' || chosen === 'cover' ? { ...adjustment, fit: chosen } : adjustment);
      });
      tile.querySelector('[data-mug-center]')!.addEventListener('click', () =>
        write({ ...read(), offsetX: 0, offsetY: 0, centered: true }));
      tile.querySelector('[data-mug-reset]')!.addEventListener('click', () => write(neutralAdjustment));

      let drag: { x: number; y: number; adjustment: InstanceAdjustment; width: number; height: number } | undefined;
      surface.addEventListener('pointerdown', event => {
        if (event.button !== 0 || rendering || zipping || !picture.naturalWidth) return;
        const { frame } = geometry();
        drag = {
          x: event.clientX, y: event.clientY, adjustment: read(),
          width: surface.clientWidth * frame.width / instance.input.width,
          height: surface.clientHeight * frame.height / instance.input.height,
        };
        surface.setPointerCapture(event.pointerId);
      });
      surface.addEventListener('pointermove', event => {
        if (!drag || rendering || zipping) return;
        write({
          ...drag.adjustment,
          offsetX: clamp(drag.adjustment.offsetX + (event.clientX - drag.x) / drag.width * 100),
          offsetY: clamp(drag.adjustment.offsetY + (event.clientY - drag.y) / drag.height * 100),
        });
      });
      surface.addEventListener('lostpointercapture', () => { drag = undefined; });
      surface.addEventListener('keydown', event => {
        const delta = directions[event.key];
        if (!delta || rendering || zipping || !picture.naturalWidth) return;
        event.preventDefault();
        const current = read();
        const step = event.shiftKey ? 5 : 1;
        write({ ...current, offsetX: clamp(current.offsetX + delta[0] * step), offsetY: clamp(current.offsetY + delta[1] * step) });
      });

      editors.append(tile);
      function refreshTile() {
        const adjustment = read();
        showControls(tile, adjustment);
        fitSelect.value = adjustment.fit ?? '';
        const specific = sources.get(instance.id);
        const url = specific?.url ?? artUrl;
        clear.hidden = !specific;
        if (!url) {
          picture.removeAttribute('src');
          return;
        }
        if (picture.getAttribute('src') !== url) {
          picture.src = url;
          return;
        }
        if (!picture.complete || !picture.naturalWidth) return;
        const { frame, rect } = geometry();
        const position = (node: HTMLElement, box: typeof rect, bounds: { width: number; height: number }) => {
          node.style.left = `${box.x / bounds.width * 100}%`;
          node.style.top = `${box.y / bounds.height * 100}%`;
          node.style.width = `${box.width / bounds.width * 100}%`;
          node.style.height = `${box.height / bounds.height * 100}%`;
        };
        position(clip, frame, instance.input);
        position(picture, rect, frame);
      }
      picture.addEventListener('load', refreshTile);
      return refreshTile;
    });

    instanceEditors.set(id, () => refresh.forEach(update => update()));
  }

  function ensureCard(model: HTMLOptionElement) {
    const id = model.value;
    const existing = cards.get(id);
    if (existing) return existing;
    const card = template.content.firstElementChild!.cloneNode(true) as HTMLElement;
    card.dataset.model = id;
    setupInstanceEditor(id, card, model);
    const local = card.querySelector<HTMLFieldSetElement>('[data-local]')!;
    showControls(local, localFor(id));
    local.addEventListener('input', event => {
      const input = event.target as HTMLInputElement;
      const key = input.dataset.control as Control;
      if (!key) return;
      corrections.set(id, { ...localFor(id), [key]: Number(input.value) });
      showControls(local, localFor(id));
      failures.delete(id);
      renderState();
    });
    const reset = () => {
      corrections.delete(id);
      showControls(local, localFor(id));
      failures.delete(id);
      renderState();
    };
    local.querySelector('[data-local-reset]')!.addEventListener('click', reset);
    local.querySelector('[data-local-apply]')!.addEventListener('click', () => { reset(); void render(); });
    local.querySelector('[data-local-render]')!.addEventListener('click', () => void render());
    cards.set(id, card);
    gallery.append(card);
    return card;
  }

  async function render() {
    const model = selected();
    const id = model.value;
    if (rendering || zipping || current(id)) return;
    showError('');
    const overrides = slotFiles.get(id);
    if (!allArtwork && !overrides?.size) {
      showError('Escolha uma arte para todos os espaços ou carregue uma em cada recorte.');
      upload.focus();
      return;
    }
    rendering = true;
    fields.disabled = true;
    resultImage.setAttribute('aria-busy', 'true');
    status.textContent = `Gerando ${model.text}…`;
    failures.delete(id);
    renderState();
    try {
      const key = JSON.stringify(placement(id));
      const body = new FormData();
      if (allArtwork) body.set('artwork', allArtwork);
      for (const [slot, source] of overrides ?? []) body.set('artwork-' + slot, source.file);
      body.set('model', id);
      body.set('placement', key);
      const response = await fetch(form.action, { method: 'POST', body, signal: AbortSignal.timeout(60_000) });
      if (!response.ok || response.headers.get('Content-Type') !== 'image/png') {
        const detail = await response.json().catch(() => null);
        throw new Error(detail?.error ?? 'Geração indisponível.');
      }
      const blob = await response.blob();
      const previous = results.get(id);
      if (previous) URL.revokeObjectURL(previous.url);
      results.set(id, { name: `mockup-canecas-${id}.png`, blob, url: URL.createObjectURL(blob), key });
    } catch (err) {
      failures.set(id, err instanceof Error ? err.message : 'Geração indisponível.');
    } finally {
      rendering = false;
      fields.disabled = false;
      resultImage.removeAttribute('aria-busy');
      renderState();
    }
  }

  function assignAll(file?: File) {
    if (file && file.size > maxMugArtworkBytes) {
      showError('A arte deve ter até 8 MB.');
      return;
    }
    allArtwork = file;
    if (artUrl) URL.revokeObjectURL(artUrl);
    artUrl = file ? URL.createObjectURL(file) : '';
    art.removeAttribute('src');
    art.hidden = true;
    empty.hidden = false;
    if (artUrl) art.src = artUrl;
    for (const result of results.values()) URL.revokeObjectURL(result.url);
    results.clear();
    const sources = slotFiles.get(selected().value);
    if (sources) {
      for (const entry of sources.values()) URL.revokeObjectURL(entry.url);
      sources.clear();
    }
    for (const input of ensureCard(selected()).querySelectorAll<HTMLInputElement>('[data-slot-upload]')) input.value = '';
    failures.clear();
    showError('');
    renderState();
  }
  upload.addEventListener('change', () => assignAll(upload.files?.[0]));
  form.querySelector('[data-all-library]')!.addEventListener('click', () =>
    void openLibrary(file => { upload.value = ''; assignAll(file); }));
  form.querySelector('[data-distribute]')!.addEventListener('click', () => {
    const id = selected().value;
    instanceCorrections.delete(id);
    corrections.delete(id);
    showControls(ensureCard(selected()).querySelector('[data-local]')!, neutralAdjustment);
    renderState();
  });
  art.addEventListener('load', () => { drawFrame(); renderState(); });
  art.addEventListener('error', () => showError('Não foi possível abrir a arte no editor.'));

  fit.addEventListener('change', () => {
    const mode = fit.value;
    if (mode === 'contain' || mode === 'cover') global = { ...global, fit: mode };
    if (mode === 'original') restoreOriginal();
    updateGlobal();
  });
  globalControls.addEventListener('input', event => {
    const input = event.target as HTMLInputElement;
    const key = input.dataset.control as Control;
    if (!key) return;
    global = { ...global, [key]: Number(input.value) };
    setManual();
    updateGlobal();
  });
  globalControls.querySelectorAll<HTMLButtonElement>('[data-preset]').forEach(button => {
    button.addEventListener('click', () => {
      switch (button.dataset.preset) {
        case 'original':
          restoreOriginal();
          break;
        case 'reset':
        case 'contain':
        case 'cover':
          global = { ...neutralAdjustment, fit: button.dataset.preset === 'cover' ? 'cover' : 'contain' };
          fit.value = global.fit;
          break;
        case 'center':
          global = { ...global, offsetX: 0, offsetY: 0 };
          setManual();
          break;
        case 'zoom':
          global = { ...global, zoom: 100 };
          setManual();
      }
      updateGlobal();
    });
  });

  function move(x: number, y: number) {
    global = { ...global, offsetX: clamp(x), offsetY: clamp(y) };
    setManual();
    updateGlobal();
  }
  let drag: { id: number; x: number; y: number; offsetX: number; offsetY: number } | undefined;
  surface.addEventListener('pointerdown', event => {
    if (!art.naturalWidth || fields.disabled || event.button !== 0) return;
    drag = { id: event.pointerId, x: event.clientX, y: event.clientY, offsetX: global.offsetX, offsetY: global.offsetY };
    surface.setPointerCapture(event.pointerId);
  });
  surface.addEventListener('pointermove', event => {
    if (!drag || drag.id !== event.pointerId || fields.disabled) return;
    move(drag.offsetX + 100 * (event.clientX - drag.x) / surface.clientWidth,
      drag.offsetY + 100 * (event.clientY - drag.y) / surface.clientHeight);
  });
  surface.addEventListener('lostpointercapture', () => { drag = undefined; });
  surface.addEventListener('keydown', event => {
    const direction = directions[event.key];
    if (!direction || !art.naturalWidth || fields.disabled) return;
    event.preventDefault();
    const step = event.shiftKey ? 5 : 1;
    move(global.offsetX + direction[0] * step, global.offsetY + direction[1] * step);
  });

  modelSelect.addEventListener('change', () => { ensureCard(selected()); renderState(); });
  form.addEventListener('submit', event => { event.preventDefault(); void render(); });
  async function exportFiles(entries: Result[], archive: boolean) {
    if (rendering || zipping) return;
    showError('');
    zipping = true;
    fields.disabled = true;
    renderState();
    try {
      const files = [];
      for (const entry of entries) files.push(await encodeMugExport(entry, format.value as MugExportFormat));
      downloadMugFile(archive ? { name: 'mockups-canecas.zip', blob: await createMugMockupZip(files) } : files[0]);
    } catch (err) {
      showError(err instanceof Error ? err.message : 'Não foi possível exportar o mockup.');
    } finally {
      zipping = false;
      fields.disabled = false;
      renderState();
    }
  }
  format.addEventListener('change', renderState);
  zip.addEventListener('click', () => {
    const result = current(selected().value);
    if (result) void exportFiles([result], true);
  });
  resultDownload.addEventListener('click', () => {
    const result = current(selected().value);
    if (result) void exportFiles([result], false);
  });
  ensureCard(selected());
  renderState();
}
