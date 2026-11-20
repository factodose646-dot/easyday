import React, { useMemo, useState } from 'react';
import { ArrowRight, Search, X } from 'lucide-react';
import { TOOLS } from '../data/tools';
import { TranslationBundle } from '../i18n/translations';
import { ToolCategory, ToolId } from '../types';
import { ToolIcon } from '../components/ToolIcon';

interface ToolsScreenProps {
  onSelectTool: (id: ToolId) => void;
  t: TranslationBundle;
}

const CATEGORIES: ToolCategory[] = ['all', 'utilities', 'productivity', 'finance'];

export const ToolsScreen: React.FC<ToolsScreenProps> = ({ onSelectTool, t }) => {
  const [selectedCategory, setSelectedCategory] = useState<ToolCategory>('all');
  const [query, setQuery] = useState('');

  const filteredTools = useMemo(() => {
    const q = query.trim().toLowerCase();
    return TOOLS.filter((tool) => {
      const matchesCategory =
        selectedCategory === 'all' || tool.category === selectedCategory;
      if (!matchesCategory) return false;
      if (!q) return true;
      const copy = t.tools[tool.id];
      return (
        copy.name.toLowerCase().includes(q) ||
        copy.shortDesc.toLowerCase().includes(q)
      );
    });
  }, [selectedCategory, query, t]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <header className="space-y-1">
        <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white tracking-tight">
          {t.toolsDirectory.title}
        </h1>
        <p className="text-sm text-slate-600 dark:text-slate-400">
          {t.toolsDirectory.subtitle}
        </p>
      </header>

      {/* Search & Functional Category Tabs */}
      <div className="space-y-3">
        <div className="relative">
          <Search
            className="w-5 h-5 text-slate-400 dark:text-cyan-400/70 absolute top-1/2 -translate-y-1/2 start-4 pointer-events-none"
            aria-hidden="true"
          />
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={t.toolsDirectory.searchPlaceholder}
            aria-label={t.toolsDirectory.searchPlaceholder}
            className="w-full h-12 ps-12 pe-12 rounded-2xl bg-white dark:bg-[#0B1836] border border-slate-200 dark:border-[#1B315E] text-sm text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-cyan-400 focus:border-transparent"
          />
          {query && (
            <button
              type="button"
              onClick={() => setQuery('')}
              aria-label={t.dashboard.clearSearch}
              className="absolute top-1/2 -translate-y-1/2 end-1.5 min-w-[40px] min-h-[40px] flex items-center justify-center rounded-xl text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-white"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        <div
          role="tablist"
          aria-label={t.toolsDirectory.title}
          className="flex items-center gap-1.5 overflow-x-auto pb-1"
        >
          {CATEGORIES.map((category) => {
            const active = selectedCategory === category;
            return (
              <button
                key={category}
                type="button"
                role="tab"
                aria-selected={active}
                onClick={() => setSelectedCategory(category)}
                className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold whitespace-nowrap shrink-0 min-h-[40px] transition-colors ${
                  active
                    ? 'bg-cyan-500 text-[#040D21]'
                    : 'bg-white dark:bg-[#0B1836] text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-[#1B315E] hover:bg-slate-50 dark:hover:bg-[#11244D]'
                }`}
              >
                {t.toolsDirectory.categories[category]}
              </button>
            );
          })}
        </div>
      </div>

      {/* Active Tool Cards Grid */}
      {filteredTools.length === 0 ? (
        <div className="rounded-2xl bg-white dark:bg-[#0B1836] border border-slate-200 dark:border-[#1B315E] p-8 text-center space-y-3">
          <p className="text-sm text-slate-600 dark:text-slate-400">
            {t.dashboard.noToolsFound}
          </p>
          <button
            type="button"
            onClick={() => {
              setQuery('');
              setSelectedCategory('all');
            }}
            className="px-4 py-2.5 rounded-xl bg-cyan-500 text-[#040D21] text-xs font-bold hover:bg-cyan-400 transition-colors min-h-[44px]"
          >
            {t.dashboard.resetSearch}
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredTools.map((tool) => {
            const copy = t.tools[tool.id];
            return (
              <button
                key={tool.id}
                type="button"
                onClick={() => onSelectTool(tool.id)}
                className="group flex flex-col justify-between p-5 rounded-3xl bg-white dark:bg-[#0B1836] border border-slate-200/90 dark:border-[#1B315E] hover:border-cyan-500 dark:hover:border-cyan-400/80 text-start transition-colors active:scale-[0.99] min-h-[156px]"
              >
                <div className="flex items-start justify-between gap-3 w-full">
                  <ToolIcon toolId={tool.id} size="md" />
                  <span className="text-xs font-semibold text-slate-400 dark:text-slate-400">
                    {t.toolsDirectory.categories[tool.category]}
                  </span>
                </div>

                <div className="mt-4 space-y-1">
                  <h2 className="text-base font-bold text-slate-900 dark:text-white group-hover:text-cyan-700 dark:group-hover:text-cyan-300 transition-colors">
                    {copy.name}
                  </h2>
                  <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                    {copy.shortDesc}
                  </p>
                </div>

                <div className="mt-4 pt-3 border-t border-slate-100 dark:border-[#1B315E] flex items-center justify-between w-full text-xs">
                  <span className="font-semibold text-amber-600 dark:text-yellow-300">
                    {t.toolsDirectory.phaseLabel}
                  </span>
                  <span className="inline-flex items-center gap-1 font-bold text-cyan-700 dark:text-cyan-300">
                    <span>{t.toolsDirectory.openTool}</span>
                    <ArrowRight className="w-3.5 h-3.5 rtl:rotate-180" />
                  </span>
                </div>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
};
