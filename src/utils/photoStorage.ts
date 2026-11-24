import { Language } from '../types';
import {
  BillItem,
  billsStorage,
  classifyStorageError,
  generateId,
  getStorageErrorMessage,
  StorageErrorCode,
} from './storage';

export const EASYDAY_MEDIA_DB_NAME = 'easyday-media-db';
export const EASYDAY_MEDIA_DB_VERSION = 1;
export const BILL_PHOTOS_STORE = 'billPhotos';

export interface BillPhotoRecord {
  id: string;
  dataUrl: string;
  mimeType: string;
  sizeBytes: number;
  contentHash: string;
  createdAt: number;
  updatedAt: number;
}

export interface PhotoSaveResult {
  ok: boolean;
  photoId?: string;
  deduplicated?: boolean;
  errorCode?: StorageErrorCode;
  message?: string;
}

export interface PhotoReadResult {
  ok: boolean;
  photo: BillPhotoRecord | null;
  errorCode?: StorageErrorCode;
  message?: string;
}

export interface PhotoMigrationReport {
  attempted: number;
  migratedCount: number;
  deduplicatedCount: number;
  failedCount: number;
  remainingLegacyCount: number;
  errorCode?: StorageErrorCode;
}

export interface PhotoUsageSummary {
  available: boolean;
  count: number;
  totalBytes: number;
  errorCode?: StorageErrorCode;
}

// In-memory LRU-like cache for instant re-rendering once fetched from IndexedDB
const memoryPhotoCache = new Map<string, BillPhotoRecord>();

export function isIndexedDBAvailable(): boolean {
  try {
    return typeof indexedDB !== 'undefined' && indexedDB !== null;
  } catch {
    return false;
  }
}

export function extractMimeTypeFromDataUrl(dataUrl: string): string {
  const match = /^data:([^;,]+)[;,]/.exec(dataUrl);
  return match?.[1] || 'image/jpeg';
}

export function estimateDataUrlByteSize(dataUrl: string): number {
  const commaIdx = dataUrl.indexOf(',');
  if (commaIdx === -1) return dataUrl.length;
  const payload = dataUrl.slice(commaIdx + 1);
  if (dataUrl.slice(0, commaIdx).includes(';base64')) {
    return Math.floor((payload.length * 3) / 4);
  }
  return payload.length;
}

/**
 * Computes a deterministic multi-lane FNV-1a digest + length tag
 * to deduplicate identical photos cleanly during saves and migration.
 */
export function computePhotoContentHash(dataUrl: string): string {
  let h1 = 0x811c9dc5;
  let h2 = 0x9e3779b9;
  for (let i = 0; i < dataUrl.length; i++) {
    const code = dataUrl.charCodeAt(i);
    h1 ^= code;
    h1 = Math.imul(h1, 0x01000193);
    h2 ^= code + (i & 0xff);
    h2 = Math.imul(h2, 0x85ebca6b);
  }
  const p1 = (h1 >>> 0).toString(16).padStart(8, '0');
  const p2 = (h2 >>> 0).toString(16).padStart(8, '0');
  return `${dataUrl.length.toString(16)}-${p1}-${p2}`;
}

function openMediaDatabase(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (!isIndexedDBAvailable()) {
      reject(new Error('IndexedDB is unavailable'));
      return;
    }

    try {
      const request = indexedDB.open(
        EASYDAY_MEDIA_DB_NAME,
        EASYDAY_MEDIA_DB_VERSION
      );

      request.onupgradeneeded = () => {
        const db = request.result;
        if (!db.objectStoreNames.contains(BILL_PHOTOS_STORE)) {
          const store = db.createObjectStore(BILL_PHOTOS_STORE, {
            keyPath: 'id',
          });
          store.createIndex('contentHash', 'contentHash', { unique: false });
        }
      };

      request.onsuccess = () => {
        resolve(request.result);
      };

      request.onerror = () => {
        reject(request.error || new Error('Failed opening IndexedDB'));
      };

      request.onblocked = () => {
        reject(new Error('IndexedDB upgrade blocked by another connection'));
      };
    } catch (err) {
      reject(err);
    }
  });
}

async function withStore<T>(
  mode: IDBTransactionMode,
  action: (store: IDBObjectStore, tx: IDBTransaction) => Promise<T>
): Promise<T> {
  const db = await openMediaDatabase();
  try {
    const tx = db.transaction(BILL_PHOTOS_STORE, mode);
    const store = tx.objectStore(BILL_PHOTOS_STORE);
    const result = await action(store, tx);
    return result;
  } finally {
    db.close();
  }
}

function idbRequestToPromise<T>(req: IDBRequest<T>): Promise<T> {
  return new Promise((resolve, reject) => {
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error || new Error('IndexedDB request failed'));
  });
}

function waitForTransactionCommit(tx: IDBTransaction): Promise<void> {
  return new Promise((resolve, reject) => {
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error || new Error('IndexedDB transaction failed'));
    tx.onabort = () => reject(tx.error || new Error('IndexedDB transaction aborted'));
  });
}

export async function getBillPhotoRaw(photoId: string): Promise<BillPhotoRecord | null> {
  const cached = memoryPhotoCache.get(photoId);
  if (cached) return cached;

  const rec = await withStore('readonly', async (store) => {
    const res = (await idbRequestToPromise(
      store.get(photoId)
    )) as BillPhotoRecord | undefined;
    return res ?? null;
  });

  if (rec) {
    memoryPhotoCache.set(photoId, rec);
  }
  return rec;
}

export async function getBillPhoto(
  photoId: string,
  lang: Language = 'en'
): Promise<PhotoReadResult> {
  if (!photoId) {
    return { ok: true, photo: null };
  }
  if (!isIndexedDBAvailable()) {
    return {
      ok: false,
      photo: null,
      errorCode: 'IDB_UNAVAILABLE',
      message: getStorageErrorMessage('IDB_UNAVAILABLE', lang),
    };
  }

  try {
    const rec = await getBillPhotoRaw(photoId);
    return { ok: true, photo: rec };
  } catch (err) {
    const classified = classifyStorageError(err);
    const code: StorageErrorCode =
      classified === 'STORAGE_UNAVAILABLE' ? 'IDB_UNAVAILABLE' : 'IDB_READ_FAILED';
    return {
      ok: false,
      photo: null,
      errorCode: code,
      message: getStorageErrorMessage(code, lang),
    };
  }
}

export async function getAllBillPhotos(): Promise<BillPhotoRecord[]> {
  if (!isIndexedDBAvailable()) {
    throw new Error('IndexedDB is unavailable');
  }
  const records = await withStore('readonly', async (store) => {
    const all = (await idbRequestToPromise(
      store.getAll()
    )) as BillPhotoRecord[];
    return Array.isArray(all) ? all : [];
  });

  for (const r of records) {
    if (r && r.id) memoryPhotoCache.set(r.id, r);
  }
  return records;
}

export async function getBillPhotosUsageSummary(): Promise<PhotoUsageSummary> {
  if (!isIndexedDBAvailable()) {
    return {
      available: false,
      count: 0,
      totalBytes: 0,
      errorCode: 'IDB_UNAVAILABLE',
    };
  }
  try {
    const all = await getAllBillPhotos();
    const totalBytes = all.reduce(
      (sum, rec) => sum + (Number.isFinite(rec.sizeBytes) ? rec.sizeBytes : 0),
      0
    );
    return {
      available: true,
      count: all.length,
      totalBytes,
    };
  } catch {
    return {
      available: false,
      count: 0,
      totalBytes: 0,
      errorCode: 'IDB_READ_FAILED',
    };
  }
}

/**
 * Saves a compressed bill photo into IndexedDB with deduplication and read-back verification.
 * Guarantees the photo is genuinely persisted before returning `ok: true`.
 */
export async function saveBillPhoto(
  dataUrl: string,
  options?: { preferredId?: string; lang?: Language }
): Promise<PhotoSaveResult> {
  const lang = options?.lang ?? 'en';
  if (!dataUrl || !dataUrl.startsWith('data:')) {
    return {
      ok: false,
      errorCode: 'IDB_WRITE_FAILED',
      message: getStorageErrorMessage('IDB_WRITE_FAILED', lang),
    };
  }

  if (!isIndexedDBAvailable()) {
    return {
      ok: false,
      errorCode: 'IDB_UNAVAILABLE',
      message: getStorageErrorMessage('IDB_UNAVAILABLE', lang),
    };
  }

  const contentHash = computePhotoContentHash(dataUrl);
  const now = Date.now();

  try {
    // 1. Check if preferredId already exists with identical data OR if contentHash matches
    const existingAll = await getAllBillPhotos();
    if (options?.preferredId) {
      const byId = existingAll.find((p) => p.id === options.preferredId);
      if (byId && byId.dataUrl === dataUrl) {
        return { ok: true, photoId: byId.id, deduplicated: true };
      }
    }

    const byContent = existingAll.find(
      (p) => p.contentHash === contentHash && p.dataUrl === dataUrl
    );
    if (byContent) {
      return { ok: true, photoId: byContent.id, deduplicated: true };
    }

    const photoId = options?.preferredId || generateId('bphoto');
    const record: BillPhotoRecord = {
      id: photoId,
      dataUrl,
      mimeType: extractMimeTypeFromDataUrl(dataUrl),
      sizeBytes: estimateDataUrlByteSize(dataUrl),
      contentHash,
      createdAt: now,
      updatedAt: now,
    };

    // 2. Write & await transaction commit
    await withStore('readwrite', async (store, tx) => {
      const commitPromise = waitForTransactionCommit(tx);
      store.put(record);
      await commitPromise;
    });

    // 3. Explicit verification read directly from IndexedDB (bypass memory cache)
    memoryPhotoCache.delete(photoId);
    const verified = await withStore('readonly', async (store) => {
      return (await idbRequestToPromise(
        store.get(photoId)
      )) as BillPhotoRecord | undefined;
    });

    if (!verified || verified.dataUrl !== dataUrl) {
      return {
        ok: false,
        errorCode: 'PHOTO_VERIFY_FAILED',
        message: getStorageErrorMessage('PHOTO_VERIFY_FAILED', lang),
      };
    }

    memoryPhotoCache.set(photoId, verified);
    return { ok: true, photoId, deduplicated: false };
  } catch (err) {
    const classified = classifyStorageError(err);
    const errorCode: StorageErrorCode =
      classified === 'QUOTA_EXCEEDED' ? 'QUOTA_EXCEEDED' : 'IDB_WRITE_FAILED';
    return {
      ok: false,
      errorCode,
      message: getStorageErrorMessage(errorCode, lang),
    };
  }
}

export async function deleteBillPhotoById(photoId: string): Promise<boolean> {
  if (!photoId || !isIndexedDBAvailable()) return false;
  try {
    await withStore('readwrite', async (store, tx) => {
      const commitPromise = waitForTransactionCommit(tx);
      store.delete(photoId);
      await commitPromise;
    });
    memoryPhotoCache.delete(photoId);
    return true;
  } catch {
    return false;
  }
}

/**
 * Safely deletes a photo only when no remaining bill references its photoId
 * (protects shared photos across recurring bill cycles).
 */
export async function deleteBillPhotoIfUnused(
  photoId: string | undefined,
  remainingBills: BillItem[]
): Promise<void> {
  if (!photoId) return;
  const stillReferenced = remainingBills.some((b) => b.photoId === photoId);
  if (stillReferenced) return;
  await deleteBillPhotoById(photoId);
}

/**
 * Safely replaces all IndexedDB bill photos inside one readwrite transaction
 * and verifies every record was written. Used by Safe Transactional Restore & Rollback.
 */
export async function replaceAllBillPhotosTransactional(
  records: BillPhotoRecord[]
): Promise<{ ok: boolean; errorCode?: StorageErrorCode }> {
  if (!isIndexedDBAvailable()) {
    // Allow restore only if backup has 0 photos when IDB is unavailable
    if (records.length === 0) return { ok: true };
    return { ok: false, errorCode: 'IDB_UNAVAILABLE' };
  }

  try {
    await withStore('readwrite', async (store, tx) => {
      const commitPromise = waitForTransactionCommit(tx);
      store.clear();
      for (const rec of records) {
        store.put(rec);
      }
      await commitPromise;
    });

    memoryPhotoCache.clear();
    const verified = await getAllBillPhotos();
    const verifiedIds = new Set(verified.map((r) => r.id));
    for (const rec of records) {
      if (!verifiedIds.has(rec.id)) {
        return { ok: false, errorCode: 'PHOTO_VERIFY_FAILED' };
      }
    }
    return { ok: true };
  } catch (err) {
    const classified = classifyStorageError(err);
    return {
      ok: false,
      errorCode:
        classified === 'QUOTA_EXCEEDED' ? 'QUOTA_EXCEEDED' : 'IDB_WRITE_FAILED',
    };
  }
}

/**
 * Resumable, duplicate-free migration of legacy Base64 `bill.photoDataUrl` entries
 * from LocalStorage into IndexedDB:
 * - Never deletes an old Base64 photo until the new IndexedDB copy is verified.
 * - Deduplicates identical photos across recurring cycles or interrupted runs.
 * - Commits progress per verified bill so interrupted runs resume cleanly.
 */
let activeMigrationPromise: Promise<PhotoMigrationReport> | null = null;

export function migrateLegacyBillPhotosToIndexedDB(): Promise<PhotoMigrationReport> {
  if (activeMigrationPromise) {
    return activeMigrationPromise;
  }

  activeMigrationPromise = runMigrationInternal().finally(() => {
    activeMigrationPromise = null;
  });
  return activeMigrationPromise;
}

async function runMigrationInternal(): Promise<PhotoMigrationReport> {
  const currentBills = billsStorage.loadBills();
  const legacyIndices: number[] = [];

  for (let i = 0; i < currentBills.length; i++) {
    const b = currentBills[i];
    if (typeof b.photoDataUrl === 'string' && b.photoDataUrl.startsWith('data:')) {
      legacyIndices.push(i);
    }
  }

  if (legacyIndices.length === 0) {
    return {
      attempted: 0,
      migratedCount: 0,
      deduplicatedCount: 0,
      failedCount: 0,
      remainingLegacyCount: 0,
    };
  }

  if (!isIndexedDBAvailable()) {
    return {
      attempted: legacyIndices.length,
      migratedCount: 0,
      deduplicatedCount: 0,
      failedCount: legacyIndices.length,
      remainingLegacyCount: legacyIndices.length,
      errorCode: 'IDB_UNAVAILABLE',
    };
  }

  let migratedCount = 0;
  let deduplicatedCount = 0;
  let failedCount = 0;
  let firstErrorCode: StorageErrorCode | undefined;

  // Work on a mutable copy of loaded bills and persist immediately after each verified photo
  const workingBills = [...currentBills];

  for (const idx of legacyIndices) {
    const bill = workingBills[idx];
    const dataUrl = bill.photoDataUrl;
    if (!dataUrl || !dataUrl.startsWith('data:')) continue;

    const saveRes = await saveBillPhoto(dataUrl, {
      preferredId: bill.photoId,
    });

    if (!saveRes.ok || !saveRes.photoId) {
      failedCount += 1;
      if (!firstErrorCode) firstErrorCode = saveRes.errorCode || 'IDB_WRITE_FAILED';
      continue;
    }

    // Double-check the IndexedDB record is genuinely readable before removing legacy Base64
    const verifyRead = await getBillPhoto(saveRes.photoId);
    if (!verifyRead.ok || !verifyRead.photo || verifyRead.photo.dataUrl !== dataUrl) {
      failedCount += 1;
      if (!firstErrorCode) firstErrorCode = 'PHOTO_VERIFY_FAILED';
      continue;
    }

    const updatedBill: BillItem = {
      ...bill,
      photoId: saveRes.photoId,
    };
    delete updatedBill.photoDataUrl;

    workingBills[idx] = updatedBill;

    const writeResult = billsStorage.saveBills(workingBills);
    if (!writeResult.ok) {
      // Restore unmigrated state for this item in memory if localStorage write failed
      workingBills[idx] = bill;
      failedCount += 1;
      if (!firstErrorCode) firstErrorCode = writeResult.errorCode;
      continue;
    }

    migratedCount += 1;
    if (saveRes.deduplicated) {
      deduplicatedCount += 1;
    }
  }

  const remainingLegacyCount = workingBills.filter(
    (b) => typeof b.photoDataUrl === 'string' && b.photoDataUrl.startsWith('data:')
  ).length;

  return {
    attempted: legacyIndices.length,
    migratedCount,
    deduplicatedCount,
    failedCount,
    remainingLegacyCount,
    errorCode: firstErrorCode,
  };
}
