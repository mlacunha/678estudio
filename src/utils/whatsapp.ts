export interface WhatsAppMessageParams {
  productName?: string;
  categoryTitle?: string;
  mockupUrl?: string;
  customMessage?: string;
}

export const WHATSAPP_UNAVAILABLE = 'O atendimento pelo WhatsApp está indisponível no momento.';

export function normalizeWhatsAppNumber(value: string): string | undefined {
  if (!/^\+?[0-9(). -]+$/.test(value)) return;
  const digits = value.replace(/\D/g, '');
  if (!/^[1-9]\d{7,14}$/.test(digits)) return;
  if (digits.startsWith('55') && !/^55[1-9]\d[2-9]\d{7,8}$/.test(digits)) return;
  return digits;
}

export function formatWhatsAppMessage(params: WhatsAppMessageParams = {}): string {
  const { productName, categoryTitle, mockupUrl, customMessage } = params;

  if (customMessage) {
    return customMessage.trim();
  }

  const lines: string[] = [
    "Olá, equipe 678 Estudio! Gostaria de um orçamento personalizado."
  ];

  if (productName) {
    lines.push(`• Produto de interesse: *${productName}*`);
  }

  if (categoryTitle) {
    lines.push(`• Categoria: *${categoryTitle}*`);
  }

  if (mockupUrl) {
    lines.push(`• Referência/Mockup: ${mockupUrl}`);
  }

  lines.push("Poderiam me passar mais informações sobre prazos e personalização?");

  return lines.join("\n");
}

export function buildWhatsAppLink(phoneNumber: string, message: string): string | undefined {
  const normalized = normalizeWhatsAppNumber(phoneNumber);
  if (normalized) return `https://wa.me/${normalized}?text=${encodeURIComponent(message)}`;
}

export function buildWhatsAppQuotePath(params: WhatsAppMessageParams = {}): string {
  return `/contato/whatsapp?text=${encodeURIComponent(formatWhatsAppMessage(params))}`;
}

