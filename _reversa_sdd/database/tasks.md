# Banco de Dados e Migrações — Tarefas de Implementação

> Tarefas executáveis para reproduzir a unit `database` a partir do legado.

## Pré-requisitos
- [x] Dependência `@libsql/client` instalada no `package.json`

## Tarefas
- [x] **T-01**: Configurar cliente libSQL e resolução de diretório local de dados.
  - Origem no legado: [`src/db/database.ts:9-26`](file:///d:/Projetos/site678Estudio/src/db/database.ts#L9-L26)
  - Critério de pronto: Instância única retornada com suporte a transações. 🟢
- [x] **T-02**: Implementar bootstrapping do schema relacional com controle por WeakMap.
  - Origem no legado: [`src/db/database.ts:28-109`](file:///d:/Projetos/site678Estudio/src/db/database.ts#L28-L109)
  - Critério de pronto: Criação idempotente de todas as tabelas do ecossistema. 🟢
- [x] **T-03**: Implementar povoamento automático de dados semente na primeira execução.
  - Origem no legado: [`src/db/database.ts:111-136`](file:///d:/Projetos/site678Estudio/src/db/database.ts#L111-L136)
  - Critério de pronto: Categorias e produtos base inseridos em batch quando o banco estiver vazio. 🟢
- [x] **T-04**: Implementar migrador transacional com rollback e registro em `schema_migrations`.
  - Origem no legado: [`src/db/database.ts:140-172`](file:///d:/Projetos/site678Estudio/src/db/database.ts#L140-L172)
  - Critério de pronto: Migração `stationery-families-v2` executada de forma atômica. 🟢

## Tarefas de Teste
- [x] **TT-01**: Teste de concorrência com 10 invocações paralelas de `initDatabase()`.
- [x] **TT-02**: Teste de rollback simulando erro forçado em migração.

