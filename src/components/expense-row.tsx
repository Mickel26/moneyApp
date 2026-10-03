import { Pressable, StyleSheet, Text, View } from 'react-native';

import { getCategory } from '@/constants/categories';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { Expense, formatMoney } from '@/lib/budget';

export function ExpenseRow({
  expense,
  onPress,
  onLongPress,
}: {
  expense: Expense;
  onPress?: () => void;
  onLongPress?: () => void;
}) {
  const theme = useTheme();
  const category = getCategory(expense.category);
  return (
    <Pressable
      onPress={onPress}
      onLongPress={onLongPress}
      style={({ pressed }) => [styles.row, { opacity: pressed ? 0.6 : 1 }]}>
      <View style={[styles.icon, { backgroundColor: category.color + '26' }]}>
        <Text style={styles.emoji}>{category.emoji}</Text>
      </View>
      <View style={styles.texts}>
        <Text style={[styles.title, { color: theme.text }]} numberOfLines={1}>
          {expense.note || category.label}
        </Text>
        {!!expense.note && (
          <Text style={[styles.subtitle, { color: theme.textSecondary }]}>{category.label}</Text>
        )}
      </View>
      <Text style={[styles.amount, { color: theme.text }]}>−{formatMoney(expense.amount)}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    paddingVertical: Spacing.sm,
  },
  icon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emoji: {
    fontSize: 20,
  },
  texts: {
    flex: 1,
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
  },
  subtitle: {
    fontSize: 13,
    marginTop: 1,
  },
  amount: {
    fontSize: 16,
    fontWeight: '700',
    fontVariant: ['tabular-nums'],
  },
});
