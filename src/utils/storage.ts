import { CalcHistoryItem } from './calculatorEngine';

export interface NoteItem {
  id: string;
  title: string;
  description: string;
  createdAt: number;
  updatedAt: number;
}

export interface TodoItem {
  id: string;
  text: string;
  completed: boolean;
  createdAt: number;
}

export type TransactionType = 'income' | 'expense';

export type TransactionCategory =
  | 'salary'
  | 'business'
  | 'freelance'
  | 'gift'
  | 'food'
  | 'transport'
  | 'bills'
  | 'shopping'
  | 'health'
  | 'education'
  | 'other';

export interface TransactionItem {
  id: string;
  type: TransactionType;
  amount: number;
  description: string;
  category: TransactionCategory;
  date: string; // YYYY-MM-DD
  createdAt: number;
  updatedAt: number;
}

const KEYS = {
  calcHistory: 'easyday-calc-history',
  notes: 'easyday-notes',
  todos: 'easyday-todos',
  transactions: 'easyday-transactions',
} as const;

function safeReadArray<T>(key: string): T[] {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as T[]) : [];
  } catch {
    return [];
  }
}

function safeWriteArray<T>(key: string, items: T[]): void {
  try {
    localStorage.setItem(key, JSON.stringify(items));
  } catch {
    // Ignore quota or restricted mode failures gracefully
  }
}

export function generateId(prefix: string): string {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
}

export function getTodayISO(): string {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, '0');
  const d = String(now.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export function getCurrentMonthISO(): string {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, '0');
  return `${y}-${m}`;
}

export const calcHistoryStorage = {
  load: (): CalcHistoryItem[] =>
    safeReadArray<CalcHistoryItem>(KEYS.calcHistory).filter(
      (i) => i && typeof i.expression === 'string' && typeof i.result === 'string'
    ),
  save: (items: CalcHistoryItem[]) => safeWriteArray(KEYS.calcHistory, items),
};

export const notesStorage = {
  load: (): NoteItem[] =>
    safeReadArray<NoteItem>(KEYS.notes).filter(
      (n) => n && typeof n.id === 'string' && typeof n.title === 'string'
    ),
  save: (items: NoteItem[]) => safeWriteArray(KEYS.notes, items),
};

export const todosStorage = {
  load: (): TodoItem[] =>
    safeReadArray<TodoItem>(KEYS.todos).filter(
      (t) => t && typeof t.id === 'string' && typeof t.text === 'string'
    ),
  save: (items: TodoItem[]) => safeWriteArray(KEYS.todos, items),
};

export const transactionsStorage = {
  load: (): TransactionItem[] =>
    safeReadArray<TransactionItem>(KEYS.transactions).filter(
      (tx) =>
        tx &&
        typeof tx.id === 'string' &&
        (tx.type === 'income' || tx.type === 'expense') &&
        typeof tx.amount === 'number' &&
        Number.isFinite(tx.amount)
    ),
  save: (items: TransactionItem[]) => safeWriteArray(KEYS.transactions, items),
};
