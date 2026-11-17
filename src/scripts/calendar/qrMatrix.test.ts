import { describe, expect, it } from 'vitest';
import { buildQrMatrix } from './qrMatrix';

describe('calendar qrMatrix', () => {
  it('it should return null for empty input', () => {
    expect(buildQrMatrix('   ')).toBeNull();
  });

  it('it should generate a square boolean matrix for a valid URL using qrcode', () => {
    const qr = buildQrMatrix('https://678estudio.com.br');
    expect(qr).not.toBeNull();
    expect(qr!.size).toBeGreaterThanOrEqual(21);
    expect(qr!.rows).toHaveLength(qr!.size);
    expect(qr!.rows[0]).toHaveLength(qr!.size);
    // Top-left finder pattern corner must be dark
    expect(qr!.rows[0][0]).toBe(true);
  });
});
