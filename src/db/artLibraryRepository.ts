import type { Client } from '@libsql/client';
import { randomUUID } from 'node:crypto';
import { getDbClient, initDatabase } from './database';
import {
  ART_CODE_PATTERN,
  normalizeArtCode,
  slugifyArtCategory,
} from '../utils/artLibrary';

export interface ArtCategory {
  id: string;
  slug: string;
  name: string;
  displayOrder: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface ArtVersionRecord {
  arteId: string;
  version: number;
  originalFilename: string;
  originalMime: string;
  originalExt: string;
  width: number;
  height: number;
  thumbWidth: number;
  thumbHeight: number;
  previewWidth: number;
  previewHeight: number;
  fileSize: number;
  createdAt: string;
}

export interface ArtItem {
  id: string;
  code: string;
  title: string;
  description: string;
  groupDescription: string;
  currentVersion: number;
  isPublished: boolean;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  categories: Array<{ id: string; slug: string; name: string }>;
  products: string[];
  versionInfo: ArtVersionRecord | null;
}

export interface ArtDetail extends ArtItem {
  versions: ArtVersionRecord[];
}

export interface AdminArteFilters {
  q?: string;
  categoryId?: string;
  productType?: string;
  status?: 'active' | 'published' | 'draft' | 'inactive' | 'all';
}

export interface NewArtVersionInput {
  originalFilename: string;
  originalMime: string;
  originalExt: string;
  width: number;
  height: number;
  thumbWidth: number;
  thumbHeight: number;
  previewWidth: number;
  previewHeight: number;
  fileSize: number;
}

export class ArtRepositoryError extends Error {
  readonly status: number;
  constructor(message: string, status = 400) {
    super(message);
    this.status = status;
  }
}

function mapCategory(row: Record<string, unknown>): ArtCategory {
  return {
    id: String(row.id),
    slug: String(row.slug),
    name: String(row.name),
    displayOrder: Number(row.display_order),
    isActive: Boolean(row.is_active),
    createdAt: String(row.created_at),
    updatedAt: String(row.updated_at),
  };
}

function mapVersion(row: Record<string, unknown>): ArtVersionRecord {
  return {
    arteId: String(row.arte_id),
    version: Number(row.version),
    originalFilename: String(row.original_filename),
    originalMime: String(row.original_mime),
    originalExt: String(row.original_ext),
    width: Number(row.width),
    height: Number(row.height),
    thumbWidth: Number(row.thumb_width),
    thumbHeight: Number(row.thumb_height),
    previewWidth: Number(row.preview_width),
    previewHeight: Number(row.preview_height),
    fileSize: Number(row.file_size),
    createdAt: String(row.created_at),
  };
}

/** Lista categorias temáticas da Biblioteca de Artes. */
export async function listArtCategories(
  includeInactive = true,
  client: Client = getDbClient(),
): Promise<ArtCategory[]> {
  await initDatabase(client);
  const where = includeInactive ? '' : 'WHERE is_active = 1';
  const result = await client.execute(
    `SELECT * FROM arte_categorias ${where} ORDER BY display_order ASC, name ASC`,
  );
  return result.rows.map(mapCategory);
}

/** Cria uma nova categoria temática com slug único. */
export async function createArtCategory(
  input: { name: string; slug?: string; displayOrder?: number },
  client: Client = getDbClient(),
): Promise<ArtCategory> {
  await initDatabase(client);
  const name = input.name.trim();
  if (!name || name.length > 80) {
    throw new ArtRepositoryError('Informe um nome válido para a categoria (até 80 caracteres).', 400);
  }
  const slug = slugifyArtCategory(input.slug?.trim() || name);
  if (!slug) throw new ArtRepositoryError('Slug da categoria inválido.', 400);

  const existing = await client.execute({ sql: 'SELECT id FROM arte_categorias WHERE slug = ?', args: [slug] });
  if (existing.rows.length) throw new ArtRepositoryError('Já existe uma categoria com este nome ou slug.', 409);

  const now = new Date().toISOString();
  const id = randomUUID();
  const displayOrder = Number.isFinite(input.displayOrder) ? Number(input.displayOrder) : 0;

  await client.execute({
    sql: `INSERT INTO arte_categorias (id, slug, name, display_order, is_active, created_at, updated_at)
          VALUES (?, ?, ?, ?, 1, ?, ?)`,
    args: [id, slug, name, displayOrder, now, now],
  });

  return { id, slug, name, displayOrder, isActive: true, createdAt: now, updatedAt: now };
}

/** Atualiza nome, slug, ordem ou ativação de uma categoria existente. */
export async function updateArtCategory(
  id: string,
  input: { name?: string; slug?: string; displayOrder?: number; isActive?: boolean },
  client: Client = getDbClient(),
): Promise<ArtCategory> {
  await initDatabase(client);
  const found = await client.execute({ sql: 'SELECT * FROM arte_categorias WHERE id = ?', args: [id] });
  const current = found.rows[0];
  if (!current) throw new ArtRepositoryError('Categoria não encontrada.', 404);

  const name = input.name !== undefined ? input.name.trim() : String(current.name);
  if (!name || name.length > 80) {
    throw new ArtRepositoryError('Informe um nome válido para a categoria (até 80 caracteres).', 400);
  }
  const slug = input.slug !== undefined ? slugifyArtCategory(input.slug) : String(current.slug);
  if (!slug) throw new ArtRepositoryError('Slug da categoria inválido.', 400);

  const conflict = await client.execute({
    sql: 'SELECT id FROM arte_categorias WHERE slug = ? AND id != ?',
    args: [slug, id],
  });
  if (conflict.rows.length) throw new ArtRepositoryError('Já existe outra categoria com este slug.', 409);

  const displayOrder = input.displayOrder !== undefined ? Number(input.displayOrder) : Number(current.display_order);
  const isActive = input.isActive !== undefined ? input.isActive : Boolean(current.is_active);
  const now = new Date().toISOString();

  await client.execute({
    sql: `UPDATE arte_categorias SET slug = ?, name = ?, display_order = ?, is_active = ?, updated_at = ? WHERE id = ?`,
    args: [slug, name, displayOrder, Number(isActive), now, id],
  });

  return {
    id,
    slug,
    name,
    displayOrder,
    isActive,
    createdAt: String(current.created_at),
    updatedAt: now,
  };
}

/** Remove categoria apenas se não houver artes vinculadas; caso contrário orienta desativar. */
export async function deleteArtCategory(id: string, client: Client = getDbClient()): Promise<void> {
  await initDatabase(client);
  const used = await client.execute({
    sql: 'SELECT COUNT(*) AS total FROM arte_categoria_rel WHERE categoria_id = ?',
    args: [id],
  });
  if (Number(used.rows[0]?.total ?? 0) > 0) {
    throw new ArtRepositoryError('Esta categoria possui artes vinculadas. Desative-a em vez de excluir.', 409);
  }
  const res = await client.execute({ sql: 'DELETE FROM arte_categorias WHERE id = ?', args: [id] });
  if (!res.rowsAffected) throw new ArtRepositoryError('Categoria não encontrada.', 404);
}

/** Gera código único sequencial no formato ART-0001. */
export async function generateNextArtCode(client: Client = getDbClient()): Promise<string> {
  await initDatabase(client);
  const countRes = await client.execute('SELECT COUNT(*) AS total FROM artes');
  let seq = Number(countRes.rows[0]?.total ?? 0) + 1;

  for (let attempt = 0; attempt < 50; attempt++) {
    const candidate = `ART-${String(seq + attempt).padStart(4, '0')}`;
    const exists = await client.execute({ sql: 'SELECT 1 FROM artes WHERE code = ?', args: [candidate] });
    if (!exists.rows.length) return candidate;
  }
  return `ART-${randomUUID().slice(0, 8).toUpperCase()}`;
}

async function loadRelationsForArtes(
  arteIds: string[],
  client: Client,
): Promise<{
  categoriesByArte: Map<string, Array<{ id: string; slug: string; name: string }>>;
  productsByArte: Map<string, string[]>;
}> {
  const categoriesByArte = new Map<string, Array<{ id: string; slug: string; name: string }>>();
  const productsByArte = new Map<string, string[]>();
  if (!arteIds.length) return { categoriesByArte, productsByArte };

  const placeholders = arteIds.map(() => '?').join(',');
  const [catRows, prodRows] = await Promise.all([
    client.execute({
      sql: `SELECT r.arte_id, c.id, c.slug, c.name
            FROM arte_categoria_rel r
            JOIN arte_categorias c ON c.id = r.categoria_id
            WHERE r.arte_id IN (${placeholders})
            ORDER BY c.display_order ASC, c.name ASC`,
      args: arteIds,
    }),
    client.execute({
      sql: `SELECT arte_id, product_type FROM arte_produtos WHERE arte_id IN (${placeholders}) ORDER BY product_type ASC`,
      args: arteIds,
    }),
  ]);

  for (const row of catRows.rows) {
    const id = String(row.arte_id);
    const list = categoriesByArte.get(id) ?? [];
    list.push({ id: String(row.id), slug: String(row.slug), name: String(row.name) });
    categoriesByArte.set(id, list);
  }
  for (const row of prodRows.rows) {
    const id = String(row.arte_id);
    const list = productsByArte.get(id) ?? [];
    list.push(String(row.product_type));
    productsByArte.set(id, list);
  }

  return { categoriesByArte, productsByArte };
}

/** Lista artes para o painel administrativo com filtros por busca, categoria, produto e situação. */
export async function listAdminArtes(
  filters: AdminArteFilters = {},
  client: Client = getDbClient(),
): Promise<ArtItem[]> {
  await initDatabase(client);
  const clauses: string[] = [];
  const args: Array<string | number> = [];

  const status = filters.status ?? 'active';
  if (status === 'active') clauses.push('a.is_active = 1');
  else if (status === 'published') clauses.push('a.is_active = 1 AND a.is_published = 1');
  else if (status === 'draft') clauses.push('a.is_active = 1 AND a.is_published = 0');
  else if (status === 'inactive') clauses.push('a.is_active = 0');

  if (filters.q?.trim()) {
    const pattern = `%${filters.q.trim()}%`;
    clauses.push('(a.code LIKE ? OR a.title LIKE ? OR a.description LIKE ? OR a.group_description LIKE ?)');
    args.push(pattern, pattern, pattern, pattern);
  }
  if (filters.categoryId?.trim()) {
    clauses.push('EXISTS (SELECT 1 FROM arte_categoria_rel r WHERE r.arte_id = a.id AND r.categoria_id = ?)');
    args.push(filters.categoryId.trim());
  }
  if (filters.productType?.trim()) {
    clauses.push('EXISTS (SELECT 1 FROM arte_produtos p WHERE p.arte_id = a.id AND p.product_type = ?)');
    args.push(filters.productType.trim());
  }

  const where = clauses.length ? `WHERE ${clauses.join(' AND ')}` : '';
  const result = await client.execute({
    sql: `SELECT a.*, v.arte_id, v.version, v.original_filename, v.original_mime, v.original_ext,
                 v.width, v.height, v.thumb_width, v.thumb_height, v.preview_width, v.preview_height,
                 v.file_size, v.created_at AS version_created_at
          FROM artes a
          LEFT JOIN arte_versoes v ON v.arte_id = a.id AND v.version = a.current_version
          ${where}
          ORDER BY a.updated_at DESC, a.code ASC`,
    args,
  });

  const ids = result.rows.map(row => String(row.id));
  const { categoriesByArte, productsByArte } = await loadRelationsForArtes(ids, client);

  return result.rows.map(row => {
    const id = String(row.id);
    return {
      id,
      code: String(row.code),
      title: String(row.title),
      description: String(row.description),
      groupDescription: String(row.group_description ?? ''),
      currentVersion: Number(row.current_version),
      isPublished: Boolean(row.is_published),
      isActive: Boolean(row.is_active),
      createdAt: String(row.created_at),
      updatedAt: String(row.updated_at),
      categories: categoriesByArte.get(id) ?? [],
      products: productsByArte.get(id) ?? [],
      versionInfo: row.version ? mapVersion({ ...row, created_at: row.version_created_at }) : null,
    };
  });
}

/** Busca os detalhes completos de uma arte, incluindo todo o histórico de versões. */
export async function getAdminArte(id: string, client: Client = getDbClient()): Promise<ArtDetail | null> {
  await initDatabase(client);
  const found = await client.execute({ sql: 'SELECT * FROM artes WHERE id = ?', args: [id] });
  const row = found.rows[0];
  if (!row) return null;

  const [versionsRes, rels] = await Promise.all([
    client.execute({
      sql: 'SELECT * FROM arte_versoes WHERE arte_id = ? ORDER BY version DESC',
      args: [id],
    }),
    loadRelationsForArtes([id], client),
  ]);

  const versions = versionsRes.rows.map(mapVersion);
  const currentVersion = Number(row.current_version);
  return {
    id,
    code: String(row.code),
    title: String(row.title),
    description: String(row.description),
    groupDescription: String(row.group_description ?? ''),
    currentVersion,
    isPublished: Boolean(row.is_published),
    isActive: Boolean(row.is_active),
    createdAt: String(row.created_at),
    updatedAt: String(row.updated_at),
    categories: rels.categoriesByArte.get(id) ?? [],
    products: rels.productsByArte.get(id) ?? [],
    versionInfo: versions.find(v => v.version === currentVersion) ?? versions[0] ?? null,
    versions,
  };
}

/** Recupera metadados de uma versão específica (ou da versão atual) para entrega de imagem. */
export async function getArteVersionRecord(
  id: string,
  version?: number,
  client: Client = getDbClient(),
): Promise<(ArtVersionRecord & { code: string }) | null> {
  await initDatabase(client);
  const sql = version !== undefined
    ? `SELECT a.code, v.* FROM artes a JOIN arte_versoes v ON v.arte_id = a.id WHERE a.id = ? AND v.version = ?`
    : `SELECT a.code, v.* FROM artes a JOIN arte_versoes v ON v.arte_id = a.id AND v.version = a.current_version WHERE a.id = ?`;
  const args = version !== undefined ? [id, version] : [id];
  const result = await client.execute({ sql, args });
  const row = result.rows[0];
  if (!row) return null;
  return { ...mapVersion(row), code: String(row.code) };
}

/** Cria uma nova arte com sua versão inicial (v1), categorias e produtos em transação. */
export async function createArteWithVersion(
  input: {
    id: string;
    code?: string;
    title: string;
    description?: string;
    groupDescription?: string;
    categoryIds: string[];
    productTypes: string[];
    isPublished: boolean;
    version: NewArtVersionInput;
  },
  client: Client = getDbClient(),
): Promise<ArtDetail> {
  await initDatabase(client);
  const title = input.title.trim();
  if (!title || title.length > 120) {
    throw new ArtRepositoryError('Informe um título válido para a arte (até 120 caracteres).', 400);
  }
  const groupDescription = (input.groupDescription ?? '').trim();
  if (groupDescription.length > 500) {
    throw new ArtRepositoryError('A descrição do grupo deve ter no máximo 500 caracteres.', 400);
  }
  const code = input.code?.trim() ? normalizeArtCode(input.code) : await generateNextArtCode(client);
  if (!ART_CODE_PATTERN.test(code)) {
    throw new ArtRepositoryError('Código inválido. Use 2 a 32 caracteres (letras, números, hífen ou _).', 400);
  }
  if (!input.productTypes.length) {
    throw new ArtRepositoryError('Selecione ao menos um produto compatível (Caneca ou Quadro).', 400);
  }

  const now = new Date().toISOString();
  const tx = await client.transaction('write');
  try {
    const dup = await tx.execute({ sql: 'SELECT 1 FROM artes WHERE code = ?', args: [code] });
    if (dup.rows.length) throw new ArtRepositoryError(`Já existe uma arte com o código ${code}.`, 409);

    await tx.execute({
      sql: `INSERT INTO artes (id, code, title, description, group_description, current_version, is_published, is_active, created_at, updated_at)
            VALUES (?, ?, ?, ?, ?, 1, ?, 1, ?, ?)`,
      args: [input.id, code, title, (input.description ?? '').trim(), groupDescription, Number(input.isPublished), now, now],
    });
    await tx.execute({
      sql: `INSERT INTO arte_versoes (
              arte_id, version, original_filename, original_mime, original_ext,
              width, height, thumb_width, thumb_height, preview_width, preview_height, file_size, created_at
            ) VALUES (?, 1, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      args: [
        input.id,
        input.version.originalFilename,
        input.version.originalMime,
        input.version.originalExt,
        input.version.width,
        input.version.height,
        input.version.thumbWidth,
        input.version.thumbHeight,
        input.version.previewWidth,
        input.version.previewHeight,
        input.version.fileSize,
        now,
      ],
    });
    for (const categoryId of Array.from(new Set(input.categoryIds))) {
      await tx.execute({
        sql: 'INSERT OR IGNORE INTO arte_categoria_rel (arte_id, categoria_id) VALUES (?, ?)',
        args: [input.id, categoryId],
      });
    }
    for (const productType of Array.from(new Set(input.productTypes))) {
      await tx.execute({
        sql: 'INSERT OR IGNORE INTO arte_produtos (arte_id, product_type) VALUES (?, ?)',
        args: [input.id, productType],
      });
    }
    await tx.commit();
  } catch (error) {
    await tx.rollback();
    throw error;
  } finally {
    tx.close();
  }

  return (await getAdminArte(input.id, client))!;
}

/** Obtém o próximo número de versão para gerar novos arquivos antes de confirmar no SQLite. */
export async function getNextArteVersionNumber(id: string, client: Client = getDbClient()): Promise<number> {
  await initDatabase(client);
  const res = await client.execute({ sql: 'SELECT current_version FROM artes WHERE id = ?', args: [id] });
  if (!res.rows.length) throw new ArtRepositoryError('Arte não encontrada.', 404);
  return Number(res.rows[0].current_version) + 1;
}

/** Registra uma nova versão de imagem mantendo todas as versões anteriores intactas. */
export async function addArteVersion(
  id: string,
  versionNumber: number,
  version: NewArtVersionInput,
  client: Client = getDbClient(),
): Promise<ArtDetail> {
  await initDatabase(client);
  const now = new Date().toISOString();
  const tx = await client.transaction('write');
  try {
    const found = await tx.execute({ sql: 'SELECT current_version FROM artes WHERE id = ?', args: [id] });
    if (!found.rows.length) throw new ArtRepositoryError('Arte não encontrada.', 404);
    const expectedNext = Number(found.rows[0].current_version) + 1;
    if (versionNumber !== expectedNext) {
      throw new ArtRepositoryError('Conflito de versão detectado. Atualize a página e tente novamente.', 409);
    }

    await tx.execute({
      sql: `INSERT INTO arte_versoes (
              arte_id, version, original_filename, original_mime, original_ext,
              width, height, thumb_width, thumb_height, preview_width, preview_height, file_size, created_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      args: [
        id,
        versionNumber,
        version.originalFilename,
        version.originalMime,
        version.originalExt,
        version.width,
        version.height,
        version.thumbWidth,
        version.thumbHeight,
        version.previewWidth,
        version.previewHeight,
        version.fileSize,
        now,
      ],
    });
    await tx.execute({
      sql: 'UPDATE artes SET current_version = ?, updated_at = ? WHERE id = ?',
      args: [versionNumber, now, id],
    });
    await tx.commit();
  } catch (error) {
    await tx.rollback();
    throw error;
  } finally {
    tx.close();
  }

  return (await getAdminArte(id, client))!;
}

/** Atualiza metadados, categorias, produtos compatíveis e status de publicação/ativação. */
export async function updateArteMetadata(
  id: string,
  input: {
    code?: string;
    title?: string;
    description?: string;
    groupDescription?: string;
    categoryIds?: string[];
    productTypes?: string[];
    isPublished?: boolean;
    isActive?: boolean;
  },
  client: Client = getDbClient(),
): Promise<ArtDetail> {
  await initDatabase(client);
  const current = await getAdminArte(id, client);
  if (!current) throw new ArtRepositoryError('Arte não encontrada.', 404);

  const code = input.code !== undefined ? normalizeArtCode(input.code) : current.code;
  if (!ART_CODE_PATTERN.test(code)) {
    throw new ArtRepositoryError('Código inválido. Use 2 a 32 caracteres (letras, números, hífen ou _).', 400);
  }
  const title = input.title !== undefined ? input.title.trim() : current.title;
  if (!title || title.length > 120) {
    throw new ArtRepositoryError('Informe um título válido (até 120 caracteres).', 400);
  }
  const description = input.description !== undefined ? input.description.trim() : current.description;
  const groupDescription = input.groupDescription !== undefined ? input.groupDescription.trim() : current.groupDescription;
  if (groupDescription.length > 500) {
    throw new ArtRepositoryError('A descrição do grupo deve ter no máximo 500 caracteres.', 400);
  }
  const isActive = input.isActive !== undefined ? input.isActive : current.isActive;
  const isPublished = isActive
    ? (input.isPublished !== undefined ? input.isPublished : current.isPublished)
    : false;
  const productTypes = input.productTypes ?? current.products;
  if (!productTypes.length) {
    throw new ArtRepositoryError('Selecione ao menos um produto compatível.', 400);
  }

  const now = new Date().toISOString();
  const tx = await client.transaction('write');
  try {
    const dup = await tx.execute({ sql: 'SELECT 1 FROM artes WHERE code = ? AND id != ?', args: [code, id] });
    if (dup.rows.length) throw new ArtRepositoryError(`Já existe outra arte com o código ${code}.`, 409);

    await tx.execute({
      sql: `UPDATE artes SET code = ?, title = ?, description = ?, group_description = ?, is_published = ?, is_active = ?, updated_at = ? WHERE id = ?`,
      args: [code, title, description, groupDescription, Number(isPublished), Number(isActive), now, id],
    });
    if (input.categoryIds !== undefined) {
      await tx.execute({ sql: 'DELETE FROM arte_categoria_rel WHERE arte_id = ?', args: [id] });
      for (const categoryId of Array.from(new Set(input.categoryIds))) {
        await tx.execute({
          sql: 'INSERT OR IGNORE INTO arte_categoria_rel (arte_id, categoria_id) VALUES (?, ?)',
          args: [id, categoryId],
        });
      }
    }
    if (input.productTypes !== undefined) {
      await tx.execute({ sql: 'DELETE FROM arte_produtos WHERE arte_id = ?', args: [id] });
      for (const productType of Array.from(new Set(productTypes))) {
        await tx.execute({
          sql: 'INSERT OR IGNORE INTO arte_produtos (arte_id, product_type) VALUES (?, ?)',
          args: [id, productType],
        });
      }
    }
    await tx.commit();
  } catch (error) {
    await tx.rollback();
    throw error;
  } finally {
    tx.close();
  }

  return (await getAdminArte(id, client))!;
}

/** Desativa logicamente uma arte (operação padrão de remoção, preservando arquivos e histórico). */
export async function deactivateArte(id: string, client: Client = getDbClient()): Promise<ArtDetail> {
  return updateArteMetadata(id, { isActive: false, isPublished: false }, client);
}

export interface PublicArtItem {
  id: string;
  code: string;
  title: string;
  description: string;
  groupDescription: string;
  version: number;
  width: number;
  height: number;
  categories: Array<{ id: string; slug: string; name: string }>;
  thumbUrl: string;
  previewUrl: string;
}

export interface PublicArtListResult {
  items: PublicArtItem[];
  categories: Array<{ id: string; slug: string; name: string }>;
  page: number;
  limit: number;
  hasMore: boolean;
}

/** Lista artes públicas (ativas, publicadas e compatíveis com o produto) com filtro e paginação. */
export async function listPublicArtes(
  filters: { productType: string; category?: string; q?: string; page?: number; limit?: number },
  client: Client = getDbClient(),
): Promise<PublicArtListResult> {
  await initDatabase(client);
  const page = Math.max(1, Math.floor(filters.page ?? 1));
  const limit = Math.min(48, Math.max(1, Math.floor(filters.limit ?? 12)));
  const offset = (page - 1) * limit;

  const clauses = [
    'a.is_active = 1',
    'a.is_published = 1',
    'EXISTS (SELECT 1 FROM arte_produtos p WHERE p.arte_id = a.id AND p.product_type = ?)',
  ];
  const args: Array<string | number> = [filters.productType];

  if (filters.category?.trim()) {
    const cat = filters.category.trim();
    clauses.push(
      `EXISTS (
        SELECT 1 FROM arte_categoria_rel r
        JOIN arte_categorias c ON c.id = r.categoria_id
        WHERE r.arte_id = a.id AND c.is_active = 1 AND (c.id = ? OR c.slug = ?)
      )`,
    );
    args.push(cat, cat);
  }
  if (filters.q?.trim()) {
    const pattern = `%${filters.q.trim()}%`;
    clauses.push('(a.code LIKE ? OR a.title LIKE ? OR a.description LIKE ? OR a.group_description LIKE ?)');
    args.push(pattern, pattern, pattern, pattern);
  }

  const [rowsRes, catsRes] = await Promise.all([
    client.execute({
      sql: `SELECT a.id, a.code, a.title, a.description, a.group_description, a.current_version, v.width, v.height
            FROM artes a
            JOIN arte_versoes v ON v.arte_id = a.id AND v.version = a.current_version
            WHERE ${clauses.join(' AND ')}
            ORDER BY a.updated_at DESC, a.code ASC
            LIMIT ? OFFSET ?`,
      args: [...args, limit + 1, offset],
    }),
    client.execute({
      sql: `SELECT DISTINCT c.id, c.slug, c.name, c.display_order
            FROM arte_categorias c
            JOIN arte_categoria_rel r ON r.categoria_id = c.id
            JOIN artes a ON a.id = r.arte_id
            JOIN arte_produtos p ON p.arte_id = a.id
            WHERE c.is_active = 1 AND a.is_active = 1 AND a.is_published = 1 AND p.product_type = ?
            ORDER BY c.display_order ASC, c.name ASC`,
      args: [filters.productType],
    }),
  ]);

  const hasMore = rowsRes.rows.length > limit;
  const pageRows = rowsRes.rows.slice(0, limit);
  const { categoriesByArte } = await loadRelationsForArtes(pageRows.map(r => String(r.id)), client);

  const items: PublicArtItem[] = pageRows.map(row => {
    const id = String(row.id);
    const version = Number(row.current_version);
    return {
      id,
      code: String(row.code),
      title: String(row.title),
      description: String(row.description),
      groupDescription: String(row.group_description ?? ''),
      version,
      width: Number(row.width),
      height: Number(row.height),
      categories: (categoriesByArte.get(id) ?? []),
      thumbUrl: `/api/artes/${id}/imagem?variante=thumb&versao=${version}`,
      previewUrl: `/api/artes/${id}/imagem?variante=preview&versao=${version}`,
    };
  });

  const categories = catsRes.rows.map(row => ({
    id: String(row.id),
    slug: String(row.slug),
    name: String(row.name),
  }));

  return { items, categories, page, limit, hasMore };
}

/** Valida no servidor se arte e versão estão ativas, publicadas e compatíveis com o produto. */
export async function getPublicArteVersion(
  id: string,
  productType?: string,
  version?: number,
  client: Client = getDbClient(),
): Promise<{ arteId: string; code: string; title: string; version: number; width: number; height: number } | null> {
  await initDatabase(client);
  const clauses = ['a.id = ?', 'a.is_active = 1', 'a.is_published = 1'];
  const args: Array<string | number> = [id];

  if (version !== undefined) {
    clauses.push('v.version = ?');
    args.push(version);
  } else {
    clauses.push('v.version = a.current_version');
  }
  if (productType) {
    clauses.push('EXISTS (SELECT 1 FROM arte_produtos p WHERE p.arte_id = a.id AND p.product_type = ?)');
    args.push(productType);
  }

  const res = await client.execute({
    sql: `SELECT a.id, a.code, a.title, v.version, v.width, v.height
          FROM artes a
          JOIN arte_versoes v ON v.arte_id = a.id
          WHERE ${clauses.join(' AND ')}`,
    args,
  });
  const row = res.rows[0];
  if (!row) return null;
  return {
    arteId: String(row.id),
    code: String(row.code),
    title: String(row.title),
    version: Number(row.version),
    width: Number(row.width),
    height: Number(row.height),
  };
}

