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
  }): Promise<AndroidPdfShareResult>;
  openPdfUri(options: { uri: string }): Promise<AndroidPdfOpenResult>;
  shareText(options: {
    title: string;
    text: string;
  }): Promise<{ shared: boolean }>;
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

const PdfExport = registerPlugin<PdfExportPluginInterface>('PdfExport');
const BillReminder = registerPlugin<BillReminderPluginInterface>('BillReminder');

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
  return PdfExport.savePdfWithPicker({ filename, base64Data });
}

export async function shareAndroidPdf(
  blob: Blob,
  filename: string,
  title: string
): Promise<AndroidPdfShareResult> {
  const base64Data = await blobToBase64(blob);
  return PdfExport.sharePdf({ filename, base64Data, title });
}

export async function openAndroidPdfUri(
  uri: string
): Promise<AndroidPdfOpenResult> {
  return PdfExport.openPdfUri({ uri });
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
  return BillReminder.requestNotificationPermission();
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
