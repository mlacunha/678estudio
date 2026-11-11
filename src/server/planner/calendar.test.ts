import { describe, it, expect } from 'vitest';
import {
  isLeapYear,
  getDaysInMonth,
  getMonthMatrix,
  generateYearWeeks,
  generatePlannerYearData,
  generatePlannerUndatedData,
  generateUndatedWeekSpread,
} from './calendar';

describe('Planner Calendar Module - Auditoria e Cobertura Integral', () => {
  describe('isLeapYear', () => {
    it('should correctly identify leap years', () => {
      expect(isLeapYear(2024)).toBe(true);
      expect(isLeapYear(2028)).toBe(true);
      expect(isLeapYear(2000)).toBe(true);
    });

    it('should correctly identify non-leap years', () => {
      expect(isLeapYear(2025)).toBe(false);
      expect(isLeapYear(2027)).toBe(false);
      expect(isLeapYear(2100)).toBe(false);
    });
  });

  describe('getDaysInMonth', () => {
    it('should return 29 days for February in leap year 2028', () => {
      expect(getDaysInMonth(2028, 2)).toBe(29);
    });

    it('should return 28 days for February in non-leap year 2027', () => {
      expect(getDaysInMonth(2027, 2)).toBe(28);
    });

    it('should return 31 days for January, March, May, July, August, October, December', () => {
      [1, 3, 5, 7, 8, 10, 12].forEach((m) => {
        expect(getDaysInMonth(2027, m)).toBe(31);
      });
    });

    it('should return 30 days for April, June, September, November', () => {
      [4, 6, 9, 11].forEach((m) => {
        expect(getDaysInMonth(2027, m)).toBe(30);
      });
    });
  });

  describe('getMonthMatrix', () => {
    it('should construct valid calendar grid with 7 columns', () => {
      const grid = getMonthMatrix(2027, 1);
      expect(grid.length).toBeGreaterThanOrEqual(4);
      grid.forEach((week) => {
        expect(week.length).toBe(7);
      });
    });

    it('should contain all days from 1 to daysInMonth without gaps', () => {
      const grid = getMonthMatrix(2027, 5);
      const days = grid.flat().filter((d): d is number => d !== null);
      expect(days.length).toBe(31);
      expect(days[0]).toBe(1);
      expect(days[days.length - 1]).toBe(31);
    });
  });

  describe('Auditoria de Cobertura Integral Anual (2027 e 2028)', () => {
    it('deve cobrir todos os 365 dias de 2027 sem omissões nem duplicações', () => {
      const data2027 = generatePlannerYearData(2027);
      expect(data2027.totalWeeks).toBe(53);
      expect(data2027.coveredDaysCount).toBe(365);
      expect(data2027.isLeap).toBe(false);

      const allDays = data2027.months.flatMap((m) =>
        m.weeks.flatMap((w) => [...w.leftDays, ...w.rightDays])
      );

      const daysIn2027 = allDays.filter((d) => d.year === 2027);
      expect(daysIn2027.length).toBe(365);

      const uniqueDateStrings = new Set(daysIn2027.map((d) => d.dateStr));
      expect(uniqueDateStrings.size).toBe(365);

      // Verificar primeiro e último dia
      expect(daysIn2027.some((d) => d.dateStr === '2027-01-01')).toBe(true);
      expect(daysIn2027.some((d) => d.dateStr === '2027-12-31')).toBe(true);
    });

    it('deve cobrir todos os 366 dias de 2028 (ano bissexto) sem omissões nem duplicações', () => {
      const data2028 = generatePlannerYearData(2028);
      expect(data2028.totalWeeks).toBe(53);
      expect(data2028.coveredDaysCount).toBe(366);
      expect(data2028.isLeap).toBe(true);

      const allDays = data2028.months.flatMap((m) =>
        m.weeks.flatMap((w) => [...w.leftDays, ...w.rightDays])
      );

      const daysIn2028 = allDays.filter((d) => d.year === 2028);
      expect(daysIn2028.length).toBe(366);

      const uniqueDateStrings = new Set(daysIn2028.map((d) => d.dateStr));
      expect(uniqueDateStrings.size).toBe(366);

      // Verificar 29 de fevereiro presente em 2028
      expect(daysIn2028.some((d) => d.dateStr === '2028-02-29')).toBe(true);
      expect(daysIn2028.some((d) => d.dateStr === '2028-01-01')).toBe(true);
      expect(daysIn2028.some((d) => d.dateStr === '2028-12-31')).toBe(true);
    });

    it('deve manter transições contínuas de semanas sem quebras de dia', () => {
      const data = generatePlannerYearData(2027);
      const allWeeks = data.months.flatMap((m) => m.weeks);

      for (let i = 0; i < allWeeks.length; i++) {
        const week = allWeeks[i];
        expect(week.leftDays.length).toBe(3); // Seg, Ter, Qua
        expect(week.rightDays.length).toBe(4); // Qui, Sex, Sáb, Dom
        expect(week.leftDays[0].weekday).toBe('Segunda-feira');
        expect(week.rightDays[3].weekday).toBe('Domingo');

        // Se não for a última semana, a próxima segunda-feira deve ser exatamente o dia após o domingo
        if (i < allWeeks.length - 1) {
          const sunday = week.rightDays[3];
          const nextMonday = allWeeks[i + 1].leftDays[0];
          const dSunday = new Date(`${sunday.dateStr}T12:00:00Z`);
          const dNextMonday = new Date(`${nextMonday.dateStr}T12:00:00Z`);
          const diffMs = dNextMonday.getTime() - dSunday.getTime();
          expect(diffMs).toBe(24 * 60 * 60 * 1000); // Exatamente 1 dia de diferença
        }
      }
    });

    it('deve gerar modelo não datado com exatamente 52 semanas estruturadas', () => {
      const undated = generatePlannerUndatedData();
      expect(undated.totalWeeks).toBe(52);
      expect(undated.months.length).toBe(12);

      const totalWeeksInMonths = undated.months.reduce((acc, m) => acc + m.weeks.length, 0);
      expect(totalWeeksInMonths).toBe(52);

      undated.months.forEach((m) => {
        expect([4, 5]).toContain(m.weeks.length);
        m.weeks.forEach((w) => {
          expect(w.leftDays.length).toBe(3);
          expect(w.rightDays.length).toBe(4);
          expect(w.leftDays[0].day).toBeNull();
        });
      });
    });
  });

  describe('generateYearWeeks e generateUndatedWeekSpread (compatibilidade retroativa)', () => {
    it('deve gerar 53 semanas contínuas em generateYearWeeks(2027)', () => {
      const weeks = generateYearWeeks(2027);
      expect(weeks.length).toBe(53);
    });

    it('deve prover cabeçalhos simétricos para a semana não datada', () => {
      const spread = generateUndatedWeekSpread();
      expect(spread.leftDays.length).toBe(3);
      expect(spread.rightDays.length).toBe(4);
      expect(spread.leftDays).toContain('Segunda-feira');
      expect(spread.rightDays).toContain('Domingo');
    });
  });
});
