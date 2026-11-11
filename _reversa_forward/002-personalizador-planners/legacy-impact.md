# Impacto no Legado: Personalizador de Planners

> Feature: `002-personalizador-planners`  
> Data: `2026-11-11`  

## 1. Arquivos Modificados no Legado
- `src/db/database.ts`: Adicionada criação idempotente das tabelas `planner_quotes` e `planner_quote_assets` com índice em `draft_token`. Não modifica nem apaga tabelas existentes de agendas ou catálogo.
- `src/data/stationery.ts`: Ativada a família `'family-planners'` com rota `/personalizar/planner` e modelo inicial `planner-essencial`.

## 2. Novos Arquivos Adicionados
- `src/server/planner/options.mjs`: Opções, estilos, anos e seções do Planner Essencial.
- `src/server/planner/quoteConfig.ts`: Contratos TypeScript, tokens e helpers de labels.
- `src/server/planner/calendar.ts`: Algoritmo de semanas e calendários puros.
- `src/server/planner/calendar.test.ts`: Testes unitários do calendário.
- `src/server/planner/drafts.ts`: Armazenamento de rascunhos de prévia em memória com TTL.
- `src/server/planner/essencial.mjs`: Runner Typst CLI para compilação isolada de seções e PDF completo.
- `src/server/planner/essencial.test.ts`: Testes unitários de compilação Typst em PNG e PDF.
- `src/server/planner/typst/lib/planner-sections.typ`: Módulo de renderização das 8 seções funcionais em A5.
- `src/server/planner/typst/essencial.typ`: Template principal A5 do Planner Essencial.
- `src/db/plannerQuotes.ts`: Operações relacionais SQLite (`planner_quotes` e `planner_quote_assets`).
- `src/db/plannerQuotes.test.ts`: Testes unitários do repositório SQLite.
- `src/pages/api/planner/preview.ts`: Endpoint de geração de prévias em tempo real.
- `src/pages/api/planner/quote.ts`: Endpoint de persistência e geração de link WhatsApp.
- `src/pages/personalizar/planner.astro`: Interface do personalizador público.
- `src/scripts/plannerCustomizer.ts`: Script de reatividade, zoom e orçamento do personalizador.
- `src/pages/admin/planners/index.astro`: Lista administrativa de orçamentos de planners.
- `src/pages/admin/planners/[id]/index.astro`: Detalhe administrativo, auditoria de logo e prévias.
- `src/pages/admin/planners/[id]/arquivo/[file].ts`: Endpoint de download de configuração e assets.
- `src/pages/admin/planners/[id]/pdf.ts`: Endpoint de download do PDF completo de produção.

## 3. Risco e Compatibilidade
- Zero interferência com o fluxo de Agendas Clássicas.
- Mantida rigorosamente a família de produtos "Planners" na vitrine (sem criar cards adicionais).
- Formato semanal de duas páginas A5 consecutivas garantido com margens espelhadas e calha de encadernação.

