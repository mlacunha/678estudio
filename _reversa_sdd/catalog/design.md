# Catálogo de Produtos e Categorias — Design Técnico

> Especificação técnica da unit `catalog`. Foca no COMO a unit é construída.

## Interface

### Endpoints HTTP (`src/pages/api/`)

| Método | Caminho | Parâmetros / Body | Resposta Sucesso | Status Codes |
|---|---|---|---|---|
| GET | `/api/categories` | `?all=true` (opcional) | `{ success: true, data: ProductCategory[] }` | 200, 500 |
| GET | `/api/products` | `?category=slug&all=true` | `{ success: true, data: Product[] }` | 200, 500 |
| POST | `/api/products` | JSON body com dados do `Product` | `{ success: true, data: Product }` | 201, 400, 500 |
| GET | `/api/products/[id]` | `id` na URL | `{ success: true, data: Product }` | 200, 400, 404 |
| PUT | `/api/products/[id]` | JSON body parcial ou `{ toggleActive: boolean }` | `{ success: true, data?: Product }` | 200, 400, 404, 500 |
| DELETE | `/api/products/[id]` | `id` na URL | `{ success: true, message: string }` | 200, 400, 404, 500 |

### Funções do Repositório (`src/db/catalogRepository.ts`)

| Símbolo | Assinatura | Retorno | Observação |
|---|---|---|---|
| `getActiveCategories` | `(client?: Client)` | `Promise<ProductCategory[]>` | Filtra `is_active = 1` ordenado por `display_order ASC` |
| `getAllCategories` | `(client?: Client)` | `Promise<ProductCategory[]>` | Retorna todas as categorias cadastradas |
| `getActiveProductsByCategory` | `(categorySlug: string, client?: Client)` | `Promise<Product[]>` | Produtos ativos ordenados por categoria |
| `getAllProducts` | `(client?: Client)` | `Promise<Product[]>` | Todos os produtos ordenados por categoria e ordem |
| `getProductById` | `(id: string, client?: Client)` | `Promise<Product \| null>` | Busca unívoca por ID |
| `createProduct` | `(product: Product, client?: Client)` | `Promise<void>` | INSERT parametrizado |
| `updateProduct` | `(product: Product, client?: Client)` | `Promise<void>` | UPDATE nos dados cadastrais |
| `toggleProductActive` | `(id: string, isActive: boolean, client?: Client)` | `Promise<void>` | UPDATE atômico em `is_active` |
| `replaceProductImage` | `(product: Product, imageUrl: string, client?: Client)` | `Promise<boolean>` | UPDATE condicional em `image_url` |
| `deleteProduct` | `(id: string, client?: Client)` | `Promise<void>` | DELETE físico do registro |

## Fluxo Principal (Criação de Produto)
1. Requisição POST chega em `src/pages/api/products/index.ts`.
2. O corpo JSON é extraído com `request.json()`.
3. Validação de campos obrigatórios (`name`, `categorySlug`, `imageUrl`).
4. Atribuição de ID (`prod-${Date.now()}` se não fornecido) e saneamento de strings (`trim()`).
5. Invocação de `createProduct(product)` em `catalogRepository.ts`.
6. Garantia de inicialização do banco via `await initDatabase(client)`.
7. Execução do `INSERT INTO products (...) VALUES (?, ?, ...)`.
8. Retorno HTTP 201 com o payload criado.

## Dependências
- `src/db/database.ts`: Conexão libSQL (`getDbClient`) e bootstrap (`initDatabase`).
- `src/types/catalog.ts`: Tipos `Product`, `ProductCategory`, `CategorySlug`.

## Estado Interno
- Tabela `products` e `categories` no SQLite `data/studio678.db`.

## Riscos e Lacunas
- 🟡 Ausência de paginação em `getAllProducts` (aceitável para catálogo pequeno, mas pode impactar com > 500 itens).
- 🔴 Falta de autenticação e proteção CSRF nas rotas de mutação (`POST`, `PUT`, `DELETE`).

