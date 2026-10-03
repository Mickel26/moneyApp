import { Alert } from 'react-native';

import { getCategory } from '@/constants/categories';
import { Expense, formatMoney } from '@/lib/budget';

export function confirmDeleteExpense(expense: Expense, onDelete: (id: string) => void, onDone?: () => void) {
  const name = expense.note || getCategory(expense.category).label;
  Alert.alert('Usunąć wydatek?', `${name} · ${formatMoney(expense.amount)}`, [
    { text: 'Anuluj', style: 'cancel' },
    {
      text: 'Usuń',
      style: 'destructive',
      onPress: () => {
        onDelete(expense.id);
        onDone?.();
      },
    },
  ]);
}
