# Adendo: Sistema Compartilhado de Capas Personalizadas

> Identificador: `005-capas-personalizadas`
> Data: `2026-11-12`
> Cenário: `legado`

## Vigência

Vigente desde 2026-11-12.

## Resumo da entrega

Implementação completa do subsistema compartilhado de **Capas Personalizadas** para as três famílias de Papelaria Personalizada do **678 Estudio** (Agendas, Planners e Cadernos Personalizados), com **14 de 14 ações concluídas** (`T001` a `T014`):

1. **Catálogo e Validação de Cores (`src/server/cover/`):** Modelos de dados tipados (`CoverConfig`, `CoverColors`, `CoverCrop`), opções pré-definidas com três estilos conceituais (`classic`, `modern`, `photographic`), três tipografias (`editorial`, `geometric`, `modern`), paletas harmonizadas e algoritmo de cálculo de contraste WCAG 2.1 AA ($\ge 3:1$).
2. **Motor Gráfico Typst Vetorial (`src/server/cover/typst/`):**
   - **Formato A5 Individual:** Capa frontal e contracapa independentes com sangria técnica configurável (`3 mm` ou `5 mm`), marcas de corte e margem de furação Wire-O de `15 mm` preservada.
   - **Folha Combinada A4 Horizontal:** Montagem de Capa e Contracapa lado a lado em folha A4 paisagem (`297 × 210 mm`) em escala real 1:1, com guia central de refile para corte ao meio sem dobras.
3. **Experiência em Duas Abas e Prévias em Tempo Real:** Inclusão das abas "1. Capa & Contracapa" e "2. Miolo & Conteúdo" nos personalizadores, com prévia visual sincronizada e endpoint de alta performance `/api/cover/preview`.
4. **Administração e Preservação do Legado:** Visualização e download de capas no painel administrativo `/admin/capas/[family]/[id]/pdf.ts`, com download dos arquivos originais e isolamento total da rotina de imposição A4 Cut & Stack dos miolos.

## Impacto por artefato da extração

| Artefato | Seção | Tipo de impacto | Delta |
|----------|-------|-----------------|-------|
| `_reversa_sdd/architecture.md` | `1. Visão Executiva e Estilo Arquitetural` | `componente-novo` | Adição do subsistema `src/server/cover/` (compilador Typst de capas, tipos, opções e endpoint de prévia) e inclusão de `src/server/cover` no `Dockerfile`. |
| `_reversa_sdd/domain.md` | `2.4 Motor de Agendas (Typst)` | `regra-nova` | Inclusão das regras editoriais e geométricas de capas: margem de furação Wire-O de 15 mm, sangria de 3/5mm e folha combinada A4 com corte ao meio sem dobras. |
| `_reversa_sdd/code-analysis.md` | `2.6 Módulo admin` | `delta-de-contrato-externo` | Criação das rotas `/api/cover/preview` e `/admin/capas/[family]/[id]/pdf` com opções de A5 3mm, A5 5mm e A4 horizontal. |
| `_reversa_sdd/erd-complete.md` | `Diagrama Entidade-Relacionamento` | `delta-de-dados` | Inclusão do payload estruturado `cover?: CoverConfig` dentro do campo `config_json` nos orçamentos de cadernos, agendas e planners. |

## Regras sob vigilância

- `W001`, `W002`, `W003`, `W004` documentados em [`_reversa_forward/005-capas-personalizadas/regression-watch.md`](file:///d:/Projetos/site678Estudio/_reversa_forward/005-capas-personalizadas/regression-watch.md).

## Fontes

- `_reversa_forward/005-capas-personalizadas/requirements.md`
- `_reversa_forward/005-capas-personalizadas/roadmap.md`
- `_reversa_forward/005-capas-personalizadas/investigation.md`
- `_reversa_forward/005-capas-personalizadas/data-delta.md`
- `_reversa_forward/005-capas-personalizadas/legacy-impact.md`
- `_reversa_forward/005-capas-personalizadas/regression-watch.md`
- `_reversa_forward/005-capas-personalizadas/actions.md`
- `_reversa_forward/005-capas-personalizadas/progress.jsonl`

