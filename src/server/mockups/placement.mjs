/** @typedef {{zoom: number, offsetX: number, offsetY: number}} Adjustment */
/** @typedef {{fit: 'contain' | 'cover'} & Adjustment} Frame */
/** @typedef {Adjustment & {fit?: Frame['fit'], centered?: boolean}} InstanceAdjustment */
/** @typedef {Record<string, InstanceAdjustment>} InstanceAdjustments */
/** @typedef {({mode: 'original'} | {mode: 'custom', global: Frame, local: Adjustment}) & {instances?: InstanceAdjustments}} Placement */

export const mugFrame = { width: 20, height: 9 };
export const neutralAdjustment = { zoom: 100, offsetX: 0, offsetY: 0 };
export const placementLimits = { zoomMin: 25, zoomMax: 300, offset: 100 };

/** @param {InstanceAdjustment | undefined} adjustment */
export function hasAdjustment(adjustment) {
  return Boolean(adjustment && (adjustment.fit || adjustment.centered || adjustment.zoom !== 100 || adjustment.offsetX !== 0 || adjustment.offsetY !== 0));
}

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

/** @param {{width: number, height: number}} art
 * @param {{width: number, height: number}} input
 * @param {{fit: Frame['fit'], scale: number, anchorX: number, anchorY: number}} calibration
 * @param {Frame | null} model
 * @param {InstanceAdjustment} [individual]
 */
export function instanceGeometry(art, input, calibration, model, individual = neutralAdjustment) {
  const anchor = individual.centered ? { ...calibration, anchorX: 0.5, anchorY: 0.5 } : calibration;
  if (model) {
    const frame = slotFrame(input, calibration);
    const placement = combinePlacement(model, individual);
    return { frame, rect: framedArtwork(art, frame, {
      ...placement, fit: individual.fit ?? placement.fit,
    }, anchor) };
  }
  const frame = { ...input, x: 0, y: 0 };
  const ratio = (individual.fit ?? calibration.fit) === 'contain' ? Math.min : Math.max;
  const scale = ratio(input.width / art.width, input.height / art.height)
    * calibration.scale * individual.zoom / 100;
  if (!hasAdjustment(individual)) {
    const width = Math.max(1, Math.round(art.width * scale));
    const height = Math.max(1, Math.round(art.height * scale));
    return { frame, rect: {
      width, height,
      x: Math.round((input.width - width) * calibration.anchorX),
      y: Math.round((input.height - height) * calibration.anchorY),
    } };
  }
  const width = art.width * scale;
  const height = art.height * scale;
  return { frame, rect: {
    width, height,
    x: (input.width - width) * anchor.anchorX + input.width * individual.offsetX / 100,
    y: (input.height - height) * anchor.anchorY + input.height * individual.offsetY / 100,
  } };
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

/** @param {string} json @param {string[]} [allowedInstances] @returns {Placement} */
export function parseMugPlacement(json, allowedInstances = []) {
  const value = JSON.parse(json);
  if (value && typeof value === 'object' && !Array.isArray(value)) {
    const { instances, ...base } = value;
    const validInstances = !Object.hasOwn(value, 'instances') || (
      instances && typeof instances === 'object' && !Array.isArray(instances)
      && Object.entries(instances).every(([id, adjustment]) => {
        if (!allowedInstances.includes(id) || !adjustment || typeof adjustment !== 'object') return false;
        const keys = ['zoom', 'offsetX', 'offsetY'];
        if (Object.hasOwn(adjustment, 'fit')) {
          if (!['contain', 'cover'].includes(adjustment.fit)) return false;
          keys.push('fit');
        }
        if (Object.hasOwn(adjustment, 'centered')) {
          if (typeof adjustment.centered !== 'boolean') return false;
          keys.push('centered');
        }
        return validAdjustment(adjustment, keys);
      })
    );
    if (validInstances && hasKeys(base, ['mode']) && base.mode === 'original') return value;
    if (validInstances && hasKeys(base, ['mode', 'global', 'local']) && base.mode === 'custom'
      && validAdjustment(base.global, ['fit', 'zoom', 'offsetX', 'offsetY'])
      && ['contain', 'cover'].includes(base.global.fit)
      && validAdjustment(base.local, ['zoom', 'offsetX', 'offsetY'])) return value;
  }
  throw new RangeError('Enquadramento inválido.');
}
