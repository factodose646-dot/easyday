import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  query,
  serverTimestamp,
  setDoc,
  Timestamp,
  updateDoc,
  where,
} from 'firebase/firestore';
import {
  buildFirestoreErrorInfo,
  db,
  isOfflineError,
  OperationType,
} from '../lib/firebase';
import { sanitizeHttpUrl, sanitizeHttpsUrl } from '../utils/urlSanitizer';

export type AdMediaType = 'image' | 'video';

export interface GlobalAdRecord {
  id: string;
  title: string;
  description: string;
  mediaType: AdMediaType;
  mediaUrl: string;
  active: boolean;
  published: boolean;
  createdAtMs: number;
  updatedAtMs: number;
}

export interface GlobalAdInput {
  title: string;
  description: string;
  mediaType: AdMediaType;
  mediaUrl: string;
  active: boolean;
  published: boolean;
}

export interface AnnouncementRecord {
  title: string;
  message: string;
  ctaText?: string;
  actionUrl?: string;
}

function asTrimmedString(value: unknown): string {
  return typeof value === 'string' ? value.trim() : '';
}

const FIRESTORE_PUBLIC_READ_TIMEOUT_MS = 8000;

function withFirestoreTimeout<T>(
  promise: Promise<T>,
  timeoutMs = FIRESTORE_PUBLIC_READ_TIMEOUT_MS
): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const timer = globalThis.setTimeout(() => {
      reject(new Error('Firestore request timed out (client offline/unreachable).'));
    }, timeoutMs);
    promise.then(
      (value) => {
        globalThis.clearTimeout(timer);
        resolve(value);
      },
      (err) => {
        globalThis.clearTimeout(timer);
        reject(err);
      }
    );
  });
}

function extractTimestampMs(value: unknown): number {
  if (value instanceof Timestamp) {
    return value.toMillis();
  }
  if (
    typeof value === 'object' &&
    value !== null &&
    'toMillis' in value &&
    typeof (value as { toMillis: unknown }).toMillis === 'function'
  ) {
    return (value as { toMillis: () => number }).toMillis();
  }
  if (typeof value === 'number' && Number.isFinite(value)) {
    return value;
  }
  return 0;
}

export function mapRawGlobalAd(
  id: string,
  data: Record<string, unknown>
): GlobalAdRecord | null {
  const title = asTrimmedString(data.title);
  const description = asTrimmedString(data.description);
  const rawType = asTrimmedString(data.mediaType).toLowerCase();
  const mediaType: AdMediaType | null =
    rawType === 'image' || rawType === 'video' ? rawType : null;
  const mediaUrl = sanitizeHttpsUrl(data.mediaUrl);

  if (!title || !description || !mediaType || !mediaUrl) {
    return null;
  }

  return {
    id,
    title,
    description,
    mediaType,
    mediaUrl,
    active: data.active === true,
    published: data.published === true,
    createdAtMs: extractTimestampMs(data.createdAt),
    updatedAtMs: extractTimestampMs(data.updatedAt),
  };
}

/**
 * Fetches eligible public advertisements (active == true AND published == true) from `globalAds`.
 * Never throws uncaught runtime errors on offline/permission-denied; degrades gracefully.
 */
export async function fetchEligibleGlobalAds(): Promise<{
  ads: GlobalAdRecord[];
  offline: boolean;
  error?: string;
}> {
  if (typeof navigator !== 'undefined' && navigator.onLine === false) {
    return { ads: [], offline: true };
  }

  try {
    const q = query(
      collection(db, 'globalAds'),
      where('active', '==', true),
      where('published', '==', true)
    );
    const snapshot = await withFirestoreTimeout(getDocs(q));
    const ads: GlobalAdRecord[] = [];
    snapshot.forEach((docSnap) => {
      const mapped = mapRawGlobalAd(docSnap.id, docSnap.data());
      if (mapped && mapped.active && mapped.published) {
        ads.push(mapped);
      }
    });
    ads.sort(
      (a, b) =>
        (b.updatedAtMs || b.createdAtMs) - (a.updatedAtMs || a.createdAtMs)
    );
    return { ads, offline: false };
  } catch (error) {
    if (isOfflineError(error)) {
      return { ads: [], offline: true };
    }
    const info = buildFirestoreErrorInfo(
      error,
      OperationType.LIST,
      'globalAds'
    );
    if (info.code === 'permission-denied') {
      console.warn('Global ads read skipped due to Firestore rules:', info.path);
      return { ads: [], offline: false };
    }
    console.warn('Global ads read failed:', info.error);
    return {
      ads: [],
      offline: false,
      error: info.error,
    };
  }
}

/**
 * Fetches the active announcement from `settings/announcement` gracefully.
 */
export async function fetchActiveAnnouncement(): Promise<AnnouncementRecord | null> {
  if (typeof navigator !== 'undefined' && navigator.onLine === false) {
    return null;
  }
  try {
    const snap = await withFirestoreTimeout(
      getDoc(doc(db, 'settings', 'announcement'))
    );
    if (!snap.exists()) return null;
    const data = snap.data();
    if (data.active !== true) return null;

    const title = asTrimmedString(data.title || data.heading);
    const message = asTrimmedString(data.message || data.text || data.body);
    if (!title && !message) return null;

    return {
      title: title || 'Announcement',
      message,
      ctaText: asTrimmedString(data.ctaText || data.buttonText) || undefined,
      actionUrl: sanitizeHttpUrl(data.actionUrl ?? data.link ?? data.url),
    };
  } catch (error) {
    const info = buildFirestoreErrorInfo(
      error,
      OperationType.GET,
      'settings/announcement'
    );
    if (info.code === 'permission-denied' || isOfflineError(error)) {
      return null;
    }
    console.warn('Announcement fetch warning:', info.error);
    return null;
  }
}

// =========================================================================
// Admin Validation & CRUD for `globalAds`
// =========================================================================

export function validateGlobalAdInput(input: GlobalAdInput) {
  const title = asTrimmedString(input.title);
  if (title.length < 2) {
    throw new Error('Advertisement title must be at least 2 characters.');
  }
  if (title.length > 120) {
    throw new Error('Advertisement title must be 120 characters or fewer.');
  }

  const description = asTrimmedString(input.description);
  if (description.length < 2) {
    throw new Error('Advertisement description must be at least 2 characters.');
  }
  if (description.length > 1000) {
    throw new Error('Advertisement description must be 1000 characters or fewer.');
  }

  if (input.mediaType !== 'image' && input.mediaType !== 'video') {
    throw new Error('Media type must be Image or Video.');
  }

  const rawMedia = asTrimmedString(input.mediaUrl);
  if (!rawMedia) {
    throw new Error('Please provide an HTTPS image or video URL.');
  }
  if (rawMedia.length > 500) {
    throw new Error('Media URL must be 500 characters or fewer.');
  }
  const safeMediaUrl = sanitizeHttpsUrl(rawMedia);
  if (!safeMediaUrl) {
    throw new Error(
      'Media URL must start with https:// and be a valid URL.'
    );
  }

  return {
    title,
    description,
    mediaType: input.mediaType,
    mediaUrl: safeMediaUrl,
    active: Boolean(input.active),
    published: Boolean(input.published),
  };
}

function mapAdWriteError(error: unknown, fallback: string): Error {
  if (isOfflineError(error)) {
    return new Error('You are offline. Reconnect before making changes.');
  }
  const code =
    typeof error === 'object' && error !== null && 'code' in error
      ? String((error as { code: unknown }).code)
      : '';
  if (code === 'permission-denied') {
    return new Error(
      'Permission denied by Firestore Security Rules. Verify your UID in admins/{uid} and publish the globalAds security rules.'
    );
  }
  return new Error(error instanceof Error ? error.message : fallback);
}

export async function fetchAllGlobalAdsAdmin(): Promise<GlobalAdRecord[]> {
  try {
    const snap = await getDocs(collection(db, 'globalAds'));
    const ads: GlobalAdRecord[] = snap.docs.map((docSnap) => {
      const d = docSnap.data();
      const rawType = asTrimmedString(d.mediaType).toLowerCase();
      return {
        id: docSnap.id,
        title: asTrimmedString(d.title),
        description: asTrimmedString(d.description),
        mediaType: rawType === 'video' ? 'video' : 'image',
        mediaUrl: asTrimmedString(d.mediaUrl),
        active: d.active === true,
        published: d.published === true,
        createdAtMs: extractTimestampMs(d.createdAt),
        updatedAtMs: extractTimestampMs(d.updatedAt),
      };
    });

    return ads.sort(
      (a, b) =>
        (b.updatedAtMs || b.createdAtMs) - (a.updatedAtMs || a.createdAtMs)
    );
  } catch (error) {
    throw mapAdWriteError(error, 'Unable to load advertisements.');
  }
}

export async function createGlobalAd(input: GlobalAdInput): Promise<string> {
  const payload = validateGlobalAdInput(input);
  try {
    const ref = await addDoc(collection(db, 'globalAds'), {
      ...payload,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
    return ref.id;
  } catch (error) {
    throw mapAdWriteError(error, 'Failed to create advertisement.');
  }
}

export async function updateGlobalAd(
  id: string,
  input: GlobalAdInput
): Promise<void> {
  const payload = validateGlobalAdInput(input);
  try {
    await updateDoc(doc(db, 'globalAds', id), {
      ...payload,
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    throw mapAdWriteError(error, 'Failed to update advertisement.');
  }
}

export async function setGlobalAdFlags(
  id: string,
  flags: { active?: boolean; published?: boolean }
): Promise<void> {
  const patch: Record<string, unknown> = {
    updatedAt: serverTimestamp(),
  };
  if (typeof flags.active === 'boolean') {
    patch.active = flags.active;
  }
  if (typeof flags.published === 'boolean') {
    patch.published = flags.published;
  }
  try {
    await updateDoc(doc(db, 'globalAds', id), patch);
  } catch (error) {
    throw mapAdWriteError(error, 'Failed to update advertisement status.');
  }
}

export async function deleteGlobalAd(id: string): Promise<void> {
  try {
    await deleteDoc(doc(db, 'globalAds', id));
  } catch (error) {
    throw mapAdWriteError(error, 'Failed to delete advertisement.');
  }
}

export async function saveGlobalAnnouncement(input: {
  title: string;
  message: string;
  active: boolean;
}): Promise<void> {
  const title = asTrimmedString(input.title);
  const message = asTrimmedString(input.message);
  if (title.length < 2 || title.length > 120) {
    throw new Error('Title must be between 2 and 120 characters.');
  }
  if (message.length < 2 || message.length > 1000) {
    throw new Error('Message must be between 2 and 1000 characters.');
  }
  try {
    await setDoc(doc(db, 'settings', 'announcement'), {
      title,
      message,
      active: Boolean(input.active),
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    throw mapAdWriteError(error, 'Failed to save announcement.');
  }
}
