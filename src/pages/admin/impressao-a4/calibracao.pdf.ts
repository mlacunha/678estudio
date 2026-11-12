import type { APIRoute } from 'astro';
import { generateA4CalibrationPdf, parseA4PrintQuery } from '../../../server/print/a4Imposition';

export const prerender = false;

export const GET: APIRoute = async ({ url }) => {
  const parsed = parseA4PrintQuery(url.searchParams);
  if (!parsed.valid) {
    return new Response(parsed.error, { status: 400 });
  }
  const { flipMode, scaleMode } = parsed.options;
  const pdf = await generateA4CalibrationPdf({ flipMode, scaleMode });
  const filename = `calibracao-a4-corte-a5-${flipMode}-${scaleMode}.pdf`;

  return new Response(new Uint8Array(pdf), {
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="${filename}"`,
      'Cache-Control': 'no-store',
    },
  });
};

