import React from 'react';
import { AlertCircle, RotateCcw, X } from 'lucide-react';
import zaidiEmblemUrl from '../assets/zaidi-emblem.png';

interface SplashScreenProps {
  progress: number;
  error: string | null;
  onRetry?: () => void;
  previewMode?: boolean;
  onClosePreview?: () => void;
}

export const SplashScreen: React.FC<SplashScreenProps> = ({
  progress,
  error,
  onRetry,
  previewMode = false,
  onClosePreview,
}) => {
  const clampedProgress = Math.max(0, Math.min(100, Math.round(progress)));

  return (
    <div
      dir="ltr"
      role={previewMode ? 'dialog' : 'status'}
      aria-modal={previewMode ? true : undefined}
      aria-label="EasyDay Startup Loading Screen"
      className="fixed inset-0 z-50 overflow-y-auto overflow-x-hidden bg-[#040D21] text-white select-none"
    >
      {/* Deep navy atmospheric background with golden & blue radial lighting */}
      <div
        aria-hidden="true"
        className="pointer-events-none fixed inset-0 overflow-hidden"
      >
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(14,45,102,0.58)_0%,rgba(6,19,46,0.9)_55%,#030A18_100%)]" />
        {/* Warm golden halo behind logo */}
        <div className="absolute top-[36%] left-1/2 -translate-x-1/2 -translate-y-1/2 w-[320px] h-[320px] sm:w-[440px] sm:h-[440px] rounded-full bg-[radial-gradient(circle,rgba(250,204,21,0.16)_0%,rgba(56,189,248,0.08)_45%,transparent_72%)]" />
        {/* Blue lower ambient glow */}
        <div className="absolute bottom-[-10%] left-1/2 -translate-x-1/2 w-[520px] h-[260px] rounded-full bg-[radial-gradient(circle,rgba(11,111,242,0.18)_0%,transparent_70%)]" />

        {/* Subtle geometric arch & diamond wireframe pattern matching reference */}
        <svg
          viewBox="0 0 720 1280"
          preserveAspectRatio="xMidYMid slice"
          className="w-full h-full opacity-[0.22]"
        >
          {/* Outer subtle arch frame */}
          <path
            d="M46 1160 V420 C46 180 210 60 360 60 C510 60 674 180 674 420 V1160"
            fill="none"
            stroke="#60A5FA"
            strokeWidth="1.2"
          />
          <path
            d="M72 1160 V430 C72 205 224 92 360 92 C496 92 648 205 648 430 V1160"
            fill="none"
            stroke="#FACC15"
            strokeWidth="0.9"
            strokeDasharray="6 6"
            opacity="0.6"
          />
          {/* Concentric rings & rotated geometric square behind emblem */}
          <circle
            cx="360"
            cy="450"
            r="230"
            fill="none"
            stroke="#93C5FD"
            strokeWidth="1"
            strokeDasharray="4 8"
          />
          <circle
            cx="360"
            cy="450"
            r="175"
            fill="none"
            stroke="#FDE047"
            strokeWidth="1"
            opacity="0.45"
          />
          <rect
            x="210"
            y="300"
            width="300"
            height="300"
            rx="14"
            fill="none"
            stroke="#60A5FA"
            strokeWidth="1"
            opacity="0.55"
          />
          <rect
            x="210"
            y="300"
            width="300"
            height="300"
            rx="14"
            transform="rotate(45 360 450)"
            fill="none"
            stroke="#FACC15"
            strokeWidth="1"
            opacity="0.45"
          />
        </svg>
      </div>

      {/* Safe-area constrained layout container */}
      <div className="relative z-10 splash-safe-frame max-w-md mx-auto w-full flex flex-col justify-between gap-4">
        {/* Top Zone: Badge (+ Close action in previewMode) */}
        <div className="relative flex items-center justify-center pt-1 min-h-[44px]">
          <div className="inline-flex items-center px-4 py-1.5 rounded-full border border-cyan-400/40 bg-[#0A1A38]/85 backdrop-blur-sm">
            <span className="text-[10px] sm:text-[11px] font-semibold tracking-[0.18em] text-cyan-100 whitespace-nowrap">
              DAILY LIFE COMPANION
            </span>
          </div>

          {previewMode && onClosePreview && (
            <button
              type="button"
              onClick={onClosePreview}
              aria-label="Close splash preview"
              className="absolute end-0 top-1/2 -translate-y-1/2 min-w-[44px] min-h-[44px] rounded-full flex items-center justify-center bg-white/10 hover:bg-white/20 text-white transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>

        {/* Center Zone: Original ZAIDI INTERACTIVE Logo + Gold EASYDAY Title */}
        <div className="flex flex-col items-center text-center my-auto py-2">
          {/* Original extracted transparent PNG emblem — no black rectangular box */}
          <div className="relative flex items-center justify-center">
            <div
              aria-hidden="true"
              className="absolute inset-2 rounded-3xl bg-amber-400/20 blur-xl"
            />
            <img
              src={zaidiEmblemUrl}
              alt="ZAIDI INTERACTIVE"
              className="relative w-[116px] min-[380px]:w-[136px] sm:w-[152px] h-auto object-contain drop-shadow-[0_12px_28px_rgba(0,0,0,0.45)]"
              draggable={false}
            />
          </div>

          {/* ZAIDI — INTERACTIVE wordmark lockup matching reference */}
          <div className="mt-3 sm:mt-4 flex flex-col items-center">
            <span
              className="font-display font-black italic text-3xl min-[380px]:text-4xl sm:text-[42px] leading-none tracking-[0.06em] bg-gradient-to-b from-[#FFE875] via-[#FACC15] to-[#EA9E00] bg-clip-text text-transparent drop-shadow-[0_2px_10px_rgba(250,204,21,0.22)]"
            >
              ZAIDI
            </span>
            <div className="mt-1.5 flex items-center gap-2.5">
              <span className="w-6 sm:w-8 h-[1.5px] bg-gradient-to-r from-transparent to-[#FACC15]" />
              <span className="text-[10px] sm:text-xs font-bold tracking-[0.36em] text-white ps-[0.36em]">
                INTERACTIVE
              </span>
              <span className="w-6 sm:w-8 h-[1.5px] bg-gradient-to-l from-transparent to-[#FACC15]" />
            </div>
          </div>

          {/* Delicate Gold Divider with 4-point Star */}
          <div className="mt-5 sm:mt-6 flex items-center justify-center gap-3 w-48 sm:w-56">
            <span className="flex-1 h-px bg-gradient-to-r from-transparent via-amber-400/50 to-amber-400/80" />
            <svg
              viewBox="0 0 24 24"
              className="w-3.5 h-3.5 text-[#FACC15] shrink-0"
              fill="currentColor"
              aria-hidden="true"
            >
              <path d="M12 1L14.6 9.4L23 12L14.6 14.6L12 23L9.4 14.6L1 12L9.4 9.4L12 1Z" />
            </svg>
            <span className="flex-1 h-px bg-gradient-to-l from-transparent via-amber-400/50 to-amber-400/80" />
          </div>

          {/* Gold EASYDAY Title & Subtitle */}
          <h1 className="mt-4 sm:mt-5 font-display font-extrabold text-3xl min-[380px]:text-4xl sm:text-[42px] tracking-[0.22em] ps-[0.22em] leading-tight bg-gradient-to-b from-[#FFE57F] via-[#FACC15] to-[#E59A00] bg-clip-text text-transparent">
            EASYDAY
          </h1>
          <p className="mt-1.5 text-[11px] sm:text-xs font-medium tracking-[0.2em] text-slate-300/90">
            make you easy
          </p>
        </div>

        {/* Bottom Zone: Animated Progress Bar, Initializing Message & Safe Footer */}
        <div className="w-full space-y-3.5 pb-1">
          {error ? (
            <div className="rounded-2xl bg-red-950/70 border border-red-400/35 p-3.5 text-center space-y-2.5">
              <div className="flex items-center justify-center gap-2 text-xs font-semibold text-red-200">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{error}</span>
              </div>
              {onRetry && (
                <button
                  type="button"
                  onClick={onRetry}
                  className="inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 text-xs font-bold min-h-[40px] transition-colors"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Retry Initialization</span>
                </button>
              )}
            </div>
          ) : (
            <div className="space-y-2.5">
              {/* Animated gradient progress bar */}
              <div
                role="progressbar"
                aria-valuemin={0}
                aria-valuemax={100}
                aria-valuenow={clampedProgress}
                className="relative w-full h-1.5 rounded-full bg-[#0F2042] overflow-hidden border border-white/10"
              >
                <div
                  className="relative h-full rounded-full bg-gradient-to-r from-[#F59E0B] via-[#FDE047] to-[#2DD4BF] transition-[width] duration-150 ease-out overflow-hidden"
                  style={{ width: `${clampedProgress}%` }}
                >
                  <span
                    aria-hidden="true"
                    className="absolute inset-0 w-1/2 bg-gradient-to-r from-transparent via-white/40 to-transparent animate-splash-shimmer"
                  />
                </div>
              </div>

              {/* Loading message & percentage */}
              <div className="flex items-center justify-between gap-3 text-xs sm:text-[13px]">
                <span className="text-slate-200/90 font-medium truncate">
                  Initializing EasyDay Workspace...
                </span>
                <span className="font-bold text-[#FACC15] tabular-nums shrink-0">
                  {clampedProgress}%
                </span>
              </div>
            </div>
          )}

          {/* Hairline Footer + Distribution Branding */}
          <div className="pt-3 border-t border-white/10 text-center space-y-1">
            <p className="text-xs font-medium text-slate-300">
              <span>EasyDay</span>
              <span className="mx-2 text-amber-400/70">|</span>
              <span>By </span>
              <span className="font-bold text-[#FACC15]">ZAIDI INTERACTIVE</span>
            </p>
            <p className="text-[11px] font-medium tracking-wide text-teal-300/90">
              Distributed by <span className="font-semibold text-white">ZAIDI STORE</span>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
