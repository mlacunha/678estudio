# Matriz de Impacto de Especificações (Spec Impact Matrix) — 678 Estudio

Mapeamento de dependência e propagação de impacto entre componentes e módulos do sistema.

| Componente Origem | Componentes Impactados | Tipo de Impacto | Gravidade / Risco |
|---|---|---|:---:|
| **`database` (`studio678.db`, `database.ts`)** | `catalog`, `admin`, `agenda-compiler`, `public-site` | Alteração de schema ou quebra de conexão afeta todo o sistema | Alta 🔴 |
| **`catalog` (`catalogRepository.ts`, `types/catalog.ts`)** | `public-site` (vitrine), `admin` (CRUD), `customizer-caneca-3d`, `customizer-quadro-ambiente` | Mudança na estrutura de `Product` ou `CategorySlug` propaga para UI e formulários | Alta 🔴 |
| **`customizer-caneca-3d` (`Mug.astro`, `customizer.ts`)** | `api/mockup/save`, WhatsApp CTA, Vitrine Canecas | Alteração na geometria cilíndrica ou medidas (20/21/22 cm) afeta mockups salvos | Média 🟡 |
| **`customizer-quadro-ambiente` (`Frame.astro`, `frameLayout.ts`)** | `api/mockup/save`, WhatsApp CTA, Vitrine Quadros | Mudança em margens (0.5-8 cm) ou proporção (15 px/cm) altera renderização | Média 🟡 |
| **`agenda-compiler` (`classic.mjs`, `classic.typ`)** | `api/agenda/*`, `/admin/agendas`, `/agenda/orcamento/*` | Atualizações no template Typst alteram paginação e numeração de prévias | Alta 🔴 |
| **`admin` (`src/pages/admin/`)** | `site_settings`, `products`, `gallery_works`, backups | Gestão de dados; não afeta lógica interna dos customizadores | Baixa 🟢 |
| **`public-site` (`src/pages/index.astro`, componentes)** | Apenas interface visual de apresentação | Consome dados, mas não exporta contratos para outros módulos | Baixa 🟢 |

