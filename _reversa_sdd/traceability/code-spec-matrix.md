# Matriz de Rastreabilidade Código/Especificação (Code/Spec Matrix)

Mapeamento exaustivo entre os arquivos do código-fonte do legado e as especificações formais correspondentes em `_reversa_sdd/`.

| Arquivo do Legado | Unit Correspondente | Especificação Principal | Cobertura |
|---|---|---|:---:|
| `src/types/catalog.ts` | `catalog` | `catalog/requirements.md`, `design.md` | 🟢 Completa |
| `src/db/catalogRepository.ts` | `catalog` | `catalog/design.md`, `catalog/tasks.md` | 🟢 Completa |
| `src/data/mockCatalog.ts` | `catalog` / `database` | `catalog/design.md`, `database/design.md` | 🟢 Completa |
| `src/pages/api/products/index.ts` | `catalog` | `catalog/requirements.md`, `openapi/api.yaml` | 🟢 Completa |
| `src/pages/api/products/[id].ts` | `catalog` | `catalog/requirements.md`, `openapi/api.yaml` | 🟢 Completa |
| `src/pages/api/categories.ts` | `catalog` | `catalog/requirements.md`, `openapi/api.yaml` | 🟢 Completa |
| `src/db/database.ts` | `database` | `database/requirements.md`, `design.md` | 🟢 Completa |
| `data/studio678.db` | `database` | `database/design.md`, `erd-complete.md` | 🟢 Completa |
| `src/pages/personalizar/caneca.astro` | `customizer-caneca-3d` | `customizer-caneca-3d/requirements.md` | 🟢 Completa |
| `src/components/customizers/Mug.astro` | `customizer-caneca-3d` | `customizer-caneca-3d/design.md` | 🟢 Completa |
| `src/utils/customizer.ts` | `customizer-caneca-3d` | `customizer-caneca-3d/design.md` | 🟢 Completa |
| `src/utils/customizerClient.ts` | `customizer-caneca-3d` | `customizer-caneca-3d/tasks.md` | 🟢 Completa |
| `src/pages/api/mockup/save.ts` | `customizer-caneca-3d` | `customizer-caneca-3d/design.md`, `openapi/api.yaml` | 🟢 Completa |
| `src/pages/personalizar/quadro.astro` | `customizer-quadro-ambiente`| `customizer-quadro-ambiente/requirements.md` | 🟢 Completa |
| `src/components/customizers/Frame.astro`| `customizer-quadro-ambiente`| `customizer-quadro-ambiente/design.md` | 🟢 Completa |
| `src/utils/frameLayout.ts` | `customizer-quadro-ambiente`| `customizer-quadro-ambiente/design.md` | 🟢 Completa |
| `src/server/agenda/classic.mjs` | `agenda-compiler` | `agenda-compiler/requirements.md`, `design.md`| 🟢 Completa |
| `src/server/agenda/quoteConfig.ts` | `agenda-compiler` | `agenda-compiler/design.md`, `contracts.md` | 🟢 Completa |
| `src/server/agenda/options.mjs` | `agenda-compiler` | `agenda-compiler/design.md` | 🟢 Completa |
| `src/server/agenda/drafts.ts` | `agenda-compiler` | `agenda-compiler/design.md` | 🟢 Completa |
| `src/server/agenda/typst/classic.typ` | `agenda-compiler` | `agenda-compiler/contracts.md` | 🟢 Completa |
| `src/pages/api/agenda/preview.ts` | `agenda-compiler` | `agenda-compiler/contracts.md`, `openapi/api.yaml`| 🟢 Completa |
| `src/pages/api/agenda/quote.ts` | `agenda-compiler` | `agenda-compiler/contracts.md`, `openapi/api.yaml`| 🟢 Completa |
| `src/pages/admin/index.astro` | `admin` | `admin/requirements.md`, `admin/design.md` | 🟢 Completa |
| `src/db/studioSettings.ts` | `admin` | `admin/requirements.md`, `admin/design.md` | 🟢 Completa |
| `src/pages/admin/agendas/index.astro` | `admin` | `admin/requirements.md` | 🟢 Completa |
| `src/pages/admin/trabalhos/index.astro` | `admin` | `admin/requirements.md` | 🟢 Completa |
| `src/pages/admin/backup/index.astro` | `admin` | `admin/requirements.md` | 🟢 Completa |
| `src/pages/admin/estudio/index.astro` | `admin` | `admin/requirements.md` | 🟢 Completa |
| `src/pages/index.astro` | `public-site` | `public-site/requirements.md`, `design.md` | 🟢 Completa |
| `src/components/CategorySection.astro` | `public-site` | `public-site/design.md` | 🟢 Completa |
| `src/components/ProductCard.astro` | `public-site` | `public-site/design.md` | 🟢 Completa |
| `src/layouts/BaseLayout.astro` | `public-site` | `public-site/design.md` | 🟢 Completa |
| `src/pages/trabalhos/index.astro` | `public-site` | `public-site/requirements.md` | 🟢 Completa |
| `src/pages/contato/index.astro` | `public-site` | `public-site/requirements.md` | 🟢 Completa |

