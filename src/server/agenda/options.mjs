export const agendaYears = [2027, 2028];
export const agendaTemplates = {
  'agenda-classica-v1': 'classic-v1.typ',
  'agenda-classica-v2': 'classic.typ',
  'agenda-juridica-v1': 'juridica.typ',
};
export const legalAgendaTemplate = 'agenda-juridica-v1';
export const legalAgendaPalettes = {
  blue: { label: 'Azul', primary: '#232323', secondary: '#2677a0', tint: '#d8effb' },
  gray: { label: 'Cinza', primary: '#232323', secondary: '#646464', tint: '#e0e0e0' },
  lilac: { label: 'Lilás', primary: '#232323', secondary: '#8554a0', tint: '#f7e8fd' },
  pink: { label: 'Rosa', primary: '#232323', secondary: '#a04e72', tint: '#ffe7f0' },
  green: { label: 'Verde', primary: '#232323', secondary: '#267055', tint: '#cdf2e1' },
};
export const agendaLayouts = {
  'daily-1dpp': { label: 'Um dia por página', detail: 'Uma página inteira para cada dia' },
  'daily-2dpp': { label: 'Dois dias por página', detail: 'Dois dias lado a lado' },
  weekly: { label: 'Semanal', detail: 'A semana inteira em uma página' },
};
export const agendaFormats = {
  a5: { label: 'A5', detail: '14,8 × 21 cm' },
};
export const agendaStyles = {
  classic: { label: 'Clássico', detail: 'Serifas e linhas pontilhadas', primary: '#1f2937', secondary: '#2563eb' },
  commercial: { label: 'Comercial', detail: 'Traços sólidos e títulos marcantes', primary: '#111111', secondary: '#333333' },
  feminine: { label: 'Feminino', detail: 'Letra manuscrita e detalhes delicados', primary: '#5e548e', secondary: '#a13d83' },
};
export const maxAgendaLogoBytes = 2 * 1024 * 1024;
export const agendaLogoTypes = ['image/png', 'image/jpeg'];
