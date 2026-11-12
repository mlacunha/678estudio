# Legacy Impact: Sistema Compartilhado de Capas Personalizadas

> Identificador: `005-capas-personalizadas`
> Data: `2026-11-12`
> Política de edição: `allowLegacyEdits: true` com caminhos autorizados em `.reversa/reversa-config.json`

## 1. Mapeamento de Arquivos e Componentes Afetados

| Arquivo afetado | Componente | Tipo | Severidade | Justificativa |
|---|---|---|:---:|---|
| `src/server/cover/options.mjs` | `cover-engine` | `componente-novo` | LOW | Catálogo compartilhado de estilos, tipografias, sangrias e paletas. |
| `src/server/cover/coverConfig.ts` | `cover-engine` | `componente-novo` | LOW | Tipos TypeScript e validação cromática WCAG $\ge 3:1$. |
| `src/server/cover/quoteAdapter.ts` | `cover-engine` | `componente-novo` | LOW | Adaptador para embutir e recuperar `cover` no `config_json` de pedidos. |
| `src/server/cover/compiler.mjs` | `cover-engine` | `componente-novo` | LOW | Orquestrador de compilação Typst para capas A5 e A4 horizontal. |
| `src/server/cover/typst/**` | `cover-typst` | `componente-novo` | LOW | Templates vetoriais de produção com marcas de corte e zona de furação. |
| `src/pages/api/cover/preview.ts` | `cover-api` | `contrato-novo` | LOW | Endpoint público para prévias em tempo real no personalizador. |
| `src/components/customizer/CoverCustomizerTab.astro` | `customizer-ui` | `componente-novo` | LOW | Interface de personalização de capas em abas. |
| `src/scripts/coverCustomizer.ts` | `customizer-ui` | `componente-novo` | LOW | Controlador client-side para prévias assíncronas e paletas. |
| `src/pages/personalizar/caderno.astro` | `customizer-ui` | `componente-alterado` | LOW | Adoção do fluxo em duas abas: Capa & Contracapa / Miolo & Conteúdo. |
| `src/pages/admin/capas/[family]/[id]/pdf.ts` | `admin-cover` | `contrato-novo` | LOW | Endpoint administrativo de geração de PDFs de capa A5 (3/5mm) e A4 combinado. |
| `src/pages/admin/cadernos/[id]/index.astro` | `admin-cover` | `componente-alterado` | LOW | Botões para download de capas A5 (3mm, 5mm) e folha combinada A4. |
| `Dockerfile` | `runtime-container` | `componente-alterado` | LOW | Inclusão de `src/server/cover` no estágio de runtime da imagem Docker. |

---

## 2. Regras Preservadas do Legado

- **RN-AGE-02 (Contraste Cromático WCAG):** Preservado e reutilizado no cálculo de contraste das capas com limiar $\ge 3:1$.
- **Imposição A4 Cut & Stack (`src/server/print/a4Imposition.ts`):** 100% preservada e intacta; a imposição de capas é completamente independente do miolo.
- **Persistência SQLite e Motor de Backup:** Nenhuma tabela foi alterada de forma destrutiva; backup e restauração continuam passando em 7 de 7 testes.

---

## 3. Regras Novas do Domínio

- **RN-CAP-01 (Transversalidade):** O mesmo motor de capas serve Agendas, Planners e Cadernos.
- **RN-CAP-04 (Geometria Gráfica):** Sangrias de 3 mm e 5 mm, margem de furação Wire-O de 15 mm e marcas de corte vetoriais.
- **RN-CAP-05 (A4 Horizontal com Corte Central):** Imposição de Capa e Contracapa lado a lado em A4 paisagem com guia milimétrica para corte ao meio sem dobras.

