import React, { useEffect, useMemo, useState } from 'react';
import {
  Check,
  Copy,
  Info,
  MessageCircle,
  Phone,
  RotateCcw,
  Share2,
  X,
} from 'lucide-react';
import { ToolTranslationBundle } from '../../i18n/toolTranslations';
import { Language } from '../../types';
import {
  isNativeAndroid,
  openAndroidExternalUrl,
  shareAndroidText,
} from '../../utils/androidBridge';
import { UdhaarContact, UdhaarTransaction } from '../../utils/storage';
import { buildWhatsAppUrl } from '../../utils/udhaarEngine';
import {
  buildUdhaarReminderMessage,
  formatStatementCurrencyRs,
} from '../../utils/udhaarStatement';

interface UdhaarReminderModalProps {
  open: boolean;
  contact: UdhaarContact | null;
  transactions: UdhaarTransaction[];
  language: Language;
  t: ToolTranslationBundle['udhaar'];
  onClose: () => void;
}

export const UdhaarReminderModal: React.FC<UdhaarReminderModalProps> = ({
  open,
  contact,
  transactions,
  language,
  t,
  onClose,
}) => {
  const rLabels = t.reminder;
  const [templateLang, setTemplateLang] = useState<Language>(language);
  const [messageText, setMessageText] = useState<string>('');
  const [copiedFeedback, setCopiedFeedback] = useState<boolean>(false);

  const generated = useMemo(() => {
    if (!open || !contact) return null;
    return buildUdhaarReminderMessage(contact, transactions, templateLang);
  }, [open, contact, transactions, templateLang]);

  useEffect(() => {
    if (!open) return;
    setTemplateLang(language);
    setCopiedFeedback(false);
  }, [open, contact, language]);

  useEffect(() => {
    if (!open || !generated) return;
    setMessageText(generated.message);
  }, [open, generated]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  if (!open || !contact || !generated) return null;

  const waUrl = buildWhatsAppUrl(contact.phone, messageText);
  const nativeAndroid = isNativeAndroid();

  const modeBadgeClass =
    generated.mode === 'receivable'
      ? 'bg-cyan-500/15 text-cyan-700 dark:text-cyan-300 border border-cyan-500/30'
      : generated.mode === 'payable'
        ? 'bg-amber-500/15 text-amber-800 dark:text-yellow-300 border border-amber-500/30'
        : 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30';

  const modeBadgeLabel =
    generated.mode === 'receivable'
      ? rLabels.modeReceivableBadge
      : generated.mode === 'payable'
        ? rLabels.modePayableBadge
        : rLabels.modeSettledBadge;

  const handleOpenWhatsAppNative = async () => {
    const opened = await openAndroidExternalUrl(waUrl);
    if (!opened) {
      await shareAndroidText(
        messageText,
        `${contact.name} — ${rLabels.modalTitle}`
      );
    }
  };

  const handleShareApps = async () => {
    await shareAndroidText(
      messageText,
      `${contact.name} — ${rLabels.modalTitle}`
    );
  };

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(messageText);
      setCopiedFeedback(true);
      setTimeout(() => setCopiedFeedback(false), 2200);
    } catch {
      // Ignore clipboard failures
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="udhaar-reminder-modal-title"
      data-testid="udhaar-reminder-modal"
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-[#020817]/80 backdrop-blur-md"
    >
      <div className="w-full sm:max-w-lg rounded-t-3xl sm:rounded-3xl bg-white dark:bg-[#0B1836] border border-slate-200 dark:border-cyan-500/25 shadow-2xl flex flex-col max-h-[92dvh] overflow-hidden">
        {/* Header */}
        <div className="px-5 py-4 border-b border-slate-200 dark:border-[#1B315E] flex items-center justify-between gap-3 bg-slate-50/90 dark:bg-[#07122B]">
          <div className="flex items-center gap-3 min-w-0">
            <span className="w-10 h-10 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
              <MessageCircle className="w-5 h-5" />
            </span>
            <div className="min-w-0">
              <h3
                id="udhaar-reminder-modal-title"
                className="text-base sm:text-lg font-bold text-slate-900 dark:text-white truncate"
              >
                {rLabels.modalTitle}
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 truncate">
                {rLabels.modalSubtitle}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label={t.cancelBtn}
            className="min-w-[40px] min-h-[40px] rounded-xl flex items-center justify-center text-slate-500 dark:text-slate-300 hover:bg-slate-200/70 dark:hover:bg-[#13264F]"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Body */}
        <div className="flex-1 overflow-y-auto p-5 space-y-4">
          {/* Customer & Net Standing */}
          <div className="rounded-2xl bg-slate-50 dark:bg-[#061026] border border-slate-200 dark:border-[#1B315E] p-3.5 flex flex-wrap items-center justify-between gap-3">
            <div className="min-w-0 space-y-0.5">
              <p className="text-sm font-extrabold text-slate-900 dark:text-white truncate">
                {contact.name}
              </p>
              <p className="text-xs font-bold tabular-nums text-slate-700 dark:text-cyan-300">
                {formatStatementCurrencyRs(Math.abs(generated.netBalance))}
              </p>
            </div>

            <span
              data-testid="reminder-mode-badge"
              className={`px-3 py-1 rounded-lg text-xs font-bold whitespace-nowrap ${modeBadgeClass}`}
            >
              {modeBadgeLabel}
            </span>
          </div>

          {/* Target Phone Info */}
          <div className="rounded-xl bg-slate-50 dark:bg-[#061026] border border-slate-200 dark:border-[#1B315E] px-3.5 py-2.5 flex items-center gap-2 text-xs">
            <Phone className="w-4 h-4 shrink-0 text-cyan-600 dark:text-cyan-400" />
            {contact.phone ? (
              <span className="text-slate-700 dark:text-slate-200 font-semibold tabular-nums">
                {rLabels.phoneTargetLabel}: {contact.phone}
              </span>
            ) : (
              <span className="text-slate-500 dark:text-slate-400">
                {rLabels.noPhoneSavedNote}
              </span>
            )}
          </div>

          {/* Language Wording Switcher + Reset */}
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="inline-flex items-center gap-1 p-1 rounded-xl bg-slate-100 dark:bg-[#061026] border border-slate-200 dark:border-[#1B315E]">
              <button
                type="button"
                data-testid="reminder-lang-en"
                onClick={() => setTemplateLang('en')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold min-h-[34px] ${
                  templateLang === 'en'
                    ? 'bg-cyan-500 text-[#040D21]'
                    : 'text-slate-600 dark:text-slate-300'
                }`}
              >
                English
              </button>
              <button
                type="button"
                data-testid="reminder-lang-ur"
                onClick={() => setTemplateLang('ur')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold min-h-[34px] ${
                  templateLang === 'ur'
                    ? 'bg-cyan-500 text-[#040D21]'
                    : 'text-slate-600 dark:text-slate-300'
                }`}
              >
                اردو
              </button>
            </div>

            <button
              type="button"
              onClick={() => setMessageText(generated.message)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-[#061026] text-slate-700 dark:text-slate-300 text-xs font-semibold min-h-[34px]"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>{rLabels.resetTemplateBtn}</span>
            </button>
          </div>

          {/* Editable Reminder Textarea */}
          <div className="space-y-1.5">
            <label
              htmlFor="udhaar-reminder-textarea"
              className="block text-xs font-semibold text-slate-700 dark:text-slate-300"
            >
              {rLabels.messageLabel}
            </label>
            <textarea
              id="udhaar-reminder-textarea"
              data-testid="udhaar-reminder-textarea"
              rows={6}
              dir={templateLang === 'ur' ? 'rtl' : 'ltr'}
              value={messageText}
              onChange={(e) => setMessageText(e.target.value)}
              className="w-full p-3.5 rounded-2xl bg-slate-50 dark:bg-[#061026] border border-slate-200 dark:border-[#213B70] text-sm text-slate-900 dark:text-white leading-relaxed focus:outline-none focus:ring-2 focus:ring-cyan-400"
            />
          </div>

          <p className="text-[11px] text-slate-500 dark:text-slate-400 flex items-start gap-1.5">
            <Info className="w-3.5 h-3.5 shrink-0 mt-0.5 text-emerald-600 dark:text-emerald-400" />
            <span>{rLabels.confirmHint}</span>
          </p>
        </div>

        {/* Sticky Footer Actions */}
        <div className="px-5 py-4 pb-[max(1rem,calc(env(safe-area-inset-bottom,0px)+0.75rem))] border-t border-slate-200 dark:border-[#1B315E] bg-slate-50/90 dark:bg-[#07122B] flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => void handleCopy()}
            className="inline-flex items-center justify-center gap-1.5 px-3.5 py-2.5 rounded-xl bg-slate-200/80 dark:bg-[#11244D] text-slate-800 dark:text-slate-200 text-xs font-bold min-h-[44px]"
          >
            {copiedFeedback ? (
              <Check className="w-4 h-4 text-emerald-500" />
            ) : (
              <Copy className="w-4 h-4" />
            )}
            <span>{copiedFeedback ? t.copiedFeedback : rLabels.copyBtn}</span>
          </button>

          <button
            type="button"
            onClick={() => void handleShareApps()}
            className="inline-flex items-center justify-center gap-1.5 px-3.5 py-2.5 rounded-xl bg-cyan-500/15 text-cyan-700 dark:text-cyan-300 text-xs font-bold min-h-[44px]"
          >
            <Share2 className="w-4 h-4" />
            <span>{rLabels.shareOtherAppsBtn}</span>
          </button>

          {nativeAndroid ? (
            <button
              type="button"
              data-testid="reminder-open-whatsapp-btn"
              disabled={!messageText.trim()}
              onClick={() => void handleOpenWhatsAppNative()}
              className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:opacity-60 text-white text-sm font-bold min-h-[44px] whitespace-nowrap"
            >
              <MessageCircle className="w-4 h-4" />
              <span>{rLabels.openWhatsappBtn}</span>
            </button>
          ) : (
            <a
              data-testid="reminder-open-whatsapp-btn"
              href={waUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-bold min-h-[44px] whitespace-nowrap"
            >
              <MessageCircle className="w-4 h-4" />
              <span>{rLabels.openWhatsappBtn}</span>
            </a>
          )}
        </div>
      </div>
    </div>
  );
};
