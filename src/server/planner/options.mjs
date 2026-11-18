export const plannerYears = [2027, 2028];

export const plannerModels = {
  'planner-essencial': {
    label: 'Planner Essencial',
    detail: 'Organização pessoal, profissional e financeira completa',
    template: 'planner-essencial-v1',
    file: 'essencial.typ',
  },
  'planner-combo-v1': {
    label: 'Planner Harmonia',
    detail: 'Planejamento integrado, com organização pessoal, hábitos, finanças, bem-estar e reflexão.',
    tagline: 'Organize seus planos. Cultive seu equilíbrio.',
    template: 'planner-combo-v1',
    file: 'combo.typ',
  },
};

export const comboPalette = { primary: '#253638', secondary: '#385E58', accent: '#A75539' };

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

export const comboPreviewSections = [
  { id: 'abertura', page: 1, label: 'Identificação', detail: 'Abertura e dados de contato' },
  { id: 'anual', page: 2, label: 'Calendário anual', detail: 'Doze meses em uma página' },
  { id: 'trimestre', page: 4, label: 'Planejamento trimestral', detail: 'Marcos e prioridades por mês' },
  { id: 'economia', page: 8, label: 'Desafio de economia', detail: 'Metas e depósitos ao longo do ano' },
  { id: 'divisoria', page: 11, label: 'Abertura mensal', detail: 'Propósito e foco do mês' },
  { id: 'mensal', page: 12, label: 'Calendário mensal', detail: 'Segunda a quinta' },
  { id: 'mensal-direita', page: 13, label: 'Calendário mensal', detail: 'Sexta a domingo e lembretes' },
  { id: 'checklist', page: 14, label: 'Checklist', detail: 'Prioridades e compromissos' },
  { id: 'autoavaliacao', page: 15, label: 'Autoavaliação', detail: 'Oito áreas para acompanhar' },
  { id: 'habitos', page: 16, label: 'Hábitos', detail: 'Acompanhamento diário por mês' },
  { id: 'sono', page: 17, label: 'Sono', detail: 'Registro de horas por dia' },
  { id: 'financeiro', page: 18, label: 'Entradas', detail: 'Recebimentos do mês' },
  { id: 'saidas', page: 19, label: 'Saídas', detail: 'Despesas e categorias' },
  { id: 'cartoes', page: 20, label: 'Cartão 1', detail: 'Compras e parcelas' },
  { id: 'balanco', page: 22, label: 'Balanço mensal', detail: 'Totais, economia e saldo' },
  { id: 'anotacoes', page: 23, label: 'Notas', detail: 'Pauta para escrita livre' },
  { id: 'semanal', page: 24, label: 'Semana', detail: 'Segunda a quarta' },
  { id: 'semanal-direita', page: 25, label: 'Semana', detail: 'Quinta a domingo' },
  { id: 'revisao', page: 24, afterFirstMonthWeeks: true, label: 'Revisão do mês', detail: 'Resultados e próximos passos' },
  { id: 'cultura', page: 5, fromEnd: true, label: 'Registros culturais', detail: 'Livros, séries, filmes e música' },
];

export const maxPlannerLogoBytes = 2 * 1024 * 1024;
export const plannerLogoTypes = ['image/png', 'image/jpeg'];

