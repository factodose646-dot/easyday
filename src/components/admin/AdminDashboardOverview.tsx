import React from 'react';
import {
  ArrowRight,
  CheckCircle2,
  EyeOff,
  Film,
  Image as ImageIcon,
  Megaphone,
  MonitorPlay,
  ShieldCheck,
} from 'lucide-react';
import { AdminTranslationBundle } from '../../i18n/adminTranslations';
import { AdminConsoleSnapshot } from '../../services/adminService';

export type AdminSectionTab = 'overview' | 'globalAds' | 'announcement';

interface AdminDashboardOverviewProps {
  snapshot: AdminConsoleSnapshot;
  tAdmin: AdminTranslationBundle;
  onNavigateTab: (tab: AdminSectionTab) => void;
}

export const AdminDashboardOverview: React.FC<AdminDashboardOverviewProps> = ({
  snapshot,
  tAdmin,
  onNavigateTab,
}) => {
  const totalAds = snapshot.ads.length;
  const liveAds = snapshot.ads.filter((a) => a.active && a.published).length;
  const imageAds = snapshot.ads.filter((a) => a.mediaType === 'image').length;
  const videoAds = snapshot.ads.filter((a) => a.mediaType === 'video').length;
  const inactiveOrUnpublished = totalAds - liveAds;

  const announcementStatusText = !snapshot.announcement
    ? tAdmin.overview.notConfiguredLabel
    : snapshot.announcement.active
      ? tAdmin.overview.publishedLabel
      : tAdmin.overview.inactiveLabel;

  const statCards: {
    key: string;
    label: string;
    value: string;
    meta: string;
    targetTab: AdminSectionTab;
    accentClass: string;
    Icon: React.ComponentType<{ className?: string }>;
  }[] = [
    {
      key: 'total-ads',
      label: tAdmin.overview.totalAds,
      value: String(totalAds),
      meta: `${liveAds} ${tAdmin.overview.liveSuffix}`,
      targetTab: 'globalAds',
      accentClass:
        'bg-blue-50 dark:bg-blue-950/60 text-[#0B6FF2] dark:text-sky-400',
      Icon: MonitorPlay,
    },
    {
      key: 'live-ads',
      label: tAdmin.overview.liveAds,
      value: String(liveAds),
      meta: 'active + published',
      targetTab: 'globalAds',
      accentClass:
        'bg-teal-50 dark:bg-teal-950/60 text-teal-600 dark:text-teal-400',
      Icon: CheckCircle2,
    },
    {
      key: 'image-ads',
      label: tAdmin.overview.imageAds,
      value: String(imageAds),
      meta: tAdmin.ads.mediaTypeImage,
      targetTab: 'globalAds',
      accentClass:
        'bg-sky-50 dark:bg-sky-950/60 text-[#0B6FF2] dark:text-sky-400',
      Icon: ImageIcon,
    },
    {
      key: 'video-ads',
      label: tAdmin.overview.videoAds,
      value: String(videoAds),
      meta: tAdmin.ads.mediaTypeVideo,
      targetTab: 'globalAds',
      accentClass:
        'bg-teal-50 dark:bg-teal-950/60 text-teal-600 dark:text-teal-400',
      Icon: Film,
    },
    {
      key: 'inactive-ads',
      label: tAdmin.overview.draftOrInactiveAds,
      value: String(inactiveOrUnpublished),
      meta: `${tAdmin.ads.statusInactive} / ${tAdmin.ads.statusUnpublished}`,
      targetTab: 'globalAds',
      accentClass:
        'bg-amber-50 dark:bg-amber-950/50 text-amber-600 dark:text-amber-400',
      Icon: EyeOff,
    },
    {
      key: 'announcement-status',
      label: tAdmin.overview.announcementStatus,
      value: announcementStatusText,
      meta: snapshot.announcement?.title || 'settings/announcement',
      targetTab: 'announcement',
      accentClass: snapshot.announcement?.active
        ? 'bg-teal-50 dark:bg-teal-950/60 text-teal-600 dark:text-teal-400'
        : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300',
      Icon: Megaphone,
    },
  ];

  return (
    <div className="space-y-6">
      <header className="space-y-1">
        <h2 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white tracking-tight">
          {tAdmin.overview.heading}
        </h2>
        <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400">
          {tAdmin.overview.subheading}
        </p>
      </header>

      {/* 6 Store Ad & Announcement KPI Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
        {statCards.map(
          ({ key, label, value, meta, targetTab, accentClass, Icon }) => (
            <button
              key={key}
              type="button"
              onClick={() => onNavigateTab(targetTab)}
              className="text-start rounded-2xl bg-white dark:bg-[#131C31] border border-slate-200 dark:border-slate-800 hover:border-[#0B6FF2] dark:hover:border-sky-500 p-5 space-y-3 transition-colors"
            >
              <div className="flex items-center justify-between gap-3">
                <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                  {label}
                </span>
                <span
                  className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${accentClass}`}
                >
                  <Icon className="w-4 h-4" />
                </span>
              </div>
              <div>
                <p className="text-2xl font-bold text-slate-900 dark:text-white tabular-nums truncate">
                  {value}
                </p>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 truncate">
                  {meta}
                </p>
              </div>
            </button>
          )
        )}
      </div>

      {/* Management Section Shortcuts */}
      <section className="space-y-3">
        <h3 className="text-sm font-bold text-slate-700 dark:text-slate-300">
          {tAdmin.overview.quickActionsTitle}
        </h3>

        <div className="rounded-3xl bg-white dark:bg-[#131C31] border border-slate-200 dark:border-slate-800 divide-y divide-slate-100 dark:divide-slate-800 overflow-hidden">
          <button
            type="button"
            onClick={() => onNavigateTab('globalAds')}
            className="w-full px-5 py-4 flex items-center justify-between gap-3 hover:bg-slate-50 dark:hover:bg-slate-800/60 text-start transition-colors min-h-[56px]"
          >
            <span className="text-sm font-semibold text-slate-900 dark:text-white">
              {tAdmin.overview.manageGlobalAds}
            </span>
            <span className="flex items-center gap-2.5 text-xs font-medium text-slate-500 dark:text-slate-400 shrink-0 tabular-nums">
              <span>
                {liveAds}/{totalAds}
              </span>
              <ArrowRight className="w-4 h-4 rtl:rotate-180" />
            </span>
          </button>

          <button
            type="button"
            onClick={() => onNavigateTab('announcement')}
            className="w-full px-5 py-4 flex items-center justify-between gap-3 hover:bg-slate-50 dark:hover:bg-slate-800/60 text-start transition-colors min-h-[56px]"
          >
            <span className="text-sm font-semibold text-slate-900 dark:text-white">
              {tAdmin.overview.manageAnnouncement}
            </span>
            <span className="flex items-center gap-2.5 text-xs font-medium text-slate-500 dark:text-slate-400 shrink-0">
              <span>{announcementStatusText}</span>
              <ArrowRight className="w-4 h-4 rtl:rotate-180" />
            </span>
          </button>
        </div>
      </section>

      {/* Active Security Enforcement Summary */}
      <section className="rounded-2xl bg-teal-50/70 dark:bg-teal-950/30 border border-teal-200/80 dark:border-teal-900/60 p-4 flex items-start gap-3">
        <ShieldCheck className="w-5 h-5 text-teal-600 dark:text-teal-400 shrink-0 mt-0.5" />
        <div className="space-y-0.5 text-xs sm:text-sm">
          <p className="font-bold text-slate-900 dark:text-white">
            {tAdmin.overview.securityChecklistTitle}
          </p>
          <p className="text-slate-600 dark:text-slate-300 leading-relaxed">
            {tAdmin.overview.securityChecklistBody}
          </p>
        </div>
      </section>
    </div>
  );
};
