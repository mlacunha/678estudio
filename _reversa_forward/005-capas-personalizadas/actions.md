# Actions: Sistema Compartilhado de Capas Personalizadas

> Identificador: `005-capas-personalizadas`
> Data: `2026-11-12`
> Roadmap: `_reversa_forward/005-capas-personalizadas/roadmap.md`

## Resumo

| Métrica | Valor |
|---------|-------|
| Total de ações | 14 |
| Paralelizáveis (`[//]`) | 5 |
| Maior cadeia de dependência | 6 |

## Fase 1, Preparação

| ID | Descrição | Dependências | Paralelismo | Arquivo alvo | Confidência | Status |
|----|-----------|--------------|-------------|--------------|-------------|--------|
| T001 | Criar catálogo de opções de capas (`coverStyles` [classic, modern, photographic], `coverTypographies` [modern, geometric, editorial], `coverPalettes`, `coverBleedOptions` [3mm, 5mm]) | - | `[//]` | `src/server/cover/options.mjs` | 🟢 | `[X]` |
| T002 | Criar tipos TypeScript e funções de validação de contraste WCAG $\ge 3:1$ e serialização de capas (`CoverConfig`, `CoverColors`, `CoverCrop`, `parseCoverConfig`, `validateCoverColors`) | T001 | - | `src/server/cover/coverConfig.ts` | 🟢 | `[X]` |
| T003 | Estender schemas e adaptadores dos orçamentos para incorporar o payload tipado `cover?: CoverConfig` e manipulação de ativo `cover_image` em agendas, planners e cadernos | T002 | - | `src/server/cover/quoteAdapter.ts` | 🟢 | `[X]` |

## Fase 2, Testes

| ID | Descrição | Dependências | Paralelismo | Arquivo alvo | Confidência | Status |
|----|-----------|--------------|-------------|--------------|-------------|--------|
| T004 | Criar testes unitários para validação de regras de capa, contraste WCAG, parse de crop de imagem e serialização nos orçamentos | T002, T003 | `[//]` | `src/server/cover/coverConfig.test.ts` | 🟢 | `[X]` |

## Fase 3, Núcleo

| ID | Descrição | Dependências | Paralelismo | Arquivo alvo | Confidência | Status |
|----|-----------|--------------|-------------|--------------|-------------|--------|
| T005 | Criar biblioteca Typst compartilhada de capas `src/server/cover/typst/lib/shared.typ` (geometria A5 com sangrias 3mm/5mm, marcas de corte de canto, margem de furação Wire-O de 15mm, grid e colofão da contracapa com `brand-678.png`) | T001 | `[//]` | `src/server/cover/typst/lib/shared.typ` | 🟢 | `[X]` |
| T006 | Implementar template Typst `src/server/cover/typst/lib/classic.typ` (estilo editorial clássico com molduras refinadas, cantos detalhados e tipografia com serifas ou caixa alta espaçada) | T005 | `[//]` | `src/server/cover/typst/lib/classic.typ` | 🟢 | `[X]` |
| T007 | Implementar template Typst `src/server/cover/typst/lib/modern.typ` (estilo contemporâneo minimalista com faixas ou blocos geométricos assimétricos e tipografia sem serifa) | T005 | `[//]` | `src/server/cover/typst/lib/modern.typ` | 🟢 | `[X]` |
| T008 | Implementar template Typst `src/server/cover/typst/lib/photographic.typ` (estilo fotográfico com máscara de corte, suporte a foto do cliente com zoom/offset, gradiente de contraste para legibilidade do texto e contracapa harmonizada) | T005 | - | `src/server/cover/typst/lib/photographic.typ` | 🟢 | `[X]` |
| T009 | Implementar template Typst `src/server/cover/typst/lib/combined_a4.typ` (imposição A4 horizontal `297 × 210 mm` com Capa e Contracapa lado a lado, escala 1:1, marcas e guia de corte central sem dobras) | T006, T007, T008 | - | `src/server/cover/typst/lib/combined_a4.typ` | 🟢 | `[X]` |
| T010 | Criar entrypoint `src/server/cover/typst/cover.typ` e compilador `src/server/cover/compiler.mjs` (`compileCoverPdf`, `generateCoverPreviewPng` com suporte aos alvos `front-a5`, `back-a5`, `combined-a4` e sangrias 3mm/5mm) | T009 | - | `src/server/cover/compiler.mjs` | 🟢 | `[X]` |

## Fase 4, Integração

| ID | Descrição | Dependências | Paralelismo | Arquivo alvo | Confidência | Status |
|----|-----------|--------------|-------------|--------------|-------------|--------|
| T011 | Implementar endpoint público de prévia `/api/cover/preview.ts` e componente frontend reutilizável de aba de capa (`src/components/customizer/CoverCustomizerTab.astro` e `src/scripts/coverCustomizer.ts`) com alternância entre Arte Plana e Mockup realista | T002, T010 | - | `src/pages/api/cover/preview.ts` | 🟢 | `[X]` |
| T012 | Integrar as duas abas ("1. Capa e Contracapa" / "2. Miolo e Conteúdo") nos personalizadores existentes: `/personalizar/caderno.astro`, preservando estado e envio unificado de orçamento | T011 | - | `src/pages/personalizar/caderno.astro` | 🟢 | `[X]` |
| T013 | Integrar geração e download de capas no painel administrativo (`/admin/cadernos/[id]/index.astro` e endpoint `/admin/capas/[family]/[id]/pdf.ts`), com opções de A5 3mm, A5 5mm e A4 horizontal | T003, T010 | - | `src/pages/admin/capas/[family]/[id]/pdf.ts` | 🟢 | `[X]` |

## Fase 5, Polimento

| ID | Descrição | Dependências | Paralelismo | Arquivo alvo | Confidência | Status |
|----|-----------|--------------|-------------|--------------|-------------|--------|
| T014 | Atualizar `Dockerfile` para incluir `src/server/cover`, e criar suíte de testes de integração `src/server/cover/compiler.test.ts` validando compilação A5 (3mm e 5mm), imposição A4 horizontal com corte central, persistência e regeneração administrativa nos 3 produtos | T010, T012, T013 | - | `src/server/cover/compiler.test.ts` | 🟢 | `[X]` |

## Notas de execução

- Todas as 14 ações foram implementadas com 100% de sucesso.
- O motor Typst utiliza as fontes `DM Serif Display`, `Manrope` e `Inter` já homologadas no projeto.
- A imposição A4 horizontal com marcas de corte milimétricas ao centro sem dobras foi testada e validada com compilação física.

## Histórico de alterações

| Data | Alteração | Autor |
|------|-----------|-------|
| 2026-11-12 | Versão inicial gerada por `/reversa-to-do` com 14 tarefas atômicas | reversa |
| 2026-11-12 | Implementação completa de `T001` a `T014` com testes aprovados | reversa |
| 2026-11-12 | Correção pós-publicação: `prerender = false` em `/api/cover/preview`, normalização `sharp`, `--root` Typst determinístico, persistência `cover`/`cover_image` no pedido e validação HTTP/E2E/Browser | reversa |
| 2026-11-12 | Conclusão da feature 005 nas 3 famílias: integração de `CoverCustomizerTab`, persistência e PDF administrativo em Agendas e Planners, validados em produção | reversa |
