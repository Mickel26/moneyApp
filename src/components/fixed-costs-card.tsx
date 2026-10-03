import { router } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { Button, Card, Muted } from '@/components/ui';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import {
  chargesInPeriod,
  daysBetween,
  fixedTotal,
  formatDay,
  formatMoney,
  getPeriod,
  pluralize,
  UpcomingCharge,
} from '@/lib/budget';
import { useStore } from '@/lib/store';

/**
 * Lists fixed costs. `schedule` shows when each one is charged in the current period (Today screen);
 * `manage` shows the monthly day and an add button (Settings).
 */
export function FixedCostsCard({ mode }: { mode: 'schedule' | 'manage' }) {
  const theme = useTheme();
  const { settings, fixedCosts, today } = useStore();
  if (!settings) return null;

  const charges = chargesInPeriod(fixedCosts, getPeriod(today, settings.periodStartDay), today);

  return (
    <Card style={styles.card}>
      {charges.length === 0 && (
        <Muted>Spotify, telefon, akademik… Dodaj opłaty, które co miesiąc schodzą automatycznie.</Muted>
      )}
      {charges.map((c) => (
        <Pressable
          key={c.id}
          onPress={() => router.push({ pathname: '/fixed', params: { id: c.id } })}
          style={({ pressed }) => [styles.row, { opacity: pressed ? 0.6 : 1 }]}>
          <View style={[styles.icon, { backgroundColor: theme.cardMuted }]}>
            <Text style={styles.emoji}>{c.emoji}</Text>
          </View>
          <View style={styles.texts}>
            <Text style={[styles.name, { color: theme.text }]} numberOfLines={1}>
              {c.name}
            </Text>
            <Text style={[styles.when, { color: c.charged && mode === 'schedule' ? theme.good : theme.textSecondary }]}>
              {mode === 'schedule' ? scheduleLabel(c, today) : `co miesiąc, ${c.day}.`}
            </Text>
          </View>
          <Text style={[styles.amount, { color: theme.text }]}>{formatMoney(c.amount)}</Text>
        </Pressable>
      ))}
      {charges.length > 0 && (
        <View style={[styles.total, { borderTopColor: theme.border }]}>
          <Muted>Razem miesięcznie</Muted>
          <Text style={[styles.amount, { color: theme.text }]}>{formatMoney(fixedTotal(fixedCosts))}</Text>
        </View>
      )}
      {mode === 'manage' && (
        <Button title="＋  Dodaj stałą opłatę" variant="secondary" onPress={() => router.push('/fixed')} />
      )}
    </Card>
  );
}

function scheduleLabel(charge: UpcomingCharge, today: string): string {
  if (charge.charged) return `✓ zapłacone ${formatDay(charge.date)}`;
  const days = daysBetween(today, charge.date);
  if (days === 1) return 'jutro';
  return `za ${days} ${pluralize(days, ['dzień', 'dni', 'dni'])} · ${formatDay(charge.date)}`;
}

const styles = StyleSheet.create({
  card: {
    gap: Spacing.xs,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    paddingVertical: Spacing.xs,
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
  name: {
    fontSize: 16,
    fontWeight: '600',
  },
  when: {
    fontSize: 13,
    marginTop: 1,
  },
  amount: {
    fontSize: 16,
    fontWeight: '700',
    fontVariant: ['tabular-nums'],
  },
  total: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: StyleSheet.hairlineWidth,
    paddingTop: Spacing.sm,
    marginTop: Spacing.xs,
    marginBottom: Spacing.xs,
  },
});
