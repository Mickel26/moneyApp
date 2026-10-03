export type Category = {
  id: string;
  label: string;
  emoji: string;
  color: string;
};

export const CATEGORIES: Category[] = [
  { id: 'food', label: 'Jedzenie', emoji: '🍔', color: '#F97316' },
  { id: 'groceries', label: 'Zakupy', emoji: '🛒', color: '#22C55E' },
  { id: 'coffee', label: 'Kawa', emoji: '☕', color: '#A16207' },
  { id: 'transport', label: 'Transport', emoji: '🚌', color: '#3B82F6' },
  { id: 'party', label: 'Wyjścia', emoji: '🍻', color: '#EAB308' },
  { id: 'fun', label: 'Rozrywka', emoji: '🎮', color: '#8B5CF6' },
  { id: 'clothes', label: 'Ubrania', emoji: '👕', color: '#EC4899' },
  { id: 'study', label: 'Uczelnia', emoji: '📚', color: '#14B8A6' },
  { id: 'health', label: 'Zdrowie', emoji: '💊', color: '#EF4444' },
  { id: 'subscriptions', label: 'Subskrypcje', emoji: '📱', color: '#6366F1' },
  { id: 'gifts', label: 'Prezenty', emoji: '🎁', color: '#F43F5E' },
  { id: 'other', label: 'Inne', emoji: '📦', color: '#64748B' },
];

const byId = new Map(CATEGORIES.map((c) => [c.id, c]));

export function getCategory(id: string): Category {
  return byId.get(id) ?? byId.get('other')!;
}
