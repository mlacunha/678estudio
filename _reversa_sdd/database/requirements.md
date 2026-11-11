# Banco de Dados e Migrações — Requisitos

> Especificação de requisitos da unit `database`. Foca no QUE a unit faz.

## Visão Geral
Camada de persistência local baseada em SQLite operada pelo driver `@libsql/client`. Garante conexão singleton, inicialização segura e concorrente do schema relacional, povoamento com catálogo base e aplicação transacional de migrações estruturais.

## Responsabilidades
- Criar e resolver o diretório local de dados `./data/studio678.db`.
- Inicializar o cliente libSQL em modo singleton.
- Criar tabelas com restrições relacionais e integridade referencial.
- Inserir dados padrão (seed) na primeira execução se a base estiver vazia.
- Executar migrações incrementais rastreadas em `schema_migrations`.

## Regras de Negócio
- **RN-DB-01**: O banco opera exclusivamente em modo transacional para migrações com rollback imediato em caso de erro. 🟢
- **RN-DB-02**: A inicialização do banco deve ser idempotente e thread-safe / async-safe, aguardando promises pendentes sem duplicar execução de DDL. 🟢
- **RN-DB-03**: A tabela de configurações (`site_settings`) deve possuir restrição `CHECK (id = 1)` impedindo múltiplas linhas. 🟢

## Requisitos Funcionais

| ID | Requisito | Prioridade | Critério de Aceite |
|---|---|---|---|
| RF-01 | Prover cliente singleton | Must | `getDbClient()` retorna a mesma instância para chamadas consecutivas |
| RF-02 | Criar schema completo | Must | `initDatabase()` cria categorias, produtos, site_settings, galeria e cotações |
| RF-03 | Seed automático | Should | Popula produtos padrão caso a contagem de categorias seja zero |
| RF-04 | Aplicar migrações versionadas | Must | `migrateStationery()` aplica migração `stationery-families-v2` se pendente |

## Requisitos Não Funcionais

| Tipo | Requisito inferido | Evidência no código | Confiança |
|---|---|---|---|
| Portabilidade | Ausência de compilação nativa C++ em runtime | Dependência `@libsql/client` em `package.json` | 🟢 |
| Concorrência | Controle de concorrência com `WeakMap<Client, Promise<void>>` | `src/db/database.ts:7` | 🟢 |
| Integridade | Chaves estrangeiras e índices em buscas de galeria e orçamentos | `src/db/database.ts:89, 94, 105` | 🟢 |

