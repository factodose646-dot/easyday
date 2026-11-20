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
}

const PdfExport = registerPlugin<PdfExportPluginInterface>('PdfExport');

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
