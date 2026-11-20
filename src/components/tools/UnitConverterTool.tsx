import React, { useMemo, useState } from 'react';
import { ArrowLeftRight } from 'lucide-react';
import { ToolTranslationBundle } from '../../i18n/toolTranslations';
import {
  CATEGORY_UNITS,
  ConverterCategory,
  convertUnitValue,
  UnitCode,
} from '../../utils/unitConverter';

interface UnitConverterToolProps {
  t: ToolTranslationBundle['converter'];
}

const CATEGORIES: ConverterCategory[] = [
  'length',
  'weight',
  'temperature',
  'volume',
];

const DEFAULT_PAIRS: Record<ConverterCategory, [UnitCode, UnitCode]> = {
  length: ['m', 'cm'],
  weight: ['kg', 'lb'],
  temperature: ['c', 'f'],
  volume: ['l', 'ml'],
};

export const UnitConverterTool: React.FC<UnitConverterToolProps> = ({ t }) => {
  const [category, setCategory] = useState<ConverterCategory>('length');
  const [rawValue, setRawValue] = useState<string>('1');
  const [fromUnit, setFromUnit] = useState<UnitCode>('m');
  const [toUnit, setToUnit] = useState<UnitCode>('cm');

  const units = CATEGORY_UNITS[category];

  const handleSelectCategory = (nextCat: ConverterCategory) => {
    setCategory(nextCat);
    const [defFrom, defTo] = DEFAULT_PAIRS[nextCat];
    setFromUnit(defFrom);
    setToUnit(defTo);
  };

  const handleSwap = () => {
    setFromUnit(toUnit);
    setToUnit(fromUnit);
  };

  const conversion = useMemo(
    () => convertUnitValue(category, rawValue, fromUnit, toUnit),
    [category, rawValue, fromUnit, toUnit]
  );

  const allCategoryConversions = useMemo(() => {
    return units.map((u) => {
      const res = convertUnitValue(category, rawValue, fromUnit, u.code);
      return {
        unit: u,
        formatted: res.ok && res.formatted ? res.formatted : '—',
      };
    });
  }, [category, fromUnit, rawValue, units]);

  const toSymbol = units.find((u) => u.code === toUnit)?.symbol ?? '';
  const fromSymbol = units.find((u) => u.code === fromUnit)?.symbol ?? '';

  return (
    <div className="space-y-5">
      {/* Category Selector Tabs */}
      <div
        role="tablist"
        aria-label="Unit categories"
        className="flex items-center gap-1.5 overflow-x-auto pb-1"
      >
        {CATEGORIES.map((cat) => {
          const active = category === cat;
          return (
            <button
              key={cat}
              type="button"
              role="tab"
              aria-selected={active}
              onClick={() => handleSelectCategory(cat)}
              className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold whitespace-nowrap shrink-0 min-h-[42px] transition-colors ${
                active
                  ? 'bg-cyan-500 text-[#040D21] font-bold shadow-sm shadow-cyan-500/20'
                  : 'bg-white dark:bg-[#0B1836] text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-cyan-900/50 hover:bg-slate-50 dark:hover:bg-[#102247]'
              }`}
            >
              {t.categories[cat]}
            </button>
          );
        })}
      </div>

      {/* Converter Card */}
      <section className="rounded-3xl bg-white dark:bg-[#0B1836] border border-slate-200 dark:border-cyan-900/50 p-5 sm:p-6 space-y-4">
        <div>
          <label
            htmlFor="converter-value-input"
            className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1.5"
          >
            {t.valueLabel}
          </label>
          <input
            id="converter-value-input"
            type="number"
            step="any"
            value={rawValue}
            onChange={(e) => setRawValue(e.target.value)}
            placeholder={t.valuePlaceholder}
            className="w-full h-12 px-4 rounded-xl bg-slate-50 dark:bg-[#061026] border border-slate-200 dark:border-cyan-900/60 text-lg font-mono tabular-nums text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-cyan-500"
          />
        </div>

        {/* From / Swap / To */}
        <div className="grid grid-cols-1 sm:grid-cols-[1fr_auto_1fr] items-end gap-3">
          <div>
            <label
              htmlFor="converter-from-unit"
              className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1.5"
            >
              {t.fromLabel}
            </label>
            <select
              id="converter-from-unit"
              value={fromUnit}
              onChange={(e) => setFromUnit(e.target.value as UnitCode)}
              className="w-full h-11 px-3 rounded-xl bg-slate-50 dark:bg-[#061026] border border-slate-200 dark:border-cyan-900/60 text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-cyan-500"
            >
              {units.map((u) => (
                <option key={u.code} value={u.code}>
                  {t.units[u.code]}
                </option>
              ))}
            </select>
          </div>

          <button
            type="button"
            onClick={handleSwap}
            aria-label={t.swapLabel}
            className="h-11 px-4 rounded-xl bg-cyan-500/12 dark:bg-cyan-500/15 border border-cyan-500/25 text-cyan-700 dark:text-cyan-300 hover:bg-cyan-500/20 flex items-center justify-center gap-2 text-xs font-semibold transition-colors min-w-[48px]"
          >
            <ArrowLeftRight className="w-4 h-4" />
            <span className="sm:hidden">{t.swapLabel}</span>
          </button>

          <div>
            <label
              htmlFor="converter-to-unit"
              className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1.5"
            >
              {t.toLabel}
            </label>
            <select
              id="converter-to-unit"
              value={toUnit}
              onChange={(e) => setToUnit(e.target.value as UnitCode)}
              className="w-full h-11 px-3 rounded-xl bg-slate-50 dark:bg-[#061026] border border-slate-200 dark:border-cyan-900/60 text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-cyan-500"
            >
              {units.map((u) => (
                <option key={u.code} value={u.code}>
                  {t.units[u.code]}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Instant Result Display */}
        <div className="rounded-2xl bg-gradient-to-br from-[#061026] via-[#0B1836] to-[#0E2A47] border border-cyan-500/35 text-white p-5 space-y-1 shadow-md shadow-cyan-950/20">
          <p className="text-xs font-semibold text-cyan-300">{t.resultLabel}</p>
          {conversion.ok ? (
            <div dir="ltr" className="space-y-1 text-start">
              <p className="text-2xl sm:text-3xl font-extrabold text-yellow-400 font-mono tabular-nums break-all">
                {conversion.formatted} {toSymbol}
              </p>
              <p className="text-xs text-cyan-100 font-mono tabular-nums">
                {rawValue.trim()} {fromSymbol} = {conversion.formatted} {toSymbol}
              </p>
            </div>
          ) : (
            <p className="text-sm font-medium text-yellow-300">
              {t.errors[conversion.errorKey ?? 'invalidNumber']}
            </p>
          )}
        </div>
      </section>

      {/* All Units Quick Comparison */}
      {conversion.ok && (
        <section className="rounded-3xl bg-white dark:bg-[#0B1836] border border-slate-200 dark:border-cyan-900/50 p-5 space-y-3">
          <h2 className="text-sm font-bold text-slate-900 dark:text-white">
            {t.allUnitsTitle}
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            {allCategoryConversions.map(({ unit, formatted }) => (
              <div
                key={unit.code}
                className={`rounded-xl px-3.5 py-2.5 flex items-center justify-between gap-3 border ${
                  unit.code === toUnit
                    ? 'bg-cyan-50/70 dark:bg-cyan-500/15 border-cyan-400 dark:border-cyan-400/50'
                    : 'bg-slate-50 dark:bg-[#061026] border-slate-100 dark:border-cyan-900/40'
                }`}
              >
                <span className="text-xs font-medium text-slate-600 dark:text-slate-300 truncate">
                  {t.units[unit.code]}
                </span>
                <span
                  dir="ltr"
                  className={`text-sm font-bold font-mono tabular-nums shrink-0 ${
                    unit.code === toUnit
                      ? 'text-cyan-700 dark:text-yellow-400'
                      : 'text-slate-900 dark:text-white'
                  }`}
                >
                  {formatted} {unit.symbol}
                </span>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
};
