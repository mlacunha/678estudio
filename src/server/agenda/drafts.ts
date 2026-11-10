import { randomUUID } from 'node:crypto';
import type { QuoteAsset, QuoteConfig } from './quoteConfig';

const ttl = 30 * 60_000;
const maxDrafts = 24;
const maxBytes = 24 * 1024 * 1024;
type Draft = { config: QuoteConfig; assets: QuoteAsset[]; expires: number; size: number };
const drafts = new Map<string, Draft>();
let bytes = 0;

export function discardAgendaDraft(token: string) {
  const draft = drafts.get(token);
  if (draft && drafts.delete(token)) bytes -= draft.size;
}

export function storeAgendaDraft(config: QuoteConfig, assets: QuoteAsset[]) {
  const size = assets.reduce((total, asset) => total + asset.content.length, 0);
  if (size > maxBytes) throw new Error('Arquivos da prévia acima do limite.');
  const now = Date.now();
  for (const [token, draft] of drafts) {
    if (draft.expires <= now || drafts.size >= maxDrafts || bytes + size > maxBytes) discardAgendaDraft(token);
    else break;
  }
  const token = randomUUID();
  drafts.set(token, { config, assets, expires: now + ttl, size });
  bytes += size;
  return token;
}

export function getAgendaDraft(token: string) {
  const draft = drafts.get(token);
  if (draft && draft.expires > Date.now()) return draft;
  discardAgendaDraft(token);
}
