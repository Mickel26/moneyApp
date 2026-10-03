/**
 * Parses payments copied to the clipboard by the iOS Shortcuts "Transaction" automation
 * (runs after every Apple Pay payment). The shortcut copies text in the form:
 *
 *   Budżet|23,99 zł|Żabka|2026-10-03T20:15:31+02:00
 *
 * Amount and merchant come from the Wallet transaction, the date from "Format Date → ISO 8601".
 * Fields can be empty (some banks don't pass the amount), and plain text like "23,99 zł Żabka"
 * is accepted too.
 */

import { DayKey, parseAmount } from '@/lib/budget';

export const PAYMENT_PREFIX = 'Budżet';
/** Also accepted, since "ż" is awkward to type on a non-Polish keyboard. */
const PREFIXES = ['budżet', 'budzet', 'budget'];

export type ParsedPayment = {
  /** Grosze, or null when the shortcut didn't get an amount. */
  amount: number | null;
  merchant: string | null;
  day: DayKey | null;
  /** Best guess based on the merchant name. */
  category: string | null;
};

const CURRENCY = /(zł|pln|eur|€|usd|\$|gbp|£)/gi;

/** Like parseAmount, but tolerant of currency symbols, signs and either decimal separator. */
export function parseLooseAmount(input: string): number | null {
  let s = input.replace(CURRENCY, '').replace(/[\s  ]/g, '').replace(/^[-−+]/, '');
  if (!/^[\d.,]+$/.test(s)) return null;
  const lastComma = s.lastIndexOf(',');
  const lastDot = s.lastIndexOf('.');
  const decimalAt = Math.max(lastComma, lastDot);
  // A separator followed by 1–2 digits at the end is the decimal point; anything else groups thousands.
  if (decimalAt !== -1 && s.length - decimalAt - 1 <= 2) {
    s = s.slice(0, decimalAt).replace(/[.,]/g, '') + ',' + s.slice(decimalAt + 1);
  } else {
    s = s.replace(/[.,]/g, '');
  }
  return parseAmount(s);
}

function parseDay(input: string): DayKey | null {
  const match = input.trim().match(/^(\d{4}-\d{2}-\d{2})/);
  return match ? match[1] : null;
}

function cleanMerchant(input: string): string | null {
  const merchant = input.replace(/\s+/g, ' ').trim();
  return merchant.length > 0 ? merchant : null;
}

export function parsePaymentText(text: string): ParsedPayment | null {
  const trimmed = text.trim();
  if (!trimmed) return null;

  let amount: number | null = null;
  let merchant: string | null = null;
  let day: DayKey | null = null;

  const parts = trimmed.split('|');
  if (PREFIXES.includes(parts[0].trim().toLowerCase())) {
    amount = parts[1] ? parseLooseAmount(parts[1]) : null;
    merchant = parts[2] ? cleanMerchant(parts[2]) : null;
    day = parts[3] ? parseDay(parts[3]) : null;
    if (amount === null && merchant === null) return null;
  } else {
    // Free text such as "23,99 zł Żabka" or "Żabka -23.99 PLN": take the first amount-looking token.
    if (trimmed.length > 120) return null;
    const match = trimmed.match(/[-−+]?\d[\d\s .,]*(?:\s?(?:zł|pln|eur|€|usd|\$))?/i);
    if (!match) return null;
    amount = parseLooseAmount(match[0]);
    if (amount === null) return null;
    merchant = cleanMerchant(trimmed.replace(match[0], ' ').replace(CURRENCY, ' ').replace(/[·|,;:-]+/g, ' '));
  }

  return { amount, merchant, day, category: merchant ? guessCategory(merchant) : null };
}

const CATEGORY_KEYWORDS: [string, string[]][] = [
  ['coffee', ['starbucks', 'costa', 'coffee', 'kawiarnia', 'cafe', 'caffe', 'green caffe', 'bakery', 'piekarnia']],
  [
    'food',
    [
      'mcdonald',
      'kfc',
      'burger',
      'pizza',
      'kebab',
      'subway',
      'sushi',
      'bistro',
      'restaur',
      'bar mleczny',
      'uber eats',
      'pyszne',
      'glovo',
      'wolt',
      'bolt food',
      'stołówka',
      'stolowka',
    ],
  ],
  [
    'groceries',
    [
      'żabka',
      'zabka',
      'biedronka',
      'lidl',
      'carrefour',
      'auchan',
      'kaufland',
      'netto',
      'dino',
      'aldi',
      'stokrotka',
      'lewiatan',
      'spar',
      'polomarket',
      'frisco',
    ],
  ],
  [
    'transport',
    ['uber', 'bolt', 'free now', 'freenow', 'mpk', 'ztm', 'jakdojade', 'koleo', 'pkp', 'intercity', 'orlen', 'shell', 'bp ', 'circle k', 'flixbus'],
  ],
  ['party', ['pub', 'klub', 'club', 'browar', 'piwiarnia']],
  ['fun', ['cinema city', 'multikino', 'helios', 'kino', 'steam', 'playstation', 'xbox', 'nintendo', 'ebilet']],
  ['clothes', ['zara', 'h&m', 'reserved', 'pull&bear', 'pull & bear', 'sinsay', 'cropp', 'house', 'ccc', 'zalando', 'bershka', 'decathlon']],
  ['study', ['empik', 'ksiegarnia', 'księgarnia', 'ksero']],
  ['health', ['apteka', 'rossmann', 'hebe', 'super-pharm', 'dr.max', 'doz']],
  ['subscriptions', ['spotify', 'netflix', 'apple.com', 'google', 'youtube', 'disney', 'hbo', 'max.com', 'icloud']],
];

export function guessCategory(merchant: string): string | null {
  const name = ` ${merchant.toLowerCase()} `;
  for (const [category, keywords] of CATEGORY_KEYWORDS) {
    if (keywords.some((k) => name.includes(k))) return category;
  }
  return null;
}
