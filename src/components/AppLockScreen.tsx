import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  AlertTriangle,
  Fingerprint,
  KeyRound,
  Lock,
  ShieldAlert,
  ShieldCheck,
  X,
} from 'lucide-react';
import { TranslationBundle } from '../i18n/translations';
import { Language } from '../types';
import {
  authenticateAndroidBiometric,
  checkAndroidBiometricAvailability,
} from '../utils/androidBridge';
import {
  AppSecurityConfig,
  getRemainingLockoutSeconds,
  recoverResetSecurityOnly,
  resetSecurityLockoutOnBiometricSuccess,
  verifyUnlockPin,
} from '../utils/appSecurity';
import { EasyDayLogo, EasyDayWordmark } from './BrandLogos';
import { NumericPinPad } from './NumericPinPad';

interface AppLockScreenProps {
  config: AppSecurityConfig;
  language: Language;
  onUnlock: (updatedConfig: AppSecurityConfig) => void;
  onSecurityRecovered: (updatedConfig: AppSecurityConfig) => void;
  t: TranslationBundle;
}

export const AppLockScreen: React.FC<AppLockScreenProps> = ({
  config,
  language,
  onUnlock,
  onSecurityRecovered,
  t,
}) => {
  const sec = t.settings.security;

  const [pinInput, setPinInput] = useState('');
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [statusTone, setStatusTone] = useState<'error' | 'info'>('error');
  const [verifying, setVerifying] = useState(false);
  const [errorShake, setErrorShake] = useState(false);

  const [lockoutSeconds, setLockoutSeconds] = useState<number>(() =>
    getRemainingLockoutSeconds(config)
  );
  const [biometricAvailable, setBiometricAvailable] = useState<boolean>(false);
  const [biometricBusy, setBiometricBusy] = useState<boolean>(false);

  const [recoveryOpen, setRecoveryOpen] = useState<boolean>(false);
  const [recoveryConfirmed, setRecoveryConfirmed] = useState<boolean>(false);

  const autoPromptTriggeredRef = useRef<boolean>(false);

  // Maintain live 1-second lockout cooldown countdown
  useEffect(() => {
    const initial = getRemainingLockoutSeconds(config);
    setLockoutSeconds(initial);
    if (initial <= 0) return;

    const timer = window.setInterval(() => {
      const rem = getRemainingLockoutSeconds(config);
      setLockoutSeconds(rem);
      if (rem <= 0) {
        window.clearInterval(timer);
        setStatusMessage(null);
      }
    }, 500);
    return () => window.clearInterval(timer);
  }, [config]);

  const handleBiometricUnlock = useCallback(async () => {
    if (!config.biometricEnabled || biometricBusy || verifying) return;
    setBiometricBusy(true);
    try {
      const res = await authenticateAndroidBiometric({
        title: sec.biometricPromptTitle,
        subtitle: sec.biometricPromptSubtitle,
        negativeButtonText: sec.biometricNegativeBtn,
      });

      if (res.status === 'success') {
        const cleanConfig = resetSecurityLockoutOnBiometricSuccess();
        onUnlock(cleanConfig);
        return;
      }

      if (res.status === 'cancelled') {
        setStatusTone('info');
        setStatusMessage(sec.biometricCancelledMsg);
      } else if (res.status === 'fallback') {
        setStatusTone('info');
        setStatusMessage(sec.biometricFallbackMsg);
      } else if (res.status === 'lockout') {
        setStatusTone('error');
        setStatusMessage(sec.biometricLockoutMsg);
      } else if (res.status === 'unavailable') {
        setBiometricAvailable(false);
        setStatusTone('info');
        setStatusMessage(sec.biometricUnavailableMsg);
      } else {
        setStatusTone('error');
        setStatusMessage(sec.biometricFailedMsg);
      }
    } finally {
      setBiometricBusy(false);
    }
  }, [biometricBusy, config.biometricEnabled, onUnlock, sec, verifying]);

  // Check native biometric availability and trigger once on lock screen entry if enabled
  useEffect(() => {
    let mounted = true;
    autoPromptTriggeredRef.current = false;

    const checkAndPrompt = async () => {
      if (!config.biometricEnabled) {
        setBiometricAvailable(false);
        return;
      }
      const avail = await checkAndroidBiometricAvailability();
      if (!mounted) return;
      setBiometricAvailable(avail.available);

      if (avail.available && !autoPromptTriggeredRef.current) {
        autoPromptTriggeredRef.current = true;
        void handleBiometricUnlock();
      }
    };

    void checkAndPrompt();
    return () => {
      mounted = false;
    };
  }, [config.biometricEnabled, handleBiometricUnlock]);

  const submitPin = useCallback(
    async (candidatePin: string) => {
      if (verifying || lockoutSeconds > 0) return;
      setVerifying(true);
      try {
        const outcome = await verifyUnlockPin(candidatePin);
        if (outcome.ok) {
          setPinInput('');
          setStatusMessage(null);
          onUnlock(outcome.config);
          return;
        }

        setPinInput('');
        setErrorShake(true);
        window.setTimeout(() => setErrorShake(false), 380);

        if (outcome.errorCode === 'LOCKED_OUT') {
          const secs = outcome.remainingLockoutSeconds ?? 30;
          setLockoutSeconds(secs);
          setStatusTone('error');
          setStatusMessage(`${sec.errorLockedOutPrefix} ${secs}s`);
        } else if (outcome.errorCode === 'CRYPTO_UNAVAILABLE') {
          setStatusTone('error');
          setStatusMessage(sec.errorCryptoUnavailable);
        } else {
          setStatusTone('error');
          setStatusMessage(
            outcome.failedAttempts && outcome.failedAttempts > 1
              ? `${sec.errorWrongPinAttempts} ${outcome.failedAttempts}`
              : sec.errorWrongPin
          );
        }
      } finally {
        setVerifying(false);
      }
    },
    [lockoutSeconds, onUnlock, sec, verifying]
  );

  const handlePinChange = (next: string) => {
    if (lockoutSeconds > 0 || verifying) return;
    if (statusMessage) {
      setStatusMessage(null);
    }
    setPinInput(next);
    if (next.length === config.pinLength) {
      void submitPin(next);
    }
  };

  const handleRecoverSecurityOnly = () => {
    if (!recoveryConfirmed) return;
    const clean = recoverResetSecurityOnly();
    setRecoveryOpen(false);
    setRecoveryConfirmed(false);
    onSecurityRecovered(clean);
  };

  const formatCountdown = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  };

  const isLockedOut = lockoutSeconds > 0;
  const canUseBiometrics = config.biometricEnabled && biometricAvailable;

  return (
    <div
      dir={language === 'ur' ? 'rtl' : 'ltr'}
      data-testid="app-lock-screen"
      className="fixed inset-0 z-50 min-h-[100dvh] bg-[#F2F6FC] dark:bg-[#040D21] text-slate-900 dark:text-slate-100 flex flex-col justify-between px-5 py-6 overflow-y-auto"
    >
      {/* Top Safe Branding Bar */}
      <div className="pt-[env(safe-area-inset-top,0px)] flex items-center justify-center">
        <div className="inline-flex items-center gap-2.5 px-3.5 py-2 rounded-2xl bg-white/80 dark:bg-[#0B1836] border border-slate-200 dark:border-[#1B315E] shadow-sm">
          <EasyDayLogo className="w-7 h-7 shrink-0" />
          <EasyDayWordmark className="text-base" />
        </div>
      </div>

      {/* Center Lock Card & Numeric Keypad */}
      <div className="w-full max-w-sm mx-auto my-auto py-4 space-y-6 text-center">
        <div className="space-y-2">
          <div className="w-14 h-14 mx-auto rounded-2xl bg-cyan-500/15 border border-cyan-500/35 text-cyan-700 dark:text-cyan-300 flex items-center justify-center shadow-sm">
            <Lock className="w-6 h-6" />
          </div>
          <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight">
            {sec.lockScreenTitle}
          </h1>
          <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400">
            {sec.lockScreenSubtitle}
          </p>
        </div>

        {/* Status / Lockout Banner */}
        {(isLockedOut || statusMessage) && (
          <div
            role={statusTone === 'error' || isLockedOut ? 'alert' : 'status'}
            className={`rounded-2xl border px-4 py-3 text-xs font-semibold flex items-center justify-center gap-2 ${
              statusTone === 'error' || isLockedOut
                ? 'bg-rose-500/15 border-rose-500/40 text-rose-700 dark:text-rose-200'
                : 'bg-cyan-500/15 border-cyan-500/35 text-cyan-800 dark:text-cyan-200'
            }`}
          >
            <ShieldAlert className="w-4 h-4 shrink-0" />
            <span className="tabular-nums">
              {isLockedOut
                ? `${sec.errorLockedOutPrefix} ${formatCountdown(lockoutSeconds)}`
                : statusMessage}
            </span>
          </div>
        )}

        {/* Masked PIN Dots + Numeric Keypad */}
        <NumericPinPad
          value={pinInput}
          length={config.pinLength}
          disabled={verifying || isLockedOut}
          errorShake={errorShake}
          onChange={handlePinChange}
          showBiometricKey={canUseBiometrics}
          onBiometricPress={() => void handleBiometricUnlock()}
          biometricLabel={sec.unlockBiometricBtn}
          clearLabel={sec.clearBtn}
          backspaceAriaLabel={sec.backspaceAria}
          dotsAriaLabel={sec.enterCurrentPinDotsAria}
          enableKeyboard={!recoveryOpen}
        />

        {/* Explicit Biometric Trigger Button when enabled */}
        {canUseBiometrics && (
          <button
            type="button"
            disabled={biometricBusy}
            onClick={() => void handleBiometricUnlock()}
            data-testid="biometric-unlock-btn"
            className="w-full max-w-[300px] mx-auto inline-flex items-center justify-center gap-2 px-4 py-3 rounded-2xl bg-cyan-500 hover:bg-cyan-400 disabled:opacity-60 text-[#040D21] text-sm font-bold min-h-[48px] transition-colors"
          >
            <Fingerprint className="w-5 h-5 shrink-0" />
            <span>{sec.unlockBiometricBtn}</span>
          </button>
        )}
      </div>

      {/* Bottom Safe Recovery Link */}
      <div className="pb-[max(0.5rem,env(safe-area-inset-bottom,0px))] flex items-center justify-center">
        <button
          type="button"
          onClick={() => {
            setRecoveryConfirmed(false);
            setRecoveryOpen(true);
          }}
          data-testid="forgot-pin-btn"
          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold text-slate-600 dark:text-slate-400 hover:text-cyan-700 dark:hover:text-cyan-300 min-h-[44px] transition-colors"
        >
          <KeyRound className="w-4 h-4" />
          <span>{sec.forgotPinBtn}</span>
        </button>
      </div>

      {/* Explicit Safe Security Recovery Dialog */}
      {recoveryOpen && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="pin-recovery-title"
          className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center p-0 sm:p-4 bg-[#020817]/80 backdrop-blur-sm"
        >
          <div className="w-full sm:max-w-md rounded-t-3xl sm:rounded-3xl bg-white dark:bg-[#0B1836] border border-slate-200 dark:border-[#1B315E] p-6 pb-[max(1.5rem,calc(env(safe-area-inset-bottom,0px)+1rem))] space-y-4 shadow-2xl">
            <div className="w-10 h-1.5 rounded-full bg-slate-300 dark:bg-slate-700 mx-auto sm:hidden" />

            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-2.5">
                <AlertTriangle className="w-5 h-5 text-yellow-500 shrink-0" />
                <h2
                  id="pin-recovery-title"
                  className="text-lg font-bold text-slate-900 dark:text-white"
                >
                  {sec.recoveryTitle}
                </h2>
              </div>
              <button
                type="button"
                onClick={() => setRecoveryOpen(false)}
                aria-label={sec.cancelBtn}
                className="min-w-[40px] min-h-[40px] rounded-xl flex items-center justify-center text-slate-500 hover:bg-slate-100 dark:hover:bg-[#11244D]"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
              {sec.recoveryWarningBody}
            </p>

            <div className="rounded-2xl bg-emerald-500/10 border border-emerald-500/35 p-3.5 flex items-start gap-2.5">
              <ShieldCheck className="w-5 h-5 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
              <p className="text-xs font-semibold text-emerald-800 dark:text-emerald-200 leading-relaxed">
                {sec.recoveryDataSafeBox}
              </p>
            </div>

            <label className="flex items-start gap-3 p-3 rounded-2xl bg-slate-50 dark:bg-[#061026] border border-slate-200 dark:border-[#1B315E] cursor-pointer">
              <input
                type="checkbox"
                checked={recoveryConfirmed}
                onChange={(e) => setRecoveryConfirmed(e.target.checked)}
                data-testid="recovery-confirm-checkbox"
                className="mt-0.5 w-4 h-4 accent-cyan-500 rounded shrink-0"
              />
              <span className="text-xs font-semibold text-slate-700 dark:text-slate-200 leading-relaxed">
                {sec.recoveryCheckboxLabel}
              </span>
            </label>

            <div className="grid grid-cols-2 gap-2.5 pt-1">
              <button
                type="button"
                onClick={() => setRecoveryOpen(false)}
                className="py-2.5 px-4 rounded-xl bg-slate-100 dark:bg-[#061026] text-slate-800 dark:text-slate-200 text-sm font-bold min-h-[44px]"
              >
                {sec.cancelBtn}
              </button>
              <button
                type="button"
                disabled={!recoveryConfirmed}
                onClick={handleRecoverSecurityOnly}
                data-testid="recovery-reset-btn"
                className="py-2.5 px-4 rounded-xl bg-yellow-400 hover:bg-yellow-300 disabled:opacity-45 text-[#040D21] text-sm font-bold min-h-[44px]"
              >
                {sec.recoveryConfirmBtn}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
