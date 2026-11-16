import { existsSync, readFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { createRequire } from 'node:module';

const require = createRequire('D:/Projetos/site678Estudio/package.json');
const { createClient } = require('@libsql/client');

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/** Adaptador somente-leitura usando @libsql/client para consultar a Biblioteca de Artes (SQLite + data/artes). */
export function createArtLibraryAdapter(options = {}) {
  const rootDir = options.rootDir ?? 'D:/Projetos/site678Estudio';
  const dbPath = resolve(rootDir, options.dbPath ?? process.env.STUDIO678_DB_PATH ?? 'data/studio678.db');
  const artesDir = resolve(rootDir, options.artesDir ?? process.env.STUDIO678_ARTES_DIR ?? join(dirname(dbPath), 'artes'));

  async function openDb() {
    if (!existsSync(dbPath)) return null;
    const client = createClient({ url: `file:${dbPath.replace(/\\/g, '/')}` });
    const hasTable = await client.execute("SELECT 1 FROM sqlite_master WHERE type='table' AND name='artes'");
    if (!hasTable.rows.length) {
      client.close();
      return null;
    }
    return client;
  }

  async function listArtes(filters = {}) {
    const client = await openDb();
    if (!client) return { items: [], categories: [], page: 1, hasMore: false };
    try {
      const page = Math.max(1, Math.floor(Number(filters.page ?? 1)));
      const limit = Math.min(48, Math.max(1, Math.floor(Number(filters.limit ?? 12))));
      const offset = (page - 1) * limit;

      const clauses = ['a.is_active = 1'];
      const args = [];

      if (filters.product?.trim()) {
        clauses.push('EXISTS (SELECT 1 FROM arte_produtos p WHERE p.arte_id = a.id AND p.product_type = ?)');
        args.push(filters.product.trim());
      }
      if (filters.categoryId?.trim()) {
        const cat = filters.categoryId.trim();
        clauses.push('EXISTS (SELECT 1 FROM arte_categoria_rel r JOIN arte_categorias c ON c.id = r.categoria_id WHERE r.arte_id = a.id AND c.is_active = 1 AND (c.id = ? OR c.slug = ?))');
        args.push(cat, cat);
      }
      if (filters.q?.trim()) {
        const pattern = `%${filters.q.trim()}%`;
        clauses.push('(a.code LIKE ? OR a.title LIKE ? OR a.description LIKE ? OR a.group_description LIKE ?)');
        args.push(pattern, pattern, pattern, pattern);
      }

      const [rowsRes, catsRes] = await Promise.all([
        client.execute({
          sql: `SELECT a.id, a.code, a.title, a.description, a.group_description, a.current_version, a.is_published,
                       v.width, v.height, v.original_ext, v.file_size
                FROM artes a
                JOIN arte_versoes v ON v.arte_id = a.id AND v.version = a.current_version
                WHERE ${clauses.join(' AND ')}
                ORDER BY a.updated_at DESC, a.code ASC
                LIMIT ? OFFSET ?`,
          args: [...args, limit + 1, offset],
        }),
        client.execute('SELECT id, slug, name FROM arte_categorias WHERE is_active = 1 ORDER BY display_order ASC, name ASC'),
      ]);

      const hasMore = rowsRes.rows.length > limit;
      const pageRows = rowsRes.rows.slice(0, limit);
      const categories = catsRes.rows.map(r => ({ id: String(r.id), slug: String(r.slug), name: String(r.name) }));

      const items = [];
      for (const row of pageRows) {
        const id = String(row.id);
        const [artCats, artProds] = await Promise.all([
          client.execute({
            sql: `SELECT c.id, c.slug, c.name FROM arte_categorias c
                  JOIN arte_categoria_rel r ON r.categoria_id = c.id
                  WHERE r.arte_id = ? AND c.is_active = 1
                  ORDER BY c.display_order ASC, c.name ASC`,
            args: [id],
          }),
          client.execute({ sql: 'SELECT product_type FROM arte_produtos WHERE arte_id = ? ORDER BY product_type ASC', args: [id] }),
        ]);
        items.push({
          id,
          code: String(row.code),
          title: String(row.title),
          description: String(row.description ?? ''),
          groupDescription: String(row.group_description ?? ''),
          version: Number(row.current_version),
          isPublished: Boolean(row.is_published),
          width: Number(row.width),
          height: Number(row.height),
          originalExt: String(row.original_ext),
          fileSize: Number(row.file_size),
          categories: artCats.rows.map(c => ({ id: String(c.id), slug: String(c.slug), name: String(c.name) })),
          products: artProds.rows.map(p => String(p.product_type)),
        });
      }

      return { items, categories, page, hasMore };
    } finally {
      client.close();
    }
  }

  async function readArtVariant(id, version, variant) {
    if (!UUID_RE.test(String(id || ''))) throw new Error('Identificador de arte inválido.');
    const client = await openDb();
    if (!client) throw new Error('Banco de dados da Biblioteca de Artes indisponível.');
    try {
      const verNum = version ? Number(version) : null;
      const res = verNum
        ? await client.execute({
            sql: `SELECT a.id, v.version, v.original_ext, v.original_mime
                  FROM artes a JOIN arte_versoes v ON v.arte_id = a.id
                  WHERE a.id = ? AND a.is_active = 1 AND v.version = ?`,
            args: [id, verNum],
          })
        : await client.execute({
            sql: `SELECT a.id, v.version, v.original_ext, v.original_mime
                  FROM artes a JOIN arte_versoes v ON v.arte_id = a.id AND v.version = a.current_version
                  WHERE a.id = ? AND a.is_active = 1`,
            args: [id],
          });

      const row = res.rows[0];
      if (!row) throw new Error('Arte ou versão não encontrada na Biblioteca.');
      const v = Number(row.version);
      if (variant === 'orig') {
        const origPath = join(artesDir, `${id}-v${v}-orig.${row.original_ext}`);
        if (existsSync(origPath)) {
          return { buffer: readFileSync(origPath), mime: String(row.original_mime), variant: 'orig', version: v };
        }
      }
      const fallbackVariant = variant === 'thumb' ? 'thumb' : 'preview';
      const webpPath = join(artesDir, `${id}-v${v}-${fallbackVariant}.webp`);
      if (!existsSync(webpPath)) throw new Error(`Arquivo da arte não encontrado: ${webpPath}`);
      return { buffer: readFileSync(webpPath), mime: 'image/webp', variant: fallbackVariant, version: v };
    } finally {
      client.close();
    }
  }

  return { listArtes, readArtVariant, dbPath, artesDir };
}
