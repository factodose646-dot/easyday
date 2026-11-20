import React, { useEffect, useState } from 'react';
import { ImageOff, VideoOff, X } from 'lucide-react';
import { Language } from '../types';
import { GlobalAdRecord } from '../services/globalAdService';
import { EasyDayLogo } from './BrandLogos';

interface GlobalAdOverlayProps {
  ad: GlobalAdRecord;
  language: Language;
  onDismiss: () => void;
}

export const GlobalAdOverlay: React.FC<GlobalAdOverlayProps> = ({
  ad,
  language,
  onDismiss,
}) => {
  const [mediaError, setMediaError] = useState(false);

  useEffect(() => {
    setMediaError(false);
  }, [ad.id, ad.mediaUrl]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onDismiss();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onDismiss]);

  const isUrdu = language === 'ur';
  const sponsoredLabel = isUrdu ? 'اشتہار' : 'Advertisement';
  const skipLabel = isUrdu ? 'بند کریں / آگے بڑھیں' : 'Skip';
  const closeAriaLabel = isUrdu ? 'اشتہار بند کریں' : 'Close advertisement';

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="global-ad-title"
      dir={isUrdu ? 'rtl' : 'ltr'}
      data-testid="global-ad-overlay"
      className="fixed inset-0 z-50 bg-slate-950/95 backdrop-blur-md text-white flex flex-col justify-between"
      style={{
        paddingTop: 'max(1rem, env(safe-area-inset-top, 0px))',
        paddingBottom: 'max(1.25rem, env(safe-area-inset-bottom, 0px))',
        paddingLeft: 'max(1rem, env(safe-area-inset-left, 0px))',
        paddingRight: 'max(1rem, env(safe-area-inset-right, 0px))',
      }}
    >
      {/* Top Bar: Quiet Label + Clear X / Skip Button */}
      <div className="max-w-3xl w-full mx-auto flex items-center justify-between gap-4 pb-3">
        <div className="flex items-center gap-2.5 min-w-0">
          <EasyDayLogo className="w-7 h-7 shrink-0" />
          <div className="flex items-center gap-2 text-xs text-slate-300 truncate">
            <span className="font-semibold text-white">EasyDay</span>
            <span aria-hidden="true">·</span>
            <span>{sponsoredLabel}</span>
          </div>
        </div>

        <button
          type="button"
          onClick={onDismiss}
          data-testid="global-ad-dismiss-btn"
          aria-label={closeAriaLabel}
          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-white/15 hover:bg-white/25 active:bg-white/30 text-white text-xs sm:text-sm font-semibold min-h-[44px] min-w-[44px] transition-colors shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-400"
        >
          <span>{skipLabel}</span>
          <X className="w-4 h-4 shrink-0" />
        </button>
      </div>

      {/* Center Media Container (never distorted) */}
      <div className="flex-1 min-h-0 max-w-3xl w-full mx-auto flex items-center justify-center py-2">
        {mediaError ? (
          <div className="w-full h-full max-h-[55dvh] rounded-3xl bg-gradient-to-br from-[#0B6FF2]/30 via-slate-900 to-[#0D9488]/30 border border-white/10 flex flex-col items-center justify-center p-8 text-center gap-3">
            <span className="w-14 h-14 rounded-2xl bg-white/10 flex items-center justify-center text-sky-300">
              {ad.mediaType === 'video' ? (
                <VideoOff className="w-7 h-7" />
              ) : (
                <ImageOff className="w-7 h-7" />
              )}
            </span>
            <p className="text-lg font-bold text-white max-w-md">{ad.title}</p>
            <p className="text-sm text-slate-300 max-w-md leading-relaxed">
              {ad.description}
            </p>
          </div>
        ) : ad.mediaType === 'video' ? (
          <video
            key={ad.id}
            src={ad.mediaUrl}
            controls
            autoPlay
            muted
            playsInline
            onError={() => setMediaError(true)}
            className="max-h-[60dvh] w-full h-auto object-contain rounded-2xl bg-black/60"
          />
        ) : (
          <img
            key={ad.id}
            src={ad.mediaUrl}
            alt={ad.title}
            referrerPolicy="no-referrer"
            onError={() => setMediaError(true)}
            className="max-h-[60dvh] w-full h-auto object-contain rounded-2xl"
          />
        )}
      </div>

      {/* Bottom Caption Card */}
      <div className="max-w-3xl w-full mx-auto pt-3">
        <div className="rounded-2xl bg-white/10 border border-white/15 p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="min-w-0 space-y-1">
            <h2
              id="global-ad-title"
              className="text-base sm:text-lg font-bold text-white leading-snug text-balance"
            >
              {ad.title}
            </h2>
            <p className="text-xs sm:text-sm text-slate-200 leading-relaxed line-clamp-3">
              {ad.description}
            </p>
          </div>

          <button
            type="button"
            onClick={onDismiss}
            className="sm:self-end shrink-0 px-5 py-2.5 rounded-xl bg-[#0B6FF2] hover:bg-blue-600 text-white text-xs sm:text-sm font-semibold min-h-[44px] transition-colors whitespace-nowrap"
          >
            {skipLabel}
          </button>
        </div>
      </div>
    </div>
  );
};
