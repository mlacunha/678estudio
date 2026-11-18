import { readFile } from 'node:fs/promises';
import { join, resolve } from 'node:path';
import { mugMockups } from './options.mjs';

/** @typedef {{id: string, label: string, left: number, top: number, width: number, height: number,
 * input: {width: number, height: number}, framing?: 'original',
 * calibration: {fit: 'contain' | 'cover', scale: number, anchorX: number, anchorY: number}} MugInstance */

export async function loadMugManifest(id) {
  if (!mugMockups.some(model => model.id === id)) throw new RangeError('Modelo de mockup inválido.');
  const directory = resolve('src/server/mockups/templates', id);
  const manifest = JSON.parse(await readFile(join(directory, 'manifest.json'), 'utf8'));
  return { directory, ...manifest };
}

/** @param {string} id @returns {Promise<MugInstance[]>} */
export async function getMugInstances(id) {
  const { slots, width, height } = await loadMugManifest(id);
  return slots.filter(slot => slot.instance).map(slot => ({
    ...slot.instance,
    input: slot.input,
    framing: slot.framing,
    calibration: slot.placement,
    left: slot.left / width * 100,
    top: slot.top / height * 100,
    width: slot.width / width * 100,
    height: slot.height / height * 100,
  }));
}
