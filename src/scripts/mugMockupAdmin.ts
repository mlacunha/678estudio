import { maxMugArtworkBytes } from '../server/mockups/options.mjs';
import {
  framedArtwork, mugFrame, neutralAdjustment, placementLimits,
  type Adjustment, type Frame, type Placement,
} from '../server/mockups/placement.mjs';
import { createMugMockupZip } from './mugMockupZip';

const controlKeys = ['zoom', 'offsetX', 'offsetY'] as const;
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
  const template = document.querySelector<HTMLTemplateElement>('#mug-mockup-result')!;
  const globalControls = document.querySelector<HTMLFieldSetElement>('#mug-global-placement')!;
  const fit = document.querySelector<HTMLSelectElement>('#mug-fit')!;
  const surface = document.querySelector<HTMLDivElement>('#mug-art-frame')!;
  const art = document.querySelector<HTMLImageElement>('#mug-frame-art')!;
  const empty = document.querySelector<HTMLElement>('#mug-frame-empty')!;
  const generate = document.querySelector<HTMLButtonElement>('#mug-generate')!;
  const models = [...form.querySelectorAll<HTMLInputElement>('input[name=model]')];
  const cards = new Map<string, HTMLElement>();
  const results = new Map<string, Result>();
  const corrections = new Map<string, Adjustment>();
  const failures = new Map<string, string>();
  let global: Frame = { fit: 'contain', ...neutralAdjustment };
  let artUrl = '';
  let rendering = false;
  let zipping = false;
  let started = false;

  const selected = () => models.filter(model => model.checked);
  const localFor = (id: string) => corrections.get(id) ?? neutralAdjustment;
  const locallyAdjusted = (id: string) => controlKeys.some(key => localFor(id)[key] !== neutralAdjustment[key]);

  function placement(id: string): Placement {
    if (fit.value === 'original' && !locallyAdjusted(id)) return { mode: 'original' };
    return { mode: 'custom', global, local: localFor(id) };
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
    const selection = selected();
    const ready = selection.filter(model => current(model.value)).length;
    for (const model of models) {
      const id = model.value;
      const card = cards.get(id);
      if (!card) continue;
      card.hidden = !model.checked;
      const result = results.get(id);
      const upToDate = current(id);
      const label = card.querySelector<HTMLElement>('[data-state]')!;
      const link = card.querySelector('a')!;
      const note = failures.get(id) ?? (upToDate ? 'Prévia atualizada' : result ? 'Prévia desatualizada' : 'Aguardando prévia');
      label.textContent = locallyAdjusted(id) ? `${note} · Ajuste individual ativo` : note;
      link.hidden = !upToDate || rendering || zipping;
      if (upToDate && !rendering && !zipping) {
        link.href = upToDate.url;
        link.download = upToDate.name;
      } else {
        link.removeAttribute('href');
      }
      card.querySelector<HTMLFieldSetElement>('[data-local]')!.disabled = rendering || zipping;
      card.querySelector<HTMLButtonElement>('[data-local-render]')!.disabled = Boolean(upToDate);
    }
    zip.hidden = !started;
    zip.disabled = rendering || zipping || !selection.length || ready !== selection.length;
    generate.textContent = started ? 'Atualizar prévias selecionadas' : 'Gerar prévias';
    if (!rendering && started) status.textContent = `${ready} de ${selection.length} prévias atualizadas.`;
  }

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
    for (const card of cards.values()) showControls(card, neutralAdjustment);
  }

  function ensureCard(model: HTMLInputElement) {
    const id = model.value;
    const existing = cards.get(id);
    if (existing) return existing;
    const card = template.content.firstElementChild!.cloneNode(true) as HTMLElement;
    card.dataset.model = id;
    const label = model.dataset.label ?? 'Mockup de canecas';
    card.querySelector('h3')!.textContent = label;
    card.querySelector('img')!.alt = label;
    card.querySelector('a')!.setAttribute('aria-label', `Baixar PNG: ${label}`);
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
    local.querySelector('[data-local-apply]')!.addEventListener('click', () => { reset(); void render([model]); });
    local.querySelector('[data-local-render]')!.addEventListener('click', () => void render([model]));
    cards.set(id, card);
    gallery.append(card);
    return card;
  }

  async function render(targets: HTMLInputElement[]) {
    if (rendering || zipping) return;
    showError('');
    const artwork = upload.files?.[0];
    if (!artwork || artwork.size > maxMugArtworkBytes) {
      showError('Selecione uma arte de até 8 MB.');
      upload.focus();
      return;
    }
    if (!targets.length) {
      showError('Selecione pelo menos um modelo.');
      models[0]?.focus();
      return;
    }
    started = true;
    const pending = targets.filter(model => !current(model.value));
    rendering = true;
    fields.disabled = true;
    gallery.setAttribute('aria-busy', 'true');
    for (const model of targets) ensureCard(model);
    renderState();
    try {
      for (const [index, model] of pending.entries()) {
        const id = model.value;
        const card = ensureCard(model);
        status.textContent = `Gerando ${model.dataset.label} · ${index + 1} de ${pending.length}…`;
        failures.delete(id);
        try {
          const key = JSON.stringify(placement(id));
          const body = new FormData();
          body.set('artwork', artwork);
          body.set('model', id);
          body.set('placement', key);
          const response = await fetch(form.action, { method: 'POST', body, signal: AbortSignal.timeout(60_000) });
          if (!response.ok || response.headers.get('Content-Type') !== 'image/png') {
            const detail = await response.json().catch(() => null);
            throw new Error(detail?.error ?? 'Geração indisponível.');
          }
          const blob = await response.blob();
          const url = URL.createObjectURL(blob);
          const previous = results.get(id);
          if (previous) URL.revokeObjectURL(previous.url);
          results.set(id, { name: `mockup-canecas-${id}.png`, blob, url, key });
          const image = card.querySelector('img')!;
          image.src = url;
          image.hidden = false;
        } catch (err) {
          failures.set(id, err instanceof Error ? err.message : 'Geração indisponível.');
        }
        renderState();
      }
    } finally {
      rendering = false;
      fields.disabled = false;
      gallery.removeAttribute('aria-busy');
      renderState();
    }
  }

  upload.addEventListener('change', () => {
    if (artUrl) URL.revokeObjectURL(artUrl);
    art.removeAttribute('src');
    art.hidden = true;
    empty.hidden = false;
    const file = upload.files?.[0];
    if (file && file.size <= maxMugArtworkBytes) {
      artUrl = URL.createObjectURL(file);
      art.src = artUrl;
    }
    for (const result of results.values()) URL.revokeObjectURL(result.url);
    results.clear();
    for (const card of cards.values()) {
      const image = card.querySelector('img')!;
      image.removeAttribute('src');
      image.hidden = true;
    }
    failures.clear();
    showError('');
    renderState();
  });
  art.addEventListener('load', drawFrame);
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

  const clamp = (value: number) => Math.round(Math.max(-placementLimits.offset, Math.min(placementLimits.offset, value)));
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
    const directions: Record<string, [number, number]> = {
      ArrowLeft: [-1, 0], ArrowRight: [1, 0], ArrowUp: [0, -1], ArrowDown: [0, 1],
    };
    const direction = directions[event.key];
    if (!direction || !art.naturalWidth || fields.disabled) return;
    event.preventDefault();
    const step = event.shiftKey ? 5 : 1;
    move(global.offsetX + direction[0] * step, global.offsetY + direction[1] * step);
  });

  models.forEach(model => model.addEventListener('change', () => {
    if (started && model.checked) ensureCard(model);
    renderState();
  }));
  form.addEventListener('submit', event => { event.preventDefault(); void render(selected()); });
  zip.addEventListener('click', async () => {
    if (zip.disabled) return;
    const entries = selected().map(model => current(model.value));
    if (!entries.length || entries.some(entry => !entry)) return;
    zipping = true;
    fields.disabled = true;
    renderState();
    try {
      const archive = await createMugMockupZip(entries.filter((entry): entry is Result => Boolean(entry)));
      const url = URL.createObjectURL(archive);
      const link = document.createElement('a');
      link.href = url;
      link.download = 'mockups-canecas.zip';
      link.click();
      setTimeout(() => URL.revokeObjectURL(url), 60_000);
    } catch {
      showError('Não foi possível criar o ZIP. Os PNGs continuam disponíveis.');
    } finally {
      zipping = false;
      fields.disabled = false;
      renderState();
    }
  });
}
