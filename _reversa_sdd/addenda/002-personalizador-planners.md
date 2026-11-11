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
3. **Seções Funcionais e Cobertura Anual Integral:** Implementação das 8 seções reais: Abertura & Identificação, Planejamento Anual (visão 12 meses e metas estratégicas viradas), Planejamento Mensal, Planejamento Semanal (53 semanas reais cobrindo todos os 365/366 dias em edições datadas com datas impressas; 52 semanas estruturadas na edição não datada), Controle de Hábitos (habit tracker de 31 dias integrado ao mês), Controle Financeiro completo em página dupla (Receitas/Fixas à esquerda e Variáveis/Metas à direita com amplo espaço de preenchimento manual), Revisão Mensal e Anotações.
4. **Modalidades, Estilos Visuais e Modernização Tipográfica:** Suporte unificado a edições datadas (com calendário matemático real e anos bissextos) e atemporais/não datadas (para preenchimento manual guiado), disponíveis nos estilos visuais Clássico, Comercial e Feminino. Incorporação independente de três famílias tipográficas oficiais licenciadas (SIL Open Font License) empacotadas no repositório (`src/server/planner/typst/fonts/`) para independência de SO e compatibilidade total em contêineres Docker (AMD64 e ARM64):
   - **Moderna:** Inter (proporções neutras e excelente legibilidade em A5).
   - **Geométrica:** Manrope (traços geométricos contemporâneos e equilíbrio tabular).
   - **Editorial:** DM Serif Display nos títulos e DM Sans nos subtítulos, corpo e tabelas financeiras/hábitos.
   A tipografia é configurável no personalizador público, persistida na cotação SQLite e reproduzida fielmente na regeneração administrativa, eliminando 100% de qualquer fallback para Libertinus Serif.
5. **Prévias Reais e Desempenho:** Compilação Typst direcionada por seção (`section=<id>`) gerando páginas reais em PNG em <200ms com galeria responsiva e modal de zoom 150%.
6. **Persistência Relacional e Produção:** Tabelas SQLite idempotentes `planner_quotes` e `planner_quote_assets` armazenando configuração JSON auditada, ativos binários (logo e prévias) e permitindo regeneração determinística do PDF de produção A5 pelo painel administrativo (`/admin/planners/[id]`).

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

