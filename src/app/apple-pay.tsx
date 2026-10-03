import * as Clipboard from 'expo-clipboard';
import { router, Stack } from 'expo-router';
import { useState } from 'react';
import { Platform, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { Button, Card, Muted, SectionLabel } from '@/components/ui';
import { Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { notify } from '@/lib/actions';
import { formatMoney } from '@/lib/budget';
import { PAYMENT_PREFIX } from '@/lib/payment';
import { categoryHint, ClipboardPayment, readClipboardPayment } from '@/lib/payment-import';

// Field names follow the Polish iOS UI; English names in brackets in case the phone is in English.
const STEPS: { title: string; body: string }[] = [
  {
    title: 'Nowa automatyzacja',
    body: 'Otwórz aplikację Skróty → zakładka „Automatyzacja” → „+” (Nowa automatyzacja).',
  },
  {
    title: 'Wyzwalacz „Transakcja”',
    body:
      'Wybierz „Transakcja” [Transaction]. Zaznacz karty, którymi płacisz w Apple Pay, zostaw wszystkie ' +
      'kategorie i wybierz „Uruchom natychmiast” [Run Immediately]. Stuknij „Dalej” i „Nowy pusty skrót”.',
  },
  {
    title: 'Akcja „Formatuj datę”',
    body:
      'Dodaj akcję „Formatuj datę” [Format Date]. Data: „Bieżąca data” [Current Date], ' +
      'format: „ISO 8601”. Dzięki temu wydatek trafi na właściwy dzień, nawet jeśli dodasz go później.',
  },
  {
    title: 'Akcja „Tekst”',
    body:
      `Dodaj akcję „Tekst” [Text] i wpisz dokładnie: ${PAYMENT_PREFIX}| (albo Budget|) potem zmienna Kwota | zmienna ` +
      'Sprzedawca | zmienna Sformatowana data. Zmienne wstawiasz, stukając „Wejście skrótu” [Shortcut Input] ' +
      'i wybierając pole „Kwota” [Amount] albo „Sprzedawca” [Merchant]. Oddzielaj je znakiem |.',
  },
  {
    title: 'Akcja „Kopiuj do schowka”',
    body: 'Dodaj akcję „Kopiuj do schowka” [Copy to Clipboard] – skopiuje tekst z poprzedniego kroku.',
  },
  {
    title: 'Powiadomienie (opcjonalnie)',
    body:
      'Dodaj „Pokaż powiadomienie” [Show Notification], np. „💸 Dodaj do Budżetu”. Przypomni Ci, żeby ' +
      'otworzyć aplikację. Na koniec stuknij „Gotowe”.',
  },
];

export default function ApplePayGuideScreen() {
  const theme = useTheme();
  const [result, setResult] = useState<ClipboardPayment | null>(null);

  const check = async () => {
    const payment = await readClipboardPayment();
    setResult(payment);
  };

  const copyExample = async () => {
    const now = new Date();
    const offset = -now.getTimezoneOffset();
    const pad = (n: number) => String(Math.floor(Math.abs(n))).padStart(2, '0');
    const iso =
      `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}T${pad(now.getHours())}:` +
      `${pad(now.getMinutes())}:${pad(now.getSeconds())}${offset >= 0 ? '+' : '-'}${pad(offset / 60)}:${pad(offset % 60)}`;
    await Clipboard.setStringAsync(`${PAYMENT_PREFIX}|12,50 zł|Starbucks|${iso}`);
    notify('Skopiowano przykład', 'Teraz wróć na ekran „Dziś” i stuknij „📋 Z płatności Apple Pay”.');
  };

  return (
    <>
      <Stack.Screen
        options={{
          headerLeft: () => (
            <Pressable onPress={() => router.back()} hitSlop={12}>
              <Text style={[styles.headerButton, { color: theme.accent }]}>Zamknij</Text>
            </Pressable>
          ),
        }}
      />
      <ScrollView style={{ flex: 1, backgroundColor: theme.background }} contentContainerStyle={styles.content}>
        <Muted style={styles.intro}>
          iPhone nie pozwala aplikacjom czytać powiadomień z banku, ale aplikacja Skróty może po każdej płatności
          Apple Pay skopiować kwotę i nazwę sklepu. Ustawiasz to raz, zajmuje ok. 3 minuty.
        </Muted>

        <SectionLabel>Konfiguracja skrótu</SectionLabel>
        <Card style={styles.steps}>
          {STEPS.map((step, i) => (
            <View key={step.title} style={styles.step}>
              <View style={[styles.stepNumber, { backgroundColor: theme.accent }]}>
                <Text style={styles.stepNumberText}>{i + 1}</Text>
              </View>
              <View style={styles.stepTexts}>
                <Text style={[styles.stepTitle, { color: theme.text }]}>{step.title}</Text>
                <Muted>{step.body}</Muted>
              </View>
            </View>
          ))}
          <View style={[styles.template, { backgroundColor: theme.cardMuted }]}>
            <Muted style={styles.small}>Tekst w kroku 4 ma wyglądać tak:</Muted>
            <Text style={[styles.mono, { color: theme.text }]}>
              {PAYMENT_PREFIX}|[Kwota]|[Sprzedawca]|[Sformatowana data]
            </Text>
          </View>
        </Card>

        <SectionLabel>Jak dodawać wydatki</SectionLabel>
        <Card>
          <Muted>
            Po zapłaceniu telefonem otwórz Budżet i stuknij „📋 Z płatności Apple Pay”. iPhone zapyta, czy
            pozwolić na wklejenie – stuknij „Wklej”. Kwota, sklep i kategoria uzupełnią się same; sprawdź je i
            stuknij „Dodaj wydatek”.
          </Muted>
          <Muted>
            Działa tylko przy płatnościach Apple Pay. Wydatki kartą, BLIK-iem i gotówką dodawaj ręcznie. Jeśli
            bank nie przekazuje kwoty, uzupełni się tylko nazwa sklepu.
          </Muted>
        </Card>

        <SectionLabel>Sprawdź, czy działa</SectionLabel>
        <Card>
          <Button title="Sprawdź schowek" onPress={check} />
          {result && (
            <View style={[styles.template, { backgroundColor: theme.cardMuted }]}>
              <Text style={[styles.stepTitle, { color: theme.good }]}>✓ Rozpoznano płatność</Text>
              <Muted>Kwota: {result.amount !== null ? formatMoney(result.amount) : 'brak'}</Muted>
              <Muted>Sklep: {result.merchant ?? 'brak'}</Muted>
              <Muted>Dzień: {result.day ?? 'dziś'}</Muted>
              <Muted>Kategoria: {categoryHint(result)}</Muted>
            </View>
          )}
          <Button title="Skopiuj przykładową płatność" variant="secondary" onPress={copyExample} />
        </Card>
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
    gap: Spacing.md,
  },
  intro: {
    fontSize: 15,
    lineHeight: 21,
  },
  steps: {
    gap: Spacing.lg,
  },
  step: {
    flexDirection: 'row',
    gap: Spacing.md,
  },
  stepNumber: {
    width: 26,
    height: 26,
    borderRadius: 13,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepNumberText: {
    color: '#fff',
    fontWeight: '800',
  },
  stepTexts: {
    flex: 1,
    gap: 2,
  },
  stepTitle: {
    fontSize: 16,
    fontWeight: '700',
  },
  template: {
    borderRadius: Radius.sm,
    padding: Spacing.md,
    gap: 4,
  },
  small: {
    fontSize: 12,
  },
  mono: {
    fontFamily: Platform.select({ ios: 'Menlo', default: 'monospace' }),
    fontSize: 13,
  },
});
