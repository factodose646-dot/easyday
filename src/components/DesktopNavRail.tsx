import React from 'react';
import {
  Home,
  Languages,
  LayoutGrid,
  Moon,
  Settings,
  Sun,
} from 'lucide-react';
import { Language, NavTab, Theme } from '../types';
import { TranslationBundle } from '../i18n/translations';
import {
  EasyDayLogo,
  EasyDayWordmark,
  ZaidiInteractiveLogo,
} from './BrandLogos';

interface DesktopNavRailProps {
  activeTab: NavTab;
  onSelectTab: (tab: NavTab) => void;
  language: Language;
  onToggleLanguage: () => void;
  theme: Theme;
  onToggleTheme: () => void;
  t: TranslationBundle;
}

const NAV_ITEMS: {
  id: NavTab;
  Icon: React.ComponentType<{ className?: string; strokeWidth?: number }>;
}[] = [
  { id: 'home', Icon: Home },
  { id: 'tools', Icon: LayoutGrid },
  { id: 'settings', Icon: Settings },
];

export const DesktopNavRail: React.FC<DesktopNavRailProps> = ({
  activeTab,
  onSelectTab,
  language,
  onToggleLanguage,
  theme,
  onToggleTheme,
  t,
}) => {
  return (
    <aside
      aria-label="Tablet and Desktop Navigation"
      className="hidden md:flex md:flex-col md:w-64 lg:w-72 shrink-0 bg-white dark:bg-[#07122B] border-e border-slate-200/80 dark:border-[#1B315E] min-h-[100dvh] sticky top-0 h-[100dvh] safe-rail justify-between"
    >
      <div>
        {/* Brand Header */}
        <button
          type="button"
          onClick={() => onSelectTab('home')}
          className="flex items-center gap-3 w-full text-start p-2 rounded-2xl hover:bg-slate-50 dark:hover:bg-[#0E1E44] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400"
        >
          <EasyDayLogo className="w-10 h-10 shrink-0" />
          <div className="min-w-0">
            <EasyDayWordmark className="text-xl block leading-tight" />
            <span className="text-xs text-cyan-700 dark:text-cyan-300 block truncate">
              {t.brand.tagline}
            </span>
          </div>
        </button>

        {/* Primary 3 Destinations */}
        <nav className="mt-7 space-y-1.5">
          {NAV_ITEMS.map(({ id, Icon }) => {
            const isActive = activeTab === id;
            return (
              <button
                key={id}
                type="button"
                onClick={() => onSelectTab(id)}
                aria-current={isActive ? 'page' : undefined}
                className={`w-full flex items-center gap-3.5 px-4 py-3 rounded-2xl text-sm transition-colors duration-150 min-h-[46px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400 ${
                  isActive
                    ? 'bg-cyan-500 text-[#040D21] font-bold shadow-sm'
                    : 'text-slate-600 dark:text-slate-300 font-medium hover:bg-slate-100 dark:hover:bg-[#0E1E44] hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                <Icon
                  className="w-5 h-5 shrink-0"
                  strokeWidth={isActive ? 2.4 : 1.9}
                />
                <span className="whitespace-nowrap truncate">{t.nav[id]}</span>
              </button>
            );
          })}
        </nav>
      </div>

      {/* Quick Environment Controls + Developer Lockup */}
      <div className="space-y-4 pt-4 border-t border-slate-200/80 dark:border-[#1B315E]">
        <div className="grid grid-cols-2 gap-2">
          <button
            type="button"
            onClick={onToggleLanguage}
            className="flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl bg-slate-100 dark:bg-[#0B1836] hover:bg-slate-200/80 dark:hover:bg-[#13264F] border border-transparent dark:border-[#1B315E] text-slate-800 dark:text-slate-200 text-xs font-semibold transition-colors min-h-[44px]"
          >
            <Languages className="w-4 h-4 text-cyan-600 dark:text-cyan-400 shrink-0" />
            <span className="whitespace-nowrap">
              {language === 'en' ? 'اردو' : 'English'}
            </span>
          </button>

          <button
            type="button"
            onClick={onToggleTheme}
            aria-label={t.settings.themeLabel}
            className="flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl bg-slate-100 dark:bg-[#0B1836] hover:bg-slate-200/80 dark:hover:bg-[#13264F] border border-transparent dark:border-[#1B315E] text-slate-800 dark:text-slate-200 text-xs font-semibold transition-colors min-h-[44px]"
          >
            {theme === 'light' ? (
              <>
                <Moon className="w-4 h-4 text-cyan-700 shrink-0" />
                <span className="whitespace-nowrap">{t.settings.darkTheme}</span>
              </>
            ) : (
              <>
                <Sun className="w-4 h-4 text-yellow-400 shrink-0" />
                <span className="whitespace-nowrap">{t.settings.lightTheme}</span>
              </>
            )}
          </button>
        </div>

        <div className="flex items-center gap-2.5 px-2 py-1">
          <ZaidiInteractiveLogo className="w-7 h-7 shrink-0" />
          <div className="min-w-0">
            <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-tight truncate">
              {t.brand.developerLabel}
            </p>
            <p className="text-xs font-bold text-slate-800 dark:text-yellow-300 tracking-tight truncate">
              {t.brand.developerName}
            </p>
          </div>
        </div>
      </div>
    </aside>
  );
};
