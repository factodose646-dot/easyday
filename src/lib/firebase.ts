import { FirebaseApp, getApp, getApps, initializeApp } from 'firebase/app';
import { Auth, getAuth, onAuthStateChanged, User } from 'firebase/auth';
import {
  collection,
  Firestore,
  getDocsFromServer,
  getFirestore,
  initializeFirestore,
  limit,
  query,
  setLogLevel,
  where,
} from 'firebase/firestore';

const firebaseConfig = {
  apiKey: 'AIzaSyAqgt7JcBh_v5BKhJyF1IBHauIPlY9U0h0',
  authDomain: 'easyday-13712.firebaseapp.com',
  projectId: 'easyday-13712',
  storageBucket: 'easyday-13712.firebasestorage.app',
  messagingSenderId: '546533602751',
  appId: '1:546533602751:web:41c9f2f90947713480dd0a',
};

// Initialize Firebase only once across the application lifecycle
export const app: FirebaseApp =
  getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);

// EasyDay is offline-first; suppress internal SDK 10s watch-stream offline console errors
// while preserving structured error handling in all app services.
setLogLevel('silent');

function createFirestoreInstance(firebaseApp: FirebaseApp): Firestore {
  const isBrowser = typeof window !== 'undefined';
  try {
    return initializeFirestore(firebaseApp, {
      ...(isBrowser ? { experimentalForceLongPolling: true } : {}),
      ignoreUndefinedProperties: true,
    });
  } catch {
    return getFirestore(firebaseApp);
  }
}

export const db: Firestore = createFirestoreInstance(app);
export const auth: Auth = getAuth(app);

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  code?: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo: {
      providerId?: string | null;
      email?: string | null;
    }[];
  };
}

export function buildFirestoreErrorInfo(
  error: unknown,
  operationType: OperationType,
  path: string | null
): FirestoreErrorInfo {
  const code =
    typeof error === 'object' && error !== null && 'code' in error
      ? String((error as { code: unknown }).code)
      : undefined;

  return {
    error: error instanceof Error ? error.message : String(error),
    code,
    operationType,
    path,
    authInfo: {
      userId: auth.currentUser?.uid ?? null,
      email: auth.currentUser?.email ?? null,
      emailVerified: auth.currentUser?.emailVerified ?? null,
      isAnonymous: auth.currentUser?.isAnonymous ?? null,
      tenantId: auth.currentUser?.tenantId ?? null,
      providerInfo:
        auth.currentUser?.providerData?.map((provider) => ({
          providerId: provider.providerId,
          email: provider.email,
        })) ?? [],
    },
  };
}

export function isOfflineError(error: unknown): boolean {
  if (typeof navigator !== 'undefined' && navigator.onLine === false) {
    return true;
  }
  const msg =
    error instanceof Error
      ? error.message.toLowerCase()
      : String(error).toLowerCase();
  const code =
    typeof error === 'object' && error !== null && 'code' in error
      ? String((error as { code: unknown }).code).toLowerCase()
      : '';

  return (
    code === 'unavailable' ||
    code === 'deadline-exceeded' ||
    msg.includes('client is offline') ||
    msg.includes('network') ||
    msg.includes('timeout') ||
    msg.includes('timed out') ||
    msg.includes('could not reach cloud firestore backend') ||
    msg.includes('failed to get document because the client is offline')
  );
}

/**
 * Validates live Firestore server connectivity against an active + published
 * public query on globalAds without weakening existing Firestore Security Rules.
 */
export async function testFirestoreConnection(): Promise<{
  connected: boolean;
  offline: boolean;
  error?: FirestoreErrorInfo;
}> {
  try {
    await getDocsFromServer(
      query(
        collection(db, 'globalAds'),
        where('active', '==', true),
        where('published', '==', true),
        limit(1)
      )
    );
    return { connected: true, offline: false };
  } catch (error) {
    const offline = isOfflineError(error);
    const info = buildFirestoreErrorInfo(
      error,
      OperationType.LIST,
      'globalAds'
    );
    if (offline) {
      console.warn('Firestore offline/unreachable:', info.error);
    } else {
      console.warn('Firestore connection check warning:', info.error);
    }
    return { connected: false, offline, error: info };
  }
}

export function subscribeToAuthState(
  callback: (user: User | null) => void
): () => void {
  return onAuthStateChanged(auth, callback);
}
