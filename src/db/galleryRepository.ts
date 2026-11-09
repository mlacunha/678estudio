import type { Client } from '@libsql/client';
import { getDbClient, initDatabase } from './database';
import { GALLERY_PAGE_SIZE, MAX_GALLERY_PHOTOS, type WorkFields } from '../utils/gallery';

export interface GalleryPhoto {
  id: string;
  width: number;
  height: number;
  thumbWidth: number;
  thumbHeight: number;
}

function mapPhoto(row: Record<string, unknown>): GalleryPhoto {
  return {
    id: String(row.photo_id), width: Number(row.width), height: Number(row.height),
    thumbWidth: Number(row.thumb_width), thumbHeight: Number(row.thumb_height),
  };
}

function mapWork(row: Record<string, unknown>) {
  return {
    id: String(row.id), title: String(row.title), description: String(row.description),
    category: String(row.category_slug), categoryTitle: String(row.category_title),
    date: String(row.work_date ?? ''), instagram: String(row.instagram), published: Boolean(row.published),
    featured: Boolean(row.featured), order: Number(row.display_order), version: Number(row.version),
    createdAt: String(row.created_at), updatedAt: String(row.updated_at),
  };
}

export type GalleryWork = ReturnType<typeof mapWork>;
export type GalleryCard = GalleryWork & { cover: GalleryPhoto };

const categoryJoin = 'JOIN categories c ON c.slug = w.category_slug';
const cards = `SELECT w.*, c.title AS category_title, p.id AS photo_id, p.width, p.height, p.thumb_width, p.thumb_height
  FROM gallery_works w ${categoryJoin} JOIN gallery_photos p ON p.work_id = w.id AND p.position = 0`;
const recent = `COALESCE(w.work_date, SUBSTR(COALESCE(w.published_at, w.created_at), 1, 10)) DESC,
  COALESCE(w.published_at, w.created_at) DESC, w.id`;

export async function listPublishedWorks(category: string, page: number, curated = false, client: Client = getDbClient()) {
  await initDatabase(client);
  const result = await client.execute({
    sql: `${cards} WHERE w.published = 1 AND (? = '' OR w.category_slug = ?)
      ORDER BY ${curated ? 'w.display_order, ' : ''}${recent} LIMIT ? OFFSET ?`,
    args: [category, category, GALLERY_PAGE_SIZE + 1, (page - 1) * GALLERY_PAGE_SIZE],
  });
  return {
    works: result.rows.slice(0, GALLERY_PAGE_SIZE).map(row => ({ ...mapWork(row), cover: mapPhoto(row) })),
    hasNext: result.rows.length > GALLERY_PAGE_SIZE,
  };
}

export async function listHomeWorks(client: Client = getDbClient()): Promise<GalleryCard[]> {
  await initDatabase(client);
  const result = await client.execute(`${cards} WHERE w.published = 1 AND
    (w.featured = 1 OR NOT EXISTS (SELECT 1 FROM gallery_works WHERE published = 1 AND featured = 1))
    ORDER BY CASE WHEN w.featured = 1 THEN w.display_order ELSE 0 END, ${recent} LIMIT 6`);
  return result.rows.map(row => ({ ...mapWork(row), cover: mapPhoto(row) }));
}

export async function listAdminWorks(client: Client = getDbClient()): Promise<GalleryWork[]> {
  await initDatabase(client);
  const result = await client.execute(`SELECT w.*, c.title AS category_title FROM gallery_works w
    ${categoryJoin} ORDER BY w.display_order, ${recent}`);
  return result.rows.map(mapWork);
}

export async function getGalleryWork(id: string, admin = false, client: Client = getDbClient()) {
  await initDatabase(client);
  const result = await client.execute({
    sql: `SELECT w.*, c.title AS category_title, p.id AS photo_id, p.width, p.height, p.thumb_width, p.thumb_height
      FROM gallery_works w ${categoryJoin} LEFT JOIN gallery_photos p ON p.work_id = w.id
      WHERE w.id = ? AND (w.published = 1 OR ?) ORDER BY p.position`,
    args: [id, Number(admin)],
  });
  const first = result.rows[0];
  if (!first) return;
  return { ...mapWork(first), photos: result.rows.filter(row => row.photo_id).map(mapPhoto) };
}

export async function isGalleryPhotoVisible(id: string, admin: boolean, client: Client = getDbClient()) {
  await initDatabase(client);
  const { rows } = await client.execute({
    sql: `SELECT 1 FROM gallery_photos p JOIN gallery_works w ON w.id = p.work_id
      WHERE p.id = ? AND (w.published = 1 OR ?)`,
    args: [id, Number(admin)],
  });
  return rows.length > 0;
}

export async function saveGalleryWork(
  id: string, version: number, fields: WorkFields, retained: string[], additions: GalleryPhoto[], cover: string,
  confirmedRemoval: boolean, client: Client = getDbClient(),
): Promise<string[]> {
  await initDatabase(client);
  const tx = await client.transaction('write');
  try {
    const current = (await tx.execute({ sql: 'SELECT version FROM gallery_works WHERE id = ?', args: [id] })).rows[0];
    if ((current ? Number(current.version) : 0) !== version) throw new GalleryConflict();
    const category = await tx.execute({ sql: 'SELECT 1 FROM categories WHERE slug = ?', args: [fields.category] });
    if (!category.rows.length) throw new GalleryInputError('Selecione uma categoria válida.');
    const existing = (await tx.execute({
      sql: 'SELECT id AS photo_id, width, height, thumb_width, thumb_height FROM gallery_photos WHERE work_id = ?',
      args: [id],
    })).rows.map(mapPhoto);
    const existingById = new Map(existing.map(photo => [photo.id, photo]));
    if (new Set(retained).size !== retained.length || retained.some(photo => !existingById.has(photo))) {
      throw new GalleryInputError('A seleção de fotografias é inválida.');
    }
    const removed = existing.filter(photo => !retained.includes(photo.id)).map(photo => photo.id);
    if (removed.length && !confirmedRemoval) throw new GalleryInputError('Confirme a exclusão das fotografias.');
    const photos = [...retained.map(photo => existingById.get(photo)!), ...additions];
    if (photos.length > MAX_GALLERY_PHOTOS || (!photos.length && fields.published) ||
        (photos.length && !photos.some(photo => photo.id === cover))) {
      throw new GalleryInputError('Escolha uma capa e respeite o limite de oito fotos. A publicação exige pelo menos uma foto.');
    }
    photos.sort((a, b) => Number(b.id === cover) - Number(a.id === cover));

    const now = new Date().toISOString();
    const values = [fields.title, fields.description, fields.category, fields.date || null,
      fields.instagram, Number(fields.published), Number(fields.featured), fields.order, now];
    await tx.execute(current ? {
      sql: `UPDATE gallery_works SET title=?, description=?, category_slug=?, work_date=?, instagram=?,
        published=?, featured=?, display_order=?, updated_at=?, published_at=COALESCE(published_at, ?),
        version=version+1 WHERE id=?`,
      args: [...values, fields.published ? now : null, id],
    } : {
      sql: `INSERT INTO gallery_works (title, description, category_slug, work_date, instagram, published, featured,
        display_order, updated_at, created_at, published_at, id) VALUES (?,?,?,?,?,?,?,?,?,?,?,?)`,
      args: [...values, now, fields.published ? now : null, id],
    });
    await tx.execute({ sql: 'DELETE FROM gallery_photos WHERE work_id = ?', args: [id] });
    for (const [position, photo] of photos.entries()) {
      await tx.execute({
        sql: 'INSERT INTO gallery_photos (id, work_id, position, width, height, thumb_width, thumb_height) VALUES (?,?,?,?,?,?,?)',
        args: [photo.id, id, position, photo.width, photo.height, photo.thumbWidth, photo.thumbHeight],
      });
    }
    await tx.commit();
    return removed;
  } finally {
    tx.close();
  }
}

export async function deleteGalleryWork(id: string, version: number, client: Client = getDbClient()): Promise<string[]> {
  await initDatabase(client);
  const tx = await client.transaction('write');
  try {
    const work = (await tx.execute({ sql: 'SELECT version FROM gallery_works WHERE id = ?', args: [id] })).rows[0];
    if (!work || Number(work.version) !== version) throw new GalleryConflict();
    const { rows } = await tx.execute({ sql: 'SELECT id FROM gallery_photos WHERE work_id = ?', args: [id] });
    await tx.execute({ sql: 'DELETE FROM gallery_photos WHERE work_id = ?', args: [id] });
    await tx.execute({ sql: 'DELETE FROM gallery_works WHERE id = ?', args: [id] });
    await tx.commit();
    return rows.map(row => String(row.id));
  } finally {
    tx.close();
  }
}

export class GalleryInputError extends Error {}
export class GalleryConflict extends Error {}
