import http from 'node:http';
import { existsSync, mkdirSync, readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { homedir } from 'node:os';
import { basename, dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createPhotopeaBridge } from './photopea-bridge.mjs';
import { loadTemplateById, renderCommercialMockup } from './mockup-engine.mjs';
import { createArtLibraryAdapter } from './art-library-adapter.mjs';
import { createRemoteArtLibraryAdapter, normalizeRemoteBaseUrl } from './art-library-remote-adapter.mjs';

const APP_DIR = dirname(fileURLToPath(import.meta.url));
const REPO_DATA_DIR = join(APP_DIR, '../../data/mockups-comerciais');
const DATA_DIR = process.env.MOCKUP_DATA_DIR
  || (existsSync(REPO_DATA_DIR) ? REPO_DATA_DIR : join(process.env.LOCALAPPDATA || homedir(), '678Estudio-Mockups'));

const TPL_DIR = join(APP_DIR, 'templates');
const ORIG_DIR = join(DATA_DIR, 'originais');
const SAMPLE_DIR = join(DATA_DIR, 'artes-teste');
const OUT_DIR = join(DATA_DIR, 'resultados');
const TEMP_DIR = join(DATA_DIR, 'temporarios');
const CONFIG_PATH = join(DATA_DIR, 'config.json');
const DEFAULT_CONFIG_PATH = join(APP_DIR, 'config.default.json');
const EDITOR_HTML = readFileSync(join(APP_DIR, 'editor.html'), 'utf8');
const PORT = Number(process.env.POC_EDITOR_PORT || 4399);
const APP_VERSION = '1.0.0';

for (const dir of [DATA_DIR, ORIG_DIR, SAMPLE_DIR, OUT_DIR, TEMP_DIR]) {
  mkdirSync(dir, { recursive: true });
}

function readConfig() {
  const defaults = existsSync(DEFAULT_CONFIG_PATH) ? JSON.parse(readFileSync(DEFAULT_CONFIG_PATH, 'utf8')) : {};
  const userCfg = existsSync(CONFIG_PATH) ? JSON.parse(readFileSync(CONFIG_PATH, 'utf8')) : {};
  return { remoteUrl: process.env.MOCKUP_REMOTE_URL || userCfg.remoteUrl || defaults.remoteUrl || '' };
}

function saveConfig(next) {
  const current = readConfig();
  const merged = { ...current, ...next };
  writeFileSync(CONFIG_PATH, JSON.stringify({ remoteUrl: merged.remoteUrl || '' }, null, 2), 'utf8');
  return merged;
}

const initialConfig = readConfig();
const repoRoot = existsSync(REPO_DATA_DIR) ? join(APP_DIR, '../..') : DATA_DIR;
const localLibrary = createArtLibraryAdapter({ rootDir: repoRoot });
const remoteLibrary = createRemoteArtLibraryAdapter({ defaultUrl: initialConfig.remoteUrl });
const getAdapter = source => (source === 'remote' ? remoteLibrary : localLibrary);

let sharedBridge = null;
async function getBridge() {
  if (!sharedBridge) sharedBridge = await createPhotopeaBridge();
  return sharedBridge;
}

function readBinaryBody(req, maxBytes = 500 * 1024 * 1024) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    let total = 0;
    req.on('data', c => {
      total += c.length;
      if (total > maxBytes) {
        reject(Object.assign(new Error('Arquivo PSD excede o limite de 500 MB.'), { statusCode: 413 }));
        req.destroy();
        return;
      }
      chunks.push(c);
    });
    req.on('end', () => resolve(Buffer.concat(chunks)));
    req.on('error', reject);
  });
}

function readJsonBody(req) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    req.on('data', c => chunks.push(c));
    req.on('end', () => {
      try { resolve(JSON.parse(Buffer.concat(chunks).toString('utf8'))); }
      catch (e) { reject(e); }
    });
    req.on('error', reject);
  });
}

async function resolveSlotBuffer(spec) {
  if (spec.artId) {
    const adapter = getAdapter(spec.artSource);
    return (await adapter.readArtVariant(spec.artId, spec.artVersion, 'orig')).buffer;
  }
  if (spec.imageDataUrl) {
    const idx = spec.imageDataUrl.indexOf('base64,');
    if (idx !== -1) return Buffer.from(spec.imageDataUrl.slice(idx + 7), 'base64');
  }
  if (spec.sampleFile) {
    const safeName = String(spec.sampleFile).replace(/[^a-zA-Z0-9._-]/g, '');
    return readFileSync(join(SAMPLE_DIR, safeName));
  }
  throw new Error('Nenhuma imagem informada para o slot.');
}

const server = http.createServer(async (req, res) => {
  const parsed = new URL(req.url || '/', `http://127.0.0.1:${PORT}`);
  const url = parsed.pathname;
  try {
    if (req.method === 'GET' && url === '/') {
      res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
      res.end(EDITOR_HTML);
      return;
    }
    if (req.method === 'GET' && url === '/api/health') {
      res.writeHead(200, { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' });
      res.end(JSON.stringify({ ok: true, service: '678estudio-mockups', version: APP_VERSION, dataDir: DATA_DIR }));
      return;
    }
    if (req.method === 'GET' && url === '/api/config') {
      res.writeHead(200, { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' });
      res.end(JSON.stringify({ ...readConfig(), dataDir: DATA_DIR, outDir: OUT_DIR }));
      return;
    }
    if (req.method === 'POST' && url === '/api/config') {
      const body = await readJsonBody(req);
      const remoteUrl = body?.remoteUrl ? normalizeRemoteBaseUrl(body.remoteUrl) : '';
      const saved = saveConfig({ remoteUrl });
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify(saved));
      return;
    }
    if (req.method === 'GET' && url === '/api/templates') {
      const files = readdirSync(TPL_DIR).filter(f => f.endsWith('.json')).sort();
      const templates = files.map(f => {
        const tpl = JSON.parse(readFileSync(join(TPL_DIR, f), 'utf8'));
        const psdFileName = basename(tpl.sourcePath);
        return { ...tpl, psdFileName, psdReady: existsSync(join(ORIG_DIR, psdFileName)) };
      });
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ templates }));
      return;
    }
    const psdMatch = req.method === 'POST' && url.match(/^\/api\/templates\/([^/]+)\/psd$/);
    if (psdMatch) {
      const tpl = loadTemplateById(TPL_DIR, decodeURIComponent(psdMatch[1]));
      const buf = await readBinaryBody(req);
      if (buf.length < 26 || buf.subarray(0, 4).toString('ascii') !== '8BPS') {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Arquivo inválido. Selecione um arquivo Photoshop (.psd).' }));
        return;
      }
      const psdFileName = basename(tpl.sourcePath);
      writeFileSync(join(ORIG_DIR, psdFileName), buf);
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ ok: true, templateId: tpl.id, psdFileName, bytes: buf.length }));
      return;
    }
    if (req.method === 'GET' && url === '/api/sample-arts') {
      const files = existsSync(SAMPLE_DIR)
        ? readdirSync(SAMPLE_DIR).filter(f => /\.(png|jpe?g|webp)$/i.test(f)).sort()
        : [];
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ files }));
      return;
    }
    if (req.method === 'GET' && url === '/api/library/remote/status') {
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify(remoteLibrary.getStatus()));
      return;
    }
    if (req.method === 'POST' && url === '/api/library/remote/connect') {
      const body = await readJsonBody(req);
      const status = await remoteLibrary.connect(body || {});
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify(status));
      return;
    }
    if (req.method === 'POST' && url === '/api/library/remote/disconnect') {
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify(remoteLibrary.disconnect()));
      return;
    }
    if (req.method === 'GET' && url === '/api/library/artes') {
      const source = parsed.searchParams.get('source') === 'remote' ? 'remote' : 'local';
      const adapter = getAdapter(source);
      const data = await adapter.listArtes({
        q: parsed.searchParams.get('q') ?? undefined,
        categoryId: parsed.searchParams.get('categoria') ?? undefined,
        product: parsed.searchParams.get('produto') ?? undefined,
        page: parsed.searchParams.get('pagina') ?? 1,
        limit: parsed.searchParams.get('limite') ?? 12,
      });
      const items = data.items.map(item => ({
        ...item,
        source,
        thumbUrl: `/api/library/artes/${item.id}/thumb?source=${source}&versao=${item.version}`,
        previewUrl: `/api/library/artes/${item.id}/preview?source=${source}&versao=${item.version}`,
      }));
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ ...data, source, items }));
      return;
    }
    const libImgMatch = req.method === 'GET' && url.match(/^\/api\/library\/artes\/([^/]+)\/(thumb|preview)$/);
    if (libImgMatch) {
      const [, id, variant] = libImgMatch;
      const source = parsed.searchParams.get('source') === 'remote' ? 'remote' : 'local';
      const version = parsed.searchParams.get('versao');
      const file = await getAdapter(source).readArtVariant(id, version, variant);
      res.writeHead(200, { 'Content-Type': file.mime, 'Cache-Control': 'no-store' });
      res.end(file.buffer);
      return;
    }
    if (req.method === 'GET' && url.startsWith('/samples/')) {
      const name = decodeURIComponent(url.slice('/samples/'.length)).replace(/[^a-zA-Z0-9._-]/g, '');
      res.writeHead(200);
      res.end(readFileSync(join(SAMPLE_DIR, name)));
      return;
    }
    if (req.method === 'GET' && url.startsWith('/results/')) {
      const name = decodeURIComponent(url.slice('/results/'.length)).replace(/[^a-zA-Z0-9._-]/g, '');
      res.writeHead(200, { 'Content-Type': name.endsWith('.webp') ? 'image/webp' : 'image/png' });
      res.end(readFileSync(join(OUT_DIR, name)));
      return;
    }
    if (req.method === 'POST' && url === '/api/render') {
      const body = await readJsonBody(req);
      const template = loadTemplateById(TPL_DIR, body.templateId);
      const slotInputs = {};
      for (const [slotId, spec] of Object.entries(body.slots || {})) {
        slotInputs[slotId] = {
          source: await resolveSlotBuffer(spec),
          fit: spec.fit,
          anchorX: spec.anchorX,
          anchorY: spec.anchorY,
          scale: spec.scale,
        };
      }
      const outName = `${template.id.replace('template-', '')}-editor-preview`;
      const result = await renderCommercialMockup({
        rootDir: repoRoot,
        originaisDir: ORIG_DIR,
        tempDir: TEMP_DIR,
        template,
        slotInputs,
        outputBaseName: outName,
        outputDir: OUT_DIR,
        bridge: await getBridge(),
      });
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({
        ...result,
        pngUrl: `/results/${outName}.png`,
        webpUrl: `/results/${outName}.webp`,
      }));
      return;
    }
    res.writeHead(404);
    res.end('Not found');
  } catch (err) {
    res.writeHead(err.statusCode || 500, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: err.message }));
  }
});

server.listen(PORT, '127.0.0.1', () => {
  console.log(`POC_EDITOR_READY http://127.0.0.1:${PORT}`);
});
