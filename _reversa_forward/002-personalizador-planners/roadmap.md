# Roadmap: Personalizador de Planners (Planner Essencial)

> Identificador: `002-personalizador-planners`  
> Data: `2026-11-11`  
> Requirements: `_reversa_forward/002-personalizador-planners/requirements.md`  
> Confidência: 🟢 CONFIRMADO, 🟡 INFERIDO, 🔴 LACUNA

## 1. Resumo da abordagem

Implementar a família comercial **Planners** no 678 Estudio mantendo a organização aprovada de três famílias na Papelaria Personalizada (Agendas, Planners e Cadernos Personalizados):
1. **Interface Pública e Reatividade**: Criar a rota `/personalizar/planner` com o formulário do modelo interno **Planner Essencial**, suportando modalidade datada/não datada, seleção de ano, três estilos visuais (Clássico, Comercial, Feminino), paleta de cores, tipografia, nome e upload de logotipo.
2. **Motor Typst Especializado**: Desenvolver `src/server/planner/typst/essencial.typ` em formato A5 com calhas e margens espelhadas para encadernação, estruturando exatamente as 8 seções funcionais, destacando-se o planejamento semanal em duas páginas A5 verticais consecutivas (abertura de 2 páginas ao encadernar) e controle financeiro completo com campos práticos de preenchimento.
3. **Módulo de Calendário Matemático**: Criar `src/server/planner/calendar.ts` com funções puras para calcular transições contínuas de semanas, dias do ano, meses e anos bissextos (para a versão datada) e grids estruturados abertos (para a versão não datada).
4. **Prévias Reais**: Implementar `/api/planner/preview` para compilação instantânea em Typst de páginas reais de cada uma das 8 seções para a galeria do personalizador.
5. **Persistência Padronizada**: Criar tabelas `planner_quotes` e `planner_quote_assets` espelhando a arquitetura relacional de `agenda_quotes`, com JSON validado, versionamento e endpoint `/api/planner/quote`, integrando com a geração de links para WhatsApp e visualização/regeneração do PDF A5 completo no painel administrativo `/admin/planners/[id]`.
6. **Ativação no Catálogo**: Habilitar a família `'family-planners'` em `src/data/stationery.ts` (`available: true`).

## 2. Princípios aplicados

| Princípio | Como a feature se relaciona | Status |
|---|---|:---:|
| I. Não-Destrutivo | Preserva 100% dos personalizadores de canecas, quadros e agendas clássicas (`v1` e `v2`) | Respeita 🟢 |
| II. Reutilização de Infraestrutura | Aproveita o motor Typst nativo no contêiner, SQLite LibSQL, Astro SSR e fluxo WhatsApp | Respeita 🟢 |
| III. Isolamento de Domínio | Mantém o código do Planner em pasta própria (`src/server/planner/`), evitando acoplamento espaguete com as agendas | Respeita 🟢 |
| IV. Fidelidade Visual WYSIWYG | As prévias são páginas reais geradas pelo mesmo arquivo Typst que compila o PDF de produção | Respeita 🟢 |

## 3. Decisões técnicas

| ID | Decisão | Justificativa | Alternativas descartadas | Confidência |
|---|---|---|---|:---:|
| D-01 | Template Typst Exclusivo (`src/server/planner/typst/`) | O Planner possui diagramação, páginas de hábitos, tabelas financeiras e densidade visual próprias que não existem na Agenda Clássica. | Adaptar a agenda existente com condicionais (descartado por alto risco de quebra e acoplamento). | 🟢 |
| D-02 | Estrutura Relacional Padronizada `planner_quotes` + Assets | Reutiliza a arquitetura já consolidada no projeto (UUID, draft_token, status, config_version, config_json e tabela de assets), garantindo integridade e facilidade de backup. | Misturar colunas na tabela de agendas ou salvar em JSON avulso sem integridade referencial. | 🟢 |
| D-03 | Semana em Duas Páginas A5 Verticais Consecutivas | Cria uma abertura ergonômica de 2 páginas ao encadernar, com margens espelhadas e calha (gutter). | Página única A4 horizontal (proibida expressamente pelo escopo). | 🟢 |
| D-04 | Cálculo Puro de Datas em TypeScript | Cobertura de 100% de testes unitários com Vitest para matrizes de calendário, anos bissextos e transições de mês. | Dependência de bibliotecas externas pesadas (descartado). | 🟢 |

## 4. Premissas

Nenhuma premissa pendente de dúvida (`[DÚVIDA]` = 0).

## 5. Delta arquitetural

| Componente | Tipo de Mudança | Descrição |
|---|---|---|
| `src/server/planner/` | Módulo Novo | Contém `options.mjs`, `calendar.ts`, `essencial.mjs`, `quoteConfig.ts` e templates Typst em `typst/essencial.typ` |
| `src/pages/personalizar/planner.astro` | Arquivo Novo | Interface pública do personalizador de Planners |
| `src/scripts/plannerCustomizer.ts` | Arquivo Novo | Script cliente de interação, seleção de seções e envio de formulário |
| `src/pages/api/planner/preview.ts` | Endpoint Novo | Compilação de prévias de páginas em SVG/PNG |
| `src/pages/api/planner/quote.ts` | Endpoint Novo | Persistência de orçamento e criação do link de WhatsApp |
| `src/db/plannerQuotes.ts` | Módulo Novo | Repositório SQLite para `planner_quotes` e assets |
| `src/db/database.ts` | Modificação Aditiva | Criação das tabelas `planner_quotes` e `planner_quote_assets` |
| `src/pages/admin/planners/[id]/index.astro` | Arquivo Novo | Rota administrativa para visualização do pedido e download do PDF |
| `src/data/stationery.ts` | Modificação Aditiva | Mudança de `available: false` para `available: true` na chave `family-planners` |
| Módulos de Canecas, Quadros e Agendas | Intocados | Zero impacto ou quebra regressiva |

## 6. Delta de dados

Tabelas a serem criadas no SQLite:

```sql
CREATE TABLE IF NOT EXISTS planner_quotes (
  id TEXT PRIMARY KEY,
  draft_token TEXT NOT NULL UNIQUE,
  product TEXT NOT NULL,
  created_at TEXT NOT NULL,
  status TEXT NOT NULL,
  config_version INTEGER NOT NULL,
  config_json TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS planner_quote_assets (
  quote_id TEXT NOT NULL REFERENCES planner_quotes(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  mime TEXT NOT NULL,
  content BLOB NOT NULL,
  PRIMARY KEY (quote_id, name)
);
```

## 7. Critérios de pronto

- [ ] Vitrine na categoria Papelaria Personalizada exibe exatamente Agendas, Planners e Cadernos Personalizados.
- [ ] Card Planners abre `/personalizar/planner`.
- [ ] Personalizador carrega opções: Planner Essencial, datado/não datado, ano, estilos (Clássico, Comercial, Feminino), cores e logo.
- [ ] Motor Typst compila o PDF A5 completo com as 8 seções obrigatórias (semana em duas páginas A5 verticais e finanças completas).
- [ ] Galeria exibe páginas reais renderizadas pelo Typst para cada seção.
- [ ] Solicitação de orçamento persiste o pedido em `planner_quotes` e gera a mensagem do WhatsApp.
- [ ] Painel administrativo recupera o pedido e permite baixar o PDF completo para produção.
- [ ] Suíte de testes unitários Vitest cobre calendários, anos bissextos e endpoints.
- [ ] Astro Check e build de produção executam com zero erros.
