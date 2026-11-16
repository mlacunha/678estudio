import http from 'node:http';
import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { createPhotopeaBridge } from './photopea-bridge.mjs';
import { loadTemplateById, renderCommercialMockup } from './mockup-engine.mjs';
import { createArtLibraryAdapter } from './art-library-adapter.mjs';
import { createRemoteArtLibraryAdapter } from './art-library-remote-adapter.mjs';

const ROOT = 'D:/Projetos/site678Estudio';
const TPL_DIR = join(ROOT, 'tools/mockup-commercial-poc/templates');
const SAMPLE_DIR = join(ROOT, 'data/mockups-comerciais/artes-teste');
const OUT_DIR = join(ROOT, 'data/mockups-comerciais/resultados');
const EDITOR_HTML = readFileSync(join(ROOT, 'tools/mockup-commercial-poc/editor.html'), 'utf8');
const PORT = Number(process.env.POC_EDITOR_PORT || 4399);

const localLibrary = createArtLibraryAdapter({ rootDir: ROOT });
const remoteLibrary = createRemoteArtLibraryAdapter();
const getAdapter = source => (source === 'remote' ? remoteLibrary : localLibrary);

let sharedBridge = null;
async function getBridge() {
  if (!sharedBridge) sharedBridge = await createPhotopeaBridge();
  return sharedBridge;
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
    if (req.method === 'GET' && url === '/api/templates') {
      const files = readdirSync(TPL_DIR).filter(f => f.endsWith('.json')).sort();
      const templates = files.map(f => JSON.parse(readFileSync(join(TPL_DIR, f), 'utf8')));
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ templates }));
      return;
    }
    if (req.method === 'GET' && url === '/api/sample-arts') {
      const files = readdirSync(SAMPLE_DIR).filter(f => /\.(png|jpe?g|webp)$/i.test(f)).sort();
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
      const template = loadTemplateById(ROOT, body.templateId);
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
        rootDir: ROOT,
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
