/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useCallback, useEffect, useRef, useState } from 'react';
import { AdminPortal } from './components/admin/AdminPortal';
import { AppLockScreen } from './components/AppLockScreen';
import { BottomNav } from './components/BottomNav';
import { DesktopNavRail } from './components/DesktopNavRail';
import { GlobalAdOverlay } from './components/GlobalAdOverlay';
import { QuickAddFab } from './components/QuickAddFab';
import { SplashPreviewModal } from './components/SplashPreviewModal';
import { SplashScreen } from './components/SplashScreen';
import { useGlobalAdSystem } from './hooks/useGlobalAdSystem';
import { TRANSLATIONS } from './i18n/translations';
import { HomeScreen } from './screens/HomeScreen';
import { SettingsScreen } from './screens/SettingsScreen';
import {
  QuickAddKind,
  QuickAddRequest,
  ToolDetailScreen,
} from './screens/ToolDetailScreen';
import { ToolsScreen } from './screens/ToolsScreen';
import { Language, NavTab, Theme, ToolId } from './types';
import {
  initializeEasyDayWorkspace,
  readStoredPreferences,
} from './utils/startupInit';
import {
  isNativeDialogGraceActive,
  minimizeAndroidApp,
  registerAndroidAppStateChange,
  registerAndroidBackButton,
  syncAndroidStatusBar,
} from './utils/androidBridge';
import {
  AppSecurityConfig,
  loadSecurityConfig,
  shouldAutoLockOnResume,
} from './utils/appSecurity';
import { syncAllBillRemindersAndOverdueAlerts } from './utils/billNotifications';
import { BackupRestoreOutcome } from './utils/backupSystem';
import { billsStorage } from './utils/storage';

const STORAGE_LANG_KEY = 'easyday-language';
const STORAGE_THEME_KEY = 'easyday-theme';
const STORAGE_RECENTS_KEY = 'easyday-recent-tools';
const MINIMUM_SPLASH_MS = 8000;

export default function App() {
  const initialPrefs = readStoredPreferences();

  const [showSplash, setShowSplash] = useState<boolean>(true);
  const [splashProgress, setSplashProgress] = useState<number>(0);
  const [initError, setInitError] = useState<string | null>(null);
  const [initAttempt, setInitAttempt] = useState<number>(0);

  const [language, setLanguage] = useState<Language>(initialPrefs.language);
  const [theme, setTheme] = useState<Theme>(initialPrefs.theme);
  const [activeTab, setActiveTab] = useState<NavTab>('home');
  const [selectedToolId, setSelectedToolId] = useState<ToolId | null>(null);
  const [recentToolIds, setRecentToolIds] = useState<ToolId[]>(
    initialPrefs.recentToolIds
  );
  const [splashPreviewOpen, setSplashPreviewOpen] = useState(false);
  const [adminModeOpen, setAdminModeOpen] = useState(false);
  const [quickAddFabOpen, setQuickAddFabOpen] = useState(false);
  const [quickAddRequest, setQuickAddRequest] = useState<QuickAddRequest | null>(
    null
  );
  const [securityConfig, setSecurityConfig] = useState<AppSecurityConfig>(() =>
    loadSecurityConfig()
  );
  const [isAppLocked, setIsAppLocked] = useState<boolean>(
    () => loadSecurityConfig().pinEnabled
  );
  const [securityNotice, setSecurityNotice] = useState<string | null>(null);

  const adSystem = useGlobalAdSystem({
    isReady: !showSplash && !isAppLocked,
    isBlockedContext: adminModeOpen || splashPreviewOpen || isAppLocked,
  });

  const startupTimeRef = useRef<number>(performance.now());
  const initReadyRef = useRef<boolean>(false);
  const initPercentRef = useRef<number>(0);
  const quickAddCounterRef = useRef<number>(0);
  const lastActiveAtRef = useRef<number>(Date.now());
  const backgroundedAtRef = useRef<number | null>(null);

  const t = TRANSLATIONS[language];

  // Startup Splash Gate: enforces BOTH minimum 8s duration AND real initialization completion
  useEffect(() => {
    if (!showSplash) return;

    let cancelled = false;
    let finishTimeout: number | undefined;
    startupTimeRef.current = performance.now();
    initReadyRef.current = false;
    initPercentRef.current = 0;
    setInitError(null);
    setSplashProgress(0);

    initializeEasyDayWorkspace((pct) => {
      if (!cancelled) {
        initPercentRef.current = pct;
      }
    })
      .then((result) => {
        if (cancelled) return;
        setLanguage(result.preferences.language);
        setTheme(result.preferences.theme);
        setRecentToolIds(result.preferences.recentToolIds);
        initReadyRef.current = true;
      })
      .catch((err: unknown) => {
        if (cancelled) return;
        const message =
          err instanceof Error && err.message
            ? err.message
            : 'Unable to initialize EasyDay workspace.';
        setInitError(message);
      });

    const intervalId = window.setInterval(() => {
      if (cancelled) return;
      const elapsed = performance.now() - startupTimeRef.current;
      const timeRatio = Math.min(1, elapsed / MINIMUM_SPLASH_MS);
      const timePercent = timeRatio * 100;

      if (initReadyRef.current && elapsed >= MINIMUM_SPLASH_MS) {
        setSplashProgress(100);
        window.clearInterval(intervalId);
        finishTimeout = window.setTimeout(() => {
          if (!cancelled) {
            setShowSplash(false);
          }
        }, 150);
        return;
      }

      // Never display a fake 100% while either initialization or 8s minimum is incomplete
      const cappedByInit = initReadyRef.current
        ? Math.min(99, Math.round(timePercent))
        : Math.min(95, Math.round(timePercent), Math.round(initPercentRef.current * 0.92));

      setSplashProgress(cappedByInit);
    }, 100);

    return () => {
      cancelled = true;
      window.clearInterval(intervalId);
      if (finishTimeout !== undefined) {
        window.clearTimeout(finishTimeout);
      }
    };
  }, [initAttempt, showSplash]);

  // Sync HTML lang and dir attributes for English (LTR) & Urdu (RTL)
  useEffect(() => {
    const root = document.documentElement;
    root.lang = language;
    root.dir = language === 'ur' ? 'rtl' : 'ltr';
    try {
      localStorage.setItem(STORAGE_LANG_KEY, language);
    } catch {
      // Ignore storage errors
    }
  }, [language]);

  // Sync Tailwind v4 dark class, background color, and Android status/theme-color
  useEffect(() => {
    const root = document.documentElement;
    root.classList.toggle('dark', theme === 'dark');

    const activeBg = showSplash
      ? '#040D21'
      : theme === 'dark'
        ? '#040D21'
        : '#F2F6FC';

    root.style.backgroundColor = activeBg;
    document.body.style.backgroundColor = activeBg;

    const themeMeta = document.querySelector('meta[name="theme-color"]');
    if (themeMeta) {
      themeMeta.setAttribute('content', activeBg);
    }

    try {
      localStorage.setItem(STORAGE_THEME_KEY, theme);
    } catch {
      // Ignore storage errors
    }

    void syncAndroidStatusBar(theme, showSplash);
  }, [theme, showSplash]);

  // Sync scheduled Android bill reminders & overdue alerts on app startup
  useEffect(() => {
    if (showSplash) return;
    const storedBills = billsStorage.loadBills();
    if (storedBills.length === 0) return;
    void syncAllBillRemindersAndOverdueAlerts(storedBills, language);
  }, [showSplash, language]);

  // Phase 4: Automatic App Lock lifecycle (backgrounding, visibilitychange, and inactivity timer)
  useEffect(() => {
    if (showSplash || !securityConfig.pinEnabled) {
      return;
    }

    const markUserActive = () => {
      if (!isAppLocked) {
        lastActiveAtRef.current = Date.now();
      }
    };

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'hidden') {
        if (!isNativeDialogGraceActive()) {
          backgroundedAtRef.current = Date.now();
          if (securityConfig.lockOnBackground) {
            setIsAppLocked(true);
          }
        }
      } else if (document.visibilityState === 'visible') {
        const shouldLock = shouldAutoLockOnResume({
          config: securityConfig,
          lastActiveAtMs: lastActiveAtRef.current,
          backgroundedAtMs: backgroundedAtRef.current,
          nativeDialogGraceActive: isNativeDialogGraceActive(),
        });
        backgroundedAtRef.current = null;
        if (shouldLock) {
          setIsAppLocked(true);
        } else {
          lastActiveAtRef.current = Date.now();
        }
      }
    };

    const unregisterNativeState = registerAndroidAppStateChange((isActive) => {
      if (!isActive) {
        if (!isNativeDialogGraceActive()) {
          backgroundedAtRef.current = Date.now();
          if (securityConfig.lockOnBackground) {
            setIsAppLocked(true);
          }
        }
      } else {
        const shouldLock = shouldAutoLockOnResume({
          config: securityConfig,
          lastActiveAtMs: lastActiveAtRef.current,
          backgroundedAtMs: backgroundedAtRef.current,
          nativeDialogGraceActive: isNativeDialogGraceActive(),
        });
        backgroundedAtRef.current = null;
        if (shouldLock) {
          setIsAppLocked(true);
        } else {
          lastActiveAtRef.current = Date.now();
        }
      }
    });

    const activityEvents: Array<keyof WindowEventMap> = [
      'pointerdown',
      'keydown',
      'touchstart',
      'scroll',
    ];
    for (const ev of activityEvents) {
      window.addEventListener(ev, markUserActive, { passive: true });
    }
    document.addEventListener('visibilitychange', handleVisibilityChange);

    let inactivityInterval: number | undefined;
    if (securityConfig.inactivityTimeoutSeconds > 0 && !isAppLocked) {
      inactivityInterval = window.setInterval(() => {
        if (isNativeDialogGraceActive()) {
          lastActiveAtRef.current = Date.now();
          return;
        }
        const elapsedMs = Date.now() - lastActiveAtRef.current;
        if (elapsedMs >= securityConfig.inactivityTimeoutSeconds * 1000) {
          setIsAppLocked(true);
        }
      }, 1000);
    }

    return () => {
      unregisterNativeState();
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      for (const ev of activityEvents) {
        window.removeEventListener(ev, markUserActive);
      }
      if (inactivityInterval !== undefined) {
        window.clearInterval(inactivityInterval);
      }
    };
  }, [isAppLocked, securityConfig, showSplash]);

  const handleSelectTab = useCallback(
    (tab: NavTab) => {
      setQuickAddFabOpen(false);
      setQuickAddRequest(null);
      setSelectedToolId(null);
      setActiveTab(tab);
      window.scrollTo({ top: 0, behavior: 'instant' as ScrollBehavior });
      adSystem.notifyNavigationMoment();
    },
    [adSystem]
  );

  const handleSelectTool = useCallback((toolId: ToolId) => {
    setQuickAddFabOpen(false);
    setQuickAddRequest(null);
    setRecentToolIds((prev) => {
      const next = [toolId, ...prev.filter((id) => id !== toolId)].slice(0, 4);
      try {
        localStorage.setItem(STORAGE_RECENTS_KEY, JSON.stringify(next));
      } catch {
        // Ignore storage errors
      }
      return next;
    });
    setActiveTab('tools');
    setSelectedToolId(toolId);
    window.scrollTo({ top: 0, behavior: 'instant' as ScrollBehavior });
  }, []);

  const handleQuickAdd = useCallback((kind: QuickAddKind) => {
    const toolMap: Record<QuickAddKind, ToolId> = {
      expense: 'expense-tracker',
      udhaar: 'udhaar-manager',
      note: 'notes',
    };
    const targetToolId = toolMap[kind];
    setQuickAddFabOpen(false);
    setRecentToolIds((prev) => {
      const next = [targetToolId, ...prev.filter((id) => id !== targetToolId)].slice(
        0,
        4
      );
      try {
        localStorage.setItem(STORAGE_RECENTS_KEY, JSON.stringify(next));
      } catch {
        // Ignore storage errors
      }
      return next;
    });
    quickAddCounterRef.current += 1;
    setQuickAddRequest({ kind, nonce: quickAddCounterRef.current });
    setActiveTab('tools');
    setSelectedToolId(targetToolId);
    window.scrollTo({ top: 0, behavior: 'instant' as ScrollBehavior });
  }, []);

  const handleToggleLanguage = useCallback(() => {
    setLanguage((prev) => (prev === 'en' ? 'ur' : 'en'));
  }, []);

  const handleToggleTheme = useCallback(() => {
    setTheme((prev) => (prev === 'light' ? 'dark' : 'light'));
  }, []);

  const handleBackupRestored = useCallback((outcome: BackupRestoreOutcome) => {
    const nextLang = outcome.restoredLanguage;
    if (nextLang) {
      setLanguage(nextLang);
    }
    if (outcome.restoredTheme) {
      setTheme(outcome.restoredTheme);
    }
    if (outcome.restoredRecentToolIds) {
      setRecentToolIds(outcome.restoredRecentToolIds);
    }
    const restoredBills = billsStorage.loadBills();
    void syncAllBillRemindersAndOverdueAlerts(
      restoredBills,
      nextLang || language
    );
  }, [language]);

  // Android hardware / gesture Back button handling
  useEffect(() => {
    return registerAndroidBackButton(() => {
      if (showSplash) return;
      if (isAppLocked) {
        void minimizeAndroidApp();
        return;
      }
      if (adSystem.activePresentation) {
        adSystem.dismissActiveAd();
        return;
      }
      if (splashPreviewOpen) {
        setSplashPreviewOpen(false);
        return;
      }
      if (adminModeOpen) {
        setAdminModeOpen(false);
        return;
      }
      if (quickAddFabOpen) {
        setQuickAddFabOpen(false);
        return;
      }
      if (selectedToolId !== null) {
        setQuickAddRequest(null);
        setSelectedToolId(null);
        adSystem.notifyNavigationMoment();
        return;
      }
      if (activeTab !== 'home') {
        setActiveTab('home');
        adSystem.notifyNavigationMoment();
        return;
      }
      void minimizeAndroidApp();
    });
  }, [
    activeTab,
    adSystem,
    adminModeOpen,
    isAppLocked,
    quickAddFabOpen,
    selectedToolId,
    showSplash,
    splashPreviewOpen,
  ]);

  const handleLockNow = useCallback(() => {
    const latest = loadSecurityConfig();
    setSecurityConfig(latest);
    if (latest.pinEnabled) {
      setQuickAddFabOpen(false);
      setSplashPreviewOpen(false);
      setIsAppLocked(true);
    }
  }, []);

  const handleUnlocked = useCallback((updatedConfig: AppSecurityConfig) => {
    setSecurityConfig(updatedConfig);
    lastActiveAtRef.current = Date.now();
    backgroundedAtRef.current = null;
    setIsAppLocked(false);
  }, []);

  const handleSecurityRecovered = useCallback(
    (cleanConfig: AppSecurityConfig) => {
      setSecurityConfig(cleanConfig);
      lastActiveAtRef.current = Date.now();
      backgroundedAtRef.current = null;
      setIsAppLocked(false);
      setSecurityNotice(t.settings.security.recoverySuccessToast);
      window.setTimeout(() => {
        setSecurityNotice(null);
      }, 6500);
    },
    [t.settings.security.recoverySuccessToast]
  );

  if (showSplash) {
    return (
      <SplashScreen
        progress={splashProgress}
        error={initError}
        onRetry={() => setInitAttempt((n) => n + 1)}
      />
    );
  }

  // Zero financial data exposed or rendered while App Lock is active
  if (isAppLocked && securityConfig.pinEnabled) {
    return (
      <AppLockScreen
        config={securityConfig}
        language={language}
        onUnlock={handleUnlocked}
        onSecurityRecovered={handleSecurityRecovered}
        t={t}
      />
    );
  }

  if (adminModeOpen) {
    return (
      <AdminPortal
        language={language}
        onExit={() => setAdminModeOpen(false)}
        onStoreContentMutated={adSystem.refreshAdsAndAnnouncement}
      />
    );
  }

  return (
    <div
      dir={language === 'ur' ? 'rtl' : 'ltr'}
      className="min-h-[100dvh] bg-[#F2F6FC] dark:bg-[#040D21] text-slate-900 dark:text-slate-100 flex flex-col md:flex-row transition-colors duration-150"
    >
      {/* Tablet / Desktop Adaptive Android Rail */}
      <DesktopNavRail
        activeTab={activeTab}
        onSelectTab={handleSelectTab}
        language={language}
        onToggleLanguage={handleToggleLanguage}
        theme={theme}
        onToggleTheme={handleToggleTheme}
        t={t}
      />

      {/* Scrollable App Content Canvas with Android Safe Areas */}
      <main className="flex-1 min-w-0 safe-app-main">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-7">
          {securityNotice && (
            <div
              role="status"
              className="mb-4 rounded-2xl bg-emerald-500/15 border border-emerald-500/35 px-4 py-3 text-xs sm:text-sm font-semibold text-emerald-800 dark:text-emerald-200 flex items-center justify-between gap-3"
            >
              <span>{securityNotice}</span>
              <button
                type="button"
                onClick={() => setSecurityNotice(null)}
                className="text-xs font-bold underline shrink-0"
              >
                {t.settings.closeBtn}
              </button>
            </div>
          )}

          {activeTab === 'home' && !selectedToolId && (
            <HomeScreen
              language={language}
              theme={theme}
              announcement={adSystem.announcement}
              onSelectTool={handleSelectTool}
              onQuickAdd={handleQuickAdd}
              onNavigateTab={handleSelectTab}
              onToggleLanguage={handleToggleLanguage}
              onToggleTheme={handleToggleTheme}
              t={t}
            />
          )}

          {activeTab === 'tools' && !selectedToolId && (
            <ToolsScreen onSelectTool={handleSelectTool} t={t} />
          )}

          {selectedToolId && (
            <ToolDetailScreen
              toolId={selectedToolId}
              language={language}
              quickAddRequest={quickAddRequest}
              onBack={() => {
                setQuickAddRequest(null);
                setSelectedToolId(null);
                adSystem.notifyNavigationMoment();
              }}
              t={t}
            />
          )}

          {activeTab === 'settings' && !selectedToolId && (
            <SettingsScreen
              language={language}
              theme={theme}
              securityConfig={securityConfig}
              onChangeLanguage={setLanguage}
              onChangeTheme={setTheme}
              onSecurityConfigUpdated={(next) => {
                setSecurityConfig(next);
                lastActiveAtRef.current = Date.now();
              }}
              onLockNow={handleLockNow}
              onBackupRestored={handleBackupRestored}
              onOpenSplashPreview={() => setSplashPreviewOpen(true)}
              onOpenAdminPanel={() => setAdminModeOpen(true)}
              t={t}
            />
          )}
        </div>
      </main>

      {/* Global Quick Add (+) Floating Action Button */}
      {!selectedToolId &&
        !adminModeOpen &&
        !splashPreviewOpen &&
        !adSystem.activePresentation && (
          <QuickAddFab
            open={quickAddFabOpen}
            onToggleOpen={() => setQuickAddFabOpen((prev) => !prev)}
            onClose={() => setQuickAddFabOpen(false)}
            onQuickAdd={handleQuickAdd}
            t={t}
          />
        )}

      {/* Mobile Fixed Bottom Navigation (3 Tabs) */}
      <BottomNav
        activeTab={activeTab}
        onSelectTab={handleSelectTab}
        t={t}
      />

      {/* Optional Branded Splash Screen Preview from Settings */}
      <SplashPreviewModal
        open={splashPreviewOpen}
        onClose={() => setSplashPreviewOpen(false)}
        t={t}
      />

      {/* Full-Screen App-Open & Occasional Global Advertisement Overlay */}
      {adSystem.activePresentation && (
        <GlobalAdOverlay
          ad={adSystem.activePresentation.ad}
          language={language}
          onDismiss={adSystem.dismissActiveAd}
        />
      )}
    </div>
  );
}

