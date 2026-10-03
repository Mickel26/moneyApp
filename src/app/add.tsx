import * as Haptics from 'expo-haptics';
import { router, Stack, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';

import { Button, Chip, Muted, SectionLabel } from '@/components/ui';
import { CATEGORIES } from '@/constants/categories';
import { Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { confirmDeleteExpense } from '@/lib/actions';
import { addDays, amountToInput, formatMoney, parseAmount, relativeDayLabel, summarize } from '@/lib/budget';
import { confirmIfDuplicate, readClipboardPayment } from '@/lib/payment-import';
import { useStore } from '@/lib/store';

export default function AddExpenseScreen() {
  const theme = useTheme();
  // Besides `id` (edit), the form can be prefilled from an Apple Pay payment (see payment-import.ts).
  const params = useLocalSearchParams<{
    id?: string;
    amount?: string;
    note?: string;
    category?: string;
    day?: string;
    raw?: string;
  }>();
  const {
    expenses,
    settings,
    fixedCosts,
    importedPayments,
    today,
    addExpense,
    updateExpense,
    deleteExpense,
    markPaymentImported,
  } = useStore();
  const editing = params.id ? expenses.find((e) => e.id === params.id) : undefined;
  const prefilledAmount = params.amount ? Number(params.amount) : null;

  const [amountText, setAmountText] = useState(
    editing ? amountToInput(editing.amount) : prefilledAmount ? amountToInput(prefilledAmount) : '',
  );
  const [category, setCategory] = useState(editing?.category ?? (params.category || 'food'));
  const [note, setNote] = useState(editing?.note ?? params.note ?? '');
  const [day, setDay] = useState(editing?.day ?? (params.day || today));
  const [importedRaw, setImportedRaw] = useState<string | null>(params.raw || null);

  const pasteFromPayment = async () => {
    const payment = await readClipboardPayment();
    if (!payment) return;
    confirmIfDuplicate(payment, importedPayments, () => {
      if (payment.amount !== null) setAmountText(amountToInput(payment.amount));
      if (payment.merchant) setNote(payment.merchant);
      if (payment.category) setCategory(payment.category);
      if (payment.day) setDay(payment.day);
      setImportedRaw(payment.raw);
      Haptics.selectionAsync();
    });
  };

  const amount = parseAmount(amountText);
  const dayOptions = [today, addDays(today, -1), addDays(today, -2)];
  if (!dayOptions.includes(day)) dayOptions.push(day);

  // Preview of how this expense changes today's allowance.
  let preview: string | null = null;
  if (settings && amount !== null) {
    const others = expenses.filter((e) => e.id !== editing?.id);
    const after = summarize(settings, [...others, { id: 'preview', amount, category, day, createdAt: 0 }], today, fixedCosts);
    preview =
      after.leftToday >= 0
        ? `Po tym wydatku na dziś zostanie ${formatMoney(after.leftToday)}`
        : `To przekroczy dzisiejszy limit o ${formatMoney(-after.leftToday)}`;
  }

  const save = () => {
    if (amount === null) return;
    const data = { amount, category, note: note.trim() || undefined, day };
    if (editing) updateExpense(editing.id, data);
    else addExpense(data);
    if (importedRaw) markPaymentImported(importedRaw);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    router.back();
  };

  return (
    <>
      <Stack.Screen
        options={{
          title: editing ? 'Edytuj wydatek' : 'Nowy wydatek',
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
        <View style={styles.amountRow}>
          <TextInput
            value={amountText}
            onChangeText={setAmountText}
            placeholder="0"
            placeholderTextColor={theme.textSecondary}
            keyboardType="decimal-pad"
            autoFocus={!editing && !prefilledAmount}
            style={[styles.amountInput, { color: theme.text }]}
            accessibilityLabel="Kwota"
          />
          <Text style={[styles.currency, { color: theme.textSecondary }]}>zł</Text>
        </View>
        {!editing && (
          <View style={styles.pasteRow}>
            {importedRaw ? (
              <Muted>📋 Uzupełnione z płatności Apple Pay</Muted>
            ) : (
              <Chip label="📋 Wklej z płatności Apple Pay" selected={false} onPress={pasteFromPayment} />
            )}
          </View>
        )}
        {preview && (
          <Muted style={[styles.preview, preview.startsWith('To przekroczy') && { color: theme.over }]}>
            {preview}
          </Muted>
        )}

        <SectionLabel>Kategoria</SectionLabel>
        <View style={styles.grid}>
          {CATEGORIES.map((c) => {
            const selected = c.id === category;
            return (
              <Pressable
                key={c.id}
                onPress={() => {
                  setCategory(c.id);
                  Haptics.selectionAsync();
                }}
                accessibilityRole="button"
                accessibilityState={{ selected }}
                style={[
                  styles.category,
                  {
                    backgroundColor: selected ? c.color + '2E' : theme.card,
                    borderColor: selected ? c.color : 'transparent',
                  },
                ]}>
                <Text style={styles.categoryEmoji}>{c.emoji}</Text>
                <Text style={[styles.categoryLabel, { color: theme.text }]} numberOfLines={1}>
                  {c.label}
                </Text>
              </Pressable>
            );
          })}
        </View>

        <SectionLabel>Kiedy</SectionLabel>
        <View style={styles.chips}>
          {dayOptions.map((d) => (
            <Chip key={d} label={relativeDayLabel(d, today)} selected={d === day} onPress={() => setDay(d)} />
          ))}
        </View>

        <SectionLabel>Notatka (opcjonalnie)</SectionLabel>
        <TextInput
          value={note}
          onChangeText={setNote}
          placeholder="np. kebab po zajęciach"
          placeholderTextColor={theme.textSecondary}
          style={[styles.noteInput, { backgroundColor: theme.card, color: theme.text }]}
          returnKeyType="done"
          onSubmitEditing={save}
        />

        <View style={styles.actions}>
          <Button title={editing ? 'Zapisz zmiany' : 'Dodaj wydatek'} onPress={save} disabled={amount === null} />
          {editing && (
            <Button
              title="Usuń wydatek"
              variant="secondary"
              onPress={() => confirmDeleteExpense(editing, deleteExpense, () => router.back())}
            />
          )}
        </View>
      </ScrollView>
    </>
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
  amountRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'center',
    gap: Spacing.sm,
    marginTop: Spacing.md,
  },
  amountInput: {
    fontSize: 64,
    fontWeight: '800',
    minWidth: 80,
    textAlign: 'center',
    fontVariant: ['tabular-nums'],
  },
  currency: {
    fontSize: 32,
    fontWeight: '700',
  },
  pasteRow: {
    alignItems: 'center',
    marginBottom: Spacing.xs,
  },
  preview: {
    textAlign: 'center',
    marginBottom: Spacing.sm,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
  },
  category: {
    width: '31.5%',
    flexGrow: 1,
    alignItems: 'center',
    paddingVertical: Spacing.md,
    borderRadius: Radius.md,
    borderWidth: 2,
    gap: 4,
  },
  categoryEmoji: {
    fontSize: 26,
  },
  categoryLabel: {
    fontSize: 13,
    fontWeight: '600',
  },
  chips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
  },
  noteInput: {
    borderRadius: Radius.md,
    paddingHorizontal: Spacing.lg,
    paddingVertical: 14,
    fontSize: 16,
  },
  actions: {
    marginTop: Spacing.lg,
    gap: Spacing.sm,
  },
});
