import { TOOLS } from '../data/tools';
import { Language, Theme, ToolId } from '../types';
import {
  isNativeAndroid,
  openAndroidBackupWithPicker,
  saveAndroidBackupWithPicker,
  shareAndroidBackupFile,
} from './androidBridge';
import {
  BillPhotoRecord,
  computePhotoContentHash,
  estimateDataUrlByteSize,
  extractMimeTypeFromDataUrl,
  getAllBillPhotos,
  isIndexedDBAvailable,
  migrateLegacyBillPhotosToIndexedDB,
  replaceAllBillPhotosTransactional,
} from './photoStorage';
import {
  BackupReminderMeta,
  backupMetaStorage,
  BillItem,
  BillPaymentRecord,
  billsStorage,
  classifyStorageError,
  getStorageErrorMessage,
  KametiCommittee,
  KametiDataset,
  KametiDrawRecord,
  KametiInstallment,
  KametiMember,
  KametiPaymentRecord,
  kametiStorage,
  NoteItem,
  notesStorage,
  safeWriteString,
  STORAGE_KEYS,
  StorageErrorCode,
  TransactionItem,
  transactionsStorage,
  UdhaarContact,
  udhaarStorage,
  UdhaarTransaction,
} from './storage';

export const BACKUP_FORMAT_ID = 'easyday-backup' as const;
export const BACKUP_FORMAT_VERSION = 1 as const;
export const EASYDAY_APP_VERSION = '1.0.0' as const;

export interface EasyDayBackupPayload {
  format: typeof BACKUP_FORMAT_ID;
  version: typeof BACKUP_FORMAT_VERSION;
  appVersion: string;
  createdAt: string;
  createdAtMs: number;
  summary: BackupPreviewSummary;
  data: {
    udhaar: {
      contacts: UdhaarContact[];
      transactions: UdhaarTransaction[];
    };
    bills: {
      items: BillItem[];
      payments: BillPaymentRecord[];
      overdueNotifiedKeys: string[];
    };
    expenses: TransactionItem[];
    notes: NoteItem[];
    kameti: KametiDataset;
    settings: {
      language: Language;
      theme: Theme;
      recentToolIds: ToolId[];
    };
    otherLocalData: Record<string, string>;
    photos: BillPhotoRecord[];
  };
}

export interface BackupPreviewSummary {
  udhaarContactsCount: number;
  udhaarTransactionsCount: number;
  billsCount: number;
  billPaymentsCount: number;
  expensesCount: number;
  kametiCount: number;
  notesCount: number;
  photosCount: number;
  createdAt: string;
  appVersion: string;
  formatVersion: number;
}

export type BackupValidationErrorCode =
  | 'EMPTY_FILE'
  | 'INVALID_JSON'
  | 'INVALID_FORMAT'
  | 'UNSUPPORTED_VERSION'
  | 'INCOMPLETE_STRUCTURE'
  | 'CORRUPTED_RECORDS';

export interface BackupValidationResult {
  ok: boolean;
  backup?: EasyDayBackupPayload;
  preview?: BackupPreviewSummary;
  errorCode?: BackupValidationErrorCode;
  message?: string;
}

export interface BackupExportOutcome {
  status: 'saved' | 'shared' | 'cancelled' | 'error';
  filename?: string;
  locationLabel?: string;
  meta?: BackupReminderMeta;
  errorMessage?: string;
}

export interface BackupRestoreOutcome {
  ok: boolean;
  rolledBack: boolean;
  restoredLanguage?: Language;
  restoredTheme?: Theme;
  restoredRecentToolIds?: ToolId[];
  preview?: BackupPreviewSummary;
  errorMessage?: string;
}

const CORE_SCHEMA_KEYS = new Set<string>([
  STORAGE_KEYS.notes,
  STORAGE_KEYS.transactions,
  STORAGE_KEYS.udhaarContacts,
  STORAGE_KEYS.udhaarTransactions,
  STORAGE_KEYS.bills,
  STORAGE_KEYS.billPayments,
  STORAGE_KEYS.billOverdueNotified,
  STORAGE_KEYS.language,
  STORAGE_KEYS.theme,
  STORAGE_KEYS.recentTools,
  STORAGE_KEYS.lastBackupMeta,
  STORAGE_KEYS.securityConfig,
  STORAGE_KEYS.kametiCommittees,
  STORAGE_KEYS.kametiMembers,
  STORAGE_KEYS.kametiInstallments,
  STORAGE_KEYS.kametiPayments,
  STORAGE_KEYS.kametiDraws,
]);

function isPlainObject(val: unknown): val is Record<string, unknown> {
  return typeof val === 'object' && val !== null && !Array.isArray(val);
}

function getBackupValidationMessage(
  code: BackupValidationErrorCode,
  lang: Language
): string {
  if (lang === 'ur') {
    switch (code) {
      case 'EMPTY_FILE':
        return 'منتخب بیک اپ فائل خالی ہے یا اس میں کوئی ڈیٹا موجود نہیں۔';
      case 'INVALID_JSON':
        return 'بیک اپ فائل درست JSON فارمیٹ میں نہیں ہے۔ براہ کرم درست EasyDay بیک اپ فائل منتخب کریں۔';
      case 'INVALID_FORMAT':
        return 'یہ فائل EasyDay بیک اپ فارمیٹ سے مطابقت نہیں رکھتی۔';
      case 'UNSUPPORTED_VERSION':
        return 'اس بیک اپ فائل کا ورژن اس ایپ میں سپورٹ نہیں ہے۔';
      case 'INCOMPLETE_STRUCTURE':
        return 'بیک اپ فائل نامکمل ہے یا اس کے ضروری حصے (بلز، اخراجات، ادھار، نوٹس) غائب ہیں۔';
      case 'CORRUPTED_RECORDS':
        return 'بیک اپ فائل میں خراب یا ادھورا ریکارڈ موجود ہے، اس لیے بحالی روک دی گئی تاکہ آپ کا موجودہ ڈیٹا محفوظ رہے۔';
    }
  }

  switch (code) {
    case 'EMPTY_FILE':
      return 'The selected backup file is empty and cannot be restored.';
    case 'INVALID_JSON':
      return 'The selected file is not valid JSON or is corrupted.';
    case 'INVALID_FORMAT':
      return 'This file is not a valid EasyDay backup file.';
    case 'UNSUPPORTED_VERSION':
      return 'This backup format version is not supported by this version of EasyDay.';
    case 'INCOMPLETE_STRUCTURE':
      return 'This backup file is incomplete and missing required EasyDay data sections.';
    case 'CORRUPTED_RECORDS':
      return 'This backup contains corrupted records or broken relationships. Existing device data was untouched.';
  }
}

function formatBackupTimestampFilename(): string {
  const d = new Date();
  const y = d.getFullYear();
  const mo = String(d.getMonth() + 1).padStart(2, '0');
  const da = String(d.getDate()).padStart(2, '0');
  const hh = String(d.getHours()).padStart(2, '0');
  const mm = String(d.getMinutes()).padStart(2, '0');
  return `EasyDay-Backup-${y}-${mo}-${da}_${hh}-${mm}.json`;
}

function verifyArrayKeyReadable(key: string): void {
  if (typeof localStorage === 'undefined') {
    throw new Error('LocalStorage unavailable');
  }
  const raw = localStorage.getItem(key);
  if (raw === null) return;
  const parsed: unknown = JSON.parse(raw);
  if (!Array.isArray(parsed)) {
    throw new Error(`Corrupted non-array data at key "${key}"`);
  }
}

/**
 * Builds a complete, lossless EasyDay JSON backup containing all financial ledgers,
 * bills, IndexedDB photos, notes, preferences, and auxiliary localStorage keys.
 */
export async function buildCompleteBackupPayload(
  lang: Language = 'en'
): Promise<EasyDayBackupPayload> {
  // 1. Migrate any pending legacy inline Base64 bill photos safely first
  await migrateLegacyBillPhotosToIndexedDB();

  // 2. Verify every critical financial array key parses cleanly so no records are silently dropped
  try {
    verifyArrayKeyReadable(STORAGE_KEYS.udhaarContacts);
    verifyArrayKeyReadable(STORAGE_KEYS.udhaarTransactions);
    verifyArrayKeyReadable(STORAGE_KEYS.bills);
    verifyArrayKeyReadable(STORAGE_KEYS.billPayments);
    verifyArrayKeyReadable(STORAGE_KEYS.transactions);
    verifyArrayKeyReadable(STORAGE_KEYS.notes);
    verifyArrayKeyReadable(STORAGE_KEYS.kametiCommittees);
    verifyArrayKeyReadable(STORAGE_KEYS.kametiMembers);
    verifyArrayKeyReadable(STORAGE_KEYS.kametiInstallments);
    verifyArrayKeyReadable(STORAGE_KEYS.kametiPayments);
    verifyArrayKeyReadable(STORAGE_KEYS.kametiDraws);
  } catch {
    throw new Error(
      lang === 'ur'
        ? 'مقامی اسٹوریج میں خراب ڈیٹا ملا جس کی وجہ سے بیک اپ تیار نہیں ہو سکا۔'
        : 'Corrupted local storage structure detected. Backup aborted to avoid creating an incomplete file.'
    );
  }

  const udhaarContacts = udhaarStorage.loadContacts();
  const udhaarTransactions = udhaarStorage.loadTransactions();
  const billsRaw = billsStorage.loadBills();
  const billPayments = billsStorage.loadPayments();
  const overdueNotifiedKeys = billsStorage.loadOverdueNotifiedKeys();
  const expenses = transactionsStorage.load();
  const notes = notesStorage.load();
  const kameti = kametiStorage.loadAll();

  // Strict count cross-check against raw localStorage JSON length so no financial record is silently skipped
  const checkRawCount = (key: string, loadedLen: number, label: string) => {
    const raw = typeof localStorage !== 'undefined' ? localStorage.getItem(key) : null;
    if (!raw) return;
    const arr = JSON.parse(raw) as unknown[];
    if (arr.length !== loadedLen) {
      throw new Error(
        lang === 'ur'
          ? `${label} کے کچھ ریکارڈ خراب پائے گئے، مکمل بیک اپ روک دیا گیا۔`
          : `Some ${label} records could not be verified. Backup stopped rather than silently skipping records.`
      );
    }
  };
  checkRawCount(STORAGE_KEYS.udhaarContacts, udhaarContacts.length, 'Udhaar contacts');
  checkRawCount(STORAGE_KEYS.udhaarTransactions, udhaarTransactions.length, 'Udhaar transactions');
  checkRawCount(STORAGE_KEYS.bills, billsRaw.length, 'Bills');
  checkRawCount(STORAGE_KEYS.billPayments, billPayments.length, 'Bill payments');
  checkRawCount(STORAGE_KEYS.transactions, expenses.length, 'Expenses');
  checkRawCount(STORAGE_KEYS.notes, notes.length, 'Notes');
  checkRawCount(STORAGE_KEYS.kametiCommittees, kameti.committees.length, 'Kameti committees');
  checkRawCount(STORAGE_KEYS.kametiMembers, kameti.members.length, 'Kameti members');
  checkRawCount(STORAGE_KEYS.kametiInstallments, kameti.installments.length, 'Kameti installments');
  checkRawCount(STORAGE_KEYS.kametiPayments, kameti.payments.length, 'Kameti payments');
  checkRawCount(STORAGE_KEYS.kametiDraws, kameti.draws.length, 'Kameti draws');

  // 3. Load IndexedDB photos (never silently skip photos when IndexedDB is present)
  let photos: BillPhotoRecord[] = [];
  if (isIndexedDBAvailable()) {
    try {
      photos = await getAllBillPhotos();
    } catch {
      throw new Error(getStorageErrorMessage('IDB_READ_FAILED', lang));
    }
  }

  // If any bill still has an inline legacy photoDataUrl (e.g. if IDB was unavailable),
  // convert/include it inside `photos` while preserving exact link via `photoId`
  const photoMap = new Map<string, BillPhotoRecord>();
  for (const p of photos) {
    if (p && p.id) photoMap.set(p.id, p);
  }

  const normalizedBills: BillItem[] = billsRaw.map((bill) => {
    if (bill.photoDataUrl && bill.photoDataUrl.startsWith('data:')) {
      const contentHash = computePhotoContentHash(bill.photoDataUrl);
      let existing = Array.from(photoMap.values()).find(
        (p) => p.contentHash === contentHash && p.dataUrl === bill.photoDataUrl
      );
      if (!existing) {
        const synthesizedId = bill.photoId || `bphoto-mig-${bill.id}`;
        existing = {
          id: synthesizedId,
          dataUrl: bill.photoDataUrl,
          mimeType: extractMimeTypeFromDataUrl(bill.photoDataUrl),
          sizeBytes: estimateDataUrlByteSize(bill.photoDataUrl),
          contentHash,
          createdAt: bill.createdAt || Date.now(),
          updatedAt: bill.updatedAt || Date.now(),
        };
        photoMap.set(existing.id, existing);
      }
      const copy: BillItem = { ...bill, photoId: existing.id };
      delete copy.photoDataUrl;
      return copy;
    }
    return bill;
  });

  const allPhotos = Array.from(photoMap.values());

  // 4. Settings & remaining auxiliary localStorage keys
  let savedLang: Language = 'en';
  let savedTheme: Theme = 'dark';
  let savedRecents: ToolId[] = [
    'udhaar-manager',
    'bills-reminder',
    'expense-tracker',
    'notes',
  ];
  const otherLocalData: Record<string, string> = {};

  if (typeof localStorage !== 'undefined') {
    const rawLang = localStorage.getItem(STORAGE_KEYS.language);
    if (rawLang === 'en' || rawLang === 'ur') savedLang = rawLang;

    const rawTheme = localStorage.getItem(STORAGE_KEYS.theme);
    if (rawTheme === 'light' || rawTheme === 'dark') savedTheme = rawTheme;

    const rawRecents = localStorage.getItem(STORAGE_KEYS.recentTools);
    if (rawRecents) {
      try {
        const parsed = JSON.parse(rawRecents);
        const validIds = new Set(TOOLS.map((t) => t.id));
        if (Array.isArray(parsed)) {
          const cleaned = parsed.filter((id): id is ToolId => validIds.has(id));
          if (cleaned.length > 0) savedRecents = cleaned.slice(0, 4);
        }
      } catch {
        // Keep defaults
      }
    }

    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i);
      if (!k || CORE_SCHEMA_KEYS.has(k)) continue;
      const v = localStorage.getItem(k);
      if (v !== null) {
        otherLocalData[k] = v;
      }
    }
  }

  const now = Date.now();
  const createdAt = new Date(now).toISOString();

  const summary: BackupPreviewSummary = {
    udhaarContactsCount: udhaarContacts.length,
    udhaarTransactionsCount: udhaarTransactions.length,
    billsCount: normalizedBills.length,
    billPaymentsCount: billPayments.length,
    expensesCount: expenses.length,
    kametiCount: kameti.committees.length,
    notesCount: notes.length,
    photosCount: allPhotos.length,
    createdAt,
    appVersion: EASYDAY_APP_VERSION,
    formatVersion: BACKUP_FORMAT_VERSION,
  };

  return {
    format: BACKUP_FORMAT_ID,
    version: BACKUP_FORMAT_VERSION,
    appVersion: EASYDAY_APP_VERSION,
    createdAt,
    createdAtMs: now,
    summary,
    data: {
      udhaar: {
        contacts: udhaarContacts,
        transactions: udhaarTransactions,
      },
      bills: {
        items: normalizedBills,
        payments: billPayments,
        overdueNotifiedKeys,
      },
      expenses,
      notes,
      kameti,
      settings: {
        language: savedLang,
        theme: savedTheme,
        recentToolIds: savedRecents,
      },
      otherLocalData,
      photos: allPhotos,
    },
  };
}

interface BrowserSavePickerWindow extends Window {
  showSaveFilePicker?: (options?: {
    suggestedName?: string;
    types?: Array<{
      description?: string;
      accept: Record<string, string[]>;
    }>;
  }) => Promise<{
    name: string;
    createWritable: () => Promise<{
      write: (data: Blob) => Promise<void>;
      close: () => Promise<void>;
    }>;
  }>;
}

export async function saveBackupToDevice(
  lang: Language
): Promise<BackupExportOutcome> {
  try {
    const payload = await buildCompleteBackupPayload(lang);
    const filename = formatBackupTimestampFilename();
    const jsonString = JSON.stringify(payload, null, 2);

    // 1. Native Android SAF Picker
    if (isNativeAndroid()) {
      const res = await saveAndroidBackupWithPicker(filename, jsonString);
      if (res.cancelled || !res.saved) {
        return { status: 'cancelled' };
      }
      const meta: BackupReminderMeta = {
        lastBackupAt: Date.now(),
        lastBackupMethod: 'android-picker',
        filename: res.displayName || filename,
      };
      backupMetaStorage.saveLastBackupMeta(meta);
      return {
        status: 'saved',
        filename: res.displayName || filename,
        locationLabel: res.displayPath || res.displayName || filename,
        meta,
      };
    }

    // 2. Desktop/Modern Chromium Save Picker
    if (
      typeof window !== 'undefined' &&
      typeof (window as BrowserSavePickerWindow).showSaveFilePicker === 'function'
    ) {
      try {
        const handle = await (
          window as BrowserSavePickerWindow
        ).showSaveFilePicker!({
          suggestedName: filename,
          types: [
            {
              description: 'EasyDay JSON Backup',
              accept: { 'application/json': ['.json'] },
            },
          ],
        });
        const writable = await handle.createWritable();
        await writable.write(new Blob([jsonString], { type: 'application/json' }));
        await writable.close();

        const meta: BackupReminderMeta = {
          lastBackupAt: Date.now(),
          lastBackupMethod: 'browser-picker',
          filename: handle.name || filename,
        };
        backupMetaStorage.saveLastBackupMeta(meta);
        return {
          status: 'saved',
          filename: handle.name || filename,
          locationLabel: handle.name || filename,
          meta,
        };
      } catch (err) {
        if (err instanceof DOMException && err.name === 'AbortError') {
          return { status: 'cancelled' };
        }
        // Fallback to standard blob download if File System Access fails
      }
    }

    // 3. Browser Blob Download fallback
    if (typeof document === 'undefined' || typeof URL === 'undefined') {
      throw new Error('Browser environment required to save backup file.');
    }
    const blob = new Blob([jsonString], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.rel = 'noopener';
    a.style.display = 'none';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.setTimeout(() => URL.revokeObjectURL(url), 30_000);

    const meta: BackupReminderMeta = {
      lastBackupAt: Date.now(),
      lastBackupMethod: 'browser-download',
      filename,
    };
    backupMetaStorage.saveLastBackupMeta(meta);
    return {
      status: 'saved',
      filename,
      locationLabel: filename,
      meta,
    };
  } catch (err) {
    return {
      status: 'error',
      errorMessage:
        err instanceof Error && err.message
          ? err.message
          : lang === 'ur'
            ? 'بیک اپ محفوظ کرنے میں خرابی پیش آئی۔'
            : 'Failed to export backup file.',
    };
  }
}

export async function shareBackupFile(
  lang: Language
): Promise<BackupExportOutcome> {
  try {
    const payload = await buildCompleteBackupPayload(lang);
    const filename = formatBackupTimestampFilename();
    const jsonString = JSON.stringify(payload, null, 2);
    const title = lang === 'ur' ? 'EasyDay مکمل بیک اپ' : 'EasyDay Full Backup';

    // 1. Native Android Share Sheet (WhatsApp, Google Drive, Email, etc.)
    if (isNativeAndroid()) {
      const res = await shareAndroidBackupFile(filename, jsonString, title);
      if (!res.shared) {
        return { status: 'cancelled' };
      }
      const meta: BackupReminderMeta = {
        lastBackupAt: Date.now(),
        lastBackupMethod: 'android-share',
        filename: res.displayName || filename,
      };
      backupMetaStorage.saveLastBackupMeta(meta);
      return {
        status: 'shared',
        filename: res.displayName || filename,
        meta,
      };
    }

    // 2. Web Share API with JSON File
    if (
      typeof navigator !== 'undefined' &&
      typeof navigator.share === 'function' &&
      typeof File !== 'undefined'
    ) {
      const file = new File([jsonString], filename, { type: 'application/json' });
      const canShare =
        typeof navigator.canShare === 'function'
          ? navigator.canShare({ files: [file] })
          : false;
      if (canShare) {
        try {
          await navigator.share({
            files: [file],
            title,
          });
          const meta: BackupReminderMeta = {
            lastBackupAt: Date.now(),
            lastBackupMethod: 'web-share',
            filename,
          };
          backupMetaStorage.saveLastBackupMeta(meta);
          return {
            status: 'shared',
            filename,
            meta,
          };
        } catch (err) {
          if (err instanceof DOMException && err.name === 'AbortError') {
            return { status: 'cancelled' };
          }
          throw err;
        }
      }
    }

    // 3. Browser fallback when Web Share file API is unsupported: save file instead
    return await saveBackupToDevice(lang);
  } catch (err) {
    return {
      status: 'error',
      errorMessage:
        err instanceof Error && err.message
          ? err.message
          : lang === 'ur'
            ? 'بیک اپ شیئر کرنے میں خرابی پیش آئی۔'
            : 'Unable to share backup file.',
    };
  }
}

export async function pickBackupJsonViaAndroid(): Promise<{
  cancelled: boolean;
  filename?: string;
  content?: string;
  errorMessage?: string;
}> {
  if (!isNativeAndroid()) {
    return { cancelled: true };
  }
  try {
    const res = await openAndroidBackupWithPicker();
    if (res.cancelled || typeof res.content !== 'string') {
      return { cancelled: true };
    }
    return {
      cancelled: false,
      filename: res.displayName || 'backup.json',
      content: res.content,
    };
  } catch (err) {
    return {
      cancelled: false,
      errorMessage:
        err instanceof Error && err.message
          ? err.message
          : 'Failed reading selected backup file.',
    };
  }
}

/**
 * Strictly parses and validates an EasyDay backup JSON string BEFORE any restore occurs.
 * Rejects empty files, invalid JSON, empty objects, unknown formats, unsupported versions,
 * missing sections, malformed records, or broken record relationships.
 */
export function parseAndValidateBackupJson(
  rawText: string,
  lang: Language = 'en'
): BackupValidationResult {
  if (typeof rawText !== 'string' || rawText.trim().length === 0) {
    return {
      ok: false,
      errorCode: 'EMPTY_FILE',
      message: getBackupValidationMessage('EMPTY_FILE', lang),
    };
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(rawText);
  } catch {
    return {
      ok: false,
      errorCode: 'INVALID_JSON',
      message: getBackupValidationMessage('INVALID_JSON', lang),
    };
  }

  if (!isPlainObject(parsed) || Object.keys(parsed).length === 0) {
    return {
      ok: false,
      errorCode: 'INVALID_FORMAT',
      message: getBackupValidationMessage('INVALID_FORMAT', lang),
    };
  }

  if (parsed.format !== BACKUP_FORMAT_ID) {
    return {
      ok: false,
      errorCode: 'INVALID_FORMAT',
      message: getBackupValidationMessage('INVALID_FORMAT', lang),
    };
  }

  if (parsed.version !== BACKUP_FORMAT_VERSION) {
    return {
      ok: false,
      errorCode: 'UNSUPPORTED_VERSION',
      message: getBackupValidationMessage('UNSUPPORTED_VERSION', lang),
    };
  }

  const data = parsed.data;
  if (!isPlainObject(data)) {
    return {
      ok: false,
      errorCode: 'INCOMPLETE_STRUCTURE',
      message: getBackupValidationMessage('INCOMPLETE_STRUCTURE', lang),
    };
  }

  const udhaar = data.udhaar;
  const bills = data.bills;
  const expenses = data.expenses;
  const notes = data.notes;
  const settings = data.settings;
  const photos = data.photos;

  if (
    !isPlainObject(udhaar) ||
    !Array.isArray(udhaar.contacts) ||
    !Array.isArray(udhaar.transactions) ||
    !isPlainObject(bills) ||
    !Array.isArray(bills.items) ||
    !Array.isArray(bills.payments) ||
    !Array.isArray(expenses) ||
    !Array.isArray(notes) ||
    !isPlainObject(settings) ||
    (settings.language !== 'en' && settings.language !== 'ur') ||
    (settings.theme !== 'light' && settings.theme !== 'dark') ||
    !Array.isArray(photos)
  ) {
    return {
      ok: false,
      errorCode: 'INCOMPLETE_STRUCTURE',
      message: getBackupValidationMessage('INCOMPLETE_STRUCTURE', lang),
    };
  }

  // Deep record & relationship validation
  const contactIds = new Set<string>();
  for (const c of udhaar.contacts) {
    if (!isPlainObject(c) || typeof c.id !== 'string' || !c.id || typeof c.name !== 'string') {
      return {
        ok: false,
        errorCode: 'CORRUPTED_RECORDS',
        message: getBackupValidationMessage('CORRUPTED_RECORDS', lang),
      };
    }
    contactIds.add(c.id);
  }

  for (const tx of udhaar.transactions) {
    if (
      !isPlainObject(tx) ||
      typeof tx.id !== 'string' ||
      !tx.id ||
      typeof tx.contactId !== 'string' ||
      !contactIds.has(tx.contactId) ||
      (tx.direction !== 'given' && tx.direction !== 'borrowed') ||
      typeof tx.amount !== 'number' ||
      !Number.isFinite(tx.amount) ||
      tx.amount <= 0 ||
      typeof tx.date !== 'string' ||
      !Array.isArray(tx.payments)
    ) {
      return {
        ok: false,
        errorCode: 'CORRUPTED_RECORDS',
        message: getBackupValidationMessage('CORRUPTED_RECORDS', lang),
      };
    }
    for (const pay of tx.payments) {
      if (
        !isPlainObject(pay) ||
        typeof pay.id !== 'string' ||
        typeof pay.amount !== 'number' ||
        !Number.isFinite(pay.amount) ||
        pay.amount <= 0 ||
        typeof pay.date !== 'string'
      ) {
        return {
          ok: false,
          errorCode: 'CORRUPTED_RECORDS',
          message: getBackupValidationMessage('CORRUPTED_RECORDS', lang),
        };
      }
    }
  }

  for (const bill of bills.items) {
    if (
      !isPlainObject(bill) ||
      typeof bill.id !== 'string' ||
      !bill.id ||
      typeof bill.name !== 'string' ||
      typeof bill.amount !== 'number' ||
      !Number.isFinite(bill.amount) ||
      bill.amount <= 0 ||
      typeof bill.dueDate !== 'string' ||
      (bill.status !== 'pending' && bill.status !== 'paid')
    ) {
      return {
        ok: false,
        errorCode: 'CORRUPTED_RECORDS',
        message: getBackupValidationMessage('CORRUPTED_RECORDS', lang),
      };
    }
  }

  for (const bp of bills.payments) {
    if (
      !isPlainObject(bp) ||
      typeof bp.id !== 'string' ||
      typeof bp.billId !== 'string' ||
      typeof bp.amount !== 'number' ||
      !Number.isFinite(bp.amount) ||
      typeof bp.paidDate !== 'string'
    ) {
      return {
        ok: false,
        errorCode: 'CORRUPTED_RECORDS',
        message: getBackupValidationMessage('CORRUPTED_RECORDS', lang),
      };
    }
  }

  for (const exp of expenses) {
    if (
      !isPlainObject(exp) ||
      typeof exp.id !== 'string' ||
      !exp.id ||
      (exp.type !== 'income' && exp.type !== 'expense') ||
      typeof exp.amount !== 'number' ||
      !Number.isFinite(exp.amount) ||
      exp.amount <= 0 ||
      typeof exp.date !== 'string'
    ) {
      return {
        ok: false,
        errorCode: 'CORRUPTED_RECORDS',
        message: getBackupValidationMessage('CORRUPTED_RECORDS', lang),
      };
    }
  }

  for (const note of notes) {
    if (
      !isPlainObject(note) ||
      typeof note.id !== 'string' ||
      !note.id ||
      typeof note.title !== 'string' ||
      typeof note.description !== 'string'
    ) {
      return {
        ok: false,
        errorCode: 'CORRUPTED_RECORDS',
        message: getBackupValidationMessage('CORRUPTED_RECORDS', lang),
      };
    }
  }

  const validatedPhotos: BillPhotoRecord[] = [];
  for (const ph of photos) {
    if (
      !isPlainObject(ph) ||
      typeof ph.id !== 'string' ||
      !ph.id ||
      typeof ph.dataUrl !== 'string' ||
      !ph.dataUrl.startsWith('data:')
    ) {
      return {
        ok: false,
        errorCode: 'CORRUPTED_RECORDS',
        message: getBackupValidationMessage('CORRUPTED_RECORDS', lang),
      };
    }
    validatedPhotos.push({
      id: ph.id,
      dataUrl: ph.dataUrl,
      mimeType:
        typeof ph.mimeType === 'string'
          ? ph.mimeType
          : extractMimeTypeFromDataUrl(ph.dataUrl),
      sizeBytes:
        typeof ph.sizeBytes === 'number' && Number.isFinite(ph.sizeBytes)
          ? ph.sizeBytes
          : estimateDataUrlByteSize(ph.dataUrl),
      contentHash:
        typeof ph.contentHash === 'string' && ph.contentHash
          ? ph.contentHash
          : computePhotoContentHash(ph.dataUrl),
      createdAt: typeof ph.createdAt === 'number' ? ph.createdAt : Date.now(),
      updatedAt: typeof ph.updatedAt === 'number' ? ph.updatedAt : Date.now(),
    });
  }

  // Validate optional Kameti section (backward compatible with Phase 1–5 backups)
  const rawKameti = data.kameti;
  let validatedKameti: KametiDataset = {
    committees: [],
    members: [],
    installments: [],
    payments: [],
    draws: [],
  };

  if (rawKameti !== undefined) {
    if (
      !isPlainObject(rawKameti) ||
      !Array.isArray(rawKameti.committees) ||
      !Array.isArray(rawKameti.members) ||
      !Array.isArray(rawKameti.installments) ||
      !Array.isArray(rawKameti.payments) ||
      !Array.isArray(rawKameti.draws)
    ) {
      return {
        ok: false,
        errorCode: 'CORRUPTED_RECORDS',
        message: getBackupValidationMessage('CORRUPTED_RECORDS', lang),
      };
    }

    const committeeIds = new Set<string>();
    for (const c of rawKameti.committees) {
      if (
        !isPlainObject(c) ||
        typeof c.id !== 'string' ||
        !c.id ||
        typeof c.name !== 'string' ||
        typeof c.monthlyInstallment !== 'number' ||
        !Number.isFinite(c.monthlyInstallment) ||
        c.monthlyInstallment <= 0 ||
        typeof c.memberCount !== 'number' ||
        !Number.isFinite(c.memberCount) ||
        c.memberCount <= 0 ||
        typeof c.durationMonths !== 'number' ||
        !Number.isFinite(c.durationMonths) ||
        c.durationMonths <= 0 ||
        (c.status !== 'active' && c.status !== 'completed')
      ) {
        return {
          ok: false,
          errorCode: 'CORRUPTED_RECORDS',
          message: getBackupValidationMessage('CORRUPTED_RECORDS', lang),
        };
      }
      committeeIds.add(c.id);
    }

    const memberIds = new Set<string>();
    for (const m of rawKameti.members) {
      if (
        !isPlainObject(m) ||
        typeof m.id !== 'string' ||
        !m.id ||
        typeof m.committeeId !== 'string' ||
        !committeeIds.has(m.committeeId) ||
        typeof m.name !== 'string' ||
        typeof m.memberNumber !== 'number' ||
        !Number.isFinite(m.memberNumber)
      ) {
        return {
          ok: false,
          errorCode: 'CORRUPTED_RECORDS',
          message: getBackupValidationMessage('CORRUPTED_RECORDS', lang),
        };
      }
      memberIds.add(m.id);
    }

    const installmentIds = new Set<string>();
    for (const ins of rawKameti.installments) {
      if (
        !isPlainObject(ins) ||
        typeof ins.id !== 'string' ||
        !ins.id ||
        typeof ins.committeeId !== 'string' ||
        !committeeIds.has(ins.committeeId) ||
        typeof ins.memberId !== 'string' ||
        !memberIds.has(ins.memberId) ||
        typeof ins.expectedAmount !== 'number' ||
        !Number.isFinite(ins.expectedAmount) ||
        ins.expectedAmount <= 0 ||
        typeof ins.dueDate !== 'string'
      ) {
        return {
          ok: false,
          errorCode: 'CORRUPTED_RECORDS',
          message: getBackupValidationMessage('CORRUPTED_RECORDS', lang),
        };
      }
      installmentIds.add(ins.id);
    }

    for (const p of rawKameti.payments) {
      if (
        !isPlainObject(p) ||
        typeof p.id !== 'string' ||
        !p.id ||
        typeof p.committeeId !== 'string' ||
        !committeeIds.has(p.committeeId) ||
        typeof p.memberId !== 'string' ||
        !memberIds.has(p.memberId) ||
        typeof p.installmentId !== 'string' ||
        !installmentIds.has(p.installmentId) ||
        typeof p.amount !== 'number' ||
        !Number.isFinite(p.amount) ||
        p.amount <= 0 ||
        typeof p.paymentDate !== 'string'
      ) {
        return {
          ok: false,
          errorCode: 'CORRUPTED_RECORDS',
          message: getBackupValidationMessage('CORRUPTED_RECORDS', lang),
        };
      }
    }

    for (const d of rawKameti.draws) {
      if (
        !isPlainObject(d) ||
        typeof d.id !== 'string' ||
        !d.id ||
        typeof d.committeeId !== 'string' ||
        !committeeIds.has(d.committeeId) ||
        typeof d.memberId !== 'string' ||
        !memberIds.has(d.memberId) ||
        typeof d.turnNumber !== 'number' ||
        !Number.isFinite(d.turnNumber) ||
        typeof d.payoutAmount !== 'number' ||
        !Number.isFinite(d.payoutAmount) ||
        d.payoutAmount <= 0
      ) {
        return {
          ok: false,
          errorCode: 'CORRUPTED_RECORDS',
          message: getBackupValidationMessage('CORRUPTED_RECORDS', lang),
        };
      }
    }

    validatedKameti = {
      committees: rawKameti.committees as unknown as KametiCommittee[],
      members: rawKameti.members as unknown as KametiMember[],
      installments: rawKameti.installments as unknown as KametiInstallment[],
      payments: rawKameti.payments as unknown as KametiPaymentRecord[],
      draws: rawKameti.draws as unknown as KametiDrawRecord[],
    };
  }

  // Normalize settings.recentToolIds safely
  const validToolIds = new Set(TOOLS.map((t) => t.id));
  const rawRecents = Array.isArray(settings.recentToolIds)
    ? settings.recentToolIds.filter((id): id is ToolId => validToolIds.has(id as ToolId))
    : [];
  const normalizedRecents: ToolId[] =
    rawRecents.length > 0
      ? rawRecents.slice(0, 4)
      : ['udhaar-manager', 'bills-reminder', 'expense-tracker', 'notes'];

  const sanitizedOtherData: Record<string, string> = {};
  if (isPlainObject(data.otherLocalData)) {
    for (const [k, v] of Object.entries(data.otherLocalData)) {
      if (typeof v === 'string' && !CORE_SCHEMA_KEYS.has(k)) {
        sanitizedOtherData[k] = v;
      }
    }
  }

  const createdAt =
    typeof parsed.createdAt === 'string' && parsed.createdAt
      ? parsed.createdAt
      : new Date().toISOString();
  const appVersion =
    typeof parsed.appVersion === 'string' && parsed.appVersion
      ? parsed.appVersion
      : EASYDAY_APP_VERSION;

  const preview: BackupPreviewSummary = {
    udhaarContactsCount: udhaar.contacts.length,
    udhaarTransactionsCount: udhaar.transactions.length,
    billsCount: bills.items.length,
    billPaymentsCount: bills.payments.length,
    expensesCount: expenses.length,
    kametiCount: validatedKameti.committees.length,
    notesCount: notes.length,
    photosCount: validatedPhotos.length,
    createdAt,
    appVersion,
    formatVersion: BACKUP_FORMAT_VERSION,
  };

  const normalizedBackup: EasyDayBackupPayload = {
    format: BACKUP_FORMAT_ID,
    version: BACKUP_FORMAT_VERSION,
    appVersion,
    createdAt,
    createdAtMs:
      typeof parsed.createdAtMs === 'number' && Number.isFinite(parsed.createdAtMs)
        ? parsed.createdAtMs
        : Date.now(),
    summary: preview,
    data: {
      udhaar: {
        contacts: udhaar.contacts as unknown as UdhaarContact[],
        transactions: udhaar.transactions as unknown as UdhaarTransaction[],
      },
      bills: {
        items: bills.items as unknown as BillItem[],
        payments: bills.payments as unknown as BillPaymentRecord[],
        overdueNotifiedKeys: Array.isArray(bills.overdueNotifiedKeys)
          ? bills.overdueNotifiedKeys.filter((k): k is string => typeof k === 'string')
          : [],
      },
      expenses: expenses as unknown as TransactionItem[],
      notes: notes as unknown as NoteItem[],
      kameti: validatedKameti,
      settings: {
        language: settings.language,
        theme: settings.theme,
        recentToolIds: normalizedRecents,
      },
      otherLocalData: sanitizedOtherData,
      photos: validatedPhotos,
    },
  };

  return {
    ok: true,
    backup: normalizedBackup,
    preview,
  };
}

function captureLocalStorageSnapshot(): Array<[string, string]> {
  const entries: Array<[string, string]> = [];
  if (typeof localStorage === 'undefined') return entries;
  for (let i = 0; i < localStorage.length; i++) {
    const k = localStorage.key(i);
    if (!k) continue;
    const v = localStorage.getItem(k);
    if (v !== null) entries.push([k, v]);
  }
  return entries;
}

function restoreLocalStorageSnapshot(entries: Array<[string, string]>): void {
  if (typeof localStorage === 'undefined') return;
  localStorage.clear();
  for (const [k, v] of entries) {
    localStorage.setItem(k, v);
  }
}

/**
 * Performs a transactional, rollback-safe restore:
 * 1. Captures full snapshot of existing LocalStorage & IndexedDB photos before touching any data.
 * 2. Restores IndexedDB photos inside a transaction and verifies all photos persisted.
 * 3. Writes all LocalStorage collections & verifies read-back integrity.
 * 4. If ANY error occurs at any step, automatically restores the complete previous snapshot.
 */
export async function restoreEasyDayBackupTransactional(
  backup: EasyDayBackupPayload,
  lang: Language = 'en',
  testHooks?: { simulateMidRestoreFailure?: boolean }
): Promise<BackupRestoreOutcome> {
  // Final validation gate before touching existing data
  const recheck = parseAndValidateBackupJson(JSON.stringify(backup), lang);
  if (!recheck.ok || !recheck.backup) {
    return {
      ok: false,
      rolledBack: false,
      errorMessage:
        recheck.message || getBackupValidationMessage('CORRUPTED_RECORDS', lang),
    };
  }

  const valid = recheck.backup;

  // Snapshot existing data (both LocalStorage and IndexedDB)
  const lsSnapshot = captureLocalStorageSnapshot();
  const previousLastBackupMeta = backupMetaStorage.loadLastBackupMeta();
  let idbSnapshot: BillPhotoRecord[] = [];
  const hasIdb = isIndexedDBAvailable();

  if (hasIdb) {
    try {
      idbSnapshot = await getAllBillPhotos();
    } catch {
      return {
        ok: false,
        rolledBack: false,
        errorMessage:
          lang === 'ur'
            ? 'بحالی سے قبل موجودہ تصاویر کا محفوظ اسنیپ شاٹ نہیں بن سکا، اس لیے موجودہ ڈیٹا تبدیل نہیں کیا گیا۔'
            : 'Could not snapshot existing bill photos before restore. Your existing data was untouched.',
      };
    }
  }

  // Step 1: Transactional IndexedDB photo restore
  if (valid.data.photos.length > 0 && !hasIdb) {
    return {
      ok: false,
      rolledBack: false,
      errorMessage: getStorageErrorMessage('IDB_UNAVAILABLE', lang),
    };
  }

  if (hasIdb) {
    const idbRes = await replaceAllBillPhotosTransactional(valid.data.photos);
    if (!idbRes.ok) {
      // Restore previous IDB photos if partial failure occurred
      await replaceAllBillPhotosTransactional(idbSnapshot);
      const code: StorageErrorCode = idbRes.errorCode || 'IDB_WRITE_FAILED';
      return {
        ok: false,
        rolledBack: true,
        errorMessage: getStorageErrorMessage(code, lang),
      };
    }
  }

  // Step 2: Atomic-style LocalStorage write + verification + rollback on any failure
  try {
    if (typeof localStorage === 'undefined') {
      throw new Error('LocalStorage unavailable');
    }

    // Clear stale non-schema keys cleanly first (backup metadata re-applied below)
    const keysToRemove: string[] = [];
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i);
      if (
        k &&
        k !== STORAGE_KEYS.lastBackupMeta &&
        k !== STORAGE_KEYS.securityConfig
      ) {
        keysToRemove.push(k);
      }
    }
    for (const k of keysToRemove) {
      localStorage.removeItem(k);
    }

    const writeOrThrow = (res: { ok: boolean; errorCode?: StorageErrorCode }) => {
      if (!res.ok) {
        const err = new Error(res.errorCode || 'Write failed') as Error & {
          storageCode?: StorageErrorCode;
        };
        err.storageCode = res.errorCode;
        throw err;
      }
    };

    writeOrThrow(udhaarStorage.saveContacts(valid.data.udhaar.contacts));
    writeOrThrow(udhaarStorage.saveTransactions(valid.data.udhaar.transactions));

    // Optional test injection hook to verify real rollback behavior cleanly in automated tests
    if (testHooks?.simulateMidRestoreFailure) {
      const quotaErr = new Error('Simulated QuotaExceededError during restore');
      quotaErr.name = 'QuotaExceededError';
      throw quotaErr;
    }

    writeOrThrow(billsStorage.saveBills(valid.data.bills.items));
    writeOrThrow(billsStorage.savePayments(valid.data.bills.payments));
    writeOrThrow(
      billsStorage.saveOverdueNotifiedKeys(valid.data.bills.overdueNotifiedKeys)
    );
    writeOrThrow(transactionsStorage.save(valid.data.expenses));
    writeOrThrow(notesStorage.save(valid.data.notes));
    writeOrThrow(kametiStorage.saveAll(valid.data.kameti));
    writeOrThrow(safeWriteString(STORAGE_KEYS.language, valid.data.settings.language));
    writeOrThrow(safeWriteString(STORAGE_KEYS.theme, valid.data.settings.theme));
    writeOrThrow(
      safeWriteString(
        STORAGE_KEYS.recentTools,
        JSON.stringify(valid.data.settings.recentToolIds)
      )
    );

    for (const [k, v] of Object.entries(valid.data.otherLocalData)) {
      writeOrThrow(safeWriteString(k, v));
    }

    if (previousLastBackupMeta) {
      backupMetaStorage.saveLastBackupMeta(previousLastBackupMeta);
    }

    // Read-back verification of key financial collections
    if (
      udhaarStorage.loadContacts().length !== valid.data.udhaar.contacts.length ||
      udhaarStorage.loadTransactions().length !==
        valid.data.udhaar.transactions.length ||
      billsStorage.loadBills().length !== valid.data.bills.items.length ||
      transactionsStorage.load().length !== valid.data.expenses.length ||
      notesStorage.load().length !== valid.data.notes.length ||
      kametiStorage.loadCommittees().length !== valid.data.kameti.committees.length ||
      kametiStorage.loadMembers().length !== valid.data.kameti.members.length ||
      kametiStorage.loadInstallments().length !== valid.data.kameti.installments.length ||
      kametiStorage.loadPayments().length !== valid.data.kameti.payments.length ||
      kametiStorage.loadDraws().length !== valid.data.kameti.draws.length
    ) {
      throw new Error('Post-restore read-back count mismatch');
    }

    return {
      ok: true,
      rolledBack: false,
      restoredLanguage: valid.data.settings.language,
      restoredTheme: valid.data.settings.theme,
      restoredRecentToolIds: valid.data.settings.recentToolIds,
      preview: valid.summary,
    };
  } catch (err) {
    // Full Rollback of LocalStorage + IndexedDB to exact pre-restore snapshot
    try {
      restoreLocalStorageSnapshot(lsSnapshot);
    } catch {
      // Ignore secondary snapshot recovery failure
    }
    if (hasIdb) {
      await replaceAllBillPhotosTransactional(idbSnapshot);
    }

    const storageCode =
      typeof err === 'object' &&
      err !== null &&
      'storageCode' in err &&
      (err as { storageCode?: StorageErrorCode }).storageCode
        ? (err as { storageCode: StorageErrorCode }).storageCode
        : classifyStorageError(err);

    const friendlyReason =
      storageCode !== 'UNKNOWN_STORAGE_ERROR'
        ? getStorageErrorMessage(storageCode, lang)
        : lang === 'ur'
          ? 'بیک اپ بحالی مکمل نہیں ہو سکی۔ آپ کا پچھلا محفوظ ڈیٹا مکمل طور پر واپس بحال کر دیا گیا ہے۔'
          : 'Restore could not be completed, so your previous data was safely rolled back without any partial changes.';

    return {
      ok: false,
      rolledBack: true,
      errorMessage: friendlyReason,
    };
  }
}
