# Legacy Impact Report: `004-cadernos-personalizados`

> Data: `2026-11-12`
> Fase: `/reversa-coding`

## Arquivos Legados Modificados

| Arquivo | Tipo de Alteração | Impacto em Funcionalidades Existentes |
|---------|-------------------|---------------------------------------|
| `src/data/stationery.ts` | Ativação de `'family-cadernos'` (`available: true`, `route: '/personalizar/caderno'`) | Preserva intactas `'family-agendas'` e `'family-planners'`. |
| `src/db/database.ts` | Adição das tabelas `notebook_quotes` e `notebook_quote_assets` + migração `stationery-notebooks-v1` | Aditivo e idempotente (`CREATE TABLE IF NOT EXISTS`). |
| `src/server/backup/engine.py` | Adição de `OPTIONAL_SCHEMA` (`planner_quotes`, `planner_quote_assets`, `notebook_quotes`, `notebook_quote_assets`) | Compatível com backups antigos e novos. |
| `src/server/backup/test_engine.py` | Ampliação do teste de migração com tabelas de planners e cadernos | Garante restauração completa de todos os produtos de papelaria. |
| `src/pages/admin/index.astro` | Adição do botão `"Solicitações de cadernos"` (`/admin/cadernos`) | Nenhuma alteração nas rotas ou formulários existentes. |
| `Dockerfile` | Adição de `COPY --from=build /app/src/server/caderno ./src/server/caderno` | Preserva estágios multi-arch e binário Typst `v0.15.1`. |

