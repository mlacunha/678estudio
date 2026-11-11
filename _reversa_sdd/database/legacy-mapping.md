# Mapeamento do Legado — Módulo Database

Arquivos e linhas-chave correspondentes ao módulo `database`:

- [`src/db/database.ts`](file:///d:/Projetos/site678Estudio/src/db/database.ts#L9-L38): Funções `getDatabasePath`, `getDbClient`, `initDatabase`.
- [`src/db/database.ts`](file:///d:/Projetos/site678Estudio/src/db/database.ts#L40-L109): Função `createSchemaAndSeed` (criação de tabelas e índices).
- [`src/db/database.ts`](file:///d:/Projetos/site678Estudio/src/db/database.ts#L111-L137): Função `seedInitialDataIfEmpty`.
- [`src/db/database.ts`](file:///d:/Projetos/site678Estudio/src/db/database.ts#L140-L172): Função `migrateStationery` (migração transacional de papelaria e assets v2).
- `data/studio678.db`: Arquivo de banco de dados SQLite local.

