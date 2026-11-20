import React, { useCallback, useMemo, useState } from 'react';
import {
  ArrowDownLeft,
  ArrowUpRight,
  CalendarRange,
  CheckCircle2,
  FileDown,
  Pencil,
  Plus,
  Share2,
  Trash2,
  X,
} from 'lucide-react';
import { ToolTranslationBundle } from '../../i18n/toolTranslations';
import { Language } from '../../types';
import {
  buildExpenseReport,
  canSharePdfFiles,
  createExpenseReportPdf,
  downloadPdfBlob,
  formatReportRangeLabel,
  ReportPeriodType,
  sharePdfBlob,
} from '../../utils/expenseReport';
import {
  generateId,
  getCurrentMonthISO,
  getTodayISO,
  TransactionCategory,
  TransactionItem,
  transactionsStorage,
  TransactionType,
} from '../../utils/storage';

interface ExpenseTrackerToolProps {
  language?: Language;
  t: ToolTranslationBundle['expense'];
}

const INCOME_CATEGORIES: TransactionCategory[] = [
  'salary',
  'business',
  'freelance',
  'gift',
  'other',
];

const EXPENSE_CATEGORIES: TransactionCategory[] = [
  'food',
  'transport',
  'bills',
  'shopping',
  'health',
  'education',
  'other',
];

function formatPKR(amount: number): string {
  const formatted = Math.abs(amount).toLocaleString('en-PK', {
    minimumFractionDigits: amount % 1 === 0 ? 0 : 2,
    maximumFractionDigits: 2,
  });
  return `PKR ${formatted}`;
}

export const ExpenseTrackerTool: React.FC<ExpenseTrackerToolProps> = ({
  language = 'en',
  t,
}) => {
  const [transactions, setTransactions] = useState<TransactionItem[]>(() =>
    transactionsStorage.load()
  );

  // Filters & Summaries
  const [filterType, setFilterType] = useState<'all' | TransactionType>('all');
  const [selectedDay, setSelectedDay] = useState<string>(() => getTodayISO());
  const [selectedWeekDate, setSelectedWeekDate] = useState<string>(() =>
    getTodayISO()
  );
  const [selectedMonth, setSelectedMonth] = useState<string>(() =>
    getCurrentMonthISO()
  );

  // PDF Export Modal State
  const [exportModalOpen, setExportModalOpen] = useState<boolean>(false);
  const [exportPeriod, setExportPeriod] = useState<ReportPeriodType>('monthly');
  const [exportDay, setExportDay] = useState<string>(() => getTodayISO());
  const [exportWeekDate, setExportWeekDate] = useState<string>(() =>
    getTodayISO()
  );
  const [exportMonth, setExportMonth] = useState<string>(() =>
    getCurrentMonthISO()
  );
  const [exportBusy, setExportBusy] = useState<boolean>(false);
  const [exportStatus, setExportStatus] = useState<{
    kind: 'success' | 'error';
    message: string;
  } | null>(null);

  // Form Modal / Sheet State
  const [formOpen, setFormOpen] = useState<boolean>(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [txType, setTxType] = useState<TransactionType>('expense');
  const [amountInput, setAmountInput] = useState<string>('');
  const [descInput, setDescInput] = useState<string>('');
  const [catInput, setCatInput] = useState<TransactionCategory>('food');
  const [dateInput, setDateInput] = useState<string>(() => getTodayISO());
  const [formError, setFormError] = useState<string | null>(null);

  const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null);

  const persist = useCallback((next: TransactionItem[]) => {
    setTransactions(next);
    transactionsStorage.save(next);
  }, []);

  // Overall totals
  const overall = useMemo(() => {
    let income = 0;
    let expense = 0;
    for (const tx of transactions) {
      if (tx.type === 'income') income += tx.amount;
      else expense += tx.amount;
    }
    return {
      income,
      expense,
      balance: income - expense,
    };
  }, [transactions]);

  // Daily, Weekly, and Monthly summaries using shared report aggregator
  const dailyReport = useMemo(
    () => buildExpenseReport(transactions, 'daily', selectedDay),
    [transactions, selectedDay]
  );

  const weeklyReport = useMemo(
    () => buildExpenseReport(transactions, 'weekly', selectedWeekDate),
    [transactions, selectedWeekDate]
  );

  const monthlyReport = useMemo(
    () => buildExpenseReport(transactions, 'monthly', selectedMonth),
    [transactions, selectedMonth]
  );

  // Active report preview inside PDF modal
  const activeExportAnchor =
    exportPeriod === 'daily'
      ? exportDay
      : exportPeriod === 'weekly'
        ? exportWeekDate
        : exportMonth;

  const activeExportReport = useMemo(
    () => buildExpenseReport(transactions, exportPeriod, activeExportAnchor),
    [transactions, exportPeriod, activeExportAnchor]
  );

  const shareSupported = useMemo(() => canSharePdfFiles(), []);

  const filteredHistory = useMemo(() => {
    return [...transactions]
      .filter((tx) => filterType === 'all' || tx.type === filterType)
      .sort((a, b) => {
        if (b.date !== a.date) return b.date.localeCompare(a.date);
        return b.updatedAt - a.updatedAt;
      });
  }, [transactions, filterType]);

  const availableCategories =
    txType === 'income' ? INCOME_CATEGORIES : EXPENSE_CATEGORIES;

  const openExportModal = (initialPeriod: ReportPeriodType) => {
    setExportPeriod(initialPeriod);
    setExportDay(selectedDay);
    setExportWeekDate(selectedWeekDate);
    setExportMonth(selectedMonth);
    setExportStatus(null);
    setExportModalOpen(true);
  };

  const handleDownloadPdf = async () => {
    setExportBusy(true);
    setExportStatus(null);
    try {
      const result = createExpenseReportPdf(activeExportReport, {
        language,
        t,
      });
      downloadPdfBlob(result.blob, result.filename);
      setExportStatus({
        kind: 'success',
        message: `${t.exportSuccess} ${result.filename}`,
      });
    } catch {
      setExportStatus({
        kind: 'error',
        message: t.exportError,
      });
    } finally {
      setExportBusy(false);
    }
  };

  const handleSharePdf = async () => {
    setExportBusy(true);
    setExportStatus(null);
    try {
      const result = createExpenseReportPdf(activeExportReport, {
        language,
        t,
      });
      const outcome = await sharePdfBlob(
        result.blob,
        result.filename,
        t.pdfLabels.reportTitle
      );
      if (outcome === 'shared') {
        setExportStatus({
          kind: 'success',
          message: `${t.exportSuccess} ${result.filename}`,
        });
      }
    } catch {
      setExportStatus({
        kind: 'error',
        message: t.exportError,
      });
    } finally {
      setExportBusy(false);
    }
  };

  const openNewForm = (defaultType: TransactionType) => {
    setEditingId(null);
    setTxType(defaultType);
    setAmountInput('');
    setDescInput('');
    setCatInput(defaultType === 'income' ? 'salary' : 'food');
    setDateInput(getTodayISO());
    setFormError(null);
    setFormOpen(true);
  };

  const openEditForm = (tx: TransactionItem) => {
    setEditingId(tx.id);
    setTxType(tx.type);
    setAmountInput(String(tx.amount));
    setDescInput(tx.description);
    setCatInput(tx.category);
    setDateInput(tx.date);
    setFormError(null);
    setFormOpen(true);
  };

  const handleTypeSwitch = (nextType: TransactionType) => {
    setTxType(nextType);
    const valid = nextType === 'income' ? INCOME_CATEGORIES : EXPENSE_CATEGORIES;
    if (!valid.includes(catInput)) {
      setCatInput(valid[0]);
    }
  };

  const handleSaveTransaction = (e: React.FormEvent) => {
    e.preventDefault();
    const parsedAmount = Number(amountInput);
    if (!Number.isFinite(parsedAmount) || parsedAmount <= 0) {
      setFormError(t.errors.invalidAmount);
      return;
    }
    const cleanDesc = descInput.trim();
    if (!cleanDesc) {
      setFormError(t.errors.emptyDescription);
      return;
    }
    if (!/^\d{4}-\d{2}-\d{2}$/.test(dateInput)) {
      setFormError(t.errors.invalidDate);
      return;
    }

    const now = Date.now();
    if (editingId) {
      const next = transactions.map((tx) =>
        tx.id === editingId
          ? {
              ...tx,
              type: txType,
              amount: Number(parsedAmount.toFixed(2)),
              description: cleanDesc,
              category: catInput,
              date: dateInput,
              updatedAt: now,
            }
          : tx
      );
      persist(next);
    } else {
      const created: TransactionItem = {
        id: generateId('tx'),
        type: txType,
        amount: Number(parsedAmount.toFixed(2)),
        description: cleanDesc,
        category: catInput,
        date: dateInput,
        createdAt: now,
        updatedAt: now,
      };
      persist([created, ...transactions]);
    }

    setFormOpen(false);
    setEditingId(null);
  };

  const handleConfirmDelete = () => {
    if (!pendingDeleteId) return;
    persist(transactions.filter((tx) => tx.id !== pendingDeleteId));
    setPendingDeleteId(null);
  };

  return (
    <div className="space-y-5">
      {/* Remaining Balance & Income / Expense Overview */}
      <section className="rounded-3xl bg-gradient-to-br from-[#0B6FF2] to-[#0D9488] text-white p-5 sm:p-6 space-y-4">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-xs font-semibold text-sky-100">{t.balanceLabel}</p>
            <p className="text-3xl sm:text-4xl font-extrabold tabular-nums mt-1">
              {overall.balance < 0 ? '-' : ''}
              {formatPKR(overall.balance)}
            </p>
          </div>

          <button
            type="button"
            data-testid="expense-open-pdf-btn"
            onClick={() => openExportModal('monthly')}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white/20 hover:bg-white/30 backdrop-blur-sm text-white text-xs font-bold min-h-[40px] shrink-0 transition-colors"
          >
            <FileDown className="w-4 h-4" />
            <span>{t.exportPdfBtn}</span>
          </button>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="rounded-2xl bg-white/15 backdrop-blur-sm p-3.5">
            <div className="flex items-center gap-1.5 text-xs text-sky-100">
              <ArrowDownLeft className="w-3.5 h-3.5 text-emerald-300" />
              <span>{t.incomeLabel}</span>
            </div>
            <p className="text-base sm:text-lg font-bold tabular-nums mt-1">
              {formatPKR(overall.income)}
            </p>
          </div>
          <div className="rounded-2xl bg-white/15 backdrop-blur-sm p-3.5">
            <div className="flex items-center gap-1.5 text-xs text-sky-100">
              <ArrowUpRight className="w-3.5 h-3.5 text-amber-300" />
              <span>{t.expensesLabel}</span>
            </div>
            <p className="text-base sm:text-lg font-bold tabular-nums mt-1">
              {formatPKR(overall.expense)}
            </p>
          </div>
        </div>
      </section>

      {/* Quick Action Add Buttons */}
      <div className="grid grid-cols-2 gap-3">
        <button
          type="button"
          onClick={() => openNewForm('income')}
          className="inline-flex items-center justify-center gap-2 py-3 px-4 rounded-2xl bg-teal-600 hover:bg-teal-700 text-white text-sm font-semibold min-h-[48px] transition-colors"
        >
          <Plus className="w-4 h-4" />
          <span>{t.typeIncome}</span>
        </button>
        <button
          type="button"
          onClick={() => openNewForm('expense')}
          className="inline-flex items-center justify-center gap-2 py-3 px-4 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold min-h-[48px] transition-colors"
        >
          <Plus className="w-4 h-4" />
          <span>{t.typeExpense}</span>
        </button>
      </div>

      {/* Daily, Weekly & Monthly Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
        {/* Daily Summary */}
        <section className="rounded-2xl bg-white dark:bg-[#131C31] border border-slate-200 dark:border-slate-800 p-4 space-y-3">
          <div className="flex items-center justify-between gap-2">
            <h2 className="text-sm font-bold text-slate-900 dark:text-white truncate">
              {t.dailySummaryTitle}
            </h2>
            <button
              type="button"
              data-testid="export-daily-pdf-btn"
              onClick={() => openExportModal('daily')}
              aria-label={`${t.exportPdfBtn} (${t.periodDaily})`}
              className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-blue-50 dark:bg-blue-950/50 text-blue-700 dark:text-sky-300 text-[11px] font-bold hover:bg-blue-100 dark:hover:bg-blue-900/50 min-h-[32px] shrink-0 transition-colors"
            >
              <FileDown className="w-3.5 h-3.5" />
              <span>PDF</span>
            </button>
          </div>
          <input
            type="date"
            value={selectedDay}
            onChange={(e) => setSelectedDay(e.target.value)}
            aria-label={t.selectDayLabel}
            className="w-full h-9 px-2.5 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs text-slate-800 dark:text-slate-200"
          />
          <div className="space-y-1.5 text-xs sm:text-sm">
            <div className="flex justify-between">
              <span className="text-slate-500 dark:text-slate-400">
                {t.typeIncome}
              </span>
              <span className="font-semibold text-teal-700 dark:text-teal-400 tabular-nums">
                +{formatPKR(dailyReport.totalIncome)}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500 dark:text-slate-400">
                {t.typeExpense}
              </span>
              <span className="font-semibold text-orange-600 dark:text-orange-400 tabular-nums">
                -{formatPKR(dailyReport.totalExpense)}
              </span>
            </div>
            <div className="pt-1.5 border-t border-slate-100 dark:border-slate-800 flex justify-between font-bold">
              <span className="text-slate-700 dark:text-slate-200">{t.netLabel}</span>
              <span className="text-slate-900 dark:text-white tabular-nums">
                {dailyReport.netBalance < 0 ? '-' : ''}
                {formatPKR(dailyReport.netBalance)}
              </span>
            </div>
          </div>
        </section>

        {/* Weekly Summary */}
        <section className="rounded-2xl bg-white dark:bg-[#131C31] border border-slate-200 dark:border-slate-800 p-4 space-y-3">
          <div className="flex items-center justify-between gap-2">
            <h2 className="text-sm font-bold text-slate-900 dark:text-white truncate">
              {t.weeklySummaryTitle}
            </h2>
            <button
              type="button"
              data-testid="export-weekly-pdf-btn"
              onClick={() => openExportModal('weekly')}
              aria-label={`${t.exportPdfBtn} (${t.periodWeekly})`}
              className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-teal-50 dark:bg-teal-950/50 text-teal-700 dark:text-teal-300 text-[11px] font-bold hover:bg-teal-100 dark:hover:bg-teal-900/50 min-h-[32px] shrink-0 transition-colors"
            >
              <FileDown className="w-3.5 h-3.5" />
              <span>PDF</span>
            </button>
          </div>
          <div className="space-y-1">
            <input
              type="date"
              value={selectedWeekDate}
              onChange={(e) => setSelectedWeekDate(e.target.value)}
              aria-label={t.selectWeekLabel}
              className="w-full h-9 px-2.5 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs text-slate-800 dark:text-slate-200"
            />
            <p className="text-[11px] text-slate-500 dark:text-slate-400 tabular-nums flex items-center gap-1">
              <CalendarRange className="w-3 h-3 shrink-0" />
              <span>
                {weeklyReport.startDate} – {weeklyReport.endDate}
              </span>
            </p>
          </div>
          <div className="space-y-1.5 text-xs sm:text-sm">
            <div className="flex justify-between">
              <span className="text-slate-500 dark:text-slate-400">
                {t.typeIncome}
              </span>
              <span className="font-semibold text-teal-700 dark:text-teal-400 tabular-nums">
                +{formatPKR(weeklyReport.totalIncome)}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500 dark:text-slate-400">
                {t.typeExpense}
              </span>
              <span className="font-semibold text-orange-600 dark:text-orange-400 tabular-nums">
                -{formatPKR(weeklyReport.totalExpense)}
              </span>
            </div>
            <div className="pt-1.5 border-t border-slate-100 dark:border-slate-800 flex justify-between font-bold">
              <span className="text-slate-700 dark:text-slate-200">{t.netLabel}</span>
              <span className="text-slate-900 dark:text-white tabular-nums">
                {weeklyReport.netBalance < 0 ? '-' : ''}
                {formatPKR(weeklyReport.netBalance)}
              </span>
            </div>
          </div>
        </section>

        {/* Monthly Summary */}
        <section className="rounded-2xl bg-white dark:bg-[#131C31] border border-slate-200 dark:border-slate-800 p-4 space-y-3 sm:col-span-2 lg:col-span-1">
          <div className="flex items-center justify-between gap-2">
            <h2 className="text-sm font-bold text-slate-900 dark:text-white truncate">
              {t.monthlySummaryTitle}
            </h2>
            <button
              type="button"
              data-testid="export-monthly-pdf-btn"
              onClick={() => openExportModal('monthly')}
              aria-label={`${t.exportPdfBtn} (${t.periodMonthly})`}
              className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-blue-50 dark:bg-blue-950/50 text-blue-700 dark:text-sky-300 text-[11px] font-bold hover:bg-blue-100 dark:hover:bg-blue-900/50 min-h-[32px] shrink-0 transition-colors"
            >
              <FileDown className="w-3.5 h-3.5" />
              <span>PDF</span>
            </button>
          </div>
          <input
            type="month"
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(e.target.value)}
            aria-label={t.selectMonthLabel}
            className="w-full h-9 px-2.5 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs text-slate-800 dark:text-slate-200"
          />
          <div className="space-y-1.5 text-xs sm:text-sm">
            <div className="flex justify-between">
              <span className="text-slate-500 dark:text-slate-400">
                {t.typeIncome}
              </span>
              <span className="font-semibold text-teal-700 dark:text-teal-400 tabular-nums">
                +{formatPKR(monthlyReport.totalIncome)}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500 dark:text-slate-400">
                {t.typeExpense}
              </span>
              <span className="font-semibold text-orange-600 dark:text-orange-400 tabular-nums">
                -{formatPKR(monthlyReport.totalExpense)}
              </span>
            </div>
            <div className="pt-1.5 border-t border-slate-100 dark:border-slate-800 flex justify-between font-bold">
              <span className="text-slate-700 dark:text-slate-200">{t.netLabel}</span>
              <span className="text-slate-900 dark:text-white tabular-nums">
                {monthlyReport.netBalance < 0 ? '-' : ''}
                {formatPKR(monthlyReport.netBalance)}
              </span>
            </div>
          </div>
        </section>
      </div>

      {/* Transaction History */}
      <section className="space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2 className="text-base font-bold text-slate-900 dark:text-white">
            {t.historyTitle} ({filteredHistory.length})
          </h2>

          <div className="flex items-center gap-1 p-1 rounded-xl bg-slate-100 dark:bg-slate-800">
            {(['all', 'income', 'expense'] as const).map((mode) => {
              const active = filterType === mode;
              const label =
                mode === 'all'
                  ? t.filterAll
                  : mode === 'income'
                    ? t.filterIncome
                    : t.filterExpense;
              return (
                <button
                  key={mode}
                  type="button"
                  onClick={() => setFilterType(mode)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors min-h-[36px] ${
                    active
                      ? 'bg-blue-600 text-white'
                      : 'text-slate-600 dark:text-slate-300'
                  }`}
                >
                  {label}
                </button>
              );
            })}
          </div>
        </div>

        {filteredHistory.length === 0 ? (
          <div className="rounded-2xl bg-white dark:bg-[#131C31] border border-dashed border-slate-200 dark:border-slate-800 p-8 text-center text-sm text-slate-500 dark:text-slate-400">
            {t.noTransactions}
          </div>
        ) : (
          <div className="space-y-2.5">
            {filteredHistory.map((tx) => (
              <div
                key={tx.id}
                className="rounded-2xl bg-white dark:bg-[#131C31] border border-slate-200 dark:border-slate-800 p-4 flex items-center justify-between gap-3"
              >
                <div className="flex items-center gap-3 min-w-0 flex-1">
                  <span
                    className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                      tx.type === 'income'
                        ? 'bg-teal-50 dark:bg-teal-950/50 text-teal-600 dark:text-teal-400'
                        : 'bg-orange-50 dark:bg-orange-950/40 text-orange-600 dark:text-orange-400'
                    }`}
                  >
                    {tx.type === 'income' ? (
                      <ArrowDownLeft className="w-5 h-5" />
                    ) : (
                      <ArrowUpRight className="w-5 h-5" />
                    )}
                  </span>

                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-bold text-slate-900 dark:text-white truncate">
                      {tx.description}
                    </p>
                    <p className="text-xs text-slate-500 dark:text-slate-400 truncate">
                      {t.categories[tx.category]} · {tx.date}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-1.5 shrink-0">
                  <span
                    className={`text-sm font-bold tabular-nums me-1 ${
                      tx.type === 'income'
                        ? 'text-teal-700 dark:text-teal-400'
                        : 'text-orange-600 dark:text-orange-400'
                    }`}
                  >
                    {tx.type === 'income' ? '+' : '-'}
                    {formatPKR(tx.amount)}
                  </span>
                  <button
                    type="button"
                    onClick={() => openEditForm(tx)}
                    aria-label="Edit transaction"
                    className="min-w-[36px] min-h-[36px] flex items-center justify-center rounded-xl text-blue-600 dark:text-sky-400 hover:bg-blue-50 dark:hover:bg-slate-800"
                  >
                    <Pencil className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => setPendingDeleteId(tx.id)}
                    aria-label="Delete transaction"
                    className="min-w-[36px] min-h-[36px] flex items-center justify-center rounded-xl text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/40"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Export PDF Report Modal */}
      {exportModalOpen && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="pdf-export-modal-title"
          className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-slate-950/60 backdrop-blur-sm"
        >
          <div className="w-full sm:max-w-md rounded-t-3xl sm:rounded-3xl bg-white dark:bg-[#131C31] border border-slate-200 dark:border-slate-800 p-6 pb-[max(1.5rem,calc(env(safe-area-inset-bottom,0px)+1rem))] space-y-4 shadow-xl max-h-[90dvh] overflow-y-auto">
            <div className="flex items-center justify-between gap-2">
              <h3
                id="pdf-export-modal-title"
                className="text-lg font-bold text-slate-900 dark:text-white"
              >
                {t.pdfModalTitle}
              </h3>
              <button
                type="button"
                onClick={() => setExportModalOpen(false)}
                aria-label={t.cancelBtn}
                className="min-w-[38px] min-h-[38px] flex items-center justify-center rounded-xl text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Period Type Segmented Selector */}
            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                {t.reportPeriodLabel}
              </label>
              <div className="grid grid-cols-3 gap-1.5 p-1 rounded-xl bg-slate-100 dark:bg-slate-800">
                {(
                  [
                    { id: 'daily', label: t.periodDaily },
                    { id: 'weekly', label: t.periodWeekly },
                    { id: 'monthly', label: t.periodMonthly },
                  ] as const
                ).map((item) => {
                  const active = exportPeriod === item.id;
                  return (
                    <button
                      key={item.id}
                      type="button"
                      data-testid={`pdf-period-${item.id}`}
                      onClick={() => {
                        setExportPeriod(item.id);
                        setExportStatus(null);
                      }}
                      className={`py-2 px-2 rounded-lg text-xs font-bold min-h-[40px] transition-colors ${
                        active
                          ? 'bg-blue-600 text-white'
                          : 'text-slate-600 dark:text-slate-300'
                      }`}
                    >
                      {item.label}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Period Anchor Input */}
            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                {exportPeriod === 'daily'
                  ? t.selectDayLabel
                  : exportPeriod === 'weekly'
                    ? t.selectWeekLabel
                    : t.selectMonthLabel}
              </label>

              {exportPeriod === 'daily' && (
                <input
                  type="date"
                  value={exportDay}
                  onChange={(e) => {
                    setExportDay(e.target.value);
                    setExportStatus(null);
                  }}
                  className="w-full h-11 px-3.5 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-600"
                />
              )}

              {exportPeriod === 'weekly' && (
                <input
                  type="date"
                  value={exportWeekDate}
                  onChange={(e) => {
                    setExportWeekDate(e.target.value);
                    setExportStatus(null);
                  }}
                  className="w-full h-11 px-3.5 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-600"
                />
              )}

              {exportPeriod === 'monthly' && (
                <input
                  type="month"
                  value={exportMonth}
                  onChange={(e) => {
                    setExportMonth(e.target.value);
                    setExportStatus(null);
                  }}
                  className="w-full h-11 px-3.5 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-600"
                />
              )}

              <p className="text-xs text-slate-500 dark:text-slate-400 tabular-nums">
                <span className="font-semibold">{t.reportRangeLabel}:</span>{' '}
                {formatReportRangeLabel(activeExportReport)}
              </p>
            </div>

            {/* Live Report Preview Card */}
            <div className="rounded-2xl bg-slate-50 dark:bg-slate-900/70 border border-slate-200 dark:border-slate-800 p-4 space-y-2.5">
              <div className="flex items-center justify-between">
                <p className="text-xs font-bold text-slate-700 dark:text-slate-200">
                  {t.reportPreviewTitle}
                </p>
                <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 tabular-nums">
                  {activeExportReport.transactionCount} {t.transactionsCountLabel}
                </span>
              </div>

              <div className="space-y-1.5 text-xs sm:text-sm">
                <div className="flex justify-between">
                  <span className="text-slate-500 dark:text-slate-400">
                    {t.incomeLabel}
                  </span>
                  <span className="font-semibold text-teal-700 dark:text-teal-400 tabular-nums">
                    +{formatPKR(activeExportReport.totalIncome)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500 dark:text-slate-400">
                    {t.expensesLabel}
                  </span>
                  <span className="font-semibold text-orange-600 dark:text-orange-400 tabular-nums">
                    -{formatPKR(activeExportReport.totalExpense)}
                  </span>
                </div>
                <div className="pt-1.5 border-t border-slate-200 dark:border-slate-800 flex justify-between font-bold">
                  <span className="text-slate-800 dark:text-slate-100">
                    {t.netLabel}
                  </span>
                  <span className="text-slate-900 dark:text-white tabular-nums">
                    {activeExportReport.netBalance < 0 ? '-' : ''}
                    {formatPKR(activeExportReport.netBalance)}
                  </span>
                </div>
              </div>
            </div>

            {activeExportReport.transactionCount === 0 && (
              <p className="text-xs text-amber-700 dark:text-amber-300 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900/60 rounded-xl p-3">
                {t.emptyPeriodNotice}
              </p>
            )}

            {exportStatus && (
              <div
                role={exportStatus.kind === 'error' ? 'alert' : 'status'}
                className={`text-xs font-semibold rounded-xl p-3 flex items-start gap-2 ${
                  exportStatus.kind === 'success'
                    ? 'bg-teal-50 dark:bg-teal-950/40 text-teal-800 dark:text-teal-300 border border-teal-200 dark:border-teal-900/60'
                    : 'bg-red-50 dark:bg-red-950/40 text-red-700 dark:text-red-300 border border-red-200 dark:border-red-900/60'
                }`}
              >
                {exportStatus.kind === 'success' && (
                  <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" />
                )}
                <span className="break-all">{exportStatus.message}</span>
              </div>
            )}

            <div className="flex flex-wrap gap-2.5 pt-1">
              <button
                type="button"
                onClick={() => setExportModalOpen(false)}
                className="px-4 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 text-sm font-semibold min-h-[44px]"
              >
                {t.cancelBtn}
              </button>

              {shareSupported && (
                <button
                  type="button"
                  disabled={exportBusy}
                  onClick={handleSharePdf}
                  className="inline-flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-700 disabled:opacity-60 text-white text-sm font-semibold min-h-[44px]"
                >
                  <Share2 className="w-4 h-4" />
                  <span>{t.sharePdfBtn}</span>
                </button>
              )}

              <button
                type="button"
                data-testid="pdf-download-confirm-btn"
                disabled={exportBusy}
                onClick={handleDownloadPdf}
                className="flex-1 inline-flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white text-sm font-semibold min-h-[44px]"
              >
                <FileDown className="w-4 h-4" />
                <span>{exportBusy ? t.generatingPdf : t.downloadPdfBtn}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add / Edit Transaction Modal */}
      {formOpen && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="tx-modal-title"
          className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-slate-950/60 backdrop-blur-sm"
        >
          <form
            onSubmit={handleSaveTransaction}
            className="w-full sm:max-w-md rounded-t-3xl sm:rounded-3xl bg-white dark:bg-[#131C31] border border-slate-200 dark:border-slate-800 p-6 pb-[max(1.5rem,calc(env(safe-area-inset-bottom,0px)+1rem))] space-y-4 shadow-xl max-h-[90dvh] overflow-y-auto"
          >
            <div className="flex items-center justify-between">
              <h3
                id="tx-modal-title"
                className="text-lg font-bold text-slate-900 dark:text-white"
              >
                {editingId ? t.editTransactionTitle : t.newTransactionTitle}
              </h3>
              <button
                type="button"
                onClick={() => setFormOpen(false)}
                aria-label={t.cancelBtn}
                className="min-w-[38px] min-h-[38px] flex items-center justify-center rounded-xl text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Income / Expense Type Selector */}
            <div className="grid grid-cols-2 gap-2 p-1 rounded-xl bg-slate-100 dark:bg-slate-800">
              <button
                type="button"
                onClick={() => handleTypeSwitch('income')}
                className={`py-2 rounded-lg text-xs font-bold min-h-[40px] transition-colors ${
                  txType === 'income'
                    ? 'bg-teal-600 text-white'
                    : 'text-slate-600 dark:text-slate-300'
                }`}
              >
                {t.typeIncome}
              </button>
              <button
                type="button"
                onClick={() => handleTypeSwitch('expense')}
                className={`py-2 rounded-lg text-xs font-bold min-h-[40px] transition-colors ${
                  txType === 'expense'
                    ? 'bg-blue-600 text-white'
                    : 'text-slate-600 dark:text-slate-300'
                }`}
              >
                {t.typeExpense}
              </button>
            </div>

            <div className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  {t.amountLabel}
                </label>
                <input
                  type="number"
                  step="any"
                  min="0.01"
                  value={amountInput}
                  onChange={(e) => {
                    setAmountInput(e.target.value);
                    setFormError(null);
                  }}
                  placeholder={t.amountPlaceholder}
                  className="w-full h-11 px-3.5 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-sm font-mono tabular-nums text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-600"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  {t.descriptionLabel}
                </label>
                <input
                  type="text"
                  value={descInput}
                  onChange={(e) => {
                    setDescInput(e.target.value);
                    setFormError(null);
                  }}
                  placeholder={t.descriptionPlaceholder}
                  className="w-full h-11 px-3.5 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-600"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    {t.categoryLabel}
                  </label>
                  <select
                    value={catInput}
                    onChange={(e) =>
                      setCatInput(e.target.value as TransactionCategory)
                    }
                    className="w-full h-11 px-3 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-600"
                  >
                    {availableCategories.map((cat) => (
                      <option key={cat} value={cat}>
                        {t.categories[cat]}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    {t.dateLabel}
                  </label>
                  <input
                    type="date"
                    value={dateInput}
                    onChange={(e) => {
                      setDateInput(e.target.value);
                      setFormError(null);
                    }}
                    className="w-full h-11 px-3 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-600"
                  />
                </div>
              </div>
            </div>

            {formError && (
              <p
                role="alert"
                className="text-xs font-medium text-red-600 dark:text-red-400"
              >
                {formError}
              </p>
            )}

            <div className="flex gap-2.5 pt-1">
              <button
                type="button"
                onClick={() => setFormOpen(false)}
                className="flex-1 py-2.5 px-4 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 text-sm font-semibold min-h-[44px]"
              >
                {t.cancelBtn}
              </button>
              <button
                type="submit"
                className="flex-1 py-2.5 px-4 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold min-h-[44px]"
              >
                {editingId ? t.updateBtn : t.saveBtn}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Delete Transaction Confirmation Modal */}
      {pendingDeleteId && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="tx-delete-title"
          className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-slate-950/60 backdrop-blur-sm"
        >
          <div className="w-full sm:max-w-sm rounded-t-3xl sm:rounded-3xl bg-white dark:bg-[#131C31] border border-slate-200 dark:border-slate-800 p-6 pb-[max(1.5rem,calc(env(safe-area-inset-bottom,0px)+1rem))] space-y-4 shadow-xl">
            <h3
              id="tx-delete-title"
              className="text-lg font-bold text-slate-900 dark:text-white"
            >
              {t.confirmDeleteTitle}
            </h3>
            <p className="text-sm text-slate-600 dark:text-slate-300">
              {t.confirmDeleteBody}
            </p>
            <div className="flex gap-2.5">
              <button
                type="button"
                onClick={() => setPendingDeleteId(null)}
                className="flex-1 py-2.5 px-4 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 text-sm font-semibold min-h-[44px]"
              >
                {t.cancelBtn}
              </button>
              <button
                type="button"
                onClick={handleConfirmDelete}
                className="flex-1 py-2.5 px-4 rounded-xl bg-red-600 hover:bg-red-700 text-white text-sm font-semibold min-h-[44px]"
              >
                {t.deleteBtn}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
