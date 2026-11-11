export interface PanLimits {
  minX: number;
  maxX: number;
  minY: number;
  maxY: number;
}

export interface TouchPoint {
  clientX: number;
  clientY: number;
}

export const MIN_ZOOM = 1.0;
export const MAX_ZOOM = 4.0;
export const DEFAULT_STEP = 0.5;

export function clampZoom(
  scale: number,
  minZoom = MIN_ZOOM,
  maxZoom = MAX_ZOOM
): number {
  if (scale < minZoom) return minZoom;
  if (scale > maxZoom) return maxZoom;
  return Number(scale.toFixed(3));
}

export function calcZoomStep(
  currentScale: number,
  direction: 'in' | 'out',
  step = DEFAULT_STEP,
  minZoom = MIN_ZOOM,
  maxZoom = MAX_ZOOM
): number {
  const delta = direction === 'in' ? step : -step;
  return clampZoom(currentScale + delta, minZoom, maxZoom);
}

export function calcWheelZoom(
  currentScale: number,
  deltaY: number,
  minZoom = MIN_ZOOM,
  maxZoom = MAX_ZOOM
): number {
  const factor = deltaY < 0 ? 0.25 : -0.25;
  return clampZoom(currentScale + factor, minZoom, maxZoom);
}

export function calculatePanLimits(
  scale: number,
  containerWidth: number,
  containerHeight: number
): PanLimits {
  if (scale <= 1.0) {
    return { minX: 0, maxX: 0, minY: 0, maxY: 0 };
  }

  const overflowX = (containerWidth * (scale - 1)) / 2;
  const overflowY = (containerHeight * (scale - 1)) / 2;

  return {
    minX: -overflowX,
    maxX: overflowX,
    minY: -overflowY,
    maxY: overflowY,
  };
}

export function clampPan(
  x: number,
  y: number,
  limits: PanLimits
): { x: number; y: number } {
  const clampedX = Math.min(Math.max(x, limits.minX), limits.maxX);
  const clampedY = Math.min(Math.max(y, limits.minY), limits.maxY);
  return { x: clampedX, y: clampedY };
}

export function calcTouchDistance(
  touch1: TouchPoint,
  touch2: TouchPoint
): number {
  const deltaX = touch2.clientX - touch1.clientX;
  const deltaY = touch2.clientY - touch1.clientY;
  return Math.hypot(deltaX, deltaY);
}

export function calcPinchScale(
  initialScale: number,
  initialDistance: number,
  currentDistance: number,
  minZoom = MIN_ZOOM,
  maxZoom = MAX_ZOOM
): number {
  if (initialDistance <= 0) return initialScale;
  const ratio = currentDistance / initialDistance;
  return clampZoom(initialScale * ratio, minZoom, maxZoom);
}

