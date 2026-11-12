# Data Delta: Sistema Compartilhado de Capas Personalizadas

> Identificador: `005-capas-personalizadas`
> Data: `2026-11-12`
> Extração reversa: `_reversa_sdd/erd-complete.md` e `_reversa_sdd/data-dictionary.md`

## 1. Visão Geral das Mudanças de Dados

As três famílias de Papelaria Personalizada possuem tabelas dedicadas de orçamentos e anexos:
- `agenda_quotes` e `agenda_quote_assets`
- `planner_quotes` e `planner_quote_assets`
- `notebook_quotes` e `notebook_quote_assets`

Cada uma dessas tabelas já possui uma coluna `config_json TEXT NOT NULL` contendo o payload serializado do pedido (ano, formato, estilo, cores, miolo).

Para evitar quebras de migração complexas ou desnormalizações desnecessárias, a configuração da capa será integrada de forma elegante e tipada:

1. **Extensão dos Payloads JSON:**
   - Adição do objeto estruturado `cover?: CoverConfig` dentro de `config_json` nos registros de orçamentos de Agendas, Planners e Cadernos.
2. **Armazenamento de Ativos de Capa:**
   - A fotografia enviada pelo cliente para a capa fotográfica utiliza a tabela de ativos correspondente (`agenda_quote_assets`, `planner_quote_assets` ou `notebook_quote_assets`) com a chave padronizada `asset_type = 'cover_image'`.
   - As prévias renderizadas da capa utilizam `asset_type = 'cover_preview_front'` e `asset_type = 'cover_preview_back'`.

## 2. Estrutura do Objeto `CoverConfig`

```typescript
export interface CoverColors {
  primary: string;    // Ex: '#1f2937'
  secondary: string;  // Ex: '#f3f4f6'
  text: string;       // Ex: '#ffffff' ou '#111827'
  accent?: string;    // Cor de destaque opcional
}

export interface CoverCrop {
  zoom: number;       // 100 a 250 (%)
  offsetX: number;    // -100 a 100 (%)
  offsetY: number;    // -100 a 100 (%)
}

export interface CoverConfig {
  style: 'classic' | 'modern' | 'photographic';
  typography: 'modern' | 'geometric' | 'editorial';
  title: string;
  name: string;
  subtitle?: string;
  colors: CoverColors;
  hasCustomImage: boolean;
  imageCrop?: CoverCrop;
  origin?: 'custom_upload' | 'studio_library';
  libraryAssetId?: string;
}
```

## 3. Compatibilidade e Migração

- **Compatibilidade Retroativa:** Pedidos existentes sem `cover` continuam válidos e serão tratados como capas com estilo padrão clássico ou neutro caso abertos no admin.
- **Motor de Backup SQLite (`src/server/backup/engine.py`):**
  - Nenhuma tabela nova precisa ser criada; as tabelas existentes (`agenda_quotes`, `agenda_quote_assets`, `planner_quotes`, `planner_quote_assets`, `notebook_quotes`, `notebook_quote_assets`) já estão 100% integradas ao motor de backup e ao teste automatizado `src/server/backup/test_engine.py`.

