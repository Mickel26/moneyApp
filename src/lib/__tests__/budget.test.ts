import { describe, expect, it } from '@jest/globals';

import {
  addDays,
  chargeDayInPeriod,
  chargesInPeriod,
  dailyTotals,
  Expense,
  FixedCost,
  formatMoney,
  getPeriod,
  parseAmount,
  pluralize,
  relativeDayLabel,
  summarize,
  totalsByCategory,
} from '../budget';

let nextId = 0;
const expense = (day: string, zl: number, category = 'food'): Expense => ({
  id: String(nextId++),
  amount: Math.round(zl * 100),
  category,
  day,
  createdAt: 0,
});

describe('getPeriod', () => {
  it('uses the current month when today is on or after the start day', () => {
    expect(getPeriod('2026-10-03', 1)).toEqual({ start: '2026-10-01', end: '2026-11-01', totalDays: 31 });
    expect(getPeriod('2026-10-10', 10)).toEqual({ start: '2026-10-10', end: '2026-11-10', totalDays: 31 });
  });

  it('uses the previous month when today is before the start day', () => {
    expect(getPeriod('2026-10-03', 10)).toEqual({ start: '2026-09-10', end: '2026-10-10', totalDays: 30 });
  });

  it('wraps around the year boundary', () => {
    expect(getPeriod('2027-01-05', 15)).toEqual({ start: '2026-12-15', end: '2027-01-15', totalDays: 31 });
    expect(getPeriod('2026-12-20', 15)).toEqual({ start: '2026-12-15', end: '2027-01-15', totalDays: 31 });
  });

  it('handles February', () => {
    expect(getPeriod('2027-02-14', 1).totalDays).toBe(28);
    expect(getPeriod('2028-02-14', 1).totalDays).toBe(29);
  });

  it('clamps invalid start days', () => {
    expect(getPeriod('2026-10-03', 0).start).toBe('2026-10-01');
    expect(getPeriod('2026-10-30', 31).start).toBe('2026-10-28');
  });
});

describe('addDays', () => {
  it('crosses month boundaries and DST changes', () => {
    expect(addDays('2026-10-31', 1)).toBe('2026-11-01');
    expect(addDays('2026-03-29', -1)).toBe('2026-03-28');
    expect(addDays('2026-10-25', 1)).toBe('2026-10-26');
  });
});

describe('summarize', () => {
  const settings = { budget: 3100_00, periodStartDay: 1 }; // 100 zł/day in October

  it('splits the budget evenly when nothing is spent', () => {
    const s = summarize(settings, [], '2026-10-01');
    expect(s.daysLeft).toBe(31);
    expect(s.dayNumber).toBe(1);
    expect(s.dailyLimitToday).toBe(100_00);
    expect(s.leftToday).toBe(100_00);
    // Nothing spent today, so tomorrow the whole budget is split over 30 days.
    expect(s.limitFromTomorrow).toBe(Math.floor(3100_00 / 30));
    expect(s.status).toBe('good');
  });

  it('subtracts today spending from the daily limit, but keeps the limit stable during the day', () => {
    const s = summarize(settings, [expense('2026-10-01', 30), expense('2026-10-01', 20)], '2026-10-01');
    expect(s.spentToday).toBe(50_00);
    expect(s.dailyLimitToday).toBe(100_00);
    expect(s.leftToday).toBe(50_00);
    expect(s.remaining).toBe(3050_00);
    // 3050 zł over the remaining 30 days
    expect(s.limitFromTomorrow).toBe(Math.floor(3050_00 / 30));
  });

  it('lowers the daily limit after overspending on previous days', () => {
    const s = summarize(settings, [expense('2026-10-01', 400)], '2026-10-02');
    // 2700 zł left for 30 days
    expect(s.dailyLimitToday).toBe(90_00);
    expect(s.status).toBe('over');
  });

  it('raises the daily limit after saving on previous days', () => {
    const s = summarize(settings, [expense('2026-10-01', 10)], '2026-10-02');
    expect(s.dailyLimitToday).toBe(Math.floor(3090_00 / 30));
  });

  it('reports a negative amount left today when over the limit', () => {
    const s = summarize(settings, [expense('2026-10-01', 400), expense('2026-10-02', 150)], '2026-10-02');
    // 2700 zł for 30 days = 90 zł today
    expect(s.leftToday).toBe(-60_00);
    expect(s.status).toBe('over');
  });

  it('ignores expenses outside the current period', () => {
    const s = summarize(settings, [expense('2026-09-30', 999), expense('2026-11-01', 999)], '2026-10-15');
    expect(s.spent).toBe(0);
  });

  it('never suggests a negative daily limit once the budget is gone', () => {
    const s = summarize(settings, [expense('2026-10-01', 5000)], '2026-10-10');
    expect(s.remaining).toBe(-1900_00);
    expect(s.dailyLimitToday).toBe(0);
    expect(s.limitFromTomorrow).toBe(0);
  });

  it('has no "from tomorrow" limit on the last day', () => {
    const s = summarize(settings, [], '2026-10-31');
    expect(s.daysLeft).toBe(1);
    expect(s.limitFromTomorrow).toBeNull();
    expect(s.dailyLimitToday).toBe(3100_00);
  });

  it('warns when slightly ahead of an even pace and projects the end of the period', () => {
    const s = summarize(settings, [expense('2026-10-01', 110), expense('2026-10-02', 95)], '2026-10-02');
    expect(s.leftToday).toBeGreaterThan(0);
    expect(s.status).toBe('warning');
    expect(s.projectedSpend).toBe(3177_50);
  });
});

describe('totalsByCategory', () => {
  it('sums and sorts categories by total', () => {
    const totals = totalsByCategory([
      expense('2026-10-01', 10, 'coffee'),
      expense('2026-10-01', 30, 'food'),
      expense('2026-10-02', 10, 'food'),
    ]);
    expect(totals.map((t) => [t.category, t.total])).toEqual([
      ['food', 40_00],
      ['coffee', 10_00],
    ]);
    expect(totals[0].share).toBeCloseTo(0.8);
  });
});

describe('dailyTotals', () => {
  it('returns every day of the period up to today, including empty ones', () => {
    const period = getPeriod('2026-10-03', 1);
    const days = dailyTotals([expense('2026-10-01', 5), expense('2026-10-03', 7)], period, '2026-10-03');
    expect(days).toEqual([
      { day: '2026-10-01', total: 5_00 },
      { day: '2026-10-02', total: 0 },
      { day: '2026-10-03', total: 7_00 },
    ]);
  });
});

describe('parseAmount', () => {
  it.each([
    ['12', 12_00],
    ['12,5', 12_50],
    ['12.99', 12_99],
    ['1 234,10', 1234_10],
    ['0,01', 1],
  ])('parses %s', (input, expected) => {
    expect(parseAmount(input)).toBe(expected);
  });

  it.each(['', '0', 'abc', '12,345', '-5', '1,2,3'])('rejects %s', (input) => {
    expect(parseAmount(input)).toBeNull();
  });
});

describe('formatting', () => {
  it('formats money the Polish way', () => {
    expect(formatMoney(1234_50)).toBe('1 234,50 zł');
    expect(formatMoney(-5_00)).toBe('−5,00 zł');
    expect(formatMoney(100_00, { whole: true })).toBe('100 zł');
    expect(formatMoney(100_50, { whole: true })).toBe('100,50 zł');
  });

  it('uses Polish plural forms', () => {
    const days: [string, string, string] = ['dzień', 'dni', 'dni'];
    expect(pluralize(1, days)).toBe('dzień');
    expect(pluralize(3, days)).toBe('dni');
    const zlote: [string, string, string] = ['wydatek', 'wydatki', 'wydatków'];
    expect(pluralize(2, zlote)).toBe('wydatki');
    expect(pluralize(5, zlote)).toBe('wydatków');
    expect(pluralize(12, zlote)).toBe('wydatków');
    expect(pluralize(22, zlote)).toBe('wydatki');
  });

  it('labels relative days', () => {
    expect(relativeDayLabel('2026-10-03', '2026-10-03')).toBe('Dziś');
    expect(relativeDayLabel('2026-10-02', '2026-10-03')).toBe('Wczoraj');
    expect(relativeDayLabel('2026-09-28', '2026-10-03')).toBe('poniedziałek, 28 września');
  });
});

describe('fixed costs', () => {
  const settings = { budget: 3100_00, periodStartDay: 1 };
  const spotify: FixedCost = { id: 's', name: 'Spotify', emoji: '🎵', amount: 23_99, day: 15 };
  const phone: FixedCost = { id: 'p', name: 'Telefon', emoji: '📱', amount: 31_01, day: 31 };

  it('reserves fixed costs up front and splits the rest across days', () => {
    const s = summarize(settings, [], '2026-10-01', [spotify, phone]);
    expect(s.fixedTotal).toBe(55_00);
    expect(s.spendable).toBe(3045_00);
    expect(s.remaining).toBe(3045_00);
    expect(s.dailyLimitToday).toBe(Math.floor(3045_00 / 31));
    expect(s.baseDailyLimit).toBe(Math.floor(3045_00 / 31));
  });

  it('does not count fixed costs as spending', () => {
    const s = summarize(settings, [expense('2026-10-01', 10)], '2026-10-01', [spotify]);
    expect(s.spent).toBe(10_00);
    expect(s.remaining).toBe(3100_00 - 23_99 - 10_00);
  });

  it('finds the charge day within the period, clamped to the month length', () => {
    const period = getPeriod('2026-10-20', 10); // 10 Oct – 9 Nov
    expect(chargeDayInPeriod(period, 15)).toBe('2026-10-15');
    expect(chargeDayInPeriod(period, 5)).toBe('2026-11-05');
    expect(chargeDayInPeriod(getPeriod('2027-02-10', 1), 31)).toBe('2027-02-28');
  });

  it('lists charges by date and marks the ones already charged', () => {
    const period = getPeriod('2026-10-20', 1);
    const charges = chargesInPeriod([phone, spotify], period, '2026-10-20');
    expect(charges.map((c) => [c.name, c.date, c.charged])).toEqual([
      ['Spotify', '2026-10-15', true],
      ['Telefon', '2026-10-31', false],
    ]);
  });
});
