import { randomUUID } from 'node:crypto';
import type { NotebookQuoteAsset, NotebookQuoteConfig } from './quoteConfig';

const ttl = 30 * 60_000;
const maxDrafts = 24;
const maxBytes = 24 * 1024 * 1024;

type Draft = {
  config: NotebookQuoteConfig;
  assets: NotebookQuoteAsset[];
  expires: number;
  size: number;
};

const drafts = new Map<string, Draft>();
let currentBytes = 0;

export function discardNotebookDraft(token: string): void {
  const draft = drafts.get(token);
  if (draft && drafts.delete(token)) {
    currentBytes -= draft.size;
  }
}

export function storeNotebookDraft(
  config: NotebookQuoteConfig,
  assets: NotebookQuoteAsset[],
): string {
  const size = assets.reduce((total, asset) => total + asset.content.length, 0);
  if (size > maxBytes) throw new Error('Arquivos da prévia acima do limite.');

  const now = Date.now();
  for (const [token, draft] of drafts) {
    if (draft.expires <= now || drafts.size >= maxDrafts || currentBytes + size > maxBytes) {
      discardNotebookDraft(token);
    } else {
      break;
    }
  }

  const token = randomUUID();
  drafts.set(token, { config, assets, expires: now + ttl, size });
  currentBytes += size;
  return token;
}

export function getNotebookDraft(token: string): Draft | undefined {
  const draft = drafts.get(token);
  if (draft && draft.expires > Date.now()) return draft;
  discardNotebookDraft(token);
  return undefined;
}

