import { buildWhatsAppLink } from './whatsapp';

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

export function setupMockupQuote(
  button: HTMLButtonElement,
  status: HTMLElement,
  link: HTMLAnchorElement,
  capture: () => { imageBase64: string; productName: string; details: string },
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
      const { imageBase64, productName, details } = capture();
      const response = await fetch('/api/mockup/save', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ imageBase64 }),
      });
      const data = await response.json();
      if (!response.ok || typeof data?.fullUrl !== 'string') throw new Error('Falha na exportação');
      if (requestRevision !== revision) return;

      link.href = buildWhatsAppLink({
        customMessage: [
          'Olá, equipe 678 Estudio! Gostaria de um orçamento para a peça que personalizei no site.',
          `• Produto: *${productName}*`,
          details,
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
