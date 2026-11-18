export type MugExportFormat = 'png' | 'jpeg' | 'webp';

export async function encodeMugExport(file: { name: string; blob: Blob }, format: MugExportFormat) {
  if (format === 'png') return file;

  const bitmap = await createImageBitmap(file.blob);
  const canvas = document.createElement('canvas');
  try {
    canvas.width = bitmap.width;
    canvas.height = bitmap.height;
    const context = canvas.getContext('2d');
    if (!context) throw new Error('Exportação indisponível no navegador.');
    if (format === 'jpeg') {
      context.fillStyle = '#fff';
      context.fillRect(0, 0, canvas.width, canvas.height);
    }
    context.drawImage(bitmap, 0, 0);
    const mime = 'image/' + format;
    const blob = await new Promise<Blob | null>(resolve => canvas.toBlob(resolve, mime, 0.95));
    if (blob?.type !== mime) throw new Error('Formato indisponível no navegador.');
    const extension = format === 'jpeg' ? 'jpg' : 'webp';
    return { name: file.name.replace(/\.png$/, '.' + extension), blob };
  } finally {
    bitmap.close();
    canvas.width = 0;
    canvas.height = 0;
  }
}

export function downloadMugFile(file: { name: string; blob: Blob }) {
  const url = URL.createObjectURL(file.blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = file.name;
  link.click();
  setTimeout(() => URL.revokeObjectURL(url), 60_000);
}
