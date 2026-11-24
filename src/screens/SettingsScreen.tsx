import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  AlertTriangle,
  CheckCircle2,
  ChevronRight,
  Download,
  HardDrive,
  Info,
  Languages,
  Lock,
  Moon,
  RotateCcw,
  Share2,
  ShieldAlert,
  ShieldCheck,
  Smartphone,
  Sun,
  X,
} from 'lucide-react';
import { TranslationBundle } from '../i18n/translations';
import { Language, Theme } from '../types';
import {
  EasyDayLogo,
  EasyDayWordmark,
  ZaidiInteractiveLogo,
  ZaidiStoreLogo,
} from '../components/BrandLogos';
import { isNativeAndroid } from '../utils/androidBridge';
import {
  BackupRestoreOutcome,
  EasyDayBackupPayload,
  parseAndValidateBackupJson,
  pickBackupJsonViaAndroid,
  restoreEasyDayBackupTransactional,
  saveBackupToDevice,
  shareBackupFile,
} from '../utils/backupSystem';
import {
  getBillPhotosUsageSummary,
  migrateLegacyBillPhotosToIndexedDB,
  PhotoUsageSummary,
} from '../utils/photoStorage';
import {
  BackupReminderMeta,
  backupMetaStorage,
  formatByteSize,
  inspectLocalStorageHealth,
  StorageHealthReport,
} from '../utils/storage';
import { AppSecurityConfig } from '../utils/appSecurity';
import { SecuritySettingsSection } from '../components/SecuritySettingsSection';

interface SettingsScreenProps {
  language: Language;
  theme: Theme;
  securityConfig: AppSecurityConfig;
  onChangeLanguage: (lang: Language) => void;
  onChangeTheme: (theme: Theme) => void;
  onSecurityConfigUpdated: (next: AppSecurityConfig) => void;
  onLockNow: () => void;
  onBackupRestored?: (outcome: BackupRestoreOutcome) => void;
  onOpenSplashPreview: () => void;
  onOpenAdminPanel: () => void;
  t: TranslationBundle;
}

type BackupStatusBanner = {
  tone: 'success' | 'warning' | 'error' | 'info';
  title: string;
  detail?: string;
};

export const SettingsScreen: React.FC<SettingsScreenProps> = ({
  language,
  theme,
  securityConfig,
  onChangeLanguage,
  onChangeTheme,
  onSecurityConfigUpdated,
  onLockNow,
  onBackupRestored,
  onOpenSplashPreview,
  onOpenAdminPanel,
  t,
}) => {
  const ds = t.settings.dataSafety;
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const [privacyOpen, setPrivacyOpen] = useState(false);

  // Data Safety, Storage Health & Backup State
  const [lastBackupMeta, setLastBackupMeta] = useState<BackupReminderMeta | null>(
    () => backupMetaStorage.loadLastBackupMeta()
  );
  const [storageHealth, setStorageHealth] = useState<StorageHealthReport>(() =>
    inspectLocalStorageHealth()
  );
  const [photoSummary, setPhotoSummary] = useState<PhotoUsageSummary>({
    available: true,
    count: 0,
    totalBytes: 0,
  });

  const [busyAction, setBusyAction] = useState<
    null | 'save' | 'share' | 'read' | 'restore'
  >(null);
  const [banner, setBanner] = useState<BackupStatusBanner | null>(null);
  const [pendingRestore, setPendingRestore] = useState<EasyDayBackupPayload | null>(
    null
  );

  const refreshDiagnostics = useCallback(async () => {
    setLastBackupMeta(backupMetaStorage.loadLastBackupMeta());
    setStorageHealth(inspectLocalStorageHealth());
    const usage = await getBillPhotosUsageSummary();
    setPhotoSummary(usage);
  }, []);

  useEffect(() => {
    let active = true;
    const initCheck = async () => {
      const initialHealth = inspectLocalStorageHealth();
      if (initialHealth.legacyInlinePhotoCount > 0) {
        await migrateLegacyBillPhotosToIndexedDB();
      }
      if (!active) return;
      await refreshDiagnostics();
    };
    void initCheck();
    return () => {
      active = false;
    };
  }, [refreshDiagnostics]);

  const formatDateTime = useCallback(
    (input: number | string) => {
      try {
        const d = typeof input === 'number' ? new Date(input) : new Date(input);
        if (Number.isNaN(d.getTime())) return String(input);
        return new Intl.DateTimeFormat(language === 'ur' ? 'ur-PK' : 'en-US', {
          year: 'numeric',
          month: 'short',
          day: 'numeric',
          hour: '2-digit',
          minute: '2-digit',
        }).format(d);
      } catch {
        return String(input);
      }
    },
    [language]
  );

  const handleSaveBackup = async () => {
    if (busyAction) return;
    setBusyAction('save');
    setBanner(null);
    try {
      const outcome = await saveBackupToDevice(language);
      if (outcome.status === 'saved') {
        if (outcome.meta) setLastBackupMeta(outcome.meta);
        setBanner({
          tone: 'success',
          title: ds.backupSavedTitle,
          detail: outcome.locationLabel || outcome.filename,
        });
      } else if (outcome.status === 'cancelled') {
        setBanner({
          tone: 'info',
          title: ds.backupCancelled,
        });
      } else {
        setBanner({
          tone: 'error',
          title: outcome.errorMessage || 'Backup failed',
        });
      }
      await refreshDiagnostics();
    } finally {
      setBusyAction(null);
    }
  };

  const handleShareBackup = async () => {
    if (busyAction) return;
    setBusyAction('share');
    setBanner(null);
    try {
      const outcome = await shareBackupFile(language);
      if (outcome.status === 'shared' || outcome.status === 'saved') {
        if (outcome.meta) setLastBackupMeta(outcome.meta);
        setBanner({
          tone: 'success',
          title:
            outcome.status === 'shared'
              ? ds.backupSharedSuccess
              : ds.backupSavedTitle,
          detail: outcome.locationLabel || outcome.filename,
        });
      } else if (outcome.status === 'cancelled') {
        setBanner({
          tone: 'info',
          title: ds.backupCancelled,
        });
      } else {
        setBanner({
          tone: 'error',
          title: outcome.errorMessage || 'Share failed',
        });
      }
      await refreshDiagnostics();
    } finally {
      setBusyAction(null);
    }
  };

  const processSelectedJsonText = useCallback(
    (rawText: string) => {
      const validation = parseAndValidateBackupJson(rawText, language);
      if (!validation.ok || !validation.backup) {
        setBanner({
          tone: 'error',
          title: validation.message || 'Invalid backup file.',
        });
        return;
      }
      setBanner(null);
      setPendingRestore(validation.backup);
    },
    [language]
  );

  const handleStartRestorePick = async () => {
    if (busyAction) return;
    setBanner(null);

    if (isNativeAndroid()) {
      setBusyAction('read');
      try {
        const picked = await pickBackupJsonViaAndroid();
        if (picked.cancelled) {
          setBanner({
            tone: 'info',
            title: ds.backupCancelled,
          });
          return;
        }
        if (picked.errorMessage || typeof picked.content !== 'string') {
          setBanner({
            tone: 'error',
            title: picked.errorMessage || 'Failed to read selected backup file.',
          });
          return;
        }
        processSelectedJsonText(picked.content);
      } finally {
        setBusyAction(null);
      }
      return;
    }

    fileInputRef.current?.click();
  };

  const handleWebFileSelected = async (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;

    setBusyAction('read');
    setBanner(null);
    try {
      const text = await file.text();
      processSelectedJsonText(text);
    } catch {
      setBanner({
        tone: 'error',
        title:
          language === 'ur'
            ? 'منتخب کردہ فائل پڑھی نہیں جا سکی۔'
            : 'Unable to read the selected file.',
      });
    } finally {
      setBusyAction(null);
    }
  };

  const handleConfirmRestore = async () => {
    if (!pendingRestore || busyAction) return;
    setBusyAction('restore');
    try {
      const outcome = await restoreEasyDayBackupTransactional(
        pendingRestore,
        language
      );
      setPendingRestore(null);

      if (outcome.ok) {
        setBanner({
          tone: 'success',
          title: ds.restoreSuccessTitle,
          detail: ds.restoreSuccessBody,
        });
        await refreshDiagnostics();
        onBackupRestored?.(outcome);
      } else {
        setBanner({
          tone: 'error',
          title: outcome.rolledBack
            ? ds.restoreRolledBackTitle
            : outcome.errorMessage || 'Restore failed.',
          detail: outcome.rolledBack ? outcome.errorMessage : undefined,
        });
        await refreshDiagnostics();
      }
    } finally {
      setBusyAction(null);
    }
  };

  return (
    <div className="space-y-6 max-w-3xl">
      {/* Hidden browser file picker fallback for JSON backups */}
      <input
        ref={fileInputRef}
        type="file"
        accept=".json,application/json"
        onChange={(e) => void handleWebFileSelected(e)}
        className="hidden"
        aria-hidden="true"
        tabIndex={-1}
      />

      {/* Header */}
      <header className="space-y-1">
        <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white tracking-tight">
          {t.settings.title}
        </h1>
        <p className="text-sm text-slate-600 dark:text-slate-400">
          {t.settings.subtitle}
        </p>
      </header>

      {/* Preferences Section */}
      <section aria-labelledby="settings-preferences" className="space-y-3">
        <h2
          id="settings-preferences"
          className="text-sm font-bold text-slate-500 dark:text-slate-400 px-1"
        >
          {t.settings.preferencesSection}
        </h2>

        <div className="rounded-3xl bg-white dark:bg-[#0B1836] border border-slate-200 dark:border-[#1B315E] divide-y divide-slate-100 dark:divide-slate-800 overflow-hidden">
          {/* Language Selection */}
          <div className="p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-start gap-3.5">
              <span className="w-10 h-10 rounded-xl bg-teal-50 dark:bg-teal-950/60 text-teal-600 dark:text-teal-400 flex items-center justify-center shrink-0">
                <Languages className="w-5 h-5" />
              </span>
              <div>
                <p className="text-sm font-bold text-slate-900 dark:text-white">
                  {t.settings.languageLabel}
                </p>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  {t.settings.languageDesc}
                </p>
              </div>
            </div>

            <div
              role="group"
              aria-label={t.settings.languageLabel}
              className="grid grid-cols-2 gap-1.5 p-1 rounded-xl bg-slate-100 dark:bg-[#061026] shrink-0"
            >
              <button
                type="button"
                onClick={() => onChangeLanguage('en')}
                aria-pressed={language === 'en'}
                className={`px-3.5 py-2 rounded-lg text-xs font-semibold transition-colors min-h-[40px] whitespace-nowrap ${
                  language === 'en'
                    ? 'bg-cyan-500 text-[#040D21] shadow-sm'
                    : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                {t.settings.englishOption}
              </button>
              <button
                type="button"
                onClick={() => onChangeLanguage('ur')}
                aria-pressed={language === 'ur'}
                className={`px-3.5 py-2 rounded-lg text-xs font-semibold transition-colors min-h-[40px] whitespace-nowrap ${
                  language === 'ur'
                    ? 'bg-cyan-500 text-[#040D21] shadow-sm'
                    : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                {t.settings.urduOption}
              </button>
            </div>
          </div>

          {/* Theme Selection */}
          <div className="p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-start gap-3.5">
              <span className="w-10 h-10 rounded-xl bg-amber-50 dark:bg-amber-950/50 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0">
                {theme === 'light' ? (
                  <Sun className="w-5 h-5" />
                ) : (
                  <Moon className="w-5 h-5" />
                )}
              </span>
              <div>
                <p className="text-sm font-bold text-slate-900 dark:text-white">
                  {t.settings.themeLabel}
                </p>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  {t.settings.themeDesc}
                </p>
              </div>
            </div>

            <div
              role="group"
              aria-label={t.settings.themeLabel}
              className="grid grid-cols-2 gap-1.5 p-1 rounded-xl bg-slate-100 dark:bg-[#061026] shrink-0"
            >
              <button
                type="button"
                onClick={() => onChangeTheme('light')}
                aria-pressed={theme === 'light'}
                className={`inline-flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-semibold transition-colors min-h-[40px] whitespace-nowrap ${
                  theme === 'light'
                    ? 'bg-cyan-500 text-[#040D21] shadow-sm'
                    : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                <Sun className="w-3.5 h-3.5" />
                <span>{t.settings.lightTheme}</span>
              </button>
              <button
                type="button"
                onClick={() => onChangeTheme('dark')}
                aria-pressed={theme === 'dark'}
                className={`inline-flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-semibold transition-colors min-h-[40px] whitespace-nowrap ${
                  theme === 'dark'
                    ? 'bg-cyan-500 text-[#040D21] shadow-sm'
                    : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                <Moon className="w-3.5 h-3.5" />
                <span>{t.settings.darkTheme}</span>
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Data Safety & Local Backup Section */}
      <section aria-labelledby="settings-data-safety" className="space-y-3">
        <h2
          id="settings-data-safety"
          className="text-sm font-bold text-slate-500 dark:text-slate-400 px-1"
        >
          {ds.sectionTitle}
        </h2>

        <div className="rounded-3xl bg-white dark:bg-[#0B1836] border border-slate-200 dark:border-[#1B315E] divide-y divide-slate-100 dark:divide-[#1B315E] overflow-hidden">
          {/* Header & Primary Action Row */}
          <div className="p-5 space-y-4">
            <div className="flex items-start gap-3.5">
              <span className="w-10 h-10 rounded-xl bg-cyan-500/15 text-cyan-700 dark:text-cyan-300 flex items-center justify-center shrink-0">
                <ShieldCheck className="w-5 h-5" />
              </span>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-bold text-slate-900 dark:text-white">
                  {ds.cardTitle}
                </p>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 leading-relaxed">
                  {ds.cardSubtitle}
                </p>
              </div>
            </div>

            {/* Last Backup Reminder Box */}
            {lastBackupMeta ? (
              <div className="rounded-2xl bg-slate-50 dark:bg-[#061026] border border-slate-200/80 dark:border-[#1B315E] p-3.5 space-y-1">
                <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
                  <span className="font-bold text-slate-700 dark:text-slate-200">
                    {ds.lastBackupLabel}
                  </span>
                  <span className="font-semibold text-cyan-700 dark:text-cyan-300 tabular-nums">
                    {formatDateTime(lastBackupMeta.lastBackupAt)}
                  </span>
                </div>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
                  {lastBackupMeta.filename} · {ds.regularBackupTip}
                </p>
              </div>
            ) : (
              <div className="rounded-2xl bg-amber-50 dark:bg-yellow-400/10 border border-amber-200 dark:border-yellow-400/30 p-3.5 flex items-start gap-2.5">
                <AlertTriangle className="w-4 h-4 text-amber-600 dark:text-yellow-300 shrink-0 mt-0.5" />
                <div className="space-y-0.5 text-xs">
                  <p className="font-bold text-amber-800 dark:text-yellow-200">
                    {ds.noBackupWarningTitle}
                  </p>
                  <p className="text-amber-700 dark:text-slate-300 leading-relaxed">
                    {ds.noBackupWarningBody}
                  </p>
                </div>
              </div>
            )}

            {/* Status / Error Feedback Banner */}
            {banner && (
              <div
                role={banner.tone === 'error' ? 'alert' : 'status'}
                className={`rounded-2xl border p-3.5 flex items-start justify-between gap-2.5 text-xs ${
                  banner.tone === 'success'
                    ? 'bg-emerald-500/15 border-emerald-500/35 text-emerald-800 dark:text-emerald-200'
                    : banner.tone === 'error'
                      ? 'bg-rose-500/15 border-rose-500/40 text-rose-700 dark:text-rose-200'
                      : 'bg-cyan-500/10 border-cyan-500/30 text-cyan-800 dark:text-cyan-200'
                }`}
              >
                <div className="flex items-start gap-2 min-w-0">
                  {banner.tone === 'error' ? (
                    <ShieldAlert className="w-4 h-4 shrink-0 mt-0.5" />
                  ) : (
                    <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" />
                  )}
                  <div className="min-w-0 space-y-0.5">
                    <p className="font-bold break-words">{banner.title}</p>
                    {banner.detail && (
                      <p className="opacity-90 break-words">{banner.detail}</p>
                    )}
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setBanner(null)}
                  aria-label={t.settings.closeBtn}
                  className="min-w-[28px] min-h-[28px] flex items-center justify-center rounded-lg hover:bg-black/5 dark:hover:bg-white/10 shrink-0"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            )}

            {/* 3 Primary Backup / Share / Restore Actions */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
              <button
                type="button"
                disabled={busyAction !== null}
                onClick={() => void handleSaveBackup()}
                data-testid="save-backup-btn"
                className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 disabled:opacity-55 text-[#040D21] text-xs sm:text-sm font-bold min-h-[44px] transition-colors whitespace-nowrap"
              >
                <Download className="w-4 h-4 shrink-0" />
                <span>
                  {busyAction === 'save' ? ds.busyExporting : ds.saveBackupBtn}
                </span>
              </button>

              <button
                type="button"
                disabled={busyAction !== null}
                onClick={() => void handleShareBackup()}
                data-testid="share-backup-btn"
                className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-yellow-400 hover:bg-yellow-300 disabled:opacity-55 text-[#040D21] text-xs sm:text-sm font-bold min-h-[44px] transition-colors whitespace-nowrap"
              >
                <Share2 className="w-4 h-4 shrink-0" />
                <span>
                  {busyAction === 'share' ? ds.busySharing : ds.shareBackupBtn}
                </span>
              </button>

              <button
                type="button"
                disabled={busyAction !== null}
                onClick={() => void handleStartRestorePick()}
                data-testid="restore-backup-btn"
                className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-slate-100 dark:bg-[#061026] border border-slate-200 dark:border-[#213B70] hover:border-cyan-500 disabled:opacity-55 text-slate-800 dark:text-slate-100 text-xs sm:text-sm font-bold min-h-[44px] transition-colors whitespace-nowrap"
              >
                <RotateCcw className="w-4 h-4 shrink-0 text-cyan-600 dark:text-cyan-400" />
                <span>
                  {busyAction === 'read'
                    ? ds.busyReading
                    : busyAction === 'restore'
                      ? ds.busyRestoring
                      : ds.restoreBackupBtn}
                </span>
              </button>
            </div>
          </div>

          {/* LocalStorage & IndexedDB Storage Health Row */}
          <div className="p-5 space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
              <div className="flex items-center gap-2 font-bold text-slate-700 dark:text-slate-200">
                <HardDrive className="w-4 h-4 text-cyan-600 dark:text-cyan-400 shrink-0" />
                <span>{ds.storageHealthLabel}</span>
              </div>
              <span
                className={`font-bold tabular-nums ${
                  storageHealth.isCritical
                    ? 'text-rose-600 dark:text-rose-400'
                    : storageHealth.isNearLimit
                      ? 'text-amber-600 dark:text-yellow-300'
                      : 'text-emerald-600 dark:text-emerald-400'
                }`}
              >
                {formatByteSize(storageHealth.usedBytes)} /{' '}
                {formatByteSize(storageHealth.quotaBytes)} ·{' '}
                {storageHealth.usagePercent}%
              </span>
            </div>

            <div className="w-full h-2 rounded-full bg-slate-100 dark:bg-[#061026] overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-200 ${
                  storageHealth.isCritical
                    ? 'bg-rose-500'
                    : storageHealth.isNearLimit
                      ? 'bg-yellow-400'
                      : 'bg-cyan-500'
                }`}
                style={{ width: `${Math.max(2, Math.min(100, storageHealth.usagePercent))}%` }}
              />
            </div>

            <div className="flex flex-wrap items-center justify-between gap-2 text-[11px] text-slate-500 dark:text-slate-400 tabular-nums">
              <span>
                {ds.photosStoredLabel}: {photoSummary.count} (
                {formatByteSize(photoSummary.totalBytes)})
              </span>
              <span>
                {storageHealth.isCritical
                  ? ds.storageCriticalWarning
                  : storageHealth.isNearLimit
                    ? ds.storageNearLimitWarning
                    : ds.storageHealthyStatus}
              </span>
            </div>

            {storageHealth.legacyInlinePhotoCount > 0 && (
              <p className="text-[11px] font-semibold text-amber-700 dark:text-yellow-300">
                {storageHealth.legacyInlinePhotoCount} {ds.legacyMigratingNote}
              </p>
            )}
          </div>
        </div>
      </section>

      {/* App Security & Biometric Lock Section */}
      <SecuritySettingsSection
        config={securityConfig}
        onConfigUpdated={onSecurityConfigUpdated}
        onLockNow={onLockNow}
        t={t}
      />

      {/* Store Administration Section */}
      <section aria-labelledby="settings-admin" className="space-y-3">
        <h2
          id="settings-admin"
          className="text-sm font-bold text-slate-500 dark:text-slate-400 px-1"
        >
          {t.settings.adminSection}
        </h2>

        <div className="rounded-3xl bg-white dark:bg-[#0B1836] border border-slate-200 dark:border-[#1B315E] p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-start gap-3.5">
            <span className="w-10 h-10 rounded-xl bg-cyan-50 dark:bg-cyan-500/15 text-cyan-700 dark:text-yellow-400 flex items-center justify-center shrink-0">
              <Lock className="w-5 h-5" />
            </span>
            <div>
              <p className="text-sm font-bold text-slate-900 dark:text-white">
                {t.settings.adminTitle}
              </p>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 leading-relaxed">
                {t.settings.adminSummary}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onOpenAdminPanel}
            data-testid="open-admin-panel-btn"
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-yellow-400 hover:bg-yellow-300 text-[#040D21] text-xs sm:text-sm font-bold transition-colors min-h-[44px] shrink-0 whitespace-nowrap"
          >
            <Lock className="w-4 h-4 shrink-0" />
            <span>{t.settings.openAdminBtn}</span>
            <ChevronRight className="w-4 h-4 shrink-0 rtl:rotate-180" />
          </button>
        </div>
      </section>

      {/* About & Developer Branding Section */}
      <section aria-labelledby="settings-about" className="space-y-3">
        <h2
          id="settings-about"
          className="text-sm font-bold text-slate-500 dark:text-slate-400 px-1"
        >
          {t.settings.aboutSection}
        </h2>

        <div className="rounded-3xl bg-white dark:bg-[#0B1836] border border-slate-200 dark:border-[#1B315E] divide-y divide-slate-100 dark:divide-slate-800 overflow-hidden">
          {/* About EasyDay */}
          <div className="p-5 space-y-4">
            <div className="flex items-start gap-3.5">
              <EasyDayLogo className="w-11 h-11 shrink-0" />
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5">
                  <EasyDayWordmark className="text-lg" />
                  <span className="text-xs text-slate-400">·</span>
                  <span className="text-xs font-medium text-teal-700 dark:text-teal-400">
                    {t.brand.tagline}
                  </span>
                </div>
                <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 mt-1.5 leading-relaxed">
                  {t.settings.aboutEasyDayBody}
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={onOpenSplashPreview}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200/80 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-100 text-xs font-semibold transition-colors min-h-[40px]"
            >
              <Smartphone className="w-4 h-4 text-blue-600 dark:text-sky-400" />
              <span>{t.settings.previewSplashBtn}</span>
            </button>
          </div>

          {/* Developer Information — ZAIDI INTERACTIVE with transparent logo */}
          <div className="p-5 flex items-start gap-3.5">
            <div className="w-11 h-11 rounded-xl flex items-center justify-center shrink-0">
              <ZaidiInteractiveLogo className="w-9 h-9" />
            </div>
            <div className="min-w-0 space-y-1.5">
              <div className="flex flex-wrap items-center gap-x-2">
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                  {t.settings.developerTitle}
                </h3>
                <span className="text-xs text-slate-400">·</span>
                <span className="text-xs font-extrabold text-blue-600 dark:text-sky-400">
                  {t.brand.developerName}
                </span>
              </div>
              <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                {t.settings.developerBody}
              </p>
              <div className="flex items-center gap-2 pt-1 text-xs font-semibold text-slate-700 dark:text-slate-300">
                <ZaidiStoreLogo className="w-4 h-4 shrink-0" />
                <span>{t.settings.distributedBy}</span>
              </div>
            </div>
          </div>

          {/* App Version & Release Stage */}
          <div className="p-5 flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <span className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 flex items-center justify-center shrink-0">
                <Info className="w-5 h-5" />
              </span>
              <div>
                <p className="text-sm font-bold text-slate-900 dark:text-white">
                  {t.settings.versionLabel}
                </p>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  {t.settings.buildPhaseLabel} · {t.settings.buildPhaseValue}
                </p>
              </div>
            </div>
            <span className="text-sm font-mono tabular-nums font-bold text-slate-800 dark:text-slate-200">
              {t.settings.versionValue}
            </span>
          </div>

          {/* Privacy Policy Placeholder */}
          <button
            type="button"
            onClick={() => setPrivacyOpen(true)}
            className="w-full p-5 flex items-center justify-between gap-4 hover:bg-slate-50 dark:hover:bg-slate-800/50 text-start transition-colors min-h-[68px]"
          >
            <div className="flex items-start gap-3">
              <span className="w-10 h-10 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
                <ShieldCheck className="w-5 h-5" />
              </span>
              <div>
                <p className="text-sm font-bold text-slate-900 dark:text-white">
                  {t.settings.privacyTitle}
                </p>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  {t.settings.privacySummary}
                </p>
              </div>
            </div>
            <ChevronRight className="w-5 h-5 text-slate-400 shrink-0 rtl:rotate-180" />
          </button>
        </div>
      </section>

      {/* Safe Restore Preview & Explicit Confirmation Modal */}
      {pendingRestore && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="restore-preview-title"
          className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-[#020817]/80 backdrop-blur-sm"
        >
          <div className="w-full sm:max-w-lg rounded-t-3xl sm:rounded-3xl bg-white dark:bg-[#0B1836] border border-slate-200 dark:border-[#1B315E] p-6 pb-[max(1.5rem,calc(env(safe-area-inset-bottom,0px)+1rem))] space-y-4 shadow-xl max-h-[90dvh] overflow-y-auto">
            <div className="w-10 h-1.5 rounded-full bg-slate-300 dark:bg-slate-700 mx-auto sm:hidden" />

            <div className="flex items-center justify-between gap-3">
              <h3
                id="restore-preview-title"
                className="text-lg font-bold text-slate-900 dark:text-white"
              >
                {ds.restoreModalTitle}
              </h3>
              <button
                type="button"
                disabled={busyAction === 'restore'}
                onClick={() => setPendingRestore(null)}
                aria-label={ds.cancelBtn}
                className="min-w-[40px] min-h-[40px] rounded-xl flex items-center justify-center text-slate-500 hover:bg-slate-100 dark:hover:bg-[#11244D]"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Metadata summary line */}
            <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-500 dark:text-slate-400 tabular-nums">
              <span>
                {ds.restorePreviewCreated}:{' '}
                <strong className="text-slate-800 dark:text-slate-200">
                  {formatDateTime(pendingRestore.summary.createdAt)}
                </strong>
              </span>
              <span aria-hidden="true">·</span>
              <span>
                {ds.restorePreviewAppVersion}:{' '}
                <strong className="text-slate-800 dark:text-slate-200">
                  {pendingRestore.summary.appVersion}
                </strong>
              </span>
            </div>

            {/* Record Counts Preview Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 tabular-nums">
              {[
                {
                  label: ds.countBills,
                  value: pendingRestore.summary.billsCount,
                },
                {
                  label: ds.countExpenses,
                  value: pendingRestore.summary.expensesCount,
                },
                {
                  label: ds.countUdhaarEntries,
                  value: pendingRestore.summary.udhaarTransactionsCount,
                },
                {
                  label: ds.countUdhaarContacts,
                  value: pendingRestore.summary.udhaarContactsCount,
                },
                {
                  label: ds.countKametis,
                  value: pendingRestore.summary.kametiCount,
                },
                {
                  label: ds.countNotes,
                  value: pendingRestore.summary.notesCount,
                },
                {
                  label: ds.countPhotos,
                  value: pendingRestore.summary.photosCount,
                },
              ].map((stat) => (
                <div
                  key={stat.label}
                  className="rounded-2xl bg-slate-50 dark:bg-[#061026] border border-slate-200/70 dark:border-[#1B315E] p-3"
                >
                  <p className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 truncate">
                    {stat.label}
                  </p>
                  <p className="text-lg font-extrabold text-cyan-700 dark:text-cyan-300 mt-0.5">
                    {stat.value}
                  </p>
                </div>
              ))}
            </div>

            {/* Required Safety Warning */}
            <div className="rounded-2xl bg-rose-500/10 border border-rose-500/35 p-3.5 flex items-start gap-2.5">
              <AlertTriangle className="w-5 h-5 text-rose-600 dark:text-rose-400 shrink-0 mt-0.5" />
              <p className="text-xs sm:text-sm font-semibold text-rose-800 dark:text-rose-200 leading-relaxed">
                {ds.restoreWarningExact}
              </p>
            </div>

            <div className="grid grid-cols-2 gap-2.5 pt-1">
              <button
                type="button"
                disabled={busyAction === 'restore'}
                onClick={() => setPendingRestore(null)}
                className="py-2.5 px-4 rounded-xl bg-slate-100 dark:bg-[#061026] text-slate-800 dark:text-slate-200 text-sm font-bold min-h-[44px]"
              >
                {ds.cancelBtn}
              </button>
              <button
                type="button"
                disabled={busyAction === 'restore'}
                onClick={() => void handleConfirmRestore()}
                data-testid="confirm-restore-btn"
                className="py-2.5 px-4 rounded-xl bg-yellow-400 hover:bg-yellow-300 disabled:opacity-55 text-[#040D21] text-sm font-bold min-h-[44px]"
              >
                {busyAction === 'restore'
                  ? ds.busyRestoring
                  : ds.confirmRestoreBtn}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Privacy Policy Placeholder Modal */}
      {privacyOpen && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="privacy-modal-title"
          className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-slate-950/60 backdrop-blur-sm"
        >
          <div className="w-full sm:max-w-lg rounded-t-3xl sm:rounded-3xl bg-white dark:bg-[#0B1836] border border-slate-200 dark:border-[#1B315E] p-6 pb-[max(1.5rem,calc(env(safe-area-inset-bottom,0px)+1rem))] space-y-4 shadow-xl max-h-[85dvh] overflow-y-auto">
            <div className="w-10 h-1.5 rounded-full bg-slate-300 dark:bg-slate-700 mx-auto sm:hidden" />
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-2.5">
                <ShieldCheck className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                <h3
                  id="privacy-modal-title"
                  className="text-lg font-bold text-slate-900 dark:text-white"
                >
                  {t.settings.privacyTitle}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setPrivacyOpen(false)}
                aria-label={t.settings.closeBtn}
                className="min-w-[40px] min-h-[40px] rounded-xl flex items-center justify-center text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
              {t.settings.privacyPlaceholderBody}
            </p>

            <div className="pt-2">
              <button
                type="button"
                onClick={() => setPrivacyOpen(false)}
                className="w-full py-2.5 px-4 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-[#040D21] text-sm font-bold transition-colors min-h-[44px]"
              >
                {t.settings.closeBtn}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
