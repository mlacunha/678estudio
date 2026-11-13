import { buildWhatsAppQuotePath, WHATSAPP_UNAVAILABLE } from './whatsapp';
import type { ArtProductType } from './artLibrary';

export interface MockupArtReference {
  arteId: string;
  version: number;
  product: ArtProductType;
  scale: number;
  posX: number;
  posY: number;
  printWidthCm?: number;
}

export async function loadArtwork(file: File): Promise<HTMLImageElement> {
  const image = new Image();
  const objectUrl = URL.createObjectURL(file);
  try {
    image.src = objectUrl;
    await image.decode();
    return image;
  } finally {
    URL.revokeObjectURL(objectUrl);
  }
}

/** Carrega uma prévia de arte da biblioteca pela URL na mesma origem. */
export async function loadImageFromUrl(url: string): Promise<HTMLImageElement> {
  const image = new Image();
  image.src = url;
  await image.decode();
  return image;
}

export function setupMockupQuote(
  button: HTMLButtonElement,
  status: HTMLElement,
  link: HTMLAnchorElement,
  capture: () => { imageBase64: string; productName: string; details: string; artReference?: MockupArtReference },
) {
  let revision = 0;
  let generating = false;
  let loadingArtwork = false;
  const syncButton = () => { button.disabled = generating || loadingArtwork; };
  const setArtworkPending = (pending: boolean) => {
    loadingArtwork = pending;
    syncButton();
  };
  const invalidate = () => {
    revision += 1;
    link.hidden = true;
    link.removeAttribute('href');
    status.textContent = '';
  };

  button.addEventListener('click', async () => {
    invalidate();
    const requestRevision = revision;
    generating = true;
    syncButton();
    status.textContent = 'Gerando prévia…';

    try {
      const { imageBase64, productName, details, artReference } = capture();
      const response = await fetch('/api/mockup/save', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ imageBase64, ...(artReference ? { artReference } : {}) }),
      });
      const data = await response.json();
      if (!response.ok || typeof data?.fullUrl !== 'string') throw new Error('Falha na exportação');
      if (requestRevision !== revision) return;

      if (!data.whatsappAvailable) {
        status.textContent = `Prévia pronta. ${WHATSAPP_UNAVAILABLE}`;
        return;
      }

      const artLines = data.verifiedArt
        ? [
            `• Arte da biblioteca: [${data.verifiedArt.code}] ${data.verifiedArt.title} (v${data.verifiedArt.version})`,
            `• ID da arte: ${data.verifiedArt.arteId}`,
          ]
        : [];

      link.href = buildWhatsAppQuotePath({
        customMessage: [
          'Olá, equipe 678 Estudio! Gostaria de um orçamento para a peça que personalizei no site.',
          `• Produto: *${productName}*`,
          details,
          ...artLines,
          `• Link da prévia: ${data.fullUrl}`,
        ].join('\n'),
      });
      link.hidden = false;
      status.textContent = 'Prévia pronta. Abra o WhatsApp para enviar a solicitação.';
    } catch {
      if (requestRevision === revision) status.textContent = 'Não foi possível gerar a prévia. Tente novamente.';
    } finally {
      generating = false;
      syncButton();
    }
  });

  return { invalidate, setArtworkPending };
}
