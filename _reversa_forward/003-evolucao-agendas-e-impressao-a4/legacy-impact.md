# Legacy Impact: Evolução Editorial das Agendas e Módulo Compartilhado de Impressão A4

> Identificador: `003-evolucao-agendas-e-impressao-a4`
> Data: `2026-11-11`
> Cenário: `legado`
> Política de edição do legado no momento da execução:
> - `allowLegacyEdits`: `true`
> - `allowedPaths`: `["package.json", "pnpm-lock.yaml", "src/server/agenda/**", "src/server/print/**", "src/components/admin/**", "src/pages/admin/**"]`

## 1. Arquivos Afetados no Projeto

| Arquivo afetado | Componente (`_reversa_sdd/architecture.md`) | Tipo | Severidade | Justificativa |
|-----------------|---------------------------------------------|------|------------|---------------|
| `package.json` / `pnpm-lock.yaml` | Infraestrutura / Dependências | `componente-novo` | LOW | Adição da biblioteca pura `pdf-lib` para imposição vetorial A5→A4. |
| `src/server/print/a4Imposition.ts` | `print-a4-imposition` | `componente-novo` | MEDIUM | Motor compartilhado de imposição 2-up A4 paisagem (Cut & Stack, Frentes, Versos e Calibração). |
| `src/server/print/a4Imposition.test.ts` | `print-a4-imposition` | `componente-novo` | LOW | Suíte de testes unitários da matemática Cut & Stack e geração PDF vetorial. |
| `src/server/agenda/typst/brand-678.png` | `agenda-compiler` | `componente-novo` | LOW | Marca oficial do 678 Estudio convertida para PNG estático para o colofão da Agenda. |
| `src/server/agenda/typst/lib/daily.typ` | `agenda-compiler` | `regra-alterada` | MEDIUM | Adição de `month-closing-column` ("Notas e Pendências do Mês") para fechar meses ímpares em `daily-2dpp`. |
| `src/server/agenda/typst/lib/sections.typ` | `agenda-compiler` | `regra-alterada` | MEDIUM | Expansão com `monthly-finance` (Contas, Vencimentos, Pagamento, Receitas, Despesas, Saldo), `contacts-page` e `studio-colophon`. |
| `src/server/agenda/typst/classic.typ` | `agenda-compiler` | `regra-alterada` | MEDIUM | Organização dos 3 layouts em 12 ciclos mensais autocontidos + Contatos + Anotações pares + Calendário `year + 1` + Colofão. |
| `src/server/agenda/classic.mjs` | `agenda-compiler` | `regra-alterada` | MEDIUM | Sincronização de `agendaPreviewSections` e `agendaTotalPages` (`400`, `222`, `90`) e passagem dos dados reais do estúdio. |
| `src/server/agenda/classic.test.ts` | `agenda-compiler` | `componente-novo` | LOW | Testes automatizados validando a compilação real dos 3 layouts em 2027 e 2028. |
| `src/server/agenda.test.mjs` | `agenda-compiler` | `regra-alterada` | LOW | Atualização das contagens de página esperadas (`400`, `222`, `90`) nos testes `AGENDA_TYPST_TEST=1` executados no `Dockerfile`. |
| `src/server/agenda-quotes.test.ts` | `agenda-compiler` | `regra-alterada` | LOW | Atualização da asserção de contagem de páginas do layout `daily-2dpp` v2 (`200` → `222`) mantendo `183` para `v1`. |
| `src/components/admin/AdminA4PrintPanel.astro` | `admin` | `componente-novo` | LOW | Painel compartilhado de preparação para impressão A4 manual para Agendas e Planners. |
| `src/pages/admin/impressao-a4/calibracao.pdf.ts` | `admin` | `delta-de-contrato-externo` | LOW | Endpoint de geração da Folha de Calibração A4 de 2 páginas. |
| `src/pages/admin/agenda-classica.pdf.ts` | `admin` | `delta-de-contrato-externo` | MEDIUM | Suporte a `GET`/`POST` e geração de `a4-frentes`, `a4-versos` e `a5` com dados reais do estúdio. |
| `src/pages/admin/planners/[id]/pdf.ts` | `admin` | `delta-de-contrato-externo` | MEDIUM | Suporte a geração de `a4-frentes` e `a4-versos` além do PDF A5 original. |
| `src/pages/admin/agendas/[id]/index.astro` | `admin` | `delta-de-contrato-externo` | LOW | Inclusão do painel `AdminA4PrintPanel.astro`. |
| `src/pages/admin/planners/[id]/index.astro` | `admin` | `delta-de-contrato-externo` | LOW | Inclusão do painel `AdminA4PrintPanel.astro`. |

## 2. Diff Conceitual por Componente

- **`agenda-compiler`:** O template `classic.typ` deixou de agrupar os 12 planejamentos mensais no início e uma única folha financeira no fim do ano. Agora cada mês $m \in \{1..12\}$ abre com `monthly-plan`, apresenta suas páginas diárias/semanais sem misturar meses e encerra com `monthly-finance`. Ao final de dezembro, entram 4 páginas de Contatos (36 registros, 9 por página), páginas de Anotações de fechamento par, o Calendário Anual real de `year + 1` e a Página Institucional do 678 Estudio.
- **`print-a4-imposition`:** Novo módulo compartilhado (`src/server/print/a4Imposition.ts`) que recebe qualquer PDF A5 vetorial e monta folhas A4 paisagem (`297 × 210 mm`) com duas páginas A5 lado a lado para corte reto central (`148,5 mm`) no padrão Cut & Stack.
- **`admin`:** As páginas de detalhes de pedidos de Agendas e Planners agora contam com controles dedicados para baixar o PDF A5 original, o PDF A4 de Frentes, o PDF A4 de Versos e a Folha de Calibração A4.

## 3. Regras Preservadas (`_reversa_sdd/domain.md` e Adendos)

- **RN-CAT-01, RN-CAT-02, RN-CAT-03:** Intactas.
- **Famílias de Papelaria Personalizada (`002-personalizador-planners`):** Preservadas exatamente as 3 famílias (`Agendas`, `Planners`, `Cadernos Personalizados`) em `src/data/stationery.ts`.
- **RN-AGE-01, RN-AGE-02:** Validação de anos válidos (1900–9998) e contraste mínimo 3:1 intactas.
- **RN-CFG-01, RN-CFG-02:** Registro único de configurações do estúdio preservado e reutilizado na página institucional da Agenda.

## 4. Regras Modificadas

- **RN-AGE-03 (Prévias e Estrutura Editorial da Agenda Clássica):** As 8 prévias e a paginação da Agenda Clássica v2 passam a refletir os 12 ciclos mensais com Controle Financeiro Mensal, Cadastro de Contatos, Calendário do Ano Seguinte (`year + 1`) e Página Institucional do 678 Estudio, totalizando 400 páginas (`daily-1dpp`), 222 páginas (`daily-2dpp`) e 90 páginas (`weekly`).

