import { Language } from '../types';

export interface NoteItem {
  id: string;
  title: string;
  description: string;
  createdAt: number;
  updatedAt: number;
}

export type TransactionType = 'income' | 'expense';

export type TransactionSourceType = 'manual' | 'bill' | 'udhaar_payment';

export type TransactionAccountingKind =
  | 'standard'
  | 'bill_payment'
  | 'udhaar_collected'
  | 'udhaar_repaid';

export type TransactionCategory =
  | 'salary'
  | 'business'
  | 'freelance'
  | 'gift'
  | 'udhaar_collection'
  | 'food'
  | 'transport'
  | 'bills'
  | 'shopping'
  | 'health'
  | 'education'
  | 'udhaar_repayment'
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
  sourceType?: TransactionSourceType;
  sourceId?: string;
  parentSourceId?: string;
  billPaymentId?: string;
  accountingKind?: TransactionAccountingKind;
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
  updatedAt?: number;
  linkedTransactionId?: string;
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
  /** Preferred IndexedDB photo reference ID */
  photoId?: string;
  /** Legacy inline Data URL preserved strictly until IndexedDB copy is verified */
  photoDataUrl?: string;
  repeat: BillRepeat;
  customIntervalDays?: number;
  reminderTiming: BillReminderTiming;
  status: 'pending' | 'paid';
  paidAt?: number;
  paidDate?: string; // YYYY-MM-DD
  nextCycleGenerated?: boolean;
  linkedExpenseId?: string;
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
  linkedExpenseId?: string;
}

export type KametiPaymentFrequency = 'monthly' | 'biweekly' | 'weekly';

export type KametiStatus = 'active' | 'completed';

export type KametiPaymentMethod =
  | 'Cash'
  | 'JazzCash'
  | 'EasyPaisa'
  | 'Bank Transfer'
  | 'Other';

export type KametiInstallmentStatus = 'paid' | 'partial' | 'unpaid' | 'overdue';

export interface KametiCommittee {
  id: string;
  name: string;
  monthlyInstallment: number;
  memberCount: number;
  startDate: string; // YYYY-MM-DD
  durationMonths: number;
  paymentFrequency: KametiPaymentFrequency;
  collectionDay: number; // 1-31 day of month
  description: string;
  status: KametiStatus;
  createdAt: number;
  updatedAt: number;
}

export interface KametiMember {
  id: string;
  committeeId: string;
  name: string;
  phone: string;
  address?: string;
  memberNumber: number;
  joiningDate: string; // YYYY-MM-DD
  assignedTurnNumber?: number;
  createdAt: number;
  updatedAt: number;
}

export interface KametiInstallment {
  id: string;
  committeeId: string;
  memberId: string;
  cycleNumber: number; // 1-based schedule cycle
  cycleMonthISO: string; // YYYY-MM
  dueDate: string; // YYYY-MM-DD
  expectedAmount: number;
  createdAt: number;
  updatedAt: number;
}

export interface KametiPaymentRecord {
  id: string;
  committeeId: string;
  memberId: string;
  installmentId: string;
  amount: number;
  paymentDate: string; // YYYY-MM-DD
  paymentMethod: KametiPaymentMethod;
  note: string;
  createdAt: number;
}

export interface KametiDrawRecord {
  id: string;
  committeeId: string;
  cycleNumber: number;
  turnNumber: number;
  memberId: string;
  payoutDate: string; // YYYY-MM-DD
  payoutAmount: number;
  isCompleted: boolean;
  drawMode: 'manual' | 'random';
  notes: string;
  createdAt: number;
  updatedAt: number;
}

export interface KametiDataset {
  committees: KametiCommittee[];
  members: KametiMember[];
  installments: KametiInstallment[];
  payments: KametiPaymentRecord[];
  draws: KametiDrawRecord[];
}

export interface BackupReminderMeta {
  lastBackupAt: number;
  lastBackupMethod:
    | 'android-picker'
    | 'android-share'
    | 'browser-picker'
    | 'browser-download'
    | 'web-share';
  filename: string;
}

export type StorageErrorCode =
  | 'QUOTA_EXCEEDED'
  | 'STORAGE_UNAVAILABLE'
  | 'SERIALIZATION_FAILED'
  | 'IDB_UNAVAILABLE'
  | 'IDB_WRITE_FAILED'
  | 'IDB_READ_FAILED'
  | 'PHOTO_VERIFY_FAILED'
  | 'UNKNOWN_STORAGE_ERROR';

export interface StorageWriteResult {
  ok: boolean;
  errorCode?: StorageErrorCode;
  message?: string;
}

export interface StorageHealthReport {
  available: boolean;
  usedBytes: number;
  quotaBytes: number;
  usagePercent: number;
  isNearLimit: boolean;
  isCritical: boolean;
  legacyInlinePhotoCount: number;
  corruptedKeys: string[];
}

export const STORAGE_KEYS = {
  notes: 'easyday-notes',
  transactions: 'easyday-transactions',
  udhaarContacts: 'easyday-udhaar-contacts',
  udhaarTransactions: 'easyday-udhaar-transactions',
  bills: 'easyday-bills',
  billPayments: 'easyday-bill-payments',
  billOverdueNotified: 'easyday-bill-overdue-notified',
  language: 'easyday-language',
  theme: 'easyday-theme',
  recentTools: 'easyday-recent-tools',
  lastBackupMeta: 'easyday-last-backup-meta',
  securityConfig: 'easyday-security-config',
  kametiCommittees: 'easyday-kameti-committees',
  kametiMembers: 'easyday-kameti-members',
  kametiInstallments: 'easyday-kameti-installments',
  kametiPayments: 'easyday-kameti-payments',
  kametiDraws: 'easyday-kameti-draws',
} as const;

// Conservative 5 MB estimate typical of Android WebView / browser LocalStorage
const DEFAULT_LOCALSTORAGE_QUOTA_BYTES = 5 * 1024 * 1024;

export function classifyStorageError(err: unknown): StorageErrorCode {
  if (!err) return 'UNKNOWN_STORAGE_ERROR';
  const name =
    typeof err === 'object' && 'name' in err ? String((err as { name: unknown }).name) : '';
  const message =
    typeof err === 'object' && 'message' in err
      ? String((err as { message: unknown }).message)
      : String(err);
  const code =
    typeof err === 'object' && 'code' in err ? Number((err as { code: unknown }).code) : 0;

  if (
    name === 'QuotaExceededError' ||
    name === 'NS_ERROR_DOM_QUOTA_REACHED' ||
    code === 22 ||
    code === 1014 ||
    /quota|exceeded|full|space/i.test(message)
  ) {
    return 'QUOTA_EXCEEDED';
  }
  if (/securityerror|access is denied|storage is not available/i.test(`${name} ${message}`)) {
    return 'STORAGE_UNAVAILABLE';
  }
  return 'UNKNOWN_STORAGE_ERROR';
}

export function getStorageErrorMessage(
  code: StorageErrorCode,
  lang: Language = 'en'
): string {
  if (lang === 'ur') {
    switch (code) {
      case 'QUOTA_EXCEEDED':
        return 'ڈیوائس اسٹوریج کی حد پوری ہو گئی ہے، اس لیے نیا ڈیٹا محفوظ نہیں ہو سکا۔ براہ کرم سیٹنگز سے بیک اپ محفوظ کریں اور غیر ضروری تصاویر یا پرانا ریکارڈ کم کریں۔';
      case 'STORAGE_UNAVAILABLE':
        return 'ڈیوائس اسٹوریج تک رسائی دستیاب نہیں ہے۔ آپ کا حالیہ اندراج محفوظ نہیں ہو سکا۔';
      case 'SERIALIZATION_FAILED':
        return 'ڈیٹا محفوظ کرنے کی تیاری میں خرابی پیش آئی۔ آپ کا ریکارڈ تبدیل نہیں کیا گیا۔';
      case 'IDB_UNAVAILABLE':
        return 'بل کی تصاویر محفوظ کرنے والا ڈیٹابیس (IndexedDB) دستیاب نہیں ہے۔';
      case 'IDB_WRITE_FAILED':
      case 'PHOTO_VERIFY_FAILED':
        return 'بل کی تصویر محفوظ یا تصدیق نہیں ہو سکی۔ براہ کرم اسٹوریج چیک کر کے دوبارہ کوشش کریں۔';
      case 'IDB_READ_FAILED':
        return 'بل کی محفوظ شدہ تصویر لوڈ نہیں ہو سکی۔';
      default:
        return 'ڈیٹا محفوظ کرنے میں خرابی پیش آئی۔ براہ کرم دوبارہ کوشش کریں یا بیک اپ محفوظ کر لیں۔';
    }
  }

  switch (code) {
    case 'QUOTA_EXCEEDED':
      return 'Device local storage is full, so this change could not be saved. Export a backup in Settings and free up space before retrying.';
    case 'STORAGE_UNAVAILABLE':
      return 'Device local storage is unavailable or restricted. Your latest change was not saved.';
    case 'SERIALIZATION_FAILED':
      return 'Unable to serialize this record for storage. Existing saved data was kept unchanged.';
    case 'IDB_UNAVAILABLE':
      return 'Offline photo database (IndexedDB) is unavailable on this device.';
    case 'IDB_WRITE_FAILED':
    case 'PHOTO_VERIFY_FAILED':
      return 'Could not save or verify the bill photo in device storage. Your bill data was not discarded—please try again.';
    case 'IDB_READ_FAILED':
      return 'Could not read stored bill photo from offline storage.';
    default:
      return 'Failed to save data to device storage. Please check available space or create a backup in Settings.';
  }
}

export function safeWriteString(key: string, value: string): StorageWriteResult {
  if (typeof localStorage === 'undefined') {
    return {
      ok: false,
      errorCode: 'STORAGE_UNAVAILABLE',
      message: getStorageErrorMessage('STORAGE_UNAVAILABLE', 'en'),
    };
  }
  try {
    localStorage.setItem(key, value);
    return { ok: true };
  } catch (err) {
    const errorCode = classifyStorageError(err);
    return {
      ok: false,
      errorCode,
      message: getStorageErrorMessage(errorCode, 'en'),
    };
  }
}

function safeReadArray<T>(key: string): T[] {
  try {
    if (typeof localStorage === 'undefined') return [];
    const raw = localStorage.getItem(key);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as T[]) : [];
  } catch {
    return [];
  }
}

function safeWriteArray<T>(key: string, items: T[]): StorageWriteResult {
  let serialized = '';
  try {
    serialized = JSON.stringify(items);
  } catch {
    return {
      ok: false,
      errorCode: 'SERIALIZATION_FAILED',
      message: getStorageErrorMessage('SERIALIZATION_FAILED', 'en'),
    };
  }
  return safeWriteString(key, serialized);
}

/**
 * Inspects localStorage byte usage, checks for near-limit quota conditions,
 * counts unmigrated legacy inline bill photos, and detects unreadable JSON keys.
 */
export function inspectLocalStorageHealth(): StorageHealthReport {
  if (typeof localStorage === 'undefined') {
    return {
      available: false,
      usedBytes: 0,
      quotaBytes: DEFAULT_LOCALSTORAGE_QUOTA_BYTES,
      usagePercent: 0,
      isNearLimit: false,
      isCritical: false,
      legacyInlinePhotoCount: 0,
      corruptedKeys: [],
    };
  }

  let usedChars = 0;
  const corruptedKeys: string[] = [];

  try {
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i);
      if (!k) continue;
      const v = localStorage.getItem(k) ?? '';
      usedChars += k.length + v.length;
    }
  } catch {
    return {
      available: false,
      usedBytes: 0,
      quotaBytes: DEFAULT_LOCALSTORAGE_QUOTA_BYTES,
      usagePercent: 0,
      isNearLimit: false,
      isCritical: false,
      legacyInlinePhotoCount: 0,
      corruptedKeys: [],
    };
  }

  // UTF-16 code units occupy 2 bytes each in DOM Storage
  const usedBytes = usedChars * 2;
  const usagePercent = Math.min(
    100,
    Math.round((usedBytes / DEFAULT_LOCALSTORAGE_QUOTA_BYTES) * 1000) / 10
  );

  const arrayKeysToVerify = [
    STORAGE_KEYS.notes,
    STORAGE_KEYS.transactions,
    STORAGE_KEYS.udhaarContacts,
    STORAGE_KEYS.udhaarTransactions,
    STORAGE_KEYS.bills,
    STORAGE_KEYS.billPayments,
    STORAGE_KEYS.kametiCommittees,
    STORAGE_KEYS.kametiMembers,
    STORAGE_KEYS.kametiInstallments,
    STORAGE_KEYS.kametiPayments,
    STORAGE_KEYS.kametiDraws,
  ];
  for (const key of arrayKeysToVerify) {
    try {
      const raw = localStorage.getItem(key);
      if (raw !== null) {
        const parsed = JSON.parse(raw);
        if (!Array.isArray(parsed)) corruptedKeys.push(key);
      }
    } catch {
      corruptedKeys.push(key);
    }
  }

  const bills = safeReadArray<BillItem>(STORAGE_KEYS.bills);
  const legacyInlinePhotoCount = bills.filter(
    (b) => b && typeof b.photoDataUrl === 'string' && b.photoDataUrl.startsWith('data:')
  ).length;

  return {
    available: true,
    usedBytes,
    quotaBytes: DEFAULT_LOCALSTORAGE_QUOTA_BYTES,
    usagePercent,
    isNearLimit: usagePercent >= 70,
    isCritical: usagePercent >= 88,
    legacyInlinePhotoCount,
    corruptedKeys,
  };
}

export function formatByteSize(bytes: number): string {
  if (!Number.isFinite(bytes) || bytes <= 0) return '0 KB';
  if (bytes < 1024) return `${Math.round(bytes)} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
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
    safeReadArray<NoteItem>(STORAGE_KEYS.notes).filter(
      (n) => n && typeof n.id === 'string' && typeof n.title === 'string'
    ),
  save: (items: NoteItem[]): StorageWriteResult =>
    safeWriteArray(STORAGE_KEYS.notes, items),
};

export const transactionsStorage = {
  load: (): TransactionItem[] =>
    safeReadArray<TransactionItem>(STORAGE_KEYS.transactions).filter(
      (tx) =>
        tx &&
        typeof tx.id === 'string' &&
        (tx.type === 'income' || tx.type === 'expense') &&
        typeof tx.amount === 'number' &&
        Number.isFinite(tx.amount)
    ),
  save: (items: TransactionItem[]): StorageWriteResult =>
    safeWriteArray(STORAGE_KEYS.transactions, items),
};

export const udhaarStorage = {
  loadContacts: (): UdhaarContact[] =>
    safeReadArray<UdhaarContact>(STORAGE_KEYS.udhaarContacts).filter(
      (c) => c && typeof c.id === 'string' && typeof c.name === 'string'
    ),
  saveContacts: (items: UdhaarContact[]): StorageWriteResult =>
    safeWriteArray(STORAGE_KEYS.udhaarContacts, items),
  loadTransactions: (): UdhaarTransaction[] =>
    safeReadArray<UdhaarTransaction>(STORAGE_KEYS.udhaarTransactions)
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
  saveTransactions: (items: UdhaarTransaction[]): StorageWriteResult =>
    safeWriteArray(STORAGE_KEYS.udhaarTransactions, items),
};

export const billsStorage = {
  loadBills: (): BillItem[] =>
    safeReadArray<BillItem>(STORAGE_KEYS.bills).filter(
      (b) =>
        b &&
        typeof b.id === 'string' &&
        typeof b.name === 'string' &&
        typeof b.amount === 'number' &&
        Number.isFinite(b.amount) &&
        typeof b.dueDate === 'string'
    ),
  saveBills: (items: BillItem[]): StorageWriteResult =>
    safeWriteArray(STORAGE_KEYS.bills, items),
  loadPayments: (): BillPaymentRecord[] =>
    safeReadArray<BillPaymentRecord>(STORAGE_KEYS.billPayments).filter(
      (p) =>
        p &&
        typeof p.id === 'string' &&
        typeof p.billId === 'string' &&
        typeof p.amount === 'number' &&
        Number.isFinite(p.amount)
    ),
  savePayments: (items: BillPaymentRecord[]): StorageWriteResult =>
    safeWriteArray(STORAGE_KEYS.billPayments, items),
  loadOverdueNotifiedKeys: (): string[] =>
    safeReadArray<string>(STORAGE_KEYS.billOverdueNotified).filter(
      (k) => typeof k === 'string'
    ),
  saveOverdueNotifiedKeys: (keys: string[]): StorageWriteResult =>
    safeWriteArray(STORAGE_KEYS.billOverdueNotified, keys.slice(-250)),
};

export const backupMetaStorage = {
  loadLastBackupMeta: (): BackupReminderMeta | null => {
    try {
      if (typeof localStorage === 'undefined') return null;
      const raw = localStorage.getItem(STORAGE_KEYS.lastBackupMeta);
      if (!raw) return null;
      const parsed = JSON.parse(raw) as Partial<BackupReminderMeta>;
      if (
        typeof parsed.lastBackupAt === 'number' &&
        Number.isFinite(parsed.lastBackupAt) &&
        typeof parsed.filename === 'string'
      ) {
        return {
          lastBackupAt: parsed.lastBackupAt,
          lastBackupMethod: parsed.lastBackupMethod || 'browser-download',
          filename: parsed.filename,
        };
      }
      return null;
    } catch {
      return null;
    }
  },
  saveLastBackupMeta: (meta: BackupReminderMeta): StorageWriteResult => {
    try {
      return safeWriteString(STORAGE_KEYS.lastBackupMeta, JSON.stringify(meta));
    } catch {
      return {
        ok: false,
        errorCode: 'SERIALIZATION_FAILED',
        message: getStorageErrorMessage('SERIALIZATION_FAILED', 'en'),
      };
    }
  },
};

export const kametiStorage = {
  loadCommittees: (): KametiCommittee[] =>
    safeReadArray<KametiCommittee>(STORAGE_KEYS.kametiCommittees).filter(
      (c) =>
        c &&
        typeof c.id === 'string' &&
        typeof c.name === 'string' &&
        typeof c.monthlyInstallment === 'number' &&
        Number.isFinite(c.monthlyInstallment) &&
        c.monthlyInstallment > 0 &&
        typeof c.memberCount === 'number' &&
        Number.isFinite(c.memberCount) &&
        c.memberCount > 0 &&
        typeof c.durationMonths === 'number' &&
        Number.isFinite(c.durationMonths) &&
        c.durationMonths > 0
    ),
  saveCommittees: (items: KametiCommittee[]): StorageWriteResult =>
    safeWriteArray(STORAGE_KEYS.kametiCommittees, items),

  loadMembers: (): KametiMember[] =>
    safeReadArray<KametiMember>(STORAGE_KEYS.kametiMembers).filter(
      (m) =>
        m &&
        typeof m.id === 'string' &&
        typeof m.committeeId === 'string' &&
        typeof m.name === 'string' &&
        typeof m.memberNumber === 'number' &&
        Number.isFinite(m.memberNumber)
    ),
  saveMembers: (items: KametiMember[]): StorageWriteResult =>
    safeWriteArray(STORAGE_KEYS.kametiMembers, items),

  loadInstallments: (): KametiInstallment[] =>
    safeReadArray<KametiInstallment>(STORAGE_KEYS.kametiInstallments).filter(
      (ins) =>
        ins &&
        typeof ins.id === 'string' &&
        typeof ins.committeeId === 'string' &&
        typeof ins.memberId === 'string' &&
        typeof ins.cycleNumber === 'number' &&
        typeof ins.dueDate === 'string' &&
        typeof ins.expectedAmount === 'number' &&
        Number.isFinite(ins.expectedAmount) &&
        ins.expectedAmount > 0
    ),
  saveInstallments: (items: KametiInstallment[]): StorageWriteResult =>
    safeWriteArray(STORAGE_KEYS.kametiInstallments, items),

  loadPayments: (): KametiPaymentRecord[] =>
    safeReadArray<KametiPaymentRecord>(STORAGE_KEYS.kametiPayments).filter(
      (p) =>
        p &&
        typeof p.id === 'string' &&
        typeof p.committeeId === 'string' &&
        typeof p.memberId === 'string' &&
        typeof p.installmentId === 'string' &&
        typeof p.amount === 'number' &&
        Number.isFinite(p.amount) &&
        p.amount > 0 &&
        typeof p.paymentDate === 'string'
    ),
  savePayments: (items: KametiPaymentRecord[]): StorageWriteResult =>
    safeWriteArray(STORAGE_KEYS.kametiPayments, items),

  loadDraws: (): KametiDrawRecord[] =>
    safeReadArray<KametiDrawRecord>(STORAGE_KEYS.kametiDraws).filter(
      (d) =>
        d &&
        typeof d.id === 'string' &&
        typeof d.committeeId === 'string' &&
        typeof d.memberId === 'string' &&
        typeof d.turnNumber === 'number' &&
        Number.isFinite(d.turnNumber)
    ),
  saveDraws: (items: KametiDrawRecord[]): StorageWriteResult =>
    safeWriteArray(STORAGE_KEYS.kametiDraws, items),

  loadAll: (): KametiDataset => ({
    committees: kametiStorage.loadCommittees(),
    members: kametiStorage.loadMembers(),
    installments: kametiStorage.loadInstallments(),
    payments: kametiStorage.loadPayments(),
    draws: kametiStorage.loadDraws(),
  }),

  saveAll: (dataset: KametiDataset): StorageWriteResult => {
    const r1 = kametiStorage.saveCommittees(dataset.committees);
    if (!r1.ok) return r1;
    const r2 = kametiStorage.saveMembers(dataset.members);
    if (!r2.ok) return r2;
    const r3 = kametiStorage.saveInstallments(dataset.installments);
    if (!r3.ok) return r3;
    const r4 = kametiStorage.savePayments(dataset.payments);
    if (!r4.ok) return r4;
    return kametiStorage.saveDraws(dataset.draws);
  },
};
