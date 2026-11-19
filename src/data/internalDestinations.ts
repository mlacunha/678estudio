export type CategoryLayoutType = 'carousel' | 'grid' | 'banner';
export type CategoryDestinationType = 'collection' | 'internal_page';
export type ProductActionType = 'details' | 'customizer' | 'quote';

export interface InternalDestinationOption {
  href: string;
  label: string;
  kind: 'customizer' | 'page';
  arteProductType?: 'caneca' | 'quadro';
}

export const INTERNAL_DESTINATIONS: readonly InternalDestinationOption[] = [
  {
    href: '/personalizar/caneca',
    label: 'Personalizador 3D de Caneca (/personalizar/caneca)',
    kind: 'customizer',
    arteProductType: 'caneca',
  },
  {
    href: '/personalizar/quadro',
    label: 'Personalizador de Quadro (/personalizar/quadro)',
    kind: 'customizer',
    arteProductType: 'quadro',
  },
  {
    href: '/personalizar/agenda',
    label: 'Personalizador de Agenda (/personalizar/agenda)',
    kind: 'customizer',
  },
  {
    href: '/personalizar/planner',
    label: 'Personalizador de Planner (/personalizar/planner)',
    kind: 'customizer',
  },
  {
    href: '/personalizar/caderno',
    label: 'Personalizador de Caderno (/personalizar/caderno)',
    kind: 'customizer',
  },
  {
    href: '/personalizar/calendario',
    label: 'Gerador de Calendários (/personalizar/calendario)',
    kind: 'customizer',
  },
  {
    href: '/canecas',
    label: 'Coleção de Canecas (/canecas)',
    kind: 'page',
    arteProductType: 'caneca',
  },
  {
    href: '/quadros',
    label: 'Coleção de Quadros (/quadros)',
    kind: 'page',
    arteProductType: 'quadro',
  },
  {
    href: '/trabalhos',
    label: 'Galeria Feito no Estúdio (/trabalhos)',
    kind: 'page',
  },
] as const;

export const CUSTOMIZER_DESTINATIONS = INTERNAL_DESTINATIONS.filter(
  (dest) => dest.kind === 'customizer',
);

export function isValidInternalDestination(href: string): boolean {
  const clean = href.trim();
  if (!clean) return false;
  if (INTERNAL_DESTINATIONS.some((dest) => dest.href === clean)) return true;
  return Boolean(getCollectionDestinationSlug(clean));
}

export function getCollectionDestinationSlug(href: string): string | undefined {
  return /^\/colecoes\/([a-z0-9]+(?:-[a-z0-9]+)*)$/.exec(href.trim())?.[1];
}

export function isValidCustomizerDestination(href: string): boolean {
  const clean = href.trim();
  return CUSTOMIZER_DESTINATIONS.some((dest) => dest.href === clean);
}

export function resolveArteProductType(
  href?: string | null,
  categorySlug?: string | null,
): 'caneca' | 'quadro' | null {
  const cleanHref = (href ?? '').trim().split('?')[0];
  if (cleanHref) {
    const match = INTERNAL_DESTINATIONS.find((d) => d.href === cleanHref);
    if (match?.arteProductType) return match.arteProductType;
  }
  const slug = (categorySlug ?? '').trim().toLowerCase();
  if (slug === 'canecas' || slug === 'caneca') return 'caneca';
  if (slug === 'quadros' || slug === 'quadro') return 'quadro';
  return null;
}

export interface CategoryDestinationInput {
  slug: string;
  title?: string;
  destinationType?: CategoryDestinationType;
  destinationHref?: string;
  defaultProductAction?: ProductActionType;
  defaultProductHref?: string;
}

export interface ResolvedCategoryDestination {
  collectionHref: string;
  collectionLabel: string;
  customizerHref?: string;
  customizerLabel?: string;
}

export interface ProductDestinationInput {
  actionType?: ProductActionType;
  actionHref?: string;
  ctaLabel?: string;
  linkedArteId?: string;
}

export interface ResolvedProductDestination {
  kind: 'customizer' | 'details' | 'quote' | 'none';
  href?: string;
  label: string;
  isExternal: boolean;
  /** True when the primary action is a customizer and a secondary quote button makes sense. */
  allowSecondaryQuote: boolean;
}

function getDefaultCollectionHref(slug: string): string {
  const clean = slug.trim().toLowerCase();
  if (clean === 'canecas') return '/canecas';
  if (clean === 'quadros') return '/quadros';
  return `/colecoes/${clean}`;
}

function getDefaultCollectionLabel(slug: string): string {
  const clean = slug.trim().toLowerCase();
  if (clean === 'canecas') return 'Ver todas as canecas';
  if (clean === 'quadros') return 'Ver todos os quadros';
  return 'Ver coleção';
}

function getDefaultCustomizerLabel(href: string, hasArte: boolean): string {
  const clean = href.trim().split('?')[0];
  if (clean === '/personalizar/caneca') {
    return hasArte ? 'Personalizar modelo' : 'Simular caneca branca';
  }
  if (clean === '/personalizar/quadro') {
    return hasArte ? 'Personalizar modelo' : 'Simular no ambiente';
  }
  if (clean === '/personalizar/agenda') return 'Personalizar agenda';
  if (clean === '/personalizar/planner') return 'Criar planner';
  if (clean === '/personalizar/caderno') return 'Personalizar caderno';
  if (clean === '/personalizar/calendario') return 'Criar calendário';
  return 'Personalizar';
}

function getCategoryCustomizerCtaLabel(slug: string, href: string): string {
  const cleanSlug = slug.trim().toLowerCase();
  if (cleanSlug === 'quadros' || href === '/personalizar/quadro') return 'Crie seu quadro';
  if (cleanSlug === 'canecas' || href === '/personalizar/caneca') return 'Personalize sua caneca';
  return 'Personalizar agora';
}

export function resolveCategoryDestination(
  category: CategoryDestinationInput,
): ResolvedCategoryDestination {
  const fallbackHref = getDefaultCollectionHref(category.slug);
  const rawHref = (category.destinationHref ?? '').trim();
  const collectionHref =
    category.destinationType === 'internal_page' && isValidInternalDestination(rawHref)
      ? rawHref
      : category.destinationType === 'collection' && isValidInternalDestination(rawHref)
        ? rawHref
        : fallbackHref;

  const collectionLabel = getDefaultCollectionLabel(category.slug);

  let customizerHref: string | undefined;
  let customizerLabel: string | undefined;
  if (
    category.defaultProductAction === 'customizer' &&
    category.defaultProductHref &&
    isValidCustomizerDestination(category.defaultProductHref)
  ) {
    customizerHref = category.defaultProductHref.trim();
    customizerLabel = getCategoryCustomizerCtaLabel(category.slug, customizerHref);
  }

  return {
    collectionHref,
    collectionLabel,
    customizerHref,
    customizerLabel,
  };
}

export function resolveProductDestination(
  product: ProductDestinationInput,
  category: CategoryDestinationInput,
  options: {
    validLinkedArteId?: string;
    whatsappQuoteHref?: string;
    isAvailableInternalDestination?: (href: string) => boolean;
  } = {},
): ResolvedProductDestination {
  const effectiveAction: ProductActionType =
    product.actionType ?? category.defaultProductAction ?? 'quote';

  const rawHref = product.actionType
    ? (product.actionHref ?? '').trim()
    : (product.actionHref ?? category.defaultProductHref ?? '').trim();

  const customLabel = product.ctaLabel?.trim();
  const hasValidArte = Boolean(options.validLinkedArteId);
  const isAvailable = options.isAvailableInternalDestination ?? isValidInternalDestination;

  if (effectiveAction === 'customizer') {
    const candidateHref = isValidCustomizerDestination(rawHref)
      ? rawHref
      : category.defaultProductHref && isValidCustomizerDestination(category.defaultProductHref)
        ? category.defaultProductHref.trim()
        : '';

    if (candidateHref) {
      const arteType = resolveArteProductType(candidateHref, category.slug);
      const finalHref =
        arteType && options.validLinkedArteId
          ? `${candidateHref}?arte=${encodeURIComponent(options.validLinkedArteId)}`
          : candidateHref;
      const isStationeryCustomizer =
        candidateHref === '/personalizar/agenda' ||
        candidateHref === '/personalizar/planner' ||
        candidateHref === '/personalizar/caderno' ||
        candidateHref === '/personalizar/calendario';

      return {
        kind: 'customizer',
        href: finalHref,
        label: customLabel || getDefaultCustomizerLabel(candidateHref, hasValidArte),
        isExternal: false,
        allowSecondaryQuote: !isStationeryCustomizer,
      };
    }
  }

  if (effectiveAction === 'details') {
    const candidateHref = isAvailable(rawHref)
      ? rawHref
      : category.defaultProductHref && isAvailable(category.defaultProductHref)
        ? category.defaultProductHref.trim()
        : '';

    if (candidateHref) {
      return {
        kind: 'details',
        href: candidateHref,
        label: customLabel || 'Ver detalhes',
        isExternal: false,
        allowSecondaryQuote: true,
      };
    }
  }

  if (options.whatsappQuoteHref) {
    return {
      kind: 'quote',
      href: options.whatsappQuoteHref,
      label: customLabel || 'Orçar peça',
      isExternal: true,
      allowSecondaryQuote: false,
    };
  }

  const categoryDest = resolveCategoryDestination(category);
  if (effectiveAction === 'details' && isAvailable(categoryDest.collectionHref)) {
    return {
      kind: 'details',
      href: categoryDest.collectionHref,
      label: customLabel || 'Ver coleção',
      isExternal: false,
      allowSecondaryQuote: false,
    };
  }

  return {
    kind: 'none',
    label: 'Personalizável',
    isExternal: false,
    allowSecondaryQuote: false,
  };
}
