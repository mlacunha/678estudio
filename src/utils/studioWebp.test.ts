import { expect, it } from 'vitest';
import { getStudioWebpSize } from './studioWebp';

// Opaque 1 × 1 WebP frame.
const webp = Buffer.from('UklGRiQAAABXRUJQVlA4IBgAAAAwAQCdASoBAAEAAUAmJaQAA3AA/vuUAAA=', 'base64');

it('reads dimensions from a lossy WebP frame and rejects truncated or mislabeled images', () => {
  expect(getStudioWebpSize(webp)).toEqual({ width: 1, height: 1 });
  expect(getStudioWebpSize(webp.subarray(0, -1))).toBeUndefined();
  expect(getStudioWebpSize(Buffer.from('image/png'))).toBeUndefined();
});

it('accepts the static Canvas container with an ICC profile and rejects mismatched or animated canvases', () => {
  const extended = Buffer.concat([
    webp.subarray(0, 12),
    Buffer.from('565038580a0000002000000000000000000049434350020000000000', 'hex'),
    webp.subarray(12),
  ]);
  extended.writeUInt32LE(extended.length - 8, 4);
  expect(getStudioWebpSize(extended)).toEqual({ width: 1, height: 1 });
  extended[24] = 1;
  expect(getStudioWebpSize(extended)).toBeUndefined();
  extended[24] = 0;
  extended[20] |= 2;
  expect(getStudioWebpSize(extended)).toBeUndefined();
});
