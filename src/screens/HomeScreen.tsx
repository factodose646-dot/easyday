import React, { useMemo, useState } from 'react';
import {
  ArrowRight,
  Calendar,
  Languages,
  LayoutGrid,
  Moon,
  Megaphone,
  Search,
  Settings,
  Sun,
  X,
} from 'lucide-react';
import { TOOLS } from '../data/tools';
import { TranslationBundle } from '../i18n/translations';
import { AnnouncementRecord } from '../services/globalAdService';
import { Language, NavTab, Theme, ToolId } from '../types';
import { EasyDayLogo, EasyDayWordmark } from '../components/BrandLogos';
import { ToolIcon } from '../components/ToolIcon';

interface HomeScreenProps {
  language: Language;
  theme: Theme;
  recentToolIds: ToolId[];
  announcement: AnnouncementRecord | null;
  onSelectTool: (id: ToolId) => void;
  onNavigateTab: (tab: NavTab) => void;
  onToggleLanguage: () => void;
  onToggleTheme: () => void;
  t: TranslationBundle;
}

export const HomeScreen: React.FC<HomeScreenProps> = ({
  language,
  theme,
  recentToolIds,
  announcement,
  onSelectTool,
  onNavigateTab,
  onToggleLanguage,
  onToggleTheme,
  t,
}) => {
  const [searchQuery, setSearchQuery] = useState('');

  const greetingText = useMemo(() => {
    const hour = new Date().getHours();
    if (hour < 12) return t.greetings.morning;
    if (hour < 17) return t.greetings.afternoon;
    return t.greetings.evening;
  }, [t]);

  const formattedDate = useMemo(() => {
    try {
      return new Intl.DateTimeFormat(language === 'ur' ? 'ur-PK' : 'en-US', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      }).format(new Date());
    } catch {
      return new Date().toDateString();
    }
  }, [language]);

  const featuredTools = useMemo(() => TOOLS.filter((tool) => tool.featured), []);

  const recentTools = useMemo(() => {
    return recentToolIds
      .map((id) => TOOLS.find((tool) => tool.id === id))
      .filter((item): item is NonNullable<typeof item> => Boolean(item));
  }, [recentToolIds]);

  const filteredTools = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return [];
    return TOOLS.filter((tool) => {
      const copy = t.tools[tool.id];
      return (
        copy.name.toLowerCase().includes(q) ||
        copy.shortDesc.toLowerCase().includes(q) ||
        tool.category.toLowerCase().includes(q)
      );
    });
  }, [searchQuery, t]);

  const isSearching = searchQuery.trim().length > 0;

  return (
    <div className="space-y-6">
      {/* Mobile Top App Bar (hidden on md+ where Navigation Rail provides brand) */}
      <header className="md:hidden flex items-center justify-between gap-3 pt-1">
        <div className="flex items-center gap-2.5 min-w-0">
          <EasyDayLogo className="w-9 h-9 shrink-0" />
          <div className="min-w-0">
            <EasyDayWordmark className="text-xl block leading-none" />
            <span className="text-[11px] font-medium text-teal-700 dark:text-teal-400 block mt-0.5 truncate">
              {t.brand.tagline}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-1.5 shrink-0">
          <button
            type="button"
            onClick={onToggleLanguage}
            aria-label={t.settings.languageLabel}
            className="min-h-[44px] px-3 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
          >
            {language === 'en' ? 'اردو' : 'EN'}
          </button>
          <button
            type="button"
            onClick={onToggleTheme}
            aria-label={t.settings.themeLabel}
            className="min-h-[44px] min-w-[44px] flex items-center justify-center rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-amber-400 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
          >
            {theme === 'light' ? (
              <Moon className="w-4 h-4 text-blue-600" />
            ) : (
              <Sun className="w-4 h-4 text-amber-400" />
            )}
          </button>
        </div>
      </header>

      {/* Hero Greeting & Current Date Card */}
      <section className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#0B6FF2] via-[#0B6FF2] to-[#0D9488] text-white p-5 sm:p-6 shadow-sm">
        <div className="relative z-10 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="space-y-1.5 min-w-0">
            <div className="flex items-center gap-2 text-xs font-medium text-sky-100">
              <Calendar className="w-3.5 h-3.5 shrink-0 text-amber-300" aria-hidden="true" />
              <time className="truncate">{formattedDate}</time>
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-balance">
              {greetingText}
            </h1>
            <p className="text-sm text-sky-100/95 max-w-xl">
              {t.greetings.subtitle}
            </p>
          </div>

          <button
            type="button"
            onClick={() => onNavigateTab('tools')}
            className="self-start sm:self-center shrink-0 inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-900 font-semibold text-sm transition-colors min-h-[44px]"
          >
            <span>{t.dashboard.viewAllTools}</span>
            <ArrowRight className="w-4 h-4 rtl:rotate-180" />
          </button>
        </div>
      </section>

      {/* Interactive Tool Search Bar */}
      <section aria-label={t.dashboard.searchPlaceholder}>
        <div className="relative">
          <Search
            className="w-5 h-5 text-slate-400 dark:text-slate-500 absolute top-1/2 -translate-y-1/2 start-4 pointer-events-none"
            aria-hidden="true"
          />
          <input
            type="search"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={t.dashboard.searchPlaceholder}
            aria-label={t.dashboard.searchPlaceholder}
            className="w-full h-12 ps-12 pe-12 rounded-2xl bg-white dark:bg-[#131C31] border border-slate-200 dark:border-slate-800 text-sm text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent transition-shadow"
          />
          {isSearching && (
            <button
              type="button"
              onClick={() => setSearchQuery('')}
              aria-label={t.dashboard.clearSearch}
              className="absolute top-1/2 -translate-y-1/2 end-1.5 min-w-[40px] min-h-[40px] flex items-center justify-center rounded-xl text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-white"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Live Search Results */}
        {isSearching && (
          <div className="mt-3 rounded-2xl bg-white dark:bg-[#131C31] border border-slate-200 dark:border-slate-800 p-4">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                {t.dashboard.searchResultsTitle} · {filteredTools.length}
              </h2>
            </div>

            {filteredTools.length === 0 ? (
              <div className="py-5 text-center space-y-3">
                <p className="text-sm text-slate-500 dark:text-slate-400">
                  {t.dashboard.noToolsFound}
                </p>
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="px-4 py-2 rounded-xl bg-blue-600 text-white text-xs font-semibold hover:bg-blue-700 transition-colors min-h-[40px]"
                >
                  {t.dashboard.resetSearch}
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
                {filteredTools.map((tool) => {
                  const copy = t.tools[tool.id];
                  return (
                    <button
                      key={tool.id}
                      type="button"
                      onClick={() => onSelectTool(tool.id)}
                      className="flex items-center gap-3 p-3 rounded-xl bg-slate-50 dark:bg-slate-800/70 hover:bg-blue-50 dark:hover:bg-slate-800 text-start transition-colors min-h-[56px]"
                    >
                      <ToolIcon toolId={tool.id} size="sm" />
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-semibold text-slate-900 dark:text-slate-100 truncate">
                          {copy.name}
                        </p>
                        <p className="text-xs text-slate-500 dark:text-slate-400 truncate">
                          {copy.shortDesc}
                        </p>
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </section>

      {/* Featured Tools Section */}
      <section aria-labelledby="featured-tools-heading" className="space-y-3">
        <div className="flex items-center justify-between gap-4">
          <h2
            id="featured-tools-heading"
            className="text-base sm:text-lg font-bold text-slate-900 dark:text-white"
          >
            {t.dashboard.featuredTools}
          </h2>
          <button
            type="button"
            onClick={() => onNavigateTab('tools')}
            className="text-xs sm:text-sm font-semibold text-blue-600 dark:text-sky-400 hover:underline whitespace-nowrap min-h-[40px] px-2 flex items-center gap-1"
          >
            <span>{t.dashboard.viewAllTools}</span>
            <ArrowRight className="w-3.5 h-3.5 rtl:rotate-180" />
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {featuredTools.map((tool) => {
            const copy = t.tools[tool.id];
            return (
              <button
                key={tool.id}
                type="button"
                onClick={() => onSelectTool(tool.id)}
                className="group flex sm:flex-col items-center sm:items-start gap-3.5 sm:gap-3 p-4 rounded-2xl bg-white dark:bg-[#131C31] border border-slate-200/90 dark:border-slate-800 hover:border-blue-400 dark:hover:border-sky-500/70 text-start transition-colors active:scale-[0.99] min-h-[64px]"
              >
                <div className="flex items-center justify-between sm:w-full shrink-0">
                  <ToolIcon toolId={tool.id} size="md" />
                  <ArrowRight className="hidden sm:block w-4 h-4 text-slate-400 group-hover:text-blue-600 dark:group-hover:text-sky-400 rtl:rotate-180 transition-colors" />
                </div>
                <div className="min-w-0 flex-1">
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white truncate">
                    {copy.name}
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 line-clamp-2">
                    {copy.shortDesc}
                  </p>
                </div>
                <ArrowRight className="sm:hidden w-4 h-4 text-slate-400 shrink-0 rtl:rotate-180" />
              </button>
            );
          })}
        </div>
      </section>

      {/* Recently Used Tools Section */}
      <section aria-labelledby="recent-tools-heading" className="space-y-3">
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <h2
            id="recent-tools-heading"
            className="text-base sm:text-lg font-bold text-slate-900 dark:text-white"
          >
            {t.dashboard.recentlyUsed}
          </h2>
          <span className="text-xs text-slate-500 dark:text-slate-400">
            {t.dashboard.recentHint}
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {recentTools.map((tool) => {
            const copy = t.tools[tool.id];
            return (
              <button
                key={tool.id}
                type="button"
                onClick={() => onSelectTool(tool.id)}
                className="flex items-center gap-3 p-3.5 rounded-2xl bg-white dark:bg-[#131C31] border border-slate-200/90 dark:border-slate-800 hover:border-teal-500/70 dark:hover:border-teal-400/60 text-start transition-colors min-h-[56px]"
              >
                <ToolIcon toolId={tool.id} size="sm" />
                <div className="min-w-0">
                  <p className="text-xs sm:text-sm font-semibold text-slate-900 dark:text-slate-100 truncate">
                    {copy.name}
                  </p>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
                    {t.toolsDirectory.categories[tool.category]}
                  </p>
                </div>
              </button>
            );
          })}
        </div>
      </section>

      {/* Live Announcement Banner from settings/announcement */}
      {announcement && (
        <section
          aria-label={t.dashboard.announcementLabel}
          className="rounded-3xl bg-white dark:bg-[#131C31] border border-slate-200/90 dark:border-slate-800 p-5 sm:p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
        >
          <div className="flex items-start gap-3.5 min-w-0">
            <div className="w-11 h-11 rounded-2xl bg-sky-50 dark:bg-sky-950/60 text-[#0B6FF2] dark:text-sky-400 flex items-center justify-center shrink-0">
              <Megaphone className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <p className="text-xs font-semibold text-teal-700 dark:text-teal-400">
                {t.brand.storeName} · {t.dashboard.announcementLabel}
              </p>
              <h2 className="text-base font-bold text-slate-900 dark:text-white mt-0.5">
                {announcement.title}
              </h2>
              {announcement.message && (
                <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 mt-1 leading-relaxed">
                  {announcement.message}
                </p>
              )}
            </div>
          </div>

          {announcement.actionUrl && (
            <a
              href={announcement.actionUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="shrink-0 inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-xs sm:text-sm font-semibold transition-colors min-h-[44px]"
            >
              <span className="whitespace-nowrap">
                {announcement.ctaText || t.dashboard.announcementCtaFallback}
              </span>
              <ArrowRight className="w-4 h-4 rtl:rotate-180" />
            </a>
          )}
        </section>
      )}

      {/* Quick Access Cards */}
      <section aria-labelledby="quick-access-heading" className="space-y-3">
        <h2
          id="quick-access-heading"
          className="text-base sm:text-lg font-bold text-slate-900 dark:text-white"
        >
          {t.dashboard.quickAccess}
        </h2>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <button
            type="button"
            onClick={() => onNavigateTab('tools')}
            className="flex flex-col items-start gap-2.5 p-4 rounded-2xl bg-white dark:bg-[#131C31] border border-slate-200/90 dark:border-slate-800 hover:border-blue-400 dark:hover:border-sky-500 text-start transition-colors min-h-[104px]"
          >
            <span className="w-9 h-9 rounded-xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-sky-400 flex items-center justify-center">
              <LayoutGrid className="w-5 h-5" />
            </span>
            <div>
              <p className="text-sm font-bold text-slate-900 dark:text-white">
                {t.dashboard.quickActions.openToolsTitle}
              </p>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                {t.dashboard.quickActions.openToolsSub}
              </p>
            </div>
          </button>

          <button
            type="button"
            onClick={onToggleLanguage}
            className="flex flex-col items-start gap-2.5 p-4 rounded-2xl bg-white dark:bg-[#131C31] border border-slate-200/90 dark:border-slate-800 hover:border-teal-500 dark:hover:border-teal-400 text-start transition-colors min-h-[104px]"
          >
            <span className="w-9 h-9 rounded-xl bg-teal-50 dark:bg-teal-950/60 text-teal-600 dark:text-teal-400 flex items-center justify-center">
              <Languages className="w-5 h-5" />
            </span>
            <div>
              <p className="text-sm font-bold text-slate-900 dark:text-white">
                {t.dashboard.quickActions.languageTitle}
              </p>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                {t.dashboard.quickActions.languageSub}
              </p>
            </div>
          </button>

          <button
            type="button"
            onClick={onToggleTheme}
            className="flex flex-col items-start gap-2.5 p-4 rounded-2xl bg-white dark:bg-[#131C31] border border-slate-200/90 dark:border-slate-800 hover:border-amber-400 dark:hover:border-amber-400 text-start transition-colors min-h-[104px]"
          >
            <span className="w-9 h-9 rounded-xl bg-amber-50 dark:bg-amber-950/50 text-amber-600 dark:text-amber-400 flex items-center justify-center">
              {theme === 'light' ? (
                <Moon className="w-5 h-5" />
              ) : (
                <Sun className="w-5 h-5" />
              )}
            </span>
            <div>
              <p className="text-sm font-bold text-slate-900 dark:text-white">
                {t.dashboard.quickActions.themeTitle}
              </p>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                {theme === 'light'
                  ? t.dashboard.quickActions.themeLightSub
                  : t.dashboard.quickActions.themeDarkSub}
              </p>
            </div>
          </button>

          <button
            type="button"
            onClick={() => onNavigateTab('settings')}
            className="flex flex-col items-start gap-2.5 p-4 rounded-2xl bg-white dark:bg-[#131C31] border border-slate-200/90 dark:border-slate-800 hover:border-blue-400 dark:hover:border-sky-500 text-start transition-colors min-h-[104px]"
          >
            <span className="w-9 h-9 rounded-xl bg-sky-50 dark:bg-sky-950/60 text-blue-600 dark:text-sky-400 flex items-center justify-center">
              <Settings className="w-5 h-5" />
            </span>
            <div>
              <p className="text-sm font-bold text-slate-900 dark:text-white">
                {t.dashboard.quickActions.settingsTitle}
              </p>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                {t.dashboard.quickActions.settingsSub}
              </p>
            </div>
          </button>
        </div>
      </section>
    </div>
  );
};
