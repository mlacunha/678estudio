export const notebookModels = {
  'caderno-receitas': {
    id: 'caderno-receitas',
    label: 'Caderno de Receitas',
    subtitle: 'Gastronomia, fichas estruturadas e índice culinário',
    detail: '140 páginas A5 com guia de medidas, índice de 120 receitas, 120 fichas completas e notas gastronômicas.',
    defaultTitle: 'Caderno de Receitas',
    totalPages: 140,
  },
  'diario-pessoal': {
    id: 'diario-pessoal',
    label: 'Diário Pessoal',
    subtitle: 'Escrita livre atemporal, reflexões e memórias do dia',
    detail: '160 páginas A5 não datadas com abertura afetiva, 148 páginas de escrita livre com box de reflexão e páginas de citações.',
    defaultTitle: 'Diário Pessoal',
    totalPages: 160,
  },
  'livro-memorias': {
    id: 'livro-memorias',
    label: 'Livro de Memórias',
    subtitle: '52 aberturas duplas para fotos, relatos e recordações',
    detail: '120 páginas A5 com dedicatória, guia afetivo, 52 aberturas duplas (página par com foto/local e ímpar com relato) e recordações especiais.',
    defaultTitle: 'Livro de Memórias',
    totalPages: 120,
  },
};

export const notebookFormats = {
  a5: {
    label: 'A5 (148 × 210 mm)',
    detail: 'Miolo editorial com margem interna de 20 mm para encadernação.',
  },
};

export const notebookStyles = {
  classic: {
    label: 'Clássico',
    detail: 'Grafite profundo e dourado suave para leitura serena e atemporal.',
    primary: '#1f2937',
    secondary: '#4b5563',
    accent: '#b0892f',
  },
  commercial: {
    label: 'Executivo',
    detail: 'Azul-marinho editorial e ardósia limpa com estrutura nítida.',
    primary: '#0f172a',
    secondary: '#1e40af',
    accent: '#0284c7',
  },
  feminine: {
    label: 'Afetivo',
    detail: 'Vinho ameixa e terracota suave com atmosfera acolhedora.',
    primary: '#4a1d2f',
    secondary: '#883955',
    accent: '#b56576',
  },
};

export const notebookTypographies = {
  modern: {
    label: 'Moderna',
    detail: 'Inter sem serifa, limpa e versátil para escrita diária.',
  },
  geometric: {
    label: 'Geométrica',
    detail: 'Manrope contemporânea com traço equilibrado e números claros.',
  },
  editorial: {
    label: 'Editorial',
    detail: 'Títulos em DM Serif Display e corpo em DM Sans com assinatura clássica.',
  },
};

export const notebookSectionsByModel = {
  'caderno-receitas': [
    { id: 'abertura', label: 'Abertura & Identificação', detail: 'Página de rosto personalizada' },
    { id: 'medidas', label: 'Medidas & Equivalências', detail: 'Tabelas de conversão culinária' },
    { id: 'indice', label: 'Índice de Receitas', detail: 'Sumário numerado (001 a 120)' },
    { id: 'ficha', label: 'Ficha de Receita (Esquerda)', detail: 'Ingredientes em 2 colunas, preparo e dicas' },
    { id: 'ficha-par', label: 'Ficha de Receita (Direita)', detail: 'Ficha complementar numerada' },
    { id: 'anotacoes', label: 'Notas & Testes de Cardápio', detail: 'Páginas finais pontilhadas e pautadas' },
  ],
  'diario-pessoal': [
    { id: 'abertura', label: 'Abertura & Identificação', detail: 'Página inicial do proprietário' },
    { id: 'intencoes', label: 'Intenções & Ponto de Partida', detail: 'Espaço inaugural para o ciclo de escrita' },
    { id: 'escrita', label: 'Escrita Livre & Reflexão (Par)', detail: 'Data opcional, 21 pautas e box de reflexão' },
    { id: 'escrita-impar', label: 'Escrita Livre & Reflexão (Ímpar)', detail: 'Página espelhada para escrita contínua' },
    { id: 'citacoes', label: 'Citações & Pensamentos', detail: 'Quadros para frases e descobertas' },
    { id: 'anotacoes', label: 'Memórias Breves & Notas', detail: 'Fechamento livre do diário' },
  ],
  'livro-memorias': [
    { id: 'abertura', label: 'Apresentação', detail: 'Página de rosto do Livro de Memórias' },
    { id: 'dedicatoria', label: 'Dedicatória & Guia Afetivo', detail: 'Mensagem especial ou linhas caligráficas' },
    { id: 'sumario', label: 'Sumário de 52 Momentos', detail: 'Índice dos acontecimentos registrados' },
    { id: 'memoria-esquerda', label: 'Acontecimento · Página Par (Foto & Local)', detail: 'Moldura de foto, data, local e presentes' },
    { id: 'memoria-direita', label: 'Acontecimento · Página Ímpar (Relato)', detail: 'História completa e recordações especiais' },
    { id: 'recordacoes', label: 'Recordações Especiais & Cartas', detail: 'Páginas finais para lembranças e notas' },
  ],
};

export const notebookTotalPages = {
  'caderno-receitas': 140,
  'diario-pessoal': 160,
  'livro-memorias': 120,
};

export const maxNotebookLogoBytes = 2 * 1024 * 1024;
export const notebookLogoTypes = new Set(['image/png', 'image/jpeg']);

