import React, { useMemo } from 'react';
import {
  ArrowDownLeft,
  ArrowUpRight,
  BarChart3,
  CalendarRange,
  ChevronLeft,
  ChevronRight,
  Eye,
  Share2,
  TrendingUp,
} from 'lucide-react';
import { ToolTranslationBundle } from '../../i18n/toolTranslations';
import {
  canSharePdfFiles,
  computeDashboardSeries,
  ExpenseReportData,
  formatReportRangeLabel,
  ReportPeriodType,
} from '../../utils/expenseReport';

interface ExpenseReportsDashboardProps {
  t: ToolTranslationBundle['expense'];
  period: ReportPeriodType;
  dayAnchor: string;
  weekAnchor: string;
  monthAnchor: string;
  report: ExpenseReportData;
  onSelectPeriod: (period: ReportPeriodType) => void;
  onChangeAnchor: (val: string) => void;
  onShiftPeriod: (delta: -1 | 1) => void;
  onOpenPreview: () => void;
  onQuickShare: () => void;
  shareBusy?: boolean;
}

function formatPKRCompact(amount: number): string {
  const abs = Math.abs(amount);
  if (abs >= 1_000_000) return `${(abs / 1_000_000).toFixed(1)}M`;
  if (abs >= 10_000) return `${(abs / 1_000).toFixed(1)}k`;
  return abs.toLocaleString('en-PK', {
    maximumFractionDigits: abs % 1 === 0 ? 0 : 1,
  });
}

function formatPKRFull(amount: number): string {
  const abs = Math.abs(amount);
  const formatted = abs.toLocaleString('en-PK', {
    minimumFractionDigits: abs % 1 === 0 ? 0 : 2,
    maximumFractionDigits: 2,
  });
  return `PKR ${formatted}`;
}

export const ExpenseReportsDashboard: React.FC<ExpenseReportsDashboardProps> = ({
  t,
  period,
  dayAnchor,
  weekAnchor,
  monthAnchor,
  report,
  onSelectPeriod,
  onChangeAnchor,
  onShiftPeriod,
  onOpenPreview,
  onQuickShare,
  shareBusy = false,
}) => {
  const series = useMemo(() => computeDashboardSeries(report, t), [report, t]);
  const shareSupported = useMemo(() => canSharePdfFiles(), []);

  const maxChartVal = useMemo(() => {
    let maxVal = 0;
    for (const item of series) {
      if (item.income > maxVal) maxVal = item.income;
      if (item.expense > maxVal) maxVal = item.expense;
    }
    return maxVal > 0 ? maxVal : 1;
  }, [series]);

  const savingsRate = useMemo(() => {
    if (report.totalIncome <= 0) return 0;
    return Math.round(
      ((report.totalIncome - report.totalExpense) / report.totalIncome) * 100
    );
  }, [report.totalIncome, report.totalExpense]);

  const avgDailySpend = useMemo(() => {
    const daysCount =
      period === 'daily'
        ? 1
        : period === 'weekly'
          ? 7
          : Number(report.endDate.slice(8, 10)) || 30;
    return Number((report.totalExpense / daysCount).toFixed(0));
  }, [period, report.endDate, report.totalExpense]);

  const topCategory = report.expenseCategories[0] ?? null;

  const barColors = [
    'bg-cyan-400',
    'bg-yellow-400',
    'bg-sky-400',
    'bg-teal-400',
    'bg-amber-400',
    'bg-indigo-400',
  ];

  const activeAnchorValue =
    period === 'daily'
      ? dayAnchor
      : period === 'weekly'
        ? weekAnchor
        : monthAnchor;

  return (
    <section
      aria-labelledby="reports-dashboard-heading"
      className="rounded-3xl bg-white dark:bg-[#0B1836] border border-slate-200 dark:border-[#1B315E] p-4 sm:p-6 space-y-5 shadow-sm"
    >
      {/* Dashboard Header + Quick Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-start gap-3">
          <span className="w-10 h-10 rounded-xl bg-cyan-500/15 border border-cyan-500/30 text-cyan-700 dark:text-cyan-300 flex items-center justify-center shrink-0">
            <BarChart3 className="w-5 h-5" />
          </span>
          <div>
            <h2
              id="reports-dashboard-heading"
              className="text-base sm:text-lg font-bold text-slate-900 dark:text-white"
            >
              {t.dashboardTitle}
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              {t.dashboardSubtitle}
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {shareSupported && (
            <button
              type="button"
              disabled={shareBusy}
              onClick={onQuickShare}
              data-testid="dashboard-share-pdf-btn"
              className="inline-flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-100 dark:bg-[#11244D] hover:bg-slate-200 dark:hover:bg-[#183166] text-slate-800 dark:text-yellow-300 text-xs font-bold min-h-[40px] transition-colors whitespace-nowrap"
            >
              <Share2 className="w-3.5 h-3.5" />
              <span>{t.sharePdfBtn}</span>
            </button>
          )}

          <button
            type="button"
            data-testid="dashboard-preview-pdf-btn"
            onClick={onOpenPreview}
            className="inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl bg-yellow-400 hover:bg-yellow-300 text-[#040D21] text-xs font-bold min-h-[40px] transition-colors whitespace-nowrap"
          >
            <Eye className="w-4 h-4" />
            <span>{t.previewPdfBtn}</span>
          </button>
        </div>
      </div>

      {/* Period Switcher + Prev/Next Navigator */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 p-3 rounded-2xl bg-slate-50 dark:bg-[#061026] border border-slate-200 dark:border-[#1B315E]">
        <div className="grid grid-cols-3 gap-1.5 p-1 rounded-xl bg-slate-200/70 dark:bg-[#0B1836]">
          {(
            [
              { id: 'daily', label: t.periodDaily },
              { id: 'weekly', label: t.periodWeekly },
              { id: 'monthly', label: t.periodMonthly },
            ] as const
          ).map((item) => {
            const active = period === item.id;
            return (
              <button
                key={item.id}
                type="button"
                data-testid={`dashboard-period-${item.id}`}
                onClick={() => onSelectPeriod(item.id)}
                className={`py-2 px-3 rounded-lg text-xs font-bold min-h-[38px] whitespace-nowrap transition-colors ${
                  active
                    ? 'bg-cyan-500 text-[#040D21] shadow-sm'
                    : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                {item.label}
              </button>
            );
          })}
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => onShiftPeriod(-1)}
            aria-label={t.prevPeriodAria}
            className="min-w-[40px] min-h-[40px] rounded-xl bg-white dark:bg-[#0B1836] border border-slate-200 dark:border-[#213B70] text-slate-700 dark:text-cyan-300 hover:border-cyan-400 flex items-center justify-center shrink-0"
          >
            <ChevronLeft className="w-4 h-4 rtl:rotate-180" />
          </button>

          <input
            type={period === 'monthly' ? 'month' : 'date'}
            value={activeAnchorValue}
            onChange={(e) => onChangeAnchor(e.target.value)}
            aria-label={
              period === 'daily'
                ? t.selectDayLabel
                : period === 'weekly'
                  ? t.selectWeekLabel
                  : t.selectMonthLabel
            }
            className="flex-1 md:w-44 h-10 px-3 rounded-xl bg-white dark:bg-[#0B1836] border border-slate-200 dark:border-[#213B70] text-xs font-semibold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-cyan-400"
          />

          <button
            type="button"
            onClick={() => onShiftPeriod(1)}
            aria-label={t.nextPeriodAria}
            className="min-w-[40px] min-h-[40px] rounded-xl bg-white dark:bg-[#0B1836] border border-slate-200 dark:border-[#213B70] text-slate-700 dark:text-cyan-300 hover:border-cyan-400 flex items-center justify-center shrink-0"
          >
            <ChevronRight className="w-4 h-4 rtl:rotate-180" />
          </button>
        </div>
      </div>

      {/* Period Date Range Metadata */}
      <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-slate-500 dark:text-slate-400 px-1">
        <span className="inline-flex items-center gap-1.5 font-medium tabular-nums">
          <CalendarRange className="w-3.5 h-3.5 text-cyan-600 dark:text-cyan-400 shrink-0" />
          <span>{formatReportRangeLabel(report)}</span>
        </span>
        <span className="tabular-nums font-semibold text-slate-700 dark:text-yellow-300">
          {report.transactionCount} {t.transactionsCountLabel}
        </span>
      </div>

      {/* 4 Modern KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="rounded-2xl bg-slate-50 dark:bg-[#061026] border border-slate-200 dark:border-[#1B315E] p-3.5 space-y-1">
          <div className="flex items-center justify-between text-[11px] font-semibold text-slate-500 dark:text-slate-400">
            <span>{t.typeIncome}</span>
            <ArrowDownLeft className="w-3.5 h-3.5 text-cyan-600 dark:text-cyan-400" />
          </div>
          <p className="text-base sm:text-lg font-extrabold text-cyan-700 dark:text-cyan-300 tabular-nums truncate">
            +{formatPKRFull(report.totalIncome)}
          </p>
        </div>

        <div className="rounded-2xl bg-slate-50 dark:bg-[#061026] border border-slate-200 dark:border-[#1B315E] p-3.5 space-y-1">
          <div className="flex items-center justify-between text-[11px] font-semibold text-slate-500 dark:text-slate-400">
            <span>{t.typeExpense}</span>
            <ArrowUpRight className="w-3.5 h-3.5 text-amber-600 dark:text-yellow-400" />
          </div>
          <p className="text-base sm:text-lg font-extrabold text-amber-700 dark:text-yellow-300 tabular-nums truncate">
            -{formatPKRFull(report.totalExpense)}
          </p>
        </div>

        <div className="rounded-2xl bg-slate-50 dark:bg-[#061026] border border-slate-200 dark:border-[#1B315E] p-3.5 space-y-1">
          <div className="flex items-center justify-between text-[11px] font-semibold text-slate-500 dark:text-slate-400">
            <span>{t.netLabel}</span>
            <TrendingUp className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
          </div>
          <p
            className={`text-base sm:text-lg font-extrabold tabular-nums truncate ${
              report.netBalance >= 0
                ? 'text-slate-900 dark:text-white'
                : 'text-red-600 dark:text-red-400'
            }`}
          >
            {report.netBalance < 0 ? '-' : ''}
            {formatPKRFull(report.netBalance)}
          </p>
        </div>

        <div className="rounded-2xl bg-slate-50 dark:bg-[#061026] border border-slate-200 dark:border-[#1B315E] p-3.5 space-y-1">
          <p className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 truncate">
            {report.totalIncome > 0 ? t.savingsRateLabel : t.avgDailySpendLabel}
          </p>
          <p className="text-base sm:text-lg font-extrabold text-slate-900 dark:text-white tabular-nums truncate">
            {report.totalIncome > 0
              ? `${savingsRate}%`
              : formatPKRFull(avgDailySpend)}
          </p>
          {topCategory && (
            <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
              {t.topCategoryLabel}: {t.categories[topCategory.category]}
            </p>
          )}
        </div>
      </div>

      {/* Analytics Split Grid: Cashflow Bar Chart + Category Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Cashflow Column Chart */}
        <div className="rounded-2xl bg-slate-50 dark:bg-[#061026] border border-slate-200 dark:border-[#1B315E] p-4 space-y-3">
          <div className="flex items-center justify-between gap-2">
            <h3 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white">
              {t.cashflowTrendTitle}
            </h3>
            <div className="flex items-center gap-3 text-[11px] font-semibold">
              <span className="inline-flex items-center gap-1 text-cyan-700 dark:text-cyan-300">
                <span className="w-2.5 h-2.5 rounded-sm bg-cyan-400 inline-block" />
                {t.typeIncome}
              </span>
              <span className="inline-flex items-center gap-1 text-amber-700 dark:text-yellow-300">
                <span className="w-2.5 h-2.5 rounded-sm bg-yellow-400 inline-block" />
                {t.typeExpense}
              </span>
            </div>
          </div>

          <div className="h-44 flex items-end justify-between gap-1.5 pt-4 border-b border-slate-200 dark:border-[#1B315E] pb-2">
            {series.map((item) => {
              const incHeightPct = Math.round((item.income / maxChartVal) * 100);
              const expHeightPct = Math.round((item.expense / maxChartVal) * 100);
              return (
                <div
                  key={item.key}
                  className="flex-1 h-full flex flex-col items-center justify-end gap-1 min-w-0 group"
                  title={`${item.label}: +${formatPKRCompact(item.income)} / -${formatPKRCompact(item.expense)}`}
                >
                  <div className="w-full flex-1 flex items-end justify-center gap-1">
                    <div
                      className="w-2.5 sm:w-3 rounded-t-md bg-cyan-400 transition-all duration-200"
                      style={{
                        height: `${item.income > 0 ? Math.max(8, incHeightPct) : 3}%`,
                        opacity: item.income > 0 ? 1 : 0.25,
                      }}
                    />
                    <div
                      className="w-2.5 sm:w-3 rounded-t-md bg-yellow-400 transition-all duration-200"
                      style={{
                        height: `${item.expense > 0 ? Math.max(8, expHeightPct) : 3}%`,
                        opacity: item.expense > 0 ? 1 : 0.25,
                      }}
                    />
                  </div>
                  <span className="text-[10px] font-medium text-slate-500 dark:text-slate-400 tabular-nums truncate max-w-full">
                    {item.shortLabel}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Category Spending Distribution */}
        <div className="rounded-2xl bg-slate-50 dark:bg-[#061026] border border-slate-200 dark:border-[#1B315E] p-4 space-y-3">
          <div className="flex items-center justify-between gap-2">
            <h3 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white">
              {t.categoryBreakdownTitle}
            </h3>
            <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 tabular-nums">
              {report.expenseCategories.length}
            </span>
          </div>

          {report.expenseCategories.length === 0 ? (
            <div className="h-44 flex items-center justify-center text-center text-xs text-slate-500 dark:text-slate-400 px-4">
              {t.noCategorySpending}
            </div>
          ) : (
            <div className="space-y-3 max-h-44 overflow-y-auto pe-1">
              {report.expenseCategories.map((cat, idx) => (
                <div key={cat.category} className="space-y-1">
                  <div className="flex items-center justify-between gap-2 text-xs">
                    <span className="font-semibold text-slate-800 dark:text-slate-200 truncate">
                      {t.categories[cat.category]}
                    </span>
                    <span className="font-bold text-slate-900 dark:text-white tabular-nums shrink-0">
                      {formatPKRFull(cat.total)}{' '}
                      <span className="text-[11px] font-medium text-slate-500 dark:text-cyan-300">
                        ({cat.percentage}%)
                      </span>
                    </span>
                  </div>
                  <div className="h-2 rounded-full bg-slate-200 dark:bg-[#0E2044] overflow-hidden">
                    <div
                      className={`h-full rounded-full ${barColors[idx % barColors.length]}`}
                      style={{ width: `${Math.max(4, cat.percentage)}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </section>
  );
};
