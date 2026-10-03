import { router } from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';

import { BudgetForm } from '@/components/budget-form';
import { ExpenseRow } from '@/components/expense-row';
import { Button, Card, Muted, ProgressBar, Screen, SectionLabel } from '@/components/ui';
import { Spacing, Theme } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { confirmDeleteExpense } from '@/lib/actions';
import { addDays, BudgetSummary, formatDay, formatMoney, getPeriod, pluralize, summarize } from '@/lib/budget';
import { sortExpenses, useStore } from '@/lib/store';

export default function TodayScreen() {
  const theme = useTheme();
  const { loaded, settings, expenses, today, saveSettings, addExpense, deleteExpense } = useStore();

  if (!loaded) return <View style={{ flex: 1, backgroundColor: theme.background }} />;

  if (!settings) {
    return (
      <Screen title="Cześć! 👋">
        <Muted style={styles.intro}>
          Ustaw miesięczny budżet, a aplikacja co dzień pokaże, ile możesz wydać, żeby starczyło do końca
          miesiąca.
        </Muted>
        <BudgetForm
          initial={null}
          submitLabel="Zaczynamy"
          askAlreadySpent
          onSubmit={(next, alreadySpent) => {
            if (alreadySpent) {
              const start = getPeriod(today, next.periodStartDay).start;
              addExpense({ amount: alreadySpent, category: 'other', note: 'Wydatki sprzed aplikacji', day: start });
            }
            saveSettings(next);
          }}
        />
      </Screen>
    );
  }

  const summary = summarize(settings, expenses, today);
  const todayExpenses = sortExpenses(expenses.filter((e) => e.day === today));
  const todayColor = summary.leftToday < 0 ? theme.over : theme.good;
  const statusColor = colorForStatus(summary, theme);

  return (
    <Screen title="Dziś">
      <Card style={styles.hero}>
        <Muted>{summary.leftToday < 0 ? 'Dzisiejszy limit przekroczony o' : 'Na dziś możesz jeszcze wydać'}</Muted>
        <Text style={[styles.heroAmount, { color: todayColor }]} adjustsFontSizeToFit numberOfLines={1}>
          {formatMoney(Math.abs(summary.leftToday))}
        </Text>
        <ProgressBar
          value={summary.dailyLimitToday > 0 ? summary.spentToday / summary.dailyLimitToday : 1}
          color={todayColor}
        />
        <View style={styles.heroRow}>
          <Muted>Wydane dziś: {formatMoney(summary.spentToday)}</Muted>
          <Muted>Limit: {formatMoney(summary.dailyLimitToday)}</Muted>
        </View>
        <View style={styles.heroButton}>
          <Button title="＋  Dodaj wydatek" onPress={() => router.push('/add')} />
        </View>
      </Card>

      <Card>
        <View style={styles.rowBetween}>
          <Text style={[styles.cardTitle, { color: theme.text }]}>Budżet</Text>
          <Muted>
            {formatDay(summary.period.start)} – {formatDay(addDays(summary.period.end, -1))}
          </Muted>
        </View>
        <Text style={[styles.remaining, { color: summary.remaining < 0 ? theme.over : theme.text }]}>
          {formatMoney(summary.remaining)}
          <Text style={[styles.remainingOf, { color: theme.textSecondary }]}>
            {'  '}z {formatMoney(summary.budget, { whole: true })}
          </Text>
        </Text>
        <ProgressBar
          value={summary.budget > 0 ? summary.spent / summary.budget : 1}
          color={statusColor}
          marker={summary.dayNumber / summary.period.totalDays}
        />
        <Muted style={styles.small}>Kreska pokazuje, ile „powinno” być wydane do dziś.</Muted>

        <View style={styles.stats}>
          <Stat
            label={`${pluralize(summary.daysLeft, ['Został', 'Zostały', 'Zostało'])}`}
            value={`${summary.daysLeft} ${pluralize(summary.daysLeft, ['dzień', 'dni', 'dni'])}`}
          />
          <Stat
            label="Od jutra"
            value={summary.limitFromTomorrow === null ? '—' : `${formatMoney(summary.limitFromTomorrow, { whole: true })}/dz.`}
          />
          <Stat label="Wydane" value={formatMoney(summary.spent, { whole: true })} />
        </View>

        <View style={[styles.paceBox, { backgroundColor: statusColor + '1F' }]}>
          <Text style={[styles.paceText, { color: theme.text }]}>{paceMessage(summary)}</Text>
        </View>
      </Card>

      <SectionLabel>Dzisiejsze wydatki</SectionLabel>
      <Card style={styles.list}>
        {todayExpenses.length === 0 ? (
          <Muted style={styles.empty}>Dziś jeszcze nic nie wydane 🎉</Muted>
        ) : (
          todayExpenses.map((e) => (
            <ExpenseRow
              key={e.id}
              expense={e}
              onPress={() => router.push({ pathname: '/add', params: { id: e.id } })}
              onLongPress={() => confirmDeleteExpense(e, deleteExpense)}
            />
          ))
        )}
      </Card>
    </Screen>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  const theme = useTheme();
  return (
    <View style={[styles.stat, { backgroundColor: theme.cardMuted }]}>
      <Muted style={styles.small}>{label}</Muted>
      <Text style={[styles.statValue, { color: theme.text }]} adjustsFontSizeToFit numberOfLines={1}>
        {value}
      </Text>
    </View>
  );
}

function colorForStatus(summary: BudgetSummary, theme: Theme): string {
  if (summary.status === 'over') return theme.over;
  if (summary.status === 'warning') return theme.warning;
  return theme.good;
}

function paceMessage(s: BudgetSummary): string {
  const projected = formatMoney(s.projectedSpend, { whole: true });
  if (s.remaining < 0) {
    return `😬 Budżet przekroczony o ${formatMoney(-s.remaining)}. Spróbuj ograniczyć wydatki do minimum do końca okresu.`;
  }
  if (s.spent === 0) {
    return `✨ Nowy okres! Masz średnio ${formatMoney(s.baseDailyLimit, { whole: true })} na dzień.`;
  }
  const missing = s.projectedSpend - s.budget;
  // A projection from just a couple of days is too noisy to sound the alarm.
  if (s.status !== 'good' && s.leftToday >= 0 && s.dayNumber <= 3) {
    return `👀 Początek okresu, a wydajesz szybciej niż plan. Spokojnie – jeszcze łatwo to nadrobić.`;
  }
  if (s.status === 'over' && missing > 0) {
    return `🚨 Za szybko! W tym tempie wydasz ok. ${projected} i zabraknie Ci ok. ${formatMoney(missing, { whole: true })}.`;
  }
  if (s.status === 'over') {
    return `🚨 Dziś przekraczasz limit. Jutro limit spadnie do ${formatMoney(s.limitFromTomorrow ?? 0, { whole: true })}.`;
  }
  if (s.status === 'warning') {
    return `⚠️ Wydajesz trochę szybciej niż plan. W tym tempie wydasz ok. ${projected} z ${formatMoney(s.budget, { whole: true })}.`;
  }
  return `👌 Dobre tempo! W tym tempie zostanie Ci ok. ${formatMoney(Math.max(0, s.budget - s.projectedSpend), { whole: true })} na koniec okresu.`;
}

const styles = StyleSheet.create({
  intro: {
    fontSize: 16,
    lineHeight: 22,
  },
  hero: {
    gap: Spacing.sm,
  },
  heroAmount: {
    fontSize: 52,
    fontWeight: '800',
    letterSpacing: -1,
    fontVariant: ['tabular-nums'],
  },
  heroRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  heroButton: {
    marginTop: Spacing.sm,
  },
  rowBetween: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '700',
  },
  remaining: {
    fontSize: 28,
    fontWeight: '800',
    fontVariant: ['tabular-nums'],
  },
  remainingOf: {
    fontSize: 16,
    fontWeight: '600',
  },
  small: {
    fontSize: 12,
  },
  stats: {
    flexDirection: 'row',
    gap: Spacing.sm,
    marginTop: Spacing.xs,
  },
  stat: {
    flex: 1,
    borderRadius: 12,
    padding: Spacing.sm,
    gap: 2,
  },
  statValue: {
    fontSize: 16,
    fontWeight: '700',
    fontVariant: ['tabular-nums'],
  },
  paceBox: {
    borderRadius: 12,
    padding: Spacing.md,
    marginTop: Spacing.xs,
  },
  paceText: {
    fontSize: 14,
    lineHeight: 20,
  },
  list: {
    paddingVertical: Spacing.sm,
    gap: 0,
  },
  empty: {
    textAlign: 'center',
    paddingVertical: Spacing.md,
  },
});
