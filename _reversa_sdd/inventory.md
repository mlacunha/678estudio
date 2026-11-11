# Inventário da Superfície do Sistema — 678 Studio

> Gerado pelo **Reversa Scout** em 2026-11-11.

---

## 1. Visão Geral da Arquitetura

O **678 Studio** é uma plataforma web híbrida (SSG + SSR) voltada a um estúdio de produtos personalizados premium, sem e-commerce transacional, integrando:
1. **Frontend Institucional:** Astro v4 + Tailwind CSS com identidade visual dark & gold.
2. **Catálogo Dinâmico & Persistência Local:** SQLite (`data/studio678.db`) operado via `@libsql/client` com repositório desacoplado e consultas parametrizadas.
3. **Painel Administrativo:** Gestão em tempo real de produtos, visibilidade, ordenação e upload de imagens sem necessidade de rebuild do site (`/admin`).
4. **Personalizadores Interativos:**
   - **Caneca 3D:** Modelagem cilíndrica e órbita 360° em Three.js com área útil de 20 × 9 cm (`/personalizar/caneca`).
   - **Quadro em Ambientes:** Simulação 30 × 40 cm com paspatur, molduras e sombras realistas em Sala e Escritório (`/personalizar/quadro`).
5. **Compilador de Agendas em Typst:** Script e biblioteca para geração programática de miolos de agenda em PDF e prévias PNG com suporte a layouts diários e semanais (`src/server/agenda/`).
6. **Integração com WhatsApp:** Geração padronizada de mensagens e armazenamento temporário de mockups gerados pelos simuladores (`/api/mockup/save`).

---

## 2. Estrutura de Diretórios do Projeto

```text
site678Estudio/
├── data/                         # Banco SQLite local
│   └── studio678.db
├── public/                       # Arquivos estáticos e mídias públicas
│   ├── images/
│   │   └── demo/                 # Fotografias demonstrativas de estúdio
│   └── uploads/                  # Uploads de produtos e mockups temporários
│       └── mockups/
├── src/
│   ├── components/               # Componentes visuais modulares
│   │   ├── CategorySection.astro
│   │   ├── Footer.astro
│   │   ├── Header.astro
│   │   ├── Hero.astro
│   │   ├── ProductCard.astro
│   │   └── WhatsAppCTA.astro
│   ├── data/                     # Dados mock e sementes iniciais
│   │   ├── mockCatalog.ts
│   │   └── mockCatalog.test.ts
│   ├── db/                       # Camada de persistência SQLite
│   │   ├── database.ts
│   │   ├── catalogRepository.ts
│   │   └── catalogRepository.test.ts
│   ├── layouts/                  # Layouts globais
│   │   └── BaseLayout.astro
│   ├── pages/                    # Rotas públicas, painel e endpoints
│   │   ├── admin/
│   │   │   └── index.astro       # Painel administrativo (/admin)
│   │   ├── api/                  # Endpoints REST em runtime
│   │   │   ├── categories.ts
│   │   │   ├── upload.ts
│   │   │   ├── mockup/
│   │   │   │   └── save.ts
│   │   │   └── products/
│   │   │       ├── index.ts
│   │   │       └── [id].ts
│   │   ├── personalizar/         # Páginas dos personalizadores interativos
│   │   │   ├── caneca.astro      # Simulador 3D de canecas
│   │   │   └── quadro.astro      # Simulador 2D de quadros em ambiente
│   │   └── index.astro           # Página inicial institucional
│   ├── server/                   # Utilitários e geradores server-side
│   │   └── agenda/               # Compilador de agendas e planners Typst
│   │       ├── classic.mjs
│   │       ├── options.mjs
│   │       ├── poc.mjs
│   │       └── typst/            # Templates e definições Typst (.typ)
│   ├── styles/
│   │   └── global.css            # Diretivas Tailwind e scrollbars
│   ├── types/
│   │   └── catalog.ts            # Interfaces e contratos TypeScript
│   └── utils/                    # Utilitários puros
│       ├── customizer.ts         # Cálculo de proporções e offsets
│       ├── customizer.test.ts
│       ├── whatsapp.ts           # Formatação de links e mensagens WhatsApp
│       └── whatsapp.test.ts
├── astro.config.mjs              # Configuração Astro (modo híbrido + @astrojs/node)
├── package.json
├── tailwind.config.mjs
├── tsconfig.json
├── vitest.config.ts
└── README.md
```

---

## 3. Módulos Identificados

1. **`catalog`:** Modelos de dados ([`catalog.ts`](file:///D:/Projetos/site678Estudio/src/types/catalog.ts)), categorias e mock de fallback.
2. **`database`:** Inicialização SQLite, migração automática e repositório parametrizado ([`catalogRepository.ts`](file:///D:/Projetos/site678Estudio/src/db/catalogRepository.ts)).
3. **`admin`:** Interface de gestão em tempo real de produtos, ordenação, visibilidade e uploads ([`admin/index.astro`](file:///D:/Projetos/site678Estudio/src/pages/admin/index.astro)).
4. **`customizer-caneca-3d`:** Visualizador Three.js 3D com rotação 360°, enquadramento de estampa 20×9 cm e exportação de mockup ([`caneca.astro`](file:///D:/Projetos/site678Estudio/src/pages/personalizar/caneca.astro)).
5. **`customizer-quadro-ambiente`:** Renderizador Canvas de quadros 30×40 cm em ambientes fotográficos (Sala e Escritório) com molduras e sombras ([`quadro.astro`](file:///D:/Projetos/site678Estudio/src/pages/personalizar/quadro.astro)).
6. **`agenda-compiler`:** Mecanismo CLI de compilação de agendas em Typst via subprocesso para PDF/PNG ([`classic.mjs`](file:///D:/Projetos/site678Estudio/src/server/agenda/classic.mjs)).
7. **`public-site`:** Composição visual institucional, hero editorial em 2 colunas, carrosséis de cards e links de orçamento consultivo ([`index.astro`](file:///D:/Projetos/site678Estudio/src/pages/index.astro)).

---

## 4. Entry Points e Rotas

| Rota / Ponto de Entrada | Tipo | Descrição |
| :--- | :--- | :--- |
| `src/pages/index.astro` | SSR / Híbrido | Vitrine principal com catálogo dinâmico |
| `src/pages/admin/index.astro` | SSR / Híbrido | Painel administrativo com formulários e tabela |
| `src/pages/personalizar/caneca.astro` | SSR / Híbrido | Simulador 3D de canecas em Three.js |
| `src/pages/personalizar/quadro.astro` | SSR / Híbrido | Simulador 2D de quadros em ambientes |
| `src/pages/api/products/index.ts` | Endpoint REST | Listagem (GET) e criação (POST) de produtos |
| `src/pages/api/products/[id].ts` | Endpoint REST | Consulta (GET), edição/toggle (PUT) e exclusão (DELETE) |
| `src/pages/api/categories.ts` | Endpoint REST | Listagem de categorias (GET) |
| `src/pages/api/upload.ts` | Endpoint REST | Upload de imagens (POST) |
| `src/pages/api/mockup/save.ts` | Endpoint REST | Armazenamento de mockups exportados (POST) |
| `src/server/agenda/poc.mjs` | Script CLI Node | Prova de conceito e compilação de agendas Typst |

---

## 5. Cobertura de Testes

- **Framework:** Vitest v2.1.8 / v2.1.9.
- **Total de Suítes:** 4 arquivos de teste.
- **Total de Testes:** 25 testes unitários (100% de aprovação).
- **Módulos Cobertos:** Utilitários de WhatsApp, catálogo mock, regras do customizador e operações CRUD parametrizadas em SQLite em memória.

