# Actions: Personalizador de Planners (Planner Essencial)

> Identificador: `002-personalizador-planners`  
> Data: `2026-11-11`  
> Roadmap: `_reversa_forward/002-personalizador-planners/roadmap.md`

## Resumo

| Métrica | Valor |
|---------|-------|
| Total de ações | 17 |
| Paralelizáveis (`[//]`) | 5 |
| Maior cadeia de dependência | 6 |

## Fase 1, Preparação

<!-- Setup, modelos de dados, configurações e funções puras matemáticas. -->

| ID | Descrição | Dependências | Paralelismo | Arquivo alvo | Confidência | Status |
|----|-----------|--------------|-------------|--------------|-------------|--------|
| T001 | Definir configurações, opções e estilos visuais do Planner Essencial (modalidades datada/não datada, anos, estilos Clássico/Comercial/Feminino, paletas de cores e metadados das 8 seções) | - | `[//]` | `src/server/planner/options.mjs` | 🟢 | `[X]` |
| T002 | Criar contratos TypeScript e validações de configuração do pedido (`PlannerQuoteConfig`, tokens `PL-...` e versionamento de schema) | - | `[//]` | `src/server/planner/quoteConfig.ts` | 🟢 | `[X]` |
| T003 | Implementar módulo de calendário puro com cálculo de matrizes semanais contínuas, anos bissextos, transições de mês sem omissões e grids atemporais não datados | - | `[//]` | `src/server/planner/calendar.ts` | 🟢 | `[X]` |
| T004 | Adicionar schema idempotente das tabelas `planner_quotes` e `planner_quote_assets` no ciclo de inicialização do SQLite | T002 | - | `src/db/database.ts` | 🟢 | `[X]` |
| T005 | Implementar repositório relacional do Planner (`savePlannerQuote`, `getPlannerQuoteByDraft`, `getPlannerQuote`, `listPlannerQuotes` e recuperação de assets) | T002, T004 | - | `src/db/plannerQuotes.ts` | 🟢 | `[X]` |

## Fase 2, Testes

<!-- Testes unitários com Vitest cobrindo matemática de datas e persistência relacional. -->

| ID | Descrição | Dependências | Paralelismo | Arquivo alvo | Confidência | Status |
|----|-----------|--------------|-------------|--------------|-------------|--------|
| T006 | Criar testes unitários Vitest para o motor de calendário (validação de anos bissextos, continuidade de datas entre meses e grids estruturados não datados) | T003 | `[//]` | `src/server/planner/calendar.test.ts` | 🟢 | `[X]` |
| T007 | Criar testes unitários Vitest para o repositório SQLite (validação de persistência com `config_json`, integridade transacional de assets e recuperação por token) | T005 | `[//]` | `src/db/plannerQuotes.test.ts` | 🟢 | `[X]` |

## Fase 3, Núcleo

<!-- Template Typst próprio em formato A5 e orquestrador de compilação CLI. -->

| ID | Descrição | Dependências | Paralelismo | Arquivo alvo | Confidência | Status |
|----|-----------|--------------|-------------|--------------|-------------|--------|
| T008 | Desenvolver biblioteca de blocos e seções Typst com suporte a calha de encadernação, abertura semanal em duas páginas A5 consecutivas e tabelas completas de controle financeiro | T001 | - | `src/server/planner/typst/lib/planner-sections.typ` | 🟢 | `[X]` |
| T009 | Desenvolver o template Typst principal do Planner Essencial A5 (`essencial.typ`) orquestrando as 8 seções funcionais com margens espelhadas e paginação frente/verso | T008, T003 | - | `src/server/planner/typst/essencial.typ` | 🟢 | `[X]` |
| T010 | Implementar o orquestrador de compilação Typst CLI (`renderPlannerPdf` e `renderPlannerPagePreview`) gerando PDFs de produção e páginas de prévia em SVG/PNG | T009 | - | `src/server/planner/essencial.mjs` | 🟢 | `[X]` |

## Fase 4, Integração

<!-- Endpoints de API, personalizador Astro, prévias reais, WhatsApp e painel administrativo. -->

| ID | Descrição | Dependências | Paralelismo | Arquivo alvo | Confidência | Status |
|----|-----------|--------------|-------------|--------------|-------------|--------|
| T011 | Implementar endpoint `/api/planner/preview` para compilação e retorno em tempo real de páginas de amostra Typst para as 8 seções | T010 | - | `src/pages/api/planner/preview.ts` | 🟢 | `[X]` |
| T012 | Implementar endpoint `/api/planner/quote` para validação de formulário, upload de arquivo de logo, gravação do pedido em SQLite e geração do link de orçamento | T005, T010 | - | `src/pages/api/planner/quote.ts` | 🟢 | `[X]` |
| T013 | Criar a página pública do personalizador em `/personalizar/planner` com formulário de configuração, seleção de estilo e galeria de prévias | T001, T011, T012 | - | `src/pages/personalizar/planner.astro` | 🟢 | `[X]` |
| T014 | Implementar o script cliente do personalizador com reatividade imediata na troca de seções, ampliação/zoom das prévias e submissão fluida | T013 | - | `src/scripts/plannerCustomizer.ts` | 🟢 | `[X]` |
| T015 | Implementar a tela administrativa em `/admin/planners/[id]/index.astro` para visualização dos dados do pedido, auditoria da logo e download do PDF de produção | T005, T010 | - | `src/pages/admin/planners/[id]/index.astro` | 🟢 | `[X]` |
| T016 | Ativar a família de Planners em `stationeryFamilies` (`available: true`), habilitando o card na vitrine principal de Papelaria Personalizada | T013 | - | `src/data/stationery.ts` | 🟢 | `[X]` |

## Fase 5, Polimento e Homologação

<!-- Verificação estética, integridade visual de impressão e validação completa. -->

| ID | Descrição | Dependências | Paralelismo | Arquivo alvo | Confidência | Status |
|----|-----------|--------------|-------------|--------------|-------------|--------|
| T017 | Executar validação completa do PDF compilado em A5 (margens espelhadas de encadernação, ausência de páginas em branco espúrias, fidelidade dos 3 estilos e execução de `pnpm test` e `pnpm build`) | T014, T015, T016 | - | `src/server/planner/essencial.test.ts` | 🟢 | `[X]` |
