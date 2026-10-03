import * as Haptics from 'expo-haptics';
import { router, Stack, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';

import { Button, Chip, Muted, SectionLabel } from '@/components/ui';
import { Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { confirmAction } from '@/lib/actions';
import { amountToInput, formatMoney, parseAmount } from '@/lib/budget';
import { useStore } from '@/lib/store';

const PRESETS = [
  { name: 'Spotify', emoji: '🎵' },
  { name: 'Netflix', emoji: '🎬' },
  { name: 'YouTube Premium', emoji: '▶️' },
  { name: 'Telefon', emoji: '📱' },
  { name: 'Internet', emoji: '🌐' },
  { name: 'Siłownia', emoji: '🏋️' },
  { name: 'Akademik / czynsz', emoji: '🏠' },
  { name: 'Bilet miesięczny', emoji: '🚌' },
  { name: 'iCloud', emoji: '☁️' },
];

const DEFAULT_EMOJI = '📌';

export default function FixedCostScreen() {
  const theme = useTheme();
  const { id } = useLocalSearchParams<{ id?: string }>();
  const { fixedCosts, saveFixedCost, deleteFixedCost } = useStore();
  const editing = id ? fixedCosts.find((f) => f.id === id) : undefined;

  const [name, setName] = useState(editing?.name ?? '');
  const [emoji, setEmoji] = useState(editing?.emoji ?? DEFAULT_EMOJI);
  const [amountText, setAmountText] = useState(editing ? amountToInput(editing.amount) : '');
  const [day, setDay] = useState(editing?.day ?? 1);

  const amount = parseAmount(amountText);
  const canSave = amount !== null && name.trim().length > 0;

  const save = () => {
    if (!canSave) return;
    saveFixedCost({ id: editing?.id, name: name.trim(), emoji, amount, day });
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    router.back();
  };

  return (
    <>
      <Stack.Screen
        options={{
          title: editing ? 'Edytuj stałą opłatę' : 'Nowa stała opłata',
          headerLeft: () => (
            <Pressable onPress={() => router.back()} hitSlop={12}>
              <Text style={[styles.headerButton, { color: theme.accent }]}>Anuluj</Text>
            </Pressable>
          ),
        }}
      />
      <ScrollView
        style={{ flex: 1, backgroundColor: theme.background }}
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
        automaticallyAdjustKeyboardInsets>
        {!editing && (
          <>
            <SectionLabel>Szybki wybór</SectionLabel>
            <View style={styles.chips}>
              {PRESETS.map((p) => (
                <Chip
                  key={p.name}
                  label={`${p.emoji} ${p.name}`}
                  selected={name === p.name}
                  onPress={() => {
                    setName(p.name);
                    setEmoji(p.emoji);
                  }}
                />
              ))}
            </View>
          </>
        )}

        <SectionLabel>Nazwa</SectionLabel>
        <TextInput
          value={name}
          onChangeText={(text) => {
            setName(text);
            setEmoji(PRESETS.find((p) => p.name === text)?.emoji ?? (editing?.emoji || DEFAULT_EMOJI));
          }}
          placeholder="np. Spotify"
          placeholderTextColor={theme.textSecondary}
          style={[styles.input, { backgroundColor: theme.card, color: theme.text }]}
          accessibilityLabel="Nazwa"
        />

        <SectionLabel>Kwota miesięcznie</SectionLabel>
        <View style={[styles.amountRow, { backgroundColor: theme.card }]}>
          <TextInput
            value={amountText}
            onChangeText={setAmountText}
            placeholder="np. 23,99"
            placeholderTextColor={theme.textSecondary}
            keyboardType="decimal-pad"
            style={[styles.amountInput, { color: theme.text }]}
            accessibilityLabel="Kwota"
          />
          <Text style={[styles.currency, { color: theme.textSecondary }]}>zł</Text>
        </View>

        <SectionLabel>Którego dnia schodzi z konta</SectionLabel>
        <View style={[styles.stepper, { backgroundColor: theme.card }]}>
          <StepButton label="−" onPress={() => setDay((d) => Math.max(1, d - 1))} disabled={day <= 1} />
          <Text style={[styles.stepValue, { color: theme.text }]}>{day}.</Text>
          <StepButton label="+" onPress={() => setDay((d) => Math.min(31, d + 1))} disabled={day >= 31} />
        </View>
        <Muted style={styles.hint}>
          Kwota jest odkładana na bok od razu na początku okresu, więc nie zjada dziennego limitu w dniu
          płatności. Nie dodawaj jej już jako zwykłego wydatku.
        </Muted>

        <View style={styles.actions}>
          <Button
            title={editing ? 'Zapisz zmiany' : amount ? `Dodaj · ${formatMoney(amount)} / mies.` : 'Dodaj'}
            onPress={save}
            disabled={!canSave}
          />
          {editing && (
            <Button
              title="Usuń stałą opłatę"
              variant="secondary"
              onPress={() =>
                confirmAction('Usunąć stałą opłatę?', `${editing.emoji} ${editing.name}`, 'Usuń', () => {
                  deleteFixedCost(editing.id);
                  router.back();
                })
              }
            />
          )}
        </View>
      </ScrollView>
    </>
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
  headerButton: {
    fontSize: 17,
  },
  content: {
    padding: Spacing.lg,
    paddingBottom: 48,
    gap: Spacing.sm,
  },
  chips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
  },
  input: {
    borderRadius: Radius.md,
    paddingHorizontal: Spacing.lg,
    paddingVertical: 14,
    fontSize: 17,
  },
  amountRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: Radius.md,
    paddingHorizontal: Spacing.lg,
  },
  amountInput: {
    flex: 1,
    fontSize: 24,
    fontWeight: '700',
    paddingVertical: Spacing.md,
  },
  currency: {
    fontSize: 20,
    fontWeight: '600',
  },
  stepper: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.xl,
    borderRadius: Radius.md,
    paddingVertical: Spacing.md,
  },
  stepButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepButtonText: {
    fontSize: 24,
    fontWeight: '600',
  },
  stepValue: {
    fontSize: 28,
    fontWeight: '800',
    minWidth: 56,
    textAlign: 'center',
    fontVariant: ['tabular-nums'],
  },
  hint: {
    marginTop: Spacing.xs,
  },
  actions: {
    marginTop: Spacing.lg,
    gap: Spacing.sm,
  },
});
