import type { APIRoute } from 'astro';
import { getAgendaQuote, getAgendaQuoteAsset } from '../../db/agendaQuotes';
import { getStudioSettings } from '../../db/studioSettings';
import { compileClassicAgenda, isClassicAgendaConfig } from '../../server/agenda/classic.mjs';
import { agendaConfigVersion } from '../../server/agenda/quoteConfig';
import { parseA4PrintQuery, renderSelectedA4Output } from '../../server/print/a4Imposition';

export const prerender = false;
let compiling = false;

function formatInstagramHandle(url: string): string {
  if (!url) return '@678estudio';
  const match = url.match(/instagram\.com\/([^/?#]+)/i);
  return match?.[1] ? `@${match[1]}` : url;
}

async function resolveAgendaConfig(url: URL) {
  const layout = url.searchParams.get('layout');
  const yearParam = url.searchParams.get('ano') ?? '';
  const year = Number(yearParam);
  const quoteId = url.searchParams.get('pedido');

  if (quoteId === null && (!layout || !/^\d{4}$/.test(yearParam) || !isClassicAgendaConfig(layout, year))) {
    return { error: new Response('Informe layout e ano válidos.', { status: 400 }) };
  }
  if (quoteId === null) {
    return { config: { layout: layout ?? '', year }, baseName: `agenda-classica-${year}-${layout}` };
  }

  const quote = await getAgendaQuote(quoteId);
  if (!quote) return { error: new Response('Solicitação de agenda não encontrada.', { status: 404 }) };
  if (quote.configVersion !== agendaConfigVersion || !['agenda-classica-v1', 'agenda-classica-v2'].includes(quote.config.template)) {
    return { error: new Response('Versão da configuração indisponível para geração.', { status: 409 }) };
  }
  const logo = quote.config.logo ? await getAgendaQuoteAsset(quote.id, quote.config.logo.normalized) : undefined;
  if (quote.config.logo && !logo) {
    return { error: new Response('Logomarca de produção indisponível.', { status: 409 }) };
  }
  return {
    config: { ...quote.config, logo: logo?.content },
    baseName: `agenda-classica-${quote.config.year}-${quote.id}`,
  };
}

const handleRequest: APIRoute = async ({ url }) => {
  const parsedPrint = parseA4PrintQuery(url.searchParams);
  if (!parsedPrint.valid) return new Response(parsedPrint.error, { status: 400 });

  const resolved = await resolveAgendaConfig(url);
  if ('error' in resolved && resolved.error) return resolved.error;
  if (compiling) return new Response('Uma agenda está sendo gerada. Tente novamente.', { status: 503 });

  compiling = true;
  try {
    const studioSettings = await getStudioSettings().catch(() => ({
      whatsapp: '',
      instagram: 'https://www.instagram.com/678estudio/',
      facebook: '',
      email: '',
    }));
    const studio = {
      instagram: formatInstagramHandle(studioSettings.instagram),
      whatsapp: studioSettings.whatsapp,
      email: studioSettings.email,
      site: url.origin && !url.origin.includes('localhost') ? url.origin : '',
    };
    const rawPdf = await compileClassicAgenda({ ...resolved.config, studio });
    const finalPdf = await renderSelectedA4Output(new Uint8Array(rawPdf), parsedPrint.mode, parsedPrint.options);
    const suffix = parsedPrint.mode === 'a5' ? '' : `-${parsedPrint.mode}`;

    return new Response(new Uint8Array(finalPdf), {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${resolved.baseName}${suffix}.pdf"`,
        'Cache-Control': 'no-store',
      },
    });
  } catch {
    return new Response('Falha ao gerar a Agenda Clássica.', { status: 500 });
  } finally {
    compiling = false;
  }
};

export const POST: APIRoute = handleRequest;
export const GET: APIRoute = handleRequest;
