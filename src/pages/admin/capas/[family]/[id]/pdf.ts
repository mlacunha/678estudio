import type { APIRoute } from 'astro';
import { compileCoverPdf } from '../../../../../server/cover/compiler.mjs';
import { getNotebookQuote } from '../../../../../db/notebookQuotes';
import { getAgendaQuote } from '../../../../../db/agendaQuotes';
import { getPlannerQuote } from '../../../../../db/plannerQuotes';

export const prerender = false;

export const GET: APIRoute = async ({ params, url }) => {
  try {
    const { family, id } = params;
    if (!id || !family) {
      return new Response('Parâmetros inválidos', { status: 400 });
    }

    const format = url.searchParams.get('format') || 'front-a5';
    const bleed = url.searchParams.get('bleed') || '3mm';

    let config: any = null;
    let photoBuffer: Buffer | null = null;

    if (family === 'cadernos') {
      const quote = await getNotebookQuote(id);
      if (!quote) return new Response('Orçamento de caderno não encontrado', { status: 404 });
      config = quote.config;
    } else if (family === 'agendas') {
      const quote = await getAgendaQuote(id);
      if (!quote) return new Response('Orçamento de agenda não encontrado', { status: 404 });
      config = quote.config;
    } else if (family === 'planners') {
      const quote = await getPlannerQuote(id);
      if (!quote) return new Response('Orçamento de planner não encontrado', { status: 404 });
      config = quote.config;
    } else {
      return new Response('Família de produto desconhecida', { status: 400 });
    }

    const coverConfig = config?.cover;
    const pdfBuffer = await compileCoverPdf({
      target: format,
      bleed,
      style: coverConfig?.style || 'classic',
      typography: coverConfig?.typography || 'editorial',
      title: coverConfig?.title || config?.title || '678 Estudio',
      name: coverConfig?.name || config?.personalizationName || '',
      subtitle: coverConfig?.subtitle || '',
      colors: coverConfig?.colors || {},
      photoBuffer,
    });

    const filename = `capa-${family}-${id}-${format}.pdf`;
    return new Response(pdfBuffer, {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${filename}"`,
      },
    });
  } catch (err: any) {
    return new Response(`Erro ao compilar capa: ${err?.message || err}`, { status: 500 });
  }
};
