# Roadmap: Evolução Editorial das Agendas e Módulo Compartilhado de Impressão A4

> Identificador: `003-evolucao-agendas-e-impressao-a4`
> Data: `2026-11-11`
> Requirements: `_reversa_forward/003-evolucao-agendas-e-impressao-a4/requirements.md`
> Confidência: 🟢 CONFIRMADO, 🟡 INFERIDO, 🔴 LACUNA

## 1. Resumo da abordagem

A implementação divide-se em dois eixos integrados:
1. **Eixo A — Evolução Editorial das Agendas (`src/server/agenda/`):** Refatoração de `src/server/agenda/typst/lib/sections.typ` e `src/server/agenda/typst/classic.typ` para organizar o ano em 12 ciclos mensais autocontidos (`[Planejamento Mensal] → [Dias/Semanas do Mês] → [Controle Financeiro Mensal]`), seguidos por 4 páginas de Cadastro de Contatos (24 registros), páginas de Anotações de fechamento par, Calendário Anual do Ano Seguinte (`year + 1`) e Página Institucional final do **678 Estudio** com marca e contatos reais de `studioSettings.ts`. Em `src/server/agenda/classic.mjs`, a função `agendaPreviewSections` e os parâmetros `--input` são sincronizados com os novos índices de páginas.
2. **Eixo B — Módulo Compartilhado de Imposição A4 (`src/server/print/`):** Criação de `src/server/print/a4Imposition.ts` usando `pdf-lib` para embutir páginas vetoriais de qualquer PDF A5 (Agendas ou Planners) em folhas A4 paisagem (`297 × 210 mm`), gerando separadamente `PDF A4 — Frentes`, `PDF A4 — Versos` e `Folha de Calibração A4` no padrão Cut & Stack (ou sequencial), com suporte a orientação de virada (`short-edge` / `long-edge`), ordem de alimentação (`normal` / `reverse`) e margem de segurança para impressoras comuns (`100%` / `96%`). O componente administrativo `src/components/admin/AdminA4PrintPanel.astro` é integrado em `/admin/agendas/[id]` e `/admin/planners/[id]`.

## 2. Princípios aplicados

| Princípio | Como a feature se relaciona | Status |
|-----------|------------------------------|--------|
| Isolamento e Preservação do Legado | Mantém os 3 cards comerciais de Papelaria Personalizada em `src/data/stationery.ts` e preserva a retrocompatibilidade com solicitações `agenda-classica-v1` e `agenda-classica-v2`. | respeita |
| Segurança e Validação de Entradas | Todos os parâmetros de query de impressão A4 (`modo`, `empilhamento`, `virada`, `ordem`, `escala`) passam por validação estrita antes da geração. | respeita |
| Portabilidade Multi-Arquitetura (`amd64`/`arm64`) | Uso exclusivo de `pdf-lib` (JavaScript puro, sem binários nativos) e ativos estáticos versionados no repositório. | respeita |

## 3. Decisões técnicas

| ID | Decisão | Justificativa | Alternativas descartadas | Confidência |
|----|---------|----------------|--------------------------|-------------|
| D-01 | Estruturar `classic.typ` num laço mensal `for month in range(1, 13)` que emite `monthly-plan`, as páginas de compromissos do mês e `monthly-finance` ao final de cada mês (RF-01, RF-02). | Atende diretamente à regra RN-02 e mantém cada mês autocontido para consulta e controle financeiro. | Manter os 12 planejamentos agrupados no início do ano. | 🟢 |
| D-02 | No layout `daily-2dpp`, iterar sobre os dias de cada mês em passos de 2; quando o mês tiver número ímpar de dias (29 ou 31), renderizar na metade direita da última página do mês o componente `month-closing-notes` ("Notas e Pendências do Mês") (RF-03). | Evita misturar dias de meses distintos na mesma página A5 e posiciona o Controle Financeiro Mensal estritamente ao final do mês (RN-03). | Misturar 31/jan com 01/fev na mesma página. | 🟢 |
| D-03 | No layout `weekly`, enumerar todas as semanas de segunda a domingo que intersectam o ano e atribuir cada semana ao mês da sua primeira data válida dentro do ano (`calc.max(offset, 0)`), emitindo `monthly-finance` imediatamente após a última semana atribuída ao mês (RF-04). | Garante que cada semana apareça uma única vez no ano (53 semanas) e que todos os 12 meses tenham seu Controle Financeiro Mensal posicionado de forma determinística (RN-04). | Duplicar semanas de transição entre dois meses. | 🟢 |
| D-04 | Adicionar em `sections.typ` as seções finais `contacts-page` (4 páginas × 6 registros = 24 contatos), `notes` (quantidade dinâmica 2 a 4 páginas para garantir total par de páginas A5), `annual-calendar(year + 1, ...)` e `studio-colophon` (última página com logo `brand-678.png` e dados reais de `studioSettings.ts`) (RF-05, RF-06, RF-07). | Entrega o pacote editorial completo exigido por RN-06 e garante número par de páginas A5 para frente/verso perfeito. | Número fixo de páginas de notas que deixasse anos bissextos com página ímpar. | 🟢 |
| D-05 | Atualizar `agendaPreviewSections` em `src/server/agenda/classic.mjs` com cálculo exato das páginas por mês para retornar as 8 seções representativas (Abertura, Calendário Anual, Dados Pessoais, Planejamento Mensal, Layout de Compromissos, Controle Financeiro Mensal, Contatos e Calendário do Ano Seguinte) (RF-08). | Mantém a galeria de 8 prévias PNG do personalizador público e do painel administrativo alinhada às páginas reais compiladas pelo Typst. | Índices estáticos fixos que apontariam para páginas deslocadas. | 🟢 |
| D-06 | Implementar `src/server/print/a4Imposition.ts` com `pdf-lib` operando em memória sobre qualquer `Uint8Array` de PDF A5 para gerar `PDF A4 — Frentes`, `PDF A4 — Versos` e `Folha de Calibração A4` em A4 paisagem (`841.89 pt × 595.28 pt`) com duas células A5 (`420.945 pt × 595.28 pt`) lado a lado (RF-09, RF-10, RF-11). | Preserva 100% dos vetores e fontes gerados pelo Typst, funciona para Agendas e Planners sem duplicar templates e independe de binários nativos (RN-07, RN-08, RN-09). | Rasterizar páginas com Sharp ou manter templates Typst duplicados em A4. | 🟢 |
| D-07 | Suportar no motor de imposição A4 o parâmetro `safeScale` (`1` para escala real 100% ou `0.96` centralizado em cada metade A5, criando margem de segurança adicional de `~3 mm` a `4,2 mm` nas bordas externas da folha A4) (RF-10, RN-09). | Impressoras A4 jato de tinta/laser comuns possuem margem física não imprimível de `3 mm` a `5 mm`; o modo `safeScale = 0.96` evita qualquer corte em cabeçalhos, rodapés ou bordas sem alterar a linha de corte central em `148,5 mm`. | Presumir impressão sem margens (borderless) em impressoras A4 comuns. | 🟢 |
| D-08 | Criar o componente compartilhado `src/components/admin/AdminA4PrintPanel.astro` e conectá-lo a `/admin/agendas/[id]/index.astro`, `/admin/planners/[id]/index.astro`, `/admin/agenda-classica.pdf.ts`, `/admin/planners/[id]/pdf.ts` e à nova rota `/admin/impressao-a4/calibracao.pdf.ts` (RF-11, RF-12). | Unifica a experiência do operador para Agendas e Planners mantendo a distinção clara entre o PDF A5 original e os arquivos A4 preparados para produção. | Duplicar controles HTML e lógica de rotas entre Agendas e Planners. | 🟢 |

## 4. Premissas

Nenhuma premissa aberta pendente de dúvida; todas as decisões foram homologadas pelo usuário.

## 5. Delta arquitetural

| Componente | Arquivo de origem no legado | Tipo de mudança | Resumo |
|------------|------------------------------|-----------------|--------|
| `agenda-compiler` | `_reversa_sdd/code-analysis.md#2.5 Módulo agenda-compiler` | regra-alterada | Reorganização do miolo em 12 ciclos mensais com Controle Financeiro por mês, Contatos, Calendário `year + 1`, Colofão 678 Estudio e recálculo de `agendaPreviewSections`. |
| `print-a4-imposition` | `_reversa_sdd/architecture.md#1. Visão Executiva e Estilo Arquitetural` | componente-novo | Novo módulo compartilhado `src/server/print/a4Imposition.ts` com `pdf-lib` para imposição vetorial 2-up A5→A4 (Frentes, Versos e Calibração). |
| `admin` | `_reversa_sdd/code-analysis.md#2.6 Módulo admin` | contrato-alterado | Inclusão de `AdminA4PrintPanel.astro` nas páginas de detalhes de Agendas e Planners e suporte a downloads A4 nos endpoints administrativos de PDF. |

## 6. Delta no modelo de dados

- Resumo das mudanças: Nenhuma alteração estrutural ou migração de tabelas no SQLite (`studio678.db`). As tabelas `agenda_quotes`, `agenda_quote_assets`, `planner_quotes`, `planner_quote_assets` e `site_settings` permanecem inalteradas.
- Detalhe completo em: `_reversa_forward/003-evolucao-agendas-e-impressao-a4/data-delta.md`

## 7. Delta de contratos externos

| Contrato | Tipo | Arquivo de detalhe |
|----------|------|--------------------|
| Endpoints Administrativos de Impressão A4 e Calibração | HTTP | `_reversa_forward/003-evolucao-agendas-e-impressao-a4/interfaces/admin-a4-print-endpoints.md` |

## 8. Plano de migração

1. Instalar a dependência pura `pdf-lib` no `package.json`.
2. Gerar o ativo institucional `src/server/agenda/typst/brand-678.png` a partir da marca oficial existente em `public/images/brand/logo-678-estudio.webp` para uso pelo compilador Typst.
3. Atualizar os templates Typst de Agenda (`classic.typ`, `sections.typ`, `daily.typ`) preservando `classic-v1.typ` intocado para pedidos históricos v1.
4. Disponibilizar os endpoints e painel administrativo de imposição A4 sem alterar os registros existentes no banco SQLite.

## 9. Riscos e mitigações

| Risco | Impacto | Probabilidade | Mitigação |
|-------|---------|---------------|-----------|
| Desalinhamento entre índices de página em `classic.typ` e `agendaPreviewSections` em `classic.mjs` | alto | média | Criar função pura determinística de cálculo de páginas mensais testada em `classic.test.ts` contra o PDF real compilado pelo Typst nos 3 layouts (2027 e 2028). |
| Inversão de colunas esquerda/direita no verso A4 durante alimentação manual | alto | média | Implementar os dois modos mecânicos (`short-edge` e `long-edge`) e as duas ordens de bandeja (`normal` e `invertida`), validados por testes matemáticos e pela Folha de Calibração A4 de 2 páginas. |
| Corte de bordas por margem física não imprimível de impressoras A4 domésticas | médio | média | Oferecer opção de escala segura (`96%`) centralizada em cada metade A5, mantendo a linha de corte exatamente em `148,5 mm`. |

## 10. Critério de pronto

- [ ] Todas as ações do `actions.md` marcadas `[X]`
- [ ] `cross-check.md` sem CRITICAL nem HIGH
- [ ] `regression-watch.md` gerado
- [ ] Suíte `pnpm test`, `pnpm exec astro check` e `pnpm build` passando integralmente

## 11. Histórico de alterações

| Data | Alteração | Autor |
|------|-----------|-------|
| 2026-11-11 | Versão inicial gerada por `/reversa-plan` | reversa |

