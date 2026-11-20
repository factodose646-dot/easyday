import { App as CapApp } from '@capacitor/app';
import { Capacitor } from '@capacitor/core';
import { StatusBar, Style } from '@capacitor/status-bar';
import { Theme } from '../types';

export function isNativeAndroid(): boolean {
  try {
    return Capacitor.isNativePlatform() && Capacitor.getPlatform() === 'android';
  } catch {
    return false;
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
        ? '#0B1120'
        : '#F6F9FC';
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
