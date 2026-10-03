import { router } from 'expo-router';
import { Platform, SectionList, StyleSheet, Text, View } from 'react-native';

import { ExpenseRow } from '@/components/expense-row';
import { Muted } from '@/components/ui';
import { Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { confirmDeleteExpense } from '@/lib/actions';
import { DayKey, Expense, formatMoney, relativeDayLabel } from '@/lib/budget';
import { sortExpenses, useStore } from '@/lib/store';

type Section = { day: DayKey; total: number; data: Expense[] };

function groupByDay(expenses: Expense[]): Section[] {
  const sections: Section[] = [];
  for (const e of sortExpenses(expenses)) {
    const last = sections[sections.length - 1];
    if (last && last.day === e.day) {
      last.data.push(e);
      last.total += e.amount;
    } else {
      sections.push({ day: e.day, total: e.amount, data: [e] });
    }
  }
  return sections;
}

export default function HistoryScreen() {
  const theme = useTheme();
  const { expenses, today, deleteExpense } = useStore();
  const sections = groupByDay(expenses);

  return (
    <SectionList
      style={{ flex: 1, backgroundColor: theme.background }}
      contentInsetAdjustmentBehavior="automatic"
      contentContainerStyle={styles.content}
      sections={sections}
      keyExtractor={(e) => e.id}
      stickySectionHeadersEnabled={false}
      ListHeaderComponent={
        <View style={styles.header}>
          <Text style={[styles.title, { color: theme.text }]}>Historia</Text>
          {sections.length > 0 && <Muted>Stuknij, aby edytować · przytrzymaj, aby usunąć</Muted>}
        </View>
      }
      ListEmptyComponent={
        <Muted style={styles.empty}>Brak wydatków. Dodaj pierwszy na ekranie „Dziś”.</Muted>
      }
      renderSectionHeader={({ section }) => (
        <View style={styles.sectionHeader}>
          <Text style={[styles.sectionDay, { color: theme.textSecondary }]}>
            {relativeDayLabel(section.day, today)}
          </Text>
          <Text style={[styles.sectionTotal, { color: theme.textSecondary }]}>−{formatMoney(section.total)}</Text>
        </View>
      )}
      renderItem={({ item, index, section }) => (
        <View
          style={[
            styles.item,
            { backgroundColor: theme.card },
            index === 0 && styles.first,
            index === section.data.length - 1 && styles.last,
          ]}>
          <ExpenseRow
            expense={item}
            onPress={() => router.push({ pathname: '/add', params: { id: item.id } })}
            onLongPress={() => confirmDeleteExpense(item, deleteExpense)}
          />
        </View>
      )}
    />
  );
}

const styles = StyleSheet.create({
  content: {
    padding: Spacing.lg,
    paddingTop: Platform.OS === 'web' ? 96 : Spacing.lg,
    paddingBottom: 120,
  },
  header: {
    gap: Spacing.xs,
    marginBottom: Spacing.sm,
  },
  title: {
    fontSize: 34,
    fontWeight: '800',
    letterSpacing: -0.5,
  },
  empty: {
    textAlign: 'center',
    marginTop: Spacing.xxl,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.xs,
    paddingTop: Spacing.lg,
    paddingBottom: Spacing.sm,
  },
  sectionDay: {
    fontSize: 14,
    fontWeight: '700',
    textTransform: 'capitalize',
  },
  sectionTotal: {
    fontSize: 14,
    fontWeight: '700',
    fontVariant: ['tabular-nums'],
  },
  item: {
    paddingHorizontal: Spacing.lg,
    paddingVertical: 2,
  },
  first: {
    borderTopLeftRadius: Radius.lg,
    borderTopRightRadius: Radius.lg,
    paddingTop: Spacing.sm,
  },
  last: {
    borderBottomLeftRadius: Radius.lg,
    borderBottomRightRadius: Radius.lg,
    paddingBottom: Spacing.sm,
  },
});
