import type { ProductCategory, Product } from '../types/catalog';

export const CATEGORIES: ProductCategory[] = [
  {
    id: 'cat-quadros',
    slug: 'quadros',
    title: 'Quadros Decorativos',
    subtitle: 'Composição 30 × 40 cm',
    description: 'Artes autorais impressas em pigmento mineral, com molduras em madeira nobre e paspatur chanfrado para harmonizar em salas e escritórios executivos.',
    badge: 'Ambientes Selecionados',
  },
  {
    id: 'cat-canecas',
    slug: 'canecas',
    title: 'Canecas Personalizadas',
    subtitle: 'Cerâmica Premium 325ml',
    description: 'Acabamento vítreo espelhado ou fosco acetinado. Idealizadas para presentes corporativos memoráveis e momentos únicos.',
    badge: 'Visualização 3D em Breve',
  },
  {
    id: 'cat-papelaria',
    slug: 'papelaria',
    title: 'Papelaria Personalizada',
    subtitle: 'Papelaria Fina & Organização',
    description: 'Encadernação artesanal em capa dura com detalhes em hot-stamping metálico, miolo em papel de alta gramatura e fitas marcadoras.',
    badge: 'Edições Limitadas',
  },
  {
    id: 'cat-artesanato',
    slug: 'artesanato',
    title: 'Artesanato em Madeira & Especiais',
    subtitle: 'Marcenaria de Precisão',
    description: 'Peças esculpidas e finalizadas à mão com óleos minerais naturais e cera de abelha, valorizando os veios e a nobreza de cada madeira.',
    badge: 'Feito à Mão',
  },
];

export const PRODUCTS: Product[] = [
  // Quadros Decorativos
  {
    id: 'prod-q1',
    name: 'Quadro Geometria Dourada 30x40',
    categorySlug: 'quadros',
    tagline: 'Linhas minimalistas em relevo dourado',
    description: 'Impressão mineral em algodão com moldura em laca preta fosca e paspatur chanfrado.',
    featuredBadge: 'Destaque Sala',
    imageUrl: '/images/demo/quadro-geometria.jpg',
    order: 1,
    isActive: true,
    isProvisional: true,
  },
  {
    id: 'prod-q2',
    name: 'Quadro Botânica Minimalista',
    categorySlug: 'quadros',
    tagline: 'Estudo botânico em fundo orgânico suave',
    description: 'Perfeito para composições em duplas em escritórios executivos ou salas de leitura.',
    featuredBadge: 'Coleção Orgânica',
    imageUrl: '/images/demo/quadro-botanica.jpg',
    order: 2,
    isActive: true,
    isProvisional: true,
  },
  {
    id: 'prod-q3',
    name: 'Quadro Monocromo Arquitetura',
    categorySlug: 'quadros',
    tagline: 'Perspectivas brutas e luz natural',
    description: 'Fotografia arquitetônica artística de alto contraste com paspatur branco museu.',
    imageUrl: '/images/demo/quadro-arquitetura.jpg',
    order: 3,
    isActive: true,
    isProvisional: true,
  },

  // Canecas Personalizadas
  {
    id: 'prod-c1',
    name: 'Caneca Pure White Signature',
    categorySlug: 'canecas',
    tagline: 'Cerâmica alva com faixa de impressão 20 × 9 cm',
    description: 'Base padrão utilizada em nosso estúdio para personalização full-bleed em sublimação HD.',
    featuredBadge: 'Modelo Base 3D',
    imageUrl: '/images/demo/caneca-branca.jpg',
    order: 1,
    isActive: true,
    isProvisional: true,
  },
  {
    id: 'prod-c2',
    name: 'Caneca Black Matte Ceramic',
    categorySlug: 'canecas',
    tagline: 'Acabamento acetinado toque suave',
    description: 'Combinação refinada para artes em tons metálicos ou inscrições tipográficas sóbrias.',
    imageUrl: '/images/demo/caneca-matte.jpg',
    order: 2,
    isActive: true,
    isProvisional: true,
  },

  // Agendas & Planners
  {
    id: 'prod-p1',
    name: 'Executive Planner Anual Nobre',
    categorySlug: 'papelaria',
    tagline: 'Visão semanal com encadernação em couro vegetal',
    description: 'Hot-stamping dourado com monograma personalizado e fitilho em gorgurão acetinado.',
    featuredBadge: 'Mais Desejado',
    imageUrl: '/images/demo/planner-executivo.jpg',
    order: 1,
    isActive: true,
    isProvisional: true,
  },
  {
    id: 'prod-p2',
    name: 'Caderno de Notas Grid & Pautas',
    categorySlug: 'papelaria',
    tagline: 'Papel pólen soft 90g/m² com abertura plana 180°',
    description: 'Ideal para anotações estratégicas, croquis e planejamento diário de projetos criativos.',
    imageUrl: '/images/demo/caderno-pautado.jpg',
    order: 2,
    isActive: true,
    isProvisional: true,
  },

  // Artesanato em Madeira & Especiais
  {
    id: 'prod-m1',
    name: 'Suporte de Mesa em Cumaru Maciço',
    categorySlug: 'artesanato',
    tagline: 'Design ergonômico esculpido em bloco maciço',
    description: 'Tratamento com óleo mineral atóxico e cera de abelha silvestre. Acabamento sedoso ao toque.',
    featuredBadge: 'Madeira Maciça',
    imageUrl: '/images/demo/madeira-suporte.jpg',
    order: 1,
    isActive: true,
    isProvisional: true,
  },
  {
    id: 'prod-m2',
    name: 'Bandeja Organizadora de Escritório',
    categorySlug: 'artesanato',
    tagline: 'Compartimentos modulados com encaixes artesanais',
    description: 'Fabricada sob medida em peroba rosa de demolição com base aveludada antirrisco.',
    imageUrl: '/images/demo/madeira-organizador.jpg',
    order: 2,
    isActive: true,
    isProvisional: true,
  },
];

export function getActiveProductsByCategory(categorySlug: string): Product[] {
  return PRODUCTS
    .filter((product) => product.isActive && product.categorySlug === categorySlug)
    .sort((a, b) => a.order - b.order);
}
