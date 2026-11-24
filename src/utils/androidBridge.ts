import { App as CapApp } from '@capacitor/app';
import { Capacitor, registerPlugin } from '@capacitor/core';
import { StatusBar, Style } from '@capacitor/status-bar';
import { Theme } from '../types';

export interface AndroidPdfSaveResult {
  saved: boolean;
  cancelled: boolean;
  uri?: string;
  displayName?: string;
  displayPath?: string;
}

export interface AndroidPdfShareResult {
  shared: boolean;
  displayName?: string;
}

export interface AndroidPdfOpenResult {
  opened: boolean;
  reason?: string;
}

export interface AndroidNotificationPermissionResult {
  granted: boolean;
  notificationsEnabled: boolean;
  exactAlarmAllowed: boolean;
  status: 'granted' | 'denied' | 'prompt';
}

export interface ScheduledBillReminderPayload {
  id: string;
  requestCode: number;
  title: string;
  body: string;
  triggerAtMillis: number;
}

interface PdfExportPluginInterface {
  savePdfWithPicker(options: {
    filename: string;
    base64Data: string;
  }): Promise<AndroidPdfSaveResult>;
  sharePdf(options: {
    filename: string;
    base64Data: string;
    title: string;
    caption?: string;
  }): Promise<AndroidPdfShareResult>;
  openPdfUri(options: { uri: string }): Promise<AndroidPdfOpenResult>;
  shareText(options: {
    title: string;
    text: string;
  }): Promise<{ shared: boolean }>;
  openExternalUrl(options: { url: string }): Promise<{ opened: boolean }>;
}

interface BillReminderPluginInterface {
  checkNotificationPermission(): Promise<AndroidNotificationPermissionResult>;
  requestNotificationPermission(): Promise<AndroidNotificationPermissionResult>;
  syncReminders(options: {
    reminders: ScheduledBillReminderPayload[];
  }): Promise<{ scheduledCount: number }>;
  showImmediateNotification(options: {
    requestCode: number;
    title: string;
    body: string;
  }): Promise<{ shown: boolean }>;
  cancelReminder(options: { requestCode: number }): Promise<{ cancelled: boolean }>;
}

export interface AndroidJsonSaveResult {
  saved: boolean;
  cancelled: boolean;
  uri?: string;
  displayName?: string;
  displayPath?: string;
}

export interface AndroidJsonOpenResult {
  cancelled: boolean;
  displayName?: string;
  sizeBytes?: number;
  content?: string;
}

interface DataBackupPluginInterface {
  saveJsonWithPicker(options: {
    filename: string;
    content: string;
  }): Promise<AndroidJsonSaveResult>;
  shareJsonFile(options: {
    filename: string;
    content: string;
    title: string;
  }): Promise<{ shared: boolean; displayName?: string }>;
  openJsonWithPicker(): Promise<AndroidJsonOpenResult>;
}

export type AndroidBiometricAvailabilityStatus =
  | 'available'
  | 'none_enrolled'
  | 'no_hardware'
  | 'hw_unavailable'
  | 'security_update_required'
  | 'web_unsupported'
  | 'unknown';

export interface AndroidBiometricAvailabilityResult {
  available: boolean;
  status: AndroidBiometricAvailabilityStatus;
}

export type AndroidBiometricAuthStatus =
  | 'success'
  | 'cancelled'
  | 'fallback'
  | 'lockout'
  | 'unavailable'
  | 'failed';

export interface AndroidBiometricAuthResult {
  status: AndroidBiometricAuthStatus;
  errorCode?: number;
  message?: string;
  permanent?: boolean;
  availabilityStatus?: AndroidBiometricAvailabilityStatus;
}

interface AppSecurityPluginInterface {
  checkBiometricAvailability(): Promise<AndroidBiometricAvailabilityResult>;
  authenticateBiometric(options: {
    title: string;
    subtitle?: string;
    negativeButtonText: string;
  }): Promise<AndroidBiometricAuthResult>;
}

const PdfExport = registerPlugin<PdfExportPluginInterface>('PdfExport');
const BillReminder = registerPlugin<BillReminderPluginInterface>('BillReminder');
const DataBackup = registerPlugin<DataBackupPluginInterface>('DataBackup');
const AppSecurity = registerPlugin<AppSecurityPluginInterface>('AppSecurity');

let activeNativeDialogCount = 0;
let nativeDialogGraceUntilMs = 0;

/**
 * Prevents background auto-lock from falsely triggering while Android system dialogs
 * (BiometricPrompt, SAF pickers, Share sheets, permission prompts) temporarily pause the WebView.
 */
export function beginNativeDialogGrace(maxDurationMs = 120_000): () => void {
  activeNativeDialogCount += 1;
  nativeDialogGraceUntilMs = Math.max(
    nativeDialogGraceUntilMs,
    Date.now() + maxDurationMs
  );
  let ended = false;
  return () => {
    if (ended) return;
    ended = true;
    activeNativeDialogCount = Math.max(0, activeNativeDialogCount - 1);
    if (activeNativeDialogCount === 0) {
      nativeDialogGraceUntilMs = Date.now() + 800;
    }
  };
}

export function isNativeDialogGraceActive(nowMs = Date.now()): boolean {
  return activeNativeDialogCount > 0 || nowMs < nativeDialogGraceUntilMs;
}

export async function runWithNativeDialogGrace<T>(
  task: () => Promise<T>,
  maxDurationMs = 120_000
): Promise<T> {
  const endGrace = beginNativeDialogGrace(maxDurationMs);
  try {
    return await task();
  } finally {
    endGrace();
  }
}

export function isNativeAndroid(): boolean {
  try {
    return Capacitor.isNativePlatform() && Capacitor.getPlatform() === 'android';
  } catch {
    return false;
  }
}

export async function blobToBase64(blob: Blob): Promise<string> {
  const buffer = await blob.arrayBuffer();
  const bytes = new Uint8Array(buffer);
  const chunkSize = 0x8000;
  let binary = '';
  for (let i = 0; i < bytes.length; i += chunkSize) {
    const chunk = bytes.subarray(i, i + chunkSize);
    binary += String.fromCharCode(...chunk);
  }
  return btoa(binary);
}

export async function saveAndroidPdfWithPicker(
  blob: Blob,
  filename: string
): Promise<AndroidPdfSaveResult> {
  const base64Data = await blobToBase64(blob);
  return runWithNativeDialogGrace(() =>
    PdfExport.savePdfWithPicker({ filename, base64Data })
  );
}

export async function shareAndroidPdf(
  blob: Blob,
  filename: string,
  title: string,
  caption?: string
): Promise<AndroidPdfShareResult> {
  const base64Data = await blobToBase64(blob);
  return runWithNativeDialogGrace(() =>
    PdfExport.sharePdf({ filename, base64Data, title, caption })
  );
}

export async function openAndroidPdfUri(
  uri: string
): Promise<AndroidPdfOpenResult> {
  return PdfExport.openPdfUri({ uri });
}

export async function openAndroidExternalUrl(url: string): Promise<boolean> {
  if (!isNativeAndroid()) return false;
  return runWithNativeDialogGrace(async () => {
    try {
      const res = await PdfExport.openExternalUrl({ url });
      return Boolean(res?.opened);
    } catch {
      return false;
    }
  });
}

export async function shareAndroidText(
  text: string,
  title = 'EasyDay'
): Promise<boolean> {
  if (isNativeAndroid()) {
    try {
      const res = await PdfExport.shareText({ title, text });
      return Boolean(res?.shared);
    } catch {
      return false;
    }
  }
  if (typeof navigator !== 'undefined' && typeof navigator.share === 'function') {
    try {
      await navigator.share({ title, text });
      return true;
    } catch {
      return false;
    }
  }
  return false;
}

export async function saveAndroidBackupWithPicker(
  filename: string,
  content: string
): Promise<AndroidJsonSaveResult> {
  return runWithNativeDialogGrace(() =>
    DataBackup.saveJsonWithPicker({ filename, content })
  );
}

export async function shareAndroidBackupFile(
  filename: string,
  content: string,
  title: string
): Promise<{ shared: boolean; displayName?: string }> {
  return runWithNativeDialogGrace(() =>
    DataBackup.shareJsonFile({ filename, content, title })
  );
}

export async function openAndroidBackupWithPicker(): Promise<AndroidJsonOpenResult> {
  return runWithNativeDialogGrace(() => DataBackup.openJsonWithPicker());
}

export async function checkAndroidBiometricAvailability(): Promise<AndroidBiometricAvailabilityResult> {
  if (!isNativeAndroid()) {
    return { available: false, status: 'web_unsupported' };
  }
  try {
    const res = await AppSecurity.checkBiometricAvailability();
    return {
      available: Boolean(res?.available),
      status: res?.status || 'unknown',
    };
  } catch {
    return { available: false, status: 'unknown' };
  }
}

export async function authenticateAndroidBiometric(options: {
  title: string;
  subtitle?: string;
  negativeButtonText: string;
}): Promise<AndroidBiometricAuthResult> {
  if (!isNativeAndroid()) {
    return { status: 'unavailable' };
  }
  return runWithNativeDialogGrace(async () => {
    try {
      const res = await AppSecurity.authenticateBiometric(options);
      return {
        status: res?.status || 'failed',
        errorCode: res?.errorCode,
        message: res?.message,
        permanent: Boolean(res?.permanent),
        availabilityStatus: res?.availabilityStatus,
      };
    } catch (err) {
      return {
        status: 'failed',
        message: err instanceof Error ? err.message : 'Biometric authentication failed.',
      };
    }
  });
}

export async function checkAndroidNotificationPermission(): Promise<AndroidNotificationPermissionResult> {
  if (!isNativeAndroid()) {
    if (typeof window !== 'undefined' && 'Notification' in window) {
      const perm = window.Notification.permission;
      return {
        granted: perm === 'granted',
        notificationsEnabled: perm === 'granted',
        exactAlarmAllowed: true,
        status: perm === 'granted' ? 'granted' : perm === 'denied' ? 'denied' : 'prompt',
      };
    }
    return {
      granted: false,
      notificationsEnabled: false,
      exactAlarmAllowed: false,
      status: 'denied',
    };
  }
  return BillReminder.checkNotificationPermission();
}

export async function requestAndroidNotificationPermission(): Promise<AndroidNotificationPermissionResult> {
  if (!isNativeAndroid()) {
    if (typeof window !== 'undefined' && 'Notification' in window) {
      try {
        const perm = await window.Notification.requestPermission();
        return {
          granted: perm === 'granted',
          notificationsEnabled: perm === 'granted',
          exactAlarmAllowed: true,
          status: perm === 'granted' ? 'granted' : perm === 'denied' ? 'denied' : 'prompt',
        };
      } catch {
        return {
          granted: false,
          notificationsEnabled: false,
          exactAlarmAllowed: false,
          status: 'denied',
        };
      }
    }
    return {
      granted: false,
      notificationsEnabled: false,
      exactAlarmAllowed: false,
      status: 'denied',
    };
  }
  return runWithNativeDialogGrace(() => BillReminder.requestNotificationPermission());
}

export async function syncAndroidBillReminders(
  reminders: ScheduledBillReminderPayload[]
): Promise<number> {
  if (!isNativeAndroid()) return 0;
  try {
    const res = await BillReminder.syncReminders({ reminders });
    return res?.scheduledCount ?? 0;
  } catch {
    return 0;
  }
}

export async function showAndroidBillNotification(
  requestCode: number,
  title: string,
  body: string
): Promise<boolean> {
  if (isNativeAndroid()) {
    try {
      const res = await BillReminder.showImmediateNotification({
        requestCode,
        title,
        body,
      });
      return Boolean(res?.shown);
    } catch {
      return false;
    }
  }
  if (
    typeof window !== 'undefined' &&
    'Notification' in window &&
    window.Notification.permission === 'granted'
  ) {
    try {
      new window.Notification(title, { body });
      return true;
    } catch {
      return false;
    }
  }
  return false;
}

export async function cancelAndroidBillReminder(
  requestCode: number
): Promise<void> {
  if (!isNativeAndroid()) return;
  try {
    await BillReminder.cancelReminder({ requestCode });
  } catch {
    // Ignore
  }
}

export async function syncAndroidStatusBar(
  theme: Theme,
  showSplash: boolean
): Promise<void> {
  if (!isNativeAndroid()) return;
  try {
    const backgroundColor = showSplash
      ? '#040D21'
      : theme === 'dark'
        ? '#040D21'
        : '#F2F6FC';
    const style = showSplash || theme === 'dark' ? Style.Dark : Style.Light;

    await StatusBar.setOverlaysWebView({ overlay: false });
    await StatusBar.setBackgroundColor({ color: backgroundColor });
    await StatusBar.setStyle({ style });
  } catch {
    // Ignore bridge failures outside native WebView
  }
}

export function registerAndroidBackButton(
  onBack: () => void
): () => void {
  if (!isNativeAndroid()) {
    return () => {};
  }

  let removed = false;
  let handlePromise: ReturnType<typeof CapApp.addListener> | undefined;

  try {
    handlePromise = CapApp.addListener('backButton', () => {
      onBack();
    });
  } catch {
    return () => {};
  }

  return () => {
    if (removed) return;
    removed = true;
    if (handlePromise) {
      void handlePromise.then((handle) => handle.remove()).catch(() => {});
    }
  };
}

export function registerAndroidAppStateChange(
  onStateChange: (isActive: boolean) => void
): () => void {
  if (!isNativeAndroid()) {
    return () => {};
  }

  let removed = false;
  let handlePromise: ReturnType<typeof CapApp.addListener> | undefined;

  try {
    handlePromise = CapApp.addListener('appStateChange', ({ isActive }) => {
      onStateChange(isActive);
    });
  } catch {
    return () => {};
  }

  return () => {
    if (removed) return;
    removed = true;
    if (handlePromise) {
      void handlePromise.then((handle) => handle.remove()).catch(() => {});
    }
  };
}

export async function minimizeAndroidApp(): Promise<void> {
  if (!isNativeAndroid()) return;
  try {
    await CapApp.minimizeApp();
  } catch {
    // Ignore if unavailable
  }
}
