# Site Público e Vitrine Institucional — Tarefas de Implementação

> Tarefas executáveis para reproduzir a unit `public-site` a partir do legado.

## Pré-requisitos
- [x] Componentes de layout e dados de catálogo disponíveis

## Tarefas
- [x] **T-01**: Implementar `BaseLayout.astro` com fontes, meta tags e cabeçalhos responsivos.
  - Origem no legado: [`src/layouts/BaseLayout.astro`](file:///d:/Projetos/site678Estudio/src/layouts/BaseLayout.astro)
  - Critério de pronto: Renderiza casca HTML uniforme com suporte a Dark/Light tokens do Tailwind. 🟢
- [x] **T-02**: Criar `CategorySection.astro` e `ProductCard.astro` com carrossel horizontal por categoria.
  - Origem no legado: [`src/components/CategorySection.astro`](file:///d:/Projetos/site678Estudio/src/components/CategorySection.astro), [`src/components/ProductCard.astro`](file:///d:/Projetos/site678Estudio/src/components/ProductCard.astro)
  - Critério de pronto: Scroll horizontal touch-friendly com snap nos cards. 🟢
- [x] **T-03**: Criar página inicial `index.astro` com Hero editorial e carrosséis integrados.
  - Origem no legado: [`src/pages/index.astro`](file:///d:/Projetos/site678Estudio/src/pages/index.astro)
  - Critério de pronto: Exibe produtos ativos consultados diretamente do SQLite. 🟢
- [x] **T-04**: Implementar páginas de Trabalhos e Contato.
  - Origem no legado: `src/pages/trabalhos/`, `src/pages/contato/`
  - Critério de pronto: Navegação limpa e consistente. 🟢

## Tarefas de Teste
- [x] **TT-01**: Teste de renderização da página inicial via `astro check` e Vitest.
- [x] **TT-02**: Verificação de responsividade e layout sem quebras em 390px (mobile) e 1280px (desktop).

