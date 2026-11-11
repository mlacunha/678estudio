export const plannerYears = [2027, 2028];

export const plannerModels = {
  'planner-essencial': {
    label: 'Planner Essencial',
    detail: 'Organização pessoal, profissional e financeira completa',
  },
};

export const plannerModes = {
  dated: {
    label: 'Datado',
    detail: 'Calendários reais e semanas estruturadas pelo calendário oficial',
  },
  undated: {
    label: 'Não datado',
    detail: 'Ator temporal: inicie em qualquer mês com preenchimento manual guiado',
  },
};

export const plannerFormats = {
  a5: {
    label: 'A5',
    detail: '14,8 × 21 cm (abertura semanal contínua em duas páginas)',
  },
};

export const plannerStyles = {
  classic: {
    label: 'Clássico',
    detail: 'Serifas equilibradas, linhas pontilhadas e acentos dourados nobres',
    primary: '#1f2937',
    secondary: '#2563eb',
    accent: '#cca032',
  },
  commercial: {
    label: 'Comercial',
    detail: 'Traços sólidos, alta densidade e tipografia geométrica corporativa',
    primary: '#111111',
    secondary: '#374151',
    accent: '#0284c7',
  },
  feminine: {
    label: 'Feminino',
    detail: 'Linhas delicadas, paleta suave e detalhes elegantes e acolhedores',
    primary: '#4a3b4e',
    secondary: '#8c4f6e',
    accent: '#d9779f',
  },
};

export const plannerTypographies = {
  modern: {
    label: 'Moderna',
    detail: 'Inter: clareza, alta legibilidade e design contemporâneo',
    fontFamily: 'Inter',
    headingFamily: 'Inter',
  },
  geometric: {
    label: 'Geométrica',
    detail: 'Manrope: estética moderna, traços equilibrados e números precisos',
    fontFamily: 'Manrope',
    headingFamily: 'Manrope',
  },
  editorial: {
    label: 'Editorial',
    detail: 'DM Serif Display & DM Sans: sofisticação clássica e leitura refinada',
    fontFamily: 'DM Sans',
    headingFamily: 'DM Serif Display',
  },
};

export const plannerSections = [
  { id: 'abertura', label: 'Abertura & Identificação', detail: 'Página de rosto e dados de contato' },
  { id: 'anual', label: 'Planejamento Anual', detail: 'Visão de 12 meses e metas estratégicas' },
  { id: 'mensal', label: 'Planejamento Mensal', detail: 'Calendário do mês, prioridades e compromissos' },
  { id: 'semanal', label: 'Planejamento Semanal', detail: 'Semana em duas páginas A5 consecutivas' },
  { id: 'habitos', label: 'Controle de Hábitos', detail: 'Habit tracker mensal com 31 dias' },
  { id: 'financeiro', label: 'Controle Financeiro', detail: 'Receitas, despesas, contas e balanço mensal' },
  { id: 'revisao', label: 'Revisão Mensal', detail: 'Avaliação de resultados e aprendizados' },
  { id: 'anotacoes', label: 'Anotações', detail: 'Páginas pautadas e pontilhadas para notas' },
];

export const maxPlannerLogoBytes = 2 * 1024 * 1024;
export const plannerLogoTypes = ['image/png', 'image/jpeg'];

