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
});
