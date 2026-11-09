import { createClient, type Client } from '@libsql/client';
import { randomUUID } from 'node:crypto';
import { afterEach, beforeEach, expect, it } from 'vitest';
import { GALLERY_PAGE_SIZE, instagramPostUrl, readWorkFields, type WorkFields } from '../utils/gallery';
import { getAllProducts } from './catalogRepository';
import { deleteGalleryWork, GalleryConflict, getGalleryWork, isGalleryPhotoVisible, listHomeWorks, listPublishedWorks, saveGalleryWork } from './galleryRepository';

let client: Client;
const fields: WorkFields = {
  title: 'Peça artesanal', description: '', category: 'quadros', date: '2026-10-01',
  instagram: '', published: true, featured: false, order: 0,
};
const photo = () => ({ id: randomUUID(), width: 1200, height: 800, thumbWidth: 480, thumbHeight: 320 });

beforeEach(() => { client = createClient({ url: ':memory:' }); });
afterEach(() => client.close());

async function create(overrides: Partial<WorkFields> = {}) {
  const id = randomUUID();
  const cover = photo();
  await saveGalleryWork(id, 0, { ...fields, ...overrides }, [], [cover], cover.id, false, client);
  return id;
}

it('creates a draft with several photographs and updates its cover and visibility without modifying the catalog', async () => {
  const products = await getAllProducts(client);
  const id = randomUUID();
  const first = photo();
  const cover = photo();
  await saveGalleryWork(id, 0, { ...fields, published: false }, [], [first, cover], cover.id, false, client);
  expect(await getGalleryWork(id, false, client)).toBeUndefined();
  expect(await isGalleryPhotoVisible(cover.id, false, client)).toBe(false);
  expect(await isGalleryPhotoVisible(cover.id, true, client)).toBe(true);
  expect((await getGalleryWork(id, true, client))?.photos).toEqual([cover, first]);
  await saveGalleryWork(id, 1, { ...fields, title: 'Trabalho revisado' }, [cover.id, first.id], [], first.id, false, client);
  expect(await getGalleryWork(id, false, client)).toMatchObject({ title: 'Trabalho revisado', photos: [first, cover], version: 2 });
  expect(await getAllProducts(client)).toEqual(products);
});

it('keeps drafts out of listings, falls back to recent works and orders the selected highlights', async () => {
  const old = await create({ date: '2025-01-01', order: 1 });
  const recent = await create({ order: 4 });
  await create({ published: false, featured: true });
  expect((await listHomeWorks(client)).map(work => work.id)).toEqual([recent, old]);
  const featured = await create({ featured: true, order: 5 });
  const first = await create({ featured: true, order: 2 });
  expect((await listHomeWorks(client)).map(work => work.id)).toEqual([first, featured]);
  expect((await listPublishedWorks('quadros', 1, true, client)).works.map(work => work.id)).toEqual([old, first, recent, featured]);
});

it('paginates filtered published works without repeating entries', async () => {
  for (let i = 0; i <= GALLERY_PAGE_SIZE; i++) await create({ category: 'canecas' });
  const other = await create();
  const first = await listPublishedWorks('canecas', 1, false, client);
  const second = await listPublishedWorks('canecas', 2, false, client);
  expect(first.works).toHaveLength(GALLERY_PAGE_SIZE);
  expect(first.hasNext).toBe(true);
  expect(second.works).toHaveLength(1);
  expect(second.hasNext).toBe(false);
  expect(first.works.map(work => work.id)).not.toContain(second.works[0].id);
  expect((await listPublishedWorks('quadros', 1, false, client)).works.map(work => work.id)).toEqual([other]);
});

it('rejects stale saves, unconfirmed removal and cross-work photo associations', async () => {
  const id = await create();
  const other = await create();
  const first = (await getGalleryWork(id, true, client))!.photos[0];
  const second = (await getGalleryWork(other, true, client))!.photos[0];
  await expect(saveGalleryWork(id, 2, fields, [], [], '', true, client)).rejects.toBeInstanceOf(GalleryConflict);
  await expect(saveGalleryWork(id, 1, fields, [second.id], [], second.id, true, client)).rejects.toThrow('inválida');
  await expect(saveGalleryWork(id, 1, fields, [], [], '', false, client)).rejects.toThrow('Confirme');
  await expect(saveGalleryWork(id, 1, fields, [], [], '', true, client)).rejects.toThrow('pelo menos uma foto');
  expect(await isGalleryPhotoVisible(first.id, false, client)).toBe(true);
  expect(await deleteGalleryWork(id, 1, client)).toEqual([first.id]);
  expect(await isGalleryPhotoVisible(first.id, true, client)).toBe(false);
  expect(await isGalleryPhotoVisible(second.id, false, client)).toBe(true);
});

it('validates calendar dates and accepts only HTTPS Instagram post links', () => {
  expect(instagramPostUrl('https://instagram.com/reel/Ab_12/?igsh=example')).toBe('https://www.instagram.com/reel/Ab_12/');
  for (const url of ['http://instagram.com/p/A', 'https://instagram.com.example.test/p/A', 'https://instagram.com/profile/', 'https://user@instagram.com/p/A']) {
    expect(instagramPostUrl(url)).toBeUndefined();
  }
  const form = new FormData();
  form.set('title', 'Teste');
  form.set('category', 'quadros');
  form.set('date', '2026-02-30');
  expect(() => readWorkFields(form)).toThrow('data válida');
});
