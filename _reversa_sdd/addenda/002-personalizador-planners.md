# Adendo: Personalizador de Planners (Planner Essencial)

> Identificador: `002-personalizador-planners`  
> Data: `2026-11-11`  
> Cenário: `legado`

## Vigência

Vigente desde 2026-11-11.

## Resumo da entrega

Implementação completa do personalizador e gerador do **Planner Essencial**, modelo inaugural da família comercial **Planners** do 678 Estudio. A entrega atende integralmente à arquitetura existente e às regras comerciais estabelecidas:

1. **Organização Comercial Preservada:** A vitrine de Papelaria Personalizada mantém exatamente três cards principais: *Agendas*, *Planners* e *Cadernos Personalizados*. O card *Planners* direciona para `/personalizar/planner` ativando o modelo inicial *Planner Essencial*, sem alterar a taxonomia comercial.
2. **Template Typst A5 Especializado:** Criação de biblioteca modular (`planner-sections.typ`) e template principal (`essencial.typ`) em formato A5 com calha de encadernação de 10 mm e margens espelhadas. A seção semanal é gerada em duas páginas A5 consecutivas formando uma abertura encadernada (não uma folha A4 horizontal). A paginação total é calibrada em exatamente 184 páginas (92 folhas A5 frente e verso), correspondendo a 46 cadernos gráficos fechados (múltiplo de 4) sem páginas avulsas.
3. **Seções Funcionais, Aproveitamento Integral A5 e Cobertura Anual:** Implementação das 8 seções reais com aproveitamento otimizado da área útil vertical A5 (180 mm): Abertura & Identificação (com destaque para logomarca do cliente e campos expandidos), Planejamento Anual (visão macro com 6 linhas por quadrante, entregas trimestrais e metas estratégicas com checklist), Planejamento Mensal (6 prioridades, 8 compromissos, foco, projetos e plano de ação em duas colunas), Planejamento Semanal (53 semanas reais cobrindo todos os 365/366 dias em edições datadas e 52 semanas na edição não datada, com 4–5 linhas por dia, prioridades e checklist de 10 tarefas semanais), Controle de Hábitos (12 linhas de hábitos incluindo 4 hábitos livres + rotinas matinal/noturna e avaliação), Controle Financeiro completo em página dupla (Receitas, Despesas Fixas e Vencimentos à esquerda; Despesas Variáveis, Metas Financeiras e Resumo Mensal à direita, ambos com linhas livres para lançamentos personalizados), Revisão Mensal (4 blocos de 5 linhas) e Anotações (25 linhas pontilhadas por página).
4. **Modalidades, Estilos Visuais, Cores Personalizadas e Modernização Tipográfica:** Suporte unificado a edições datadas e atemporais, disponíveis nos estilos visuais Clássico, Comercial e Feminino, com seleção independente de cores personalizadas (`primary` e `secondary` validadas por contraste de luminância ≥ 3:1 no papel) e três famílias tipográficas oficiais licenciadas (SIL Open Font License) empacotadas em `src/server/planner/typst/fonts/`:
   - **Moderna:** Inter (proporções neutras e excelente legibilidade em A5).
   - **Geométrica:** Manrope (traços geométricos contemporâneos e equilíbrio tabular).
   - **Editorial:** DM Serif Display nos títulos e DM Sans nos subtítulos, corpo e tabelas financeiras/hábitos.
5. **Logomarca na Abertura, Marca-d’água no Miolo e Prévias Reais:** Upload validado e normalizado via Sharp (`PNG`/`JPEG` até 2 MB e 4 MP), exibindo a logomarca em cores originais na página de abertura (Página 1), no rodapé das páginas internas e, quando ativada a opção de marca-d’água, aplicada com opacidade suave (~12%) ao fundo de todas as seções do miolo (Páginas 2 a 184) e nas respectivas prévias PNG.
6. **Persistência Relacional, Navegação Administrativa e Referência Pública:** Tabelas SQLite idempotentes `planner_quotes` e `planner_quote_assets` armazenando configuração JSON auditada, ativos binários (`original`, `logo` e 8 prévias), atalho direto `Solicitações de planners` no cabeçalho de `/admin`, página pública de referência `/planner/orcamento/[id]` e regeneração determinística do PDF A5 de 184 páginas em `/admin/planners/[id]`.

Todas as ações do plano foram concluídas com aprovação total da suíte de testes Vitest (19 arquivos, 120 testes aprovados), diagnóstico estático Astro/TypeScript limpo (0 erros, 0 avisos) e build de produção executado com sucesso.

## Impacto por artefato da extração

| Artefato | Seção | Tipo de impacto | Delta |
|---|---|---|---|
| `_reversa_sdd/architecture.md` | Papelaria Personalizada / Módulos de Servidor | `componente-novo` | Adição do motor `src/server/planner/` (`options.mjs`, `quoteConfig.ts`, `calendar.ts`, `essencial.mjs`, `drafts.ts` e templates Typst em `src/server/planner/typst/`). |
| `_reversa_sdd/architecture.md` | Rotas Públicas & Endpoints | `rota-nova` | Adição da página pública `/personalizar/planner`, dos endpoints de API `/api/planner/preview` e `/api/planner/quote`, e das rotas administrativas `/admin/planners`, `/admin/planners/[id]` e endpoints de download. |
| `_reversa_sdd/architecture.md` | Banco de Dados & Armazenamento | `tabela-nova` | Schema SQLite estendido de forma idempotente em `src/db/database.ts` com `planner_quotes` e `planner_quote_assets` indexadas por `draft_token`. |
| `_reversa_sdd/domain.md` | Papelaria Personalizada / Catálogo | `regra-atualizada` | A família `'family-planners'` em `src/data/stationery.ts` tem status ativo (`available: true`), referenciando o modelo `'planner-essencial'`. |

## Regras sob vigilância

- **Watch Items Ativos:** Monitoramento contínuo da integridade das três famílias em `stationery.ts`, renderização A5 frente/verso e integridade do backup SQLite documentados em [`_reversa_forward/002-personalizador-planners/regression-watch.md`](file:///d:/Projetos/site678Estudio/_reversa_forward/002-personalizador-planners/regression-watch.md).

## Fontes

- `_reversa_forward/002-personalizador-planners/requirements.md`
- `_reversa_forward/002-personalizador-planners/roadmap.md`
- `_reversa_forward/002-personalizador-planners/investigation.md`
- `_reversa_forward/002-personalizador-planners/data-delta.md`
- `_reversa_forward/002-personalizador-planners/legacy-impact.md`
- `_reversa_forward/002-personalizador-planners/regression-watch.md`
- `_reversa_forward/002-personalizador-planners/actions.md`
- `_reversa_forward/002-personalizador-planners/progress.jsonl`

