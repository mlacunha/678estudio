import type { CalendarHoliday } from './types';

interface FixedFederalHolidayDef {
  month: number;
  day: number;
  name: string;
  source: string;
}

/**
 * Feriados nacionais federais brasileiros definidos por lei federal.
 * Pontos facultativos (Carnaval, Corpus Christi) e feriados estaduais/municipais
 * não são incluídos automaticamente.
 */
export const BRAZILIAN_FEDERAL_HOLIDAYS: readonly FixedFederalHolidayDef[] = [
  { month: 1, day: 1, name: 'Confraternização Universal', source: 'Lei nº 662/1949' },
  { month: 4, day: 21, name: 'Tiradentes', source: 'Lei nº 1.266/1950; Lei nº 10.607/2002' },
  { month: 5, day: 1, name: 'Dia do Trabalho', source: 'Lei nº 662/1949' },
  { month: 9, day: 7, name: 'Independência do Brasil', source: 'Lei nº 662/1949' },
  { month: 10, day: 12, name: 'Nossa Senhora Aparecida', source: 'Lei nº 6.802/1980' },
  { month: 11, day: 2, name: 'Finados', source: 'Lei nº 10.607/2002' },
  { month: 11, day: 15, name: 'Proclamação da República', source: 'Lei nº 662/1949' },
  { month: 11, day: 20, name: 'Consciência Negra', source: 'Lei nº 14.759/2023' },
  { month: 12, day: 25, name: 'Natal', source: 'Lei nº 662/1949' },
];

/** Algoritmo gregoriano anônimo (Meeus/Jones/Butcher) para o Domingo de Páscoa. */
export function computeEasterSunday(year: number): { month: number; day: number } {
  const a = year % 19;
  const b = Math.floor(year / 100);
  const c = year % 100;
  const d = Math.floor(b / 4);
  const e = b % 4;
  const f = Math.floor((b + 8) / 25);
  const g = Math.floor((b - f + 1) / 3);
  const h = (19 * a + b - d - g + 15) % 30;
  const i = Math.floor(c / 4);
  const k = c % 4;
  const l = (32 + 2 * e + 2 * i - h - k) % 7;
  const m = Math.floor((a + 11 * h + 22 * l) / 451);
  const month = Math.floor((h + l - 7 * m + 114) / 31);
  const day = ((h + l - 7 * m + 114) % 31) + 1;
  return { month, day };
}

/** Data religiosa móvel opcional: Sexta-feira Santa (2 dias antes da Páscoa). */
export function getGoodFriday(year: number): CalendarHoliday {
  const easter = computeEasterSunday(year);
  const dt = new Date(Date.UTC(year, easter.month - 1, easter.day));
  dt.setUTCDate(dt.getUTCDate() - 2);
  return {
    month: dt.getUTCMonth() + 1,
    day: dt.getUTCDate(),
    name: 'Sexta-feira Santa',
    category: 'religious',
    source: 'Data religiosa móvel (opcional; não classificada como feriado federal)',
  };
}

export interface HolidayQueryOptions {
  includeFederalHolidays?: boolean;
  includeGoodFriday?: boolean;
}

/** Retorna a lista ordenada de feriados/datas para o ano conforme seleção explícita. */
export function getHolidaysForYear(year: number, options: HolidayQueryOptions = {}): CalendarHoliday[] {
  const { includeFederalHolidays = true, includeGoodFriday = false } = options;
  const list: CalendarHoliday[] = [];

  if (includeFederalHolidays) {
    for (const item of BRAZILIAN_FEDERAL_HOLIDAYS) {
      list.push({
        month: item.month,
        day: item.day,
        name: item.name,
        category: 'federal-national',
        source: item.source,
      });
    }
  }

  if (includeGoodFriday) {
    list.push(getGoodFriday(year));
  }

  return list.sort((a, b) => (a.month - b.month) || (a.day - b.day));
}
