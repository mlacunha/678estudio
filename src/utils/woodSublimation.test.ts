import { describe, expect, it } from 'vitest';
import { sublimateArtwork, WOOD_PROFILES } from './woodSublimation';

describe('wood sublimation', () => {
  const wood = new Uint8ClampedArray([246, 237, 209, 255, 232, 219, 180, 255]);

  it('leaves wood visible through transparent artwork and white highlights', () => {
    const artwork = new Uint8ClampedArray([0, 0, 0, 0, 255, 255, 255, 255]);
    for (const profile of Object.values(WOOD_PROFILES)) {
      const output = artwork.slice();
      sublimateArtwork(output, wood, profile);
      expect(output).toEqual(wood);
    }
  });

  it('changes grain contrast across the three profiles without flattening shadows', () => {
    const contrasts = Object.values(WOOD_PROFILES).map(profile => {
      const midtones = new Uint8ClampedArray([175, 175, 175, 255, 175, 175, 175, 255]);
      sublimateArtwork(midtones, wood, profile);
      const shadows = new Uint8ClampedArray([20, 24, 30, 255, 20, 24, 30, 255]);
      sublimateArtwork(shadows, wood, profile);
      expect(shadows[0]).toBeLessThan(30);
      expect(shadows[2]).toBeGreaterThan(shadows[0]);
      return midtones[0] - midtones[4];
    });
    expect(contrasts[0]).toBeLessThan(contrasts[1]);
    expect(contrasts[1]).toBeLessThan(contrasts[2]);
  });
});
