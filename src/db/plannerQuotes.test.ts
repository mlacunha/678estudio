import { createClient, type Client } from '@libsql/client';
import { randomUUID } from 'node:crypto';
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import {
  savePlannerQuote,
  getPlannerQuoteByDraft,
  getPlannerQuote,
  listPlannerQuotes,
  getPlannerQuoteAsset,
} from './plannerQuotes';
import type { PlannerQuoteAsset, PlannerQuoteConfig } from '../server/planner/quoteConfig';

const mocked = vi.hoisted(() => ({ client: undefined as Client | undefined }));
vi.mock('./database', async (importOriginal) => ({
  ...await importOriginal<typeof import('./database')>(),
  getDbClient: () => mocked.client,
}));

describe('Planner Quotes Repository', () => {
  beforeEach(() => {
    mocked.client = createClient({ url: ':memory:' });
  });

  afterEach(() => {
    mocked.client?.close();
  });

  const sampleConfig: PlannerQuoteConfig = {
    template: 'planner-essencial-v1',
    model: 'planner-essencial',
    mode: 'dated',
    year: 2027,
    format: 'a5',
    style: 'classic',
    colors: { primary: '#1f2937', secondary: '#2563eb', accent: '#cca032' },
    customColors: false,
    personalizationName: 'Milton Alves',
    logo: { originalName: 'logo.png', original: 'original', normalized: 'logo' },
    sections: ['abertura', 'anual', 'mensal', 'semanal', 'habitos', 'financeiro', 'revisao', 'anotacoes'],
  };

  const sampleAssets: PlannerQuoteAsset[] = [
    {
      name: 'logo',
      mime: 'image/png',
      content: Buffer.from('fake-logo-png'),
    },
    {
      name: 'preview-financeiro',
      mime: 'image/png',
      content: Buffer.from('fake-preview-financeiro'),
    },
  ];

  it('should save and retrieve quote by draft token', async () => {
    const token = randomUUID();
    const saved = await savePlannerQuote(token, sampleConfig, sampleAssets, mocked.client);

    expect(saved.product).toBe('Planner Essencial');
    expect(saved.config.personalizationName).toBe('Milton Alves');
    expect(saved.config.mode).toBe('dated');

    const retrieved = await getPlannerQuoteByDraft(token, mocked.client);
    expect(retrieved).toBeDefined();
    expect(retrieved?.id).toBe(saved.id);
    expect(retrieved?.config.style).toBe('classic');

    const retrievedById = await getPlannerQuote(saved.id, mocked.client);
    expect(retrievedById).toBeDefined();
    expect(retrievedById?.id).toBe(saved.id);
  });

  it('should save and retrieve quote assets in binary format', async () => {
    const token = randomUUID();
    const saved = await savePlannerQuote(token, sampleConfig, sampleAssets, mocked.client);

    const logoAsset = await getPlannerQuoteAsset(saved.id, 'logo', mocked.client);
    expect(logoAsset).toBeDefined();
    expect(logoAsset?.mime).toBe('image/png');
    expect(logoAsset?.content.toString()).toBe('fake-logo-png');

    const previewAsset = await getPlannerQuoteAsset(saved.id, 'preview-financeiro', mocked.client);
    expect(previewAsset?.content.toString()).toBe('fake-preview-financeiro');
  });

  it('should list quotes with pagination and preserve custom colors, typography and watermark', async () => {
    const token1 = randomUUID();
    const token2 = randomUUID();

    await savePlannerQuote(token1, sampleConfig, [], mocked.client);
    await savePlannerQuote(
      token2,
      {
        ...sampleConfig,
        mode: 'undated',
        typography: 'editorial',
        colors: { primary: '#1e3a8a', secondary: '#7c2d12', accent: '#7c2d12' },
        customColors: true,
        watermark: true,
      },
      [
        { name: 'original', mime: 'image/png', content: Buffer.from('orig-logo') },
        { name: 'logo', mime: 'image/png', content: Buffer.from('norm-logo') },
      ],
      mocked.client
    );

    const result = await listPlannerQuotes(1, mocked.client);
    expect(result.quotes.length).toBe(2);
    expect(result.totalPages).toBe(1);

    const customQuote = result.quotes.find((q) => q.config.customColors);
    expect(customQuote).toBeDefined();
    expect(customQuote?.config.colors.primary).toBe('#1e3a8a');
    expect(customQuote?.config.colors.secondary).toBe('#7c2d12');
    expect(customQuote?.config.typography).toBe('editorial');
    expect(customQuote?.config.watermark).toBe(true);

    const origAsset = await getPlannerQuoteAsset(customQuote!.id, 'original', mocked.client);
    expect(origAsset?.content.toString()).toBe('orig-logo');
  });
});

