import { createClient, type Client } from '@libsql/client';
import { randomUUID } from 'node:crypto';
import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';
import { initDatabase, migrateArtLibrary } from './database';
import {
  addArteVersion,
  ArtRepositoryError,
  createArtCategory,
  createArteWithVersion,
  deactivateArte,
  deleteArtCategory,
  getAdminArte,
  getPublicArteVersion,
  listAdminArtes,
  listArtCategories,
  listPublicArtes,
  updateArtCategory,
  updateArteMetadata,
} from './artLibraryRepository';

const cleanups: Array<() => Promise<void>> = [];

async function createTempDb(): Promise<Client> {
  const dir = await mkdtemp(join(tmpdir(), 'art-lib-db-'));
  const client = createClient({ url: `file:${join(dir, 'test.db').replace(/\\/g, '/')}` });
  cleanups.push(async () => {
    client.close();
    await rm(dir, { recursive: true, force: true, maxRetries: 5, retryDelay: 50 }).catch(() => undefined);
  });
  await initDatabase(client);
  return client;
}

afterEach(async () => {
  while (cleanups.length) {
    await cleanups.pop()!();
  }
});

describe('artLibraryRepository', () => {
  it('should run art library migration idempotently', async () => {
    const client = await createTempDb();
    await expect(migrateArtLibrary(client)).resolves.toBeUndefined();
    await expect(migrateArtLibrary(client)).resolves.toBeUndefined();
  });

  it('should manage categories and prevent deleting categories in use', async () => {
    const client = await createTempDb();
    const cat = await createArtCategory({ name: 'Florais Delicados' }, client);
    expect(cat.slug).toBe('florais-delicados');

    const updated = await updateArtCategory(cat.id, { name: 'Florais & Botânica', displayOrder: 2 }, client);
    expect(updated.name).toBe('Florais & Botânica');

    const arteId = randomUUID();
    await createArteWithVersion({
      id: arteId,
      title: 'Rosa Aquarela',
      categoryIds: [cat.id],
      productTypes: ['caneca', 'quadro'],
      isPublished: true,
      version: {
        originalFilename: 'rosa.png',
        originalMime: 'image/png',
        originalExt: 'png',
        width: 1200,
        height: 1200,
        thumbWidth: 400,
        thumbHeight: 400,
        previewWidth: 1200,
        previewHeight: 1200,
        fileSize: 50000,
      },
    }, client);

    await expect(deleteArtCategory(cat.id, client)).rejects.toThrow(ArtRepositoryError);
    const list = await listArtCategories(true, client);
    expect(list).toHaveLength(1);
  });

  it('should support product filtering, versioning without overwriting, publish toggle and soft delete', async () => {
    const client = await createTempDb();
    const cat = await createArtCategory({ name: 'Minimalista' }, client);
    const id = randomUUID();

    const created = await createArteWithVersion({
      id,
      code: 'MIN-01',
      title: 'Linha Contínua',
      categoryIds: [cat.id],
      productTypes: ['caneca'],
      isPublished: false,
      version: {
        originalFilename: 'linha-v1.png',
        originalMime: 'image/png',
        originalExt: 'png',
        width: 1000,
        height: 800,
        thumbWidth: 400,
        thumbHeight: 320,
        previewWidth: 1000,
        previewHeight: 800,
        fileSize: 40000,
      },
    }, client);

    expect(created.code).toBe('MIN-01');
    expect(created.currentVersion).toBe(1);
    expect(created.isPublished).toBe(false);

    const v2 = await addArteVersion(id, 2, {
      originalFilename: 'linha-v2.jpg',
      originalMime: 'image/jpeg',
      originalExt: 'jpg',
      width: 2000,
      height: 1600,
      thumbWidth: 400,
      thumbHeight: 320,
      previewWidth: 1600,
      previewHeight: 1280,
      fileSize: 90000,
    }, client);

    expect(v2.currentVersion).toBe(2);
    expect(v2.versions).toHaveLength(2);
    expect(v2.versions.map(v => v.version)).toEqual([2, 1]);

    await updateArteMetadata(id, { isPublished: true, productTypes: ['caneca', 'quadro'] }, client);
    const forQuadro = await listAdminArtes({ productType: 'quadro', status: 'published' }, client);
    expect(forQuadro).toHaveLength(1);

    await deactivateArte(id, client);
    const activeOnly = await listAdminArtes({ status: 'active' }, client);
    expect(activeOnly).toHaveLength(0);
    const preserved = await getAdminArte(id, client);
    expect(preserved?.isActive).toBe(false);
    expect(preserved?.versions).toHaveLength(2);
  });

  it('should list only published active mug arts with pagination and validate exact versions', async () => {
    const client = await createTempDb();
    const cat = await createArtCategory({ name: 'Canecas' }, client);
    const baseVer = {
      originalFilename: 'a.png',
      originalMime: 'image/png',
      originalExt: 'png',
      width: 1000,
      height: 1000,
      thumbWidth: 400,
      thumbHeight: 400,
      previewWidth: 1000,
      previewHeight: 1000,
      fileSize: 10000,
    };

    const mugId1 = randomUUID();
    const mugId2 = randomUUID();
    const frameOnlyId = randomUUID();
    const draftMugId = randomUUID();

    await createArteWithVersion({ id: mugId1, code: 'MUG-01', title: 'Café 1', categoryIds: [cat.id], productTypes: ['caneca'], isPublished: true, version: baseVer }, client);
    await createArteWithVersion({ id: mugId2, code: 'MUG-02', title: 'Café 2', categoryIds: [cat.id], productTypes: ['caneca', 'quadro'], isPublished: true, version: baseVer }, client);
    await createArteWithVersion({ id: frameOnlyId, code: 'FRM-01', title: 'Só Quadro', categoryIds: [cat.id], productTypes: ['quadro'], isPublished: true, version: baseVer }, client);
    await createArteWithVersion({ id: draftMugId, code: 'DRF-01', title: 'Rascunho', categoryIds: [cat.id], productTypes: ['caneca'], isPublished: false, version: baseVer }, client);

    const page1 = await listPublicArtes({ productType: 'caneca', page: 1, limit: 1 }, client);
    expect(page1.items).toHaveLength(1);
    expect(page1.hasMore).toBe(true);

    const page2 = await listPublicArtes({ productType: 'caneca', page: 2, limit: 1 }, client);
    expect(page2.items).toHaveLength(1);
    expect(page2.hasMore).toBe(false);

    const search = await listPublicArtes({ productType: 'caneca', q: 'MUG-02' }, client);
    expect(search.items.map(i => i.code)).toEqual(['MUG-02']);

    // Versão v1 preservada mesmo após v2
    await addArteVersion(mugId1, 2, baseVer, client);
    const v1 = await getPublicArteVersion(mugId1, 'caneca', 1, client);
    const v2 = await getPublicArteVersion(mugId1, 'caneca', 2, client);
    const v99 = await getPublicArteVersion(mugId1, 'caneca', 99, client);
    expect(v1?.version).toBe(1);
    expect(v2?.version).toBe(2);
    expect(v99).toBeNull();
    expect(await getPublicArteVersion(frameOnlyId, 'caneca', 1, client)).toBeNull();
    expect(await getPublicArteVersion(draftMugId, 'caneca', 1, client)).toBeNull();
  });

  it('should search by code, title, individual description, and groupDescription in admin and public queries', async () => {
    const client = await createTempDb();
    const cat = await createArtCategory({ name: 'Motivacional' }, client);
    const groupDescription = 'Artes com frases motivacionais, mensagens positivas e temas de superação.';
    const baseVer = {
      originalFilename: 'frase.png',
      originalMime: 'image/png',
      originalExt: 'png',
      width: 1000,
      height: 1000,
      thumbWidth: 400,
      thumbHeight: 400,
      previewWidth: 1000,
      previewHeight: 1000,
      fileSize: 12000,
    };

    const id1 = randomUUID();
    const id2 = randomUUID();
    const id3 = randomUUID();
    await createArteWithVersion({ id: id1, code: 'MOT-01', title: 'Frase Coragem', description: 'Detalhe dourado', groupDescription, categoryIds: [cat.id], productTypes: ['caneca', 'quadro'], isPublished: true, version: baseVer }, client);
    await createArteWithVersion({ id: id2, code: 'MOT-02', title: 'Frase Paz', description: 'Fundo aquarela', groupDescription, categoryIds: [cat.id], productTypes: ['caneca'], isPublished: true, version: baseVer }, client);
    await createArteWithVersion({ id: id3, code: 'MOT-03', title: 'Frase Foco', description: 'Tipografia minimalista', groupDescription, categoryIds: [cat.id], productTypes: ['quadro'], isPublished: true, version: baseVer }, client);

    for (const term of ['motivacionais', 'positivas', 'superação', groupDescription]) {
      const adminFound = await listAdminArtes({ q: term }, client);
      expect(adminFound).toHaveLength(3);
      expect(adminFound.map(a => a.title).sort()).toEqual(['Frase Coragem', 'Frase Foco', 'Frase Paz']);

      expect((await listPublicArtes({ productType: 'caneca', q: term }, client)).items).toHaveLength(2);
      expect((await listPublicArtes({ productType: 'quadro', q: term }, client)).items).toHaveLength(2);
    }

    expect((await listPublicArtes({ productType: 'caneca', q: 'MOT-02' }, client)).items.map(i => i.id)).toEqual([id2]);
    expect((await listPublicArtes({ productType: 'quadro', q: 'minimalista' }, client)).items.map(i => i.id)).toEqual([id3]);

    const updated = await updateArteMetadata(id1, { groupDescription: 'Coleção Gratidão Diária' }, client);
    expect(updated.groupDescription).toBe('Coleção Gratidão Diária');
    expect(updated.description).toBe('Detalhe dourado');
    expect((await getAdminArte(id2, client))?.groupDescription).toBe(groupDescription);
    expect((await getAdminArte(id3, client))?.groupDescription).toBe(groupDescription);
    expect((await listPublicArtes({ productType: 'caneca', q: 'Gratidão' }, client)).items.map(i => i.id)).toEqual([id1]);
  });

  it('should migrate existing DB with art-library-batch-title-v1 and run idempotently on fresh DB', async () => {
    const dir = await mkdtemp(join(tmpdir(), 'art-lib-mig-'));
    const client = createClient({ url: `file:${join(dir, 'legacy.db').replace(/\\/g, '/')}` });
    cleanups.push(async () => {
      client.close();
      await rm(dir, { recursive: true, force: true, maxRetries: 5, retryDelay: 50 }).catch(() => undefined);
    });

    await client.batch([
      'CREATE TABLE schema_migrations (id TEXT PRIMARY KEY)',
      `CREATE TABLE arte_categorias (id TEXT PRIMARY KEY, slug TEXT NOT NULL UNIQUE, name TEXT NOT NULL, display_order INTEGER NOT NULL DEFAULT 0, is_active INTEGER NOT NULL DEFAULT 1, created_at TEXT NOT NULL, updated_at TEXT NOT NULL)`,
      `CREATE TABLE artes (id TEXT PRIMARY KEY, code TEXT NOT NULL UNIQUE, title TEXT NOT NULL, description TEXT NOT NULL DEFAULT '', current_version INTEGER NOT NULL DEFAULT 1, is_published INTEGER NOT NULL DEFAULT 0, is_active INTEGER NOT NULL DEFAULT 1, created_at TEXT NOT NULL, updated_at TEXT NOT NULL, batch_title TEXT NOT NULL DEFAULT '')`,
      `CREATE TABLE arte_versoes (arte_id TEXT NOT NULL, version INTEGER NOT NULL, original_filename TEXT NOT NULL, original_mime TEXT NOT NULL, original_ext TEXT NOT NULL, width INTEGER NOT NULL, height INTEGER NOT NULL, thumb_width INTEGER NOT NULL, thumb_height INTEGER NOT NULL, preview_width INTEGER NOT NULL, preview_height INTEGER NOT NULL, file_size INTEGER NOT NULL, created_at TEXT NOT NULL, PRIMARY KEY (arte_id, version))`,
      `CREATE TABLE arte_categoria_rel (arte_id TEXT NOT NULL, categoria_id TEXT NOT NULL, PRIMARY KEY (arte_id, categoria_id))`,
      `CREATE TABLE arte_produtos (arte_id TEXT NOT NULL, product_type TEXT NOT NULL, PRIMARY KEY (arte_id, product_type))`,
      "INSERT INTO schema_migrations VALUES ('art-library-v1')",
      "INSERT INTO schema_migrations VALUES ('art-library-batch-title-v1')",
      `INSERT INTO artes (id, code, title, description, batch_title, current_version, is_published, is_active, created_at, updated_at)
       VALUES ('legacy-1', 'ART-0001', 'Arte Legada', 'Desc antiga', 'Lote Antigo', 1, 1, 1, '2026-11-13T00:00:00Z', '2026-11-13T00:00:00Z')`,
    ], 'write');

    await migrateArtLibrary(client);
    await migrateArtLibrary(client);

    const arte = await getAdminArte('legacy-1', client);
    expect(arte?.title).toBe('Arte Legada');
    expect(arte?.groupDescription).toBe('');

    const migs = await client.execute('SELECT id FROM schema_migrations ORDER BY id');
    expect(migs.rows.map(r => String(r.id))).toContain('art-library-batch-title-v1');
    expect(migs.rows.map(r => String(r.id))).toContain('art-library-group-description-v1');
  });
});
