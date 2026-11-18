/** @typedef {{zoom: number, offsetX: number, offsetY: number}} Adjustment */
/** @typedef {{fit: 'contain' | 'cover'} & Adjustment} Frame */
/** @typedef {{mode: 'original'} | {mode: 'custom', global: Frame, local: Adjustment}} Placement */

export const mugFrame = { width: 20, height: 9 };
export const neutralAdjustment = { zoom: 100, offsetX: 0, offsetY: 0 };
export const placementLimits = { zoomMin: 25, zoomMax: 300, offset: 100 };

/** @param {Frame} global @param {Adjustment} local @returns {Frame} */
export function combinePlacement(global, local) {
  return {
    fit: global.fit,
    zoom: global.zoom * local.zoom / 100,
    offsetX: global.offsetX + local.offsetX,
    offsetY: global.offsetY + local.offsetY,
  };
}

/**
 * Compute an aspect-preserving rectangle in frame units.
 * Native slot anchors distribute overflow while the editor uses the centered reference.
 * @param {{width: number, height: number}} artwork
 * @param {{width: number, height: number}} frame
 * @param {Frame} placement
 * @param {{anchorX?: number, anchorY?: number, scale?: number}} calibration
 */
export function framedArtwork(artwork, frame, placement, calibration = {}) {
  const ratios = [frame.width / artwork.width, frame.height / artwork.height];
  const fit = placement.fit === 'contain' ? Math.min(...ratios) : Math.max(...ratios);
  const scale = fit * placement.zoom / 100 * (calibration.scale ?? 1);
  const width = artwork.width * scale;
  const height = artwork.height * scale;
  const excessX = frame.width - width;
  const excessY = frame.height - height;
  return {
    width, height,
    x: excessX / 2 + Math.min(0, excessX) * ((calibration.anchorX ?? 0.5) - 0.5) + frame.width * placement.offsetX / 100,
    y: excessY / 2 + Math.min(0, excessY) * ((calibration.anchorY ?? 0.5) - 0.5) + frame.height * placement.offsetY / 100,
  };
}

export function slotFrame(slot, calibration) {
  const scale = Math.min(slot.width / mugFrame.width, slot.height / mugFrame.height);
  const width = Math.round(mugFrame.width * scale);
  const height = Math.round(mugFrame.height * scale);
  return {
    width, height,
    x: Math.round((slot.width - width) * calibration.anchorX),
    y: Math.round((slot.height - height) * calibration.anchorY),
  };
}

function hasKeys(value, keys) {
  return value !== null && typeof value === 'object' && !Array.isArray(value)
    && Object.keys(value).length === keys.length && keys.every(key => Object.hasOwn(value, key));
}

function inRange(value, min, max) {
  return Number.isFinite(value) && value >= min && value <= max;
}

function validAdjustment(value, keys) {
  const { zoomMin, zoomMax, offset } = placementLimits;
  return hasKeys(value, keys) && inRange(value.zoom, zoomMin, zoomMax)
    && inRange(value.offsetX, -offset, offset) && inRange(value.offsetY, -offset, offset);
}

/** @param {string} json @returns {Placement} */
export function parseMugPlacement(json) {
  const value = JSON.parse(json);
  if (hasKeys(value, ['mode']) && value.mode === 'original') return value;
  if (hasKeys(value, ['mode', 'global', 'local']) && value.mode === 'custom'
    && validAdjustment(value.global, ['fit', 'zoom', 'offsetX', 'offsetY'])
    && ['contain', 'cover'].includes(value.global.fit)
    && validAdjustment(value.local, ['zoom', 'offsetX', 'offsetY'])) return value;
  throw new RangeError('Enquadramento inválido.');
}
