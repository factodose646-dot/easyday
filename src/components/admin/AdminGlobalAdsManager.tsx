import React, { useState } from 'react';
import {
  AlertCircle,
  CheckCircle2,
  Eye,
  EyeOff,
  Film,
  Globe,
  Image as ImageIcon,
  Pencil,
  Plus,
  Send,
  Trash2,
  X,
} from 'lucide-react';
import { AdminTranslationBundle } from '../../i18n/adminTranslations';
import {
  AdMediaType,
  createGlobalAd,
  deleteGlobalAd,
  GlobalAdRecord,
  setGlobalAdFlags,
  updateGlobalAd,
} from '../../services/globalAdService';
import { Language } from '../../types';
import { sanitizeHttpsUrl } from '../../utils/urlSanitizer';

interface AdminGlobalAdsManagerProps {
  ads: GlobalAdRecord[];
  language: Language;
  tAdmin: AdminTranslationBundle;
  onMutated: (message: string) => Promise<void>;
  onError: (message: string) => void;
}

interface AdFormState {
  title: string;
  description: string;
  mediaType: AdMediaType;
  mediaUrl: string;
  active: boolean;
  published: boolean;
}

const DEFAULT_AD_FORM: AdFormState = {
  title: '',
  description: '',
  mediaType: 'image',
  mediaUrl: '',
  active: true,
  published: true,
};

const AdMediaThumb: React.FC<{
  mediaType: AdMediaType;
  mediaUrl: string;
  title: string;
}> = ({ mediaType, mediaUrl, title }) => {
  const [failed, setFailed] = useState(false);
  const safeUrl = sanitizeHttpsUrl(mediaUrl);

  if (mediaType === 'image' && safeUrl && !failed) {
    return (
      <img
        src={safeUrl}
        alt={title}
        referrerPolicy="no-referrer"
        onError={() => setFailed(true)}
        className="w-16 h-16 rounded-2xl object-cover bg-slate-100 dark:bg-slate-800 shrink-0"
      />
    );
  }

  return (
    <div className="w-16 h-16 rounded-2xl bg-cyan-50 dark:bg-cyan-500/15 text-cyan-700 dark:text-cyan-300 flex items-center justify-center shrink-0">
      {mediaType === 'video' ? (
        <Film className="w-6 h-6" aria-hidden="true" />
      ) : (
        <ImageIcon className="w-6 h-6" aria-hidden="true" />
      )}
    </div>
  );
};

export const AdminGlobalAdsManager: React.FC<AdminGlobalAdsManagerProps> = ({
  ads,
  language,
  tAdmin,
  onMutated,
  onError,
}) => {
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<AdFormState>(DEFAULT_AD_FORM);
  const [formError, setFormError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [pendingDelete, setPendingDelete] = useState<{
    id: string;
    title: string;
  } | null>(null);
  const [deleting, setDeleting] = useState(false);

  const formatDate = (ms: number) => {
    if (!ms) return '';
    try {
      return new Intl.DateTimeFormat(language === 'ur' ? 'ur-PK' : 'en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      }).format(new Date(ms));
    } catch {
      return '';
    }
  };

  const openCreateModal = () => {
    setEditingId(null);
    setForm(DEFAULT_AD_FORM);
    setFormError(null);
    setModalOpen(true);
  };

  const openEditModal = (ad: GlobalAdRecord) => {
    setEditingId(ad.id);
    setForm({
      title: ad.title,
      description: ad.description,
      mediaType: ad.mediaType,
      mediaUrl: ad.mediaUrl,
      active: ad.active,
      published: ad.published,
    });
    setFormError(null);
    setModalOpen(true);
  };

  const handleSaveAd = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    setSubmitting(true);

    try {
      if (editingId) {
        await updateGlobalAd(editingId, form);
      } else {
        await createGlobalAd(form);
      }
      setModalOpen(false);
      await onMutated(tAdmin.feedback.savedSuccess);
    } catch (err) {
      setFormError(
        err instanceof Error ? err.message : 'Unable to save advertisement.'
      );
    } finally {
      setSubmitting(false);
    }
  };

  const handleFlagToggle = async (
    ad: GlobalAdRecord,
    patch: { active?: boolean; published?: boolean }
  ) => {
    setBusyId(ad.id);
    try {
      await setGlobalAdFlags(ad.id, patch);
      await onMutated(tAdmin.feedback.statusUpdated);
    } catch (err) {
      onError(
        err instanceof Error
          ? err.message
          : 'Unable to update advertisement status.'
      );
    } finally {
      setBusyId(null);
    }
  };

  const handleConfirmDelete = async () => {
    if (!pendingDelete) return;
    setDeleting(true);
    try {
      await deleteGlobalAd(pendingDelete.id);
      setPendingDelete(null);
      await onMutated(tAdmin.feedback.deletedSuccess);
    } catch (err) {
      setPendingDelete(null);
      onError(
        err instanceof Error ? err.message : 'Unable to delete advertisement.'
      );
    } finally {
      setDeleting(false);
    }
  };

  const liveCount = ads.filter((a) => a.active && a.published).length;

  return (
    <div className="space-y-5">
      {/* Header + Create Ad CTA */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white tracking-tight">
            {tAdmin.ads.sectionTitle}
          </h2>
          <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 mt-0.5">
            {tAdmin.ads.sectionSubtitle}
          </p>
          <p className="text-xs text-cyan-700 dark:text-yellow-400 font-semibold tabular-nums mt-1">
            {liveCount} {tAdmin.overview.liveSuffix} · {ads.length} total
          </p>
        </div>

        <button
          type="button"
          onClick={openCreateModal}
          data-testid="create-global-ad-btn"
          className="self-start sm:self-auto inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-[#040D21] text-xs sm:text-sm font-bold min-h-[44px] transition-colors shrink-0 shadow-sm shadow-cyan-500/20"
        >
          <Plus className="w-4 h-4" />
          <span>{tAdmin.ads.addAdBtn}</span>
        </button>
      </div>

      {/* Ads List */}
      {ads.length === 0 ? (
        <div className="rounded-3xl bg-white dark:bg-[#0B1836] border border-dashed border-slate-200 dark:border-cyan-900/50 p-8 text-center text-sm text-slate-500 dark:text-slate-400">
          {tAdmin.ads.emptyAds}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {ads.map((ad) => {
            const isLive = ad.active && ad.published;
            const isBusy = busyId === ad.id;
            const createdStr = formatDate(ad.createdAtMs);
            const updatedStr = formatDate(ad.updatedAtMs);

            return (
              <article
                key={ad.id}
                className="rounded-2xl bg-white dark:bg-[#0B1836] border border-slate-200 dark:border-cyan-900/50 p-4 sm:p-5 flex flex-col justify-between gap-4"
              >
                <div className="flex items-start gap-3.5 min-w-0">
                  <AdMediaThumb
                    mediaType={ad.mediaType}
                    mediaUrl={ad.mediaUrl}
                    title={ad.title}
                  />

                  <div className="min-w-0 flex-1 space-y-1.5">
                    {/* Unboxed clean status metadata row */}
                    <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 text-xs">
                      <span
                        className={`inline-flex items-center gap-1 font-semibold ${
                          isLive
                            ? 'text-cyan-700 dark:text-cyan-400'
                            : 'text-slate-500 dark:text-slate-400'
                        }`}
                      >
                        <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                        <span>
                          {isLive
                            ? tAdmin.ads.statusLiveOnApp
                            : [
                                ad.active
                                  ? tAdmin.ads.statusActive
                                  : tAdmin.ads.statusInactive,
                                ad.published
                                  ? tAdmin.ads.statusPublished
                                  : tAdmin.ads.statusUnpublished,
                              ].join(' · ')}
                        </span>
                      </span>
                      <span className="text-slate-300 dark:text-slate-600">·</span>
                      <span className="text-slate-600 dark:text-slate-300 font-medium">
                        {ad.mediaType === 'video'
                          ? tAdmin.ads.mediaTypeVideo
                          : tAdmin.ads.mediaTypeImage}
                      </span>
                    </div>

                    <h3 className="text-base font-bold text-slate-900 dark:text-white truncate">
                      {ad.title}
                    </h3>

                    <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 line-clamp-2 leading-relaxed">
                      {ad.description}
                    </p>

                    <p className="text-[11px] text-slate-400 dark:text-slate-500 truncate">
                      {ad.mediaUrl}
                    </p>

                    {(createdStr || updatedStr) && (
                      <p className="text-[11px] text-slate-400 dark:text-slate-500 tabular-nums">
                        {createdStr && `${tAdmin.ads.createdLabel} ${createdStr}`}
                        {createdStr && updatedStr && ' · '}
                        {updatedStr && `${tAdmin.ads.updatedLabel} ${updatedStr}`}
                      </p>
                    )}
                  </div>
                </div>

                {/* Action Footer: Publish/Unpublish, Activate/Deactivate, Edit, Delete */}
                <div className="pt-3 border-t border-slate-100 dark:border-cyan-900/40 grid grid-cols-2 sm:flex sm:flex-wrap items-center gap-2">
                  <button
                    type="button"
                    disabled={isBusy}
                    onClick={() =>
                      void handleFlagToggle(ad, { published: !ad.published })
                    }
                    className="min-h-[40px] px-3 py-1.5 rounded-xl bg-cyan-50 dark:bg-cyan-500/15 hover:bg-cyan-100 dark:hover:bg-cyan-500/25 disabled:opacity-60 text-xs font-semibold text-cyan-700 dark:text-cyan-300 inline-flex items-center justify-center gap-1.5 transition-colors"
                  >
                    <Globe className="w-3.5 h-3.5 shrink-0" />
                    <span>
                      {ad.published
                        ? tAdmin.ads.unpublishBtn
                        : tAdmin.ads.publishBtn}
                    </span>
                  </button>

                  <button
                    type="button"
                    disabled={isBusy}
                    onClick={() =>
                      void handleFlagToggle(ad, { active: !ad.active })
                    }
                    className="min-h-[40px] px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-[#0D1E42] hover:bg-slate-200/80 dark:hover:bg-[#132959] disabled:opacity-60 text-xs font-semibold text-slate-800 dark:text-slate-200 inline-flex items-center justify-center gap-1.5 transition-colors"
                  >
                    {ad.active ? (
                      <>
                        <EyeOff className="w-3.5 h-3.5 shrink-0" />
                        <span>{tAdmin.ads.deactivateBtn}</span>
                      </>
                    ) : (
                      <>
                        <Eye className="w-3.5 h-3.5 shrink-0 text-cyan-600 dark:text-cyan-400" />
                        <span>{tAdmin.ads.activateBtn}</span>
                      </>
                    )}
                  </button>

                  <button
                    type="button"
                    disabled={isBusy}
                    onClick={() => openEditModal(ad)}
                    className="min-h-[40px] px-3 py-1.5 rounded-xl bg-yellow-50 dark:bg-yellow-400/15 hover:bg-yellow-100 dark:hover:bg-yellow-400/25 text-xs font-semibold text-amber-700 dark:text-yellow-300 inline-flex items-center justify-center gap-1.5 transition-colors"
                  >
                    <Pencil className="w-3.5 h-3.5 shrink-0" />
                    <span>{tAdmin.ads.editBtn}</span>
                  </button>

                  <button
                    type="button"
                    disabled={isBusy}
                    onClick={() =>
                      setPendingDelete({ id: ad.id, title: ad.title })
                    }
                    aria-label={`${tAdmin.ads.deleteBtn} ${ad.title}`}
                    className="min-h-[40px] px-3 py-1.5 rounded-xl bg-red-50 dark:bg-red-950/40 hover:bg-red-100 dark:hover:bg-red-900/60 text-xs font-semibold text-red-600 dark:text-red-400 inline-flex items-center justify-center gap-1.5 transition-colors"
                  >
                    <Trash2 className="w-3.5 h-3.5 shrink-0" />
                    <span>{tAdmin.ads.deleteBtn}</span>
                  </button>
                </div>
              </article>
            );
          })}
        </div>
      )}

      {/* Create / Edit Ad Modal */}
      {modalOpen && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="ad-modal-title"
          className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-[#040D21]/80 backdrop-blur-sm"
        >
          <div className="w-full sm:max-w-lg rounded-t-3xl sm:rounded-3xl bg-white dark:bg-[#0B1836] border border-slate-200 dark:border-cyan-900/60 p-5 sm:p-6 pb-[max(1.5rem,calc(env(safe-area-inset-bottom,0px)+1rem))] space-y-4 shadow-xl max-h-[90dvh] overflow-y-auto">
            <div className="w-10 h-1.5 rounded-full bg-slate-300 dark:bg-slate-700 mx-auto sm:hidden" />

            <div className="flex items-center justify-between gap-3">
              <h3
                id="ad-modal-title"
                className="text-lg font-bold text-slate-900 dark:text-white"
              >
                {editingId ? tAdmin.ads.editAdTitle : tAdmin.ads.addAdBtn}
              </h3>
              <button
                type="button"
                onClick={() => !submitting && setModalOpen(false)}
                aria-label={tAdmin.ads.cancelBtn}
                className="min-w-[40px] min-h-[40px] rounded-xl flex items-center justify-center text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {formError && (
              <div
                role="alert"
                className="rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900/70 p-3 flex items-start gap-2 text-xs text-red-700 dark:text-red-300"
              >
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <span>{formError}</span>
              </div>
            )}

            <form onSubmit={(e) => void handleSaveAd(e)} className="space-y-3.5">
              {/* Title */}
              <div className="space-y-1">
                <label
                  htmlFor="ad-title-field"
                  className="block text-xs font-semibold text-slate-700 dark:text-slate-300"
                >
                  {tAdmin.ads.fields.title}
                </label>
                <input
                  id="ad-title-field"
                  type="text"
                  maxLength={120}
                  required
                  value={form.title}
                  onChange={(e) =>
                    setForm((prev) => ({ ...prev, title: e.target.value }))
                  }
                  placeholder={tAdmin.ads.fields.titlePlaceholder}
                  disabled={submitting}
                  className="w-full h-11 px-3.5 rounded-xl bg-slate-50 dark:bg-[#061026] border border-slate-200 dark:border-cyan-900/60 text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-cyan-500"
                />
              </div>

              {/* Description */}
              <div className="space-y-1">
                <label
                  htmlFor="ad-desc-field"
                  className="block text-xs font-semibold text-slate-700 dark:text-slate-300"
                >
                  {tAdmin.ads.fields.description}
                </label>
                <textarea
                  id="ad-desc-field"
                  rows={3}
                  maxLength={1000}
                  required
                  value={form.description}
                  onChange={(e) =>
                    setForm((prev) => ({
                      ...prev,
                      description: e.target.value,
                    }))
                  }
                  placeholder={tAdmin.ads.fields.descriptionPlaceholder}
                  disabled={submitting}
                  className="w-full p-3.5 rounded-xl bg-slate-50 dark:bg-[#061026] border border-slate-200 dark:border-cyan-900/60 text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-cyan-500 resize-y"
                />
              </div>

              {/* Media Type Selector (Image or Video) */}
              <div className="space-y-1.5">
                <span className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                  {tAdmin.ads.fields.mediaType}
                </span>
                <div className="grid grid-cols-2 gap-2 p-1 rounded-xl bg-slate-100 dark:bg-[#061026]">
                  <button
                    type="button"
                    disabled={submitting}
                    onClick={() =>
                      setForm((prev) => ({ ...prev, mediaType: 'image' }))
                    }
                    className={`min-h-[40px] rounded-lg text-xs font-semibold inline-flex items-center justify-center gap-1.5 transition-colors ${
                      form.mediaType === 'image'
                        ? 'bg-cyan-500 text-[#040D21] font-bold shadow-sm'
                        : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
                    }`}
                  >
                    <ImageIcon className="w-4 h-4" />
                    <span>{tAdmin.ads.mediaTypeImage}</span>
                  </button>

                  <button
                    type="button"
                    disabled={submitting}
                    onClick={() =>
                      setForm((prev) => ({ ...prev, mediaType: 'video' }))
                    }
                    className={`min-h-[40px] rounded-lg text-xs font-semibold inline-flex items-center justify-center gap-1.5 transition-colors ${
                      form.mediaType === 'video'
                        ? 'bg-cyan-500 text-[#040D21] font-bold shadow-sm'
                        : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
                    }`}
                  >
                    <Film className="w-4 h-4" />
                    <span>{tAdmin.ads.mediaTypeVideo}</span>
                  </button>
                </div>
              </div>

              {/* HTTPS Media URL */}
              <div className="space-y-1">
                <label
                  htmlFor="ad-media-url-field"
                  className="block text-xs font-semibold text-slate-700 dark:text-slate-300"
                >
                  {tAdmin.ads.fields.mediaUrl}
                </label>
                <input
                  id="ad-media-url-field"
                  type="url"
                  maxLength={500}
                  required
                  value={form.mediaUrl}
                  onChange={(e) =>
                    setForm((prev) => ({ ...prev, mediaUrl: e.target.value }))
                  }
                  placeholder={
                    form.mediaType === 'video'
                      ? tAdmin.ads.fields.mediaUrlPlaceholderVideo
                      : tAdmin.ads.fields.mediaUrlPlaceholderImage
                  }
                  disabled={submitting}
                  className="w-full h-11 px-3.5 rounded-xl bg-slate-50 dark:bg-[#061026] border border-slate-200 dark:border-cyan-900/60 text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-cyan-500"
                />
              </div>

              {/* Active & Published Status Controls */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                <label className="flex items-start gap-2.5 p-3 rounded-2xl bg-slate-50 dark:bg-[#061026] border border-slate-200/80 dark:border-cyan-900/50 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={form.active}
                    onChange={(e) =>
                      setForm((prev) => ({ ...prev, active: e.target.checked }))
                    }
                    disabled={submitting}
                    className="mt-0.5 w-5 h-5 rounded border-slate-300 text-cyan-500 focus:ring-cyan-500"
                  />
                  <div className="min-w-0">
                    <span className="block text-xs font-semibold text-slate-900 dark:text-white">
                      {tAdmin.ads.fields.activeLabel}
                    </span>
                    <span className="block text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                      {tAdmin.ads.fields.activeHint}
                    </span>
                  </div>
                </label>

                <label className="flex items-start gap-2.5 p-3 rounded-2xl bg-slate-50 dark:bg-[#061026] border border-slate-200/80 dark:border-cyan-900/50 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={form.published}
                    onChange={(e) =>
                      setForm((prev) => ({
                        ...prev,
                        published: e.target.checked,
                      }))
                    }
                    disabled={submitting}
                    className="mt-0.5 w-5 h-5 rounded border-slate-300 text-cyan-500 focus:ring-cyan-500"
                  />
                  <div className="min-w-0">
                    <span className="block text-xs font-semibold text-slate-900 dark:text-white">
                      {tAdmin.ads.fields.publishedLabel}
                    </span>
                    <span className="block text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                      {tAdmin.ads.fields.publishedHint}
                    </span>
                  </div>
                </label>
              </div>

              <div className="flex gap-2.5 pt-2">
                <button
                  type="button"
                  disabled={submitting}
                  onClick={() => setModalOpen(false)}
                  className="flex-1 min-h-[44px] px-4 py-2.5 rounded-xl bg-slate-100 dark:bg-[#0D1E42] hover:bg-slate-200 dark:hover:bg-[#132959] text-slate-800 dark:text-slate-200 text-sm font-semibold transition-colors"
                >
                  {tAdmin.ads.cancelBtn}
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex-1 min-h-[44px] px-4 py-2.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 disabled:opacity-60 text-[#040D21] text-sm font-bold inline-flex items-center justify-center gap-1.5 transition-colors"
                >
                  <Send className="w-4 h-4" />
                  <span>
                    {submitting
                      ? tAdmin.ads.savingBtn
                      : form.active && form.published
                        ? tAdmin.ads.savePublishBtn
                        : tAdmin.ads.saveBtn}
                  </span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {pendingDelete && (
        <div
          role="alertdialog"
          aria-modal="true"
          aria-labelledby="ad-delete-confirm-title"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#040D21]/80 backdrop-blur-sm"
        >
          <div className="w-full max-w-md rounded-3xl bg-white dark:bg-[#0B1836] border border-slate-200 dark:border-cyan-900/60 p-6 space-y-4 shadow-xl">
            <h3
              id="ad-delete-confirm-title"
              className="text-lg font-bold text-slate-900 dark:text-white"
            >
              {tAdmin.ads.confirmDeleteTitle}
            </h3>
            <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
              <strong className="text-slate-900 dark:text-white">
                {pendingDelete.title}
              </strong>{' '}
              — {tAdmin.ads.confirmDeleteBody}
            </p>
            <div className="flex gap-2.5 pt-2">
              <button
                type="button"
                disabled={deleting}
                onClick={() => setPendingDelete(null)}
                className="flex-1 min-h-[44px] px-4 py-2.5 rounded-xl bg-slate-100 dark:bg-[#0D1E42] hover:bg-slate-200 dark:hover:bg-[#132959] text-slate-800 dark:text-slate-200 text-sm font-semibold transition-colors"
              >
                {tAdmin.ads.cancelBtn}
              </button>
              <button
                type="button"
                disabled={deleting}
                onClick={() => void handleConfirmDelete()}
                className="flex-1 min-h-[44px] px-4 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 disabled:opacity-60 text-white text-sm font-semibold transition-colors"
              >
                {deleting
                  ? tAdmin.ads.deletingBtn
                  : tAdmin.ads.confirmDeleteBtn}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
