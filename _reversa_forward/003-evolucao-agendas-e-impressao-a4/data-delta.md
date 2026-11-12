# Data Delta: Evolução Editorial das Agendas e Módulo Compartilhado de Impressão A4

> Identificador: `003-evolucao-agendas-e-impressao-a4`
> Data: `2026-11-11`

## 1. Resumo de Impacto no Banco de Dados (`studio678.db`)

Esta feature **não altera o schema SQLite** nem exige novas tabelas ou colunas em `src/db/database.ts`.

| Tabela existente | Impacto | Observação |
|------------------|---------|------------|
| `agenda_quotes` | Nenhum | Mantém `config_json` e `config_version = 1` com `template: 'agenda-classica-v2'`. |
| `agenda_quote_assets` | Nenhum | Continua armazenando os 8 assets `preview-1` a `preview-8`, além de `original` e `logo`. |
| `planner_quotes` | Nenhum | Consumida apenas em leitura para geração dos PDFs A5 e A4 em `/admin/planners/[id]/pdf`. |
| `planner_quote_assets` | Nenhum | Sem alterações. |
| `site_settings` | Leitura adicional | Os campos existentes (`whatsapp`, `instagram`, `facebook`, `email`) são lidos via `getStudioSettings()` e repassados ao compilador de Agendas para popular a Página Institucional final do **678 Estudio** com dados reais. |

## 2. Novos Contratos em Memória (`src/server/print/a4Imposition.ts`)

```ts
export type A4StackMode = 'cut-stack' | 'sequential';
export type A4FlipMode = 'short-edge' | 'long-edge';
export type A4VersoOrder = 'normal' | 'reverse';
export type A4ScaleMode = 'full' | 'safe';

export interface A4ImpositionOptions {
  stackMode?: A4StackMode;
  flipMode?: A4FlipMode;
  versoOrder?: A4VersoOrder;
  scaleMode?: A4ScaleMode;
}

export interface A4SheetSlot {
  /** Índice 0-based da página A5 no PDF de origem, ou null para metade em branco */
  pageIndex: number | null;
  /** Rotação aplicada em graus (0 ou 180) */
  rotation: 0 | 180;
}

export interface A4ImpositionSheet {
  sheetNumber: number;
  frontLeft: A4SheetSlot;
  frontRight: A4SheetSlot;
  backLeft: A4SheetSlot;
  backRight: A4SheetSlot;
}
```

