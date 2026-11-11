export interface DayInfo {
  day: number;
  month: number;
  year: number;
  dayOfWeek: number; // 0 = Domingo, 1 = Segunda, ..., 6 = Sábado
  dayOfWeekName: string;
}

export interface WeekSpread {
  weekNumber: number;
  monthName: string;
  leftPage: DayInfo[]; // Seg, Ter, Qua
  rightPage: DayInfo[]; // Qui, Sex, Sab, Dom
}

export interface PlannerDay {
  day: number | null;
  month: number;
  year: number | null;
  monthShort: string;
  weekday: string;
  dateStr: string;
}

export interface PlannerWeek {
  weekNumber: number;
  leftDays: PlannerDay[];
  rightDays: PlannerDay[];
}

export interface PlannerMonthData {
  monthNumber: number;
  monthName: string;
  weeks: PlannerWeek[];
}

export interface PlannerYearData {
  year?: number;
  isLeap?: boolean;
  totalWeeks: number;
  expectedDays?: number;
  coveredDaysCount?: number;
  months: PlannerMonthData[];
}

export const MONTH_NAMES = [
  'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro',
];

export const MONTH_SHORTS = [
  'Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun',
  'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez',
];

export const WEEKDAY_NAMES = [
  'Segunda-feira', 'Terça-feira', 'Quarta-feira',
  'Quinta-feira', 'Sexta-feira', 'Sábado', 'Domingo',
];

export const SHORT_WEEKDAY_NAMES = ['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb', 'Dom'];

export function isLeapYear(year: number): boolean {
  if (year % 400 === 0) return true;
  if (year % 100 === 0) return false;
  return year % 4 === 0;
}

export function getDaysInMonth(year: number, month: number): number {
  if (month === 2) return isLeapYear(year) ? 29 : 28;
  if ([4, 6, 9, 11].includes(month)) return 30;
  return 31;
}

export function getMonthMatrix(year: number, month: number): (number | null)[][] {
  const daysInMonth = getDaysInMonth(year, month);
  const firstDay = new Date(year, month - 1, 1).getDay(); // 0 = Dom, 1 = Seg...
  const firstCol = (firstDay + 6) % 7; // Ajustar para Segunda = 0

  const weeks: (number | null)[][] = [];
  let currentWeek: (number | null)[] = Array(firstCol).fill(null);

  for (let d = 1; d <= daysInMonth; d++) {
    currentWeek.push(d);
    if (currentWeek.length === 7) {
      weeks.push(currentWeek);
      currentWeek = [];
    }
  }

  if (currentWeek.length > 0) {
    while (currentWeek.length < 7) {
      currentWeek.push(null);
    }
    weeks.push(currentWeek);
  }

  return weeks;
}

export function generateYearWeeks(year: number): WeekSpread[] {
  const data = generatePlannerYearData(year);
  return data.months.flatMap((m) =>
    m.weeks.map((w) => ({
      weekNumber: w.weekNumber,
      monthName: m.monthName,
      leftPage: w.leftDays.map((d) => ({
        day: d.day ?? 1,
        month: d.month,
        year: d.year ?? year,
        dayOfWeek: WEEKDAY_NAMES.indexOf(d.weekday) + 1,
        dayOfWeekName: d.weekday,
      })),
      rightPage: w.rightDays.map((d) => ({
        day: d.day ?? 1,
        month: d.month,
        year: d.year ?? year,
        dayOfWeek: (WEEKDAY_NAMES.indexOf(d.weekday) + 1) % 7,
        dayOfWeekName: d.weekday,
      })),
    }))
  );
}

export function generatePlannerYearData(year: number): PlannerYearData {
  const isLeap = isLeapYear(year);
  const expectedDays = isLeap ? 366 : 365;

  let current = new Date(Date.UTC(year, 0, 1));
  const dayOfWeek = current.getUTCDay();
  const diffToMonday = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
  current.setUTCDate(current.getUTCDate() + diffToMonday);

  const months: PlannerMonthData[] = MONTH_NAMES.map((name, i) => ({
    monthNumber: i + 1,
    monthName: name,
    weeks: [],
  }));

  let weekNum = 1;
  const coveredDays = new Set<string>();

  while (true) {
    const leftDays: PlannerDay[] = [];
    for (let i = 0; i < 3; i++) {
      const y = current.getUTCFullYear();
      const m = current.getUTCMonth() + 1;
      const d = current.getUTCDate();
      const dateStr = `${y}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
      leftDays.push({
        day: d,
        month: m,
        year: y,
        monthShort: MONTH_SHORTS[m - 1],
        weekday: WEEKDAY_NAMES[i],
        dateStr,
      });
      if (y === year) coveredDays.add(dateStr);
      current.setUTCDate(current.getUTCDate() + 1);
    }

    const rightDays: PlannerDay[] = [];
    for (let i = 3; i < 7; i++) {
      const y = current.getUTCFullYear();
      const m = current.getUTCMonth() + 1;
      const d = current.getUTCDate();
      const dateStr = `${y}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
      rightDays.push({
        day: d,
        month: m,
        year: y,
        monthShort: MONTH_SHORTS[m - 1],
        weekday: WEEKDAY_NAMES[i],
        dateStr,
      });
      if (y === year) coveredDays.add(dateStr);
      current.setUTCDate(current.getUTCDate() + 1);
    }

    const thursday = rightDays[0];
    let assignedMonth = thursday.month;
    if (thursday.year !== null && thursday.year < year) assignedMonth = 1;
    if (thursday.year !== null && thursday.year > year) assignedMonth = 12;

    months[assignedMonth - 1].weeks.push({
      weekNumber: weekNum,
      leftDays,
      rightDays,
    });

    weekNum++;
    const sunday = rightDays[3];
    if (sunday.year !== null && (sunday.year > year || (sunday.year === year && sunday.month === 12 && sunday.day === 31))) {
      break;
    }
  }

  return {
    year,
    isLeap,
    expectedDays,
    coveredDaysCount: coveredDays.size,
    totalWeeks: weekNum - 1,
    months,
  };
}

export function generatePlannerUndatedData(): PlannerYearData {
  const weeksPerMonth = [5, 4, 4, 5, 4, 4, 5, 4, 4, 5, 4, 4];
  let weekNum = 1;

  const months: PlannerMonthData[] = Array.from({ length: 12 }, (_, i) => {
    const numWeeks = weeksPerMonth[i];
    const weeks: PlannerWeek[] = [];
    for (let w = 0; w < numWeeks; w++) {
      const leftDays: PlannerDay[] = [0, 1, 2].map((idx) => ({
        day: null,
        month: i + 1,
        year: null,
        monthShort: '',
        weekday: WEEKDAY_NAMES[idx],
        dateStr: '',
      }));
      const rightDays: PlannerDay[] = [3, 4, 5, 6].map((idx) => ({
        day: null,
        month: i + 1,
        year: null,
        monthShort: '',
        weekday: WEEKDAY_NAMES[idx],
        dateStr: '',
      }));
      weeks.push({ weekNumber: weekNum++, leftDays, rightDays });
    }
    return {
      monthNumber: i + 1,
      monthName: `Mês ${String(i + 1).padStart(2, '0')}`,
      weeks,
    };
  });

  return {
    totalWeeks: 52,
    months,
  };
}

export function generateUndatedWeekSpread(): {
  leftDays: string[];
  rightDays: string[];
} {
  return {
    leftDays: ['Segunda-feira', 'Terça-feira', 'Quarta-feira'],
    rightDays: ['Quinta-feira', 'Sexta-feira', 'Sábado', 'Domingo'],
  };
}
