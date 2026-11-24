import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Award, Dices, RotateCw } from 'lucide-react';
import { ToolTranslationBundle } from '../../i18n/toolTranslations';
import { KametiMember } from '../../utils/storage';

interface KametiDrawWheelProps {
  eligibleMembers: KametiMember[];
  nextTurnNumber: number | null;
  t: ToolTranslationBundle['kameti'];
  onPickRandomWinner: () => KametiMember | null;
  onConfirmWinner: (winner: KametiMember) => void;
}

interface WheelSlicePalette {
  fill: string;
  text: string;
  accent: string;
}

const WHEEL_PALETTE: WheelSlicePalette[] = [
  { fill: '#0B2452', text: '#FFFFFF', accent: '#22D3EE' },
  { fill: '#0891B2', text: '#FFFFFF', accent: '#FEF08A' },
  { fill: '#FACC15', text: '#040D21', accent: '#0B2452' },
  { fill: '#1D4ED8', text: '#FFFFFF', accent: '#FACC15' },
  { fill: '#0D9488', text: '#FFFFFF', accent: '#FEF08A' },
  { fill: '#F59E0B', text: '#040D21', accent: '#040D21' },
];

export function resolveWheelMemberIndexAtRotation(
  memberCount: number,
  rotationDeg: number
): number {
  if (memberCount <= 1) return 0;
  const sliceDeg = 360 / memberCount;
  const normalizedRot = ((rotationDeg % 360) + 360) % 360;
  const angleAtPointer = ((360 - normalizedRot) % 360 + 360) % 360;
  return Math.floor(angleAtPointer / sliceDeg) % memberCount;
}

export function computeNextWheelRotation(
  memberCount: number,
  winnerIndex: number,
  currentRotationDeg: number,
  jitterRatio: number = 0
): number {
  if (memberCount <= 1) {
    return currentRotationDeg + 360 * 4;
  }
  const safeIdx = Math.max(0, Math.min(memberCount - 1, winnerIndex));
  const sliceDeg = 360 / memberCount;
  const sliceCenterDeg = (safeIdx + 0.5) * sliceDeg;
  const clampedJitter = Math.max(-0.26, Math.min(0.26, jitterRatio)) * sliceDeg;
  const desiredMod =
    (((360 - sliceCenterDeg + clampedJitter) % 360) + 360) % 360;
  const currentMod = ((currentRotationDeg % 360) + 360) % 360;
  let deltaMod = desiredMod - currentMod;
  if (deltaMod <= 0) {
    deltaMod += 360;
  }
  const extraFullTurns = 6 * 360;
  return currentRotationDeg + extraFullTurns + deltaMod;
}

function polarToCartesian(
  cx: number,
  cy: number,
  radius: number,
  angleDegFromTop: number
): { x: number; y: number } {
  const rad = ((angleDegFromTop - 90) * Math.PI) / 180;
  return {
    x: cx + radius * Math.cos(rad),
    y: cy + radius * Math.sin(rad),
  };
}

function describePieSlice(
  cx: number,
  cy: number,
  radius: number,
  startAngleDeg: number,
  endAngleDeg: number
): string {
  const start = polarToCartesian(cx, cy, radius, endAngleDeg);
  const end = polarToCartesian(cx, cy, radius, startAngleDeg);
  const largeArcFlag = endAngleDeg - startAngleDeg <= 180 ? '0' : '1';
  return [
    'M',
    cx,
    cy,
    'L',
    start.x,
    start.y,
    'A',
    radius,
    radius,
    0,
    largeArcFlag,
    0,
    end.x,
    end.y,
    'Z',
  ].join(' ');
}

function truncateSliceLabel(member: KametiMember, count: number): string {
  const maxLen = count > 12 ? 10 : count > 8 ? 12 : count > 5 ? 14 : 17;
  const raw = `#${member.memberNumber} ${member.name.trim()}`;
  if (raw.length <= maxLen) return raw;
  return `${raw.slice(0, maxLen - 1)}…`;
}

export const KametiDrawWheel: React.FC<KametiDrawWheelProps> = ({
  eligibleMembers,
  nextTurnNumber,
  t,
  onPickRandomWinner,
  onConfirmWinner,
}) => {
  const [rotationDeg, setRotationDeg] = useState<number>(0);
  const [isSpinning, setIsSpinning] = useState<boolean>(false);
  const [stoppedWinner, setStoppedWinner] = useState<KametiMember | null>(null);
  const rafRef = useRef<number | null>(null);
  const currentRotationRef = useRef<number>(0);

  // Reset stopped result when committee/eligible members list changes
  const memberKeySignature = useMemo(
    () => eligibleMembers.map((m) => m.id).join('|'),
    [eligibleMembers]
  );

  useEffect(() => {
    setStoppedWinner(null);
    setIsSpinning(false);
    if (rafRef.current !== null && typeof window !== 'undefined') {
      window.cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    }
  }, [memberKeySignature]);

  useEffect(() => {
    return () => {
      if (rafRef.current !== null && typeof window !== 'undefined') {
        window.cancelAnimationFrame(rafRef.current);
      }
    };
  }, []);

  const currentPointerMember = useMemo(() => {
    if (eligibleMembers.length === 0) return null;
    const idx = resolveWheelMemberIndexAtRotation(
      eligibleMembers.length,
      rotationDeg
    );
    return eligibleMembers[idx] || eligibleMembers[0];
  }, [eligibleMembers, rotationDeg]);

  const handleSpinWheel = () => {
    if (isSpinning || eligibleMembers.length === 0) return;

    const winner = onPickRandomWinner();
    if (!winner) return;

    const winnerIndex = eligibleMembers.findIndex((m) => m.id === winner.id);
    if (winnerIndex < 0) return;

    const prefersReducedMotion =
      typeof window !== 'undefined' &&
      typeof window.matchMedia === 'function' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    const startRotation = currentRotationRef.current;
    // Slight deterministic/random interior offset within slice bounds for natural landing
    const jitter = (Math.random() - 0.5) * 0.44;
    const targetRotation = computeNextWheelRotation(
      eligibleMembers.length,
      winnerIndex,
      startRotation,
      jitter
    );

    if (prefersReducedMotion || typeof window === 'undefined') {
      currentRotationRef.current = targetRotation;
      setRotationDeg(targetRotation);
      setStoppedWinner(winner);
      return;
    }

    setStoppedWinner(null);
    setIsSpinning(true);

    const spinDurationMs = 4300;
    const startTime = performance.now();

    const step = (now: number) => {
      const elapsed = now - startTime;
      const tNorm = Math.min(1, elapsed / spinDurationMs);
      // Quartic ease-out for crisp initial velocity and suspenseful deceleration
      const eased = 1 - Math.pow(1 - tNorm, 4);
      const nextAngle = startRotation + (targetRotation - startRotation) * eased;

      currentRotationRef.current = nextAngle;
      setRotationDeg(nextAngle);

      if (tNorm < 1) {
        rafRef.current = window.requestAnimationFrame(step);
      } else {
        rafRef.current = null;
        setIsSpinning(false);
        setStoppedWinner(winner);
      }
    };

    rafRef.current = window.requestAnimationFrame(step);
  };

  const cx = 170;
  const cy = 170;
  const outerRadius = 152;
  const rimDotCount = 24;
  const sliceCount = eligibleMembers.length;
  const sliceDeg = sliceCount > 0 ? 360 / sliceCount : 360;
  const sliceFontSize =
    sliceCount > 12 ? 9 : sliceCount > 8 ? 10.5 : sliceCount > 5 ? 11.5 : 13;

  const getSliceColors = (index: number): WheelSlicePalette => {
    let colorIdx = index % WHEEL_PALETTE.length;
    if (
      sliceCount > 1 &&
      index === sliceCount - 1 &&
      colorIdx === 0 &&
      WHEEL_PALETTE.length > 1
    ) {
      colorIdx = 1;
    }
    return WHEEL_PALETTE[colorIdx];
  };

  return (
    <div
      data-testid="kameti-draw-wheel-card"
      className="rounded-3xl bg-[#040D21] text-white border border-cyan-500/35 p-4 sm:p-5 space-y-4 shadow-lg"
    >
      {/* Card Header */}
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2.5 min-w-0">
          <span className="w-10 h-10 rounded-xl bg-yellow-400 text-[#040D21] flex items-center justify-center shrink-0">
            <Dices className="w-5 h-5" />
          </span>
          <div className="min-w-0">
            <h3 className="text-sm sm:text-base font-extrabold text-white truncate">
              {t.drawsUI.wheelTitle}
            </h3>
            <p className="text-[11px] sm:text-xs text-cyan-200/85 tabular-nums">
              {t.drawsUI.eligibleCountLabel}: {eligibleMembers.length}
              {nextTurnNumber ? ` · #${nextTurnNumber}` : ''}
            </p>
          </div>
        </div>
      </div>

      <p className="text-xs text-slate-300 leading-relaxed">
        {t.drawsUI.wheelSubtitle}
      </p>

      {eligibleMembers.length === 0 ? (
        <div className="rounded-2xl bg-[#0B1836] border border-[#1B315E] p-4 text-xs text-slate-300 text-center">
          {t.drawsUI.noEligibleMsg}
        </div>
      ) : (
        <div className="flex flex-col items-center space-y-3.5">
          {/* Interactive Wheel Stage */}
          <div className="relative w-full max-w-[320px] aspect-square flex items-center justify-center">
            {/* Ambient radial glow */}
            <div
              aria-hidden="true"
              className="absolute inset-4 rounded-full bg-[radial-gradient(circle,rgba(34,211,238,0.16)_0%,rgba(250,204,21,0.10)_55%,transparent_75%)] pointer-events-none"
            />

            {/* Fixed Top 12-o'clock Pointer */}
            <div
              aria-hidden="true"
              className="absolute top-0 left-1/2 -translate-x-1/2 z-20 flex flex-col items-center pointer-events-none drop-shadow-[0_4px_10px_rgba(0,0,0,0.65)]"
            >
              <svg width="34" height="36" viewBox="0 0 34 36">
                <path
                  d="M17 34L4 10C2.6 7.4 4.5 4 7.5 4H26.5C29.5 4 31.4 7.4 30 10L17 34Z"
                  fill="#FACC15"
                  stroke="#040D21"
                  strokeWidth="2.5"
                />
                <circle cx="17" cy="12" r="3.5" fill="#040D21" />
              </svg>
            </div>

            {/* Rotating SVG Wheel */}
            <svg
              viewBox="0 0 340 340"
              role="img"
              aria-label={t.drawsUI.wheelTitle}
              className="w-full h-full drop-shadow-[0_12px_28px_rgba(0,0,0,0.55)]"
            >
              {/* Outer stationary gold/navy ring */}
              <circle
                cx={cx}
                cy={cy}
                r={outerRadius + 10}
                fill="#071535"
                stroke="#22D3EE"
                strokeOpacity="0.45"
                strokeWidth="2.5"
              />

              {/* Rotating Group */}
              <g transform={`rotate(${rotationDeg} ${cx} ${cy})`}>
                {sliceCount === 1 ? (
                  <g>
                    <circle
                      cx={cx}
                      cy={cy}
                      r={outerRadius}
                      fill="#0891B2"
                      stroke="#FACC15"
                      strokeWidth="2"
                    />
                    <text
                      x={cx}
                      y={cy - 68}
                      fill="#FFFFFF"
                      fontSize="14"
                      fontWeight="800"
                      textAnchor="middle"
                      dominantBaseline="middle"
                    >
                      {truncateSliceLabel(eligibleMembers[0], 1)}
                    </text>
                  </g>
                ) : (
                  eligibleMembers.map((member, idx) => {
                    const startDeg = idx * sliceDeg;
                    const endDeg = (idx + 1) * sliceDeg;
                    const centerDeg = (idx + 0.5) * sliceDeg;
                    const colors = getSliceColors(idx);
                    const isStoppedWinner =
                      !isSpinning && stoppedWinner?.id === member.id;

                    // Compute label anchor along radial bisector at ~58% radius
                    const labelRadius = outerRadius * 0.6;
                    const labelPos = polarToCartesian(
                      cx,
                      cy,
                      labelRadius,
                      centerDeg
                    );
                    // Keep radial text readable upright
                    const textAngle =
                      centerDeg <= 180 ? centerDeg - 90 : centerDeg + 90;

                    return (
                      <g key={member.id}>
                        <path
                          d={describePieSlice(cx, cy, outerRadius, startDeg, endDeg)}
                          fill={colors.fill}
                          stroke={isStoppedWinner ? '#FFFFFF' : '#040D21'}
                          strokeWidth={isStoppedWinner ? 3 : 2}
                        />
                        <text
                          x={labelPos.x}
                          y={labelPos.y}
                          fill={colors.text}
                          fontSize={sliceFontSize}
                          fontWeight="800"
                          textAnchor="middle"
                          dominantBaseline="middle"
                          transform={`rotate(${textAngle} ${labelPos.x} ${labelPos.y})`}
                        >
                          {truncateSliceLabel(member, sliceCount)}
                        </text>
                      </g>
                    );
                  })
                )}

                {/* Rim stud markers to accentuate spin velocity */}
                {Array.from({ length: rimDotCount }).map((_, i) => {
                  const pt = polarToCartesian(
                    cx,
                    cy,
                    outerRadius + 5,
                    (i * 360) / rimDotCount
                  );
                  return (
                    <circle
                      key={i}
                      cx={pt.x}
                      cy={pt.y}
                      r={i % 2 === 0 ? 2.6 : 1.7}
                      fill={i % 2 === 0 ? '#FACC15' : '#22D3EE'}
                    />
                  );
                })}
              </g>
            </svg>

            {/* Center Spin Hub Button */}
            <button
              type="button"
              data-testid="wheel-hub-spin-btn"
              onClick={handleSpinWheel}
              disabled={isSpinning}
              aria-label={t.drawsUI.spinWheelBtn}
              className={`absolute z-10 w-[68px] h-[68px] rounded-full border-4 border-[#040D21] shadow-lg flex flex-col items-center justify-center transition-transform ${
                isSpinning
                  ? 'bg-cyan-500 text-[#040D21] scale-95 cursor-wait'
                  : 'bg-yellow-400 hover:bg-yellow-300 active:scale-95 text-[#040D21]'
              }`}
            >
              <RotateCw
                className={`w-4 h-4 ${isSpinning ? 'animate-spin' : ''}`}
                aria-hidden="true"
              />
              <span className="text-[10px] font-black tracking-wide leading-tight mt-0.5">
                {t.drawsUI.wheelHubSpin}
              </span>
            </button>
          </div>

          {/* Live Pointer Readout Bar */}
          <div className="w-full rounded-2xl bg-[#0B1836] border border-[#1B315E] px-3.5 py-2.5 flex items-center justify-between gap-2 text-xs">
            <span className="text-cyan-200/80 font-medium shrink-0">
              {stoppedWinner && !isSpinning
                ? `${t.drawsUI.wheelStoppedOnLabel}:`
                : `${t.drawsUI.wheelPointerLabel}:`}
            </span>
            <span
              data-testid="wheel-current-member"
              className="font-extrabold text-yellow-300 truncate tabular-nums"
            >
              {currentPointerMember
                ? `#${currentPointerMember.memberNumber} ${currentPointerMember.name}`
                : '—'}
            </span>
          </div>

          {/* Stopped Winner Announcement + Save Confirmation Trigger */}
          {stoppedWinner && !isSpinning ? (
            <div
              data-testid="wheel-winner-banner"
              className="w-full rounded-2xl bg-gradient-to-br from-yellow-400/20 via-[#0B204B] to-cyan-500/15 border border-yellow-400/60 p-3.5 space-y-3"
            >
              <div className="flex items-center gap-2.5">
                <span className="w-9 h-9 rounded-xl bg-yellow-400 text-[#040D21] flex items-center justify-center shrink-0">
                  <Award className="w-5 h-5" />
                </span>
                <div className="min-w-0">
                  <p className="text-[11px] font-semibold text-yellow-200">
                    {t.drawsUI.wheelStoppedOnLabel}
                  </p>
                  <p className="text-sm sm:text-base font-extrabold text-white truncate">
                    #{stoppedWinner.memberNumber} {stoppedWinner.name}
                  </p>
                </div>
              </div>

              <div className="flex flex-wrap gap-2">
                {eligibleMembers.length > 1 && (
                  <button
                    type="button"
                    data-testid="wheel-spin-again-btn"
                    onClick={handleSpinWheel}
                    className="px-4 py-2.5 rounded-xl bg-[#061026] hover:bg-[#0E2044] border border-cyan-500/35 text-cyan-200 text-xs font-bold min-h-[44px]"
                  >
                    {t.drawsUI.spinAgainBtn}
                  </button>
                )}
                <button
                  type="button"
                  data-testid="wheel-confirm-winner-btn"
                  onClick={() => onConfirmWinner(stoppedWinner)}
                  className="flex-1 py-2.5 px-4 rounded-xl bg-yellow-400 hover:bg-yellow-300 text-[#040D21] text-xs sm:text-sm font-extrabold min-h-[44px] transition-colors"
                >
                  {t.drawsUI.saveWheelWinnerBtn}
                </button>
              </div>
            </div>
          ) : (
            <button
              type="button"
              data-testid="run-random-draw-btn"
              onClick={handleSpinWheel}
              disabled={isSpinning}
              className={`w-full py-3 px-4 rounded-xl text-sm font-extrabold min-h-[48px] flex items-center justify-center gap-2 transition-colors ${
                isSpinning
                  ? 'bg-cyan-500/25 text-cyan-200 border border-cyan-400/40 cursor-wait'
                  : 'bg-yellow-400 hover:bg-yellow-300 text-[#040D21]'
              }`}
            >
              <RotateCw
                className={`w-4 h-4 ${isSpinning ? 'animate-spin' : ''}`}
              />
              <span>
                {isSpinning ? t.drawsUI.spinningBtn : t.drawsUI.spinWheelBtn}
              </span>
            </button>
          )}
        </div>
      )}
    </div>
  );
};
