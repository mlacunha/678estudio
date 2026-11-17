import QRCode from 'qrcode';

export interface QrMatrix {
  size: number;
  rows: boolean[][];
}

/** Gera matriz booleana de QR Code usando a biblioteca qrcode para desenho vetorial em SVG e PDF. */
export function buildQrMatrix(rawText: string): QrMatrix | null {
  const text = rawText.trim();
  if (!text) return null;

  const qr = QRCode.create(text, { errorCorrectionLevel: 'M' });
  const size = qr.modules.size;
  const rows: boolean[][] = [];
  for (let r = 0; r < size; r++) {
    const row: boolean[] = [];
    for (let c = 0; c < size; c++) {
      row.push(Boolean(qr.modules.get(r, c)));
    }
    rows.push(row);
  }
  return { size, rows };
}
