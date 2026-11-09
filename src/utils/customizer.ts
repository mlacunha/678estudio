export interface Dimensions {
  widthCm: number;
  heightCm: number;
}

export const MUG_PRINT_WIDTHS = [20, 21, 22] as const;
export type MugPrintWidth = (typeof MUG_PRINT_WIDTHS)[number];

export const MUG_PRINT_DIMENSIONS = {
  widthCm: 21,
  heightCm: 9,
} as const;

export function getMugPrintBand(widthCm: MugPrintWidth) {
  const unitsPerCm = 0.22;
  const averageRadius = 0.97;
  const thetaLength = widthCm * unitsPerCm / averageRadius;
  // O centro da folga coincide com a alça no eixo +X (π/2).
  const thetaStart = Math.PI / 2 + (Math.PI * 2 - thetaLength) / 2;
  return { height: MUG_PRINT_DIMENSIONS.heightCm * unitsPerCm, thetaStart, thetaLength };
}

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

