# Regression Watch: Sistema Compartilhado de Capas Personalizadas

> Identificador: `005-capas-personalizadas`
> Data: `2026-11-12`

## 1. Tabela de Vigilância de Regressão

| ID | Origem | Regra esperada após mudança | Tipo de verificação | Sinal de violação |
|---|---|---|---|---|
| W001 | `src/server/cover/coverConfig.ts` | Combinações de cor de capa com contraste < 3:1 devem ser corrigidas automaticamente para texto legível. | Presença | Teste unitário falhar ao enviar pares de baixo contraste. |
| W002 | `src/server/cover/typst/lib/shared.typ` | Margem interna de furação Wire-O deve ser de pelo menos 15 mm. | Presença | Furação mecânica atingir o texto ou área crítica da arte. |
| W003 | `src/server/cover/typst/lib/combined_a4.typ` | Imposição A4 horizontal deve conter linha guia de corte central sem dobras. | Presença | Folha impressa apresentar sobreposição ou ausência de linha divisória central. |
| W004 | `src/server/print/a4Imposition.ts` | A imposição A4 Cut & Stack de miolos deve permanecer totalmente isolada da rotina de capas. | Ausência | Tentativa de aplicar imposição Cut & Stack a capas no painel administrativo. |

## 2. Histórico de Re-extrações

*(Vazio no momento. Será preenchido após futuras rodadas completas do /reversa)*

## 3. Arquivadas

*(Vazio no momento)*

