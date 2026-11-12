# Roadmap: Cadernos Personalizados (Receitas, Diário Pessoal e Livro de Memórias)

> Identificador: `004-cadernos-personalizados`
> Data: `2026-11-12`
> Requirements: `_reversa_forward/004-cadernos-personalizados/requirements.md`
> Confidência: 🟢 CONFIRMADO, 🟡 INFERIDO, 🔴 LACUNA

## 1. Resumo da abordagem

A implementação de `004-cadernos-personalizados` estrutura-se em um único módulo de servidor (`src/server/caderno/`) e um único fluxo público (`/personalizar/caderno`) que atende aos três modelos temáticos (**Caderno de Receitas** com 140 páginas A5, **Diário Pessoal** não datado com 160 páginas A5 e **Livro de Memórias** com 120 páginas A5). Os templates Typst compartilham cabeçalhos, rodapés, margens espelhadas A5 (`inside: 18mm`, `outside: 12mm`), fontes licenciadas, marca-d’água opcional e a Página Institucional final do **678 Estudio** (`studio-colophon`), delegando as seções específicas para `receitas.typ`, `diario.typ` e `memorias.typ`. A persistência utiliza duas novas tabelas SQLite (`notebook_quotes` e `notebook_quote_assets`), e a produção administrativa (`/admin/cadernos/[id]/pdf`) reutiliza diretamente o módulo `src/server/print/a4Imposition.ts` e o painel `AdminA4PrintPanel.astro` para gerar os arquivos A4 Cut & Stack (`35`, `40` e `30` folhas A4 exatas, sem páginas em branco).

## 2. Princípios aplicados

| Princípio | Como a feature se relaciona | Status |
|-----------|------------------------------|--------|
| I. Preservação dos 3 Cards de Papelaria | Ativa o card existente `family-cadernos` em `src/data/stationery.ts` sem criar cards adicionais para cada modelo. | respeita |
| II. Reutilização de Infraestrutura | Reaproveita `normalizeAgendaLogo`, `readBoundedForm`, `isAgendaColor`, `getStudioSettings`, `buildWhatsAppLink`, `a4Imposition.ts` e `AdminA4PrintPanel.astro`. | respeita |
| III. Paridade Editorial e Cut & Stack A4 | Garante páginas totais múltiplas de 4 (`140`, `160`, `120`) e posiciona todas as 52 aberturas duplas do Livro de Memórias em pares `(página par = esquerda, página ímpar = direita)` de `6` a `109`. | respeita |
| IV. Execução Determinística Offline em Container | Reutiliza o diretório de fontes embarcadas e copia `src/server/caderno` para o estágio `runtime` do `Dockerfile` (`linux/amd64` e `linux/arm64`). | respeita |

## 3. Decisões técnicas

| ID | Decisão | Justificativa | Alternativas descartadas | Confidência |
|----|---------|----------------|--------------------------|-------------|
| D-01 | Unificar os três modelos em um único compilador `src/server/caderno/compiler.mjs` e entrypoint `src/server/caderno/typst/caderno.typ` parametrizado por `model` (`caderno-receitas`, `diario-pessoal`, `livro-memorias`) e `section` (`all` ou ID da seção de prévia) (RF-02, RF-03, RF-04, RF-05). | Evita triplicar código de invocação Typst, workspace temporário de logo e tratamento de erros, além de permitir renderizar cada uma das 6 prévias PNG em `< 200ms`. | Criar três compiladores e três rotas públicas independentes. | 🟢 |
| D-02 | Adotar na ficha estruturada do **Caderno de Receitas** (`receitas.typ`, págs. 7 a 126) a **organização vertical com subcolunas amplas**: cabeçalho com Nome/Tempo/Rendimento/Categoria, bloco superior de **Ingredientes** em duas subcolunas de `57 mm` cada (`14 itens` com linhas largas para quantidades e nomes), bloco central de **Modo de Preparo** em largura integral de `118 mm` (`10 linhas` numeradas/pautadas de `6,2 mm`) e rodapé de **Observações e Dicas** em largura integral (`3 linhas`) (RN-02, RF-03). | Como demonstrado em `investigation.md`, uma coluna lateral de `38%` em A5 teria apenas `~43 mm` (insuficiente para escrever ingredientes à mão); já o arranjo vertical oferece `57 mm` por subcoluna de ingrediente e `118 mm` inteiros para cada passo do modo de preparo, preservando 120 fichas em 140 páginas. | Coluna lateral estreita de `38%` para ingredientes, que espremeria a caligrafia manual. | 🟢 |
| D-03 | Estruturar o **Livro de Memórias** (`memorias.typ`, 120 págs.) com 5 páginas preliminares — Pág. 1 (ímpar): Apresentação; Pág. 2 (par): Dedicatória; Pág. 3 (ímpar): Guia Afetivo & Cápsula do Tempo; Págs. 4 e 5 (par-ímpar): Sumário de 52 Momentos em abertura dupla — para que as **52 aberturas duplas de acontecimentos** iniciem exatamente na **página par `6` (esquerda: fotografia, data, local, participantes)** e **página ímpar `7` (direita: relato e recordações)** até as páginas `108` e `109`, seguidas de 10 páginas de Recordações Especiais (`110..119`) e Página Institucional na página par `120` (RN-04, RF-05). | Corrige a paridade de caderno aberto: em encadernação A5 onde a página 1 é frente (direita), toda página par cai no verso (esquerda) e a página ímpar seguinte cai na frente (direita), garantindo visualização simultânea de foto + relato nas 52 aberturas. | Iniciar acontecimentos na página 5 (ímpar/direita), o que quebraria a abertura dupla ao virar a folha. | 🟢 |
| D-04 | Estruturar o **Diário Pessoal** (`diario.typ`, 160 págs.) de forma 100% não datada: Pág. 1 de abertura/proprietário, Pág. 2 de intenções, Págs. 3 a 150 (148 págs.) de escrita livre pautada (`21 linhas` de `6,6 mm` + cabeçalho de data aberta + caixa de reflexão de `3 linhas`), Págs. 151 a 159 (9 págs.) de citações/pensamentos e Pág. 160 institucional (RN-03, RF-04). | Mantém a identidade de diário íntimo atemporal (40 folhas A4 exatas em Cut & Stack), sem grades de agenda ou planner. | Incluir calendários ou metas mensais que descaracterizariam o diário. | 🟢 |
| D-05 | Criar as tabelas `notebook_quotes` e `notebook_quote_assets` em `src/db/database.ts` e o repositório `src/db/notebookQuotes.ts`, além da migração `stationery-notebooks-v1` que atualiza a descrição do card `family-cadernos` (RF-01, RF-06, RF-07). | Mantém isolamento limpo de domínio e compatibilidade integral com o motor de backup SQLite existente. | Misturar pedidos de cadernos na tabela `planner_quotes`. | 🟢 |
| D-06 | Integrar `/admin/cadernos/[id]` e `/admin/cadernos/[id]/pdf` com `AdminA4PrintPanel.astro` e `renderSelectedA4Output` (`src/server/print/a4Imposition.ts`) (RN-06, RF-08). | Fornece imediatamente PDF A5 original, PDF A4 Frentes, PDF A4 Versos e Folha de Calibração A4 sem duplicar lógica de imposição. | Implementar rotina separada de imposição para cadernos. | 🟢 |

## 4. Premissas

Nenhuma premissa pendente de `[DÚVIDA]` (0 marcadores `[DÚVIDA]` em `requirements.md`).

## 5. Delta arquitetural

| Componente | Arquivo de origem no legado | Tipo de mudança | Resumo |
|------------|------------------------------|-----------------|--------|
| `catalog` | `_reversa_sdd/architecture.md#3.1 Matriz de Componentes` (`src/data/stationery.ts`) | regra-alterada | Ativa `family-cadernos` (`available: true`) apontando para `/personalizar/caderno` com os 3 modelos. |
| `notebook-compiler` | `_reversa_sdd/architecture.md#3.1 Matriz de Componentes` (`src/server/caderno/*`) | componente-novo | Novo motor Typst A5 compartilhado para `caderno-receitas` (140 págs.), `diario-pessoal` (160 págs.) e `livro-memorias` (120 págs.) + 6 prévias por modelo. |
| `database` | `_reversa_sdd/architecture.md#3.1 Matriz de Componentes` (`src/db/database.ts`, `src/db/notebookQuotes.ts`) | contrato-novo | Novas tabelas `notebook_quotes` e `notebook_quote_assets` e migração `stationery-notebooks-v1`. |
| `public-site` | `_reversa_sdd/architecture.md#3.1 Matriz de Componentes` (`src/pages/personalizar/caderno.astro`, `/api/caderno/*`, `/caderno/orcamento/[id]*`) | contrato-novo | Personalizador público compartilhado, APIs de prévia/orçamento e página pública de referência. |
| `admin` | `_reversa_sdd/architecture.md#3.1 Matriz de Componentes` (`src/pages/admin/cadernos/*`, `src/pages/admin/index.astro`) | contrato-novo | Listagem administrativa, página de produção com `AdminA4PrintPanel.astro` e geração de PDFs A5 e A4 Cut & Stack. |

## 6. Delta no modelo de dados

- Resumo das mudanças: Adição idempotente das tabelas `notebook_quotes` e `notebook_quote_assets` em `src/db/database.ts` e migração transacional `stationery-notebooks-v1` atualizando a descrição pública do produto `family-cadernos`.
- Detalhe completo em: `_reversa_forward/004-cadernos-personalizados/data-delta.md`

## 7. Delta de contratos externos

| Contrato | Tipo | Arquivo de detalhe |
|----------|------|--------------------|
| Endpoints públicos e administrativos de Cadernos Personalizados | HTTP | `_reversa_forward/004-cadernos-personalizados/interfaces/caderno-endpoints.md` |

## 8. Plano de migração

1. Em `src/db/database.ts`, criar idempotentemente `notebook_quotes`, `notebook_quote_assets` e o índice `notebook_quotes_created`.
2. Em `migrateStationery` (`src/db/database.ts`), aplicar a migração versionada `stationery-notebooks-v1` em `schema_migrations` para atualizar a descrição do produto `family-cadernos` na tabela `products`.
3. Em `Dockerfile`, adicionar `COPY --from=build /app/src/server/caderno ./src/server/caderno` no estágio `runtime` para disponibilizar os templates Typst de cadernos em produção.

## 9. Riscos e mitigações

| Risco | Impacto | Probabilidade | Mitigação |
|-------|---------|---------------|-----------|
| Quebra de paridade nas 52 aberturas duplas do Livro de Memórias se uma seção preliminar ocupar mais de 1 página A5 | alto | baixa | Delimitar cada página com `#pagebreak()` explícito e validar em teste automatizado o texto extraído/estrutura de cada par `(2k, 2k+1)` de `6` a `109` e o total exato de `120` páginas. |
| Espaço insuficiente para escrita manual de ingredientes na ficha do Caderno de Receitas | médio | baixa | Adotar a disposição vertical com duas subcolunas de `57 mm` para ingredientes no topo e `118 mm` de largura total para Modo de Preparo abaixo, validando com amostra visual e testes de paginação (`140` páginas exatas). |
| Ausência de fontes ou templates de cadernos na imagem Docker de produção | alto | baixa | Apontar `--font-path` para `src/server/planner/typst/fonts` (já copiado no `Dockerfile`) e incluir `COPY --from=build /app/src/server/caderno ./src/server/caderno` no `Dockerfile`. |

## 10. Critério de pronto

- [ ] Todas as ações do `actions.md` marcadas `[X]`
- [ ] `cross-check.md` (se executado) sem CRITICAL nem HIGH
- [ ] `regression-watch.md` gerado
- [ ] Suíte de testes (`AGENDA_TYPST_TEST=1 pnpm test`), `pnpm exec astro check` e `pnpm build` 100% aprovados

## 11. Histórico de alterações

| Data | Alteração | Autor |
|------|-----------|-------|
| 2026-11-12 | Versão inicial gerada por `/reversa-plan` | reversa |

