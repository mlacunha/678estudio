import type { APIRoute } from 'astro';
import { getNotebookQuote, getNotebookQuoteAsset } from '../../../../db/notebookQuotes';
import { getRequestStudioSettings } from '../../../../db/studioSettings';
import { compileNotebook } from '../../../../server/caderno/compiler.mjs';
import { parseA4PrintQuery, renderSelectedA4Output } from '../../../../server/print/a4Imposition';

export const prerender = false;
let compiling = false;

export const GET: APIRoute = async ({ params, url, locals }) => {
  const parsedPrint = parseA4PrintQuery(url.searchParams);
  if (!parsedPrint.valid) {
    return new Response(parsedPrint.error, { status: 400 });
  }

  const id = params.id ?? '';
  const quote = await getNotebookQuote(id);
  if (!quote) {
    return new Response('Solicitação de caderno não encontrada.', { status: 404 });
  }

  if (compiling) {
    return new Response('Um caderno já está sendo compilado. Aguarde alguns instantes.', { status: 503 });
  }

  compiling = true;
  try {
    let logoBuffer: Buffer | undefined;
    if (quote.config.logo) {
      const asset = await getNotebookQuoteAsset(quote.id, 'logo');
      if (asset) logoBuffer = asset.content;
    }

    const studioSettings = await getRequestStudioSettings(locals).catch(() => null);
    const pdfBuffer = await compileNotebook(
      {
        ...quote.config,
        logo: logoBuffer,
        studio: studioSettings
          ? {
              instagram: studioSettings.instagram || '@678estudio',
              whatsapp: studioSettings.whatsapp ? `+${studioSettings.whatsapp}` : '',
              email: studioSettings.email || '',
              site: '678estudio.com.br',
            }
          : undefined,
      },
      { format: 'pdf' },
    );

    const finalPdf = await renderSelectedA4Output(new Uint8Array(pdfBuffer), parsedPrint.mode, parsedPrint.options);
    const suffix = parsedPrint.mode === 'a5' ? '' : `-${parsedPrint.mode}`;
    const filename = `${quote.config.model}-${quote.id}${suffix}.pdf`;

    return new Response(new Uint8Array(finalPdf), {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${filename}"`,
        'Cache-Control': 'no-store',
      },
    });
  } catch {
    return new Response('Falha ao gerar o PDF de produção do caderno.', { status: 500 });
  } finally {
    compiling = false;
  }
};

