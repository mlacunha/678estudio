import { createClient } from '@libsql/client';
import { describe, expect, it } from 'vitest';
import {
  calendarQuotePath,
  getCalendarQuote,
  getCalendarQuoteAsset,
  listCalendarQuotes,
  saveCalendarQuote,
} from './calendarQuotes';

describe('calendarQuotes repository', () => {
  it('it should persist and recover annual and monthly calendar quote configurations and assets', async () => {
    const client = createClient({ url: ':memory:' });
    const saved = await saveCalendarQuote(
      {
        modality: 'monthly',
        year: 2027,
        templateId: 'advertising',
        format: 'A4',
        orientation: 'portrait',
        weekStart: 'sunday',
        includeFederalHolidays: true,
        includeGoodFriday: false,
        includeBleed: true,
        wireOMarginMm: 18,
        includeCover: true,
        imagePlacement: { scale: 1.1, anchorX: 0.5, anchorY: 0.4 },
        imageScope: 'all',
        advertiser: {
          name: 'Cooperativa Vale Verde',
          slogan: 'Campo e cidade',
          phone: '(11) 4002-8922',
          whatsapp: '(11) 99999-0000',
          website: 'https://valeverde.coop.br',
          address: 'Av. Central, 450',
          qrText: 'https://valeverde.coop.br',
          primaryColor: '#14532d',
          accentColor: '#d97706',
          visibility: {
            showLogo: true,
            showName: true,
            showSlogan: true,
            showPhone: true,
            showWhatsapp: true,
            showWebsite: true,
            showAddress: true,
            showQrCode: true,
          },
        },
        assetNames: ['logo', 'image-1'],
      },
      [
        { name: 'logo', mime: 'image/png', content: Buffer.from([137, 80, 78, 71]) },
        { name: 'image-1', mime: 'image/jpeg', content: Buffer.from([255, 216, 255, 224]) },
      ],
      client,
    );

    expect(calendarQuotePath(saved.id)).toBe(`/calendario/orcamento/${saved.id}`);
    expect(saved.product).toBe('Calendário Mensal Wire-O');

    const loaded = await getCalendarQuote(saved.id, client);
    expect(loaded?.config.year).toBe(2027);
    expect(loaded?.config.advertiser?.name).toBe('Cooperativa Vale Verde');

    const logo = await getCalendarQuoteAsset(saved.id, 'logo', client);
    expect(logo?.mime).toBe('image/png');
    expect(logo?.content).toEqual(Buffer.from([137, 80, 78, 71]));

    const list = await listCalendarQuotes(1, client);
    expect(list.total).toBe(1);
    expect(list.quotes[0].id).toBe(saved.id);
    client.close();
  });
});
