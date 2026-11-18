// A family owns its route; models and visual styles stay inside its customizer.
export const stationeryFamilies = {
  'family-agendas': { route: '/personalizar/agenda', available: true, models: ['agenda-classica-v2', 'agenda-juridica-v1'] },
  'family-planners': { route: '/personalizar/planner', available: true, models: ['planner-essencial', 'planner-combo-v1'] },
  'family-cadernos': {
    route: '/personalizar/caderno',
    available: true,
    models: ['caderno-receitas', 'diario-pessoal', 'livro-memorias'],
  },
  'family-calendarios': {
    route: '/personalizar/calendario',
    available: true,
    models: ['calendario-anual', 'calendario-mensal-parede', 'calendario-mesa-wireo'],
  },
} as const;

export function stationeryCustomizer(id: string) {
  const family = stationeryFamilies[id as keyof typeof stationeryFamilies];
  return family?.available ? family.route : undefined;
}
