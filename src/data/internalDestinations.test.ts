import { describe, it, expect } from 'vitest';
import {
  resolveCategoryDestination,
  resolveProductDestination,
  resolveArteProductType,
} from './internalDestinations';

describe('internalDestinations resolution', () => {
  it('should resolve collection and customizer destinations for category', () => {
    const quadros = resolveCategoryDestination({
      slug: 'quadros',
      destinationType: 'internal_page',
      destinationHref: '/quadros',
      defaultProductAction: 'customizer',
      defaultProductHref: '/personalizar/quadro',
    });
    expect(quadros.collectionHref).toBe('/quadros');
    expect(quadros.collectionLabel).toBe('Ver todos os quadros');
    expect(quadros.customizerHref).toBe('/personalizar/quadro');
    expect(quadros.customizerLabel).toBe('Crie seu quadro');

    const dynamicCat = resolveCategoryDestination({
      slug: 'brindes-vip',
      destinationType: 'collection',
      defaultProductAction: 'quote',
    });
    expect(dynamicCat.collectionHref).toBe('/colecoes/brindes-vip');
    expect(dynamicCat.collectionLabel).toBe('Ver coleção');
    expect(dynamicCat.customizerHref).toBeUndefined();
  });

  it('should prioritize individual product destination over category default', () => {
    const category = {
      slug: 'papelaria',
      defaultProductAction: 'quote' as const,
    };
    const resolved = resolveProductDestination(
      {
        actionType: 'customizer',
        actionHref: '/personalizar/agenda',
        ctaLabel: 'Personalizar agenda',
      },
      category,
      { whatsappQuoteHref: 'https://wa.me/5511999999999' },
    );

    expect(resolved.kind).toBe('customizer');
    expect(resolved.href).toBe('/personalizar/agenda');
    expect(resolved.label).toBe('Personalizar agenda');
    expect(resolved.isExternal).toBe(false);
    expect(resolved.allowSecondaryQuote).toBe(false);
  });

  it('should attach valid linked arte only for compatible mug/frame customizers', () => {
    const canecaCat = {
      slug: 'canecas',
      defaultProductAction: 'customizer' as const,
      defaultProductHref: '/personalizar/caneca',
    };

    const withArte = resolveProductDestination(
      { linkedArteId: 'arte-123' },
      canecaCat,
      { validLinkedArteId: 'arte-123', whatsappQuoteHref: 'https://wa.me/5511999' },
    );
    expect(withArte.kind).toBe('customizer');
    expect(withArte.href).toBe('/personalizar/caneca?arte=arte-123');
    expect(withArte.label).toBe('Personalizar modelo');
    expect(withArte.allowSecondaryQuote).toBe(true);

    const withoutArte = resolveProductDestination(
      { linkedArteId: 'arte-inativa' },
      canecaCat,
      { validLinkedArteId: undefined },
    );
    expect(withoutArte.href).toBe('/personalizar/caneca');
    expect(withoutArte.label).toBe('Simular caneca branca');
  });

  it('should fallback safely when details route is invalid or unimplemented', () => {
    const resolved = resolveProductDestination(
      { actionType: 'details', actionHref: '/produtos/nao-existe' },
      { slug: 'brindes', defaultProductAction: 'quote' },
      { whatsappQuoteHref: 'https://wa.me/5511999' },
    );
    expect(resolved.kind).toBe('quote');
    expect(resolved.href).toBe('https://wa.me/5511999');
    expect(resolved.isExternal).toBe(true);
  });

  it('should resolve valid internal details route when provided', () => {
    const resolved = resolveProductDestination(
      { actionType: 'details', actionHref: '/trabalhos', ctaLabel: 'Ver portfolio' },
      { slug: 'artesanato', defaultProductAction: 'quote' },
    );
    expect(resolved.kind).toBe('details');
    expect(resolved.href).toBe('/trabalhos');
    expect(resolved.label).toBe('Ver portfolio');
  });

  it('should detect arte product type from customizer href or category slug', () => {
    expect(resolveArteProductType('/personalizar/caneca', 'brindes')).toBe('caneca');
    expect(resolveArteProductType('/personalizar/quadro', 'brindes')).toBe('quadro');
    expect(resolveArteProductType('/personalizar/agenda', 'papelaria')).toBeNull();
  });
});
