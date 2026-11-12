# Data Delta: Cadernos Personalizados (Receitas, Diário Pessoal e Livro de Memórias)

> Identificador: `004-cadernos-personalizados`
> Data: `2026-11-12`

## 1. Novas Tabelas SQLite (`src/db/database.ts`)

Adição idempotente no batch de inicialização de `createSchemaAndSeed` em `src/db/database.ts`:

```sql
CREATE TABLE IF NOT EXISTS notebook_quotes (
  id TEXT PRIMARY KEY,
  draft_token TEXT NOT NULL UNIQUE,
  product TEXT NOT NULL,
  created_at TEXT NOT NULL,
  status TEXT NOT NULL,
  config_version INTEGER NOT NULL,
  config_json TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS notebook_quote_assets (
  quote_id TEXT NOT NULL REFERENCES notebook_quotes(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  mime TEXT NOT NULL,
  content BLOB NOT NULL,
  PRIMARY KEY (quote_id, name)
);

CREATE INDEX IF NOT EXISTS notebook_quotes_created
  ON notebook_quotes (created_at DESC, id DESC);
```

## 2. Migração de Catálogo (`migrateStationery` em `src/db/database.ts`)

Nova migração transacional versionada `'stationery-notebooks-v1'` na tabela `schema_migrations`:

```sql
UPDATE products
SET description = 'Caderno de Receitas, Diário Pessoal e Livro de Memórias em formato A5. Estilos Clássico, Comercial e Feminino.',
    tagline = 'Caderno de Receitas, Diário Pessoal e Livro de Memórias'
WHERE id = 'family-cadernos';

INSERT INTO schema_migrations VALUES ('stationery-notebooks-v1');
```

## 3. Contrato JSON de Configuração (`NotebookQuoteConfig` em `src/server/caderno/quoteConfig.ts`)

```ts
export type NotebookModelId = 'caderno-receitas' | 'diario-pessoal' | 'livro-memorias';

export type NotebookQuoteConfig = {
  template: 'caderno-personalizado-v1';
  model: NotebookModelId;
  format: 'a5';
  style: 'classic' | 'commercial' | 'feminine';
  typography: 'modern' | 'geometric' | 'editorial';
  colors: { primary: string; secondary: string; accent: string };
  customColors: boolean;
  watermark: boolean;
  title?: string;
  personalizationName?: string;
  dedication?: string;
  logo: null | { originalName: string; original: 'original'; normalized: 'logo' };
  sections: string[];
};
```

