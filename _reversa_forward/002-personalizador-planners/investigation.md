# Investigação Técnica: Personalizador de Planners

> Identificador: `002-personalizador-planners`

## 1. Inspeção da Infraestrutura Existente do Typst

No repositório atual, a compilação de miolos é executada em `src/server/agenda/classic.mjs` através do binário CLI do Typst:
- O Typst recebe parâmetros estruturados via `--input key=value`.
- O template base (`src/server/agenda/typst/classic.typ`) importa utilitários compartilhados de `lib/sections.typ`.
- O binário do Typst compila com altíssima velocidade para PDF vetorial ou SVG/PNG de páginas específicas (`--pages 1`, `--pages 5`).
- **Conclusão:** O mesmo padrão de compilação CLI será adotado para o Planner em `src/server/planner/essencial.mjs`, garantindo consistência operacional no contêiner Docker.

## 2. Estrutura do Template Typst do Planner Essencial

O arquivo `src/server/planner/typst/essencial.typ` organizará o miolo no formato A5 ($148 \times 210 \text{ mm}$):
- **Margens Espelhadas:** Calha interna de encadernação ($20\text{mm}$ interna, $12\text{mm}$ externa, $15\text{mm}$ topo e rodapé) garantindo abertura perfeita em wire-o ou costura artesanal.
- **Seção 1 (Abertura):** Página de rosto com identificação pessoal, dados de contato e objetivos gerais.
- **Seção 2 (Anual):** Visão panorâmica dos 12 meses e metas estruturadas.
- **Seção 3 (Mensal):** Abertura de cada mês com calendário do mês, prioridades e compromissos.
- **Seção 4 (Planejamento Semanal em Abertura Dupla A5):**
  - **Página Esquerda (A5 vertical):** Segunda a Quarta-feira, prioridades máximas da semana e notas rápidas.
  - **Página Direita (A5 vertical):** Quinta-feira a Domingo, checklist de tarefas, mini-tracker semanal de hábitos e espaço para reflexão.
  - Não gera folha A4 horizontal: são duas páginas A5 consecutivas com margens espelhadas.
- **Seção 5 (Controle de Hábitos):** Habit tracker mensal integrado com grid de 31 dias para até 6 hábitos diários.
- **Seção 6 (Controle Financeiro Completo):**
  - Tabela de receitas (fonte, valor previsto, valor realizado).
  - Tabela de despesas fixas e variáveis (descrição, categoria, vencimento, valor, pago [checkbox]).
  - Controle de contas a pagar e contas pagas com data.
  - Metas financeiras e balanço/resumo mensal (total entradas, total saídas, saldo final).
- **Seção 7 (Revisão Mensal):** Página reflexiva ao final de cada mês para avaliação de resultados e aprendizados.
- **Seção 8 (Anotações):** Páginas pautadas/pontilhadas distribuídas para registros complementares.

## 3. Lógica de Calendário (Datado vs Não Datado)

- **Datado:** Módulo `calendar.ts` gera a estrutura de datas de 52/53 semanas para o ano selecionado. As semanas que cruzam o final/início de mês são tratadas de forma contínua, sem duplicar dias nem omitir datas.
- **Não Datado:** O layout mantém exatamente a mesma proporção e grids das seções, substituindo a numeração pré-impressa por linhas e círculos pontilhados para preenchimento manual da data e mês pelo cliente.

## 4. Estilos Visuais e Tipografia

- **Clássico:** Tipografia sóbria, linhas finas de contraste, cores neutras com acentos dourados/grafite.
- **Comercial:** Tipografia sans-serif robusta, caixas com cantos retos, hierarquia focada em entregas e prazos corporativos.
- **Feminino:** Tipografia delicada, cantos arredondados, paleta suave em tons pastéis/rosê e espaçamento arejado.
