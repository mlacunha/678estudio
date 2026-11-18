import { copyFileSync, existsSync, mkdirSync, readFileSync, rmSync, statSync, writeFileSync } from 'node:fs';
import { basename, join, resolve } from 'node:path';
import sharp from 'sharp';
import { createPhotopeaBridge } from './photopea-bridge.mjs';
import { prepareSlotImage } from './prepare-input.mjs';

export function openSlotJsx(layerPath) {
  return `
    (function() {
      var doc = app.documents[0];
      app.activeDocument = doc;
      var node = doc;
      var segs = ${JSON.stringify(layerPath)};
      for (var i = 0; i < segs.length; i++) {
        var found = null;
        for (var j = 0; j < node.layers.length; j++) {
          if (node.layers[j].name === segs[i]) { found = node.layers[j]; break; }
        }
        if (!found) { app.echoToOE('ERR:Camada nao encontrada: ' + segs.join('/')); return; }
        node = found;
      }
      doc.activeLayer = node;
      executeAction(stringIDToTypeID('placedLayerEditContents'));
    })();
  `;
}

export const COMMIT_SLOT_JSX = `
  (function() {
    var soDoc = app.documents[1];
    var pngDoc = app.documents[2];
    var oldLayers = [];
    for (var i = 0; i < soDoc.layers.length; i++) {
      oldLayers.push(soDoc.layers[i]);
    }
    app.activeDocument = pngDoc;
    pngDoc.activeLayer.duplicate(soDoc);
    pngDoc.close(SaveOptions.DONOTSAVECHANGES);
    app.activeDocument = soDoc;
    for (var k = 0; k < oldLayers.length; k++) {
      oldLayers[k].visible = false;
    }
    soDoc.save();
    soDoc.close(SaveOptions.DONOTSAVECHANGES);
    app.activeDocument = app.documents[0];
  })();
`;

function applyBackgroundJsx(bgConfig, bgOptions) {
  if (!bgConfig || !bgOptions) return null;
  return `
    (function() {
      var doc = app.documents[0];
      app.activeDocument = doc;
      var node = doc;
      var segs = ${JSON.stringify(bgConfig.layerPath)};
      for (var i = 0; i < segs.length; i++) {
        var found = null;
        for (var j = 0; j < node.layers.length; j++) {
          if (node.layers[j].name === segs[i]) { found = node.layers[j]; break; }
        }
        if (!found) return;
        node = found;
      }
      if (${JSON.stringify(typeof bgOptions.visible === 'boolean')}) {
        node.visible = ${JSON.stringify(Boolean(bgOptions.visible))};
      }
    })();
  `;
}

/** Carrega a configuração JSON de um template pelo identificador. */
export function loadTemplateById(templatesDirOrRoot, templateId) {
  const safeId = String(templateId || '').replace(/[^a-zA-Z0-9_-]/g, '');
  const directPath = join(templatesDirOrRoot, `${safeId}.json`);
  const legacyPath = join(templatesDirOrRoot, 'tools/mockup-commercial-poc/templates', `${safeId}.json`);
  const cfgPath = existsSync(directPath) ? directPath : legacyPath;
  if (!existsSync(cfgPath)) throw new Error(`Template não encontrado: ${templateId}`);
  return JSON.parse(readFileSync(cfgPath, 'utf8'));
}

/** Resolve o caminho do arquivo PSD de um template priorizando originaisDir externo. */
export function resolveTemplatePsdPath({ template, rootDir, originaisDir }) {
  const fileName = basename(template.sourcePath);
  if (originaisDir) {
    const extPath = join(originaisDir, fileName);
    if (existsSync(extPath) || !rootDir) return extPath;
  }
  return resolve(rootDir, template.sourcePath);
}

/** Renderiza um template PSD configurável com artes distintas ou repetidas por slot, exportando PNG e WebP. */
export async function renderCommercialMockup(options) {
  const {
    rootDir,
    originaisDir,
    tempDir: customTempDir,
    template,
    slotInputs,
    outputBaseName,
    outputDir,
    background,
    bridge: externalBridge,
  } = options;

  const t0 = Date.now();
  const srcPsd = resolveTemplatePsdPath({ template, rootDir, originaisDir });
  if (!existsSync(srcPsd)) {
    throw new Error(`Arquivo PSD "${basename(template.sourcePath)}" não encontrado. Importe o PSD no editor antes de renderizar.`);
  }

  const validIds = new Set(template.slots.map(s => s.id));
  for (const key of Object.keys(slotInputs || {})) {
    if (!validIds.has(key)) throw new Error(`Slot inválido "${key}" para o template ${template.id}.`);
  }

  const tempDir = customTempDir ?? join(rootDir, 'data/mockups-comerciais/temporarios');
  mkdirSync(tempDir, { recursive: true });
  mkdirSync(outputDir, { recursive: true });

  const tempPsd = join(tempDir, `${template.id}-${Date.now()}.psd`);
  copyFileSync(srcPsd, tempPsd);

  const ownBridge = !externalBridge;
  const bridge = externalBridge ?? await createPhotopeaBridge();
  try {
    const assetKey = `${template.id}-${Date.now()}.psd`;
    bridge.registerAsset(assetKey, readFileSync(tempPsd));
    await bridge.loadAsset(assetKey);
    const tLoaded = Date.now();

    const bgJsx = applyBackgroundJsx(template.background, background);
    if (bgJsx) await bridge.runScript(bgJsx);

    const appliedSlots = [];
    for (const slot of template.slots) {
      const inputSpec = slotInputs[slot.id];
      if (!inputSpec) continue;

      const basePlacement = slot.defaultPlacement ?? {};
      const preparedPng = await prepareSlotImage(
        inputSpec.source,
        slot.expectedSize,
        {
          fit: inputSpec.fit ?? basePlacement.fit ?? slot.defaultFit,
          anchorX: inputSpec.anchorX ?? basePlacement.anchorX ?? 0.5,
          anchorY: inputSpec.anchorY ?? basePlacement.anchorY ?? 0.5,
          scale: inputSpec.scale ?? basePlacement.scale ?? 1.0,
        },
      );
      const openRes = await bridge.runScript(openSlotJsx(slot.layerPath));
      const err = openRes.texts.find(t => t.startsWith('ERR:'));
      if (err) throw new Error(`Slot "${slot.id}": ${err}`);

      const pngKey = `${slot.id}-${Date.now()}.png`;
      bridge.registerAsset(pngKey, preparedPng);
      await bridge.loadAsset(pngKey);
      await bridge.runScript(COMMIT_SLOT_JSX);
      appliedSlots.push(slot.id);
    }
    const tReplaced = Date.now();

    const exportRes = await bridge.runScript('app.activeDocument.saveToOE("png");');
    if (!exportRes.binary) throw new Error(`Falha ao exportar PNG de ${template.id}`);

    const pngBuf = Buffer.from(exportRes.binary);
    const pngPath = join(outputDir, `${outputBaseName}.png`);
    const webpPath = join(outputDir, `${outputBaseName}.webp`);
    writeFileSync(pngPath, pngBuf);
    await sharp(pngBuf).webp({ quality: 86 }).toFile(webpPath);
    const tExported = Date.now();

    await bridge.runScript('app.documents[0].close(SaveOptions.DONOTSAVECHANGES);');
    const webpBytes = statSync(webpPath).size;
    return {
      templateId: template.id,
      appliedSlots,
      timingsMs: {
        loadPsd: tLoaded - t0,
        replaceSlots: tReplaced - tLoaded,
        exportImages: tExported - tReplaced,
        total: tExported - t0,
      },
      outputs: {
        png: { path: pngPath, bytes: pngBuf.length },
        webp: { path: webpPath, bytes: webpBytes },
      },
    };
  } finally {
    rmSync(tempPsd, { force: true });
    if (ownBridge) await bridge.close();
  }
}
