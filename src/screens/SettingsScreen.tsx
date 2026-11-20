import React, { useState } from 'react';
import {
  ChevronRight,
  Info,
  Languages,
  Lock,
  Moon,
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

interface SettingsScreenProps {
  language: Language;
  theme: Theme;
  onChangeLanguage: (lang: Language) => void;
  onChangeTheme: (theme: Theme) => void;
  onOpenSplashPreview: () => void;
  onOpenAdminPanel: () => void;
  t: TranslationBundle;
}

export const SettingsScreen: React.FC<SettingsScreenProps> = ({
  language,
  theme,
  onChangeLanguage,
  onChangeTheme,
  onOpenSplashPreview,
  onOpenAdminPanel,
  t,
}) => {
  const [privacyOpen, setPrivacyOpen] = useState(false);

  return (
    <div className="space-y-6 max-w-3xl">
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
