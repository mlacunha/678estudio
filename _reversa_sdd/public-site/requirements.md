# Site Público e Vitrine Institucional — Requisitos

> Especificação de requisitos da unit `public-site`. Foca no QUE a unit faz.

## Visão Geral
Interface pública do 678 Estudio voltada para o consumidor final. Apresenta a identidade da marca, destaca o Hero editorial com chamada de valor para peças personalizadas sob medida, organiza a vitrine em quatro carrosséis de categorias e conecta os clientes diretamente aos simuladores interativos e ao atendimento comercial via WhatsApp.

## Responsabilidades
- Renderizar a página inicial (`index.astro`) de forma rápida e responsiva.
- Agrupar produtos ativos em seções temáticas de categorias (`quadros`, `canecas`, `papelaria`, `artesanato`).
- Exibir cards de produtos com informações de acabamento, badges de destaque e CTAs claros.
- Oferecer navegação para o portfólio de trabalhos realizados e página de contato.
- Manter o botão flutuante de WhatsApp permanentemente acessível.

## Regras de Negócio
- **RN-PUB-01**: Itens inativos (`is_active = 0`) não devem ser renderizados na vitrine pública. 🟢
- **RN-PUB-02**: Os links de contato de WhatsApp devem herdar o número cadastrado no banco em `site_settings`. 🟢
- **RN-PUB-03**: O design deve seguir estética editorial minimalista com paleta quente e tipografia tipicamente editorial. 🟢

## Requisitos Funcionais

| ID | Requisito | Prioridade | Critério de Aceite |
|---|---|---|---|
| RF-01 | Renderizar Hero Editorial | Must | Seção principal com título impactante e direcionamento para categorias |
| RF-02 | Exibir carrosséis de categoria | Must | Cada categoria renderiza seus produtos em scroll horizontal suave |
| RF-03 | Cards de produto com CTA | Must | Clique no card direciona para o personalizador ou inicia contato |
| RF-04 | Página de Portfólio de Trabalhos | Should | `/trabalhos` exibe mosaico com fotos de produtos entregues |
| RF-05 | Página de Contato | Should | `/contato` exibe telefones, redes sociais oficiais e mapa |

## Requisitos Não Funcionais

| Tipo | Requisito inferido | Evidência no código | Confiança |
|---|---|---|---|
| Responsividade | Breakpoints Tailwind cobrindo mobile (390px) até desktop (1280px) | Classes `sm:`, `md:`, `lg:` em `index.astro` | 🟢 |
| Acessibilidade | Elementos semânticos HTML5, tags de cabeçalho e atributos ARIA | `src/layouts/BaseLayout.astro` | 🟢 |

