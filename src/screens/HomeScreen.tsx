import React, { useEffect, useMemo, useState } from 'react';
import {
  AlertTriangle,
  ArrowDownLeft,
  ArrowRight,
  ArrowUpRight,
  BellRing,
  CalendarClock,
  Clock,
  HandCoins,
  Megaphone,
  Moon,
  NotebookPen,
  Plus,
  ReceiptText,
  Sun,
} from 'lucide-react';
import { TOOLS } from '../data/tools';
import { TranslationBundle } from '../i18n/translations';
import { AnnouncementRecord } from '../services/globalAdService';
import { Language, NavTab, Theme, ToolId } from '../types';
import { EasyDayLogo, EasyDayWordmark } from '../components/BrandLogos';
import { ToolIcon } from '../components/ToolIcon';
import {
  computeUnifiedFinancialSummary,
  FINANCE_UPDATED_EVENT,
} from '../utils/financeSync';
import { getTodayISO } from '../utils/storage';
import { formatPKR } from '../utils/udhaarEngine';
import { QuickAddKind } from './ToolDetailScreen';

interface HomeScreenProps {
  language: Language;
  theme: Theme;
  announcement: AnnouncementRecord | null;
  onSelectTool: (id: ToolId) => void;
  onQuickAdd: (kind: QuickAddKind) => void;
  onNavigateTab: (tab: NavTab) => void;
  onToggleLanguage: () => void;
  onToggleTheme: () => void;
  t: TranslationBundle;
}

export const HomeScreen: React.FC<HomeScreenProps> = ({
  language,
  theme,
  announcement,
  onSelectTool,
  onQuickAdd,
  onNavigateTab,
  onToggleLanguage,
  onToggleTheme,
  t,
}) => {
  const [financeVersion, setFinanceVersion] = useState(0);

  useEffect(() => {
    const onFinanceUpdated = () => setFinanceVersion((v) => v + 1);
    window.addEventListener(FINANCE_UPDATED_EVENT, onFinanceUpdated);
    window.addEventListener('storage', onFinanceUpdated);
    return () => {
      window.removeEventListener(FINANCE_UPDATED_EVENT, onFinanceUpdated);
      window.removeEventListener('storage', onFinanceUpdated);
    };
  }, []);

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
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      }).format(new Date());
    } catch {
      return new Date().toDateString();
    }
  }, [language]);

  const summary = useMemo(() => {
    void financeVersion;
    return computeUnifiedFinancialSummary(getTodayISO());
  }, [financeVersion]);

  const formatBillsCount = (count: number) =>
    `${count} ${
      count === 1
        ? t.dashboard.todaySummary.billSingularLabel
        : t.dashboard.todaySummary.billsCountLabel
    }`;

  return (
    <div className="space-y-4 sm:space-y-5">
      {/* 1. Compact Home Header: Branding, Greeting, Current Date & Language Switcher */}
      <header className="space-y-2.5 pt-0.5">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5 min-w-0">
            <EasyDayLogo className="w-8 h-8 shrink-0" />
            <EasyDayWordmark className="text-xl leading-none whitespace-nowrap" />
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            <button
              type="button"
              data-testid="home-language-toggle"
              onClick={onToggleLanguage}
              aria-label={t.settings.languageLabel}
              className="min-h-[44px] px-3 rounded-xl bg-white dark:bg-[#0B1836] border border-slate-200 dark:border-[#1B315E] text-xs font-bold text-slate-700 dark:text-cyan-300 hover:bg-slate-50 dark:hover:bg-[#11244D] transition-colors whitespace-nowrap shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400"
            >
              {language === 'en' ? 'اردو' : 'EN'}
            </button>
            <button
              type="button"
              data-testid="home-theme-toggle"
              onClick={onToggleTheme}
              aria-label={t.settings.themeLabel}
              className="min-h-[44px] min-w-[44px] flex items-center justify-center rounded-xl bg-white dark:bg-[#0B1836] border border-slate-200 dark:border-[#1B315E] text-slate-700 dark:text-yellow-400 hover:bg-slate-50 dark:hover:bg-[#11244D] transition-colors shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400"
            >
              {theme === 'light' ? (
                <Moon className="w-4 h-4 text-cyan-700" />
              ) : (
                <Sun className="w-4 h-4 text-yellow-400" />
              )}
            </button>
          </div>
        </div>

        <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-0.5">
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 dark:text-white text-balance">
            {greetingText}
          </h1>
          <time className="text-xs sm:text-sm font-medium text-slate-500 dark:text-slate-400">
            {formattedDate}
          </time>
        </div>
      </header>

      {/* 2. Today's Financial Summary (Above-the-Fold Daily Snapshot, Zero Double-Counting) */}
      <section
        aria-labelledby="today-summary-heading"
        data-testid="home-today-summary"
        className="rounded-2xl bg-[#071535] border border-[#1B356E] text-white p-4 sm:p-5 shadow-sm space-y-3"
      >
        <div className="flex items-center justify-between gap-2">
          <h2
            id="today-summary-heading"
            className="text-sm sm:text-base font-bold tracking-tight text-white"
          >
            {t.dashboard.todaySummary.title}
          </h2>
          <span className="text-xs font-medium text-cyan-200/80 tabular-nums">
            {getTodayISO()}
          </span>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-3 gap-2.5">
          {/* Today's Expenses */}
          <button
            type="button"
            data-testid="summary-today-expenses"
            onClick={() => onSelectTool('expense-tracker')}
            className="text-start rounded-xl bg-[#0B204B] border border-[#1B356E] hover:border-yellow-400/70 p-3 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400"
          >
            <p className="text-[11px] font-medium text-cyan-200 leading-snug">
              {t.dashboard.todaySummary.todayExpenses}
            </p>
            <p className="text-base sm:text-lg font-extrabold tabular-nums text-white mt-1 break-words">
              {formatPKR(summary.todayExpenses)}
            </p>
          </button>

          {/* Money to Receive (Lena Hai) */}
          <button
            type="button"
            data-testid="summary-to-receive"
            onClick={() => onSelectTool('udhaar-manager')}
            className="text-start rounded-xl bg-[#0B204B] border border-cyan-500/35 hover:border-cyan-400 p-3 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400"
          >
            <div className="flex items-center gap-1 text-[11px] font-medium text-cyan-300 leading-snug">
              <ArrowDownLeft className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
              <span>{t.dashboard.todaySummary.toReceive}</span>
            </div>
            <p className="text-base sm:text-lg font-extrabold tabular-nums text-cyan-300 mt-1 break-words">
              {formatPKR(summary.totalMoneyToReceive)}
            </p>
          </button>

          {/* Money to Pay (Dena Hai) */}
          <button
            type="button"
            data-testid="summary-to-pay"
            onClick={() => onSelectTool('udhaar-manager')}
            className="text-start rounded-xl bg-[#0B204B] border border-yellow-400/35 hover:border-yellow-400 p-3 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400"
          >
            <div className="flex items-center gap-1 text-[11px] font-medium text-yellow-200 leading-snug">
              <ArrowUpRight className="w-3.5 h-3.5 shrink-0 text-yellow-400" aria-hidden="true" />
              <span>{t.dashboard.todaySummary.toPay}</span>
            </div>
            <p className="text-base sm:text-lg font-extrabold tabular-nums text-yellow-300 mt-1 break-words">
              {formatPKR(summary.totalMoneyToPay)}
            </p>
          </button>

          {/* Bills Due Today (Visually distinguishable Amber/Gold Alert state) */}
          <button
            type="button"
            data-testid="summary-bills-due-today"
            onClick={() => onSelectTool('bills-reminder')}
            className={`text-start rounded-xl p-3 border transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400 ${
              summary.billsDueTodayCount > 0
                ? 'bg-yellow-400/15 border-yellow-400/65 hover:border-yellow-300'
                : 'bg-[#0B204B] border-[#1B356E] hover:border-yellow-400/50'
            }`}
          >
            <div className="flex items-center justify-between gap-1 text-[11px] font-semibold leading-snug">
              <span className="inline-flex items-center gap-1 text-yellow-300">
                <Clock className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
                <span>{t.dashboard.todaySummary.dueTodayBills}</span>
              </span>
              <span className="tabular-nums text-yellow-200">
                {formatBillsCount(summary.billsDueTodayCount)}
              </span>
            </div>
            <p className="text-base sm:text-lg font-extrabold tabular-nums text-white mt-1 break-words">
              {formatPKR(summary.billsDueTodayAmount)}
            </p>
          </button>

          {/* Overdue Bills (Visually distinct Rose Alert state) */}
          <button
            type="button"
            data-testid="summary-bills-overdue"
            onClick={() => onSelectTool('bills-reminder')}
            className={`text-start rounded-xl p-3 border transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400 ${
              summary.overdueBillsCount > 0
                ? 'bg-rose-500/20 border-rose-400/75 hover:border-rose-300'
                : 'bg-[#0B204B] border-[#1B356E] hover:border-rose-400/50'
            }`}
          >
            <div className="flex items-center justify-between gap-1 text-[11px] font-semibold leading-snug">
              <span
                className={`inline-flex items-center gap-1 ${
                  summary.overdueBillsCount > 0 ? 'text-rose-200' : 'text-slate-300'
                }`}
              >
                <AlertTriangle className="w-3.5 h-3.5 shrink-0 text-rose-400" aria-hidden="true" />
                <span>{t.dashboard.todaySummary.overdueBills}</span>
              </span>
              <span
                className={`tabular-nums ${
                  summary.overdueBillsCount > 0 ? 'text-rose-200' : 'text-slate-400'
                }`}
              >
                {formatBillsCount(summary.overdueBillsCount)}
              </span>
            </div>
            <p
              className={`text-base sm:text-lg font-extrabold tabular-nums mt-1 break-words ${
                summary.overdueBillsCount > 0 ? 'text-rose-100' : 'text-white'
              }`}
            >
              {formatPKR(summary.overdueBillsAmount)}
            </p>
          </button>

          {/* Upcoming Bills */}
          <button
            type="button"
            data-testid="summary-bills-upcoming"
            onClick={() => onSelectTool('bills-reminder')}
            className="text-start rounded-xl bg-[#0B204B] border border-[#1B356E] hover:border-cyan-400/70 p-3 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400"
          >
            <div className="flex items-center justify-between gap-1 text-[11px] font-medium text-cyan-200 leading-snug">
              <span className="inline-flex items-center gap-1">
                <CalendarClock className="w-3.5 h-3.5 shrink-0 text-cyan-300" aria-hidden="true" />
                <span>{t.dashboard.todaySummary.upcomingBills}</span>
              </span>
              <span className="tabular-nums text-cyan-200/85">
                {formatBillsCount(summary.futureUpcomingBillsCount)}
              </span>
            </div>
            <p className="text-base sm:text-lg font-extrabold tabular-nums text-white mt-1 break-words">
              {formatPKR(summary.futureUpcomingBillsAmount)}
            </p>
          </button>
        </div>
      </section>

      {/* 3. Quick Add Section (3 Prominent Buttons opening existing add forms) */}
      <section aria-labelledby="quick-add-heading" className="space-y-2">
        <h2
          id="quick-add-heading"
          className="text-sm font-bold text-slate-800 dark:text-slate-200"
        >
          {t.dashboard.quickAdd.heading}
        </h2>

        <div className="grid grid-cols-3 gap-2.5">
          <button
            type="button"
            data-testid="quick-add-expense-btn"
            onClick={() => onQuickAdd('expense')}
            className="flex flex-col sm:flex-row items-center justify-center gap-1.5 sm:gap-2 p-2.5 sm:px-4 rounded-2xl bg-yellow-400 hover:bg-yellow-300 text-[#040D21] font-bold text-xs sm:text-sm min-h-[54px] shadow-sm transition-colors active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400"
          >
            <span className="inline-flex items-center gap-0.5 shrink-0">
              <Plus className="w-3.5 h-3.5" strokeWidth={2.6} />
              <ReceiptText className="w-4 h-4" strokeWidth={2.2} />
            </span>
            <span className="text-center leading-tight">
              {t.dashboard.quickAdd.addExpense}
            </span>
          </button>

          <button
            type="button"
            data-testid="quick-add-udhaar-btn"
            onClick={() => onQuickAdd('udhaar')}
            className="flex flex-col sm:flex-row items-center justify-center gap-1.5 sm:gap-2 p-2.5 sm:px-4 rounded-2xl bg-cyan-500 hover:bg-cyan-400 text-[#040D21] font-bold text-xs sm:text-sm min-h-[54px] shadow-sm transition-colors active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-yellow-400"
          >
            <span className="inline-flex items-center gap-0.5 shrink-0">
              <Plus className="w-3.5 h-3.5" strokeWidth={2.6} />
              <HandCoins className="w-4 h-4" strokeWidth={2.2} />
            </span>
            <span className="text-center leading-tight">
              {t.dashboard.quickAdd.addUdhaar}
            </span>
          </button>

          <button
            type="button"
            data-testid="quick-add-note-btn"
            onClick={() => onQuickAdd('note')}
            className="flex flex-col sm:flex-row items-center justify-center gap-1.5 sm:gap-2 p-2.5 sm:px-4 rounded-2xl bg-white dark:bg-[#0B1836] border border-slate-200 dark:border-[#1B315E] hover:border-cyan-500 dark:hover:border-cyan-400 text-slate-900 dark:text-white font-bold text-xs sm:text-sm min-h-[54px] shadow-sm transition-colors active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400"
          >
            <span className="inline-flex items-center gap-0.5 shrink-0 text-amber-600 dark:text-yellow-400">
              <Plus className="w-3.5 h-3.5" strokeWidth={2.6} />
              <NotebookPen className="w-4 h-4" strokeWidth={2.2} />
            </span>
            <span className="text-center leading-tight">
              {t.dashboard.quickAdd.addNote}
            </span>
          </button>
        </div>
      </section>

      {/* 4. Compact Financial Overview Cards (No Truncation, Two-Line Amounts, Tappable) */}
      <section aria-labelledby="financial-overview-heading" className="space-y-2.5">
        <h2
          id="financial-overview-heading"
          className="text-sm sm:text-base font-bold text-slate-900 dark:text-white"
        >
          {t.dashboard.overview.heading}
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {/* Udhaar Overview Card */}
          <button
            type="button"
            data-testid="overview-udhaar-card"
            onClick={() => onSelectTool('udhaar-manager')}
            className="text-start rounded-2xl bg-white dark:bg-[#0B1836] border border-slate-200/90 dark:border-[#1B315E] hover:border-cyan-500 dark:hover:border-cyan-400 p-4 flex flex-col justify-between gap-3 shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400"
          >
            <div className="flex items-center justify-between gap-2 w-full">
              <div className="flex items-center gap-2 min-w-0">
                <span className="w-8 h-8 rounded-xl bg-cyan-500/15 text-cyan-700 dark:text-cyan-300 flex items-center justify-center shrink-0">
                  <HandCoins className="w-4 h-4" />
                </span>
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                  {t.dashboard.overview.udhaarTitle}
                </h3>
              </div>
              <ArrowRight className="w-4 h-4 text-slate-400 dark:text-cyan-300 shrink-0 rtl:rotate-180" />
            </div>

            <div className="grid grid-cols-2 gap-3 w-full pt-1">
              <div className="min-w-0">
                <p className="text-[11px] font-medium text-slate-500 dark:text-slate-400">
                  {t.dashboard.overview.udhaarToReceive}
                </p>
                <p className="text-base font-extrabold tabular-nums text-cyan-700 dark:text-cyan-300 mt-0.5 break-words">
                  {formatPKR(summary.totalMoneyToReceive)}
                </p>
              </div>
              <div className="min-w-0">
                <p className="text-[11px] font-medium text-slate-500 dark:text-slate-400">
                  {t.dashboard.overview.udhaarToPay}
                </p>
                <p className="text-base font-extrabold tabular-nums text-amber-700 dark:text-yellow-300 mt-0.5 break-words">
                  {formatPKR(summary.totalMoneyToPay)}
                </p>
              </div>
            </div>

            <p className="text-xs text-slate-500 dark:text-slate-400 pt-2 border-t border-slate-100 dark:border-[#1B315E] w-full tabular-nums">
              {summary.activeUdhaarCount} {t.dashboard.overview.udhaarActiveMeta}
            </p>
          </button>

          {/* Bills Overview Card */}
          <button
            type="button"
            data-testid="overview-bills-card"
            onClick={() => onSelectTool('bills-reminder')}
            className="text-start rounded-2xl bg-white dark:bg-[#0B1836] border border-slate-200/90 dark:border-[#1B315E] hover:border-yellow-400 p-4 flex flex-col justify-between gap-3 shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400"
          >
            <div className="flex items-center justify-between gap-2 w-full">
              <div className="flex items-center gap-2 min-w-0">
                <span className="w-8 h-8 rounded-xl bg-yellow-400/20 text-amber-700 dark:text-yellow-300 flex items-center justify-center shrink-0">
                  <BellRing className="w-4 h-4" />
                </span>
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                  {t.dashboard.overview.billsTitle}
                </h3>
              </div>
              <ArrowRight className="w-4 h-4 text-slate-400 dark:text-yellow-300 shrink-0 rtl:rotate-180" />
            </div>

            <div className="space-y-2 w-full pt-0.5">
              <div className="flex flex-wrap items-baseline justify-between gap-x-2 gap-y-0.5">
                <span className="text-xs text-slate-600 dark:text-slate-300">
                  {t.dashboard.overview.billsPaid} ({summary.paidBillsThisMonthCount})
                </span>
                <span className="text-sm font-bold tabular-nums text-emerald-700 dark:text-emerald-300 break-words">
                  {formatPKR(summary.paidBillsThisMonthAmount)}
                </span>
              </div>

              <div className="flex flex-wrap items-baseline justify-between gap-x-2 gap-y-0.5">
                <span className="text-xs text-slate-600 dark:text-slate-300">
                  {t.dashboard.overview.billsUnpaid} ({summary.unpaidBillsCount})
                </span>
                <span className="text-sm font-bold tabular-nums text-slate-900 dark:text-white break-words">
                  {formatPKR(summary.totalOutstandingBills)}
                </span>
              </div>

              <div className="flex flex-wrap items-baseline justify-between gap-x-2 gap-y-0.5">
                <span
                  className={`text-xs font-semibold ${
                    summary.overdueBillsCount > 0
                      ? 'text-rose-600 dark:text-rose-400'
                      : 'text-slate-500 dark:text-slate-400'
                  }`}
                >
                  {t.dashboard.overview.billsOverdue} ({summary.overdueBillsCount})
                </span>
                <span
                  className={`text-sm font-extrabold tabular-nums break-words ${
                    summary.overdueBillsCount > 0
                      ? 'text-rose-600 dark:text-rose-400'
                      : 'text-slate-700 dark:text-slate-300'
                  }`}
                >
                  {formatPKR(summary.overdueBillsAmount)}
                </span>
              </div>
            </div>
          </button>

          {/* Expenses Overview Card */}
          <button
            type="button"
            data-testid="overview-expenses-card"
            onClick={() => onSelectTool('expense-tracker')}
            className="text-start rounded-2xl bg-white dark:bg-[#0B1836] border border-slate-200/90 dark:border-[#1B315E] hover:border-cyan-500 dark:hover:border-cyan-400 p-4 flex flex-col justify-between gap-3 shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400"
          >
            <div className="flex items-center justify-between gap-2 w-full">
              <div className="flex items-center gap-2 min-w-0">
                <span className="w-8 h-8 rounded-xl bg-orange-500/15 text-orange-600 dark:text-yellow-300 flex items-center justify-center shrink-0">
                  <ReceiptText className="w-4 h-4" />
                </span>
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                  {t.dashboard.overview.expensesTitle}
                </h3>
              </div>
              <ArrowRight className="w-4 h-4 text-slate-400 dark:text-cyan-300 shrink-0 rtl:rotate-180" />
            </div>

            <div className="grid grid-cols-2 gap-3 w-full pt-1">
              <div className="min-w-0">
                <p className="text-[11px] font-medium text-slate-500 dark:text-slate-400">
                  {t.dashboard.overview.expensesToday}
                </p>
                <p className="text-base font-extrabold tabular-nums text-slate-900 dark:text-white mt-0.5 break-words">
                  {formatPKR(summary.todayExpenses)}
                </p>
              </div>
              <div className="min-w-0">
                <p className="text-[11px] font-medium text-slate-500 dark:text-slate-400">
                  {t.dashboard.overview.expensesMonthly}
                </p>
                <p className="text-base font-extrabold tabular-nums text-amber-700 dark:text-yellow-300 mt-0.5 break-words">
                  {formatPKR(summary.monthlyExpenses)}
                </p>
              </div>
            </div>

            <p className="text-xs text-slate-500 dark:text-slate-400 pt-2 border-t border-slate-100 dark:border-[#1B315E] w-full tabular-nums">
              {t.dashboard.financialSummary.paidBillsHint}{' '}
              {formatPKR(summary.paidBillsTotal)}
            </p>
          </button>
        </div>
      </section>

      {/* 5. Compact Two-Column Tools Grid (All 5 Existing Tools) */}
      <section aria-labelledby="home-tools-grid-heading" className="space-y-2.5">
        <div className="flex items-center justify-between gap-3">
          <h2
            id="home-tools-grid-heading"
            className="text-sm sm:text-base font-bold text-slate-900 dark:text-white"
          >
            {t.dashboard.toolsGrid.heading}
          </h2>
          <button
            type="button"
            onClick={() => onNavigateTab('tools')}
            className="text-xs font-bold text-cyan-700 dark:text-cyan-300 hover:underline inline-flex items-center gap-1 min-h-[36px] px-1.5 whitespace-nowrap"
          >
            <span>{t.dashboard.toolsGrid.viewDirectory}</span>
            <ArrowRight className="w-3.5 h-3.5 rtl:rotate-180" />
          </button>
        </div>

        <div
          data-testid="home-tools-grid"
          className="grid grid-cols-2 sm:grid-cols-3 gap-2.5"
        >
          {TOOLS.map((tool, index) => {
            const copy = t.tools[tool.id];
            const isLastOddMobile =
              index === TOOLS.length - 1 && TOOLS.length % 2 === 1;
            return (
              <button
                key={tool.id}
                type="button"
                data-testid={`home-tool-card-${tool.id}`}
                onClick={() => onSelectTool(tool.id)}
                className={`flex items-center gap-3 p-3.5 rounded-2xl bg-white dark:bg-[#0B1836] border border-slate-200/90 dark:border-[#1B315E] hover:border-cyan-500 dark:hover:border-cyan-400 text-start shadow-sm transition-colors active:scale-[0.99] min-h-[64px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400 ${
                  isLastOddMobile ? 'col-span-2 sm:col-span-1' : ''
                }`}
              >
                <ToolIcon toolId={tool.id} size="sm" />
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-bold text-slate-900 dark:text-white leading-snug">
                    {copy.name}
                  </p>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 line-clamp-1 mt-0.5">
                    {t.toolsDirectory.categories[tool.category]}
                  </p>
                </div>
              </button>
            );
          })}
        </div>
      </section>

      {/* Live Announcement Banner from Admin Portal (when configured) */}
      {announcement && (
        <section
          aria-label={t.dashboard.announcementLabel}
          className="rounded-2xl bg-white dark:bg-[#0B1836] border border-slate-200/90 dark:border-yellow-400/35 p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-sm"
        >
          <div className="flex items-start gap-3 min-w-0">
            <div className="w-10 h-10 rounded-xl bg-yellow-400/20 text-amber-700 dark:text-yellow-300 flex items-center justify-center shrink-0">
              <Megaphone className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <p className="text-[11px] font-semibold text-cyan-700 dark:text-cyan-300">
                {t.brand.storeName} · {t.dashboard.announcementLabel}
              </p>
              <h2 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white mt-0.5">
                {announcement.title}
              </h2>
              {announcement.message && (
                <p className="text-xs text-slate-600 dark:text-slate-400 mt-0.5 leading-relaxed">
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
              className="shrink-0 inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl bg-yellow-400 hover:bg-yellow-300 text-[#040D21] text-xs font-bold transition-colors min-h-[40px]"
            >
              <span className="whitespace-nowrap">
                {announcement.ctaText || t.dashboard.announcementCtaFallback}
              </span>
              <ArrowRight className="w-3.5 h-3.5 rtl:rotate-180" />
            </a>
          )}
        </section>
      )}
    </div>
  );
};
