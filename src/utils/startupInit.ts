import { TOOLS } from '../data/tools';
import { Language, Theme, ToolId } from '../types';
import zaidiEmblemUrl from '../assets/zaidi-emblem.png';

export interface StartupPreferences {
  language: Language;
  theme: Theme;
  recentToolIds: ToolId[];
}

export interface StartupResult {
  preferences: StartupPreferences;
}

const STORAGE_LANG_KEY = 'easyday-language';
const STORAGE_THEME_KEY = 'easyday-theme';
const STORAGE_RECENTS_KEY = 'easyday-recent-tools';

const DEFAULT_RECENTS: ToolId[] = [
  'udhaar-manager',
  'bills-reminder',
  'expense-tracker',
  'notes',
];

function preloadImage(src: string, timeoutMs = 4000): Promise<void> {
  return new Promise((resolve) => {
    const img = new Image();
    const timer = window.setTimeout(() => resolve(), timeoutMs);
    img.onload = () => {
      window.clearTimeout(timer);
      resolve();
    };
    img.onerror = () => {
      window.clearTimeout(timer);
      // Do not fail entire workspace startup if an icon takes too long or fails
      resolve();
    };
    img.src = src;
  });
}

function waitForFonts(timeoutMs = 3500): Promise<void> {
  if (typeof document === 'undefined' || !('fonts' in document)) {
    return Promise.resolve();
  }
  return Promise.race([
    document.fonts.ready.then(() => undefined).catch(() => undefined),
    new Promise<void>((resolve) => window.setTimeout(resolve, timeoutMs)),
  ]);
}

export function readStoredPreferences(): StartupPreferences {
  let language: Language = 'en';
  let theme: Theme = 'dark';
  let recentToolIds: ToolId[] = DEFAULT_RECENTS;

  try {
    const savedLang = localStorage.getItem(STORAGE_LANG_KEY);
    if (savedLang === 'en' || savedLang === 'ur') {
      language = savedLang;
    }

    const savedTheme = localStorage.getItem(STORAGE_THEME_KEY);
    if (savedTheme === 'light' || savedTheme === 'dark') {
      theme = savedTheme;
    }

    const savedRecents = localStorage.getItem(STORAGE_RECENTS_KEY);
    if (savedRecents) {
      const parsed = JSON.parse(savedRecents);
      const validIds = new Set(TOOLS.map((t) => t.id));
      if (Array.isArray(parsed)) {
        const cleaned = parsed.filter((id): id is ToolId => validIds.has(id));
        if (cleaned.length > 0) {
          recentToolIds = cleaned.slice(0, 4);
        }
      }
    }
  } catch {
    // Fallback cleanly to defaults if storage is unavailable
  }

  return { language, theme, recentToolIds };
}

/**
 * Performs essential application initialization:
 * 1. Reads and validates local user preferences (language, theme, recent tools).
 * 2. Applies document root lang/dir/theme classes before dashboard mount.
 * 3. Preloads the original ZAIDI INTERACTIVE emblem asset.
 * 4. Awaits web font readiness with timeout protection.
 */
export async function initializeEasyDayWorkspace(
  onProgress?: (percent: number) => void
): Promise<StartupResult> {
  onProgress?.(15);

  const preferences = readStoredPreferences();
  onProgress?.(40);

  if (typeof document !== 'undefined') {
    const root = document.documentElement;
    root.lang = preferences.language;
    root.dir = preferences.language === 'ur' ? 'rtl' : 'ltr';
    root.classList.toggle('dark', preferences.theme === 'dark');
  }
  onProgress?.(60);

  await Promise.all([
    preloadImage(zaidiEmblemUrl),
    waitForFonts(),
  ]);
  onProgress?.(100);

  return { preferences };
}
