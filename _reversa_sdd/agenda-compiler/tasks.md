# Motor de Diagramação de Agendas — Tarefas de Implementação

> Tarefas executáveis para reproduzir a unit `agenda-compiler` a partir do legado.

## Pré-requisitos
- [x] Binário `typst` instalado e detectável no PATH ou na variável `TYPST_BINARY`
- [x] Fontes tipográficas e templates Typst em `src/server/agenda/typst/`

## Tarefas
- [x] **T-01**: Implementar wrapper do subprocesso Typst e validações de cores em `classic.mjs`.
  - Origem no legado: [`src/server/agenda/classic.mjs:29-92`](file:///d:/Projetos/site678Estudio/src/server/agenda/classic.mjs#L29-L92)
  - Critério de pronto: Função `compileClassicAgenda` compila buffers PDF e PNG com timeout. 🟢
- [x] **T-02**: Criar lógica de seleção de páginas de prévia em `agendaPreviewSections`.
  - Origem no legado: [`src/server/agenda/classic.mjs:11-23`](file:///d:/Projetos/site678Estudio/src/server/agenda/classic.mjs#L11-L23)
  - Critério de pronto: Identifica as 8 páginas mais relevantes conforme o layout da agenda. 🟢
- [x] **T-03**: Implementar persistência de rascunhos e ativos em `drafts.ts` e `database.ts`.
  - Origem no legado: [`src/server/agenda/drafts.ts`](file:///d:/Projetos/site678Estudio/src/server/agenda/drafts.ts)
  - Critério de pronto: Salva cotação e ativos PNG em `agenda_quotes` e `agenda_quote_assets`. 🟢
- [x] **T-04**: Criar endpoints REST de prévia e solicitação de orçamento.
  - Origem no legado: [`src/pages/api/agenda/preview.ts`](file:///d:/Projetos/site678Estudio/src/pages/api/agenda/preview.ts), [`src/pages/api/agenda/quote.ts`](file:///d:/Projetos/site678Estudio/src/pages/api/agenda/quote.ts)
  - Critério de pronto: Retorna status 200/201 com links operacionais. 🟢

## Tarefas de Teste
- [x] **TT-01**: Teste unitário da função de contraste de cores `isAgendaColor`.
- [x] **TT-02**: Teste de compilação de prévia Typst com mock do executável.

