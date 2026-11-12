# Adendo: Evolução Editorial das Agendas e Módulo Compartilhado de Impressão A4

> Identificador: `003-evolucao-agendas-e-impressao-a4`
> Data: `2026-11-11`
> Cenário: `legado`

## Vigência

Vigente desde 2026-11-11.

## Resumo da entrega

Aperfeiçoamento completo do miolo das Agendas personalizadas em formato A5 e implementação do módulo compartilhado de preparação para impressão A4 manual (Cut & Stack) para Agendas e Planners, com **12 de 12 ações concluídas** (`T001` a `T012`):

1. **Ciclos Mensais Completos nas Agendas (`daily-1dpp`, `daily-2dpp` e `weekly`):** Cada um dos 12 meses (janeiro a dezembro) passa a iniciar com sua página de **Planejamento Mensal**, seguida pelas páginas de compromissos do respectivo mês e encerrada obrigatoriamente por uma página de **Controle Financeiro Mensal** contendo Contas e Vencimentos, Controle de Pagamento (checkboxes), Receitas, Despesas, lançamentos adicionais e fechamento com Total de Entradas, Total de Saídas e Saldo do Mês.
2. **Isolamento Mensal em `2 dias por página` e Regra Determinística de Semanas:** No layout `daily-2dpp`, dias de meses diferentes nunca compartilham a mesma página A5; meses com 29 ou 31 dias encerram sua última página diária com o bloco estruturado `"Notas e Pendências do Mês"`. No layout `weekly`, cada semana (segunda a domingo) aparece uma única vez no ano, atribuída ao mês da sua primeira data válida dentro do ano da Agenda.
3. **Novas Seções Finais e Paginação Par Determinística:** Inclusão de **4 páginas de Cadastro de Contatos** (9 registros por página = 36 contatos com Nome, Telefone/WhatsApp, E-mail e Observações), páginas de **Anotações** calibradas para fechamento par, **Calendário Anual real do ano seguinte (`year + 1`)** (respeitando anos bissextos como 2028) e **Página Institucional final do 678 Estudio** na última página (com logomarca oficial e canais reais configurados em `site_settings`). Independentemente de o ano ser comum ou bissexto, a paginação fecha em **400 páginas A5** (`daily-1dpp`), **222 páginas A5** (`daily-2dpp`) e **90 páginas A5** (`weekly`).
4. **Módulo Compartilhado de Imposição Vetorial A4 (`src/server/print/a4Imposition.ts`):** Baseado em `pdf-lib` (100% vetorial, zero dependências nativas), posiciona duas páginas A5 retrato (`148,5 × 210 mm`) lado a lado por folha A4 paisagem (`297 × 210 mm`) para corte reto central em guilhotina, sem dobras de livreto. Opera por padrão no modo **Cut & Stack** (onde basta cortar a pilha A4 ao meio e colocar a pilha esquerda sobre a direita para obter as folhas A5 na ordem `1..N`), suportando ajustes de virada do verso (`short-edge` e `long-edge`), ordem das folhas do verso (`normal` e `reverse`), área imprimível (`100%` ou margem segura `96%` para impressoras A4 comuns) e geração de **Folha de Calibração A4** de 2 páginas.
5. **Integração Administrativa em Agendas e Planners:** O componente compartilhado `AdminA4PrintPanel.astro` foi integrado em `/admin/agendas/[id]` e `/admin/planners/[id]`, mantendo o download do PDF A5 original separado dos arquivos A4 de produção (`PDF A4 — Frentes`, `PDF A4 — Versos` e `Folha de Calibração A4`).

## Impacto por artefato da extração

| Artefato | Seção | Tipo de impacto | Delta |
|----------|-------|-----------------|-------|
| `_reversa_sdd/architecture.md` | `1. Visão Executiva e Estilo Arquitetural` | `componente-novo` | Adição do módulo compartilhado `src/server/print/a4Imposition.ts` (`pdf-lib`) para imposição vetorial 2-up A5→A4 (Cut & Stack, Frentes, Versos e Calibração) compartilhado por Agendas e Planners. |
| `_reversa_sdd/code-analysis.md` | `2.5 Módulo agenda-compiler` | `regra-alterada` | O template `classic.typ`, `sections.typ`, `daily.typ` e `classic.mjs` passam a estruturar 12 ciclos mensais com Controle Financeiro Mensal, Contatos, Calendário `year + 1`, Colofão 678 Estudio e paginação fixa par (`400`, `222`, `90`), atualizando as 8 seções de `agendaPreviewSections`. |
| `_reversa_sdd/code-analysis.md` | `2.6 Módulo admin` | `delta-de-contrato-externo` | As telas `/admin/agendas/[id]` e `/admin/planners/[id]` incluem `AdminA4PrintPanel.astro`, e os endpoints `/admin/agenda-classica.pdf`, `/admin/planners/[id]/pdf` e `/admin/impressao-a4/calibracao.pdf` servem os PDFs A4 de Frentes, Versos e Calibração. |
| `_reversa_sdd/domain.md` | `2.4 Motor de Agendas (Typst)` | `regra-alterada` | A regra `RN-AGE-03` passa a contemplar as novas seções editoriais mensais e finais da Agenda Clássica v2. |

## Regras sob vigilância

- `W001`, `W002`, `W003` documentados em [`_reversa_forward/003-evolucao-agendas-e-impressao-a4/regression-watch.md`](file:///d:/Projetos/site678Estudio/_reversa_forward/003-evolucao-agendas-e-impressao-a4/regression-watch.md).

## Fontes

- `_reversa_forward/003-evolucao-agendas-e-impressao-a4/requirements.md`
- `_reversa_forward/003-evolucao-agendas-e-impressao-a4/roadmap.md`
- `_reversa_forward/003-evolucao-agendas-e-impressao-a4/investigation.md`
- `_reversa_forward/003-evolucao-agendas-e-impressao-a4/data-delta.md`
- `_reversa_forward/003-evolucao-agendas-e-impressao-a4/legacy-impact.md`
- `_reversa_forward/003-evolucao-agendas-e-impressao-a4/regression-watch.md`
- `_reversa_forward/003-evolucao-agendas-e-impressao-a4/actions.md`
- `_reversa_forward/003-evolucao-agendas-e-impressao-a4/progress.jsonl`

