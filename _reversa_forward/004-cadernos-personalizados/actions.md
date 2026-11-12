# Actions: Cadernos Personalizados (Receitas, Diário Pessoal e Livro de Memórias)

> Identificador: `004-cadernos-personalizados`
> Data: `2026-11-12`
> Roadmap: `_reversa_forward/004-cadernos-personalizados/roadmap.md`

## Resumo

| Métrica | Valor |
|---------|-------|
| Total de ações | 14 |
| Paralelizáveis (`[//]`) | 4 |
| Maior cadeia de dependência | 6 |

## Fase 1, Preparação

| ID | Descrição | Dependências | Paralelismo | Arquivo alvo | Confidência | Status |
|----|-----------|--------------|-------------|--------------|-------------|--------|
| T001 | Criar catálogo de opções dos Cadernos Personalizados (`notebookModels`, `notebookFormats`, `notebookStyles`, `notebookTypographies`, `notebookSectionsByModel`, `notebookTotalPages` = 140, 160 e 120) | - | `[//]` | `src/server/caderno/options.mjs` | 🟢 | `[X]` |
| T002 | Criar contratos TypeScript (`NotebookQuoteConfig`, `NotebookQuoteAsset`, `notebookQuotePath`, `notebookQuoteLabels`, `isNotebookReference`) e cache temporário de rascunhos em memória (`storeNotebookDraft`, `getNotebookDraft`, `discardNotebookDraft`) | T001 | - | `src/server/caderno/quoteConfig.ts` | 🟢 | `[X]` |
| T003 | Estender `src/db/database.ts` com as tabelas `notebook_quotes` e `notebook_quote_assets` e a migração `stationery-notebooks-v1`, e implementar o repositório `src/db/notebookQuotes.ts` | T002 | - | `src/db/notebookQuotes.ts` | 🟢 | `[X]` |
| T004 | Ativar a família `'family-cadernos'` em `src/data/stationery.ts` (`available: true`, `route: '/personalizar/caderno'`, `models: ['caderno-receitas', 'diario-pessoal', 'livro-memorias']`) | T001 | `[//]` | `src/data/stationery.ts` | 🟢 | `[X]` |

## Fase 2, Testes

| ID | Descrição | Dependências | Paralelismo | Arquivo alvo | Confidência | Status |
|----|-----------|--------------|-------------|--------------|-------------|--------|
| T005 | Criar suíte de testes unitários para persistência e recuperação idempotente de solicitações e ativos de cadernos em `src/db/notebookQuotes.test.ts` | T003 | `[//]` | `src/db/notebookQuotes.test.ts` | 🟢 | `[X]` |

## Fase 3, Núcleo

| ID | Descrição | Dependências | Paralelismo | Arquivo alvo | Confidência | Status |
|----|-----------|--------------|-------------|--------------|-------------|--------|
| T006 | Criar biblioteca Typst compartilhada `src/server/caderno/typst/lib/shared.typ` (cabeçalhos, rodapés A5 espelhados, linhas pautadas/pontilhadas, abertura com logo, marca-d’água e Página Institucional `studio-colophon` com logo oficial `brand-678.png`) | T001 | `[//]` | `src/server/caderno/typst/lib/shared.typ` | 🟢 | `[X]` |
| T007 | Implementar o template `src/server/caderno/typst/lib/receitas.typ` para o **Caderno de Receitas** (140 páginas A5: abertura, equivalências culinárias, 4 páginas de índice `001..120`, 120 fichas de receitas com organização vertical — Ingredientes no topo em 2 subcolunas de 57 mm e Modo de Preparo abaixo em largura integral de 118 mm —, 13 páginas de notas e página institucional) | T006 | - | `src/server/caderno/typst/lib/receitas.typ` | 🟢 | `[X]` |
| T008 | Implementar o template `src/server/caderno/typst/lib/diario.typ` para o **Diário Pessoal** não datado (160 páginas A5: abertura com identificação do proprietário, página de intenções, 148 páginas de escrita livre pautada com data opcional e bloco de reflexão, 9 páginas de citações/pensamentos e página institucional) | T006 | - | `src/server/caderno/typst/lib/diario.typ` | 🟢 | `[X]` |
| T009 | Implementar o template `src/server/caderno/typst/lib/memorias.typ` para o **Livro de Memórias** (120 páginas A5: Pág. 1 apresentação, Pág. 2 dedicatória, Pág. 3 guia afetivo, Págs. 4–5 sumário em abertura dupla, **Págs. 6–109 com 52 aberturas duplas de acontecimentos iniciando em página par `6` à esquerda [foto/data/local/participantes] e página ímpar `7` à direita [relato]**, Págs. 110–119 recordações especiais e Pág. 120 institucional) | T006 | - | `src/server/caderno/typst/lib/memorias.typ` | 🟢 | `[X]` |
| T010 | Criar entrypoint `src/server/caderno/typst/caderno.typ` e orquestrador `src/server/caderno/compiler.mjs` (`compileNotebook`, `queryMemoriasSpreads`) | T007, T008, T009 | - | `src/server/caderno/compiler.mjs` | 🟢 | `[X]` |

## Fase 4, Integração

| ID | Descrição | Dependências | Paralelismo | Arquivo alvo | Confidência | Status |
|----|-----------|--------------|-------------|--------------|-------------|--------|
| T011 | Implementar endpoints públicos `/api/caderno/preview.ts`, `/api/caderno/quote.ts` e páginas de referência `/caderno/orcamento/[id]/index.astro` e `/caderno/orcamento/[id]/previa/[section].ts` | T003, T010 | - | `src/pages/api/caderno/preview.ts` | 🟢 | `[X]` |
| T012 | Implementar a página do personalizador compartilhado `/personalizar/caderno.astro` e o controlador cliente `src/scripts/notebookCustomizer.ts` com troca dinâmica dos 3 modelos e galeria de 6 prévias reais | T011 | - | `src/pages/personalizar/caderno.astro` | 🟢 | `[X]` |
| T013 | Implementar as rotas administrativas `/admin/cadernos/index.astro`, `/admin/cadernos/[id]/index.astro` (integrada com `AdminA4PrintPanel.astro`), `/admin/cadernos/[id]/pdf.ts` (integrada com `a4Imposition.ts`), `/admin/cadernos/[id]/arquivo/[file].ts`, link em `/admin/index.astro` e cópia de `src/server/caderno` no `Dockerfile` | T010, T011 | - | `src/pages/admin/cadernos/[id]/pdf.ts` | 🟢 | `[X]` |

## Fase 5, Polimento

| ID | Descrição | Dependências | Paralelismo | Arquivo alvo | Confidência | Status |
|----|-----------|--------------|-------------|--------------|-------------|--------|
| T014 | Criar suíte de testes `src/server/caderno/compiler.test.ts` validando compilação A5 dos 3 modelos (`140`, `160` e `120` páginas), verificação explícita da paridade e sequência das 52 aberturas duplas `(página par = foto/local, página ímpar = relato)` de `6..109` no Livro de Memórias, 6 prévias por modelo e imposição A4 Cut & Stack (`35`, `40` e `30` folhas A4) | T010, T013 | - | `src/server/caderno/compiler.test.ts` | 🟢 | `[X]` |

## Notas de execução

- `T001`–`T014` implementadas e verificadas com Typst `0.15.1`, Vitest, Astro Check e motor Python de backup.
- `Livro de Memórias` validado via `typst query` (`<memoria-spread>`) confirmando que todas as 52 aberturas duplas iniciam em páginas pares (`6, 8, ..., 108`) à esquerda e encerram nas páginas ímpares (`7, 9, ..., 109`) à direita.

## Histórico de alterações

| Data | Alteração | Autor |
|------|-----------|-------|
| 2026-11-12 | Versão inicial gerada por `/reversa-to-do` | reversa |
| 2026-11-12 | Implementação completa de `T001`–`T014` por `/reversa-coding` | reversa |
