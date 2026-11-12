import type { APIRoute } from 'astro';
import { getPlannerQuote, getPlannerQuoteAsset } from '../../../../db/plannerQuotes';
import { compilePlannerEssencial } from '../../../../server/planner/essencial.mjs';
import { parseA4PrintQuery, renderSelectedA4Output } from '../../../../server/print/a4Imposition';

export const prerender = false;
let compiling = false;

export const GET: APIRoute = async ({ params, url }) => {
  const parsedPrint = parseA4PrintQuery(url.searchParams);
  if (!parsedPrint.valid) {
    return new Response(parsedPrint.error, { status: 400 });
  }

  const id = params.id ?? '';
  const quote = await getPlannerQuote(id);
  if (!quote) {
    return new Response('Solicitação de planner não encontrada.', { status: 404 });
  }

  if (compiling) {
    return new Response('Um planner já está sendo compilado. Aguarde alguns instantes.', { status: 503 });
  }

  compiling = true;
  try {
    let logoBuffer: Buffer | undefined;
    if (quote.config.logo) {
      const asset = await getPlannerQuoteAsset(quote.id, 'logo');
      if (asset) logoBuffer = asset.content;
    }

    const pdfBuffer = await compilePlannerEssencial(
      {
        ...quote.config,
        logo: logoBuffer,
      },
      { format: 'pdf' },
    );

    const finalPdf = await renderSelectedA4Output(new Uint8Array(pdfBuffer), parsedPrint.mode, parsedPrint.options);
    const suffix = parsedPrint.mode === 'a5' ? '' : `-${parsedPrint.mode}`;
    const filename = `planner-essencial-${quote.config.mode}-${quote.id}${suffix}.pdf`;

    return new Response(new Uint8Array(finalPdf), {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${filename}"`,
        'Cache-Control': 'no-store',
      },
    });
  } catch {
    return new Response('Falha ao gerar o PDF de produção do planner.', { status: 500 });
  } finally {
    compiling = false;
  }
};
