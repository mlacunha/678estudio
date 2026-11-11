import { randomUUID } from 'node:crypto';
import type { Client, InStatement, Row } from '@libsql/client';
import { getDbClient, initDatabase } from './database';
import {
  plannerConfigVersion,
  plannerProduct,
  isPlannerReference,
  type PlannerQuoteAsset,
  type PlannerQuoteConfig,
} from '../server/planner/quoteConfig';

export const plannerQuotesPerPage = 25;
const columns = 'id, product, created_at, status, config_version, config_json';

export interface PlannerQuoteRecord {
  id: string;
  product: string;
  createdAt: string;
  status: string;
  configVersion: number;
  config: PlannerQuoteConfig;
}

function mapPlannerQuote(row: Row): PlannerQuoteRecord {
  return {
    id: String(row.id),
    product: String(row.product),
    createdAt: String(row.created_at),
    status: String(row.status),
    configVersion: Number(row.config_version),
    config: JSON.parse(String(row.config_json)) as PlannerQuoteConfig,
  };
}

export async function getPlannerQuoteByDraft(
  token: string,
  client: Client = getDbClient()
): Promise<PlannerQuoteRecord | undefined> {
  if (!isPlannerReference(token)) return undefined;
  await initDatabase(client);
  const { rows: [row] } = await client.execute({
    sql: `SELECT ${columns} FROM planner_quotes WHERE draft_token = ?`,
    args: [token],
  });
  if (row) return mapPlannerQuote(row);
  return undefined;
}

export async function savePlannerQuote(
  token: string,
  config: PlannerQuoteConfig,
  assets: PlannerQuoteAsset[],
  client: Client = getDbClient()
): Promise<PlannerQuoteRecord> {
  await initDatabase(client);
  const id = randomUUID();
  const statements: InStatement[] = [{
    sql: `INSERT INTO planner_quotes (id, draft_token, product, created_at, status, config_version, config_json)
          VALUES (?, ?, ?, ?, 'requested', ?, ?) ON CONFLICT(draft_token) DO NOTHING`,
    args: [
      id,
      token,
      plannerProduct,
      new Date().toISOString(),
      plannerConfigVersion,
      JSON.stringify(config),
    ],
  }];

  for (const { name, mime, content } of assets) {
    statements.push({
      sql: 'INSERT INTO planner_quote_assets (quote_id, name, mime, content) SELECT id, ?, ?, ? FROM planner_quotes WHERE id = ?',
      args: [name, mime, Uint8Array.from(content).buffer, id],
    });
  }

  await client.batch(statements, 'write');
  const quote = await getPlannerQuoteByDraft(token, client);
  if (!quote) throw new Error('Solicitação de planner não recuperada após o salvamento.');
  return quote;
}

export async function getPlannerQuote(
  id: string,
  client: Client = getDbClient()
): Promise<PlannerQuoteRecord | undefined> {
  if (!isPlannerReference(id)) return undefined;
  await initDatabase(client);
  const { rows: [row] } = await client.execute({
    sql: `SELECT ${columns} FROM planner_quotes WHERE id = ?`,
    args: [id],
  });
  if (row) return mapPlannerQuote(row);
  return undefined;
}

export async function listPlannerQuotes(
  page: number,
  client: Client = getDbClient()
): Promise<{ quotes: PlannerQuoteRecord[]; totalPages: number }> {
  await initDatabase(client);
  const limit = plannerQuotesPerPage;
  const offset = Math.max(0, (page - 1) * limit);

  const [countResult, listResult] = await Promise.all([
    client.execute('SELECT COUNT(*) as count FROM planner_quotes'),
    client.execute({
      sql: `SELECT ${columns} FROM planner_quotes ORDER BY created_at DESC LIMIT ? OFFSET ?`,
      args: [limit, offset],
    }),
  ]);

  const total = Number(countResult.rows[0]?.count ?? 0);
  const totalPages = Math.max(1, Math.ceil(total / limit));
  const quotes = listResult.rows.map(mapPlannerQuote);

  return { quotes, totalPages };
}

export async function getPlannerQuoteAsset(
  quoteId: string,
  name: string,
  client: Client = getDbClient()
): Promise<{ mime: string; content: Buffer } | undefined> {
  await initDatabase(client);
  const { rows: [row] } = await client.execute({
    sql: 'SELECT mime, content FROM planner_quote_assets WHERE quote_id = ? AND name = ?',
    args: [quoteId, name],
  });
  if (row?.content instanceof ArrayBuffer) {
    return { mime: String(row.mime), content: Buffer.from(row.content) };
  }
  return undefined;
}

