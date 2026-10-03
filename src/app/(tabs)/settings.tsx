import * as Haptics from 'expo-haptics';
import { Alert, StyleSheet } from 'react-native';

import { BudgetForm } from '@/components/budget-form';
import { Button, Card, Muted, Screen, SectionLabel } from '@/components/ui';
import { Spacing } from '@/constants/theme';
import { pluralize } from '@/lib/budget';
import { useStore } from '@/lib/store';

export default function SettingsScreen() {
  const { settings, expenses, saveSettings, resetAll } = useStore();

  const confirmReset = () =>
    Alert.alert('Usunąć wszystkie dane?', 'Budżet i wszystkie wydatki zostaną trwale usunięte.', [
      { text: 'Anuluj', style: 'cancel' },
      { text: 'Usuń', style: 'destructive', onPress: resetAll },
    ]);

  return (
    <Screen title="Ustawienia">
      <SectionLabel>Budżet</SectionLabel>
      <BudgetForm
        // Remount when settings change elsewhere (e.g. onboarding or reset).
        key={settings ? `${settings.budget}-${settings.periodStartDay}` : 'empty'}
        initial={settings}
        submitLabel="Zapisz budżet"
        onSubmit={(next) => {
          saveSettings(next);
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
          Alert.alert('Zapisano ✅', 'Limity dzienne zostały przeliczone.');
        }}
      />

      <SectionLabel>Dane</SectionLabel>
      <Card>
        <Muted>
          Wszystko jest zapisywane tylko na Twoim telefonie (zapisane:{' '}
          {expenses.length} {pluralize(expenses.length, ['wydatek', 'wydatki', 'wydatków'])}).
        </Muted>
        <Button title="Usuń wszystkie dane" variant="danger" onPress={confirmReset} />
      </Card>

      <SectionLabel>Jak to działa?</SectionLabel>
      <Card style={styles.help}>
        <Muted>
          • Dzienny limit = (budżet − wydatki z poprzednich dni) ÷ dni do końca okresu.
        </Muted>
        <Muted>• Jeśli dziś wydasz mniej, od jutra limit trochę wzrośnie. Jeśli więcej – spadnie.</Muted>
        <Muted>• Kolor paska pokazuje tempo: zielony – OK, żółty – trochę za szybko, czerwony – za szybko.</Muted>
      </Card>
    </Screen>
  );
}

const styles = StyleSheet.create({
  help: {
    gap: Spacing.sm,
  },
});
