import { useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';

import { Button, Card, Muted } from '@/components/ui';
import { Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import {
  addDays,
  amountToInput,
  clampStartDay,
  fixedTotal,
  formatDay,
  formatMoney,
  getPeriod,
  parseAmount,
  Settings,
} from '@/lib/budget';
import { useStore } from '@/lib/store';

export function BudgetForm({
  initial,
  submitLabel,
  onSubmit,
  askAlreadySpent = false,
}: {
  initial: Settings | null;
  submitLabel: string;
  /** `alreadySpent` (grosze) is only set when `askAlreadySpent` is on and the user filled it in. */
  onSubmit: (settings: Settings, alreadySpent: number | null) => void;
  /** Ask how much was spent before installing the app, when starting mid-period. */
  askAlreadySpent?: boolean;
}) {
  const theme = useTheme();
  const { today, fixedCosts } = useStore();
  const fixed = fixedTotal(fixedCosts);
  const [budgetText, setBudgetText] = useState(initial ? amountToInput(initial.budget) : '');
  const [startDay, setStartDay] = useState(initial?.periodStartDay ?? 1);
  const [spentText, setSpentText] = useState('');

  const budget = parseAmount(budgetText);
  const period = getPeriod(today, startDay);
  const showAlreadySpent = askAlreadySpent && period.start !== today;
  const alreadySpent = showAlreadySpent ? parseAmount(spentText) : null;
  const changeDay = (delta: number) => setStartDay((d) => clampStartDay(d + delta));

  return (
    <View style={styles.container}>
      <Card>
        <Text style={[styles.label, { color: theme.text }]}>Ile masz na miesiąc?</Text>
        <Muted>Kwota na wszystkie wydatki do następnej wypłaty / stypendium / przelewu od rodziców.</Muted>
        <View style={[styles.amountRow, { backgroundColor: theme.cardMuted }]}>
          <TextInput
            value={budgetText}
            onChangeText={setBudgetText}
            placeholder="np. 1500"
            placeholderTextColor={theme.textSecondary}
            keyboardType="decimal-pad"
            style={[styles.amountInput, { color: theme.text }]}
          />
          <Text style={[styles.currency, { color: theme.textSecondary }]}>zł</Text>
        </View>
      </Card>

      <Card>
        <Text style={[styles.label, { color: theme.text }]}>Którego dostajesz pieniądze?</Text>
        <Muted>Od tego dnia liczy się nowy okres budżetu.</Muted>
        <View style={styles.stepper}>
          <StepButton label="−" onPress={() => changeDay(-1)} disabled={startDay <= 1} />
          <Text style={[styles.stepValue, { color: theme.text }]}>{startDay}.</Text>
          <StepButton label="+" onPress={() => changeDay(1)} disabled={startDay >= 28} />
        </View>
        <Muted style={styles.center}>
          Obecny okres: {formatDay(period.start)} – {formatDay(addDays(period.end, -1))} ({period.totalDays} dni)
        </Muted>
        {budget !== null && (
          <Muted style={styles.center}>
            To średnio {formatMoney(Math.max(0, Math.floor((budget - fixed) / period.totalDays)))} dziennie
            {fixed > 0 ? ' (po stałych opłatach)' : ''}
          </Muted>
        )}
      </Card>

      {showAlreadySpent && (
        <Card>
          <Text style={[styles.label, { color: theme.text }]}>Ile już wydane w tym okresie?</Text>
          <Muted>Opcjonalnie – od {formatDay(period.start)} do dziś. Zostanie zapisane jako jeden wydatek.</Muted>
          <View style={[styles.amountRow, { backgroundColor: theme.cardMuted }]}>
            <TextInput
              value={spentText}
              onChangeText={setSpentText}
              placeholder="0"
              placeholderTextColor={theme.textSecondary}
              keyboardType="decimal-pad"
              style={[styles.amountInput, { color: theme.text }]}
            />
            <Text style={[styles.currency, { color: theme.textSecondary }]}>zł</Text>
          </View>
        </Card>
      )}

      <Button
        title={submitLabel}
        disabled={budget === null}
        onPress={() => budget !== null && onSubmit({ budget, periodStartDay: startDay }, alreadySpent)}
      />
    </View>
  );
}

function StepButton({ label, onPress, disabled }: { label: string; onPress: () => void; disabled: boolean }) {
  const theme = useTheme();
  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      disabled={disabled}
      style={({ pressed }) => [
        styles.stepButton,
        { backgroundColor: theme.cardMuted, opacity: disabled ? 0.35 : pressed ? 0.6 : 1 },
      ]}>
      <Text style={[styles.stepButtonText, { color: theme.text }]}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: Spacing.md,
  },
  label: {
    fontSize: 18,
    fontWeight: '700',
  },
  amountRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: Radius.md,
    paddingHorizontal: Spacing.lg,
    marginTop: Spacing.xs,
  },
  amountInput: {
    flex: 1,
    fontSize: 28,
    fontWeight: '700',
    paddingVertical: Spacing.md,
  },
  currency: {
    fontSize: 22,
    fontWeight: '600',
  },
  stepper: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.xl,
    marginVertical: Spacing.sm,
  },
  stepButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepButtonText: {
    fontSize: 26,
    fontWeight: '600',
  },
  stepValue: {
    fontSize: 32,
    fontWeight: '800',
    minWidth: 64,
    textAlign: 'center',
    fontVariant: ['tabular-nums'],
  },
  center: {
    textAlign: 'center',
  },
});
