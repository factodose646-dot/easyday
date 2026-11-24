import React, { useEffect, useMemo, useState } from 'react';
import {
  Calendar,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  ExternalLink,
  FileDown,
  FileText,
  FolderOpen,
  Info,
  MessageCircle,
  Phone,
  Share2,
  X,
  ZoomIn,
  ZoomOut,
} from 'lucide-react';
import { ToolTranslationBundle } from '../../i18n/toolTranslations';
import { Language } from '../../types';
import {
  canSharePdfFiles,
  openSavedAndroidPdf,
  sanitizePdfFilename,
  saveExpenseReportPdf,
  sharePdfBlob,
  supportsCustomSavePath,
} from '../../utils/expenseReport';
import { getTodayISO, UdhaarContact, UdhaarTransaction } from '../../utils/storage';
import {
  buildCustomerUdhaarStatement,
  buildStatementShareCaption,
  createUdhaarStatementPreviewBundle,
  formatStatementCurrencyPKR,
  formatStatementRangeText,
  getUdhaarStatementFilename,
  StatementDatePreset,
} from '../../utils/udhaarStatement';

interface UdhaarStatementModalProps {
  open: boolean;
  contact: UdhaarContact | null;
  transactions: UdhaarTransaction[];
  language: Language;
  t: ToolTranslationBundle['udhaar'];
  onClose: () => void;
}

type ModalTab = 'preview' | 'ledger';

export const UdhaarStatementModal: React.FC<UdhaarStatementModalProps> = ({
  open,
  contact,
  transactions,
  language,
  t,
  onClose,
}) => {
  const sLabels = t.statement;
  const pdfLabels = sLabels.pdf;

  const [preset, setPreset] = useState<StatementDatePreset>('all');
  const [customStartDate, setCustomStartDate] = useState<string>(() => {
    const today = getTodayISO();
    return `${today.slice(0, 7)}-01`;
  });
  const [customEndDate, setCustomEndDate] = useState<string>(() => getTodayISO());
  const [activeTab, setActiveTab] = useState<ModalTab>('preview');
  const [activePageIdx, setActivePageIdx] = useState<number>(0);
  const [zoomed, setZoomed] = useState<boolean>(false);
  const [filenameInput, setFilenameInput] = useState<string>('');
  const [busyAction, setBusyAction] = useState<'save' | 'share' | null>(null);
  const [status, setStatus] = useState<{
    kind: 'success' | 'info' | 'error';
    message: string;
    androidUri?: string;
  } | null>(null);

  const shareSupported = useMemo(() => canSharePdfFiles(), []);
  const customPathSupported = useMemo(() => supportsCustomSavePath(), []);

  const statement = useMemo(() => {
    if (!open || !contact) return null;
    return buildCustomerUdhaarStatement(contact, transactions, {
      preset,
      customStartDate,
      customEndDate,
    });
  }, [open, contact, transactions, preset, customStartDate, customEndDate]);

  const defaultFilename = useMemo(
    () => (statement ? getUdhaarStatementFilename(statement) : 'EasyDay-Statement.pdf'),
    [statement]
  );

  useEffect(() => {
    if (!open || !contact) return;
    setPreset('all');
    setActiveTab('preview');
    setActivePageIdx(0);
    setZoomed(false);
    setStatus(null);
  }, [open, contact]);

  useEffect(() => {
    if (!open) return;
    setFilenameInput(defaultFilename);
    setActivePageIdx(0);
    setStatus(null);
  }, [open, defaultFilename]);

  const previewBundle = useMemo(() => {
    if (!open || !statement) return null;
    try {
      return createUdhaarStatementPreviewBundle(statement, t, language);
    } catch {
      return null;
    }
  }, [open, statement, t, language]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !busyAction) {
        onClose();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, busyAction, onClose]);

  if (!open || !contact || !statement) return null;

  const pageCount = previewBundle?.pageImages.length
    ? previewBundle.pageImages.length
    : previewBundle?.pdf.pageCount ?? 1;
  const safePageIdx = Math.min(activePageIdx, Math.max(0, pageCount - 1));
  const currentPageSrc = previewBundle?.pageImages[safePageIdx] ?? null;

  const standingBadgeClass =
    statement.accountStanding === 'receivable'
      ? 'bg-cyan-500/15 text-cyan-700 dark:text-cyan-300 border border-cyan-500/30'
      : statement.accountStanding === 'payable'
        ? 'bg-amber-500/15 text-amber-800 dark:text-yellow-300 border border-amber-500/30'
        : 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30';

  const standingLabel =
    statement.accountStanding === 'receivable'
      ? sLabels.statusReceivable
      : statement.accountStanding === 'payable'
        ? sLabels.statusPayable
        : sLabels.statusSettled;

  const handleSavePdf = async () => {
    if (!previewBundle) return;
    setBusyAction('save');
    setStatus(null);
    try {
      const targetName = sanitizePdfFilename(filenameInput, defaultFilename);
      const outcome = await saveExpenseReportPdf(previewBundle.pdf.blob, targetName);
      if (outcome.status === 'cancelled') {
        setStatus({ kind: 'info', message: sLabels.exportCancelled });
      } else {
        const msg =
          outcome.method === 'android-picker' ||
          outcome.method === 'browser-download'
            ? `${sLabels.exportSavedLocation} ${outcome.locationLabel}`
            : `${sLabels.exportSuccess} ${outcome.filename}`;
        setStatus({
          kind: 'success',
          message: msg,
          androidUri: outcome.androidUri,
        });
      }
    } catch {
      setStatus({ kind: 'error', message: sLabels.exportError });
    } finally {
      setBusyAction(null);
    }
  };

  const handleSharePdf = async () => {
    if (!previewBundle) return;
    setBusyAction('share');
    setStatus(null);
    try {
      const targetName = sanitizePdfFilename(filenameInput, defaultFilename);
      const caption = buildStatementShareCaption(statement, language, sLabels);
      const outcome = await sharePdfBlob(
        previewBundle.pdf.blob,
        targetName,
        `${contact.name} — ${pdfLabels.title}`,
        caption
      );
      if (outcome === 'shared') {
        setStatus({
          kind: 'success',
          message: `${sLabels.exportSuccess} ${targetName}`,
        });
      } else {
        setStatus({ kind: 'info', message: sLabels.shareCancelled });
      }
    } catch {
      setStatus({ kind: 'error', message: sLabels.exportError });
    } finally {
      setBusyAction(null);
    }
  };

  const handleOpenSaved = async (uri: string) => {
    const opened = await openSavedAndroidPdf(uri);
    if (!opened) {
      setStatus({
        kind: 'info',
        message: sLabels.noPdfViewerFound,
        androidUri: uri,
      });
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="udhaar-statement-modal-title"
      data-testid="udhaar-statement-modal"
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-[#020817]/80 backdrop-blur-md"
    >
      <div className="w-full sm:max-w-3xl rounded-t-3xl sm:rounded-3xl bg-white dark:bg-[#0B1836] border border-slate-200 dark:border-cyan-500/25 shadow-2xl flex flex-col max-h-[94dvh] overflow-hidden">
        {/* Header */}
        <div className="px-5 py-4 border-b border-slate-200 dark:border-[#1B315E] flex items-center justify-between gap-3 bg-slate-50/90 dark:bg-[#07122B]">
          <div className="flex items-center gap-3 min-w-0">
            <span className="w-10 h-10 rounded-xl bg-cyan-500/15 border border-cyan-500/30 text-cyan-700 dark:text-cyan-300 flex items-center justify-center shrink-0">
              <FileText className="w-5 h-5" />
            </span>
            <div className="min-w-0">
              <h3
                id="udhaar-statement-modal-title"
                className="text-base sm:text-lg font-bold text-slate-900 dark:text-white truncate"
              >
                {sLabels.modalTitle}
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 truncate">
                {sLabels.modalSubtitle}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            disabled={busyAction !== null}
            aria-label={t.cancelBtn}
            className="min-w-[40px] min-h-[40px] rounded-xl flex items-center justify-center text-slate-500 dark:text-slate-300 hover:bg-slate-200/70 dark:hover:bg-[#13264F]"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4">
          {/* Customer Identity + Account Standing Badge */}
          <div className="rounded-2xl bg-slate-50 dark:bg-[#061026] border border-slate-200 dark:border-[#1B315E] p-3.5 flex flex-wrap items-center justify-between gap-3">
            <div className="min-w-0 space-y-0.5">
              <p className="text-sm sm:text-base font-extrabold text-slate-900 dark:text-white truncate">
                {contact.name}
              </p>
              {contact.phone && (
                <p className="inline-flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400 tabular-nums">
                  <Phone className="w-3.5 h-3.5" />
                  <span>{contact.phone}</span>
                </p>
              )}
            </div>

            <span
              data-testid="statement-standing-badge"
              className={`inline-flex items-center px-3 py-1 rounded-lg text-xs font-bold whitespace-nowrap ${standingBadgeClass}`}
            >
              {standingLabel}
            </span>
          </div>

          {/* Date Range Filter */}
          <div className="rounded-2xl bg-slate-50 dark:bg-[#061026] border border-slate-200 dark:border-[#1B315E] p-3 space-y-3">
            <div className="flex items-center gap-2 text-xs font-bold text-slate-700 dark:text-slate-300">
              <Calendar className="w-4 h-4 text-cyan-600 dark:text-cyan-400" />
              <span>{pdfLabels.dateRangeLabel}</span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5 p-1 rounded-xl bg-slate-200/70 dark:bg-[#0B1836]">
              {(
                [
                  { id: 'all', label: sLabels.rangeAllTime },
                  { id: 'current-month', label: sLabels.rangeCurrentMonth },
                  { id: 'previous-month', label: sLabels.rangePreviousMonth },
                  { id: 'custom', label: sLabels.rangeCustom },
                ] as const
              ).map((item) => {
                const active = preset === item.id;
                return (
                  <button
                    key={item.id}
                    type="button"
                    data-testid={`statement-range-${item.id}`}
                    onClick={() => setPreset(item.id)}
                    className={`py-2 px-2 rounded-lg text-xs font-bold min-h-[36px] whitespace-nowrap transition-colors ${
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

            {preset === 'custom' && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                <label className="space-y-1">
                  <span className="block text-[11px] font-semibold text-slate-500 dark:text-slate-400">
                    {sLabels.fromDateLabel}
                  </span>
                  <input
                    type="date"
                    value={customStartDate}
                    onChange={(e) => setCustomStartDate(e.target.value)}
                    className="w-full h-10 px-3 rounded-xl bg-white dark:bg-[#0B1836] border border-slate-200 dark:border-[#213B70] text-xs font-semibold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-cyan-400"
                  />
                </label>
                <label className="space-y-1">
                  <span className="block text-[11px] font-semibold text-slate-500 dark:text-slate-400">
                    {sLabels.toDateLabel}
                  </span>
                  <input
                    type="date"
                    value={customEndDate}
                    onChange={(e) => setCustomEndDate(e.target.value)}
                    className="w-full h-10 px-3 rounded-xl bg-white dark:bg-[#0B1836] border border-slate-200 dark:border-[#213B70] text-xs font-semibold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-cyan-400"
                  />
                </label>
              </div>
            )}
          </div>

          {/* Overall Current Standing vs Period Activity */}
          <div className="space-y-2">
            <p className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              {sLabels.overallStandingTitle}
            </p>
            <div className="grid grid-cols-3 gap-2.5 tabular-nums">
              <div className="rounded-2xl bg-slate-50 dark:bg-[#061026] border border-slate-200 dark:border-[#1B315E] p-3">
                <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
                  {pdfLabels.totalOriginalLabel}
                </p>
                <p className="text-sm font-extrabold text-slate-900 dark:text-white mt-0.5">
                  {formatStatementCurrencyPKR(statement.overallTotalOriginal)}
                </p>
              </div>
              <div className="rounded-2xl bg-slate-50 dark:bg-[#061026] border border-slate-200 dark:border-[#1B315E] p-3">
                <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
                  {pdfLabels.totalPaidLabel}
                </p>
                <p className="text-sm font-extrabold text-emerald-600 dark:text-emerald-400 mt-0.5">
                  {formatStatementCurrencyPKR(statement.overallTotalPaid)}
                </p>
              </div>
              <div className="rounded-2xl bg-[#040D21] border border-cyan-500/35 p-3">
                <p className="text-[11px] text-cyan-200 truncate">
                  {pdfLabels.remainingBalanceLabel}
                </p>
                <p
                  className={`text-sm font-extrabold mt-0.5 ${
                    statement.accountStanding === 'receivable'
                      ? 'text-cyan-300'
                      : statement.accountStanding === 'payable'
                        ? 'text-yellow-300'
                        : 'text-emerald-300'
                  }`}
                >
                  {formatStatementCurrencyPKR(Math.abs(statement.overallNetBalance))}
                </p>
              </div>
            </div>

            {preset !== 'all' && (
              <div className="rounded-xl bg-cyan-50/70 dark:bg-cyan-500/10 border border-cyan-200 dark:border-cyan-500/25 px-3.5 py-2.5 flex flex-wrap items-center justify-between gap-2 text-xs tabular-nums">
                <span className="font-bold text-cyan-800 dark:text-cyan-200">
                  {sLabels.periodActivityTitle}: {formatStatementRangeText(statement.range, sLabels)}
                </span>
                <span className="text-slate-700 dark:text-slate-200 font-semibold">
                  {sLabels.periodEntriesLabel}: {formatStatementCurrencyPKR(statement.periodTotalOriginal)} ·{' '}
                  {sLabels.periodPaymentsLabel}: {formatStatementCurrencyPKR(statement.periodTotalPaid)}
                </span>
              </div>
            )}
          </div>

          {/* Modal View Mode Toggle: PDF Preview vs Ledger History */}
          <div className="grid grid-cols-2 gap-1.5 p-1 rounded-xl bg-slate-100 dark:bg-[#061026] border border-slate-200 dark:border-[#1B315E]">
            <button
              type="button"
              data-testid="statement-tab-preview"
              onClick={() => setActiveTab('preview')}
              className={`py-2 px-3 rounded-lg text-xs font-bold min-h-[38px] transition-colors ${
                activeTab === 'preview'
                  ? 'bg-[#040D21] dark:bg-cyan-500 text-white dark:text-[#040D21] shadow-sm'
                  : 'text-slate-600 dark:text-slate-300'
              }`}
            >
              {sLabels.pdfPreviewTabLabel} ({pageCount})
            </button>
            <button
              type="button"
              data-testid="statement-tab-ledger"
              onClick={() => setActiveTab('ledger')}
              className={`py-2 px-3 rounded-lg text-xs font-bold min-h-[38px] transition-colors ${
                activeTab === 'ledger'
                  ? 'bg-[#040D21] dark:bg-cyan-500 text-white dark:text-[#040D21] shadow-sm'
                  : 'text-slate-600 dark:text-slate-300'
              }`}
            >
              {sLabels.summaryTabLabel} ({statement.paymentHistory.length})
            </button>
          </div>

          {activeTab === 'preview' ? (
            <div className="rounded-2xl bg-slate-100 dark:bg-[#040D21] border border-slate-200 dark:border-[#1B315E] overflow-hidden">
              <div className="px-3.5 py-2.5 border-b border-slate-200 dark:border-[#1B315E] bg-white/80 dark:bg-[#08142E] flex flex-wrap items-center justify-between gap-2 text-xs">
                <span className="font-semibold text-slate-700 dark:text-cyan-300 tabular-nums">
                  {formatStatementRangeText(statement.range, sLabels)}
                </span>

                <div className="flex items-center gap-2">
                  {pageCount > 1 && (
                    <div className="inline-flex items-center gap-1 rounded-lg bg-slate-100 dark:bg-[#0E2044] p-0.5">
                      <button
                        type="button"
                        disabled={safePageIdx === 0}
                        onClick={() => setActivePageIdx((p) => Math.max(0, p - 1))}
                        aria-label={sLabels.prevPageAria}
                        className="min-w-[30px] min-h-[30px] flex items-center justify-center rounded-md text-slate-700 dark:text-slate-200 disabled:opacity-40"
                      >
                        <ChevronLeft className="w-4 h-4 rtl:rotate-180" />
                      </button>
                      <span className="px-2 font-semibold text-slate-800 dark:text-white tabular-nums whitespace-nowrap">
                        {pdfLabels.pageLabel} {safePageIdx + 1} {pdfLabels.ofLabel} {pageCount}
                      </span>
                      <button
                        type="button"
                        disabled={safePageIdx >= pageCount - 1}
                        onClick={() =>
                          setActivePageIdx((p) => Math.min(pageCount - 1, p + 1))
                        }
                        aria-label={sLabels.nextPageAria}
                        className="min-w-[30px] min-h-[30px] flex items-center justify-center rounded-md text-slate-700 dark:text-slate-200 disabled:opacity-40"
                      >
                        <ChevronRight className="w-4 h-4 rtl:rotate-180" />
                      </button>
                    </div>
                  )}

                  {currentPageSrc && (
                    <button
                      type="button"
                      onClick={() => setZoomed((z) => !z)}
                      className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-slate-200/70 dark:bg-[#0E2044] text-slate-700 dark:text-yellow-300 font-semibold min-h-[30px] whitespace-nowrap"
                    >
                      {zoomed ? (
                        <>
                          <ZoomOut className="w-3.5 h-3.5" />
                          <span>{sLabels.zoomFitLabel}</span>
                        </>
                      ) : (
                        <>
                          <ZoomIn className="w-3.5 h-3.5" />
                          <span>{sLabels.zoomActualLabel}</span>
                        </>
                      )}
                    </button>
                  )}
                </div>
              </div>

              <div className="p-3 sm:p-4 max-h-[340px] sm:max-h-[400px] overflow-auto flex justify-center">
                {currentPageSrc ? (
                  <div
                    className={`transition-all duration-150 shadow-xl rounded-lg overflow-hidden border border-slate-300 dark:border-[#1B315E] bg-white ${
                      zoomed ? 'w-[140%] min-w-[540px] max-w-none' : 'w-full max-w-[460px]'
                    }`}
                  >
                    <img
                      src={currentPageSrc}
                      alt={`${pdfLabels.title} - ${pdfLabels.pageLabel} ${safePageIdx + 1}`}
                      data-testid="statement-pdf-preview-image"
                      className="w-full h-auto block select-none"
                      draggable={false}
                    />
                  </div>
                ) : (
                  /* Structured fallback preview when headless / SSR */
                  <div className="w-full max-w-md rounded-xl bg-white text-slate-900 p-4 space-y-3 border border-slate-200">
                    <div className="rounded-lg bg-[#040D21] text-white p-3 flex items-center justify-between gap-2">
                      <div>
                        <p className="text-sm font-bold">{pdfLabels.title}</p>
                        <p className="text-[11px] text-cyan-200">{contact.name}</p>
                      </div>
                      <span className="px-2 py-0.5 rounded bg-yellow-400 text-[#040D21] text-[10px] font-bold">
                        {standingLabel}
                      </span>
                    </div>
                    <p className="text-xs text-slate-600 tabular-nums">
                      {pdfLabels.dateRangeLabel}: {formatStatementRangeText(statement.range, sLabels)}
                    </p>
                    <div className="grid grid-cols-3 gap-2 text-xs tabular-nums">
                      <div className="p-2 rounded bg-slate-100">
                        <p className="text-[10px] text-slate-500">{pdfLabels.totalOriginalLabel}</p>
                        <p className="font-bold">
                          {formatStatementCurrencyPKR(statement.overallTotalOriginal)}
                        </p>
                      </div>
                      <div className="p-2 rounded bg-emerald-50">
                        <p className="text-[10px] text-slate-500">{pdfLabels.totalPaidLabel}</p>
                        <p className="font-bold text-emerald-700">
                          {formatStatementCurrencyPKR(statement.overallTotalPaid)}
                        </p>
                      </div>
                      <div className="p-2 rounded bg-cyan-50">
                        <p className="text-[10px] text-slate-500">{pdfLabels.remainingBalanceLabel}</p>
                        <p className="font-bold text-cyan-800">
                          {formatStatementCurrencyPKR(Math.abs(statement.overallNetBalance))}
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Entries in Period */}
              <div className="rounded-2xl bg-slate-50 dark:bg-[#061026] border border-slate-200 dark:border-[#1B315E] p-3.5 space-y-2.5">
                <h4 className="text-xs font-bold text-slate-900 dark:text-white">
                  {pdfLabels.entriesHeading} ({statement.entriesInPeriod.length})
                </h4>
                {statement.entriesInPeriod.length === 0 ? (
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    {pdfLabels.noEntriesInPeriod}
                  </p>
                ) : (
                  <div className="space-y-2">
                    {statement.entriesInPeriod.map((entry) => (
                      <div
                        key={entry.id}
                        className="rounded-xl bg-white dark:bg-[#0B1836] border border-slate-200 dark:border-[#1B315E] p-2.5 flex flex-wrap items-center justify-between gap-2 text-xs"
                      >
                        <div className="min-w-0 space-y-0.5">
                          <div className="flex items-center gap-2">
                            <span className="text-slate-500 dark:text-slate-400 tabular-nums">
                              {entry.date}
                            </span>
                            <span
                              className={`px-2 py-0.5 rounded font-bold text-[10px] ${
                                entry.direction === 'given'
                                  ? 'bg-cyan-500/15 text-cyan-700 dark:text-cyan-300'
                                  : 'bg-amber-500/15 text-amber-800 dark:text-yellow-300'
                              }`}
                            >
                              {entry.direction === 'given'
                                ? pdfLabels.givenShort
                                : pdfLabels.borrowedShort}
                            </span>
                          </div>
                          <p className="font-semibold text-slate-900 dark:text-white truncate">
                            {entry.description}
                          </p>
                        </div>

                        <div className="text-end tabular-nums">
                          <p className="font-bold text-slate-900 dark:text-white">
                            {formatStatementCurrencyPKR(entry.originalAmount)}
                          </p>
                          <p className="text-[11px] text-slate-500 dark:text-slate-400">
                            {pdfLabels.paidCol}: {formatStatementCurrencyPKR(entry.paidAmount)} ·{' '}
                            {pdfLabels.balanceCol}: {formatStatementCurrencyPKR(entry.remainingAmount)}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Chronological Payment History */}
              <div className="rounded-2xl bg-slate-50 dark:bg-[#061026] border border-slate-200 dark:border-[#1B315E] p-3.5 space-y-2.5">
                <h4 className="text-xs font-bold text-slate-900 dark:text-white">
                  {pdfLabels.paymentHistoryHeading} ({statement.paymentHistory.length})
                </h4>
                {statement.paymentHistory.length === 0 ? (
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    {pdfLabels.noPaymentsInPeriod}
                  </p>
                ) : (
                  <div className="space-y-2">
                    {statement.paymentHistory.map((pay) => (
                      <div
                        key={pay.id}
                        className="rounded-xl bg-white dark:bg-[#0B1836] border border-slate-200 dark:border-[#1B315E] p-2.5 flex flex-wrap items-center justify-between gap-2 text-xs"
                      >
                        <div className="min-w-0 space-y-0.5">
                          <p className="text-slate-500 dark:text-slate-400 tabular-nums">
                            {pay.date}
                          </p>
                          <p className="font-semibold text-slate-900 dark:text-white truncate">
                            {pay.description}
                          </p>
                        </div>

                        <div className="text-end tabular-nums">
                          <p className="font-bold text-emerald-600 dark:text-emerald-400">
                            {formatStatementCurrencyPKR(pay.amount)}
                          </p>
                          <p className="text-[11px] text-slate-500 dark:text-slate-400">
                            {pdfLabels.prevBalanceCol}:{' '}
                            {formatStatementCurrencyPKR(pay.previousBalance)} →{' '}
                            {pdfLabels.remBalanceCol}:{' '}
                            {formatStatementCurrencyPKR(pay.remainingBalance)}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Filename & Save/WhatsApp Hint */}
          <div className="space-y-1.5">
            <label
              htmlFor="statement-pdf-filename-input"
              className="block text-xs font-semibold text-slate-700 dark:text-slate-300"
            >
              {sLabels.filenameLabel}
            </label>
            <input
              id="statement-pdf-filename-input"
              type="text"
              value={filenameInput}
              onChange={(e) => {
                setFilenameInput(e.target.value);
                setStatus(null);
              }}
              placeholder={defaultFilename}
              className="w-full h-11 px-3.5 rounded-xl bg-slate-50 dark:bg-[#061026] border border-slate-200 dark:border-[#213B70] text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-cyan-400"
            />
            {customPathSupported && (
              <p className="text-[11px] text-slate-500 dark:text-slate-400 flex items-start gap-1.5">
                <FolderOpen className="w-3.5 h-3.5 shrink-0 mt-0.5 text-cyan-600 dark:text-cyan-400" />
                <span>{sLabels.exportPathHint}</span>
              </p>
            )}
            {shareSupported && (
              <p className="text-[11px] text-slate-500 dark:text-slate-400 flex items-start gap-1.5">
                <MessageCircle className="w-3.5 h-3.5 shrink-0 mt-0.5 text-emerald-600 dark:text-emerald-400" />
                <span>{sLabels.whatsappShareHint}</span>
              </p>
            )}
          </div>

          {status && (
            <div
              role={status.kind === 'error' ? 'alert' : 'status'}
              className={`text-xs font-semibold rounded-xl p-3 space-y-2 ${
                status.kind === 'success'
                  ? 'bg-cyan-50 dark:bg-cyan-500/15 text-cyan-900 dark:text-cyan-200 border border-cyan-200 dark:border-cyan-500/35'
                  : status.kind === 'info'
                    ? 'bg-slate-100 dark:bg-[#0E2044] text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-[#1B315E]'
                    : 'bg-red-50 dark:bg-red-950/40 text-red-700 dark:text-red-300 border border-red-200 dark:border-red-900/60'
              }`}
            >
              <div className="flex items-start gap-2">
                {status.kind === 'success' && (
                  <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5 text-cyan-600 dark:text-cyan-400" />
                )}
                {status.kind === 'info' && (
                  <Info className="w-4 h-4 shrink-0 mt-0.5" />
                )}
                <span className="break-words">{status.message}</span>
              </div>

              {status.androidUri && (
                <button
                  type="button"
                  onClick={() => void handleOpenSaved(status.androidUri!)}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-yellow-400 hover:bg-yellow-300 text-[#040D21] text-xs font-bold min-h-[34px]"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  <span>{sLabels.openPdfBtn}</span>
                </button>
              )}
            </div>
          )}
        </div>

        {/* Sticky Footer */}
        <div className="px-5 py-4 pb-[max(1rem,calc(env(safe-area-inset-bottom,0px)+0.75rem))] border-t border-slate-200 dark:border-[#1B315E] bg-slate-50/90 dark:bg-[#07122B] flex flex-wrap gap-2.5">
          <button
            type="button"
            disabled={busyAction !== null}
            onClick={onClose}
            className="px-4 py-2.5 rounded-xl bg-slate-200/80 dark:bg-[#11244D] hover:bg-slate-300/80 dark:hover:bg-[#193268] text-slate-800 dark:text-slate-200 text-sm font-semibold min-h-[44px]"
          >
            {t.cancelBtn}
          </button>

          {shareSupported && (
            <button
              type="button"
              data-testid="statement-share-whatsapp-btn"
              disabled={busyAction !== null || !previewBundle}
              onClick={() => void handleSharePdf()}
              className="inline-flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:opacity-60 text-white text-sm font-bold min-h-[44px] transition-colors"
            >
              <Share2 className="w-4 h-4" />
              <span>{sLabels.whatsappSharePdfBtn}</span>
            </button>
          )}

          <button
            type="button"
            data-testid="statement-download-pdf-btn"
            disabled={busyAction !== null || !previewBundle}
            onClick={() => void handleSavePdf()}
            className="flex-1 inline-flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-cyan-500 hover:bg-cyan-400 disabled:opacity-60 text-[#040D21] text-sm font-bold min-h-[44px] transition-colors whitespace-nowrap"
          >
            {customPathSupported ? (
              <FolderOpen className="w-4 h-4" />
            ) : (
              <FileDown className="w-4 h-4" />
            )}
            <span>
              {busyAction === 'save'
                ? sLabels.generatingPdf
                : customPathSupported
                  ? sLabels.choosePathAndSaveBtn
                  : sLabels.downloadPdfBtn}
            </span>
          </button>
        </div>
      </div>
    </div>
  );
};
