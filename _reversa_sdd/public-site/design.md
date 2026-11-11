# Site Público e Vitrine Institucional — Design Técnico

> Especificação técnica da unit `public-site`. Foca no COMO a unit é construída.

## Interface

### Páginas Principais (`src/pages/`)
- `src/pages/index.astro`: Página inicial com Hero, carrosséis de produtos e seções institucionais.
- `src/pages/trabalhos/index.astro`: Galeria de fotos de trabalhos entregues.
- `src/pages/contato/index.astro`: Informações de contato e formulário.
- `src/pages/404.astro`: Página de erro 404 personalizada.
- `src/pages/500.astro`: Página de erro 500 do servidor.

### Componentes Reutilizáveis (`src/components/`)
- `CategorySection.astro`: Contêiner de categoria com cabeçalho de seção e carrossel flexível horizontal.
- `ProductCard.astro`: Card de produto com imagem de alta fidelidade, badge de destaque, título, descrição e botão de ação.
- `Header.astro`: Cabeçalho responsivo com logotipo vetorial `BrandMark.astro` e menu de navegação.
- `Footer.astro`: Rodapé com mapa do site, canais sociais e direitos autorais.
- `WhatsAppFloatingButton.astro`: Botão fixo inferior direito para contato ágil.

## Dependências
- `src/db/catalogRepository.ts`: Consulta inicial para renderizar categorias e produtos.
- `src/db/studioSettings.ts`: Consulta das redes sociais e número de WhatsApp.
- `src/layouts/BaseLayout.astro`: Layout base que inclui fontes e tags de cabeçalho.

## Riscos e Lacunas
- 🟡 Otimização de imagens: muitas fotos estão em tamanho original; a adoção de `@astrojs/image` ou formatos AVIF/WebP melhoraria a pontuação no Google Lighthouse.

