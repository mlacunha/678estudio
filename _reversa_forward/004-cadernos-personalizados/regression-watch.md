# Regression Watch: `004-cadernos-personalizados`

> Data: `2026-11-12`
> Fase: `/reversa-coding`

## Invariantes Monitorados

- **`W001` — Agendas Personalizadas (`001` e `003`):**
  - `daily-1dpp` (`400` págs A5), `daily-2dpp` (`222` págs A5), `weekly` (`90` págs A5).
  - Cadastro de Contatos com 36 registros (4 páginas A5 × 9 contatos/página).
- **`W002` — Planner Essencial (`002`):**
  - Modalidades Datada e Permanente com `184` páginas A5 (`46` folhas A4 Cut & Stack).
- **`W003` — Cadernos Personalizados (`004`):**
  - `caderno-receitas`: `140` páginas A5 (`70` folhas A5 = `35` folhas A4 Cut & Stack), com fichas verticais de 2 subcolunas de Ingredientes no topo e Modo de Preparo em largura total abaixo.
  - `diario-pessoal`: `160` páginas A5 não datadas (`80` folhas A5 = `40` folhas A4 Cut & Stack).
  - `livro-memorias`: `120` páginas A5 (`60` folhas A5 = `30` folhas A4 Cut & Stack), com 52 aberturas duplas iniciando rigorosamente em páginas pares (`6..108`) à esquerda e páginas ímpares (`7..109`) à direita.
- **`W004` — Motor de Backup (`engine.py`):**
  - Validação de integridade aceitando tanto backups anteriores quanto bancos com `planner_quotes`, `planner_quote_assets`, `notebook_quotes` e `notebook_quote_assets`.
