# Adendo: Cadernos Personalizados (Caderno de Receitas, Diário Pessoal e Livro de Memórias)

> Identificador: `004-cadernos-personalizados`
> Data: `2026-11-12`
> Cenário: `legado`

## Vigência

Vigente desde 2026-11-12.

## Resumo da entrega

Implementação completa da família **Cadernos Personalizados** na categoria Papelaria Personalizada do **678 Estudio**, integrando três modelos temáticos em formato A5 (`148 × 210 mm`) em um único fluxo de personalização, orçamento via WhatsApp, persistência SQLite, administração e imposição A4 Cut & Stack, com **14 de 14 ações concluídas** (`T001` a `T014`):

1. **Três Modelos Temáticos em Miolo A5 Vetorial (`src/server/caderno/typst/`):**
   - **Caderno de Receitas (`caderno-receitas` — `140` páginas A5 = `70` folhas A5 = `35` folhas A4 Cut & Stack):** Página 1 de abertura e identificação culinária, Página 2 com Guia de Medidas, Equivalências e Temperaturas de Forno, Páginas 3–6 de Índice numerado (`001` a `120`), Páginas 7–126 com **120 Fichas Estruturadas de Receitas** em layout vertical (Ingredientes em 2 subcolunas superiores de 14 linhas, Modo de Preparo central em largura integral com 10 pautas e Observações/Dicas na base com 3 linhas pontilhadas), Páginas 127–139 de Notas Culinárias & Testes de Cardápio e Página 140 institucional.
   - **Diário Pessoal Não Datado (`diario-pessoal` — `160` páginas A5 = `80` folhas A5 = `40` folhas A4 Cut & Stack):** Estritamente atemporal (sem calendários ou metas corporativas), composto por Página 1 de abertura do proprietário, Página 2 de Intenções & Ponto de Partida, Páginas 3–150 (`148` páginas) de escrita livre com cabeçalho discreto opcional de Data/Dia da Semana, 21 pautas e box inferior `Reflexões do Dia`, Páginas 151–159 (`9` páginas) de Citações, Pensamentos & Memórias Breves e Página 160 institucional.
   - **Livro de Memórias (`livro-memorias` — `120` páginas A5 = `60` folhas A5 = `30` folhas A4 Cut & Stack):** Página 1 de apresentação, Página 2 de Dedicatória (com texto personalizado ou linhas caligráficas), Página 3 de Cápsula do Tempo & Guia Afetivo, Páginas 4–5 de Sumário dos 52 Momentos em abertura dupla e **Páginas 6–109 com 52 Aberturas Duplas (`(6,7), (8,9), ..., (108,109)`)**, garantindo paridade rigorosa: **página par à esquerda (`2i+4`)** com moldura de fotografia, legenda, título, data, local e participantes, e **página ímpar seguinte à direita (`2i+5`)** com relato pautado e recordações especiais, seguidas pelas Páginas 110–119 de Recordações Especiais & Cartas e Página 120 institucional.
2. **Personalizador Compartilhado e Fluxo de Orçamento (`/personalizar/caderno`):** Permite escolher qualquer um dos 3 modelos, estilo visual (`classic`, `commercial`, `feminine`), tipografia (`modern`, `geometric`, `editorial`), título personalizado, nome/identificação, dedicatória opcional (exibida dinamicamente para o Livro de Memórias), cores personalizadas validadas por contraste WCAG ($\ge 3:1$), upload de imagem/logomarca (`PNG`/`JPEG` até `2 MB`) e marca-d’água, renderizando 6 prévias reais em PNG por modelo.
3. **Persistência SQLite, Painel Administrativo e Impressão A4 Cut & Stack:** Adição das tabelas `notebook_quotes` e `notebook_quote_assets` em `src/db/database.ts`, repositório `src/db/notebookQuotes.ts`, suporte em `src/server/backup/engine.py` (`OPTIONAL_SCHEMA`), página pública de referência `/caderno/orcamento/[id]` e rotas administrativas `/admin/cadernos` e `/admin/cadernos/[id]` integradas ao `AdminA4PrintPanel.astro` e `src/server/print/a4Imposition.ts`.

## Impacto por artefato da extração

| Artefato | Seção | Tipo de impacto | Delta |
|----------|-------|-----------------|-------|
| `_reversa_sdd/architecture.md` | `1. Visão Executiva e Estilo Arquitetural` | `componente-novo` | Adição do módulo `src/server/caderno/` (`options.mjs`, `compiler.mjs`, `quoteConfig.ts`, `drafts.ts` e templates Typst `shared.typ`, `receitas.typ`, `diario.typ`, `memorias.typ` e `caderno.typ`) e inclusão de `src/server/caderno` no `Dockerfile`. |
| `_reversa_sdd/erd-complete.md` | `Diagrama Entidade-Relacionamento` | `delta-de-dados` | Inclusão das tabelas `notebook_quotes` e `notebook_quote_assets` (com `ON DELETE CASCADE`) e da migração `stationery-notebooks-v1` em `src/db/database.ts`, além de `OPTIONAL_SCHEMA` em `src/server/backup/engine.py`. |
| `_reversa_sdd/code-analysis.md` | `2.6 Módulo admin` | `delta-de-contrato-externo` | Ativação do card `family-cadernos` em `/personalizar/caderno`, criação dos endpoints `/api/caderno/preview` e `/api/caderno/quote`, referência pública `/caderno/orcamento/[id]` e rotas administrativas `/admin/cadernos`, `/admin/cadernos/[id]` e `/admin/cadernos/[id]/pdf` com suporte a A4 Cut & Stack. |
| `_reversa_sdd/domain.md` | `2.4 Motor de Agendas (Typst)` | `regra-nova` | Inclusão das regras editoriais dos Cadernos Personalizados A5 (`140`, `160` e `120` páginas) e invariante de paridade das 52 aberturas duplas do Livro de Memórias (`páginas 6..109`). |

## Regras sob vigilância

- `W001`, `W002`, `W003`, `W004` documentados em [`_reversa_forward/004-cadernos-personalizados/regression-watch.md`](file:///d:/Projetos/site678Estudio/_reversa_forward/004-cadernos-personalizados/regression-watch.md).

## Fontes

- `_reversa_forward/004-cadernos-personalizados/requirements.md`
- `_reversa_forward/004-cadernos-personalizados/roadmap.md`
- `_reversa_forward/004-cadernos-personalizados/investigation.md`
- `_reversa_forward/004-cadernos-personalizados/data-delta.md`
- `_reversa_forward/004-cadernos-personalizados/legacy-impact.md`
- `_reversa_forward/004-cadernos-personalizados/regression-watch.md`
- `_reversa_forward/004-cadernos-personalizados/actions.md`
- `_reversa_forward/004-cadernos-personalizados/progress.jsonl`

