import type { APIRoute } from 'astro';
import { getAgendaQuote, getAgendaQuoteAsset } from '../../db/agendaQuotes';
import { compileClassicAgenda, isClassicAgendaConfig } from '../../server/agenda/classic.mjs';
import { agendaConfigVersion } from '../../server/agenda/quoteConfig';

export const prerender = false;
let compiling = false;

export const POST: APIRoute = async ({ url }) => {
  const layout = url.searchParams.get('layout');
  const yearParam = url.searchParams.get('ano') ?? '';
  const year = Number(yearParam);
  const quoteId = url.searchParams.get('pedido');
  if (quoteId === null && (!layout || !/^\d{4}$/.test(yearParam) || !isClassicAgendaConfig(layout, year))) {
    return new Response('Informe layout e ano válidos.', { status: 400 });
  }
  if (compiling) {
    return new Response('Uma agenda está sendo gerada. Tente novamente.', { status: 503 });
  }

  compiling = true;
  try {
    let config: Parameters<typeof compileClassicAgenda>[0] = { layout: layout ?? '', year };
    let name = `agenda-classica-${year}-${layout}`;
    if (quoteId !== null) {
      const quote = await getAgendaQuote(quoteId);
      if (!quote) return new Response('Solicitação de agenda não encontrada.', { status: 404 });
      if (quote.configVersion !== agendaConfigVersion || quote.config.template !== 'agenda-classica-v1') {
        return new Response('Versão da configuração indisponível para geração.', { status: 409 });
      }
      const logo = quote.config.logo ? await getAgendaQuoteAsset(quote.id, quote.config.logo.normalized) : undefined;
      if (quote.config.logo && !logo) return new Response('Logomarca de produção indisponível.', { status: 409 });
      config = { ...quote.config, logo: logo?.content };
      name = `agenda-classica-${quote.config.year}-${quote.id}`;
    }
    const pdf = await compileClassicAgenda(config);
    return new Response(new Uint8Array(pdf), {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${name}.pdf"`,
      },
    });
  } catch (error) {
    console.error('Falha ao gerar a Agenda Clássica', error);
    return new Response('Falha ao gerar a Agenda Clássica.', { status: 500 });
  } finally {
    compiling = false;
  }
};
