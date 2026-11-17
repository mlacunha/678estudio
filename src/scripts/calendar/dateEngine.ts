import { getHolidaysForYear } from './holidays';
import type {
  AnnualCalendarData,
  CalendarDayCell,
  CalendarHoliday,
  CalendarMonthGrid,
  WeekStart,
} from './types';

export const CALENDAR_MONTH_NAMES = [
  'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro',
] as const;

export const CALENDAR_MONTH_SHORTS = [
  'Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun',
  'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez',
] as const;

export function isLeapYear(year: number): boolean {
  if (year % 400 === 0) return true;
  if (year % 100 === 0) return false;
  return year % 4 === 0;
}

export function getDaysInMonth(year: number, month: number): number {
  if (month === 2) return isLeapYear(year) ? 29 : 28;
  if (month === 4 || month === 6 || month === 9 || month === 11) return 30;
  return 31;
}

export function getWeekdayLabels(weekStart: WeekStart): string[] {
  return weekStart === 'monday'
    ? ['S', 'T', 'Q', 'Q', 'S', 'S', 'D']
    : ['D', 'S', 'T', 'Q', 'Q', 'S', 'S'];
}

export function buildMonthGrid(
  year: number,
  month: number,
  weekStart: WeekStart,
  holidays: CalendarHoliday[],
): CalendarMonthGrid {
  const daysInMonth = getDaysInMonth(year, month);
  const firstWeekday = new Date(Date.UTC(year, month - 1, 1)).getUTCDay(); // 0 = Sun .. 6 = Sat
  const leadingEmpty = weekStart === 'monday' ? (firstWeekday + 6) % 7 : firstWeekday;

  const holidayMap = new Map<number, CalendarHoliday>();
  for (const h of holidays) {
    if (h.month === month) holidayMap.set(h.day, h);
  }

  const makeEmptyCell = (col: number): CalendarDayCell => {
    const weekdayIndex = weekStart === 'monday' ? (col + 1) % 7 : col;
    return {
      day: null,
      month,
      year,
      weekdayIndex,
      isWeekend: weekdayIndex === 0 || weekdayIndex === 6,
      isSunday: weekdayIndex === 0,
      holiday: null,
    };
  };

  const weeks: CalendarDayCell[][] = [];
  let currentWeek: CalendarDayCell[] = [];
  for (let col = 0; col < leadingEmpty; col++) {
    currentWeek.push(makeEmptyCell(col));
  }

  for (let day = 1; day <= daysInMonth; day++) {
    const weekdayIndex = new Date(Date.UTC(year, month - 1, day)).getUTCDay();
    currentWeek.push({
      day,
      month,
      year,
      weekdayIndex,
      isWeekend: weekdayIndex === 0 || weekdayIndex === 6,
      isSunday: weekdayIndex === 0,
      holiday: holidayMap.get(day) ?? null,
    });
    if (currentWeek.length === 7) {
      weeks.push(currentWeek);
      currentWeek = [];
    }
  }

  if (currentWeek.length > 0) {
    while (currentWeek.length < 7) {
      currentWeek.push(makeEmptyCell(currentWeek.length));
    }
    weeks.push(currentWeek);
  }

  return {
    month,
    name: CALENDAR_MONTH_NAMES[month - 1],
    shortName: CALENDAR_MONTH_SHORTS[month - 1],
    daysInMonth,
    weeks,
  };
}

export interface AnnualDataOptions {
  year: number;
  weekStart?: WeekStart;
  includeFederalHolidays?: boolean;
  includeGoodFriday?: boolean;
}

/** Constrói toda a grade anual de 12 meses com controle explícito de início da semana e feriados. */
export function buildAnnualCalendarData(options: AnnualDataOptions): AnnualCalendarData {
  const year = Math.max(2024, Math.min(2100, Math.floor(options.year)));
  const weekStart = options.weekStart ?? 'sunday';
  const holidays = getHolidaysForYear(year, {
    includeFederalHolidays: options.includeFederalHolidays ?? true,
    includeGoodFriday: options.includeGoodFriday ?? false,
  });

  const months: CalendarMonthGrid[] = [];
  for (let m = 1; m <= 12; m++) {
    months.push(buildMonthGrid(year, m, weekStart, holidays));
  }

  const isLeap = isLeapYear(year);
  return {
    year,
    isLeap,
    totalDays: isLeap ? 366 : 365,
    weekStart,
    weekdayLabels: getWeekdayLabels(weekStart),
    holidays,
    months,
  };
}
