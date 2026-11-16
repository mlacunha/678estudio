import http from 'node:http';
import { existsSync } from 'node:fs';
import { join } from 'node:path';
import puppeteer from 'puppeteer-core';

const CHROME_PATHS = [
  'C:/Program Files/Google/Chrome/Application/chrome.exe',
  process.env.LOCALAPPDATA ? join(process.env.LOCALAPPDATA, 'Google/Chrome/Application/chrome.exe') : '',
  'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',
  'C:/Program Files/Microsoft/Edge/Application/msedge.exe',
].filter(Boolean);

function buildHostHtml() {
  return `<!doctype html><html><body>
<iframe id="pp" src="https://www.photopea.com#%7B%7D" style="width:1280px;height:800px;border:0"></iframe>
<script>
window._ppReady = false;
window.addEventListener('message', (e) => {
  if (e.origin === 'https://www.photopea.com' && e.data === 'done') {
    window._ppReady = true;
  }
});
window.ppSend = (payload) => new Promise((resolve) => {
  const texts = [];
  let binary = null;
  const handler = (e) => {
    if (e.origin !== 'https://www.photopea.com') return;
    if (e.data === 'done') {
      window.removeEventListener('message', handler);
      resolve({ texts, binary });
    } else if (e.data instanceof ArrayBuffer) {
      binary = Array.from(new Uint8Array(e.data));
    } else if (typeof e.data === 'string') {
      texts.push(e.data);
    }
  };
  window.addEventListener('message', handler);
  document.getElementById('pp').contentWindow.postMessage(payload, '*');
});
window.ppLoadAsset = async (assetKey) => {
  const res = await fetch('/assets/' + encodeURIComponent(assetKey));
  if (!res.ok) throw new Error('Asset fetch failed: ' + assetKey);
  const buf = await res.arrayBuffer();
  return window.ppSend(buf);
};
</script></body></html>`;
}

/** Inicia servidor local efêmero + Chromium headless conectado à API postMessage do Photopea. */
export async function createPhotopeaBridge() {
  const executablePath = CHROME_PATHS.find(p => existsSync(p));
  if (!executablePath) throw new Error('Chrome ou Edge não encontrado no sistema.');

  const assets = new Map();
  const server = http.createServer((req, res) => {
    const url = req.url || '/';
    if (url.startsWith('/assets/')) {
      const key = decodeURIComponent(url.slice('/assets/'.length));
      const buf = assets.get(key);
      if (!buf) {
        res.writeHead(404);
        res.end('Not found');
        return;
      }
      res.writeHead(200, { 'Content-Type': 'application/octet-stream', 'Content-Length': buf.length });
      res.end(buf);
      return;
    }
    res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
    res.end(buildHostHtml());
  });

  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  const port = server.address().port;
  const browser = await puppeteer.launch({ headless: true, executablePath, args: ['--no-sandbox'] });
  const page = await browser.newPage();
  await page.goto(`http://127.0.0.1:${port}/`, { waitUntil: 'domcontentloaded' });
  await page.waitForFunction(() => window._ppReady === true, { timeout: 60000 });

  return {
    registerAsset(key, buffer) {
      assets.set(key, buffer);
    },
    async loadAsset(key) {
      return page.evaluate(k => window.ppLoadAsset(k), key);
    },
    async runScript(script) {
      return page.evaluate(s => window.ppSend(s), script);
    },
    async close() {
      await browser.close();
      server.close();
    },
  };
}
