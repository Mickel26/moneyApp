# Budżet 💸

Prosta aplikacja na iPhone'a do śledzenia codziennych wydatków. Ustawiasz, ile masz na miesiąc,
a aplikacja co dzień pokazuje, **ile możesz dziś wydać**, żeby starczyło do końca okresu.

## Co potrafi

- **Dziś** – ile jeszcze możesz dziś wydać, dzienny limit, ile zostało w budżecie, ile dni do końca
  okresu, limit „od jutra” i ocena tempa (zielone / żółte / czerwone) z prognozą na koniec miesiąca.
- **Szybkie dodawanie wydatku** – kwota, kategoria (emoji), dzień (dziś / wczoraj / przedwczoraj)
  i opcjonalna notatka. Zanim zapiszesz, widać, ile po tym wydatku zostanie na dziś.
- **Historia** – wydatki pogrupowane po dniach. Stuknij, aby edytować, przytrzymaj, aby usunąć.
- **Statystyki** – średnia dzienna kontra plan, wykres dzień po dniu, podział na kategorie,
  największy wydatek.
- **Ustawienia** – kwota budżetu i dzień, w którym dostajesz pieniądze (np. 10. – stypendium).
- Działa offline, dane są zapisywane tylko na telefonie. Obsługuje tryb ciemny.

### Jak liczony jest dzienny limit

```
limit na dziś = (budżet − wydatki z poprzednich dni) ÷ liczba dni do końca okresu (z dzisiejszym)
```

Limit jest stały przez cały dzień. Jeśli wydasz mniej, od jutra limit trochę wzrośnie; jeśli więcej –
spadnie. Kwoty są przechowywane w groszach, więc nie ma błędów zaokrągleń.

## Jak uruchomić na iPhonie (bez Maca)

1. Zainstaluj [Node.js](https://nodejs.org) (wersja 20 lub nowsza) na komputerze.
2. Zainstaluj na iPhonie aplikację **Expo Go** z App Store.
3. W folderze projektu:

   ```bash
   npm install
   npm start
   ```

4. Zeskanuj kod QR z terminala **aparatem iPhone'a** – aplikacja otworzy się w Expo Go.
   Telefon i komputer muszą być w tej samej sieci Wi-Fi (albo uruchom `npx expo start --tunnel`).

### Własna aplikacja na ekranie głównym

Expo Go wystarczy do codziennego używania, ale jeśli chcesz mieć osobną ikonę „Budżet”:

- **Z Makiem:** `npx expo run:ios --device` (wymaga Xcode; z darmowym kontem Apple aplikację
  trzeba ponownie zainstalować co 7 dni).
- **Bez Maca:** `npx eas-cli build --platform ios` – budowanie w chmurze Expo
  (instalacja na telefonie wymaga płatnego konta Apple Developer).

## Dla programistów

Expo SDK 57, React Native, Expo Router (natywne karty iOS), TypeScript, AsyncStorage.

```bash
npm test           # testy logiki budżetu (jest)
npm run typecheck  # tsc
npm run lint       # eslint
npm run web        # podgląd w przeglądarce
```

```
src/
  app/              ekrany (Expo Router)
    (tabs)/         Dziś, Historia, Statystyki, Ustawienia
    add.tsx         dodawanie / edycja wydatku (modal)
  components/       wspólne komponenty UI
  constants/        kolory i kategorie
  lib/budget.ts     cała matematyka budżetu (czyste funkcje + testy)
  lib/store.tsx     stan aplikacji i zapis w AsyncStorage
```
