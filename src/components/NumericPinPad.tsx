import React, { useEffect } from 'react';
import { Delete, Fingerprint, RotateCcw } from 'lucide-react';
import { PinLength } from '../utils/appSecurity';

interface NumericPinPadProps {
  value: string;
  length: PinLength;
  disabled?: boolean;
  errorShake?: boolean;
  onChange: (nextValue: string) => void;
  showBiometricKey?: boolean;
  onBiometricPress?: () => void;
  biometricLabel?: string;
  clearLabel?: string;
  backspaceAriaLabel?: string;
  dotsAriaLabel?: string;
  enableKeyboard?: boolean;
}

const KEY_ROWS = [
  ['1', '2', '3'],
  ['4', '5', '6'],
  ['7', '8', '9'],
] as const;

export const NumericPinPad: React.FC<NumericPinPadProps> = ({
  value,
  length,
  disabled = false,
  errorShake = false,
  onChange,
  showBiometricKey = false,
  onBiometricPress,
  biometricLabel = 'Biometrics',
  clearLabel = 'Clear',
  backspaceAriaLabel = 'Delete digit',
  dotsAriaLabel = 'PIN entry dots',
  enableKeyboard = true,
}) => {
  const handleDigit = (digit: string) => {
    if (disabled || value.length >= length) return;
    onChange(value + digit);
  };

  const handleBackspace = () => {
    if (disabled || value.length === 0) return;
    onChange(value.slice(0, -1));
  };

  const handleClear = () => {
    if (disabled || value.length === 0) return;
    onChange('');
  };

  useEffect(() => {
    if (!enableKeyboard || disabled) return;
    const onKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null;
      if (
        target &&
        (target.tagName === 'INPUT' ||
          target.tagName === 'TEXTAREA' ||
          target.tagName === 'SELECT')
      ) {
        return;
      }
      if (/^[0-9]$/.test(e.key)) {
        e.preventDefault();
        if (value.length < length) {
          onChange(value + e.key);
        }
      } else if (e.key === 'Backspace') {
        e.preventDefault();
        if (value.length > 0) {
          onChange(value.slice(0, -1));
        }
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [disabled, enableKeyboard, length, onChange, value]);

  return (
    <div dir="ltr" className="w-full max-w-[300px] mx-auto select-none space-y-5">
      {/* Masked PIN Progress Dots */}
      <div
        role="group"
        aria-label={`${dotsAriaLabel}: ${value.length} / ${length}`}
        className="flex items-center justify-center gap-3.5 py-2"
      >
        {Array.from({ length }).map((_, idx) => {
          const filled = idx < value.length;
          const active = idx === value.length && !disabled;
          return (
            <span
              key={idx}
              aria-hidden="true"
              className={`w-4 h-4 rounded-full transition-all duration-150 ${
                errorShake
                  ? 'bg-rose-500 border-2 border-rose-400 scale-105'
                  : filled
                    ? 'bg-cyan-500 dark:bg-cyan-400 border-2 border-cyan-400 dark:border-cyan-300 shadow-[0_0_12px_rgba(6,182,212,0.45)] scale-110'
                    : active
                      ? 'bg-transparent border-2 border-cyan-500/70 dark:border-cyan-400/70'
                      : 'bg-slate-200/80 dark:bg-[#0D1E42] border-2 border-slate-300 dark:border-[#213B70]'
              }`}
            />
          );
        })}
      </div>

      {/* Tactile 3x4 Numeric Keypad */}
      <div className="grid grid-cols-3 gap-2.5 sm:gap-3">
        {KEY_ROWS.flat().map((digit) => (
          <button
            key={digit}
            type="button"
            disabled={disabled}
            onClick={() => handleDigit(digit)}
            data-testid={`pin-key-${digit}`}
            className="h-14 sm:h-[58px] rounded-2xl bg-slate-100 dark:bg-[#0D1E42] hover:bg-slate-200/90 dark:hover:bg-[#142A59] active:scale-95 disabled:opacity-45 border border-slate-200 dark:border-[#1E3668] text-xl font-bold text-slate-900 dark:text-white tabular-nums transition-all flex items-center justify-center"
          >
            {digit}
          </button>
        ))}

        {/* Bottom-Left Key: Fingerprint Quick Trigger or Clear */}
        {showBiometricKey && onBiometricPress ? (
          <button
            type="button"
            disabled={disabled}
            onClick={onBiometricPress}
            aria-label={biometricLabel}
            data-testid="pin-key-biometric"
            className="h-14 sm:h-[58px] rounded-2xl bg-cyan-500/15 hover:bg-cyan-500/25 active:scale-95 disabled:opacity-45 border border-cyan-500/35 text-cyan-700 dark:text-cyan-300 transition-all flex items-center justify-center"
          >
            <Fingerprint className="w-6 h-6" />
          </button>
        ) : (
          <button
            type="button"
            disabled={disabled || value.length === 0}
            onClick={handleClear}
            aria-label={clearLabel}
            data-testid="pin-key-clear"
            className="h-14 sm:h-[58px] rounded-2xl bg-slate-50 dark:bg-[#08132D] hover:bg-slate-100 dark:hover:bg-[#10224A] active:scale-95 disabled:opacity-35 border border-slate-200/80 dark:border-[#1B315E] text-xs font-bold text-slate-600 dark:text-slate-300 transition-all flex items-center justify-center gap-1"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
        )}

        {/* Bottom-Center Key: 0 */}
        <button
          type="button"
          disabled={disabled}
          onClick={() => handleDigit('0')}
          data-testid="pin-key-0"
          className="h-14 sm:h-[58px] rounded-2xl bg-slate-100 dark:bg-[#0D1E42] hover:bg-slate-200/90 dark:hover:bg-[#142A59] active:scale-95 disabled:opacity-45 border border-slate-200 dark:border-[#1E3668] text-xl font-bold text-slate-900 dark:text-white tabular-nums transition-all flex items-center justify-center"
        >
          0
        </button>

        {/* Bottom-Right Key: Backspace */}
        <button
          type="button"
          disabled={disabled || value.length === 0}
          onClick={handleBackspace}
          aria-label={backspaceAriaLabel}
          data-testid="pin-key-backspace"
          className="h-14 sm:h-[58px] rounded-2xl bg-slate-50 dark:bg-[#08132D] hover:bg-slate-100 dark:hover:bg-[#10224A] active:scale-95 disabled:opacity-35 border border-slate-200/80 dark:border-[#1B315E] text-slate-700 dark:text-slate-200 transition-all flex items-center justify-center"
        >
          <Delete className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
};
