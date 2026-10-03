/**
 * Pure budget math. Amounts are stored as integer grosze (1 zł = 100 gr) to avoid
 * floating point errors; dates are local calendar days as 'YYYY-MM-DD' keys.
 */

export type DayKey = string;

export type Expense = {
  id: string;
  /** Amount in grosze. */
  amount: number;
  category: string;
  note?: string;
  day: DayKey;
  createdAt: number;
};

export type Settings = {
  /** Budget for one period, in grosze. */
  budget: number;
  /** Day of month the period starts (e.g. the day you get money), 1–28. */
  periodStartDay: number;
};

/** A recurring monthly charge (e.g. Spotify) reserved from the budget up front. */
export type FixedCost = {
  id: string;
  name: string;
  emoji: string;
  /** Amount in grosze. */
  amount: number;
  /** Day of month it gets charged, 1–31 (clamped to the month's length). */
  day: number;
};

export type Period = {
  start: DayKey;
  /** Exclusive. */
  end: DayKey;
  totalDays: number;
};

export type PaceStatus = 'good' | 'warning' | 'over';

export type BudgetSummary = {
  period: Period;
  /** The whole budget, including fixed costs. */
  budget: number;
  /** Sum of fixed costs, reserved at the start of the period. */
  fixedTotal: number;
  /** What's left for everyday spending: budget minus fixed costs. */
  spendable: number;
  spent: number;
  remaining: number;
  spentToday: number;
  /** Days left in the period, including today. */
  daysLeft: number;
  /** Days already passed in the period, including today. */
  dayNumber: number;
  /** How much you could spend today, decided at the start of the day. */
  dailyLimitToday: number;
  /** dailyLimitToday minus what you already spent today (can be negative). */
  leftToday: number;
  /** Daily limit from tomorrow if you spend nothing more today; null on the last day. */
  limitFromTomorrow: number | null;
  /** Budget split evenly across all days of the period. */
  baseDailyLimit: number;
  /** Where spending would end up if you keep the current average daily pace. */
  projectedSpend: number;
  status: PaceStatus;
};

const DAY_MS = 24 * 60 * 60 * 1000;

const pad = (n: number) => String(n).padStart(2, '0');

export function toDayKey(date: Date): DayKey {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

function parseKey(key: DayKey): [number, number, number] {
  const [y, m, d] = key.split('-').map(Number);
  return [y, m, d];
}

/** Days since epoch for a calendar day; DST-safe because it goes through UTC. */
function dayNumberOf(key: DayKey): number {
  const [y, m, d] = parseKey(key);
  return Math.round(Date.UTC(y, m - 1, d) / DAY_MS);
}

export function daysBetween(from: DayKey, to: DayKey): number {
  return dayNumberOf(to) - dayNumberOf(from);
}

export function addDays(key: DayKey, days: number): DayKey {
  const [y, m, d] = parseKey(key);
  const date = new Date(Date.UTC(y, m - 1, d + days));
  return `${date.getUTCFullYear()}-${pad(date.getUTCMonth() + 1)}-${pad(date.getUTCDate())}`;
}

function keyFromParts(y: number, monthIndex: number, d: number): DayKey {
  const date = new Date(Date.UTC(y, monthIndex, d));
  return `${date.getUTCFullYear()}-${pad(date.getUTCMonth() + 1)}-${pad(date.getUTCDate())}`;
}

export function clampStartDay(day: number): number {
  if (!Number.isFinite(day)) return 1;
  return Math.min(28, Math.max(1, Math.round(day)));
}

/** The budget period containing `today`, e.g. 10 Oct – 9 Nov for start day 10. */
export function getPeriod(today: DayKey, periodStartDay: number): Period {
  const startDay = clampStartDay(periodStartDay);
  const [y, m, d] = parseKey(today);
  const startMonthIndex = d >= startDay ? m - 1 : m - 2;
  const start = keyFromParts(y, startMonthIndex, startDay);
  const end = keyFromParts(y, startMonthIndex + 1, startDay);
  return { start, end, totalDays: daysBetween(start, end) };
}

export function isInPeriod(day: DayKey, period: Period): boolean {
  return day >= period.start && day < period.end;
}

export function expensesInPeriod(expenses: Expense[], period: Period): Expense[] {
  return expenses.filter((e) => isInPeriod(e.day, period));
}

const sum = (expenses: Expense[]) => expenses.reduce((acc, e) => acc + e.amount, 0);

export function fixedTotal(fixedCosts: FixedCost[]): number {
  return fixedCosts.reduce((acc, f) => acc + f.amount, 0);
}

export function summarize(
  settings: Settings,
  expenses: Expense[],
  today: DayKey,
  fixedCosts: FixedCost[] = [],
): BudgetSummary {
  const period = getPeriod(today, settings.periodStartDay);
  const inPeriod = expensesInPeriod(expenses, period);
  const fixed = fixedTotal(fixedCosts);
  const spendable = settings.budget - fixed;

  const spent = sum(inPeriod);
  const spentToday = sum(inPeriod.filter((e) => e.day === today));
  const spentBeforeToday = sum(inPeriod.filter((e) => e.day < today));
  const remaining = spendable - spent;

  const daysLeft = daysBetween(today, period.end);
  const dayNumber = period.totalDays - daysLeft + 1;

  const dailyLimitToday = Math.max(0, Math.floor((spendable - spentBeforeToday) / daysLeft));
  const leftToday = dailyLimitToday - spentToday;
  const limitFromTomorrow = daysLeft > 1 ? Math.max(0, Math.floor(remaining / (daysLeft - 1))) : null;

  const baseDailyLimit = Math.max(0, Math.floor(spendable / period.totalDays));
  const projectedSpend = Math.round((spent / dayNumber) * period.totalDays);

  // Compare actual spending against an even split up to and including today.
  const expectedByNow = (spendable * dayNumber) / period.totalDays;
  let status: PaceStatus = 'good';
  if (remaining < 0 || leftToday < 0 || spent > expectedByNow * 1.15) status = 'over';
  else if (spent > expectedByNow) status = 'warning';

  return {
    period,
    budget: settings.budget,
    fixedTotal: fixed,
    spendable,
    spent,
    remaining,
    spentToday,
    daysLeft,
    dayNumber,
    dailyLimitToday,
    leftToday,
    limitFromTomorrow,
    baseDailyLimit,
    projectedSpend,
    status,
  };
}

function daysInMonth(key: DayKey): number {
  const [y, m] = parseKey(key);
  return new Date(Date.UTC(y, m, 0)).getUTCDate();
}

/** The day within `period` when a fixed cost charged on `day` of the month falls. */
export function chargeDayInPeriod(period: Period, day: number): DayKey {
  for (let d = period.start; d < period.end; d = addDays(d, 1)) {
    if (parseKey(d)[2] === Math.min(day, daysInMonth(d))) return d;
  }
  // A period is always one month long, so this is unreachable; fall back to its start.
  return period.start;
}

export type UpcomingCharge = FixedCost & { date: DayKey; charged: boolean };

/** Fixed costs with their charge date in the period, sorted by date. */
export function chargesInPeriod(fixedCosts: FixedCost[], period: Period, today: DayKey): UpcomingCharge[] {
  return fixedCosts
    .map((f) => {
      const date = chargeDayInPeriod(period, f.day);
      return { ...f, date, charged: date <= today };
    })
    .sort((a, b) => (a.date === b.date ? a.name.localeCompare(b.name) : a.date < b.date ? -1 : 1));
}

export type CategoryTotal = { category: string; total: number; share: number };

export function totalsByCategory(expenses: Expense[]): CategoryTotal[] {
  const totals = new Map<string, number>();
  for (const e of expenses) totals.set(e.category, (totals.get(e.category) ?? 0) + e.amount);
  const all = sum(expenses);
  return [...totals.entries()]
    .map(([category, total]) => ({ category, total, share: all > 0 ? total / all : 0 }))
    .sort((a, b) => b.total - a.total);
}

export type DayTotal = { day: DayKey; total: number };

/** One entry per day of the period up to and including `today`. */
export function dailyTotals(expenses: Expense[], period: Period, today: DayKey): DayTotal[] {
  const totals = new Map<DayKey, number>();
  for (const e of expenses) totals.set(e.day, (totals.get(e.day) ?? 0) + e.amount);
  const last = today < period.end ? today : addDays(period.end, -1);
  const days: DayTotal[] = [];
  for (let day = period.start; day <= last; day = addDays(day, 1)) {
    days.push({ day, total: totals.get(day) ?? 0 });
  }
  return days;
}

/** Parses user input like "12", "12,5" or "1 234.99" into grosze. */
export function parseAmount(input: string): number | null {
  const normalized = input.replace(/\s/g, '').replace(',', '.');
  if (!/^\d+(\.\d{0,2})?$/.test(normalized)) return null;
  const value = Math.round(parseFloat(normalized) * 100);
  return value > 0 ? value : null;
}

/** Formats grosze as "1 234,50 zł" (or "1 234 zł" with `whole`). */
export function formatMoney(grosze: number, options: { whole?: boolean } = {}): string {
  const negative = grosze < 0;
  const abs = Math.abs(grosze);
  const zl = Math.floor(abs / 100);
  const gr = abs % 100;
  const zlText = String(zl).replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
  const showGrosze = !options.whole || gr !== 0;
  const value = showGrosze ? `${zlText},${pad(gr)}` : zlText;
  return `${negative ? '−' : ''}${value} zł`;
}

/** Converts grosze to an editable string, e.g. 1250 -> "12,50". */
export function amountToInput(grosze: number): string {
  const gr = grosze % 100;
  return gr === 0 ? String(grosze / 100) : `${Math.floor(grosze / 100)},${pad(gr)}`;
}

const MONTHS_GENITIVE = [
  'stycznia',
  'lutego',
  'marca',
  'kwietnia',
  'maja',
  'czerwca',
  'lipca',
  'sierpnia',
  'września',
  'października',
  'listopada',
  'grudnia',
];

const WEEKDAYS = ['niedziela', 'poniedziałek', 'wtorek', 'środa', 'czwartek', 'piątek', 'sobota'];

export function formatDay(key: DayKey): string {
  const [, m, d] = parseKey(key);
  return `${d} ${MONTHS_GENITIVE[m - 1]}`;
}

export function weekdayOf(key: DayKey): string {
  const [y, m, d] = parseKey(key);
  return WEEKDAYS[new Date(Date.UTC(y, m - 1, d)).getUTCDay()];
}

/** "Dziś", "Wczoraj" or e.g. "poniedziałek, 6 października". */
export function relativeDayLabel(key: DayKey, today: DayKey): string {
  const diff = daysBetween(key, today);
  if (diff === 0) return 'Dziś';
  if (diff === 1) return 'Wczoraj';
  if (diff === 2) return 'Przedwczoraj';
  return `${weekdayOf(key)}, ${formatDay(key)}`;
}

/** Polish plural: pluralize(5, ['dzień', 'dni', 'dni']). */
export function pluralize(n: number, forms: [string, string, string]): string {
  if (n === 1) return forms[0];
  const lastTwo = n % 100;
  const last = n % 10;
  if (last >= 2 && last <= 4 && (lastTwo < 12 || lastTwo > 14)) return forms[1];
  return forms[2];
}
