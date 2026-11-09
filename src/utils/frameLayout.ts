import { clampValue, FRAME_DIMENSIONS } from './customizer';

export const FRAME_ORIENTATIONS = {
  portrait: { label: 'Retrato', ...FRAME_DIMENSIONS },
  landscape: { label: 'Paisagem', widthCm: FRAME_DIMENSIONS.heightCm, heightCm: FRAME_DIMENSIONS.widthCm },
} as const;

export const FRAME_COLORS = {
  black: { label: 'Preta', fill: '#121316', edge: '#2a2d33' },
  white: { label: 'Branca', fill: '#f1eee8', edge: '#bdb8ae' },
  brown: { label: 'Marrom', fill: '#583a2c', edge: '#785440' },
} as const;

export const FRAME_MARGINS = { min: 0.5, max: 8, step: 0.5, horizontal: 5, vertical: 2 } as const;
export type FrameOrientation = keyof typeof FRAME_ORIENTATIONS;

export function getFrameLayout(orientation: FrameOrientation, horizontalCm: number, verticalCm: number) {
  const pixelsPerCm = 15;
  const { widthCm, heightCm } = FRAME_ORIENTATIONS[orientation];
  const frameW = widthCm * pixelsPerCm;
  const frameH = heightCm * pixelsPerCm;
  const inset = 30;
  const boardW = frameW - 2 * inset;
  const boardH = frameH - 2 * inset;
  const marginPixels = (cm: number) => Math.round(clampValue(cm, FRAME_MARGINS.min, FRAME_MARGINS.max) * pixelsPerCm);
  const artLeft = marginPixels(horizontalCm);
  const artTop = marginPixels(verticalCm);

  return { frameW, frameH, inset, boardW, boardH, artLeft, artTop, artW: boardW - 2 * artLeft, artH: boardH - 2 * artTop };
}
