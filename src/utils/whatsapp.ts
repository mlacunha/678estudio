export interface WhatsAppMessageParams {
  phoneNumber: string;
  productName?: string;
  categoryTitle?: string;
  mockupUrl?: string;
  customMessage?: string;
}

export const DEFAULT_STUDIO_PHONE = "5511999999999";

export function formatWhatsAppMessage(params: WhatsAppMessageParams): string {
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

export function buildWhatsAppLink(params: Partial<WhatsAppMessageParams> = {}): string {
  const rawPhone = params.phoneNumber || DEFAULT_STUDIO_PHONE;
  const sanitizedPhone = rawPhone.replace(/\D/g, "");

  const message = formatWhatsAppMessage({
    phoneNumber: sanitizedPhone,
    productName: params.productName,
    categoryTitle: params.categoryTitle,
    mockupUrl: params.mockupUrl,
    customMessage: params.customMessage,
  });

  return `https://wa.me/${sanitizedPhone}?text=${encodeURIComponent(message)}`;
}

