# Onboarding e Guia de Homologação: Evolução das Agendas e Impressão A4

> Identificador: `003-evolucao-agendas-e-impressao-a4`
> Data: `2026-11-11`

## 1. Como testar o novo miolo das Agendas

1. Acesse `/personalizar/agenda` no navegador.
2. Alterne entre os três layouts (`1 dia por página`, `2 dias por página` e `Semanal`) e entre os anos `2027` e `2028`.
3. Confira as 8 prévias reais geradas pelo Typst:
   - **Abertura**, **Calendário anual**, **Dados pessoais**, **Planejamento mensal**, **Layout de compromissos**, **Controle financeiro mensal**, **Cadastro de contatos** e **Calendário do ano seguinte**.
4. Gere uma solicitação de teste e acesse `/admin/agendas` → selecione o pedido → clique em **Baixar PDF Original (A5)** para inspecionar:
   - Cada mês iniciando com `Planejamento Mensal` e encerrando com `Controle Financeiro Mensal`.
   - Em `2 dias por página`, o último dia de meses de 29 ou 31 dias acompanhado por `"Notas e Pendências do Mês"`.
   - As 4 páginas de `Cadastro de Contatos` (24 registros), `Anotações`, `Calendário Anual` do ano seguinte (`2028` ou `2029`) e a `Página Institucional` final do **678 Estudio**.

## 2. Como calibrar e produzir em Folhas A4 (Agendas e Planners)

1. Abra qualquer pedido em `/admin/agendas/[id]` ou `/admin/planners/[id]`.
2. Na seção **Preparação para Impressão A4 Manual (Corte Central → Folhas A5)**:
   - Clique primeiro em **Baixar Folha de Calibração A4**.
   - Imprima a **Página 1 (Frente de Calibração)** em 1 folha A4 comum (paisagem, escala 100%).
   - Recoloque a mesma folha na bandeja conforme seu procedimento habitual e imprima a **Página 2 (Verso de Calibração)**.
   - Corte a folha ao meio na linha tracejada (`148,5 mm`) e verifique se a **Página 2** ficou atrás da **Página 1** com o topo alinhado para cima, e se a **Página 4** ficou atrás da **Página 3** com o topo alinhado para cima.
   - Se os versos saírem trocados entre esquerda e direita ou de cabeça para baixo, alterne a opção **Orientação de virada do verso** (`Borda curta` vs `Borda longa`).
   - Se a primeira folha impressa ficar no fundo da pilha ao recolocar na bandeja, selecione **Ordem dos versos: Invertida**.
3. Após confirmar a calibração:
   - Clique em **Baixar PDF A4 — Frentes** e imprima todas as folhas A4 de frente.
   - Recoloque a pilha na bandeja e clique em **Baixar PDF A4 — Versos** para imprimir todos os versos.
   - Faça **um único corte central em `148,5 mm`** na guilhotina e posicione a **pilha da esquerda sobre a pilha da direita**: todas as folhas A5 estarão automaticamente na ordem `1, 2, 3, ..., N` prontas para furar e encadernar.

