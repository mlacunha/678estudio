import { describe, expect, it } from 'vitest';
import { FRAME_MARGINS, getFrameLayout } from './frameLayout';

describe('frame layout', () => {
  it('rotates the same frame dimensions and preserves its inset', () => {
    const portrait = getFrameLayout('portrait', 5, 2);
    const landscape = getFrameLayout('landscape', 5, 2);
    expect([portrait.frameW, portrait.frameH, landscape.frameW, landscape.frameH]).toEqual([450, 600, 600, 450]);
    expect(portrait.inset).toBe(landscape.inset);
  });

  it.each(['portrait', 'landscape'] as const)('keeps independent, symmetric margins in %s', orientation => {
    const base = getFrameLayout(orientation, 1, 2);
    const wider = getFrameLayout(orientation, 7, 2);
    const taller = getFrameLayout(orientation, 1, 7);
    expect(wider.artW).toBeLessThan(base.artW);
    expect(wider.artH).toBe(base.artH);
    expect(taller.artH).toBeLessThan(base.artH);
    expect(taller.artW).toBe(base.artW);
    for (const layout of [base, wider, taller]) {
      expect(2 * layout.artLeft + layout.artW).toBe(layout.boardW);
      expect(2 * layout.artTop + layout.artH).toBe(layout.boardH);
    }
  });

  it.each(['portrait', 'landscape'] as const)('limits margins to a usable print area in %s', orientation => {
    const layout = getFrameLayout(orientation, -1, 100);
    expect(layout).toEqual(getFrameLayout(orientation, FRAME_MARGINS.min, FRAME_MARGINS.max));
    expect(Math.min(layout.artW, layout.artH)).toBeGreaterThanOrEqual(150);
  });
});
