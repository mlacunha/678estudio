// Options and constants for shared cover personalization (Agendas, Planners, Cadernos)

export const coverStyles = {
  classic: {
    label: 'Clássica',
    subtitle: 'Composição editorial refinada com moldura clássica e tipografia elegante.',
    description: 'Bordas ornamentadas discretas, serifas refinadas e nome em destaque.',
  },
  modern: {
    label: 'Moderna',
    subtitle: 'Minimalismo contemporâneo com blocos geométricos e tipografia limpa.',
    description: 'Composição assimétrica elegante, cores contrastantes e formas geométricas.',
  },
  photographic: {
    label: 'Fotográfica',
    subtitle: 'Fotografia ou arte personalizada com enquadramento e tipografia integrada.',
    description: 'Espaço nobre para sua foto ou arte, com proteção de contraste para os textos.',
  },
};

export const coverTypographies = {
  editorial: {
    label: 'Editorial',
    detail: 'Serifas literárias e clássicas (DM Serif Display).',
    headingFont: 'DM Serif Display',
    bodyFont: 'Inter',
  },
  geometric: {
    label: 'Geométrica',
    detail: 'Estrutura geométrica moderna e equilibrada (Manrope/DMSans).',
    headingFont: 'Manrope',
    bodyFont: 'Inter',
  },
  modern: {
    label: 'Moderna',
    detail: 'Sem serifa funcional, limpa e legível (Inter).',
    headingFont: 'Inter',
    bodyFont: 'Inter',
  },
};

export const coverBleedOptions = {
  '3mm': {
    label: '3 mm (padrão gráfico)',
    pt: 8.5,
    mm: 3,
    description: 'Sangria clássica de 3 mm em cada borda.',
  },
  '5mm': {
    label: '5 mm (segurança ampliada)',
    pt: 14.17,
    mm: 5,
    description: 'Sangria expandida para cortes industriais ou empastamento rígido.',
  },
};

export const defaultCoverColors = {
  primary: '#1e293b', // Azul ardósia profundo
  secondary: '#f8fafc', // Branco gelo
  text: '#ffffff',
  accent: '#c5a059', // Dourado suave
};

export const defaultCoverPalettes = [
  {
    id: 'navy-gold',
    label: 'Azul & Ouro',
    primary: '#1e293b',
    secondary: '#f8fafc',
    text: '#ffffff',
    accent: '#d4af37',
  },
  {
    id: 'wine-ivory',
    label: 'Vinho & Marfim',
    primary: '#4a1525',
    secondary: '#fffdfa',
    text: '#ffffff',
    accent: '#e2c499',
  },
  {
    id: 'forest-cream',
    label: 'Verde Floresta & Creme',
    primary: '#1c3327',
    secondary: '#fbfaf5',
    text: '#ffffff',
    accent: '#82a37e',
  },
  {
    id: 'terracotta-sand',
    label: 'Terracota & Areia',
    primary: '#7c3a27',
    secondary: '#fdfbf7',
    text: '#ffffff',
    accent: '#d99b7d',
  },
  {
    id: 'monochrome-slate',
    label: 'Grafite & Branco',
    primary: '#18181b',
    secondary: '#fafafa',
    text: '#ffffff',
    accent: '#a1a1aa',
  },
];
