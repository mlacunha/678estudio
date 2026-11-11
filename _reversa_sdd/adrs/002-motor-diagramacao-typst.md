# ADR-002: Motor de Diagramação Automatizada via Typst CLI

- **Status**: Aceito (Retroativo)
- **Data**: 2026-11-08
- **Autor**: Milton / Equipe 678 Estudio

## Contexto
O estúdio comercializa agendas e planners anuais altamente personalizados com dados variáveis, calendários anuais dinâmicos e opções de layout diário ou semanal. Ferramentas convencionais como Puppeteer ou LaTeX eram ou muito lentas e pesadas em consumo de memória ou complexas demais de manter.

## Decisão
Integrar o compilador moderno **Typst** via CLI em processo isolado (`execFile('typst', args)`). O código fonte do template reside em `src/server/agenda/typst/classic.typ`, recebendo inputs via argumentos de linha de comando (`--input layout=...`, `--input year=...`). Para prévias rápidas, compila-se um subconjunto de 8 páginas em formato PNG (`--format png`).

## Consequências
- **Positivas**:
  - Compilação ultrarrápida (geralmente sob 500ms para prévias e sob 2s para PDFs completos de 400 páginas).
  - Controle tipográfico e gráfico impecável para impressão gráfica profissional de alta resolução.
- **Negativas**:
  - Exige a presença do binário `typst` instalado no ambiente do host ou contêiner.

