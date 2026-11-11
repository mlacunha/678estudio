# Mapeamento de Dependências — 678 Studio

> Gerado pelo **Reversa Scout** em 2026-11-11.

---

## 1. Dependências de Produção (`dependencies`)

| Pacote | Versão | Função no Sistema | Nível Crítico |
| :--- | :--- | :--- | :--- |
| **`astro`** | `^4.16.18` (inst. `4.16.19`) | Framework web principal e renderizador de componentes e rotas | Alta |
| **`@astrojs/node`** | `^8.3.4` | Adaptador Node.js para execução em modo híbrido/SSR | Alta |
| **`@astrojs/tailwind`** | `^5.1.5` | Integração oficial do Tailwind CSS com Astro | Média |
| **`@libsql/client`** | `^0.18.0` | Driver SQLite nativo e assíncrono para persistência local | Alta |
| **`better-sqlite3`** | `^9.6.0` | Driver alternativo SQLite (mantido como fallback secundário) | Baixa |
| **`three`** | `^0.187.0` | Biblioteca 3D WebGL para o personalizador de canecas | Alta |
| **`tailwindcss`** | `^3.4.17` (inst. `3.4.19`) | Framework utilitário de estilização | Média |
| **`typescript`** | `^5.7.3` (inst. `5.9.3`) | Compilador TypeScript com tipagem estrita | Alta |
| **`sharp`** | `0.33.5` | Otimização e processamento nativo de imagens | Média |

---

## 2. Dependências de Desenvolvimento (`devDependencies`)

| Pacote | Versão | Função |
| :--- | :--- | :--- |
| **`vitest`** | `^2.1.8` (inst. `2.1.9`) | Framework de testes unitários rápidos compatível com Vite |
| **`@astrojs/check`** | `^0.9.12` | Verificador de integridade estática de tipos para arquivos `.astro` |
| **`@types/three`** | `^0.187.0` | Definições de tipos TypeScript para Three.js |
| **`@types/better-sqlite3`** | `^9.6.0` | Definições de tipos TypeScript para Better-SQLite3 |
| **`puppeteer-core`** | `^25.16.0` | Automação e captura visual de telas para validação técnica |

---

## 3. Dependências Externas do Sistema Operacional

- **Typst CLI (`typst`):** O módulo `src/server/agenda/classic.mjs` invoca o binário `typst` via subprocesso Node (`execFile`). Requer que o compilador Typst esteja instalado no ambiente ou configurado via variável de ambiente `TYPST_BINARY`.
- **Node.js:** Versão `>= 20.x` recomendada para compatibilidade com os módulos de sistema de arquivos e suporte nativo assíncrono.

