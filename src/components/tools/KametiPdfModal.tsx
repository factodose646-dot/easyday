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
  MessageCircle,
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
import {
  formatKametiCurrencyPKR,
  KametiCommitteeReportData,
  KametiMemberStatementData,
} from '../../utils/kametiEngine';
import {
  buildKametiCommitteeShareCaption,
  buildKametiMemberShareCaption,
  createKametiCommitteeReportPreviewBundle,
  createKametiMemberStatementPreviewBundle,
  getKametiCommitteeReportFilename,
  getKametiMemberStatementFilename,
} from '../../utils/kametiReports';

export type KametiPdfModalTarget =
  | { kind: 'member'; statement: KametiMemberStatementData }
  | { kind: 'committee'; report: KametiCommitteeReportData };

interface KametiPdfModalProps {
  open: boolean;
  target: KametiPdfModalTarget | null;
  language: Language;
  t: ToolTranslationBundle['kameti'];
  onClose: () => void;
}

type ModalTab = 'preview' | 'details';

export const KametiPdfModal: React.FC<KametiPdfModalProps> = ({
  open,
  target,
  language,
  t,
  onClose,
}) => {
  const rUi = t.reportsUI;
  const pdfLabels = rUi.pdf;

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

  const defaultFilename = useMemo(() => {
    if (!target) return 'EasyDay-Kameti-Report.pdf';
    return target.kind === 'member'
      ? getKametiMemberStatementFilename(target.statement)
      : getKametiCommitteeReportFilename(target.report);
  }, [target]);

  const previewBundle = useMemo(() => {
    if (!open || !target) return null;
    try {
      return target.kind === 'member'
        ? createKametiMemberStatementPreviewBundle(target.statement, t, language)
        : createKametiCommitteeReportPreviewBundle(target.report, t, language);
    } catch {
      return null;
    }
  }, [open, target, t, language]);

  useEffect(() => {
    if (!open) return;
    setActiveTab('preview');
    setActivePageIdx(0);
    setZoomed(false);
    setFilenameInput(defaultFilename);
    setStatus(null);
  }, [open, defaultFilename]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !busyAction) onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, busyAction, onClose]);

  if (!open || !target) return null;

  const pageCount = previewBundle?.pageImages.length
    ? previewBundle.pageImages.length
    : previewBundle?.pdf.pageCount ?? 1;
  const safePageIdx = Math.min(activePageIdx, Math.max(0, pageCount - 1));
  const currentPageSrc = previewBundle?.pageImages[safePageIdx] ?? null;

  const modalTitle =
    target.kind === 'member'
      ? rUi.memberStatementModalTitle
      : rUi.committeeReportTitle;
  const modalSubtitle =
    target.kind === 'member'
      ? `${target.statement.member.name} — ${target.statement.committee.name}`
      : target.report.committee.name;

  const handleSavePdf = async () => {
    if (!previewBundle) return;
    setBusyAction('save');
    setStatus(null);
    try {
      const targetName = sanitizePdfFilename(filenameInput, defaultFilename);
      const outcome = await saveExpenseReportPdf(previewBundle.pdf.blob, targetName);
      if (outcome.status === 'cancelled') {
        setStatus({ kind: 'info', message: rUi.exportCancelled });
      } else {
        const msg =
          outcome.method === 'android-picker' || outcome.method === 'browser-download'
            ? `${rUi.exportSavedLocation} ${outcome.locationLabel}`
            : `${rUi.exportSuccess} ${outcome.filename}`;
        setStatus({
          kind: 'success',
          message: msg,
          androidUri: outcome.androidUri,
        });
      }
    } catch {
      setStatus({ kind: 'error', message: rUi.exportError });
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
      const caption =
        target.kind === 'member'
          ? buildKametiMemberShareCaption(target.statement, language, t)
          : buildKametiCommitteeShareCaption(target.report, language, t);
      const title =
        target.kind === 'member'
          ? `${target.statement.member.name} — ${pdfLabels.memberStatementTitle}`
          : `${target.report.committee.name} — ${pdfLabels.committeeReportTitle}`;
      const outcome = await sharePdfBlob(
        previewBundle.pdf.blob,
        targetName,
        title,
        caption
      );
      if (outcome === 'shared') {
        setStatus({ kind: 'success', message: `${rUi.exportSuccess} ${targetName}` });
      } else {
        setStatus({ kind: 'info', message: rUi.shareCancelled });
      }
    } catch {
      setStatus({ kind: 'error', message: rUi.exportError });
    } finally {
      setBusyAction(null);
    }
  };

  const handleOpenSaved = async (uri: string) => {
    const opened = await openSavedAndroidPdf(uri);
    if (!opened) {
      setStatus({ kind: 'info', message: rUi.noPdfViewerFound, androidUri: uri });
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="kameti-pdf-modal-title"
      data-testid="kameti-pdf-modal"
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
                id="kameti-pdf-modal-title"
                className="text-base sm:text-lg font-bold text-slate-900 dark:text-white truncate"
              >
                {modalTitle}
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 truncate">
                {modalSubtitle}
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
          {/* Summary Banner */}
          {target.kind === 'member' ? (
            <div className="grid grid-cols-3 gap-2.5 tabular-nums">
              <div className="rounded-2xl bg-slate-50 dark:bg-[#061026] border border-slate-200 dark:border-[#1B315E] p-3">
                <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
                  {pdfLabels.memberExpectedLabel}
                </p>
                <p className="text-sm font-extrabold text-slate-900 dark:text-white mt-0.5">
                  {formatKametiCurrencyPKR(target.statement.totalExpected)}
                </p>
              </div>
              <div className="rounded-2xl bg-slate-50 dark:bg-[#061026] border border-slate-200 dark:border-[#1B315E] p-3">
                <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
                  {pdfLabels.memberPaidLabel}
                </p>
                <p className="text-sm font-extrabold text-emerald-600 dark:text-emerald-400 mt-0.5">
                  {formatKametiCurrencyPKR(target.statement.totalPaid)}
                </p>
              </div>
              <div className="rounded-2xl bg-[#040D21] border border-cyan-500/35 p-3">
                <p className="text-[11px] text-cyan-200 truncate">
                  {pdfLabels.memberOutstandingLabel}
                </p>
                <p className="text-sm font-extrabold text-yellow-300 mt-0.5">
                  {formatKametiCurrencyPKR(target.statement.outstandingAmount)}
                </p>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 tabular-nums">
              <div className="rounded-2xl bg-slate-50 dark:bg-[#061026] border border-slate-200 dark:border-[#1B315E] p-3">
                <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
                  {pdfLabels.expectedMonthlyLabel}
                </p>
                <p className="text-sm font-extrabold text-slate-900 dark:text-white mt-0.5">
                  {formatKametiCurrencyPKR(target.report.dashboard.expectedMonthlyCollection)}
                </p>
              </div>
              <div className="rounded-2xl bg-slate-50 dark:bg-[#061026] border border-slate-200 dark:border-[#1B315E] p-3">
                <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
                  {pdfLabels.expectedTotalLabel}
                </p>
                <p className="text-sm font-extrabold text-slate-900 dark:text-white mt-0.5">
                  {formatKametiCurrencyPKR(target.report.dashboard.expectedTotalCollection)}
                </p>
              </div>
              <div className="rounded-2xl bg-slate-50 dark:bg-[#061026] border border-slate-200 dark:border-[#1B315E] p-3">
                <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
                  {pdfLabels.collectedLabel}
                </p>
                <p className="text-sm font-extrabold text-emerald-600 dark:text-emerald-400 mt-0.5">
                  {formatKametiCurrencyPKR(target.report.dashboard.totalCollected)}
                </p>
              </div>
              <div className="rounded-2xl bg-[#040D21] border border-cyan-500/35 p-3">
                <p className="text-[11px] text-cyan-200 truncate">
                  {pdfLabels.remainingLabel}
                </p>
                <p className="text-sm font-extrabold text-yellow-300 mt-0.5">
                  {formatKametiCurrencyPKR(target.report.dashboard.remainingCollection)}
                </p>
              </div>
            </div>
          )}

          {/* View Switcher */}
          <div className="grid grid-cols-2 gap-1.5 p-1 rounded-xl bg-slate-100 dark:bg-[#061026] border border-slate-200 dark:border-[#1B315E]">
            <button
              type="button"
              onClick={() => setActiveTab('preview')}
              className={`py-2 px-3 rounded-lg text-xs font-bold min-h-[38px] transition-colors ${
                activeTab === 'preview'
                  ? 'bg-[#040D21] dark:bg-cyan-500 text-white dark:text-[#040D21] shadow-sm'
                  : 'text-slate-600 dark:text-slate-300'
              }`}
            >
              {rUi.pdfPreviewTab} ({pageCount})
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('details')}
              className={`py-2 px-3 rounded-lg text-xs font-bold min-h-[38px] transition-colors ${
                activeTab === 'details'
                  ? 'bg-[#040D21] dark:bg-cyan-500 text-white dark:text-[#040D21] shadow-sm'
                  : 'text-slate-600 dark:text-slate-300'
              }`}
            >
              {rUi.detailsTab}
            </button>
          </div>

          {activeTab === 'preview' ? (
            <div className="rounded-2xl bg-slate-100 dark:bg-[#040D21] border border-slate-200 dark:border-[#1B315E] overflow-hidden">
              <div className="px-3.5 py-2.5 border-b border-slate-200 dark:border-[#1B315E] bg-white/80 dark:bg-[#08142E] flex flex-wrap items-center justify-between gap-2 text-xs">
                <span className="font-semibold text-slate-700 dark:text-cyan-300 truncate">
                  {modalSubtitle}
                </span>

                <div className="flex items-center gap-2">
                  {pageCount > 1 && (
                    <div className="inline-flex items-center gap-1 rounded-lg bg-slate-100 dark:bg-[#0E2044] p-0.5">
                      <button
                        type="button"
                        disabled={safePageIdx === 0}
                        onClick={() => setActivePageIdx((p) => Math.max(0, p - 1))}
                        aria-label={rUi.prevPageAria}
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
                        aria-label={rUi.nextPageAria}
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
                          <span>{rUi.zoomFitLabel}</span>
                        </>
                      ) : (
                        <>
                          <ZoomIn className="w-3.5 h-3.5" />
                          <span>{rUi.zoomActualLabel}</span>
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
                      alt={`${modalTitle} - ${pdfLabels.pageLabel} ${safePageIdx + 1}`}
                      className="w-full h-auto block select-none"
                      draggable={false}
                    />
                  </div>
                ) : (
                  <div className="w-full max-w-md rounded-xl bg-white text-slate-900 p-4 space-y-2 border border-slate-200">
                    <div className="rounded-lg bg-[#040D21] text-white p-3">
                      <p className="text-sm font-bold">{modalTitle}</p>
                      <p className="text-[11px] text-cyan-200">{modalSubtitle}</p>
                    </div>
                    <p className="text-xs text-slate-600">
                      {pdfLabels.footerLeft}
                    </p>
                  </div>
                )}
              </div>
            </div>
          ) : target.kind === 'member' ? (
            <div className="space-y-4">
              <div className="rounded-2xl bg-slate-50 dark:bg-[#061026] border border-slate-200 dark:border-[#1B315E] p-3.5 space-y-2">
                <h4 className="text-xs font-bold text-slate-900 dark:text-white">
                  {pdfLabels.installmentsHeading} ({target.statement.installments.length})
                </h4>
                {target.statement.installments.length === 0 ? (
                  <p className="text-xs text-slate-500">{pdfLabels.noRowsMsg}</p>
                ) : (
                  <div className="space-y-1.5">
                    {target.statement.installments.map((ins) => (
                      <div
                        key={ins.installment.id}
                        className="rounded-xl bg-white dark:bg-[#0B1836] border border-slate-200 dark:border-[#1B315E] p-2.5 flex items-center justify-between gap-2 text-xs tabular-nums"
                      >
                        <div>
                          <p className="font-bold text-slate-900 dark:text-white">
                            #{ins.installment.cycleNumber} · {ins.installment.dueDate}
                          </p>
                          <p className="text-[11px] text-slate-500 dark:text-slate-400">
                            {t.installmentStatuses[ins.status]}
                          </p>
                        </div>
                        <div className="text-end">
                          <p className="font-bold text-emerald-600 dark:text-emerald-400">
                            {pdfLabels.paidCol}: {formatKametiCurrencyPKR(ins.paidAmount)}
                          </p>
                          <p className="text-[11px] text-slate-500 dark:text-slate-400">
                            {pdfLabels.remainingCol}:{' '}
                            {formatKametiCurrencyPKR(ins.remainingAmount)}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="rounded-2xl bg-slate-50 dark:bg-[#061026] border border-slate-200 dark:border-[#1B315E] p-3.5 space-y-2">
                <h4 className="text-xs font-bold text-slate-900 dark:text-white">
                  {pdfLabels.paymentHistoryHeading} ({target.statement.paymentHistory.length})
                </h4>
                {target.statement.paymentHistory.length === 0 ? (
                  <p className="text-xs text-slate-500">{pdfLabels.noRowsMsg}</p>
                ) : (
                  <div className="space-y-1.5">
                    {target.statement.paymentHistory.map((p) => (
                      <div
                        key={p.id}
                        className="rounded-xl bg-white dark:bg-[#0B1836] border border-slate-200 dark:border-[#1B315E] p-2.5 flex items-center justify-between gap-2 text-xs tabular-nums"
                      >
                        <div>
                          <p className="font-bold text-slate-900 dark:text-white">
                            {p.paymentDate} · #{p.cycleNumber}
                          </p>
                          <p className="text-[11px] text-slate-500 dark:text-slate-400">
                            {t.paymentMethods[p.paymentMethod]}
                            {p.note ? ` · ${p.note}` : ''}
                          </p>
                        </div>
                        <span className="font-extrabold text-emerald-600 dark:text-emerald-400">
                          {formatKametiCurrencyPKR(p.amount)}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="rounded-2xl bg-slate-50 dark:bg-[#061026] border border-slate-200 dark:border-[#1B315E] p-3.5 space-y-2">
                <h4 className="text-xs font-bold text-slate-900 dark:text-white">
                  {pdfLabels.membersHeading} ({target.report.memberSummaries.length})
                </h4>
                <div className="space-y-1.5">
                  {target.report.memberSummaries.map((ms) => (
                    <div
                      key={ms.member.id}
                      className="rounded-xl bg-white dark:bg-[#0B1836] border border-slate-200 dark:border-[#1B315E] p-2.5 flex items-center justify-between gap-2 text-xs tabular-nums"
                    >
                      <div className="min-w-0">
                        <p className="font-bold text-slate-900 dark:text-white truncate">
                          #{ms.member.memberNumber} {ms.member.name}
                        </p>
                        <p className="text-[11px] text-slate-500 dark:text-slate-400">
                          {ms.effectiveTurnNumber
                            ? `${pdfLabels.turnCol} #${ms.effectiveTurnNumber}`
                            : t.metrics.noRecipientYet}
                        </p>
                      </div>
                      <div className="text-end">
                        <p className="font-bold text-emerald-600 dark:text-emerald-400">
                          {formatKametiCurrencyPKR(ms.totalPaid)}
                        </p>
                        <p className="text-[11px] text-slate-500 dark:text-slate-400">
                          {pdfLabels.remainingCol}:{' '}
                          {formatKametiCurrencyPKR(ms.outstandingAmount)}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="rounded-2xl bg-slate-50 dark:bg-[#061026] border border-slate-200 dark:border-[#1B315E] p-3.5 space-y-2">
                <h4 className="text-xs font-bold text-slate-900 dark:text-white">
                  {pdfLabels.drawsHeading} ({target.report.draws.length})
                </h4>
                {target.report.draws.length === 0 ? (
                  <p className="text-xs text-slate-500">{pdfLabels.noRowsMsg}</p>
                ) : (
                  <div className="space-y-1.5">
                    {target.report.draws.map((dr) => (
                      <div
                        key={dr.id}
                        className="rounded-xl bg-white dark:bg-[#0B1836] border border-slate-200 dark:border-[#1B315E] p-2.5 flex items-center justify-between gap-2 text-xs tabular-nums"
                      >
                        <div>
                          <p className="font-bold text-slate-900 dark:text-white">
                            #{dr.turnNumber} · {dr.memberName}
                          </p>
                          <p className="text-[11px] text-slate-500 dark:text-slate-400">
                            {dr.payoutDate} ·{' '}
                            {dr.isCompleted
                              ? t.drawsUI.completedBadge
                              : t.drawsUI.scheduledBadge}
                          </p>
                        </div>
                        <span className="font-extrabold text-cyan-700 dark:text-cyan-300">
                          {formatKametiCurrencyPKR(dr.payoutAmount)}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Filename & Hints */}
          <div className="space-y-1.5">
            <label
              htmlFor="kameti-pdf-filename-input"
              className="block text-xs font-semibold text-slate-700 dark:text-slate-300"
            >
              {rUi.filenameLabel}
            </label>
            <input
              id="kameti-pdf-filename-input"
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
                <span>{rUi.exportPathHint}</span>
              </p>
            )}
            {shareSupported && (
              <p className="text-[11px] text-slate-500 dark:text-slate-400 flex items-start gap-1.5">
                <MessageCircle className="w-3.5 h-3.5 shrink-0 mt-0.5 text-emerald-600 dark:text-emerald-400" />
                <span>{rUi.whatsappShareHint}</span>
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
                {status.kind === 'info' && <Info className="w-4 h-4 shrink-0 mt-0.5" />}
                <span className="break-words">{status.message}</span>
              </div>

              {status.androidUri && (
                <button
                  type="button"
                  onClick={() => void handleOpenSaved(status.androidUri!)}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-yellow-400 hover:bg-yellow-300 text-[#040D21] text-xs font-bold min-h-[34px]"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  <span>{rUi.openPdfBtn}</span>
                </button>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
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
              data-testid="kameti-share-pdf-btn"
              disabled={busyAction !== null || !previewBundle}
              onClick={() => void handleSharePdf()}
              className="inline-flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:opacity-60 text-white text-sm font-bold min-h-[44px] transition-colors"
            >
              <Share2 className="w-4 h-4" />
              <span>
                {target.kind === 'member' ? rUi.whatsappSharePdfBtn : rUi.sharePdfBtn}
              </span>
            </button>
          )}

          <button
            type="button"
            data-testid="kameti-download-pdf-btn"
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
                ? rUi.generatingPdf
                : customPathSupported
                  ? rUi.choosePathAndSaveBtn
                  : rUi.downloadPdfBtn}
            </span>
          </button>
        </div>
      </div>
    </div>
  );
};
