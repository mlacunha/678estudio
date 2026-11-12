# Cross-Check Audit: Cadernos Personalizados (Receitas, Diário Pessoal e Livro de Memórias)

> Identificador: `004-cadernos-personalizados`
> Data: `2026-11-12`
> Artefatos analisados:
> - [`requirements.md`](../requirements.md)
> - [`roadmap.md`](../roadmap.md)
> - [`actions.md`](../actions.md)

## 1. Resumo de Findings por Severidade

| Severidade | Quantidade |
|------------|------------|
| CRITICAL | 0 |
| HIGH | 0 |
| MEDIUM | 2 |
| LOW | 1 |
| **Total** | **3** |

**Veredito da Auditoria:** **APROVADO** (`0 CRITICAL`, `0 HIGH` — pronta para `/reversa-coding`).

---

## 2. Tabela de Findings

| ID | Severidade | Eixo | Descrição | Onde está |
|----|------------|------|-----------|-----------|
| A001 | MEDIUM | Consistência dos templates Typst / Docker | O Typst CLI restringe `#image(...)` a caminhos dentro de `--root` (`src/server/caderno/typst`). Portanto, ao implementar `T006` (`shared.typ`), o arquivo `brand-678.png` deve ser copiado para `src/server/caderno/typst/brand-678.png` (enquanto `--font-path` pode apontar para `src/server/planner/typst/fonts`). | `actions.md#T006`, `roadmap.md#9. Riscos e mitigações` |
| A002 | MEDIUM | Coerência com o legado (Backup SQLite) | Em `src/server/backup/engine.py` (linha 178), `verify_database()` verifica `set(SCHEMA) <= tables <= set(SCHEMA) | {"schema_migrations"}`. Ao criar `notebook_quotes` e `notebook_quote_assets` em `T003`, convém registrar as tabelas de solicitações (`planner_quotes`, `planner_quote_assets`, `notebook_quotes`, `notebook_quote_assets`) como tabelas opcionais permitidas em `engine.py` para manter 100% de compatibilidade com o backup/restauração. | `actions.md#T003`, `src/server/backup/engine.py` |
| A003 | LOW | Cobertura de testes de integração | Em `T014` (`src/server/caderno/compiler.test.ts`), além de testar a compilação A5 dos 3 modelos, a paridade das 52 aberturas do Livro de Memórias e a imposição A4, convém exercitar no mesmo arquivo os handlers `POST /api/caderno/preview`, `POST /api/caderno/quote` e `GET /admin/cadernos/[id]/pdf` para validar o fluxo ponta a ponta. | `actions.md#T014` |

---

## 3. Itens Verificados e Aprovados por Eixo

### 3.1. Eixo 1 — Cobertura (`requirements.md` ↔ `roadmap.md` ↔ `actions.md`)
- [x] **RF-01 (Ativação do card `family-cadernos` mantendo 3 cards em Papelaria):** Coberto por `RN-01`, `D-05` e `T003`/`T004`.
- [x] **RF-02 (Personalizador único `/personalizar/caderno`):** Coberto por `RN-05`, `D-01` e `T001`/`T012`.
- [x] **RF-03 (Caderno de Receitas — 140 páginas A5, 120 fichas com layout vertical otimizado para escrita manual):** Coberto por `RN-02`, `D-02`, `investigation.md#2` e `T007`.
- [x] **RF-04 (Diário Pessoal não datado — 160 páginas A5):** Coberto por `RN-03`, `D-04`, `investigation.md#3` e `T008`.
- [x] **RF-05 (Livro de Memórias — 120 páginas A5, 52 aberturas duplas em páginas pares `6..108` à esquerda e ímpares `7..109` à direita + teste automatizado de paridade):** Coberto por `RN-04`, `D-03`, `investigation.md#1` e `T009`/`T014`.
- [x] **RF-06 (6 prévias PNG reais, rascunho temporário, persistência SQLite, link WhatsApp e página `/caderno/orcamento/[id]`):** Coberto por `RN-06`, `D-01`, `D-05` e `T002`/`T003`/`T011`.
- [x] **RF-07 (Painel administrativo `/admin/cadernos` e `/admin/cadernos/[id]`):** Coberto por `RN-06`, `D-06` e `T013`.
- [x] **RF-08 (Integração administrativa com `src/server/print/a4Imposition.ts` — PDF A5 original, PDF A4 Frentes, PDF A4 Versos e Calibração):** Coberto por `RN-06`, `D-06` e `T013`/`T014`.
- [x] **Todos os 4 cenários Gherkin** possuem ações de implementação e verificação correspondentes (`T005`, `T011`, `T013`, `T014`).

### 3.2. Eixo 2 — Consistência Terminológica e de Contratos
- [x] Os identificadores dos três modelos (`caderno-receitas`, `diario-pessoal`, `livro-memorias`) e suas contagens de páginas (`140`, `160`, `120` páginas A5 = `35`, `40`, `30` folhas A4 Cut & Stack) são idênticos em `requirements.md`, `roadmap.md`, `investigation.md`, `data-delta.md`, `interfaces/caderno-endpoints.md` e `actions.md`.
- [x] A matemática de paridade das 52 aberturas duplas do Livro de Memórias está consistente: Págs. 1–3 preliminares, Págs. 4–5 sumário em spread duplo `(4 par, 5 ímpar)`, **Págs. 6–109 com 52 spreads `(2i+4 par à esquerda, 2i+5 ímpar à direita)`**, Págs. 110–119 recordações (10 págs.) e Pág. 120 institucional (`1 + 1 + 1 + 2 + 104 + 10 + 1 = 120` páginas).

### 3.3. Eixo 3 — Coerência com o Legado e Infraestrutura
- [x] Reutiliza `normalizeAgendaLogo`, `readBoundedForm`, `isAgendaColor`, `getRequestStudioSettings`, `buildWhatsAppLink`, `src/server/print/a4Imposition.ts` e `src/components/admin/AdminA4PrintPanel.astro` sem duplicação.
- [x] As rotas `/admin/cadernos*` já são automaticamente protegidas pela regra `^\/(admin|api\/products|api\/upload)(\/|$)` em `src/middleware.ts`.
- [x] O `Dockerfile` copia `src/server/planner` (onde residem as fontes OFL em `src/server/planner/typst/fonts`) e, com `T013`, copiará `src/server/caderno` para o estágio `runtime` multi-arquitetura (`linux/amd64` e `linux/arm64`).

### 3.4. Eixo 4 — Sanidade do `actions.md`
- [x] Todas as dependências de `T001` a `T014` apontam para IDs válidos e anteriores, sem ciclos.
- [x] As 4 tarefas marcadas com `[//]` (`T001`, `T004`, `T005`, `T006`) atuam em arquivos distintos (`options.mjs`, `stationery.ts`, `notebookQuotes.test.ts`, `shared.typ`).

