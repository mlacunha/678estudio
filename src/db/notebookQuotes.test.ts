import { randomUUID } from 'node:crypto';
import { createClient, type Client } from '@libsql/client';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import {
  getNotebookQuote,
  getNotebookQuoteAsset,
  getNotebookQuoteByDraft,
  listNotebookQuotes,
  saveNotebookQuote,
} from './notebookQuotes';
import type { NotebookQuoteAsset, NotebookQuoteConfig } from '../server/caderno/quoteConfig';

describe('notebookQuotes repository', () => {
  let client: Client;

  beforeEach(() => {
    client = createClient({ url: ':memory:' });
  });

  afterEach(() => {
    client.close();
  });

  function buildConfig(overrides: Partial<NotebookQuoteConfig> = {}): NotebookQuoteConfig {
    return {
      template: 'caderno-personalizado-v1',
      model: 'caderno-receitas',
      format: 'a5',
      style: 'classic',
      typography: 'editorial',
      colors: { primary: '#1f2937', secondary: '#4b5563', accent: '#b0892f' },
      customColors: false,
      watermark: false,
      title: 'Receitas da Família',
      personalizationName: 'Dona Helena',
      logo: null,
      sections: ['abertura', 'medidas', 'indice', 'ficha', 'ficha-par', 'anotacoes'],
      ...overrides,
    };
  }

  it('it should save and retrieve a notebook quote with all 6 preview assets and logo', async () => {
    const draftToken = randomUUID();
    const config = buildConfig({
      model: 'livro-memorias',
      title: 'Nossa História',
      dedication: 'Para nossos filhos, com amor.',
      logo: { originalName: 'brasao.png', original: 'original', normalized: 'logo' },
    });

    const assets: NotebookQuoteAsset[] = [
      { name: 'original', mime: 'image/png', content: Buffer.from('original-logo-bytes') },
      { name: 'logo', mime: 'image/png', content: Buffer.from('normalized-logo-bytes') },
      { name: 'preview-abertura', mime: 'image/png', content: Buffer.from('png-abertura') },
      { name: 'preview-dedicatoria', mime: 'image/png', content: Buffer.from('png-dedicatoria') },
      { name: 'preview-sumario', mime: 'image/png', content: Buffer.from('png-sumario') },
      { name: 'preview-memoria-esquerda', mime: 'image/png', content: Buffer.from('png-esq') },
      { name: 'preview-memoria-direita', mime: 'image/png', content: Buffer.from('png-dir') },
      { name: 'preview-recordacoes', mime: 'image/png', content: Buffer.from('png-rec') },
    ];

    const saved = await saveNotebookQuote(draftToken, config, assets, client);
    expect(saved.product).toBe('Livro de Memórias');
    expect(saved.status).toBe('requested');
    expect(saved.config.dedication).toBe('Para nossos filhos, com amor.');

    const byId = await getNotebookQuote(saved.id, client);
    expect(byId?.id).toBe(saved.id);
    expect(byId?.config.title).toBe('Nossa História');

    const byDraft = await getNotebookQuoteByDraft(draftToken, client);
    expect(byDraft?.id).toBe(saved.id);

    const logoAsset = await getNotebookQuoteAsset(saved.id, 'logo', client);
    expect(logoAsset?.mime).toBe('image/png');
    expect(logoAsset?.content.toString('utf8')).toBe('normalized-logo-bytes');

    const previewLeft = await getNotebookQuoteAsset(saved.id, 'preview-memoria-esquerda', client);
    expect(previewLeft?.content.toString('utf8')).toBe('png-esq');
  });

  it('it should enforce idempotency when saving the same draft_token twice', async () => {
    const draftToken = randomUUID();
    const config = buildConfig({ model: 'diario-pessoal', title: 'Meu Diário' });
    const first = await saveNotebookQuote(draftToken, config, [], client);
    const second = await saveNotebookQuote(draftToken, config, [], client);

    expect(second.id).toBe(first.id);
    const listing = await listNotebookQuotes(1, client);
    expect(listing.quotes).toHaveLength(1);
    expect(listing.quotes[0]?.product).toBe('Diário Pessoal');
  });

  it('it should reject invalid UUID references safely', async () => {
    expect(await getNotebookQuote('not-a-uuid', client)).toBeUndefined();
    expect(await getNotebookQuoteByDraft('invalid-token', client)).toBeUndefined();
  });
});
