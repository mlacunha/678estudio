import { describe, expect, it } from 'vitest';
import { buildAnnualCalendarData, getDaysInMonth, getWeekdayLabels, isLeapYear } from './dateEngine';

describe('calendar dateEngine', () => {
  it('it should detect leap years accurately including century rules', () => {
    expect(isLeapYear(2027)).toBe(false);
    expect(isLeapYear(2028)).toBe(true);
    expect(isLeapYear(2032)).toBe(true);
    expect(isLeapYear(2100)).toBe(false);
    expect(isLeapYear(2000)).toBe(true);
  });

  it('it should return 28 days in February 2027 and 29 days in February 2028', () => {
    expect(getDaysInMonth(2027, 2)).toBe(28);
    expect(getDaysInMonth(2028, 2)).toBe(29);
    const cal2027 = buildAnnualCalendarData({ year: 2027 });
    const cal2028 = buildAnnualCalendarData({ year: 2028 });
    expect(cal2027.totalDays).toBe(365);
    expect(cal2028.totalDays).toBe(366);
    expect(cal2027.months[1].daysInMonth).toBe(28);
    expect(cal2028.months[1].daysInMonth).toBe(29);
  });

  it('it should place January 1, 2027 (Friday) in the right column for Sunday and Monday week starts', () => {
    expect(getWeekdayLabels('sunday')[0]).toBe('D');
    expect(getWeekdayLabels('monday')[0]).toBe('S');

    const sundayStart = buildAnnualCalendarData({ year: 2027, weekStart: 'sunday' });
    const janFirstWeekSun = sundayStart.months[0].weeks[0];
    // Sun=0, Mon=1, Tue=2, Wed=3, Thu=4, Fri=5 (day 1), Sat=6 (day 2)
    expect(janFirstWeekSun.map(c => c.day)).toEqual([null, null, null, null, null, 1, 2]);

    const mondayStart = buildAnnualCalendarData({ year: 2027, weekStart: 'monday' });
    const janFirstWeekMon = mondayStart.months[0].weeks[0];
    // Mon=0, Tue=1, Wed=2, Thu=3, Fri=4 (day 1), Sat=5 (day 2), Sun=6 (day 3)
    expect(janFirstWeekMon.map(c => c.day)).toEqual([null, null, null, null, 1, 2, 3]);
  });

  it('it should distribute all days of all 12 months sequentially without gaps', () => {
    const cal = buildAnnualCalendarData({ year: 2027, weekStart: 'sunday' });
    expect(cal.months).toHaveLength(12);
    const totalRenderedDays = cal.months.reduce(
      (sum, m) => sum + m.weeks.flat().filter(c => c.day !== null).length,
      0,
    );
    expect(totalRenderedDays).toBe(365);
  });
});
