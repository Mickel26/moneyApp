import { describe, expect, it } from '@jest/globals';

import { guessCategory, parseLooseAmount, parsePaymentText } from '../payment';

describe('parseLooseAmount', () => {
  it.each([
    ['23,99 zł', 23_99],
    ['23.99 PLN', 23_99],
    ['PLN 23,99', 23_99],
    ['-23,99 zł', 23_99],
    ['1 234,50 zł', 1234_50],
    ['1,234.50', 1234_50],
    ['1.234,50', 1234_50],
    ['12 zł', 12_00],
    ['€4.5', 4_50],
    ['1,000', 1000_00],
  ])('parses %s', (input, expected) => {
    expect(parseLooseAmount(input)).toBe(expected);
  });

  it.each(['', 'zł', 'abc', '0,00'])('rejects %s', (input) => {
    expect(parseLooseAmount(input)).toBeNull();
  });
});

describe('parsePaymentText', () => {
  it('parses the shortcut format', () => {
    expect(parsePaymentText('Budżet|23,99 zł|Żabka|2026-10-03T20:15:31+02:00')).toEqual({
      amount: 23_99,
      merchant: 'Żabka',
      day: '2026-10-03',
      category: 'groceries',
    });
  });

  it('accepts missing fields from the shortcut', () => {
    expect(parsePaymentText('Budżet||Starbucks Warszawa|')).toEqual({
      amount: null,
      merchant: 'Starbucks Warszawa',
      day: null,
      category: 'coffee',
    });
    expect(parsePaymentText('budżet|12,50 zł')).toEqual({ amount: 12_50, merchant: null, day: null, category: null });
    expect(parsePaymentText('Budżet|||')).toBeNull();
  });

  it('parses free text with an amount', () => {
    expect(parsePaymentText('23,99 zł Żabka')).toMatchObject({ amount: 23_99, merchant: 'Żabka' });
    expect(parsePaymentText('Bolt -14.20 PLN')).toMatchObject({ amount: 14_20, merchant: 'Bolt', category: 'transport' });
    expect(parsePaymentText('45')).toMatchObject({ amount: 45_00, merchant: null });
  });

  it('ignores unrelated clipboard contents', () => {
    expect(parsePaymentText('')).toBeNull();
    expect(parsePaymentText('hej, co tam?')).toBeNull();
    expect(parsePaymentText('x'.repeat(200) + ' 12')).toBeNull();
  });
});

describe('guessCategory', () => {
  it.each([
    ['BIEDRONKA 1234 KRAKOW', 'groceries'],
    ['Uber Eats', 'food'],
    ['UBER *TRIP', 'transport'],
    ['McDonalds 23', 'food'],
    ['Rossmann', 'health'],
    ['Cinema City Bonarka', 'fun'],
    ['Jakiś Sklep', null],
  ])('%s → %s', (merchant, category) => {
    expect(guessCategory(merchant)).toBe(category);
  });
});
