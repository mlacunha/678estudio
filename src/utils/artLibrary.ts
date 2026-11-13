export const ART_PRODUCT_TYPES = ['caneca', 'quadro'] as const;
export type ArtProductType = (typeof ART_PRODUCT_TYPES)[number];

export const ART_PRODUCT_LABELS: Record<ArtProductType, string> = {
  caneca: 'Caneca',
  quadro: 'Quadro',
};

export const ART_UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/;
export const ART_CODE_PATTERN = /^[A-Z0-9][A-Z0-9_-]{1,31}$/;
export const ART_THUMB_MAX_PX = 400;
export const ART_PREVIEW_MAX_PX = 1600;
export const ART_BATCH_CONCURRENCY = 2;
export const ART_MAX_INPUT_PIXELS = 100_000_000;

export interface ArtLibraryLimits {
  maxBytes: number;
  maxDimension: number;
  minDimension: number;
}

export interface DetectedImageFormat {
  mime: 'image/jpeg' | 'image/png' | 'image/webp';
  ext: 'jpg' | 'png' | 'webp';
}

function parsePositiveInt(value: string | undefined, fallback: number): number {
  const parsed = Number(value);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : fallback;
}

/** Retorna limites configuráveis de tamanho e dimensões para upload de artes. */
export function getArtLibraryLimits(): ArtLibraryLimits {
  return {
    maxBytes: parsePositiveInt(process.env.ART_LIBRARY_MAX_BYTES, 15 * 1024 * 1024),
    maxDimension: parsePositiveInt(process.env.ART_LIBRARY_MAX_DIMENSION, 12000),
    minDimension: parsePositiveInt(process.env.ART_LIBRARY_MIN_DIMENSION, 100),
  };
}

/** Detecta o formato real da imagem pelos bytes mágicos, ignorando a extensão do arquivo. */
export function detectImageFormat(buffer: Buffer): DetectedImageFormat | null {
  if (buffer.length < 12) return null;
  if (buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff) {
    return { mime: 'image/jpeg', ext: 'jpg' };
  }
  if (buffer.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]))) {
    return { mime: 'image/png', ext: 'png' };
  }
  if (buffer.toString('ascii', 0, 4) === 'RIFF' && buffer.toString('ascii', 8, 12) === 'WEBP') {
    return { mime: 'image/webp', ext: 'webp' };
  }
  return null;
}

/** Gera slug limpo para categorias temáticas de artes. */
export function slugifyArtCategory(value: string): string {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 60);
}

/** Normaliza o código único da arte (maiúsculas, sem espaços). */
export function normalizeArtCode(value: string): string {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toUpperCase()
    .trim()
    .replace(/[^A-Z0-9_-]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 32);
}

/** Gera um título legível a partir do nome de arquivo quando enviado em lote. */
export function titleFromFilename(filename: string): string {
  const base = filename.replace(/\.[^.]+$/, '').replace(/[_-]+/g, ' ').replace(/\s+/g, ' ').trim();
  if (!base) return 'Arte sem título';
  return base.slice(0, 120);
}

/** Filtra e valida tipos de produto suportados inicialmente na interface. */
export function parseArtProductTypes(values: unknown): ArtProductType[] {
  if (!Array.isArray(values)) return [];
  const allowed = new Set<string>(ART_PRODUCT_TYPES);
  return Array.from(new Set(values.map(v => String(v).trim().toLowerCase()).filter(v => allowed.has(v)))) as ArtProductType[];
}

/** Executa tarefas assíncronas em lote com concorrência limitada. */
export async function runWithConcurrency<T, R>(
  items: readonly T[],
  limit: number,
  worker: (item: T, index: number) => Promise<R>,
): Promise<R[]> {
  const results = new Array<R>(items.length);
  let cursor = 0;

  async function next(): Promise<void> {
    while (cursor < items.length) {
      const index = cursor++;
      results[index] = await worker(items[index], index);
    }
  }

  const workers = Array.from({ length: Math.min(limit, items.length) }, () => next());
  await Promise.all(workers);
  return results;
}

