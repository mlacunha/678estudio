import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import sharp from 'sharp';
import { createPhotopeaBridge } from './photopea-bridge.mjs';
import { COMMIT_SLOT_JSX, loadTemplateById, openSlotJsx, resolveTemplatePsdPath } from './mockup-engine.mjs';

const dir = process.argv[2];
const ids = process.argv.slice(3);
if (!dir || !ids.length) throw new Error('Informe o diretório de saída e os IDs dos modelos.');
await mkdir(dir, { recursive: true });

async function probe(slot, kind) {
  const { width, height } = slot.expectedSize;
  const tone = { black: 0, low: 64, mid: 128, high: 192, white: 255 }[kind];
  const data = Buffer.alloc(width * height * 3, tone ?? 0);
  if (tone === undefined) {
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const i = (y * width + x) * 3;
        const axis = kind.startsWith('x') ? x / (width - 1) : y / (height - 1);
        const value = kind.endsWith('sin') ? 0.5 + 0.42 * Math.sin(axis * Math.PI * 12)
          : kind.endsWith('cos') ? 0.5 + 0.42 * Math.cos(axis * Math.PI * 12)
          : axis;
        data.fill(Math.round(value * 255), i, i + 3);
      }
    }
  }
  return sharp(data, { raw: {width, height, channels: 3} }).png().toBuffer();
}

for (const id of ids) {
  const template = loadTemplateById('.', 'template-' + id);
  const bridge = await createPhotopeaBridge();
  try {
    bridge.registerAsset('original.psd', await readFile(resolveTemplatePsdPath({template, rootDir: '.'})));
    await bridge.loadAsset('original.psd');
    const replace = async (slot, kind) => {
      const result = await bridge.runScript(openSlotJsx(slot.layerPath));
      if (result.texts.some(t => t.startsWith('ERR:'))) throw new Error(result.texts.join('\n'));
      const key = slot.id + '-' + kind + '.png';
      bridge.registerAsset(key, await probe(slot, kind));
      await bridge.loadAsset(key);
      await bridge.runScript(COMMIT_SLOT_JSX);
    };
    const capture = async (suffix) => {
      const result = await bridge.runScript('app.activeDocument.saveToOE("png");');
      if (!result.binary) throw new Error('Sem imagem na captura ' + suffix);
      await writeFile(join(dir, id + '-' + suffix + '.png'), Buffer.from(result.binary));
      console.log(id, suffix);
    };
    for (const slot of template.slots) await replace(slot, 'black');
    const phaseOnly = process.env.MOCKUP_PHASE_ONLY === '1';
    if (!phaseOnly) await capture('base');
    for (const slot of template.slots) {
      for (const kind of phaseOnly ? ['xsin', 'xcos', 'ysin', 'ycos'] : ['low', 'mid', 'high', 'white', 'x', 'y']) {
        await replace(slot, kind);
        await capture(slot.id + '-' + kind);
      }
      await replace(slot, 'black');
    }
  } finally {
    await bridge.close();
  }
}
