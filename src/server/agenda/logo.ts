import sharp from 'sharp';
import { hasImageSignature } from '../../utils/uploadImages';
import { agendaLogoTypes, maxAgendaLogoBytes } from './options.mjs';

export async function normalizeAgendaLogo(file: File) {
  if (!agendaLogoTypes.includes(file.type) || !file.size || file.size > maxAgendaLogoBytes) return;
  const input = Buffer.from(await file.arrayBuffer());
  if (!hasImageSignature(input, file.type)) return;
  try {
    // Decodifica antes de entregar ao Typst e remove metadados da imagem original.
    const normalized = await sharp(input, { limitInputPixels: 4_000_000, failOn: 'warning' })
      .rotate()
      .resize({ width: 512, height: 512, fit: 'inside', withoutEnlargement: true })
      .png()
      .timeout({ seconds: 3 })
      .toBuffer();
    return { original: input, normalized };
  } catch {
    return;
  }
}
