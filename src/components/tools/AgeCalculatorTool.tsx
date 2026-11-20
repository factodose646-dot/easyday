import React, { useMemo, useState } from 'react';
import { Cake, Calendar, RotateCcw } from 'lucide-react';
import { ToolTranslationBundle } from '../../i18n/toolTranslations';
import { Language } from '../../types';
import { AgeResult, calculateExactAge } from '../../utils/ageCalculator';
import { getTodayISO } from '../../utils/storage';

interface AgeCalculatorToolProps {
  language: Language;
  t: ToolTranslationBundle['age'];
}

export const AgeCalculatorTool: React.FC<AgeCalculatorToolProps> = ({
  language,
  t,
}) => {
  const todayISO = useMemo(() => getTodayISO(), []);
  const [dobInput, setDobInput] = useState<string>('');
  const [result, setResult] = useState<AgeResult | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleCalculate = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const res = calculateExactAge(dobInput);
    if (!res.ok) {
      setResult(null);
      setErrorMsg(t.errors[res.errorKey ?? 'invalid']);
      return;
    }
    setErrorMsg(null);
    setResult(res);
  };

  const handleClear = () => {
    setDobInput('');
    setResult(null);
    setErrorMsg(null);
  };

  const formattedNextBirthday = useMemo(() => {
    if (!result?.nextBirthdayDate) return '';
    try {
      return new Intl.DateTimeFormat(language === 'ur' ? 'ur-PK' : 'en-US', {
        weekday: 'short',
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        timeZone: 'UTC',
      }).format(result.nextBirthdayDate);
    } catch {
      return result.nextBirthdayDate.toDateString();
    }
  }, [language, result]);

  return (
    <div className="space-y-5">
      {/* Input Card */}
      <form
        onSubmit={handleCalculate}
        className="rounded-3xl bg-white dark:bg-[#0B1836] border border-slate-200 dark:border-cyan-900/50 p-5 sm:p-6 space-y-4"
      >
        <div className="space-y-2">
          <label
            htmlFor="age-dob-input"
            className="block text-sm font-bold text-slate-900 dark:text-white"
          >
            {t.dobLabel}
          </label>
          <div className="relative">
            <Calendar
              className="w-4 h-4 text-cyan-600 dark:text-cyan-400 absolute top-1/2 -translate-y-1/2 start-3.5 pointer-events-none"
              aria-hidden="true"
            />
            <input
              id="age-dob-input"
              type="date"
              max={todayISO}
              value={dobInput}
              onChange={(e) => {
                setDobInput(e.target.value);
                if (errorMsg) setErrorMsg(null);
              }}
              className="w-full h-12 ps-10 pe-4 rounded-xl bg-slate-50 dark:bg-[#061026] border border-slate-200 dark:border-cyan-900/60 text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-cyan-500"
            />
          </div>
          {errorMsg && (
            <p
              role="alert"
              className="text-xs sm:text-sm font-medium text-red-600 dark:text-red-400"
            >
              {errorMsg}
            </p>
          )}
        </div>

        <div className="flex flex-col sm:flex-row gap-2.5">
          <button
            type="submit"
            className="flex-1 py-3 px-5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-[#040D21] text-sm font-bold transition-colors min-h-[44px] shadow-sm shadow-cyan-500/20"
          >
            {t.calculateBtn}
          </button>
          <button
            type="button"
            onClick={handleClear}
            className="inline-flex items-center justify-center gap-2 py-3 px-5 rounded-xl bg-slate-100 dark:bg-[#0D1E42] hover:bg-slate-200 dark:hover:bg-[#132959] border border-transparent dark:border-cyan-900/40 text-slate-700 dark:text-slate-200 text-sm font-semibold transition-colors min-h-[44px]"
          >
            <RotateCcw className="w-4 h-4" />
            <span>{t.clearBtn}</span>
          </button>
        </div>
      </form>

      {/* Output Results */}
      {result?.ok && (
        <div className="space-y-4">
          {/* Exact Years / Months / Days */}
          <section className="rounded-3xl bg-gradient-to-br from-[#061026] via-[#0B1836] to-[#0E2A47] border border-cyan-500/35 text-white p-5 sm:p-6 space-y-4 shadow-lg shadow-cyan-950/20">
            <h2 className="text-xs font-semibold tracking-wide text-cyan-300 uppercase">
              {t.exactAgeHeading}
            </h2>
            <div className="grid grid-cols-3 gap-3 text-center">
              <div className="rounded-2xl bg-cyan-500/12 border border-cyan-400/25 p-3.5">
                <p className="text-2xl sm:text-3xl font-extrabold text-yellow-400 tabular-nums">
                  {result.years}
                </p>
                <p className="text-xs text-cyan-100 mt-1 font-medium">
                  {t.yearsLabel}
                </p>
              </div>
              <div className="rounded-2xl bg-cyan-500/12 border border-cyan-400/25 p-3.5">
                <p className="text-2xl sm:text-3xl font-extrabold text-cyan-300 tabular-nums">
                  {result.months}
                </p>
                <p className="text-xs text-cyan-100 mt-1 font-medium">
                  {t.monthsLabel}
                </p>
              </div>
              <div className="rounded-2xl bg-cyan-500/12 border border-cyan-400/25 p-3.5">
                <p className="text-2xl sm:text-3xl font-extrabold text-white tabular-nums">
                  {result.days}
                </p>
                <p className="text-xs text-cyan-100 mt-1 font-medium">
                  {t.daysLabel}
                </p>
              </div>
            </div>
          </section>

          {/* Total Months & Total Days */}
          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-2xl bg-white dark:bg-[#0B1836] border border-slate-200 dark:border-cyan-900/50 p-4 sm:p-5">
              <p className="text-xs font-medium text-slate-500 dark:text-slate-400">
                {t.totalMonthsLabel}
              </p>
              <p className="text-2xl font-bold text-slate-900 dark:text-cyan-300 tabular-nums mt-1">
                {result.totalMonths?.toLocaleString('en-US')}
              </p>
            </div>
            <div className="rounded-2xl bg-white dark:bg-[#0B1836] border border-slate-200 dark:border-cyan-900/50 p-4 sm:p-5">
              <p className="text-xs font-medium text-slate-500 dark:text-slate-400">
                {t.totalDaysLabel}
              </p>
              <p className="text-2xl font-bold text-slate-900 dark:text-yellow-400 tabular-nums mt-1">
                {result.totalDays?.toLocaleString('en-US')}
              </p>
            </div>
          </div>

          {/* Next Birthday Countdown */}
          <section className="rounded-2xl bg-white dark:bg-[#0B1836] border border-slate-200 dark:border-cyan-900/50 p-5 flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-yellow-400/15 border border-yellow-400/30 text-amber-600 dark:text-yellow-400 flex items-center justify-center shrink-0">
              <Cake className="w-6 h-6" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-xs font-semibold text-cyan-700 dark:text-cyan-400">
                {t.nextBirthdayLabel}
              </p>
              {result.isBirthdayToday ? (
                <p className="text-sm sm:text-base font-bold text-slate-900 dark:text-white mt-0.5">
                  {t.birthdayToday}
                </p>
              ) : (
                <>
                  <p className="text-base sm:text-lg font-bold text-slate-900 dark:text-white tabular-nums mt-0.5">
                    {result.nextBirthdayDays} {t.daysRemaining}
                  </p>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                    {formattedNextBirthday}
                  </p>
                </>
              )}
            </div>
          </section>
        </div>
      )}
    </div>
  );
};
