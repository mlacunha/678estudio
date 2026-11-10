import { randomUUID } from 'node:crypto';
import type { Client, InStatement, Row } from '@libsql/client';
import { getDbClient, initDatabase } from './database';
import { agendaConfigVersion, agendaProduct, isAgendaReference, type QuoteAsset, type QuoteConfig } from '../server/agenda/quoteConfig';

export const agendaQuotesPerPage = 25;
const columns = 'id, product, created_at, status, config_version, config_json';

function mapQuote(row: Row) {
  return {
    id: String(row.id),
    product: String(row.product),
    createdAt: String(row.created_at),
    status: String(row.status),
    configVersion: Number(row.config_version),
    config: JSON.parse(String(row.config_json)) as QuoteConfig,
  };
}

export async function getAgendaQuoteByDraft(token: string, client: Client = getDbClient()) {
  if (!isAgendaReference(token)) return;
  await initDatabase(client);
  const { rows: [row] } = await client.execute({
    sql: `SELECT ${columns} FROM agenda_quotes WHERE draft_token = ?`, args: [token],
  });
  if (row) return mapQuote(row);
}

export async function saveAgendaQuote(token: string, config: QuoteConfig, assets: QuoteAsset[], client: Client = getDbClient()) {
  await initDatabase(client);
  const id = randomUUID();
  const statements: InStatement[] = [{
    sql: `INSERT INTO agenda_quotes (id, draft_token, product, created_at, status, config_version, config_json)
      VALUES (?, ?, ?, ?, 'requested', ?, ?) ON CONFLICT(draft_token) DO NOTHING`,
    args: [id, token, agendaProduct, new Date().toISOString(), agendaConfigVersion, JSON.stringify(config)],
  }];
  for (const { name, mime, content } of assets) {
    // Apenas a transação que criou o pedido pode inserir seus arquivos.
    statements.push({
      sql: 'INSERT INTO agenda_quote_assets (quote_id, name, mime, content) SELECT id, ?, ?, ? FROM agenda_quotes WHERE id = ?',
      args: [name, mime, Uint8Array.from(content).buffer, id],
    });
  }
  await client.batch(statements, 'write');
  const quote = await getAgendaQuoteByDraft(token, client);
  if (!quote) throw new Error('Solicitação de agenda não recuperada após o salvamento.');
  return quote;
}

export async function getAgendaQuote(id: string, client: Client = getDbClient()) {
  if (!isAgendaReference(id)) return;
  await initDatabase(client);
  const { rows: [row] } = await client.execute({
    sql: `SELECT ${columns} FROM agenda_quotes WHERE id = ?`, args: [id],
  });
  if (row) return mapQuote(row);
}

export async function listAgendaQuotes(page: number, client: Client = getDbClient()) {
  await initDatabase(client);
  const { rows } = await client.execute({
    sql: `SELECT ${columns} FROM agenda_quotes ORDER BY created_at DESC, id DESC LIMIT ? OFFSET ?`,
    args: [agendaQuotesPerPage + 1, (page - 1) * agendaQuotesPerPage],
  });
  return { quotes: rows.slice(0, agendaQuotesPerPage).map(mapQuote), hasMore: rows.length > agendaQuotesPerPage };
}

export async function getAgendaQuoteAsset(id: string, name: QuoteAsset['name'], client: Client = getDbClient()) {
  if (!isAgendaReference(id)) return;
  await initDatabase(client);
  const { rows: [row] } = await client.execute({
    sql: 'SELECT mime, content FROM agenda_quote_assets WHERE quote_id = ? AND name = ?', args: [id, name],
  });
  if (row?.content instanceof ArrayBuffer) return { mime: String(row.mime), content: Buffer.from(row.content) };
}
