# Actions: Evolução Editorial das Agendas e Módulo Compartilhado de Impressão A4

> Identificador: `003-evolucao-agendas-e-impressao-a4`
> Data: `2026-11-11`
> Roadmap: `_reversa_forward/003-evolucao-agendas-e-impressao-a4/roadmap.md`

## Resumo

| Métrica | Valor |
|---------|-------|
| Total de ações | 12 |
| Paralelizáveis (`[//]`) | 4 |
| Maior cadeia de dependência | 5 |

## Fase 1, Preparação

<!-- Setup, dependências e ativos gráficos estáticos para o compilador Typst. -->

| ID | Descrição | Dependências | Paralelismo | Arquivo alvo | Confidência | Status |
|----|-----------|--------------|-------------|--------------|-------------|--------|
| T001 | Adicionar a dependência pura `pdf-lib` ao manifesto do projeto para manipulação vetorial de páginas A5 em folhas A4 | - | `[//]` | `package.json` | 🟢 | `[X]` |
| T002 | Converter a marca oficial `public/images/brand/logo-678-estudio.webp` para `src/server/agenda/typst/brand-678.png` via Sharp para inclusão na Página Institucional final da Agenda | - | `[//]` | `src/server/agenda/typst/brand-678.png` | 🟢 | `[X]` |

## Fase 2, Testes

<!-- Testes unitários TDD para a matemática de imposição A4 Cut & Stack. -->

| ID | Descrição | Dependências | Paralelismo | Arquivo alvo | Confidência | Status |
|----|-----------|--------------|-------------|--------------|-------------|--------|
| T003 | Implementar o motor compartilhado de imposição vetorial A4 (`buildA4ImpositionPlan`, `imposeA5ToA4Fronts`, `imposeA5ToA4Backs`, `generateA4CalibrationPdf` e validador de parâmetros) usando `pdf-lib` | T001 | `[//]` | `src/server/print/a4Imposition.ts` | 🟢 | `[X]` |
| T004 | Criar suíte de testes unitários Vitest validando a matemática Cut & Stack e Sequencial, correspondência frente/verso (`short-edge` e `long-edge`), ordem (`normal` e `reverse`), escala segura (`96%`) e reconstrução exata de páginas `1..N` após corte central | T003 | `[//]` | `src/server/print/a4Imposition.test.ts` | 🟢 | `[X]` |

## Fase 3, Núcleo

<!-- Evolução dos templates Typst das Agendas e sincronização do orquestrador Node. -->

| ID | Descrição | Dependências | Paralelismo | Arquivo alvo | Confidência | Status |
|----|-----------|--------------|-------------|--------------|-------------|--------|
| T005 | Atualizar `daily.typ` para suportar o bloco complementar "Notas e Pendências do Mês" na metade direita da última página de meses com 29 ou 31 dias no layout `daily-2dpp` | - | - | `src/server/agenda/typst/lib/daily.typ` | 🟢 | `[X]` |
| T006 | Expandir `sections.typ` com `monthly-finance` completo (Contas e Vencimentos, Controle de Pagamento, Receitas, Despesas, Totais e Saldo do Mês), `contacts-page` (6 contatos por página) e `studio-colophon` (Página Institucional 678 Estudio) | T002 | - | `src/server/agenda/typst/lib/sections.typ` | 🟢 | `[X]` |
| T007 | Refatorar `classic.typ` para organizar os 3 layouts (`daily-1dpp`, `daily-2dpp`, `weekly`) em 12 ciclos mensais (`monthly-plan` + compromissos do mês + `monthly-finance`), seguidos por 4 páginas de Contatos, Anotações com fechamento par, Calendário de `year + 1` e Página Institucional final | T005, T006 | - | `src/server/agenda/typst/classic.typ` | 🟢 | `[X]` |
| T008 | Atualizar `classic.mjs` com o cálculo exato de índices das 8 prévias em `agendaPreviewSections`, contagem de páginas por layout e passagem dos dados institucionais reais do 678 Estudio via `--input` | T007 | - | `src/server/agenda/classic.mjs` | 🟢 | `[X]` |

## Fase 4, Integração

<!-- Endpoints administrativos A4, folha de calibração e painel compartilhado em Agendas e Planners. -->

| ID | Descrição | Dependências | Paralelismo | Arquivo alvo | Confidência | Status |
|----|-----------|--------------|-------------|--------------|-------------|--------|
| T009 | Criar endpoint `/admin/impressao-a4/calibracao.pdf.ts` e estender `/admin/agenda-classica.pdf.ts` e `/admin/planners/[id]/pdf.ts` para servir PDF A5 original, PDF A4 — Frentes e PDF A4 — Versos com validação estrita de parâmetros | T003, T008 | - | `src/pages/admin/impressao-a4/calibracao.pdf.ts` | 🟢 | `[X]` |
| T010 | Criar o componente compartilhado `AdminA4PrintPanel.astro` e integrá-lo nas páginas `/admin/agendas/[id]/index.astro` e `/admin/planners/[id]/index.astro` | T009 | - | `src/components/admin/AdminA4PrintPanel.astro` | 🟢 | `[X]` |

## Fase 5, Polimento

<!-- Testes de integração do compilador de Agendas, rotas administrativas e validação completa. -->

| ID | Descrição | Dependências | Paralelismo | Arquivo alvo | Confidência | Status |
|----|-----------|--------------|-------------|--------------|-------------|--------|
| T011 | Atualizar e expandir a suíte `src/server/agenda/classic.test.ts` validando os 12 controles financeiros mensais, isolamento de meses em `daily-2dpp`, atribuição única de semanas em `weekly`, Contatos, Calendário `year + 1`, Página Institucional e paginação par em 2027 e 2028 | T008 | - | `src/server/agenda/classic.test.ts` | 🟢 | `[X]` |
| T012 | Criar testes de integração para os endpoints administrativos de imposição A4 e calibração em Agendas e Planners e validar `pnpm test`, `pnpm exec astro check` e `pnpm build` | T010, T011 | - | `src/server/print/a4Imposition.test.ts` | 🟢 | `[X]` |

## Notas de execução

- Todas as 12 ações foram executadas respeitando os globs autorizados em `.reversa/reversa-config.json`.

## Histórico de alterações

| Data | Alteração | Autor |
|------|-----------|-------|
| 2026-11-11 | Versão inicial gerada por `/reversa-to-do` | reversa |
| 2026-11-11 | Execução completa das ações `T001` a `T012` por `/reversa-coding` | reversa |
