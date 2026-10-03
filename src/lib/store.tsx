import AsyncStorage from '@react-native-async-storage/async-storage';
import { createContext, ReactNode, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { AppState } from 'react-native';

import { DayKey, Expense, FixedCost, Settings, toDayKey } from '@/lib/budget';

const STORAGE_KEY = 'budzet:v1';

type PersistedState = {
  settings: Settings | null;
  expenses: Expense[];
  fixedCosts: FixedCost[];
  /** Raw clipboard texts of Apple Pay payments already added, to warn about duplicates. */
  importedPayments: string[];
};

type Store = PersistedState & {
  loaded: boolean;
  today: DayKey;
  addExpense: (expense: Omit<Expense, 'id' | 'createdAt'>) => void;
  updateExpense: (id: string, changes: Partial<Omit<Expense, 'id'>>) => void;
  deleteExpense: (id: string) => void;
  saveSettings: (settings: Settings) => void;
  saveFixedCost: (fixedCost: Omit<FixedCost, 'id'> & { id?: string }) => void;
  deleteFixedCost: (id: string) => void;
  markPaymentImported: (raw: string) => void;
  resetAll: () => void;
};

const EMPTY_STATE: PersistedState = {
  settings: null,
  expenses: [],
  fixedCosts: [],
  importedPayments: [],
};

const MAX_IMPORTED_PAYMENTS = 100;

const StoreContext = createContext<Store | null>(null);

const newId = () => `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;

/** Today's date key, refreshed after midnight and when the app comes back to the foreground. */
function useToday(): DayKey {
  const [today, setToday] = useState(() => toDayKey(new Date()));
  useEffect(() => {
    const refresh = () => setToday(toDayKey(new Date()));
    const interval = setInterval(refresh, 60_000);
    const subscription = AppState.addEventListener('change', (state) => {
      if (state === 'active') refresh();
    });
    return () => {
      clearInterval(interval);
      subscription.remove();
    };
  }, []);
  return today;
}

export function StoreProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<PersistedState>(EMPTY_STATE);
  const [loaded, setLoaded] = useState(false);
  const today = useToday();
  const skipNextSave = useRef(true);

  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY)
      .then((raw) => {
        if (!raw) return;
        const parsed = JSON.parse(raw) as Partial<PersistedState>;
        setState({
          settings: parsed.settings ?? null,
          expenses: parsed.expenses ?? [],
          fixedCosts: parsed.fixedCosts ?? [],
          importedPayments: parsed.importedPayments ?? [],
        });
      })
      .catch((error) => console.warn('Nie udało się wczytać danych', error))
      .finally(() => setLoaded(true));
  }, []);

  useEffect(() => {
    if (!loaded) return;
    // The first run after loading would just write back what we read.
    if (skipNextSave.current) {
      skipNextSave.current = false;
      return;
    }
    AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(state)).catch((error) =>
      console.warn('Nie udało się zapisać danych', error),
    );
  }, [state, loaded]);

  const addExpense = useCallback((expense: Omit<Expense, 'id' | 'createdAt'>) => {
    setState((s) => ({
      ...s,
      expenses: [{ ...expense, id: newId(), createdAt: Date.now() }, ...s.expenses],
    }));
  }, []);

  const updateExpense = useCallback((id: string, changes: Partial<Omit<Expense, 'id'>>) => {
    setState((s) => ({
      ...s,
      expenses: s.expenses.map((e) => (e.id === id ? { ...e, ...changes } : e)),
    }));
  }, []);

  const deleteExpense = useCallback((id: string) => {
    setState((s) => ({ ...s, expenses: s.expenses.filter((e) => e.id !== id) }));
  }, []);

  const saveSettings = useCallback((settings: Settings) => {
    setState((s) => ({ ...s, settings }));
  }, []);

  const saveFixedCost = useCallback((fixedCost: Omit<FixedCost, 'id'> & { id?: string }) => {
    setState((s) => {
      const { id } = fixedCost;
      const fixedCosts = id
        ? s.fixedCosts.map((f) => (f.id === id ? { ...fixedCost, id } : f))
        : [...s.fixedCosts, { ...fixedCost, id: newId() }];
      return { ...s, fixedCosts };
    });
  }, []);

  const deleteFixedCost = useCallback((id: string) => {
    setState((s) => ({ ...s, fixedCosts: s.fixedCosts.filter((f) => f.id !== id) }));
  }, []);

  const markPaymentImported = useCallback((raw: string) => {
    setState((s) => ({
      ...s,
      importedPayments: [raw, ...s.importedPayments.filter((p) => p !== raw)].slice(0, MAX_IMPORTED_PAYMENTS),
    }));
  }, []);

  const resetAll = useCallback(() => {
    setState(EMPTY_STATE);
  }, []);

  const value = useMemo<Store>(
    () => ({
      ...state,
      loaded,
      today,
      addExpense,
      updateExpense,
      deleteExpense,
      saveSettings,
      saveFixedCost,
      deleteFixedCost,
      markPaymentImported,
      resetAll,
    }),
    [
      state,
      loaded,
      today,
      addExpense,
      updateExpense,
      deleteExpense,
      saveSettings,
      saveFixedCost,
      deleteFixedCost,
      markPaymentImported,
      resetAll,
    ],
  );

  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>;
}

export function useStore(): Store {
  const store = useContext(StoreContext);
  if (!store) throw new Error('useStore must be used inside <StoreProvider>');
  return store;
}

/** Expenses sorted newest first (by day, then by time added). */
export function sortExpenses(expenses: Expense[]): Expense[] {
  return [...expenses].sort((a, b) => (a.day === b.day ? b.createdAt - a.createdAt : a.day < b.day ? 1 : -1));
}
