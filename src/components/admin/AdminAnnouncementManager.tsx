import React, { useEffect, useState } from 'react';
import { CheckCircle2, EyeOff, Megaphone, Save } from 'lucide-react';
import { AdminTranslationBundle } from '../../i18n/adminTranslations';
import { AdminAnnouncement, saveAnnouncement } from '../../services/adminService';

interface AdminAnnouncementManagerProps {
  current: AdminAnnouncement | null;
  tAdmin: AdminTranslationBundle;
  onUpdated: (message: string) => Promise<void>;
  onError: (message: string) => void;
}

export const AdminAnnouncementManager: React.FC<AdminAnnouncementManagerProps> = ({
  current,
  tAdmin,
  onUpdated,
  onError,
}) => {
  const [title, setTitle] = useState(current?.title ?? '');
  const [message, setMessage] = useState(current?.message ?? '');
  const [active, setActive] = useState(current?.active ?? false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setTitle(current?.title ?? '');
    setMessage(current?.message ?? '');
    setActive(current?.active ?? false);
  }, [current]);

  const handleSave = async (nextActive: boolean) => {
    setSaving(true);
    try {
      await saveAnnouncement({
        title,
        message,
        active: nextActive,
      });
      setActive(nextActive);
      await onUpdated(tAdmin.feedback.announcementUpdated);
    } catch (err) {
      onError(err instanceof Error ? err.message : 'Failed to save announcement.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6 max-w-3xl">
      <header className="space-y-1">
        <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1">
          <h2 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white tracking-tight">
            {tAdmin.announcement.heading}
          </h2>
          <span className="text-xs font-semibold text-teal-700 dark:text-teal-400">
            · {active ? tAdmin.announcement.statusLive : tAdmin.announcement.statusHidden}
          </span>
        </div>
        <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400">
          {tAdmin.announcement.subheading}
        </p>
      </header>

      <div className="rounded-3xl bg-white dark:bg-[#131C31] border border-slate-200 dark:border-slate-800 p-5 sm:p-6 space-y-4">
        <div className="space-y-1.5">
          <label
            htmlFor="announcement-title"
            className="block text-xs font-semibold text-slate-700 dark:text-slate-300"
          >
            {tAdmin.announcement.titleLabel}
          </label>
          <input
            id="announcement-title"
            type="text"
            maxLength={120}
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder={tAdmin.announcement.titlePlaceholder}
            disabled={saving}
            className="w-full h-11 px-3.5 rounded-xl bg-slate-50 dark:bg-slate-900/80 border border-slate-200 dark:border-slate-700 text-sm text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#0B6FF2]"
          />
        </div>

        <div className="space-y-1.5">
          <label
            htmlFor="announcement-message"
            className="block text-xs font-semibold text-slate-700 dark:text-slate-300"
          >
            {tAdmin.announcement.messageLabel}
          </label>
          <textarea
            id="announcement-message"
            rows={4}
            maxLength={1000}
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder={tAdmin.announcement.messagePlaceholder}
            disabled={saving}
            className="w-full p-3.5 rounded-xl bg-slate-50 dark:bg-slate-900/80 border border-slate-200 dark:border-slate-700 text-sm text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#0B6FF2] resize-y"
          />
        </div>

        <label className="flex items-start gap-3 p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200/80 dark:border-slate-800 cursor-pointer">
          <input
            type="checkbox"
            checked={active}
            onChange={(e) => setActive(e.target.checked)}
            disabled={saving}
            className="mt-0.5 w-5 h-5 rounded border-slate-300 text-[#0B6FF2] focus:ring-[#0B6FF2]"
          />
          <div className="min-w-0">
            <span className="block text-sm font-semibold text-slate-900 dark:text-white">
              {tAdmin.announcement.activeLabel}
            </span>
            <span className="block text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              {tAdmin.announcement.activeHint}
            </span>
          </div>
        </label>

        <div className="flex flex-col sm:flex-row gap-2.5 pt-2">
          <button
            type="button"
            disabled={saving}
            onClick={() => void handleSave(active)}
            className="flex-1 min-h-[44px] px-4 py-2.5 rounded-xl bg-[#0B6FF2] hover:bg-blue-700 disabled:opacity-60 text-white text-sm font-semibold inline-flex items-center justify-center gap-2 transition-colors"
          >
            <Save className="w-4 h-4" />
            <span>
              {saving ? tAdmin.ads.savingBtn : tAdmin.announcement.savePublishBtn}
            </span>
          </button>

          {current?.active && (
            <button
              type="button"
              disabled={saving}
              onClick={() => void handleSave(false)}
              className="min-h-[44px] px-4 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 disabled:opacity-60 text-slate-800 dark:text-slate-200 text-sm font-semibold inline-flex items-center justify-center gap-2 transition-colors"
            >
              <EyeOff className="w-4 h-4" />
              <span>{tAdmin.announcement.deactivateBtn}</span>
            </button>
          )}
        </div>
      </div>

      {/* Live Preview */}
      <section className="space-y-2.5">
        <div className="flex items-center justify-between text-xs font-semibold text-slate-500 dark:text-slate-400">
          <span>{tAdmin.announcement.previewLabel}</span>
          <span className="inline-flex items-center gap-1">
            <CheckCircle2 className="w-3.5 h-3.5 text-teal-600 dark:text-teal-400" />
            <span>{active ? tAdmin.announcement.statusLive : tAdmin.announcement.statusHidden}</span>
          </span>
        </div>

        <div className="rounded-3xl bg-gradient-to-br from-[#0B6FF2] to-[#0D9488] text-white p-5 space-y-2">
          <div className="flex items-center gap-2 text-xs font-semibold text-amber-300">
            <Megaphone className="w-4 h-4 shrink-0" />
            <span>ZAIDI STORE · {tAdmin.tabs.announcement}</span>
          </div>
          <h3 className="text-lg font-bold">
            {title.trim() || tAdmin.announcement.titlePlaceholder}
          </h3>
          <p className="text-sm text-sky-100 leading-relaxed">
            {message.trim() || tAdmin.announcement.messagePlaceholder}
          </p>
        </div>
      </section>
    </div>
  );
};
