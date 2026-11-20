import React, { useCallback, useEffect, useState } from 'react';
import { User } from 'firebase/auth';
import {
  AlertCircle,
  ArrowLeft,
  CheckCircle2,
  Copy,
  LayoutDashboard,
  LogOut,
  Megaphone,
  MonitorPlay,
  RefreshCw,
  ShieldAlert,
  X,
} from 'lucide-react';
import { ADMIN_TRANSLATIONS } from '../../i18n/adminTranslations';
import { subscribeToAuthState } from '../../lib/firebase';
import {
  AdminAuthCheckResult,
  AdminConsoleSnapshot,
  fetchAdminConsoleSnapshot,
  signOutAdmin,
  verifyAdminAllowlist,
} from '../../services/adminService';
import { Language } from '../../types';
import { EasyDayLogo, ZaidiStoreLogo } from '../BrandLogos';
import { AdminAnnouncementManager } from './AdminAnnouncementManager';
import {
  AdminDashboardOverview,
  AdminSectionTab,
} from './AdminDashboardOverview';
import { AdminGlobalAdsManager } from './AdminGlobalAdsManager';
import { AdminLoginScreen } from './AdminLoginScreen';

interface AdminPortalProps {
  language: Language;
  onExit: () => void;
  onStoreContentMutated: () => Promise<void>;
}

const EMPTY_SNAPSHOT: AdminConsoleSnapshot = {
  ads: [],
  announcement: null,
};

export const AdminPortal: React.FC<AdminPortalProps> = ({
  language,
  onExit,
  onStoreContentMutated,
}) => {
  const tAdmin = ADMIN_TRANSLATIONS[language];

  const [authChecking, setAuthChecking] = useState(true);
  const [user, setUser] = useState<User | null>(null);
  const [authCheck, setAuthCheck] = useState<AdminAuthCheckResult>({
    authorized: false,
    reason: 'not-signed-in',
  });

  const [activeTab, setActiveTab] = useState<AdminSectionTab>('overview');
  const [snapshot, setSnapshot] = useState<AdminConsoleSnapshot>(EMPTY_SNAPSHOT);
  const [loadingData, setLoadingData] = useState(false);
  const [banner, setBanner] = useState<{
    type: 'success' | 'error';
    text: string;
  } | null>(null);
  const [copiedUid, setCopiedUid] = useState(false);

  const loadSnapshot = useCallback(async () => {
    setLoadingData(true);
    try {
      const next = await fetchAdminConsoleSnapshot();
      setSnapshot(next);
    } catch (err) {
      setBanner({
        type: 'error',
        text:
          err instanceof Error
            ? err.message
            : 'Unable to load Global Ads from Firestore.',
      });
    } finally {
      setLoadingData(false);
    }
  }, []);

  const verifyUserAndLoad = useCallback(
    async (nextUser: User | null) => {
      setAuthChecking(true);
      setUser(nextUser);
      if (!nextUser) {
        setAuthCheck({ authorized: false, reason: 'not-signed-in' });
        setSnapshot(EMPTY_SNAPSHOT);
        setAuthChecking(false);
        return;
      }

      const check = await verifyAdminAllowlist(nextUser);
      setAuthCheck(check);
      setAuthChecking(false);

      if (check.authorized) {
        await loadSnapshot();
      }
    },
    [loadSnapshot]
  );

  useEffect(() => {
    const unsubscribe = subscribeToAuthState((nextUser) => {
      void verifyUserAndLoad(nextUser);
    });
    return () => unsubscribe();
  }, [verifyUserAndLoad]);

  const handleDataMutated = useCallback(
    async (successText: string) => {
      await loadSnapshot();
      await onStoreContentMutated();
      setBanner({ type: 'success', text: successText });
    },
    [loadSnapshot, onStoreContentMutated]
  );

  const handleCopyUid = async (uid: string) => {
    try {
      await navigator.clipboard.writeText(uid);
      setCopiedUid(true);
      window.setTimeout(() => setCopiedUid(false), 2000);
    } catch {
      // Clipboard blocked in restricted context
    }
  };

  if (authChecking) {
    return (
      <div
        dir={language === 'ur' ? 'rtl' : 'ltr'}
        className="min-h-[100dvh] bg-[#F2F6FC] dark:bg-[#040D21] text-slate-900 dark:text-slate-100 flex flex-col items-center justify-center p-6 gap-4"
      >
        <div className="w-10 h-10 rounded-full border-4 border-cyan-200 dark:border-cyan-900/50 border-t-cyan-500 animate-spin" />
        <p className="text-sm font-medium text-slate-600 dark:text-slate-400">
          {tAdmin.verifyingAccess}
        </p>
      </div>
    );
  }

  // Dedicated Admin Login when unauthenticated
  if (!user) {
    return (
      <div dir={language === 'ur' ? 'rtl' : 'ltr'}>
        <AdminLoginScreen
          tAdmin={tAdmin}
          onSuccess={() => {}}
          onExit={onExit}
        />
      </div>
    );
  }

  // Signed in with an ordinary account (NOT in admins/{uid} allowlist)
  if (!authCheck.authorized) {
    return (
      <div
        dir={language === 'ur' ? 'rtl' : 'ltr'}
        className="min-h-[100dvh] bg-[#F2F6FC] dark:bg-[#040D21] text-slate-900 dark:text-slate-100 flex flex-col px-4 py-6 sm:px-6 safe-app-main"
      >
        <div className="max-w-lg w-full mx-auto flex items-center justify-between gap-3 mb-6">
          <button
            type="button"
            onClick={onExit}
            className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-white dark:bg-[#0B1836] border border-slate-200 dark:border-cyan-900/50 text-xs sm:text-sm font-semibold text-slate-700 dark:text-slate-200 min-h-[44px]"
          >
            <ArrowLeft className="w-4 h-4 rtl:rotate-180" />
            <span>{tAdmin.backToApp}</span>
          </button>
        </div>

        <div className="flex-1 flex items-center justify-center">
          <div className="w-full max-w-lg rounded-3xl bg-white dark:bg-[#0B1836] border border-red-200 dark:border-red-900/70 p-6 sm:p-8 space-y-5 shadow-sm">
            <div className="flex items-start gap-3.5">
              <span className="w-11 h-11 rounded-2xl bg-red-50 dark:bg-red-950/60 text-red-600 dark:text-red-400 flex items-center justify-center shrink-0">
                <ShieldAlert className="w-6 h-6" />
              </span>
              <div className="space-y-1">
                <h1 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white">
                  {tAdmin.unauthorized.heading}
                </h1>
                <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                  {tAdmin.unauthorized.body}
                </p>
              </div>
            </div>

            {authCheck.message && (
              <p className="text-xs text-red-700 dark:text-red-300 bg-red-50 dark:bg-red-950/40 rounded-xl px-3.5 py-2.5">
                {authCheck.message}
              </p>
            )}

            <div className="rounded-2xl bg-slate-50 dark:bg-[#061026] border border-slate-200 dark:border-cyan-900/50 p-4 space-y-2">
              <div className="flex items-center justify-between gap-2 text-xs font-semibold text-slate-500 dark:text-slate-400">
                <span>{tAdmin.unauthorized.uidLabel}</span>
                {user.email && <span className="truncate">{user.email}</span>}
              </div>
              <div className="flex items-center justify-between gap-2">
                <code className="text-xs font-mono text-slate-900 dark:text-cyan-200 break-all">
                  {user.uid}
                </code>
                <button
                  type="button"
                  onClick={() => void handleCopyUid(user.uid)}
                  className="shrink-0 inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-white dark:bg-[#0D1E42] border border-slate-200 dark:border-cyan-900/50 text-xs font-semibold text-slate-700 dark:text-slate-200 min-h-[36px]"
                >
                  <Copy className="w-3.5 h-3.5" />
                  <span>
                    {copiedUid
                      ? tAdmin.unauthorized.copiedUidBtn
                      : tAdmin.unauthorized.copyUidBtn}
                  </span>
                </button>
              </div>
            </div>

            <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
              {tAdmin.unauthorized.ruleHint}
            </p>

            <button
              type="button"
              onClick={() => void signOutAdmin()}
              className="w-full min-h-[46px] px-4 py-2.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-[#040D21] text-sm font-bold inline-flex items-center justify-center gap-2 transition-colors"
            >
              <LogOut className="w-4 h-4" />
              <span>{tAdmin.unauthorized.switchAccountBtn}</span>
            </button>
          </div>
        </div>
      </div>
    );
  }

  const navTabs: {
    id: AdminSectionTab;
    label: string;
    Icon: React.ComponentType<{ className?: string }>;
  }[] = [
    { id: 'overview', label: tAdmin.tabs.overview, Icon: LayoutDashboard },
    { id: 'globalAds', label: tAdmin.tabs.globalAds, Icon: MonitorPlay },
    { id: 'announcement', label: tAdmin.tabs.announcement, Icon: Megaphone },
  ];

  return (
    <div
      dir={language === 'ur' ? 'rtl' : 'ltr'}
      className="min-h-[100dvh] bg-[#F2F6FC] dark:bg-[#040D21] text-slate-900 dark:text-slate-100 flex flex-col"
    >
      {/* Dedicated Top Bar (separate from consumer BottomNav) */}
      <header className="sticky top-0 z-30 bg-white/95 dark:bg-[#061026]/95 backdrop-blur-md border-b border-slate-200 dark:border-cyan-900/50">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-3 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <button
              type="button"
              onClick={onExit}
              aria-label={tAdmin.backToApp}
              className="min-w-[44px] min-h-[44px] rounded-xl bg-slate-100 dark:bg-[#0D1E42] hover:bg-slate-200 dark:hover:bg-[#132959] flex items-center justify-center text-slate-700 dark:text-cyan-300 transition-colors shrink-0"
            >
              <ArrowLeft className="w-4 h-4 rtl:rotate-180" />
            </button>

            <div className="flex items-center gap-2.5 min-w-0">
              <EasyDayLogo className="w-8 h-8 shrink-0" />
              <div className="min-w-0">
                <div className="flex items-center gap-1.5">
                  <ZaidiStoreLogo className="w-4 h-4 shrink-0" />
                  <h1 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white truncate">
                    {tAdmin.portalTitle}
                  </h1>
                </div>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
                  {user.email || user.uid}
                </p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              disabled={loadingData}
              onClick={() => void loadSnapshot()}
              className="min-h-[40px] px-3 py-2 rounded-xl bg-slate-100 dark:bg-[#0D1E42] hover:bg-slate-200 dark:hover:bg-[#132959] disabled:opacity-60 text-xs font-semibold text-slate-700 dark:text-slate-200 inline-flex items-center gap-1.5 transition-colors"
            >
              <RefreshCw
                className={`w-3.5 h-3.5 ${loadingData ? 'animate-spin' : ''}`}
              />
              <span className="hidden sm:inline">{tAdmin.refresh}</span>
            </button>

            <button
              type="button"
              onClick={() => void signOutAdmin()}
              className="min-h-[40px] px-3 py-2 rounded-xl bg-cyan-50 dark:bg-cyan-500/15 hover:bg-cyan-100 dark:hover:bg-cyan-500/25 border border-transparent dark:border-cyan-500/30 text-xs font-semibold text-cyan-700 dark:text-cyan-300 inline-flex items-center gap-1.5 transition-colors"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>{tAdmin.signOut}</span>
            </button>
          </div>
        </div>

        {/* Section Tabs */}
        <div className="max-w-6xl mx-auto px-4 sm:px-6 border-t border-slate-100 dark:border-cyan-900/40 overflow-x-auto">
          <nav
            aria-label="Admin Sections"
            className="flex items-center gap-1.5 py-2 min-w-max"
          >
            {navTabs.map(({ id, label, Icon }) => {
              const active = activeTab === id;
              return (
                <button
                  key={id}
                  type="button"
                  onClick={() => setActiveTab(id)}
                  data-testid={`admin-tab-${id}`}
                  className={`inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs sm:text-sm font-semibold whitespace-nowrap min-h-[40px] transition-colors ${
                    active
                      ? 'bg-cyan-500 text-[#040D21] font-bold shadow-sm shadow-cyan-500/20'
                      : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-[#0D1E42]'
                  }`}
                >
                  <Icon className="w-4 h-4 shrink-0" />
                  <span>{label}</span>
                </button>
              );
            })}
          </nav>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 max-w-6xl w-full mx-auto px-4 sm:px-6 py-5 sm:py-7 space-y-5 pb-[max(2rem,env(safe-area-inset-bottom,0px))]">
        {banner && (
          <div
            role={banner.type === 'error' ? 'alert' : 'status'}
            className={`rounded-2xl p-3.5 sm:p-4 border flex items-start justify-between gap-3 text-xs sm:text-sm ${
              banner.type === 'success'
                ? 'bg-cyan-50 dark:bg-cyan-950/40 border-cyan-200 dark:border-cyan-800/60 text-cyan-800 dark:text-cyan-200'
                : 'bg-red-50 dark:bg-red-950/40 border-red-200 dark:border-red-900/60 text-red-700 dark:text-red-300'
            }`}
          >
            <div className="flex items-start gap-2.5">
              {banner.type === 'success' ? (
                <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" />
              ) : (
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              )}
              <span>{banner.text}</span>
            </div>
            <button
              type="button"
              onClick={() => setBanner(null)}
              aria-label={tAdmin.ads.cancelBtn}
              className="p-1 rounded-lg hover:bg-black/5 dark:hover:bg-white/10 shrink-0"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {activeTab === 'overview' && (
          <AdminDashboardOverview
            snapshot={snapshot}
            tAdmin={tAdmin}
            onNavigateTab={setActiveTab}
          />
        )}

        {activeTab === 'globalAds' && (
          <AdminGlobalAdsManager
            ads={snapshot.ads}
            language={language}
            tAdmin={tAdmin}
            onMutated={handleDataMutated}
            onError={(text) => setBanner({ type: 'error', text })}
          />
        )}

        {activeTab === 'announcement' && (
          <AdminAnnouncementManager
            current={snapshot.announcement}
            tAdmin={tAdmin}
            onUpdated={handleDataMutated}
            onError={(text) => setBanner({ type: 'error', text })}
          />
        )}
      </main>
    </div>
  );
};
