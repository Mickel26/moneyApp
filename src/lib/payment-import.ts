import * as Clipboard from 'expo-clipboard';
import { router } from 'expo-router';

import { getCategory } from '@/constants/categories';
import { confirmAction, notify } from '@/lib/actions';
import { formatMoney } from '@/lib/budget';
import { ParsedPayment, parsePaymentText } from '@/lib/payment';

export type ClipboardPayment = ParsedPayment & { raw: string };

/**
 * Reads the payment the Shortcuts automation copied. Must be called straight from a tap handler:
 * iOS only allows reading the clipboard in response to a user action (and asks to confirm "Paste").
 */
export async function readClipboardPayment(): Promise<ClipboardPayment | null> {
  let raw = '';
  try {
    raw = (await Clipboard.getStringAsync()).trim();
  } catch {
    notify('Brak dostępu do schowka', 'Pozwól aplikacji wkleić zawartość schowka i spróbuj ponownie.');
    return null;
  }
  const parsed = parsePaymentText(raw);
  if (!parsed) {
    notify(
      'Nie znaleziono płatności',
      'W schowku nie ma płatności. Zapłać telefonem (Apple Pay) – skrót skopiuje ją automatycznie. ' +
        'Konfiguracja: Ustawienia → Płatności Apple Pay.',
    );
    return null;
  }
  return { ...parsed, raw };
}

export function describePayment(p: ParsedPayment): string {
  const parts = [p.merchant, p.amount !== null ? formatMoney(p.amount) : null].filter(Boolean);
  return parts.join(' · ');
}

/** Asks before adding a payment that was already imported. */
export function confirmIfDuplicate(payment: ClipboardPayment, imported: string[], onContinue: () => void) {
  if (!imported.includes(payment.raw)) {
    onContinue();
    return;
  }
  confirmAction('Ta płatność jest już dodana', `${describePayment(payment)}\n\nDodać ją jeszcze raz?`, 'Dodaj', onContinue);
}

/** Opens the add-expense form prefilled with the payment. */
export function openAddWithPayment(payment: ClipboardPayment) {
  router.push({
    pathname: '/add',
    params: {
      amount: payment.amount !== null ? String(payment.amount) : '',
      note: payment.merchant ?? '',
      category: payment.category ?? '',
      day: payment.day ?? '',
      raw: payment.raw,
    },
  });
}

export function categoryHint(payment: ParsedPayment): string {
  return payment.category ? `${getCategory(payment.category).emoji} ${getCategory(payment.category).label}` : '—';
}
