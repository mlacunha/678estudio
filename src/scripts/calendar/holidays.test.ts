import { describe, expect, it } from 'vitest';
import { computeEasterSunday, getGoodFriday, getHolidaysForYear } from './holidays';

describe('Brazilian calendar holidays', () => {
  it('it should return exactly the 9 federal national holidays without optional or religious dates by default', () => {
    const holidays = getHolidaysForYear(2027);
    expect(holidays).toHaveLength(9);
    expect(holidays.every(h => h.category === 'federal-national')).toBe(true);
    expect(holidays.some(h => h.name.includes('Consciência Negra') && h.month === 11 && h.day === 20)).toBe(true);
    expect(holidays.some(h => h.name.includes('Sexta-feira Santa'))).toBe(false);
    expect(holidays.some(h => h.name.includes('Carnaval'))).toBe(false);
    expect(holidays.some(h => h.name.includes('Corpus Christi'))).toBe(false);
  });

  it('it should include Good Friday only as religious category when explicitly requested', () => {
    expect(computeEasterSunday(2027)).toEqual({ month: 3, day: 28 });
    expect(getGoodFriday(2027)).toMatchObject({
      month: 3,
      day: 26,
      category: 'religious',
    });

    const withGoodFriday = getHolidaysForYear(2027, {
      includeFederalHolidays: true,
      includeGoodFriday: true,
    });
    expect(withGoodFriday).toHaveLength(10);
    const gf = withGoodFriday.find(h => h.name === 'Sexta-feira Santa');
    expect(gf?.category).toBe('religious');
  });

  it('it should allow disabling federal holidays independently', () => {
    const onlyReligious = getHolidaysForYear(2028, {
      includeFederalHolidays: false,
      includeGoodFriday: true,
    });
    expect(onlyReligious).toHaveLength(1);
    expect(onlyReligious[0]).toMatchObject({ month: 4, day: 14, category: 'religious' });
  });
});
