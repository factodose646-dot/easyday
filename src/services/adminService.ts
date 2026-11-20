import {
  signInWithEmailAndPassword,
  signOut,
  User,
} from 'firebase/auth';
import {
  doc,
  getDoc,
  getDocFromServer,
  Timestamp,
} from 'firebase/firestore';
import { auth, db, isOfflineError } from '../lib/firebase';
import {
  fetchAllGlobalAdsAdmin,
  GlobalAdRecord,
  saveGlobalAnnouncement,
} from './globalAdService';

export interface AdminAnnouncement {
  title: string;
  message: string;
  active: boolean;
  updatedAtMs: number;
}

export interface AdminConsoleSnapshot {
  ads: GlobalAdRecord[];
  announcement: AdminAnnouncement | null;
}

export interface AdminAuthCheckResult {
  authorized: boolean;
  reason?:
    | 'not-signed-in'
    | 'not-allowlisted'
    | 'permission-denied'
    | 'offline'
    | 'error';
  message?: string;
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

function asString(value: unknown): string {
  return typeof value === 'string' ? value.trim() : '';
}

/**
 * Sign in via Firebase Email/Password authentication.
 * Maps Firebase Auth error codes into safe user-facing messages.
 */
export async function signInAdmin(email: string, password: string): Promise<User> {
  const trimmedEmail = email.trim();
  if (!trimmedEmail || !password) {
    throw new Error('Email and password are required.');
  }

  try {
    const credential = await signInWithEmailAndPassword(
      auth,
      trimmedEmail,
      password
    );
    return credential.user;
  } catch (error) {
    const code =
      typeof error === 'object' && error !== null && 'code' in error
        ? String((error as { code: unknown }).code)
        : '';

    switch (code) {
      case 'auth/invalid-credential':
      case 'auth/user-not-found':
      case 'auth/wrong-password':
        throw new Error('Invalid email or password.');
      case 'auth/invalid-email':
        throw new Error('Please enter a valid email address.');
      case 'auth/user-disabled':
        throw new Error('This account has been disabled.');
      case 'auth/too-many-requests':
        throw new Error(
          'Too many failed sign-in attempts. Please wait and try again.'
        );
      case 'auth/network-request-failed':
        throw new Error('Network error. Check your connection and try again.');
      case 'auth/operation-not-allowed':
        throw new Error(
          'Email/Password sign-in is not enabled in Firebase Authentication for project easyday-13712.'
        );
      default:
        throw new Error(
          error instanceof Error ? error.message : 'Unable to sign in.'
        );
    }
  }
}

export async function signOutAdmin(): Promise<void> {
  await signOut(auth);
}

/**
 * Verifies whether the signed-in user's UID exists in the trusted
 * Firestore allowlist `admins/{uid}` with `active == true`.
 * Real authorization is enforced server-side by Firestore Security Rules.
 */
export async function verifyAdminAllowlist(
  user: User | null
): Promise<AdminAuthCheckResult> {
  if (!user) {
    return { authorized: false, reason: 'not-signed-in' };
  }

  try {
    const adminDocRef = doc(db, 'admins', user.uid);
    const snap = await getDocFromServer(adminDocRef);

    if (!snap.exists()) {
      return {
        authorized: false,
        reason: 'not-allowlisted',
        message: 'Account UID is not listed in admins allowlist.',
      };
    }

    const data = snap.data();
    if (data?.active !== true) {
      return {
        authorized: false,
        reason: 'not-allowlisted',
        message: 'Admin account is marked inactive.',
      };
    }

    return { authorized: true };
  } catch (error) {
    if (isOfflineError(error)) {
      return {
        authorized: false,
        reason: 'offline',
        message: 'Unable to verify administrator access while offline.',
      };
    }
    const code =
      typeof error === 'object' && error !== null && 'code' in error
        ? String((error as { code: unknown }).code)
        : '';
    if (code === 'permission-denied') {
      return {
        authorized: false,
        reason: 'permission-denied',
        message: 'Firestore Security Rules denied read access to admins/{uid}.',
      };
    }
    return {
      authorized: false,
      reason: 'error',
      message:
        error instanceof Error
          ? error.message
          : 'Failed to verify administrator status.',
    };
  }
}

export async function fetchAdminConsoleSnapshot(): Promise<AdminConsoleSnapshot> {
  const ads = await fetchAllGlobalAdsAdmin();

  let announcement: AdminAnnouncement | null = null;
  try {
    const annSnap = await getDoc(doc(db, 'settings', 'announcement'));
    if (annSnap.exists()) {
      const d = annSnap.data();
      announcement = {
        title: asString(d.title),
        message: asString(d.message),
        active: d.active === true,
        updatedAtMs: extractTimestampMs(d.updatedAt),
      };
    }
  } catch (error) {
    const code =
      typeof error === 'object' && error !== null && 'code' in error
        ? String((error as { code: unknown }).code)
        : '';
    if (code !== 'permission-denied') {
      throw new Error(
        error instanceof Error ? error.message : 'Failed to read announcement.'
      );
    }
  }

  return {
    ads,
    announcement,
  };
}

export async function saveAnnouncement(input: {
  title: string;
  message: string;
  active: boolean;
}): Promise<void> {
  await saveGlobalAnnouncement(input);
}
