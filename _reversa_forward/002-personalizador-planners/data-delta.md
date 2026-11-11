# Data Delta: Personalizador de Planners

> Identificador: `002-personalizador-planners`

## 1. Banco de Dados Relacional SQLite (`studio678.db`)

Para manter isolamento estrito de domínio em relação aos orçamentos de agendas, e ao mesmo tempo reutilizar o padrão arquitetural comprovado de persistência com JSON validado e armazenamento transacional de assets, criam-se as tabelas `planner_quotes` e `planner_quote_assets`:

```sql
CREATE TABLE IF NOT EXISTS planner_quotes (
  id TEXT PRIMARY KEY,
  draft_token TEXT NOT NULL UNIQUE,
  product TEXT NOT NULL,
  created_at TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('requested', 'in_production', 'completed', 'canceled')),
  config_version INTEGER NOT NULL,
  config_json TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS planner_quote_assets (
  quote_id TEXT NOT NULL REFERENCES planner_quotes(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  mime TEXT NOT NULL,
  content BLOB NOT NULL,
  PRIMARY KEY (quote_id, name)
);

CREATE INDEX IF NOT EXISTS planner_quotes_created ON planner_quotes (created_at DESC, id DESC);
```

### Contrato de `config_json` (TypeScript)

```typescript
export interface PlannerQuoteConfig {
  model: 'planner-essencial';
  mode: 'dated' | 'undated';
  year?: number;
  format: 'a5';
  style: 'classic' | 'commercial' | 'feminine';
  color: string;
  templateVersion: 'essencial-v1';
  personalizationName?: string;
  hasLogo: boolean;
  pages: number;
  sections: string[];
}
```

### Migração Idempotente

A adição é puramente aditiva (`CREATE TABLE IF NOT EXISTS`) e é executada no ciclo de inicialização do banco em `src/db/database.ts` (na função `initDatabase()`), garantindo idempotência total sem impactar dados de produção ou de outros produtos.

## 2. Compatibilidade com Backup e Restauração

O motor de backup (`src/server/backup/engine.py`) opera sobre o arquivo de banco completo `studio678.db` e uploads em disco, incorporando a nova tabela automaticamente nos snapshots sem necessidade de alteração nos scripts de backup.
