import React, { useState } from 'react';
import {
  AlertCircle,
  ArrowLeft,
  Eye,
  EyeOff,
  Lock,
  ShieldCheck,
} from 'lucide-react';
import { AdminTranslationBundle } from '../../i18n/adminTranslations';
import { signInAdmin } from '../../services/adminService';
import { EasyDayLogo, ZaidiStoreLogo } from '../BrandLogos';

interface AdminLoginScreenProps {
  tAdmin: AdminTranslationBundle;
  onSuccess: () => Promise<void> | void;
  onExit: () => void;
}

export const AdminLoginScreen: React.FC<AdminLoginScreenProps> = ({
  tAdmin,
  onSuccess,
  onExit,
}) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    const trimmedEmail = email.trim();
    if (!trimmedEmail) {
      setErrorMsg(tAdmin.login.missingEmail);
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmedEmail)) {
      setErrorMsg(tAdmin.login.invalidEmail);
      return;
    }
    if (!password) {
      setErrorMsg(tAdmin.login.missingPassword);
      return;
    }

    setSubmitting(true);
    try {
      await signInAdmin(trimmedEmail, password);
      await onSuccess();
    } catch (err) {
      setErrorMsg(
        err instanceof Error ? err.message : 'Authentication failed.'
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-[100dvh] bg-[#F6F9FC] dark:bg-[#0B1120] text-slate-900 dark:text-slate-100 flex flex-col px-4 py-6 sm:px-6 safe-app-main">
      {/* Top Exit Bar */}
      <div className="max-w-md w-full mx-auto flex items-center justify-between gap-3 mb-6">
        <button
          type="button"
          onClick={onExit}
          className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-white dark:bg-[#131C31] border border-slate-200 dark:border-slate-800 text-xs sm:text-sm font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 min-h-[44px] transition-colors"
        >
          <ArrowLeft className="w-4 h-4 rtl:rotate-180" />
          <span>{tAdmin.backToApp}</span>
        </button>

        <div className="inline-flex items-center gap-2 text-xs font-bold text-[#0B6FF2] dark:text-sky-400">
          <ZaidiStoreLogo className="w-5 h-5" />
          <span>ZAIDI STORE</span>
        </div>
      </div>

      {/* Login Card */}
      <div className="flex-1 flex items-center justify-center">
        <div className="w-full max-w-md rounded-3xl bg-white dark:bg-[#131C31] border border-slate-200 dark:border-slate-800 p-6 sm:p-8 shadow-sm space-y-6">
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <EasyDayLogo className="w-11 h-11 shrink-0" />
              <div className="min-w-0">
                <p className="text-xs font-semibold text-teal-700 dark:text-teal-400">
                  {tAdmin.login.badge}
                </p>
                <h1 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white tracking-tight">
                  {tAdmin.login.heading}
                </h1>
              </div>
            </div>
            <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
              {tAdmin.login.subheading}
            </p>
          </div>

          {errorMsg && (
            <div
              role="alert"
              className="rounded-2xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900/70 p-3.5 flex items-start gap-2.5 text-xs sm:text-sm text-red-700 dark:text-red-300"
            >
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{errorMsg}</span>
            </div>
          )}

          <form onSubmit={(e) => void handleSubmit(e)} className="space-y-4" noValidate>
            <div className="space-y-1.5">
              <label
                htmlFor="admin-email-input"
                className="block text-xs font-semibold text-slate-700 dark:text-slate-300"
              >
                {tAdmin.login.emailLabel}
              </label>
              <input
                id="admin-email-input"
                type="email"
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder={tAdmin.login.emailPlaceholder}
                disabled={submitting}
                className="w-full h-12 px-4 rounded-xl bg-slate-50 dark:bg-slate-900/80 border border-slate-200 dark:border-slate-700 text-sm text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#0B6FF2]"
              />
            </div>

            <div className="space-y-1.5">
              <label
                htmlFor="admin-password-input"
                className="block text-xs font-semibold text-slate-700 dark:text-slate-300"
              >
                {tAdmin.login.passwordLabel}
              </label>
              <div className="relative">
                <input
                  id="admin-password-input"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder={tAdmin.login.passwordPlaceholder}
                  disabled={submitting}
                  className="w-full h-12 ps-4 pe-12 rounded-xl bg-slate-50 dark:bg-slate-900/80 border border-slate-200 dark:border-slate-700 text-sm text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#0B6FF2]"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((prev) => !prev)}
                  aria-label={
                    showPassword
                      ? tAdmin.login.hidePassword
                      : tAdmin.login.showPassword
                  }
                  className="absolute top-1/2 -translate-y-1/2 end-1.5 min-w-[40px] min-h-[40px] flex items-center justify-center rounded-lg text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-white"
                >
                  {showPassword ? (
                    <EyeOff className="w-4 h-4" />
                  ) : (
                    <Eye className="w-4 h-4" />
                  )}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="w-full min-h-[48px] px-4 py-3 rounded-xl bg-[#0B6FF2] hover:bg-blue-700 disabled:opacity-60 text-white text-sm font-semibold flex items-center justify-center gap-2 transition-colors"
            >
              <Lock className="w-4 h-4" />
              <span>
                {submitting
                  ? tAdmin.login.signingInBtn
                  : tAdmin.login.submitBtn}
              </span>
            </button>
          </form>

          <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex items-start gap-2.5 text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
            <ShieldCheck className="w-4 h-4 text-teal-600 dark:text-teal-400 shrink-0 mt-0.5" />
            <span>{tAdmin.login.securityNote}</span>
          </div>
        </div>
      </div>
    </div>
  );
};
