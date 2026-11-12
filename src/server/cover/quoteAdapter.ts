import type { CoverConfig } from './coverConfig';
import { parseCoverConfig } from './coverConfig';

export interface EntityWithCover {
  cover?: CoverConfig;
  [key: string]: any;
}

export function extractCoverFromConfigJson(configJson: string | null | undefined): CoverConfig | null {
  if (!configJson) return null;
  try {
    const parsed = JSON.parse(configJson);
    if (parsed && typeof parsed === 'object' && parsed.cover) {
      return parseCoverConfig(parsed.cover);
    }
  } catch {
    // Retorna null em caso de JSON malformado
  }
  return null;
}

export function attachCoverToConfigJson(configJson: string, cover: CoverConfig): string {
  try {
    const parsed = JSON.parse(configJson);
    parsed.cover = cover;
    return JSON.stringify(parsed);
  } catch {
    return JSON.stringify({ cover });
  }
}

