import { loadArtwork } from './customizerClient';

const QUALITY = 0.82;
const MAX_ART_BYTES = 10 * 1024 * 1024;

export async function loadStudioArtwork(file: File): Promise<HTMLImageElement> {
  if (!file.size || file.size > MAX_ART_BYTES || !['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
    throw new Error('Envie uma arte JPG, PNG ou WebP de até 10 MB.');
  }
  return loadArtwork(file);
}

function webp(source: HTMLCanvasElement, maxSide: number, square: boolean): Promise<Blob> {
  const scale = Math.min(1, maxSide / Math.max(source.width, source.height));
  const width = Math.round(source.width * scale);
  const height = Math.round(source.height * scale);
  const canvas = document.createElement('canvas');
  canvas.width = square ? Math.max(width, height) : width;
  canvas.height = square ? canvas.width : height;
  const context = canvas.getContext('2d', { alpha: false });
  if (!context) throw new Error('Não foi possível preparar a imagem.');
  context.fillStyle = '#262422';
  context.fillRect(0, 0, canvas.width, canvas.height);
  context.imageSmoothingQuality = 'high';
  context.drawImage(source, Math.floor((canvas.width - width) / 2), Math.floor((canvas.height - height) / 2), width, height);

  return new Promise((resolve, reject) => {
    canvas.toBlob(blob => {
      if (blob?.type === 'image/webp') resolve(blob);
      else reject(new Error('Este navegador não conseguiu exportar WebP.'));
    }, 'image/webp', QUALITY);
  });
}

export function setupStudioPublication(form: HTMLFormElement, capture: () => HTMLCanvasElement, hasArtwork: () => boolean) {
  const generate = form.querySelector<HTMLButtonElement>('[data-studio-generate]')!;
  const save = form.querySelector<HTMLButtonElement>('[data-studio-save]')!;
  const result = form.querySelector<HTMLElement>('[data-studio-result]')!;
  const status = form.querySelector<HTMLElement>('[data-studio-status]')!;
  const thumbnailPreview = form.querySelector<HTMLImageElement>('[data-studio-thumbnail]')!;
  const largePreview = form.querySelector<HTMLImageElement>('[data-studio-large]')!;
  const product = form.elements.namedItem('productId') as HTMLSelectElement;
  const confirmed = form.elements.namedItem('confirmed') as HTMLInputElement;
  let images: { thumbnail: Blob; large: Blob } | undefined;
  let revision = 0;
  let artworkPending = false;
  let generating = false;
  let publishing = false;

  const sync = () => {
    generate.disabled = !hasArtwork() || artworkPending || generating || publishing;
    save.disabled = !images || !product.value || !confirmed.checked || publishing;
    product.disabled = publishing;
    confirmed.disabled = publishing;
  };
  const invalidate = () => {
    revision++;
    images = undefined;
    for (const preview of [thumbnailPreview, largePreview]) {
      if (preview.hasAttribute('src')) URL.revokeObjectURL(preview.src);
      preview.removeAttribute('src');
    }
    result.hidden = true;
    confirmed.checked = false;
    status.textContent = hasArtwork() ? 'Gere uma prévia para revisar antes de publicar.' : 'Carregue uma arte para gerar a prévia.';
    sync();
  };

  product.addEventListener('change', () => {
    confirmed.checked = false;
    sync();
  });
  confirmed.addEventListener('change', sync);
  generate.addEventListener('click', async () => {
    invalidate();
    const current = revision;
    generating = true;
    status.textContent = 'Preparando a prévia…';
    sync();
    try {
      const source = capture();
      const [thumbnail, large] = await Promise.all([webp(source, 480, true), webp(source, 1200, false)]);
      if (current !== revision) return;
      images = { thumbnail, large };
      thumbnailPreview.src = URL.createObjectURL(thumbnail);
      largePreview.src = URL.createObjectURL(large);
      result.hidden = false;
      status.textContent = 'Prévia pronta. Confira as duas versões antes de salvar.';
    } catch (error) {
      if (current === revision) status.textContent = error instanceof Error ? error.message : 'Não foi possível gerar a prévia.';
    } finally {
      generating = false;
      sync();
    }
  });
  form.addEventListener('submit', async event => {
    event.preventDefault();
    if (!images || !product.value || !confirmed.checked || publishing) return;
    const option = product.selectedOptions[0];
    const body = new FormData(form);
    body.set('previousImage', option.dataset.image ?? '');
    body.set('thumbnail', images.thumbnail, 'thumbnail.webp');
    body.set('large', images.large, 'large.webp');
    publishing = true;
    status.textContent = 'Salvando no catálogo…';
    sync();
    try {
      const response = await fetch('/admin/estudio/publicar', { method: 'POST', body });
      const data = await response.json().catch(() => null);
      if (!response.ok || typeof data?.imageUrl !== 'string') {
        throw new Error(data?.error ?? 'Não foi possível salvar. Atualize o painel e tente novamente.');
      }
      option.dataset.image = data.imageUrl;
      confirmed.checked = false;
      status.textContent = `Imagem de ${option.textContent} atualizada no catálogo.`;
    } catch (error) {
      status.textContent = error instanceof Error ? error.message : 'Não foi possível salvar a imagem.';
    } finally {
      publishing = false;
      sync();
    }
  });
  sync();
  return { invalidate, setArtworkPending(pending: boolean) { artworkPending = pending; sync(); } };
}
