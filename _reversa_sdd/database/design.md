# Banco de Dados e Migrações — Design Técnico

> Especificação técnica da unit `database`. Foca no COMO a unit é construída.

## Interface

### Funções Principais (`src/db/database.ts`)

| Símbolo | Assinatura | Retorno | Observação |
|---|---|---|---|
| `getDatabasePath` | `()` | `string` | Garante que a pasta `./data` exista e retorna o caminho absoluto |
| `getDbClient` | `()` | `Client` | Inicializa ou reutiliza a instância do libSQL client |
| `initDatabase` | `(client?: Client)` | `Promise<void>` | Orquestra a criação do schema, seed e migrações |
| `migrateStationery` | `(client: Client)` | `Promise<void>` | Executa migração transacional com commit ou rollback |

## Estrutura do Schema SQLite

### Tabelas Principais:
1. `categories` (PK `id`, UK `slug`)
2. `products` (PK `id`, FK `category_slug`)
3. `site_settings` (PK `id` com `CHECK (id = 1)`)
4. `gallery_works` (PK `id`, FK `category_slug`)
5. `gallery_photos` (PK `id`, FK `work_id`, UK `work_id, position`)
6. `agenda_quotes` (PK `id`, UK `draft_token`)
7. `agenda_quote_assets` (PK `quote_id, name`)
8. `schema_migrations` (PK `id`)

## Fluxo Principal de Inicialização
1. Qualquer serviço importa `getDbClient` e invoca `initDatabase()`.
2. `initDatabase()` verifica se já existe uma promise ativa associada ao client no `WeakMap`.
3. Se existir, reutiliza a promise; se não, cria e executa `createSchemaAndSeed`.
4. Executa comandos DDL com `CREATE TABLE IF NOT EXISTS`.
5. Consulta contagem de categorias; se 0, insere registros do `mockCatalog` via `client.batch()`.
6. Invoca `migrateStationery()`, iniciando transação de escrita (`client.transaction('write')`).
7. Confere `schema_migrations`; se `'stationery-families-v2'` não existir, aplica as migrações, insere na tabela e confirma com `tx.commit()`.

## Riscos e Lacunas
- 🟡 Ausência de pool distribuído (opera em arquivo local único).
- 🟡 Em ambientes de múltiplos nós em nuvem, requer troca da URL local para conexão remota Turso (`libsql://...`).

