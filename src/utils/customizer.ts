export interface Dimensions {
  widthCm: number;
  heightCm: number;
}

export const MUG_PRINT_DIMENSIONS: Dimensions = {
  widthCm: 20,
  heightCm: 9,
};

export const FRAME_DIMENSIONS: Dimensions = {
  widthCm: 30,
  heightCm: 40,
};

export function getAspectRatio(dimensions: Dimensions): number {
  if (dimensions.heightCm <= 0) return 1;
  return Number((dimensions.widthCm / dimensions.heightCm).toFixed(4));
}

export function clampValue(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

export function calculateBoundedOffset(offset: number, range: number): number {
  return clampValue(offset, -range, range);
}

export function buildMockupWhatsAppMessage(productTitle: string, mockupUrl: string): string {
  const lines = [
    `Olá, equipe 678 Estudio! Acabei de personalizar uma peça pelo simulador do site:`,
    `• Produto: *${productTitle}*`,
    `• Mockup gerado: ${mockupUrl}`,
    `Gostaria de consultar o valor final e o prazo de produção para este modelo.`
  ];
  return lines.join('\n');
}

