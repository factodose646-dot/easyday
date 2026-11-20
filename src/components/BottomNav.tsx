import React from 'react';
import { Home, LayoutGrid, Settings } from 'lucide-react';
import { NavTab } from '../types';
import { TranslationBundle } from '../i18n/translations';

interface BottomNavProps {
  activeTab: NavTab;
  onSelectTab: (tab: NavTab) => void;
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

export const BottomNav: React.FC<BottomNavProps> = ({
  activeTab,
  onSelectTab,
  t,
}) => {
  return (
    <nav
      aria-label="Primary Bottom Navigation"
      className="md:hidden fixed bottom-0 inset-x-0 z-40 bg-white/95 dark:bg-[#0F172A]/95 backdrop-blur-md border-t border-slate-200/90 dark:border-slate-800 pb-safe"
    >
      <div className="grid grid-cols-3 min-h-[4rem] items-center max-w-lg mx-auto px-1 pt-1">
        {NAV_ITEMS.map(({ id, Icon }) => {
          const isActive = activeTab === id;
          return (
            <button
              key={id}
              type="button"
              onClick={() => onSelectTab(id)}
              aria-current={isActive ? 'page' : undefined}
              className={`relative flex flex-col items-center justify-center min-h-[44px] min-w-[44px] py-1.5 rounded-xl transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 ${
                isActive
                  ? 'text-blue-600 dark:text-sky-400'
                  : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
              }`}
            >
              <span
                className={`flex items-center justify-center w-12 h-7 rounded-full transition-colors duration-150 ${
                  isActive
                    ? 'bg-blue-600/12 dark:bg-sky-400/15'
                    : 'bg-transparent'
                }`}
              >
                <Icon className="w-[21px] h-[21px]" strokeWidth={isActive ? 2.4 : 1.9} />
              </span>
              <span
                className={`text-[11px] leading-tight mt-0.5 whitespace-nowrap truncate max-w-full px-1 ${
                  isActive ? 'font-semibold' : 'font-medium'
                }`}
              >
                {t.nav[id]}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
};
