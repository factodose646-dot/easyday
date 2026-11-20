import React, { useCallback, useMemo, useState } from 'react';
import {
  ArrowDownLeft,
  ArrowUpRight,
  Eye,
  Pencil,
  Plus,
  Trash2,
  X,
} from 'lucide-react';
import { ToolTranslationBundle } from '../../i18n/toolTranslations';
import { Language } from '../../types';
import {
  buildExpenseReport,
  createExpenseReportPdf,
  getReportFilename,
  ReportPeriodType,
  sharePdfBlob,
  shiftPeriodAnchor,
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
import { ExpenseReportsDashboard } from './ExpenseReportsDashboard';
import { PdfPreviewModal } from './PdfPreviewModal';

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

  // Dashboard Period & Filters
  const [filterType, setFilterType] = useState<'all' | TransactionType>('all');
  const [dashboardPeriod, setDashboardPeriod] =
    useState<ReportPeriodType>('monthly');
  const [selectedDay, setSelectedDay] = useState<string>(() => getTodayISO());
  const [selectedWeekDate, setSelectedWeekDate] = useState<string>(() =>
    getTodayISO()
  );
  const [selectedMonth, setSelectedMonth] = useState<string>(() =>
    getCurrentMonthISO()
  );

  // PDF Preview & Export Modal State
  const [previewModalOpen, setPreviewModalOpen] = useState<boolean>(false);
  const [quickShareBusy, setQuickShareBusy] = useState<boolean>(false);
  const [quickShareError, setQuickShareError] = useState<string | null>(null);

  // Add/Edit Form Modal State
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

  // Overall lifetime totals
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

  const activeAnchor =
    dashboardPeriod === 'daily'
      ? selectedDay
      : dashboardPeriod === 'weekly'
        ? selectedWeekDate
        : selectedMonth;

  const activeReport = useMemo(
    () => buildExpenseReport(transactions, dashboardPeriod, activeAnchor),
    [transactions, dashboardPeriod, activeAnchor]
  );

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

  const handleAnchorChange = (val: string) => {
    if (dashboardPeriod === 'daily') setSelectedDay(val);
    else if (dashboardPeriod === 'weekly') setSelectedWeekDate(val);
    else setSelectedMonth(val);
  };

  const handleShiftPeriod = (delta: -1 | 1) => {
    const nextAnchor = shiftPeriodAnchor(dashboardPeriod, activeAnchor, delta);
    handleAnchorChange(nextAnchor);
  };

  const handleQuickShare = async () => {
    setQuickShareBusy(true);
    setQuickShareError(null);
    try {
      const generated = createExpenseReportPdf(activeReport, {
        language,
        t,
      });
      await sharePdfBlob(
        generated.blob,
        getReportFilename(activeReport),
        t.pdfLabels.reportTitle
      );
    } catch {
      setQuickShareError(t.exportError);
    } finally {
      setQuickShareBusy(false);
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
      {/* Wallet Remaining Balance Hero Card — Deep Navy + Cyan + Yellow */}
      <section className="rounded-3xl bg-gradient-to-br from-[#06122E] via-[#0B204F] to-[#0E316C] border border-cyan-500/35 text-white p-5 sm:p-6 space-y-4 shadow-sm">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-xs font-semibold text-cyan-200">{t.balanceLabel}</p>
            <p className="text-3xl sm:text-4xl font-extrabold tabular-nums mt-1 text-white">
              {overall.balance < 0 ? '-' : ''}
              {formatPKR(overall.balance)}
            </p>
          </div>

          <button
            type="button"
            data-testid="expense-open-pdf-btn"
            onClick={() => setPreviewModalOpen(true)}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-yellow-400 hover:bg-yellow-300 text-[#040D21] text-xs font-bold min-h-[40px] shrink-0 transition-colors"
          >
            <Eye className="w-4 h-4" />
            <span>{t.exportPdfBtn}</span>
          </button>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="rounded-2xl bg-[#040D21]/65 border border-cyan-400/25 p-3.5">
            <div className="flex items-center gap-1.5 text-xs text-cyan-200">
              <ArrowDownLeft className="w-3.5 h-3.5 text-cyan-400" />
              <span>{t.incomeLabel}</span>
            </div>
            <p className="text-base sm:text-lg font-bold tabular-nums mt-1 text-white">
              {formatPKR(overall.income)}
            </p>
          </div>
          <div className="rounded-2xl bg-[#040D21]/65 border border-yellow-400/25 p-3.5">
            <div className="flex items-center gap-1.5 text-xs text-yellow-200">
              <ArrowUpRight className="w-3.5 h-3.5 text-yellow-400" />
              <span>{t.expensesLabel}</span>
            </div>
            <p className="text-base sm:text-lg font-bold tabular-nums mt-1 text-white">
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
          className="inline-flex items-center justify-center gap-2 py-3 px-4 rounded-2xl bg-cyan-500 hover:bg-cyan-400 text-[#040D21] text-sm font-bold min-h-[48px] transition-colors"
        >
          <Plus className="w-4 h-4" />
          <span>{t.typeIncome}</span>
        </button>
        <button
          type="button"
          onClick={() => openNewForm('expense')}
          className="inline-flex items-center justify-center gap-2 py-3 px-4 rounded-2xl bg-yellow-400 hover:bg-yellow-300 text-[#040D21] text-sm font-bold min-h-[48px] transition-colors"
        >
          <Plus className="w-4 h-4" />
          <span>{t.typeExpense}</span>
        </button>
      </div>

      {quickShareError && (
        <p
          role="alert"
          className="text-xs font-semibold text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900/60 rounded-xl p-3"
        >
          {quickShareError}
        </p>
      )}

      {/* Modern Daily / Weekly / Monthly Reports Dashboard */}
      <ExpenseReportsDashboard
        t={t}
        period={dashboardPeriod}
        dayAnchor={selectedDay}
        weekAnchor={selectedWeekDate}
        monthAnchor={selectedMonth}
        report={activeReport}
        onSelectPeriod={setDashboardPeriod}
        onChangeAnchor={handleAnchorChange}
        onShiftPeriod={handleShiftPeriod}
        onOpenPreview={() => setPreviewModalOpen(true)}
        onQuickShare={() => void handleQuickShare()}
        shareBusy={quickShareBusy}
      />

      {/* Transaction History */}
      <section className="space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2 className="text-base font-bold text-slate-900 dark:text-white">
            {t.historyTitle} ({filteredHistory.length})
          </h2>

          <div className="flex items-center gap-1 p-1 rounded-xl bg-slate-100 dark:bg-[#0B1836] border border-slate-200 dark:border-[#1B315E]">
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
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors min-h-[36px] ${
                    active
                      ? 'bg-cyan-500 text-[#040D21]'
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
          <div className="rounded-2xl bg-white dark:bg-[#0B1836] border border-dashed border-slate-200 dark:border-[#1B315E] p-8 text-center text-sm text-slate-500 dark:text-slate-400">
            {t.noTransactions}
          </div>
        ) : (
          <div className="space-y-2.5">
            {filteredHistory.map((tx) => (
              <div
                key={tx.id}
                className="rounded-2xl bg-white dark:bg-[#0B1836] border border-slate-200 dark:border-[#1B315E] p-4 flex items-center justify-between gap-3"
              >
                <div className="flex items-center gap-3 min-w-0 flex-1">
                  <span
                    className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                      tx.type === 'income'
                        ? 'bg-cyan-50 dark:bg-cyan-500/15 text-cyan-700 dark:text-cyan-300'
                        : 'bg-amber-50 dark:bg-yellow-500/15 text-amber-700 dark:text-yellow-300'
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
                        ? 'text-cyan-700 dark:text-cyan-300'
                        : 'text-amber-700 dark:text-yellow-300'
                    }`}
                  >
                    {tx.type === 'income' ? '+' : '-'}
                    {formatPKR(tx.amount)}
                  </span>
                  <button
                    type="button"
                    onClick={() => openEditForm(tx)}
                    aria-label="Edit transaction"
                    className="min-w-[36px] min-h-[36px] flex items-center justify-center rounded-xl text-cyan-700 dark:text-cyan-300 hover:bg-cyan-50 dark:hover:bg-[#11244D]"
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

      {/* Visual PDF Preview & Folder Export / Share Modal */}
      <PdfPreviewModal
        open={previewModalOpen}
        language={language}
        t={t}
        period={dashboardPeriod}
        dayAnchor={selectedDay}
        weekAnchor={selectedWeekDate}
        monthAnchor={selectedMonth}
        report={activeReport}
        onChangePeriod={setDashboardPeriod}
        onChangeDayAnchor={setSelectedDay}
        onChangeWeekAnchor={setSelectedWeekDate}
        onChangeMonthAnchor={setSelectedMonth}
        onClose={() => setPreviewModalOpen(false)}
      />

      {/* Add / Edit Transaction Modal */}
      {formOpen && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="tx-modal-title"
          className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-[#020817]/75 backdrop-blur-sm"
        >
          <form
            onSubmit={handleSaveTransaction}
            className="w-full sm:max-w-md rounded-t-3xl sm:rounded-3xl bg-white dark:bg-[#0B1836] border border-slate-200 dark:border-[#1B315E] p-6 pb-[max(1.5rem,calc(env(safe-area-inset-bottom,0px)+1rem))] space-y-4 shadow-xl max-h-[90dvh] overflow-y-auto"
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
                className="min-w-[38px] min-h-[38px] flex items-center justify-center rounded-xl text-slate-500 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-[#11244D]"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Income / Expense Type Selector */}
            <div className="grid grid-cols-2 gap-2 p-1 rounded-xl bg-slate-100 dark:bg-[#061026]">
              <button
                type="button"
                onClick={() => handleTypeSwitch('income')}
                className={`py-2 rounded-lg text-xs font-bold min-h-[40px] transition-colors ${
                  txType === 'income'
                    ? 'bg-cyan-500 text-[#040D21]'
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
                    ? 'bg-yellow-400 text-[#040D21]'
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
                  className="w-full h-11 px-3.5 rounded-xl bg-slate-50 dark:bg-[#061026] border border-slate-200 dark:border-[#213B70] text-sm font-mono tabular-nums text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-cyan-400"
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
                  className="w-full h-11 px-3.5 rounded-xl bg-slate-50 dark:bg-[#061026] border border-slate-200 dark:border-[#213B70] text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-cyan-400"
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
                    className="w-full h-11 px-3 rounded-xl bg-slate-50 dark:bg-[#061026] border border-slate-200 dark:border-[#213B70] text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-cyan-400"
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
                    className="w-full h-11 px-3 rounded-xl bg-slate-50 dark:bg-[#061026] border border-slate-200 dark:border-[#213B70] text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-cyan-400"
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
                className="flex-1 py-2.5 px-4 rounded-xl bg-slate-100 dark:bg-[#11244D] text-slate-800 dark:text-slate-200 text-sm font-semibold min-h-[44px]"
              >
                {t.cancelBtn}
              </button>
              <button
                type="submit"
                className="flex-1 py-2.5 px-4 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-[#040D21] text-sm font-bold min-h-[44px]"
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
          className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-[#020817]/75 backdrop-blur-sm"
        >
          <div className="w-full sm:max-w-sm rounded-t-3xl sm:rounded-3xl bg-white dark:bg-[#0B1836] border border-slate-200 dark:border-[#1B315E] p-6 pb-[max(1.5rem,calc(env(safe-area-inset-bottom,0px)+1rem))] space-y-4 shadow-xl">
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
                className="flex-1 py-2.5 px-4 rounded-xl bg-slate-100 dark:bg-[#11244D] text-slate-800 dark:text-slate-200 text-sm font-semibold min-h-[44px]"
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
