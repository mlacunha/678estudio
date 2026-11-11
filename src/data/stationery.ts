// A family owns its route; models and visual styles stay inside its customizer.
export const stationeryFamilies = {
  'family-agendas': { route: '/personalizar/agenda', available: true, models: ['agenda-classica-v2'] },
  'family-planners': { route: '/personalizar/planner', available: true, models: ['planner-essencial'] },
  'family-cadernos': { route: '/personalizar/caderno', available: false, models: [] },
} as const;

export function stationeryCustomizer(id: string) {
  const family = stationeryFamilies[id as keyof typeof stationeryFamilies];
  return family?.available ? family.route : undefined;
}
