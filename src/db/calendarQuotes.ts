import { randomUUID } from 'node:crypto';
import type { Client, InStatement, Row } from '@libsql/client';
import type { AdvertiserIdentity, CalendarImagePlacement, CalendarModality, DeskBaseConfig } from '../scripts/calendar/types';
import { getDbClient, initDatabase } from './database';

export const calendarConfigVersion = 1;
export const calendarQuotesPerPage = 25;
export const isCalendarReference = (value: string): boolean =>
  /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/.test(value);

export interface CalendarQuoteConfig {
  modality: CalendarModality;
  year: number;
  templateId: string;
  format: 'A4' | 'A3';
  orientation: 'portrait' | 'landscape';
  weekStart: 'sunday' | 'monday';
  includeFederalHolidays: boolean;
  includeGoodFriday: boolean;
  includeBleed: boolean;
  wireOMarginMm?: number;
  includeCover?: boolean;
  title?: string;
  subtitle?: string;
  imagePlacement: CalendarImagePlacement;
  imageScope?: 'all' | 'page';
  libraryArtCodes?: Record<string, string>;
  advertiser?: AdvertiserIdentity;
  sheetWidthMm?: number;
  sheetHeightMm?: number;
  base?: DeskBaseConfig;
  assetNames: string[];
}

export interface CalendarQuoteAsset {
  name: string;
  mime: string;
  content: Buffer;
}

export interface CalendarQuoteRecord {
  id: string;
  product: string;
  createdAt: string;
  status: string;
  configVersion: number;
  config: CalendarQuoteConfig;
}

const columns = 'id, product, created_at, status, config_version, config_json';

function mapCalendarQuote(row: Row): CalendarQuoteRecord {
  return {
    id: String(row.id),
    product: String(row.product),
    createdAt: String(row.created_at),
    status: String(row.status),
    configVersion: Number(row.config_version),
    config: JSON.parse(String(row.config_json)) as CalendarQuoteConfig,
  };
}

export function calendarQuotePath(id: string): string {
  return `/calendario/orcamento/${id}`;
}

export function calendarProductName(modality: CalendarModality): string {
  if (modality === 'monthly') return 'Calendário Mensal Wire-O';
  if (modality === 'desk') return 'Calendário de Mesa Wire-O';
  return 'Calendário Anual';
}

export async function saveCalendarQuote(
  config: CalendarQuoteConfig,
  assets: CalendarQuoteAsset[],
  client: Client = getDbClient(),
): Promise<CalendarQuoteRecord> {
  await initDatabase(client);
  const id = randomUUID();
  const product = calendarProductName(config.modality);
  const statements: InStatement[] = [{
    sql: `INSERT INTO calendar_quotes (id, product, created_at, status, config_version, config_json)
          VALUES (?, ?, ?, 'requested', ?, ?)`,
    args: [id, product, new Date().toISOString(), calendarConfigVersion, JSON.stringify(config)],
  }];

  for (const asset of assets) {
    statements.push({
      sql: 'INSERT INTO calendar_quote_assets (quote_id, name, mime, content) VALUES (?, ?, ?, ?)',
      args: [id, asset.name, asset.mime, asset.content],
    });
  }

  await client.batch(statements, 'write');
  const saved = await getCalendarQuote(id, client);
  if (!saved) throw new Error('Falha ao gravar solicitação de calendário.');
  return saved;
}

export async function getCalendarQuote(
  id: string,
  client: Client = getDbClient(),
): Promise<CalendarQuoteRecord | undefined> {
  if (!isCalendarReference(id)) return undefined;
  await initDatabase(client);
  const { rows: [row] } = await client.execute({
    sql: `SELECT ${columns} FROM calendar_quotes WHERE id = ?`,
    args: [id],
  });
  return row ? mapCalendarQuote(row) : undefined;
}

export async function getCalendarQuoteAsset(
  id: string,
  name: string,
  client: Client = getDbClient(),
): Promise<{ mime: string; content: Buffer } | undefined> {
  if (!isCalendarReference(id)) return undefined;
  await initDatabase(client);
  const { rows: [row] } = await client.execute({
    sql: 'SELECT mime, content FROM calendar_quote_assets WHERE quote_id = ? AND name = ?',
    args: [id, name],
  });
  if (!row) return undefined;
  return {
    mime: String(row.mime),
    content: Buffer.from(row.content as ArrayBuffer),
  };
}

export async function listCalendarQuotes(
  page = 1,
  client: Client = getDbClient(),
): Promise<{ quotes: CalendarQuoteRecord[]; total: number }> {
  await initDatabase(client);
  const safePage = Math.max(1, Math.floor(page));
  const offset = (safePage - 1) * calendarQuotesPerPage;
  const [countRes, rowsRes] = await Promise.all([
    client.execute('SELECT COUNT(*) as total FROM calendar_quotes'),
    client.execute({
      sql: `SELECT ${columns} FROM calendar_quotes ORDER BY created_at DESC, id DESC LIMIT ? OFFSET ?`,
      args: [calendarQuotesPerPage, offset],
    }),
  ]);
  return {
    quotes: rowsRes.rows.map(mapCalendarQuote),
    total: Number(countRes.rows[0]?.total ?? 0),
  };
}
