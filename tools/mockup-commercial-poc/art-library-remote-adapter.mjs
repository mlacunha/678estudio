const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function httpError(message, statusCode) {
  const err = new Error(message);
  err.statusCode = statusCode;
  return err;
}

/** Valida explicitamente a URL remota permitida (HTTPS ou localhost/127.0.0.1 para testes). */
export function normalizeRemoteBaseUrl(rawUrl) {
  let parsed;
  try {
    parsed = new URL(String(rawUrl || '').trim());
  } catch {
    throw httpError('URL remota inválida.', 400);
  }
  const isLocalHost = parsed.hostname === '127.0.0.1' || parsed.hostname === 'localhost';
  if (parsed.protocol !== 'https:' && !(parsed.protocol === 'http:' && isLocalHost)) {
    throw httpError('A URL remota deve usar HTTPS (ou localhost/127.0.0.1 em ambiente de teste).', 400);
  }
  return parsed.origin;
}

/** Adaptador somente-leitura para consumir a Biblioteca de Artes hospedada via APIs administrativas. */
export function createRemoteArtLibraryAdapter(options = {}) {
  const configuredDefaultUrl = options.defaultUrl || process.env.MOCKUP_REMOTE_URL || '';
  let session = null; // { baseUrl, authHeader } mantido apenas em memória durante a sessão

  async function remoteFetch(pathAndQuery) {
    if (!session) throw httpError('Sessão remota não conectada. Informe as credenciais administrativas.', 401);
    const response = await fetch(`${session.baseUrl}${pathAndQuery}`, {
      method: 'GET',
      headers: {
        Authorization: session.authHeader,
        Accept: 'application/json, image/*',
      },
    });
    if (response.status === 401) {
      session = null;
      throw httpError('Credenciais inválidas ou sessão expirada (401).', 401);
    }
    if (!response.ok) {
      throw httpError(`Falha na API remota (HTTP ${response.status}).`, response.status >= 500 ? 502 : response.status);
    }
    return response;
  }

  async function connect({ baseUrl, username, password }) {
    const normalizedUrl = normalizeRemoteBaseUrl(baseUrl || configuredDefaultUrl);
    if (!username || !password) throw httpError('Informe usuário e senha administrativos.', 400);
    const authHeader = `Basic ${Buffer.from(`${username}:${password}`, 'utf8').toString('base64')}`;

    const probe = await fetch(`${normalizedUrl}/api/admin/artes/categorias?all=false`, {
      method: 'GET',
      headers: { Authorization: authHeader, Accept: 'application/json' },
    });
    if (probe.status === 401) throw httpError('Credenciais administrativas incorretas (401).', 401);
    if (probe.status === 503) throw httpError('Administração indisponível no servidor remoto (503).', 503);
    if (!probe.ok) throw httpError(`Não foi possível autenticar no servidor remoto (HTTP ${probe.status}).`, 502);

    session = { baseUrl: normalizedUrl, authHeader };
    return getStatus();
  }

  function disconnect() {
    session = null;
    return getStatus();
  }

  function getStatus() {
    return {
      connected: Boolean(session),
      baseUrl: session?.baseUrl ?? null,
      defaultUrl: configuredDefaultUrl || null,
    };
  }

  async function listArtes(filters = {}) {
    const params = new URLSearchParams({ situacao: 'active' });
    if (filters.q?.trim()) params.set('q', filters.q.trim());
    if (filters.categoryId?.trim()) params.set('categoria', filters.categoryId.trim());
    if (filters.product?.trim()) params.set('produto', filters.product.trim());

    const [artesRes, catsRes] = await Promise.all([
      remoteFetch(`/api/admin/artes?${params.toString()}`),
      remoteFetch('/api/admin/artes/categorias?all=false'),
    ]);

    const artesJson = await artesRes.json();
    const catsJson = await catsRes.json();
    const allItems = Array.isArray(artesJson?.data) ? artesJson.data : [];
    const categories = Array.isArray(catsJson?.data)
      ? catsJson.data.map(c => ({ id: String(c.id), slug: String(c.slug), name: String(c.name) }))
      : [];

    const page = Math.max(1, Math.floor(Number(filters.page ?? 1)));
    const limit = Math.min(48, Math.max(1, Math.floor(Number(filters.limit ?? 12))));
    const offset = (page - 1) * limit;
    const pageItems = allItems.slice(offset, offset + limit).map(item => ({
      id: String(item.id),
      code: String(item.code),
      title: String(item.title),
      description: String(item.description ?? ''),
      groupDescription: String(item.groupDescription ?? ''),
      version: Number(item.currentVersion),
      isPublished: Boolean(item.isPublished),
      width: Number(item.versionInfo?.width ?? 0),
      height: Number(item.versionInfo?.height ?? 0),
      originalExt: String(item.versionInfo?.originalExt ?? 'png'),
      fileSize: Number(item.versionInfo?.fileSize ?? 0),
      categories: Array.isArray(item.categories) ? item.categories : [],
      products: Array.isArray(item.products) ? item.products : [],
    }));

    return {
      items: pageItems,
      categories,
      page,
      hasMore: offset + limit < allItems.length,
    };
  }

  async function readArtVariant(id, version, variant) {
    if (!UUID_RE.test(String(id || ''))) throw new Error('Identificador de arte inválido.');
    const safeVariant = variant === 'orig' || variant === 'preview' ? variant : 'thumb';
    const qs = new URLSearchParams({ variante: safeVariant });
    if (version) qs.set('versao', String(Number(version)));

    const res = await remoteFetch(`/api/admin/artes/${id}/imagem?${qs.toString()}`);
    const buffer = Buffer.from(await res.arrayBuffer());
    const mime = res.headers.get('content-type') || (safeVariant === 'orig' ? 'application/octet-stream' : 'image/webp');
    return { buffer, mime, variant: safeVariant, version: Number(version || 1) };
  }

  return { connect, disconnect, getStatus, listArtes, readArtVariant };
}
