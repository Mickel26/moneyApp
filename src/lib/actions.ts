import { Alert, Platform } from 'react-native';

import { getCategory } from '@/constants/categories';
import { Expense, formatMoney } from '@/lib/budget';

/** Asks before a destructive action. React Native's Alert is a no-op on web, so use the browser dialog there. */
export function confirmAction(title: string, message: string, confirmLabel: string, onConfirm: () => void) {
  if (Platform.OS === 'web') {
    if (window.confirm(`${title}\n\n${message}`)) onConfirm();
    return;
  }
  Alert.alert(title, message, [
    { text: 'Anuluj', style: 'cancel' },
    { text: confirmLabel, style: 'destructive', onPress: onConfirm },
  ]);
}

export function notify(title: string, message: string) {
  if (Platform.OS === 'web') window.alert(`${title}\n\n${message}`);
  else Alert.alert(title, message);
}

export function confirmDeleteExpense(expense: Expense, onDelete: (id: string) => void, onDone?: () => void) {
  const name = expense.note || getCategory(expense.category).label;
  confirmAction('Usunąć wydatek?', `${name} · ${formatMoney(expense.amount)}`, 'Usuń', () => {
    onDelete(expense.id);
    onDone?.();
  });
}
