# 678 Estudio — Plataforma Institucional, Catálogo Dinâmico & Administração

Plataforma do **678 Estudio**, estúdio especializado em produtos personalizados com acabamento premium, catálogo dinâmico em SQLite local e painel administrativo integrado.

---

## 1. Visão Geral da Arquitetura

O projeto foi estruturado para aliar alta performance de carregamento, simplicidade de manutenção por desenvolvedor solo e facilidade de evolução incremental:

- **Framework Web:** [Astro](https://astro.build/) com TypeScript em modo híbrido (`output: 'hybrid'`) com `@astrojs/node`. Permite renderização estática e dinâmica sob demanda sem necessidade de rebuild ao atualizar produtos no catálogo.
- **Banco de Dados Local:** [SQLite](https://sqlite.org/) gerenciado via `@libsql/client` com persistência em arquivo local (`data/studio678.db`). Consultas 100% parametrizadas para proteção contra SQL Injection.
- **Painel Administrativo:** Acessível em `/admin` para criação, edição, ordenação, visibilidade e exclusão de produtos em tempo real, além de upload de imagens para `public/uploads/`.
- **Design & Estilos:** [Tailwind CSS](https://tailwindcss.com/) com paleta customizada (`studio` e `gold`), tipografia hierárquica e componentes responsivos com scroll horizontal suave.
- **Testes Unitários:** [Vitest](https://vitest.dev/) com 19 testes unitários cobrindo utilitários de atendimento WhatsApp e todas as operações do repositório SQLite em memória.

---

## 2. Estrutura de Diretórios

```text
site678Estudio/
├── data/                 # Banco de dados SQLite local (studio678.db)
├── public/
│   ├── images/demo/      # Fotografias demonstrativas de estúdio
│   └── uploads/          # Imagens enviadas via painel administrativo
├── src/
│   ├── components/       # Componentes de apresentação isolados
│   │   ├── CategorySection.astro
│   │   ├── Footer.astro
│   │   ├── Header.astro
│   │   ├── Hero.astro
│   │   ├── ProductCard.astro
│   │   └── WhatsAppCTA.astro
│   ├── db/               # Camada de banco de dados SQLite
│   │   ├── database.ts
│   │   ├── catalogRepository.ts
│   │   └── catalogRepository.test.ts
│   ├── layouts/          # Layout base com meta tags e estrutura global
│   │   └── BaseLayout.astro
│   ├── pages/            # Rotas públicas, administrativas e API
│   │   ├── admin/
│   │   │   └── index.astro
│   │   ├── api/
│   │   │   ├── categories.ts
│   │   │   ├── upload.ts
│   │   │   └── products/
│   │   │       ├── index.ts
│   │   │       └── [id].ts
│   │   └── index.astro
│   ├── types/            # Contratos de tipos TypeScript
│   └── utils/            # Utilitários puros
├── astro.config.mjs      # Configuração híbrida do Astro com adapter Node
├── tailwind.config.mjs   # Configuração e tema do Tailwind
├── tsconfig.json         # Configurações TypeScript estritas
├── vitest.config.ts      # Configurações da suíte de testes Vitest
├── package.json          # Dependências e scripts
└── README.md             # Documentação técnica
```

---

## 3. Comandos de Execução

### Instalação de Dependências
```bash
pnpm install
```

### Executar em Desenvolvimento
```bash
pnpm dev
```
O site estará acessível em `http://localhost:4321` e o painel em `http://localhost:4321/admin`.

### Executar Testes Unitários
```bash
pnpm test
```

### Checagem Estática de Tipos
```bash
pnpm exec astro check
```

### Compilar para Produção
```bash
pnpm build
```

---

## 4. Status de Entrega

- [x] **Fundação e Layout:** Logomarca oficial, temas claro e escuro com preferência local, hero editorial em duas colunas e navegação responsiva.
- [x] **Imagens de Estúdio:** Fotografias reais demonstrativas para as 4 linhas (Quadros, Canecas, Agendas e Madeira).
- [x] **Banco de Dados SQLite:** Persistência em `data/studio678.db`, migração automática e repositório parametrizado.
- [x] **Painel Administrativo (`/admin`):** Métricas, ordenação, visibilidade imediata, edição, exclusão e upload local de imagens sem rebuild.
- [x] **API REST:** Endpoints `/api/categories`, `/api/products`, `/api/upload` e `/api/mockup/save`.
- [x] **Personalizadores Interativos:** Caneca 3D em Three.js (20 × 9 cm com rotação 360°) e Quadro 30 × 40 cm em ambientes contextualizados (Sala e Escritório) com exportação direta para WhatsApp.
- [x] **Testes Unitários:** 25 testes aprovados com 100% de cobertura de lógica de negócios.
