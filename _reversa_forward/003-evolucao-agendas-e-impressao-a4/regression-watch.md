# Regression Watch: Evolução Editorial das Agendas e Módulo Compartilhado de Impressão A4

> Identificador: `003-evolucao-agendas-e-impressao-a4`
> Data: `2026-11-11`

## 1. Watch Items Principais (Regras 🟢)

| ID | Origem (arquivo, seção) | Regra esperada após mudança | Tipo de verificação | Sinal de violação |
|----|-------------------------|-----------------------------|---------------------|-------------------|
| W001 | `_reversa_sdd/domain.md#2.4 Motor de Agendas (Typst)` | Os três layouts de Agenda (`daily-1dpp`, `daily-2dpp`, `weekly`) devem manter 12 ciclos mensais completos encerrados por Controle Financeiro Mensal, além de Contatos, Calendário `year + 1` e Página Institucional, com paginação par determinística (`400`, `222` e `90` páginas A5). | `presença` | Compilação de Agenda sem as 12 seções financeiras mensais, mistura de dias de meses distintos em `daily-2dpp`, duplicação de semanas em `weekly` ou total ímpar de páginas A5. |
| W002 | `_reversa_sdd/addenda/002-personalizador-planners.md#Resumo da entrega` | A vitrine de Papelaria Personalizada deve manter estritamente três cards de família (`Agendas`, `Planners` e `Cadernos Personalizados`). | `presença` | Alteração na contagem de famílias em `src/data/stationery.ts`. |
| W003 | `_reversa_sdd/architecture.md#2.2 Integrações Externas` | A imposição A4 para Agendas e Planners deve operar exclusivamente por corte central reto (2 páginas A5 lado a lado por folha A4 paisagem no padrão Cut & Stack), mantendo o PDF A5 original separado e sem aplicar dobras de livreto. | `redação` | Uso de rasterização bitmap nas páginas impostas ou introdução de imposição tipo livreto dobrado. |

## 2. Histórico de re-extrações

<!-- Preenchido automaticamente em futuras execuções de /reversa -->

## 3. Arquivadas

<!-- Vazio -->

