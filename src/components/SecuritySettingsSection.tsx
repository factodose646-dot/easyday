import React, { useCallback, useEffect, useState } from 'react';
import {
  CheckCircle2,
  Clock,
  Fingerprint,
  KeyRound,
  Lock,
  Shield,
  ShieldAlert,
  ShieldCheck,
  X,
} from 'lucide-react';
import { TranslationBundle } from '../i18n/translations';
import {
  AndroidBiometricAvailabilityResult,
  checkAndroidBiometricAvailability,
} from '../utils/androidBridge';
import {
  AppSecurityConfig,
  AutoLockTimeoutSeconds,
  changePin,
  disablePin,
  PinLength,
  setBiometricUnlockEnabled,
  setupPin,
  updateAutoLockPreferences,
  verifyUnlockPin,
} from '../utils/appSecurity';
import { NumericPinPad } from './NumericPinPad';

interface SecuritySettingsSectionProps {
  config: AppSecurityConfig;
  onConfigUpdated: (next: AppSecurityConfig) => void;
  onLockNow: () => void;
  t: TranslationBundle;
}

type ModalMode =
  | null
  | {
      kind: 'create';
      step: 'enter' | 'confirm';
      pinLength: PinLength;
      firstPin: string;
    }
  | {
      kind: 'change';
      step: 'verify_current' | 'enter_new' | 'confirm_new';
      pinLength: PinLength;
      verifiedCurrentPin: string;
      firstNewPin: string;
    }
  | {
      kind: 'disable';
    }
  | {
      kind: 'enable_biometric';
    };

export const SecuritySettingsSection: React.FC<SecuritySettingsSectionProps> = ({
  config,
  onConfigUpdated,
  onLockNow,
  t,
}) => {
  const sec = t.settings.security;

  const [biometricSupport, setBiometricSupport] =
    useState<AndroidBiometricAvailabilityResult>({
      available: false,
      status: 'web_unsupported',
    });
  const [banner, setBanner] = useState<{
    tone: 'success' | 'error' | 'info';
    text: string;
  } | null>(null);

  const [modal, setModal] = useState<ModalMode>(null);
  const [pinEntry, setPinEntry] = useState('');
  const [modalError, setModalError] = useState<string | null>(null);
  const [modalBusy, setModalBusy] = useState(false);

  useEffect(() => {
    let active = true;
    void checkAndroidBiometricAvailability().then((res) => {
      if (active) setBiometricSupport(res);
    });
    return () => {
      active = false;
    };
  }, []);

  const closeModal = () => {
    if (modalBusy) return;
    setModal(null);
    setPinEntry('');
    setModalError(null);
  };

  const openCreatePin = () => {
    setBanner(null);
    setPinEntry('');
    setModalError(null);
    setModal({
      kind: 'create',
      step: 'enter',
      pinLength: 4,
      firstPin: '',
    });
  };

  const openChangePin = () => {
    setBanner(null);
    setPinEntry('');
    setModalError(null);
    setModal({
      kind: 'change',
      step: 'verify_current',
      pinLength: config.pinLength,
      verifiedCurrentPin: '',
      firstNewPin: '',
    });
  };

  const openDisablePin = () => {
    setBanner(null);
    setPinEntry('');
    setModalError(null);
    setModal({ kind: 'disable' });
  };

  const handleBiometricToggle = async () => {
    if (!config.pinEnabled) {
      setBanner({ tone: 'info', text: sec.biometricRequiresPinHint });
      return;
    }

    if (config.biometricEnabled) {
      const res = await setBiometricUnlockEnabled({
        enabled: false,
        biometricAvailable: biometricSupport.available,
      });
      if (res.ok) {
        onConfigUpdated(res.config);
        setBanner({ tone: 'success', text: sec.modalSuccessBiometricDisabled });
      }
      return;
    }

    if (!biometricSupport.available) {
      setBanner({
        tone: 'info',
        text: getBiometricStatusText(),
      });
      return;
    }

    setBanner(null);
    setPinEntry('');
    setModalError(null);
    setModal({ kind: 'enable_biometric' });
  };

  const getBiometricStatusText = useCallback(() => {
    if (!config.pinEnabled) return sec.biometricRequiresPinHint;
    switch (biometricSupport.status) {
      case 'available':
        return sec.biometricReadyHint;
      case 'none_enrolled':
        return sec.biometricNotEnrolledHint;
      case 'no_hardware':
        return sec.biometricNoHardwareHint;
      case 'hw_unavailable':
      case 'security_update_required':
        return sec.biometricHwUnavailableHint;
      case 'web_unsupported':
        return sec.biometricWebPreviewHint;
      default:
        return sec.biometricHwUnavailableHint;
    }
  }, [biometricSupport.status, config.pinEnabled, sec]);

  const activeExpectedPinLength: PinLength = !modal
    ? 4
    : modal.kind === 'create'
      ? modal.pinLength
      : modal.kind === 'change'
        ? modal.step === 'verify_current'
          ? config.pinLength
          : modal.pinLength
        : config.pinLength;

  const processCompletedPin = async (entered: string) => {
    if (!modal || modalBusy) return;
    setModalError(null);

    if (modal.kind === 'create') {
      if (modal.step === 'enter') {
        setPinEntry('');
        setModal({
          ...modal,
          step: 'confirm',
          firstPin: entered,
        });
        return;
      }

      setModalBusy(true);
      try {
        const res = await setupPin(modal.firstPin, entered);
        if (res.ok) {
          onConfigUpdated(res.config);
          setModal(null);
          setPinEntry('');
          setBanner({ tone: 'success', text: sec.modalSuccessPinSet });
        } else {
          setPinEntry('');
          setModal({
            ...modal,
            step: 'enter',
            firstPin: '',
          });
          setModalError(
            res.errorCode === 'CRYPTO_UNAVAILABLE'
              ? sec.errorCryptoUnavailable
              : sec.errorMismatch
          );
        }
      } finally {
        setModalBusy(false);
      }
      return;
    }

    if (modal.kind === 'change') {
      if (modal.step === 'verify_current') {
        setModalBusy(true);
        try {
          const check = await verifyUnlockPin(entered);
          if (check.ok) {
            onConfigUpdated(check.config);
            setPinEntry('');
            setModal({
              ...modal,
              step: 'enter_new',
              verifiedCurrentPin: entered,
            });
          } else {
            onConfigUpdated(check.config);
            setPinEntry('');
            if (check.errorCode === 'LOCKED_OUT') {
              setModalError(
                `${sec.errorLockedOutPrefix} ${check.remainingLockoutSeconds ?? 30}s`
              );
            } else {
              setModalError(sec.errorWrongPin);
            }
          }
        } finally {
          setModalBusy(false);
        }
        return;
      }

      if (modal.step === 'enter_new') {
        setPinEntry('');
        setModal({
          ...modal,
          step: 'confirm_new',
          firstNewPin: entered,
        });
        return;
      }

      setModalBusy(true);
      try {
        const res = await changePin(
          modal.verifiedCurrentPin,
          modal.firstNewPin,
          entered
        );
        if (res.ok) {
          onConfigUpdated(res.config);
          setModal(null);
          setPinEntry('');
          setBanner({ tone: 'success', text: sec.modalSuccessPinChanged });
        } else {
          setPinEntry('');
          setModal({
            ...modal,
            step: 'enter_new',
            firstNewPin: '',
          });
          setModalError(
            res.errorCode === 'PIN_MISMATCH'
              ? sec.errorMismatch
              : sec.errorWrongPin
          );
        }
      } finally {
        setModalBusy(false);
      }
      return;
    }

    if (modal.kind === 'disable') {
      setModalBusy(true);
      try {
        const res = await disablePin(entered);
        if (res.ok) {
          onConfigUpdated(res.config);
          setModal(null);
          setPinEntry('');
          setBanner({ tone: 'success', text: sec.modalSuccessPinDisabled });
        } else {
          onConfigUpdated(res.config);
          setPinEntry('');
          if (res.errorCode === 'LOCKED_OUT') {
            setModalError(
              `${sec.errorLockedOutPrefix} ${res.remainingLockoutSeconds ?? 30}s`
            );
          } else {
            setModalError(sec.errorWrongPin);
          }
        }
      } finally {
        setModalBusy(false);
      }
      return;
    }

    if (modal.kind === 'enable_biometric') {
      setModalBusy(true);
      try {
        const res = await setBiometricUnlockEnabled({
          enabled: true,
          currentPin: entered,
          biometricAvailable: biometricSupport.available,
        });
        if (res.ok) {
          onConfigUpdated(res.config);
          setModal(null);
          setPinEntry('');
          setBanner({ tone: 'success', text: sec.modalSuccessBiometricEnabled });
        } else {
          onConfigUpdated(res.config);
          setPinEntry('');
          if (res.errorCode === 'LOCKED_OUT') {
            setModalError(
              `${sec.errorLockedOutPrefix} ${res.remainingLockoutSeconds ?? 30}s`
            );
          } else {
            setModalError(sec.errorWrongPin);
          }
        }
      } finally {
        setModalBusy(false);
      }
    }
  };

  const handlePinPadChange = (next: string) => {
    if (modalError) setModalError(null);
    setPinEntry(next);
    if (next.length === activeExpectedPinLength) {
      void processCompletedPin(next);
    }
  };

  const handleToggleBackgroundLock = () => {
    const res = updateAutoLockPreferences({
      lockOnBackground: !config.lockOnBackground,
    });
    if (res.ok) {
      onConfigUpdated(res.config);
    }
  };

  const handleSelectTimeout = (seconds: AutoLockTimeoutSeconds) => {
    const res = updateAutoLockPreferences({
      inactivityTimeoutSeconds: seconds,
    });
    if (res.ok) {
      onConfigUpdated(res.config);
    }
  };

  const timeoutOptions: Array<{ value: AutoLockTimeoutSeconds; label: string }> = [
    { value: 0, label: sec.timeoutBackgroundOnly },
    { value: 30, label: sec.timeout30s },
    { value: 60, label: sec.timeout1m },
    { value: 300, label: sec.timeout5m },
    { value: 600, label: sec.timeout10m },
  ];

  const modalTitle = !modal
    ? ''
    : modal.kind === 'create'
      ? sec.modalCreateTitle
      : modal.kind === 'change'
        ? sec.modalChangeTitle
        : modal.kind === 'disable'
          ? sec.modalDisableTitle
          : sec.biometricEnableModalTitle;

  const modalSubtitle = !modal
    ? ''
    : modal.kind === 'create'
      ? modal.step === 'enter'
        ? sec.modalCreateStep1
        : sec.modalCreateStep2
      : modal.kind === 'change'
        ? modal.step === 'verify_current'
          ? sec.modalChangeStepCurrent
          : modal.step === 'enter_new'
            ? sec.modalChangeStepNew
            : sec.modalChangeStepConfirm
        : modal.kind === 'disable'
          ? sec.modalDisableBody
          : sec.biometricEnableModalBody;

  const showPinLengthSelector =
    modal !== null &&
    ((modal.kind === 'create' && modal.step === 'enter') ||
      (modal.kind === 'change' && modal.step === 'enter_new'));

  return (
    <section aria-labelledby="settings-security" className="space-y-3">
      <h2
        id="settings-security"
        className="text-sm font-bold text-slate-500 dark:text-slate-400 px-1"
      >
        {sec.sectionTitle}
      </h2>

      <div className="rounded-3xl bg-white dark:bg-[#0B1836] border border-slate-200 dark:border-[#1B315E] divide-y divide-slate-100 dark:divide-[#1B315E] overflow-hidden">
        {/* PIN Protection Header + Controls */}
        <div className="p-5 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-start gap-3.5">
              <span
                className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                  config.pinEnabled
                    ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400'
                    : 'bg-cyan-500/15 text-cyan-700 dark:text-cyan-300'
                }`}
              >
                <Shield className="w-5 h-5" />
              </span>
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <p className="text-sm font-bold text-slate-900 dark:text-white">
                    {sec.cardTitle}
                  </p>
                  <span
                    className={`text-[11px] font-bold px-2 py-0.5 rounded-lg ${
                      config.pinEnabled
                        ? 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300'
                        : 'bg-slate-100 dark:bg-[#061026] text-slate-600 dark:text-slate-400'
                    }`}
                  >
                    {config.pinEnabled
                      ? `${sec.pinStatusEnabled} · ${
                          config.pinLength === 6
                            ? sec.pinLengthBadge6
                            : sec.pinLengthBadge4
                        }`
                      : sec.pinStatusDisabled}
                  </span>
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
                  {sec.cardSubtitle}
                </p>
              </div>
            </div>

            {!config.pinEnabled && (
              <button
                type="button"
                onClick={openCreatePin}
                data-testid="setup-pin-btn"
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-[#040D21] text-xs sm:text-sm font-bold min-h-[44px] shrink-0 whitespace-nowrap transition-colors"
              >
                <KeyRound className="w-4 h-4 shrink-0" />
                <span>{sec.enablePinBtn}</span>
              </button>
            )}
          </div>

          {/* Feedback Banner */}
          {banner && (
            <div
              role={banner.tone === 'error' ? 'alert' : 'status'}
              className={`rounded-2xl border p-3 flex items-center justify-between gap-2 text-xs font-semibold ${
                banner.tone === 'success'
                  ? 'bg-emerald-500/15 border-emerald-500/35 text-emerald-800 dark:text-emerald-200'
                  : banner.tone === 'error'
                    ? 'bg-rose-500/15 border-rose-500/40 text-rose-700 dark:text-rose-200'
                    : 'bg-cyan-500/10 border-cyan-500/30 text-cyan-800 dark:text-cyan-200'
              }`}
            >
              <div className="flex items-center gap-2 min-w-0">
                <CheckCircle2 className="w-4 h-4 shrink-0" />
                <span className="break-words">{banner.text}</span>
              </div>
              <button
                type="button"
                onClick={() => setBanner(null)}
                aria-label={sec.cancelBtn}
                className="p-1 rounded-lg hover:bg-black/5 dark:hover:bg-white/10 shrink-0"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          )}

          {/* Active PIN Actions: Change PIN / Disable PIN / Lock Now */}
          {config.pinEnabled && (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
              <button
                type="button"
                onClick={openChangePin}
                data-testid="change-pin-btn"
                className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-slate-100 dark:bg-[#061026] border border-slate-200 dark:border-[#213B70] hover:border-cyan-500 text-slate-800 dark:text-slate-100 text-xs sm:text-sm font-bold min-h-[44px] transition-colors whitespace-nowrap"
              >
                <KeyRound className="w-4 h-4 text-cyan-600 dark:text-cyan-400 shrink-0" />
                <span>{sec.changePinBtn}</span>
              </button>

              <button
                type="button"
                onClick={onLockNow}
                data-testid="lock-now-btn"
                className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-yellow-400 hover:bg-yellow-300 text-[#040D21] text-xs sm:text-sm font-bold min-h-[44px] transition-colors whitespace-nowrap"
              >
                <Lock className="w-4 h-4 shrink-0" />
                <span>{sec.lockNowBtn}</span>
              </button>

              <button
                type="button"
                onClick={openDisablePin}
                data-testid="disable-pin-btn"
                className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/30 text-rose-700 dark:text-rose-300 text-xs sm:text-sm font-bold min-h-[44px] transition-colors whitespace-nowrap"
              >
                <ShieldAlert className="w-4 h-4 shrink-0" />
                <span>{sec.disablePinBtn}</span>
              </button>
            </div>
          )}
        </div>

        {/* Fingerprint / Biometric Lock Row */}
        <div className="p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-start gap-3.5 min-w-0">
            <span className="w-10 h-10 rounded-xl bg-cyan-500/15 text-cyan-700 dark:text-cyan-300 flex items-center justify-center shrink-0">
              <Fingerprint className="w-5 h-5" />
            </span>
            <div className="min-w-0 space-y-1">
              <p className="text-sm font-bold text-slate-900 dark:text-white">
                {sec.biometricTitle}
              </p>
              <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                {sec.biometricDesc}
              </p>
              <p className="text-[11px] font-semibold text-cyan-700 dark:text-cyan-300">
                {getBiometricStatusText()}
              </p>
            </div>
          </div>

          <button
            type="button"
            role="switch"
            aria-checked={config.biometricEnabled}
            aria-label={sec.biometricTitle}
            disabled={!config.pinEnabled || (!config.biometricEnabled && !biometricSupport.available)}
            onClick={() => void handleBiometricToggle()}
            data-testid="biometric-toggle-btn"
            className={`w-14 h-8 rounded-full p-1 transition-colors shrink-0 flex items-center disabled:opacity-40 ${
              config.biometricEnabled
                ? 'bg-cyan-500 justify-end'
                : 'bg-slate-200 dark:bg-[#061026] border border-slate-300 dark:border-[#213B70] justify-start'
            }`}
          >
            <span className="w-6 h-6 rounded-full bg-white shadow-sm block" />
          </button>
        </div>

        {/* Auto-Lock Configuration (Visible when PIN is Active) */}
        {config.pinEnabled && (
          <div className="p-5 space-y-4">
            <div className="flex items-center gap-2 text-xs font-bold text-slate-700 dark:text-slate-200">
              <Clock className="w-4 h-4 text-yellow-500 dark:text-yellow-400 shrink-0" />
              <span>{sec.autoLockLabel}</span>
            </div>

            {/* Lock on Background Toggle */}
            <div className="flex items-center justify-between gap-4">
              <div className="min-w-0">
                <p className="text-sm font-semibold text-slate-900 dark:text-white">
                  {sec.lockOnBackgroundTitle}
                </p>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  {sec.lockOnBackgroundDesc}
                </p>
              </div>
              <button
                type="button"
                role="switch"
                aria-checked={config.lockOnBackground}
                aria-label={sec.lockOnBackgroundTitle}
                onClick={handleToggleBackgroundLock}
                data-testid="lock-background-toggle"
                className={`w-14 h-8 rounded-full p-1 transition-colors shrink-0 flex items-center ${
                  config.lockOnBackground
                    ? 'bg-cyan-500 justify-end'
                    : 'bg-slate-200 dark:bg-[#061026] border border-slate-300 dark:border-[#213B70] justify-start'
                }`}
              >
                <span className="w-6 h-6 rounded-full bg-white shadow-sm block" />
              </button>
            </div>

            {/* Inactivity Timer Selector */}
            <div className="space-y-2">
              <p className="text-xs font-bold text-slate-700 dark:text-slate-300">
                {sec.inactivityLabel}
              </p>
              <div
                role="group"
                aria-label={sec.inactivityLabel}
                className="flex flex-wrap gap-2"
              >
                {timeoutOptions.map((opt) => {
                  const selected = config.inactivityTimeoutSeconds === opt.value;
                  return (
                    <button
                      key={opt.value}
                      type="button"
                      aria-pressed={selected}
                      onClick={() => handleSelectTimeout(opt.value)}
                      data-testid={`autolock-opt-${opt.value}`}
                      className={`px-3.5 py-2 rounded-xl text-xs font-bold min-h-[40px] transition-colors ${
                        selected
                          ? 'bg-cyan-500 text-[#040D21] shadow-sm'
                          : 'bg-slate-100 dark:bg-[#061026] border border-slate-200 dark:border-[#1B315E] text-slate-700 dark:text-slate-300 hover:border-cyan-500/60'
                      }`}
                    >
                      {opt.label}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* PIN Setup / Change / Disable / Verify Modal */}
      {modal && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="pin-modal-title"
          className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-[#020817]/80 backdrop-blur-sm"
        >
          <div className="w-full sm:max-w-md rounded-t-3xl sm:rounded-3xl bg-white dark:bg-[#0B1836] border border-slate-200 dark:border-[#1B315E] p-6 pb-[max(1.5rem,calc(env(safe-area-inset-bottom,0px)+1rem))] space-y-5 shadow-2xl max-h-[94dvh] overflow-y-auto">
            <div className="w-10 h-1.5 rounded-full bg-slate-300 dark:bg-slate-700 mx-auto sm:hidden" />

            <div className="flex items-start justify-between gap-3">
              <div className="flex items-start gap-2.5 min-w-0">
                <span className="w-9 h-9 rounded-xl bg-cyan-500/15 text-cyan-600 dark:text-cyan-300 flex items-center justify-center shrink-0">
                  <ShieldCheck className="w-5 h-5" />
                </span>
                <div className="min-w-0">
                  <h3
                    id="pin-modal-title"
                    className="text-base sm:text-lg font-bold text-slate-900 dark:text-white"
                  >
                    {modalTitle}
                  </h3>
                  <p className="text-xs text-slate-600 dark:text-slate-400 mt-0.5">
                    {modalSubtitle}
                  </p>
                </div>
              </div>
              <button
                type="button"
                disabled={modalBusy}
                onClick={closeModal}
                aria-label={sec.cancelBtn}
                className="min-w-[40px] min-h-[40px] rounded-xl flex items-center justify-center text-slate-500 hover:bg-slate-100 dark:hover:bg-[#11244D] shrink-0"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* 4-Digit vs 6-Digit Selector during PIN creation */}
            {showPinLengthSelector && (
              <div className="space-y-1.5">
                <p className="text-xs font-bold text-slate-600 dark:text-slate-400 text-center">
                  {sec.pinLengthLabel}
                </p>
                <div
                  role="group"
                  aria-label={sec.pinLengthLabel}
                  className="grid grid-cols-2 gap-1.5 max-w-[240px] mx-auto p-1 rounded-xl bg-slate-100 dark:bg-[#061026]"
                >
                  {([4, 6] as PinLength[]).map((len) => (
                    <button
                      key={len}
                      type="button"
                      disabled={modalBusy}
                      onClick={() => {
                        setPinEntry('');
                        setModalError(null);
                        setModal({ ...modal, pinLength: len });
                      }}
                      aria-pressed={modal.pinLength === len}
                      data-testid={`pin-length-${len}`}
                      className={`py-2 rounded-lg text-xs font-bold transition-colors ${
                        modal.pinLength === len
                          ? 'bg-cyan-500 text-[#040D21] shadow-sm'
                          : 'text-slate-600 dark:text-slate-300'
                      }`}
                    >
                      {len === 4 ? sec.pinLength4 : sec.pinLength6}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Modal Error Alert */}
            {modalError && (
              <div
                role="alert"
                className="rounded-xl bg-rose-500/15 border border-rose-500/40 px-3.5 py-2.5 text-xs font-semibold text-rose-700 dark:text-rose-200 text-center"
              >
                {modalError}
              </div>
            )}

            {/* Masked PIN Pad */}
            <NumericPinPad
              value={pinEntry}
              length={activeExpectedPinLength}
              disabled={modalBusy}
              errorShake={Boolean(modalError)}
              onChange={handlePinPadChange}
              clearLabel={sec.clearBtn}
              backspaceAriaLabel={sec.backspaceAria}
              dotsAriaLabel={sec.enterCurrentPinDotsAria}
            />

            <div className="flex items-center justify-between gap-3 pt-1">
              {((modal.kind === 'create' && modal.step === 'confirm') ||
                (modal.kind === 'change' && modal.step === 'confirm_new')) ? (
                <button
                  type="button"
                  disabled={modalBusy}
                  onClick={() => {
                    setPinEntry('');
                    setModalError(null);
                    if (modal.kind === 'create') {
                      setModal({ ...modal, step: 'enter', firstPin: '' });
                    } else {
                      setModal({ ...modal, step: 'enter_new', firstNewPin: '' });
                    }
                  }}
                  className="px-4 py-2.5 rounded-xl bg-slate-100 dark:bg-[#061026] text-xs font-bold text-slate-700 dark:text-slate-200 min-h-[44px]"
                >
                  {sec.backStepBtn}
                </button>
              ) : (
                <span />
              )}

              <button
                type="button"
                disabled={modalBusy}
                onClick={closeModal}
                className="px-4 py-2.5 rounded-xl bg-slate-100 dark:bg-[#061026] text-xs font-bold text-slate-700 dark:text-slate-200 min-h-[44px]"
              >
                {sec.cancelBtn}
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
};
