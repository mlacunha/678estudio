const woodBase = [241, 231, 197] as const;

export const WOOD_PROFILES = {
  suave: { tint: 0.48, grain: 0.28 },
  intermediaria: { tint: 0.70, grain: 0.64 },
  intensa: { tint: 0.88, grain: 1.04 },
} as const;

function lattice(x: number, y: number): number {
  const hash = Math.imul(x, 374761393) ^ Math.imul(y, 668265263);
  return ((Math.imul(hash ^ (hash >>> 13), 1274126177) >>> 0) / 4294967295) - 0.5;
}

function noise(x: number, y: number): number {
  const ix = Math.floor(x);
  const iy = Math.floor(y);
  const fx = x - ix;
  const fy = y - iy;
  const u = fx * fx * (3 - 2 * fx);
  const v = fy * fy * (3 - 2 * fy);
  const top = lattice(ix, iy) * (1 - u) + lattice(ix + 1, iy) * u;
  const bottom = lattice(ix, iy + 1) * (1 - u) + lattice(ix + 1, iy + 1) * u;
  return top * (1 - v) + bottom * v;
}

export function createWoodSurface(width: number, height: number): ImageData {
  const surface = new ImageData(width, height);
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const fiber = x + 9 * noise(x / 65, y / 155) + 3 * Math.sin(y / 130 + x / 75);
      const bands = noise(fiber / 35, y / 180) * 25;
      const grain = noise(fiber / 4, y / 65) * 15 + noise(fiber / 1.25, y / 22) * 13;
      const pores = Math.min(0, noise(fiber / 0.8, y / 9) + 0.18) * 16;
      const warm = noise(x / 95 + 20, y / 135) * 17;
      const tone = bands + grain + pores;
      const i = (y * width + x) * 4;
      surface.data[i] = woodBase[0] + tone + warm * 0.24;
      surface.data[i + 1] = woodBase[1] + tone + warm * 0.50;
      surface.data[i + 2] = woodBase[2] + tone * 1.12 + warm;
      surface.data[i + 3] = 255;
    }
  }
  return surface;
}

export function sublimateArtwork(
  artwork: Uint8ClampedArray,
  substrate: Uint8ClampedArray,
  profile: (typeof WOOD_PROFILES)[keyof typeof WOOD_PROFILES],
): void {
  for (let i = 0; i < artwork.length; i += 4) {
    const alpha = artwork[i + 3] / 255;
    const light = (0.2126 * artwork[i] + 0.7152 * artwork[i + 1] + 0.0722 * artwork[i + 2]) / 255;
    const highlight = light ** 4;
    const tint = profile.tint + (1 - profile.tint) * highlight;
    const grain = profile.grain * (0.18 + 0.82 * light) * (1 - highlight) + highlight;
    for (let channel = 0; channel < 3; channel++) {
      const wood = substrate[i + channel];
      const base = woodBase[channel];
      // A madeira aquece os pigmentos e os veios afetam mais os tons claros.
      const ink = artwork[i + channel] * (1 - tint * (1 - base / 255)) + (wood - base) * grain;
      artwork[i + channel] = ink * alpha + wood * (1 - alpha);
    }
    artwork[i + 3] = 255;
  }
}
