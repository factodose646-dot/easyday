import React, { useEffect, useMemo, useState } from 'react';
import {
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  ExternalLink,
  FileDown,
  FileText,
  FolderOpen,
  Info,
  Share2,
  X,
  ZoomIn,
  ZoomOut,
} from 'lucide-react';
import { ToolTranslationBundle } from '../../i18n/toolTranslations';
import { Language } from '../../types';
import {
  canSharePdfFiles,
  createExpenseReportPreviewBundle,
  ExpenseReportData,
  formatReportPKR,
  formatReportRangeLabel,
  getReportFilename,
  openSavedAndroidPdf,
  ReportPeriodType,
  sanitizePdfFilename,
  saveExpenseReportPdf,
  sharePdfBlob,
  supportsCustomSavePath,
} from '../../utils/expenseReport';

interface PdfPreviewModalProps {
  open: boolean;
  language: Language;
  t: ToolTranslationBundle['expense'];
  period: ReportPeriodType;
  dayAnchor: string;
  weekAnchor: string;
  monthAnchor: string;
  report: ExpenseReportData;
  onChangePeriod: (period: ReportPeriodType) => void;
  onChangeDayAnchor: (val: string) => void;
  onChangeWeekAnchor: (val: string) => void;
  onChangeMonthAnchor: (val: string) => void;
  onClose: () => void;
}

export const PdfPreviewModal: React.FC<PdfPreviewModalProps> = ({
  open,
  language,
  t,
  period,
  dayAnchor,
  weekAnchor,
  monthAnchor,
  report,
  onChangePeriod,
  onChangeDayAnchor,
  onChangeWeekAnchor,
  onChangeMonthAnchor,
  onClose,
}) => {
  const [filenameInput, setFilenameInput] = useState<string>('');
  const [activePageIdx, setActivePageIdx] = useState<number>(0);
  const [zoomed, setZoomed] = useState<boolean>(false);
  const [busyAction, setBusyAction] = useState<'save' | 'share' | null>(null);
  const [status, setStatus] = useState<{
    kind: 'success' | 'info' | 'error';
    message: string;
    androidUri?: string;
  } | null>(null);

  const defaultFilename = useMemo(() => getReportFilename(report), [report]);
  const shareSupported = useMemo(() => canSharePdfFiles(), []);
  const customPathSupported = useMemo(() => supportsCustomSavePath(), []);

  // Reset filename & page index cleanly whenever modal opens or report period changes
  useEffect(() => {
    if (!open) return;
    setFilenameInput(defaultFilename);
    setActivePageIdx(0);
    setStatus(null);
  }, [open, defaultFilename]);

  // Generate actual PDF blob + exact rendered A4 preview page images BEFORE export
  const previewBundle = useMemo(() => {
    if (!open) return null;
    try {
      return createExpenseReportPreviewBundle(report, {
        language,
        t,
      });
    } catch {
      return null;
    }
  }, [open, report, language, t]);

  const pageCount = previewBundle?.pageImages.length
    ? previewBundle.pageImages.length
    : previewBundle?.pdf.pageCount ?? 1;

  const safePageIdx = Math.min(activePageIdx, Math.max(0, pageCount - 1));
  const currentPageSrc = previewBundle?.pageImages[safePageIdx] ?? null;

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

  if (!open) return null;

  const handleSaveToFolder = async () => {
    if (!previewBundle) return;
    setBusyAction('save');
    setStatus(null);
    try {
      const targetName = sanitizePdfFilename(filenameInput, defaultFilename);
      const outcome = await saveExpenseReportPdf(
        previewBundle.pdf.blob,
        targetName
      );
      if (outcome.status === 'cancelled') {
        setStatus({
          kind: 'info',
          message: t.exportCancelled,
        });
      } else {
        const msg =
          outcome.method === 'android-picker' ||
          outcome.method === 'browser-download'
            ? `${t.exportSavedLocation} ${outcome.locationLabel}`
            : `${t.exportSuccess} ${outcome.filename}`;
        setStatus({
          kind: 'success',
          message: msg,
          androidUri: outcome.androidUri,
        });
      }
    } catch {
      setStatus({
        kind: 'error',
        message: t.exportError,
      });
    } finally {
      setBusyAction(null);
    }
  };

  const handleShare = async () => {
    if (!previewBundle) return;
    setBusyAction('share');
    setStatus(null);
    try {
      const targetName = sanitizePdfFilename(filenameInput, defaultFilename);
      const outcome = await sharePdfBlob(
        previewBundle.pdf.blob,
        targetName,
        t.pdfLabels.reportTitle
      );
      if (outcome === 'shared') {
        setStatus({
          kind: 'success',
          message: `${t.exportSuccess} ${targetName}`,
        });
      } else {
        setStatus({
          kind: 'info',
          message: t.shareCancelled,
        });
      }
    } catch {
      setStatus({
        kind: 'error',
        message: t.exportError,
      });
    } finally {
      setBusyAction(null);
    }
  };

  const handleOpenSaved = async (uri: string) => {
    const opened = await openSavedAndroidPdf(uri);
    if (!opened) {
      setStatus({
        kind: 'info',
        message: t.noPdfViewerFound,
        androidUri: uri,
      });
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="pdf-preview-modal-title"
      data-testid="pdf-preview-modal"
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-[#020817]/80 backdrop-blur-md"
    >
      <div className="w-full sm:max-w-3xl rounded-t-3xl sm:rounded-3xl bg-white dark:bg-[#0B1836] border border-slate-200 dark:border-cyan-500/25 shadow-2xl flex flex-col max-h-[94dvh] overflow-hidden">
        {/* Top Modal Header */}
        <div className="px-5 py-4 border-b border-slate-200 dark:border-[#1B315E] flex items-center justify-between gap-3 bg-slate-50/90 dark:bg-[#07122B]">
          <div className="flex items-center gap-3 min-w-0">
            <span className="w-10 h-10 rounded-xl bg-cyan-500/15 border border-cyan-500/30 text-cyan-700 dark:text-cyan-300 flex items-center justify-center shrink-0">
              <FileText className="w-5 h-5" />
            </span>
            <div className="min-w-0">
              <h3
                id="pdf-preview-modal-title"
                className="text-base sm:text-lg font-bold text-slate-900 dark:text-white truncate"
              >
                {t.previewModalTitle}
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 truncate">
                {t.previewModalSubtitle}
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

        {/* Scrollable Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4">
          {/* Period & Anchor Bar inside Preview so user can switch or inspect quickly */}
          <div className="grid grid-cols-1 md:grid-cols-[1fr_auto] gap-3 items-center rounded-2xl bg-slate-50 dark:bg-[#061026] border border-slate-200 dark:border-[#1B315E] p-3">
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
                    data-testid={`pdf-period-${item.id}`}
                    onClick={() => onChangePeriod(item.id)}
                    className={`py-2 px-2 rounded-lg text-xs font-bold min-h-[38px] whitespace-nowrap transition-colors ${
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
              {period === 'daily' && (
                <input
                  type="date"
                  value={dayAnchor}
                  onChange={(e) => onChangeDayAnchor(e.target.value)}
                  aria-label={t.selectDayLabel}
                  className="w-full md:w-44 h-10 px-3 rounded-xl bg-white dark:bg-[#0B1836] border border-slate-200 dark:border-[#213B70] text-xs font-semibold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-cyan-400"
                />
              )}
              {period === 'weekly' && (
                <input
                  type="date"
                  value={weekAnchor}
                  onChange={(e) => onChangeWeekAnchor(e.target.value)}
                  aria-label={t.selectWeekLabel}
                  className="w-full md:w-44 h-10 px-3 rounded-xl bg-white dark:bg-[#0B1836] border border-slate-200 dark:border-[#213B70] text-xs font-semibold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-cyan-400"
                />
              )}
              {period === 'monthly' && (
                <input
                  type="month"
                  value={monthAnchor}
                  onChange={(e) => onChangeMonthAnchor(e.target.value)}
                  aria-label={t.selectMonthLabel}
                  className="w-full md:w-44 h-10 px-3 rounded-xl bg-white dark:bg-[#0B1836] border border-slate-200 dark:border-[#213B70] text-xs font-semibold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-cyan-400"
                />
              )}
            </div>
          </div>

          {/* Visual Page-by-Page A4 PDF Sheet Preview */}
          <div className="rounded-2xl bg-slate-100 dark:bg-[#040D21] border border-slate-200 dark:border-[#1B315E] overflow-hidden">
            {/* Toolbar: Range + Page Switcher + Zoom */}
            <div className="px-3.5 py-2.5 border-b border-slate-200 dark:border-[#1B315E] bg-white/80 dark:bg-[#08142E] flex flex-wrap items-center justify-between gap-2 text-xs">
              <span className="font-semibold text-slate-700 dark:text-cyan-300 tabular-nums">
                {formatReportRangeLabel(report)}
              </span>

              <div className="flex items-center gap-2">
                {pageCount > 1 && (
                  <div className="inline-flex items-center gap-1 rounded-lg bg-slate-100 dark:bg-[#0E2044] p-0.5">
                    <button
                      type="button"
                      disabled={safePageIdx === 0}
                      onClick={() => setActivePageIdx((p) => Math.max(0, p - 1))}
                      aria-label={t.prevPageAria}
                      className="min-w-[30px] min-h-[30px] flex items-center justify-center rounded-md text-slate-700 dark:text-slate-200 disabled:opacity-40"
                    >
                      <ChevronLeft className="w-4 h-4 rtl:rotate-180" />
                    </button>
                    <span className="px-2 font-semibold text-slate-800 dark:text-white tabular-nums whitespace-nowrap">
                      {t.pageCounterLabel} {safePageIdx + 1} {t.ofWord} {pageCount}
                    </span>
                    <button
                      type="button"
                      disabled={safePageIdx >= pageCount - 1}
                      onClick={() =>
                        setActivePageIdx((p) => Math.min(pageCount - 1, p + 1))
                      }
                      aria-label={t.nextPageAria}
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
                        <span>{t.zoomFitLabel}</span>
                      </>
                    ) : (
                      <>
                        <ZoomIn className="w-3.5 h-3.5" />
                        <span>{t.zoomActualLabel}</span>
                      </>
                    )}
                  </button>
                )}
              </div>
            </div>

            {/* A4 Sheet Canvas Stage */}
            <div className="p-3 sm:p-4 max-h-[360px] sm:max-h-[420px] overflow-auto flex justify-center">
              {currentPageSrc ? (
                <div
                  className={`transition-all duration-150 shadow-xl rounded-lg overflow-hidden border border-slate-300 dark:border-[#1B315E] bg-white ${
                    zoomed ? 'w-[140%] min-w-[540px] max-w-none' : 'w-full max-w-[460px]'
                  }`}
                >
                  <img
                    src={currentPageSrc}
                    alt={`${t.previewModalTitle} - ${t.pageCounterLabel} ${safePageIdx + 1}`}
                    data-testid="pdf-preview-page-image"
                    className="w-full h-auto block select-none"
                    draggable={false}
                  />
                </div>
              ) : (
                /* Fallback structured sheet preview when headless or canvas unavailable */
                <div className="w-full max-w-md rounded-xl bg-white text-slate-900 p-4 space-y-3 border border-slate-200">
                  <div className="rounded-lg bg-[#040D21] text-white p-3 flex items-center justify-between gap-2">
                    <div>
                      <p className="text-sm font-bold">{t.pdfLabels.reportTitle}</p>
                      <p className="text-[11px] text-cyan-200">
                        {formatReportRangeLabel(report)}
                      </p>
                    </div>
                    <span className="px-2 py-0.5 rounded bg-yellow-400 text-[#040D21] text-[10px] font-bold">
                      {period.toUpperCase()}
                    </span>
                  </div>
                  <div className="grid grid-cols-3 gap-2 text-xs">
                    <div className="p-2 rounded bg-teal-50">
                      <p className="text-[10px] text-slate-500">{t.incomeLabel}</p>
                      <p className="font-bold text-teal-700 tabular-nums">
                        +{formatReportPKR(report.totalIncome)}
                      </p>
                    </div>
                    <div className="p-2 rounded bg-orange-50">
                      <p className="text-[10px] text-slate-500">{t.expensesLabel}</p>
                      <p className="font-bold text-orange-700 tabular-nums">
                        -{formatReportPKR(report.totalExpense)}
                      </p>
                    </div>
                    <div className="p-2 rounded bg-sky-50">
                      <p className="text-[10px] text-slate-500">{t.netLabel}</p>
                      <p className="font-bold text-slate-900 tabular-nums">
                        {formatReportPKR(report.netBalance)}
                      </p>
                    </div>
                  </div>
                  <p className="text-xs text-slate-500 tabular-nums">
                    {report.transactionCount} {t.transactionsCountLabel}
                  </p>
                </div>
              )}
            </div>
          </div>

          {report.transactionCount === 0 && (
            <p className="text-xs text-amber-800 dark:text-yellow-300 bg-amber-50 dark:bg-yellow-500/10 border border-amber-200 dark:border-yellow-500/30 rounded-xl p-3">
              {t.emptyPeriodNotice}
            </p>
          )}

          {/* Editable File Name & Save Path Info */}
          <div className="space-y-1.5">
            <label
              htmlFor="pdf-filename-input"
              className="block text-xs font-semibold text-slate-700 dark:text-slate-300"
            >
              {t.pdfFilenameLabel}
            </label>
            <input
              id="pdf-filename-input"
              data-testid="pdf-filename-input"
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
                <span>{t.exportPathHint}</span>
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
                  data-testid="open-saved-pdf-btn"
                  onClick={() => void handleOpenSaved(status.androidUri!)}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-yellow-400 hover:bg-yellow-300 text-[#040D21] text-xs font-bold min-h-[34px]"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  <span>{t.openPdfBtn}</span>
                </button>
              )}
            </div>
          )}
        </div>

        {/* Sticky Footer Action Bar: Back, Share PDF, Choose Folder & Save PDF */}
        <div className="px-5 py-4 pb-[max(1rem,calc(env(safe-area-inset-bottom,0px)+0.75rem))] border-t border-slate-200 dark:border-[#1B315E] bg-slate-50/90 dark:bg-[#07122B] flex flex-wrap gap-2.5">
          <button
            type="button"
            disabled={busyAction !== null}
            onClick={onClose}
            className="px-4 py-2.5 rounded-xl bg-slate-200/80 dark:bg-[#11244D] hover:bg-slate-300/80 dark:hover:bg-[#193268] text-slate-800 dark:text-slate-200 text-sm font-semibold min-h-[44px]"
          >
            {t.backBtn}
          </button>

          {shareSupported && (
            <button
              type="button"
              data-testid="pdf-share-btn"
              disabled={busyAction !== null || !previewBundle}
              onClick={() => void handleShare()}
              className="inline-flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl bg-yellow-400 hover:bg-yellow-300 disabled:opacity-60 text-[#040D21] text-sm font-bold min-h-[44px] transition-colors"
            >
              <Share2 className="w-4 h-4" />
              <span>{t.sharePdfBtn}</span>
            </button>
          )}

          <button
            type="button"
            data-testid="pdf-download-confirm-btn"
            disabled={busyAction !== null || !previewBundle}
            onClick={() => void handleSaveToFolder()}
            className="flex-1 inline-flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-cyan-500 hover:bg-cyan-400 disabled:opacity-60 text-[#040D21] text-sm font-bold min-h-[44px] transition-colors whitespace-nowrap"
          >
            {customPathSupported ? (
              <FolderOpen className="w-4 h-4" />
            ) : (
              <FileDown className="w-4 h-4" />
            )}
            <span>
              {busyAction === 'save'
                ? t.generatingPdf
                : customPathSupported
                  ? t.choosePathAndSaveBtn
                  : t.downloadPdfBtn}
            </span>
          </button>
        </div>
      </div>
    </div>
  );
};
