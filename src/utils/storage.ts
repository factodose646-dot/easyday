export interface NoteItem {
  id: string;
  title: string;
  description: string;
  createdAt: number;
  updatedAt: number;
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

export type UdhaarDirection = 'given' | 'borrowed';

export interface UdhaarContact {
  id: string;
  name: string;
  phone: string;
  createdAt: number;
  updatedAt: number;
}

export interface UdhaarPayment {
  id: string;
  amount: number;
  date: string; // YYYY-MM-DD
  note: string;
  createdAt: number;
}

export interface UdhaarTransaction {
  id: string;
  contactId: string;
  direction: UdhaarDirection;
  amount: number;
  paidAmount: number;
  date: string; // YYYY-MM-DD
  dueDate?: string; // YYYY-MM-DD
  description: string;
  payments: UdhaarPayment[];
  createdAt: number;
  updatedAt: number;
}

export type BillCategory =
  | 'electricity'
  | 'gas'
  | 'water'
  | 'internet'
  | 'mobile'
  | 'rent'
  | 'school'
  | 'other';

export type BillRepeat = 'one-time' | 'monthly' | 'custom';

export type BillReminderTiming = '1-day' | '3-days' | 'on-due';

export interface BillItem {
  id: string;
  seriesId: string;
  name: string;
  category: BillCategory;
  provider: string;
  amount: number;
  dueDate: string; // YYYY-MM-DD
  accountNumber: string;
  photoDataUrl?: string;
  repeat: BillRepeat;
  customIntervalDays?: number;
  reminderTiming: BillReminderTiming;
  status: 'pending' | 'paid';
  paidAt?: number;
  paidDate?: string; // YYYY-MM-DD
  nextCycleGenerated?: boolean;
  createdAt: number;
  updatedAt: number;
}

export interface BillPaymentRecord {
  id: string;
  billId: string;
  billName: string;
  category: BillCategory;
  provider: string;
  amount: number;
  dueDate: string;
  paidDate: string; // YYYY-MM-DD
  paidAt: number;
  note: string;
}

const KEYS = {
  notes: 'easyday-notes',
  transactions: 'easyday-transactions',
  udhaarContacts: 'easyday-udhaar-contacts',
  udhaarTransactions: 'easyday-udhaar-transactions',
  bills: 'easyday-bills',
  billPayments: 'easyday-bill-payments',
  billOverdueNotified: 'easyday-bill-overdue-notified',
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

export const notesStorage = {
  load: (): NoteItem[] =>
    safeReadArray<NoteItem>(KEYS.notes).filter(
      (n) => n && typeof n.id === 'string' && typeof n.title === 'string'
    ),
  save: (items: NoteItem[]) => safeWriteArray(KEYS.notes, items),
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

export const udhaarStorage = {
  loadContacts: (): UdhaarContact[] =>
    safeReadArray<UdhaarContact>(KEYS.udhaarContacts).filter(
      (c) => c && typeof c.id === 'string' && typeof c.name === 'string'
    ),
  saveContacts: (items: UdhaarContact[]) => safeWriteArray(KEYS.udhaarContacts, items),
  loadTransactions: (): UdhaarTransaction[] =>
    safeReadArray<UdhaarTransaction>(KEYS.udhaarTransactions)
      .filter(
        (tx) =>
          tx &&
          typeof tx.id === 'string' &&
          typeof tx.contactId === 'string' &&
          (tx.direction === 'given' || tx.direction === 'borrowed') &&
          typeof tx.amount === 'number' &&
          Number.isFinite(tx.amount) &&
          tx.amount > 0
      )
      .map((tx) => ({
        ...tx,
        paidAmount:
          typeof tx.paidAmount === 'number' && Number.isFinite(tx.paidAmount)
            ? tx.paidAmount
            : 0,
        payments: Array.isArray(tx.payments) ? tx.payments : [],
      })),
  saveTransactions: (items: UdhaarTransaction[]) =>
    safeWriteArray(KEYS.udhaarTransactions, items),
};

export const billsStorage = {
  loadBills: (): BillItem[] =>
    safeReadArray<BillItem>(KEYS.bills).filter(
      (b) =>
        b &&
        typeof b.id === 'string' &&
        typeof b.name === 'string' &&
        typeof b.amount === 'number' &&
        Number.isFinite(b.amount) &&
        typeof b.dueDate === 'string'
    ),
  saveBills: (items: BillItem[]) => safeWriteArray(KEYS.bills, items),
  loadPayments: (): BillPaymentRecord[] =>
    safeReadArray<BillPaymentRecord>(KEYS.billPayments).filter(
      (p) =>
        p &&
        typeof p.id === 'string' &&
        typeof p.billId === 'string' &&
        typeof p.amount === 'number' &&
        Number.isFinite(p.amount)
    ),
  savePayments: (items: BillPaymentRecord[]) => safeWriteArray(KEYS.billPayments, items),
  loadOverdueNotifiedKeys: (): string[] =>
    safeReadArray<string>(KEYS.billOverdueNotified).filter(
      (k) => typeof k === 'string'
    ),
  saveOverdueNotifiedKeys: (keys: string[]) =>
    safeWriteArray(KEYS.billOverdueNotified, keys.slice(-250)),
};
