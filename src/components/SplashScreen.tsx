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

interface FloatingBubbleSpec {
  id: number;
  left: string;
  size: number;
  duration: number;
  delay: number;
  drift: number;
  opacity: number;
  tint: 'cyan' | 'gold' | 'ice';
}

const SPLASH_BUBBLES: FloatingBubbleSpec[] = [
  { id: 1, left: '7%', size: 18, duration: 9.2, delay: -2.1, drift: 16, opacity: 0.48, tint: 'cyan' },
  { id: 2, left: '15%', size: 32, duration: 11.4, delay: -6.4, drift: -18, opacity: 0.36, tint: 'gold' },
  { id: 3, left: '23%', size: 12, duration: 7.8, delay: -1.2, drift: 12, opacity: 0.56, tint: 'ice' },
  { id: 4, left: '31%', size: 24, duration: 10.6, delay: -4.9, drift: -14, opacity: 0.42, tint: 'cyan' },
  { id: 5, left: '40%', size: 14, duration: 8.4, delay: -7.1, drift: 18, opacity: 0.52, tint: 'gold' },
  { id: 6, left: '49%', size: 38, duration: 12.8, delay: -3.6, drift: -20, opacity: 0.32, tint: 'cyan' },
  { id: 7, left: '57%', size: 16, duration: 8.1, delay: -5.3, drift: 15, opacity: 0.54, tint: 'ice' },
  { id: 8, left: '66%', size: 28, duration: 10.9, delay: -8.2, drift: -16, opacity: 0.38, tint: 'gold' },
  { id: 9, left: '74%', size: 13, duration: 7.5, delay: -2.8, drift: 14, opacity: 0.55, tint: 'cyan' },
  { id: 10, left: '82%', size: 34, duration: 11.8, delay: -6.0, drift: -18, opacity: 0.34, tint: 'ice' },
  { id: 11, left: '90%', size: 20, duration: 9.4, delay: -1.9, drift: 14, opacity: 0.46, tint: 'gold' },
  { id: 12, left: '11%', size: 22, duration: 10.2, delay: -9.1, drift: 12, opacity: 0.4, tint: 'ice' },
  { id: 13, left: '44%', size: 10, duration: 7.2, delay: -4.4, drift: -12, opacity: 0.58, tint: 'cyan' },
  { id: 14, left: '62%', size: 22, duration: 9.8, delay: -0.7, drift: 16, opacity: 0.44, tint: 'cyan' },
  { id: 15, left: '86%', size: 14, duration: 8.3, delay: -5.8, drift: -14, opacity: 0.52, tint: 'cyan' },
  { id: 16, left: '28%', size: 42, duration: 13.4, delay: -10.3, drift: 20, opacity: 0.28, tint: 'gold' },
];

function getBubbleStyle(bubble: FloatingBubbleSpec): React.CSSProperties {
  const gradientByTint = {
    cyan: 'radial-gradient(circle at 30% 28%, rgba(255,255,255,0.68) 0%, rgba(56,189,248,0.34) 38%, rgba(14,116,144,0.14) 76%, rgba(56,189,248,0.04) 100%)',
    gold: 'radial-gradient(circle at 30% 28%, rgba(255,255,255,0.65) 0%, rgba(250,204,21,0.32) 40%, rgba(217,119,6,0.12) 78%, rgba(250,204,21,0.04) 100%)',
    ice: 'radial-gradient(circle at 30% 28%, rgba(255,255,255,0.75) 0%, rgba(147,197,253,0.3) 42%, rgba(30,58,138,0.12) 80%, rgba(147,197,253,0.03) 100%)',
  };

  const borderByTint = {
    cyan: '1px solid rgba(103, 232, 249, 0.35)',
    gold: '1px solid rgba(253, 224, 71, 0.32)',
    ice: '1px solid rgba(191, 219, 254, 0.35)',
  };

  return {
    left: bubble.left,
    bottom: '-56px',
    width: `${bubble.size}px`,
    height: `${bubble.size}px`,
    background: gradientByTint[bubble.tint],
    border: borderByTint[bubble.tint],
    boxShadow: 'inset 0 0 10px rgba(255,255,255,0.22), 0 0 12px rgba(56,189,248,0.12)',
    ['--bubble-duration' as string]: `${bubble.duration}s`,
    ['--bubble-drift' as string]: `${bubble.drift}px`,
    ['--bubble-opacity' as string]: String(bubble.opacity),
    animationDelay: `${bubble.delay}s`,
  };
}

export const SplashScreen: React.FC<SplashScreenProps> = ({
  progress,
  error,
  onRetry,
  previewMode = false,
  onClosePreview,
}) => {
  const clampedProgress = Math.max(0, Math.min(100, Math.round(progress)));
  const ringRadius = 36;
  const ringCircumference = 2 * Math.PI * ringRadius;
  const strokeDashoffset =
    ringCircumference - (clampedProgress / 100) * ringCircumference;

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

        {/* Animated translucent floating bubbles */}
        {SPLASH_BUBBLES.map((bubble) => (
          <span
            key={bubble.id}
            className="absolute rounded-full animate-splash-bubble"
            style={getBubbleStyle(bubble)}
          />
        ))}
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
              className="relative w-[112px] min-[380px]:w-[128px] sm:w-[144px] h-auto object-contain drop-shadow-[0_12px_28px_rgba(0,0,0,0.45)]"
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
          <div className="mt-4 sm:mt-5 flex items-center justify-center gap-3 w-48 sm:w-56">
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
          <h1 className="mt-3.5 sm:mt-4 font-display font-extrabold text-3xl min-[380px]:text-4xl sm:text-[42px] tracking-[0.22em] ps-[0.22em] leading-tight bg-gradient-to-b from-[#FFE57F] via-[#FACC15] to-[#E59A00] bg-clip-text text-transparent">
            EASYDAY
          </h1>
          <p className="mt-1 text-[11px] sm:text-xs font-medium tracking-[0.2em] text-slate-300/90">
            make you easy
          </p>
        </div>

        {/* Bottom Zone: Circular Loading Progress Bar, Initializing Message & Safe Footer */}
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
            <div className="flex flex-col items-center gap-2.5">
              {/* Circular Loading Progress Bar */}
              <div
                role="progressbar"
                aria-valuemin={0}
                aria-valuemax={100}
                aria-valuenow={clampedProgress}
                aria-label="Loading EasyDay workspace"
                className="relative w-[92px] h-[92px] flex items-center justify-center"
              >
                {/* Soft ambient cyan/gold glow behind circle */}
                <div
                  aria-hidden="true"
                  className="absolute inset-1 rounded-full bg-[radial-gradient(circle,rgba(34,211,238,0.16)_0%,rgba(250,204,21,0.08)_60%,transparent_100%)]"
                />

                <svg
                  viewBox="0 0 96 96"
                  className="w-full h-full"
                  aria-hidden="true"
                >
                  <defs>
                    <linearGradient
                      id="easydaySplashRingGrad"
                      x1="0%"
                      y1="0%"
                      x2="100%"
                      y2="100%"
                    >
                      <stop offset="0%" stopColor="#F59E0B" />
                      <stop offset="50%" stopColor="#FDE047" />
                      <stop offset="100%" stopColor="#22D3EE" />
                    </linearGradient>
                  </defs>

                  {/* Rotating outer subtle dashed accent orbit */}
                  <circle
                    cx="48"
                    cy="48"
                    r="44"
                    fill="none"
                    stroke="rgba(56, 189, 248, 0.28)"
                    strokeWidth="1.25"
                    strokeDasharray="4 6"
                    className="animate-splash-orbit"
                  />

                  {/* Base circle track */}
                  <circle
                    cx="48"
                    cy="48"
                    r={ringRadius}
                    fill="rgba(7, 21, 53, 0.72)"
                    stroke="rgba(255, 255, 255, 0.12)"
                    strokeWidth="6"
                  />

                  {/* Animated circular progress stroke */}
                  <circle
                    cx="48"
                    cy="48"
                    r={ringRadius}
                    fill="none"
                    stroke="url(#easydaySplashRingGrad)"
                    strokeWidth="6"
                    strokeLinecap="round"
                    strokeDasharray={ringCircumference}
                    strokeDashoffset={strokeDashoffset}
                    transform="rotate(-90 48 48)"
                    className="transition-[stroke-dashoffset] duration-150 ease-out"
                  />
                </svg>

                {/* Centered percentage readout */}
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className="text-base font-extrabold text-[#FACC15] tabular-nums leading-none">
                    {clampedProgress}%
                  </span>
                </div>
              </div>

              {/* Loading message */}
              <span className="text-xs sm:text-[13px] text-slate-200/90 font-medium text-center">
                Initializing EasyDay Workspace...
              </span>
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
