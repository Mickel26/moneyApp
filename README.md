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
- **Stałe opłaty** – Spotify, telefon, akademik… Są odejmowane od budżetu z góry, więc dzień płatności
  nie zjada dziennego limitu. Na ekranie „Dziś” widać, co już zapłacone, a co dopiero zejdzie.
- **Ustawienia** – kwota budżetu i dzień, w którym dostajesz pieniądze (np. 10. – stypendium).
- Działa offline, dane są zapisywane tylko na telefonie. Obsługuje tryb ciemny.

### Jak liczony jest dzienny limit

```
limit na dziś = (budżet − stałe opłaty − wydatki z poprzednich dni) ÷ dni do końca okresu (z dzisiejszym)
```

Limit jest stały przez cały dzień. Jeśli wydasz mniej, od jutra limit trochę wzrośnie; jeśli więcej –
spadnie. Kwoty są przechowywane w groszach, więc nie ma błędów zaokrągleń.

## Instalacja na iPhonie (jak zwykła aplikacja) 📲

Aplikacja działa jako **PWA**: instalujesz ją z Safari, dostaje własną ikonę na ekranie głównym,
otwiera się na pełnym ekranie i działa offline. Bez Maca, bez App Store, za darmo, nic nie wygasa.

1. Otwórz w **Safari** na iPhonie: **https://mickel26.github.io/moneyApp/**
2. Stuknij **Udostępnij** (kwadrat ze strzałką) → **Dodaj do ekranu początkowego** → **Dodaj**.
3. Uruchamiaj aplikację z ikony **Budżet** – nie z Safari.

> Dane są zapisane w aplikacji z ekranu głównego (osobno od Safari). Jeśli usuniesz ikonę,
> usuniesz też dane.

### Publikowanie (jednorazowa konfiguracja)

Po każdym pushu na `main` (lub gałąź roboczą) GitHub Actions buduje wersję web i wrzuca ją na gałąź
`gh-pages` (`.github/workflows/deploy-web.yml`). Trzeba tylko raz włączyć GitHub Pages:
**Settings → Pages → Build and deployment → Source: Deploy from a branch → `gh-pages` / `(root)` → Save**.

### Inne sposoby

- **Expo Go** (do testów): zainstaluj Expo Go z App Store, na komputerze `npm install && npm start`
  i zeskanuj kod QR aparatem (telefon i komputer w tej samej sieci Wi-Fi).
- **Natywna aplikacja:** `npx eas-cli build --platform ios` + TestFlight (wymaga płatnego konta
  Apple Developer, 99 $/rok) albo `npx expo run:ios --device` z Makiem i Xcode (z darmowym kontem
  aplikację trzeba instalować ponownie co 7 dni).

## Dla programistów

Expo SDK 57, React Native, Expo Router (natywne karty iOS), TypeScript, AsyncStorage.

```bash
npm test           # testy logiki budżetu (jest)
npm run typecheck  # tsc
npm run lint       # eslint
npm run web        # podgląd w przeglądarce
WEB_BASE_URL=/moneyApp npx expo export --platform web   # build PWA jak na GitHub Pages
```

```
src/
  app/              ekrany (Expo Router)
    (tabs)/         Dziś, Historia, Statystyki, Ustawienia
    add.tsx         dodawanie / edycja wydatku (modal)
    fixed.tsx       dodawanie / edycja stałej opłaty (modal)
  components/       wspólne komponenty UI
  constants/        kolory i kategorie
  lib/budget.ts     cała matematyka budżetu (czyste funkcje + testy)
  lib/store.tsx     stan aplikacji i zapis w AsyncStorage
public/             pliki PWA: manifest, ikony, service worker (offline), szablon HTML
```
