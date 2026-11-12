# Interfaces: Endpoints Públicos e Administrativos de Cadernos Personalizados

> Identificador: `004-cadernos-personalizados`
> Data: `2026-11-12`

## 1. `POST /api/caderno/preview`

- **Autenticação:** Pública (protegida por verificação de `Origin` e `Sec-Fetch-Site !== 'cross-site'`).
- **Content-Type:** `multipart/form-data` (limite de `2 MB + 16 KB`).
- **Campos do formulário:**
  - `model`: `'caderno-receitas' | 'diario-pessoal' | 'livro-memorias'`
  - `format`: `'a5'`
  - `style`: `'classic' | 'commercial' | 'feminine'`
  - `typography`: `'modern' | 'geometric' | 'editorial'`
  - `title` (opcional, máx. 60 caracteres)
  - `personalizationName` (opcional, máx. 60 caracteres)
  - `dedication` (opcional, máx. 240 caracteres)
  - `primary`, `secondary` (opcionais, cores hexadecimais `#RRGGBB` com contraste $\ge 3:1$ no branco)
  - `logo` (opcional, arquivo `image/png` ou `image/jpeg` até 2 MB / 4 MP)
  - `watermark` (`'true'` opcional quando `logo` presente)
- **Resposta `200 OK`:**
  ```json
  {
    "draft": "<uuid-v4>",
    "previews": [
      { "id": "abertura", "label": "...", "detail": "...", "src": "data:image/png;base64,..." }
    ]
  }
  ```
- **Erros:** `400` (validação), `403` (origem inválida), `408` (timeout 15s), `413` (payload > 2 MB), `415` (content-type inválido), `503` (outra prévia em compilação).

## 2. `POST /api/caderno/quote`

- **Autenticação:** Pública (mesma verificação de origem).
- **Content-Type:** `multipart/form-data` com campo `draft` (`UUID v4`).
- **Comportamento:** Persiste de forma idempotente em `notebook_quotes` e `notebook_quote_assets` (status `'requested'`) e retorna o caminho de referência e o link de WhatsApp.
- **Resposta `200 OK`:**
  ```json
  {
    "referencePath": "/caderno/orcamento/<id>",
    "whatsappUrl": "https://wa.me/..."
  }
  ```
- **Erros:** `400` (token inválido), `403` (origem), `410` (rascunho expirado).

## 3. `GET /caderno/orcamento/[id]` e `GET /caderno/orcamento/[id]/previa/[section].png`

- **Autenticação:** Pública (referência compartilhada no orçamento de WhatsApp).
- **Comportamento:** Exibe o resumo da configuração solicitada e serve as 6 imagens PNG salvas em `notebook_quote_assets`.

## 4. `GET /admin/cadernos`, `GET /admin/cadernos/[id]`, `GET /admin/cadernos/[id]/arquivo/[asset]` e `GET /admin/cadernos/[id]/pdf`

- **Autenticação:** HTTP Basic Auth administrativo (`src/middleware.ts`).
- **Parâmetros de query em `/admin/cadernos/[id]/pdf`:**
  - `modo`: `'a5' | 'a4-frentes' | 'a4-versos'` (default `'a5'`)
  - `empilhamento`: `'cut-stack' | 'sequential'` (default `'cut-stack'`)
  - `virada`: `'short-edge' | 'long-edge'` (default `'short-edge'`)
  - `ordem`: `'normal' | 'reverse'` (default `'normal'`)
  - `escala`: `'safe' | 'full'` (default `'safe'`)
- **Resposta `200 OK`:** `application/pdf` (`140`, `160` ou `120` páginas em `modo=a5`; `35`, `40` ou `30` folhas A4 paisagem em `modo=a4-frentes` e `modo=a4-versos`).

