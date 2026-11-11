# Monitoramento de Regressão: Personalizador de Planners

> Feature: `002-personalizador-planners`  
> Data: `2026-11-11`  

## Pontos Críticos Monitorados

1. **Vitrine Papelaria Personalizada:**
   - Exatamente 3 cards: Agendas (`/personalizar/agenda`), Planners (`/personalizar/planner`) e Cadernos Personalizados (em breve).
   - Card Planners abre `/personalizar/planner`.

2. **Personalizador e Motor Typst:**
   - 8 seções renderizadas em PNG: `abertura`, `anual`, `mensal`, `semanal`, `habitos`, `financeiro`, `revisao`, `anotacoes`.
   - Seção semanal em duas páginas A5 consecutivas.
   - Modalidades datada e atemporal (não datada).
   - Estilos visuais: Clássico, Comercial, Feminino.

3. **Banco de Dados SQLite:**
   - `planner_quotes` e `planner_quote_assets` criadas com sucesso sem corromper `agenda_quotes`.
   - Backup SQLite inclui as novas tabelas sem necessidade de script extra de migração.

4. **Painel Administrativo:**
   - `/admin/planners` lista os orçamentos e permite busca por UUID.
   - `/admin/planners/[id]` exibe dados e permite baixar o PDF de produção e assets.

