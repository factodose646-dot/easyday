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
import {
  buildKametiMemberWhatsAppUrl,
  buildKametiWhatsAppReminderMessage,
  formatKametiCurrencyRs,
  KametiMemberStatementData,
} from '../../utils/kametiEngine';

interface KametiReminderModalProps {
  open: boolean;
  statement: KametiMemberStatementData | null;
  language: Language;
  t: ToolTranslationBundle['kameti'];
  onClose: () => void;
}

export const KametiReminderModal: React.FC<KametiReminderModalProps> = ({
  open,
  statement,
  language,
  t,
  onClose,
}) => {
  const rUi = t.reportsUI;
  const [templateLang, setTemplateLang] = useState<Language>(language);
  const [messageText, setMessageText] = useState<string>('');
  const [copiedFeedback, setCopiedFeedback] = useState<boolean>(false);

  const generatedMessage = useMemo(() => {
    if (!open || !statement) return '';
    return buildKametiWhatsAppReminderMessage(statement, templateLang);
  }, [open, statement, templateLang]);

  useEffect(() => {
    if (!open) return;
    setTemplateLang(language);
    setCopiedFeedback(false);
  }, [open, statement, language]);

  useEffect(() => {
    if (!open || !generatedMessage) return;
    setMessageText(generatedMessage);
  }, [open, generatedMessage]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  if (!open || !statement) return null;

  const waUrl = buildKametiMemberWhatsAppUrl(statement, templateLang, messageText);
  const nativeAndroid = isNativeAndroid();

  const handleOpenWhatsAppNative = async () => {
    const opened = await openAndroidExternalUrl(waUrl);
    if (!opened) {
      await shareAndroidText(
        messageText,
        `${statement.member.name} — ${statement.committee.name}`
      );
    }
  };

  const handleShareApps = async () => {
    await shareAndroidText(
      messageText,
      `${statement.member.name} — ${statement.committee.name}`
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
      aria-labelledby="kameti-reminder-modal-title"
      data-testid="kameti-reminder-modal"
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-[#020817]/80 backdrop-blur-md"
    >
      <div className="w-full sm:max-w-lg rounded-t-3xl sm:rounded-3xl bg-white dark:bg-[#0B1836] border border-slate-200 dark:border-cyan-500/25 shadow-2xl flex flex-col max-h-[92dvh] overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-200 dark:border-[#1B315E] flex items-center justify-between gap-3 bg-slate-50/90 dark:bg-[#07122B]">
          <div className="flex items-center gap-3 min-w-0">
            <span className="w-10 h-10 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
              <MessageCircle className="w-5 h-5" />
            </span>
            <div className="min-w-0">
              <h3
                id="kameti-reminder-modal-title"
                className="text-base sm:text-lg font-bold text-slate-900 dark:text-white truncate"
              >
                {rUi.reminderTitle}
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 truncate">
                {rUi.reminderSubtitle}
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

        <div className="flex-1 overflow-y-auto p-5 space-y-4">
          <div className="rounded-2xl bg-slate-50 dark:bg-[#061026] border border-slate-200 dark:border-[#1B315E] p-3.5 flex flex-wrap items-center justify-between gap-3">
            <div className="min-w-0 space-y-0.5">
              <p className="text-sm font-extrabold text-slate-900 dark:text-white truncate">
                #{statement.member.memberNumber} {statement.member.name}
              </p>
              <p className="text-xs text-slate-500 dark:text-slate-400 truncate">
                {statement.committee.name}
              </p>
            </div>
            <div className="text-end tabular-nums">
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                {rUi.pdf.memberOutstandingLabel}
              </p>
              <p className="text-sm font-extrabold text-cyan-700 dark:text-cyan-300">
                {formatKametiCurrencyRs(statement.outstandingAmount)}
              </p>
            </div>
          </div>

          <div className="rounded-xl bg-slate-50 dark:bg-[#061026] border border-slate-200 dark:border-[#1B315E] px-3.5 py-2.5 flex items-center gap-2 text-xs">
            <Phone className="w-4 h-4 shrink-0 text-cyan-600 dark:text-cyan-400" />
            {statement.member.phone ? (
              <span className="text-slate-700 dark:text-slate-200 font-semibold tabular-nums">
                {rUi.phoneTargetLabel}: {statement.member.phone}
              </span>
            ) : (
              <span className="text-slate-500 dark:text-slate-400">
                {rUi.noPhoneSavedNote}
              </span>
            )}
          </div>

          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="inline-flex items-center gap-1 p-1 rounded-xl bg-slate-100 dark:bg-[#061026] border border-slate-200 dark:border-[#1B315E]">
              <button
                type="button"
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
              onClick={() => setMessageText(generatedMessage)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-[#061026] text-slate-700 dark:text-slate-300 text-xs font-semibold min-h-[34px]"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>{rUi.resetTemplateBtn}</span>
            </button>
          </div>

          <div className="space-y-1.5">
            <label
              htmlFor="kameti-reminder-textarea"
              className="block text-xs font-semibold text-slate-700 dark:text-slate-300"
            >
              {rUi.reminderMessageLabel}
            </label>
            <textarea
              id="kameti-reminder-textarea"
              rows={7}
              dir={templateLang === 'ur' ? 'rtl' : 'ltr'}
              value={messageText}
              onChange={(e) => setMessageText(e.target.value)}
              className="w-full p-3.5 rounded-2xl bg-slate-50 dark:bg-[#061026] border border-slate-200 dark:border-[#213B70] text-sm text-slate-900 dark:text-white leading-relaxed focus:outline-none focus:ring-2 focus:ring-cyan-400"
            />
          </div>

          <p className="text-[11px] text-slate-500 dark:text-slate-400 flex items-start gap-1.5">
            <Info className="w-3.5 h-3.5 shrink-0 mt-0.5 text-emerald-600 dark:text-emerald-400" />
            <span>{rUi.confirmSendHint}</span>
          </p>
        </div>

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
            <span>{copiedFeedback ? rUi.copiedFeedback : rUi.copyBtn}</span>
          </button>

          <button
            type="button"
            onClick={() => void handleShareApps()}
            className="inline-flex items-center justify-center gap-1.5 px-3.5 py-2.5 rounded-xl bg-cyan-500/15 text-cyan-700 dark:text-cyan-300 text-xs font-bold min-h-[44px]"
          >
            <Share2 className="w-4 h-4" />
            <span>{rUi.shareOtherAppsBtn}</span>
          </button>

          {nativeAndroid ? (
            <button
              type="button"
              data-testid="kameti-reminder-whatsapp-btn"
              disabled={!messageText.trim()}
              onClick={() => void handleOpenWhatsAppNative()}
              className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:opacity-60 text-white text-sm font-bold min-h-[44px] whitespace-nowrap"
            >
              <MessageCircle className="w-4 h-4" />
              <span>{rUi.openWhatsappBtn}</span>
            </button>
          ) : (
            <a
              data-testid="kameti-reminder-whatsapp-btn"
              href={waUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-bold min-h-[44px] whitespace-nowrap"
            >
              <MessageCircle className="w-4 h-4" />
              <span>{rUi.openWhatsappBtn}</span>
            </a>
          )}
        </div>
      </div>
    </div>
  );
};
