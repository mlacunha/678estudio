import { maxMugArtworkBytes } from '../server/mockups/options.mjs';
import { createMugMockupZip } from './mugMockupZip';

export function initMugMockupAdmin() {
  const form = document.querySelector<HTMLFormElement>('#mug-mockup-form')!;
  const fields = document.querySelector<HTMLFieldSetElement>('#mug-mockup-fields')!;
  const upload = document.querySelector<HTMLInputElement>('#mug-artwork')!;
  const error = document.querySelector<HTMLParagraphElement>('#mug-mockup-error')!;
  const status = document.querySelector<HTMLParagraphElement>('#mug-mockup-status')!;
  const gallery = document.querySelector<HTMLDivElement>('#mug-mockup-results')!;
  const zip = document.querySelector<HTMLButtonElement>('#mug-download-zip')!;
  const template = document.querySelector<HTMLTemplateElement>('#mug-mockup-result')!;
  const results: { name: string; blob: Blob; url: string }[] = [];

  function showError(message: string) {
    error.textContent = message;
    error.hidden = !message;
  }

  function appendResult(model: HTMLInputElement, blob: Blob) {
    const name = 'mockup-canecas-' + model.value + '.png';
    const url = URL.createObjectURL(blob);
    const figure = template.content.cloneNode(true) as DocumentFragment;
    const label = model.dataset.label ?? 'Mockup de canecas';
    const img = figure.querySelector('img')!;
    const link = figure.querySelector('a')!;
    img.src = url;
    img.alt = label;
    figure.querySelector('span')!.textContent = label;
    link.href = url;
    link.download = name;
    link.setAttribute('aria-label', 'Baixar PNG: ' + label);
    gallery.append(figure);
    results.push({ name, blob, url });
  }

  form.addEventListener('submit', async event => {
    event.preventDefault();
    if (fields.disabled || zip.disabled) return;
    showError('');
    const artwork = upload.files?.[0];
    const models = [...form.querySelectorAll<HTMLInputElement>('input[name=model]:checked')];
    if (!artwork || artwork.size > maxMugArtworkBytes) {
      showError('Selecione uma arte de até 8 MB.');
      upload.focus();
      return;
    }
    if (!models.length) {
      showError('Selecione pelo menos um modelo.');
      form.querySelector<HTMLInputElement>('input[name=model]')?.focus();
      return;
    }

    for (const result of results) URL.revokeObjectURL(result.url);
    results.length = 0;
    gallery.replaceChildren();
    zip.hidden = true;
    fields.disabled = true;
    gallery.setAttribute('aria-busy', 'true');
    const failed: string[] = [];
    try {
      for (const [index, model] of models.entries()) {
        status.textContent = `Gerando ${index + 1} de ${models.length}…`;
        try {
          const body = new FormData();
          body.set('artwork', artwork);
          body.set('model', model.value);
          const response = await fetch(form.action, {
            method: 'POST', body, signal: AbortSignal.timeout(60_000),
          });
          if (!response.ok || response.headers.get('Content-Type') !== 'image/png') {
            const detail = await response.json().catch(() => null);
            throw new Error(detail?.error ?? 'Geração indisponível.');
          }
          appendResult(model, await response.blob());
        } catch (err) {
          const detail = err instanceof Error ? err.message : 'Geração indisponível.';
          failed.push(`${model.dataset.label} — ${detail}`);
        }
      }
      status.textContent = results.length === 1 ? '1 mockup gerado.' : `${results.length} mockups gerados.`;
      showError(failed.join(' '));
      zip.hidden = !results.length;
    } finally {
      fields.disabled = false;
      gallery.removeAttribute('aria-busy');
    }
  });

  zip.addEventListener('click', async () => {
    if (!results.length || zip.disabled) return;
    zip.disabled = true;
    try {
      const archive = await createMugMockupZip(results);
      const url = URL.createObjectURL(archive);
      const link = document.createElement('a');
      link.href = url;
      link.download = 'mockups-canecas.zip';
      link.click();
      setTimeout(() => URL.revokeObjectURL(url), 60_000);
    } catch {
      showError('Não foi possível criar o ZIP. Os PNGs continuam disponíveis.');
    } finally {
      zip.disabled = false;
    }
  });
}
