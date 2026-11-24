import { safeWriteString, STORAGE_KEYS } from './storage';

export type PinLength = 4 | 6;
export type AutoLockTimeoutSeconds = 0 | 30 | 60 | 300 | 600;

export const PBKDF2_ITERATIONS = 210_000;
const SALT_BYTE_LENGTH = 16;
const DERIVED_KEY_BITS = 256;
const MAX_FAILED_ATTEMPTS_BEFORE_LOCKOUT = 5;

export interface AppSecurityConfig {
  version: 1;
  pinEnabled: boolean;
  pinLength: PinLength;
  saltB64: string;
  hashB64: string;
  iterations: number;
  biometricEnabled: boolean;
  lockOnBackground: boolean;
  inactivityTimeoutSeconds: AutoLockTimeoutSeconds;
  failedAttempts: number;
  lockoutUntilMs: number | null;
  updatedAt: number;
}

export type SecurityActionErrorCode =
  | 'INVALID_PIN_FORMAT'
  | 'PIN_MISMATCH'
  | 'PIN_NOT_CONFIGURED'
  | 'WRONG_PIN'
  | 'LOCKED_OUT'
  | 'CRYPTO_UNAVAILABLE'
  | 'BIOMETRIC_REQUIRES_PIN'
  | 'BIOMETRIC_NOT_SUPPORTED'
  | 'STORAGE_WRITE_FAILED';

export interface SecurityActionResult {
  ok: boolean;
  config: AppSecurityConfig;
  errorCode?: SecurityActionErrorCode;
  failedAttempts?: number;
  remainingLockoutSeconds?: number;
}

export function createDefaultSecurityConfig(): AppSecurityConfig {
  return {
    version: 1,
    pinEnabled: false,
    pinLength: 4,
    saltB64: '',
    hashB64: '',
    iterations: PBKDF2_ITERATIONS,
    biometricEnabled: false,
    lockOnBackground: true,
    inactivityTimeoutSeconds: 60,
    failedAttempts: 0,
    lockoutUntilMs: null,
    updatedAt: 0,
  };
}

function isValidAutoLockTimeout(val: unknown): val is AutoLockTimeoutSeconds {
  return val === 0 || val === 30 || val === 60 || val === 300 || val === 600;
}

export function loadSecurityConfig(): AppSecurityConfig {
  const defaults = createDefaultSecurityConfig();
  if (typeof localStorage === 'undefined') {
    return defaults;
  }

  try {
    const raw = localStorage.getItem(STORAGE_KEYS.securityConfig);
    if (!raw) return defaults;
    const parsed = JSON.parse(raw) as Partial<AppSecurityConfig>;
    if (!parsed || typeof parsed !== 'object') return defaults;

    const hasValidCreds =
      parsed.pinEnabled === true &&
      typeof parsed.saltB64 === 'string' &&
      parsed.saltB64.length >= 16 &&
      typeof parsed.hashB64 === 'string' &&
      parsed.hashB64.length >= 32;

    const pinLength: PinLength = parsed.pinLength === 6 ? 6 : 4;
    const iterations =
      typeof parsed.iterations === 'number' &&
      Number.isFinite(parsed.iterations) &&
      parsed.iterations >= 100_000
        ? Math.floor(parsed.iterations)
        : PBKDF2_ITERATIONS;

    return {
      version: 1,
      pinEnabled: hasValidCreds,
      pinLength,
      saltB64: hasValidCreds ? parsed.saltB64! : '',
      hashB64: hasValidCreds ? parsed.hashB64! : '',
      iterations,
      biometricEnabled: hasValidCreds && parsed.biometricEnabled === true,
      lockOnBackground: parsed.lockOnBackground !== false,
      inactivityTimeoutSeconds: isValidAutoLockTimeout(parsed.inactivityTimeoutSeconds)
        ? parsed.inactivityTimeoutSeconds
        : 60,
      failedAttempts:
        typeof parsed.failedAttempts === 'number' &&
        Number.isFinite(parsed.failedAttempts) &&
        parsed.failedAttempts >= 0
          ? Math.floor(parsed.failedAttempts)
          : 0,
      lockoutUntilMs:
        typeof parsed.lockoutUntilMs === 'number' &&
        Number.isFinite(parsed.lockoutUntilMs) &&
        parsed.lockoutUntilMs > 0
          ? parsed.lockoutUntilMs
          : null,
      updatedAt:
        typeof parsed.updatedAt === 'number' && Number.isFinite(parsed.updatedAt)
          ? parsed.updatedAt
          : 0,
    };
  } catch {
    return defaults;
  }
}

function saveSecurityConfig(config: AppSecurityConfig): boolean {
  try {
    const res = safeWriteString(STORAGE_KEYS.securityConfig, JSON.stringify(config));
    return res.ok;
  } catch {
    return false;
  }
}

export function validatePinFormat(
  pin: string,
  expectedLength?: PinLength
): { valid: boolean; length?: PinLength } {
  if (typeof pin !== 'string') {
    return { valid: false };
  }
  if (!/^\d+$/.test(pin)) {
    return { valid: false };
  }
  if (expectedLength !== undefined) {
    return pin.length === expectedLength
      ? { valid: true, length: expectedLength }
      : { valid: false };
  }
  if (pin.length === 4 || pin.length === 6) {
    return { valid: true, length: pin.length };
  }
  return { valid: false };
}

function getWebCrypto(): Crypto | null {
  if (
    typeof globalThis !== 'undefined' &&
    globalThis.crypto &&
    typeof globalThis.crypto.getRandomValues === 'function' &&
    globalThis.crypto.subtle
  ) {
    return globalThis.crypto;
  }
  return null;
}

function bytesToBase64(bytes: Uint8Array): string {
  if (typeof Buffer !== 'undefined') {
    return Buffer.from(bytes).toString('base64');
  }
  let binary = '';
  for (let i = 0; i < bytes.length; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

function base64ToBytes(b64: string): Uint8Array {
  if (typeof Buffer !== 'undefined') {
    return new Uint8Array(Buffer.from(b64, 'base64'));
  }
  const binary = atob(b64);
  const out = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    out[i] = binary.charCodeAt(i);
  }
  return out;
}

function constantTimeEqual(a: Uint8Array, b: Uint8Array): boolean {
  if (a.length !== b.length || a.length === 0) {
    return false;
  }
  let diff = 0;
  for (let i = 0; i < a.length; i++) {
    diff |= a[i] ^ b[i];
  }
  return diff === 0;
}

export async function deriveSaltedPinHash(
  pin: string,
  existingSaltB64?: string,
  iterations = PBKDF2_ITERATIONS
): Promise<{ saltB64: string; hashB64: string; iterations: number }> {
  const cryptoObj = getWebCrypto();
  if (!cryptoObj) {
    throw new Error('CRYPTO_UNAVAILABLE');
  }

  const salt = existingSaltB64
    ? base64ToBytes(existingSaltB64)
    : cryptoObj.getRandomValues(new Uint8Array(SALT_BYTE_LENGTH));

  const encoder = new TextEncoder();
  const keyMaterial = await cryptoObj.subtle.importKey(
    'raw',
    encoder.encode(pin),
    'PBKDF2',
    false,
    ['deriveBits']
  );

  const derivedBuffer = await cryptoObj.subtle.deriveBits(
    {
      name: 'PBKDF2',
      salt: salt as BufferSource,
      iterations,
      hash: 'SHA-256',
    },
    keyMaterial,
    DERIVED_KEY_BITS
  );

  return {
    saltB64: bytesToBase64(salt),
    hashB64: bytesToBase64(new Uint8Array(derivedBuffer)),
    iterations,
  };
}

export function getRemainingLockoutSeconds(
  config: Pick<AppSecurityConfig, 'lockoutUntilMs'>,
  nowMs = Date.now()
): number {
  if (!config.lockoutUntilMs || config.lockoutUntilMs <= nowMs) {
    return 0;
  }
  return Math.max(1, Math.ceil((config.lockoutUntilMs - nowMs) / 1000));
}

function computeLockoutDurationMs(failedAttempts: number): number | null {
  if (failedAttempts < MAX_FAILED_ATTEMPTS_BEFORE_LOCKOUT) {
    return null;
  }
  const extraSteps = failedAttempts - MAX_FAILED_ATTEMPTS_BEFORE_LOCKOUT;
  // Progressive backoff: 30s -> 60s -> 120s max
  const seconds = Math.min(120, 30 * Math.pow(2, Math.min(2, extraSteps)));
  return seconds * 1000;
}

export async function setupPin(
  pin: string,
  confirmPin: string,
  nowMs = Date.now()
): Promise<SecurityActionResult> {
  const current = loadSecurityConfig();
  const format = validatePinFormat(pin);
  if (!format.valid || !format.length) {
    return { ok: false, config: current, errorCode: 'INVALID_PIN_FORMAT' };
  }
  if (pin !== confirmPin) {
    return { ok: false, config: current, errorCode: 'PIN_MISMATCH' };
  }

  let derived: { saltB64: string; hashB64: string; iterations: number };
  try {
    derived = await deriveSaltedPinHash(pin);
  } catch {
    return { ok: false, config: current, errorCode: 'CRYPTO_UNAVAILABLE' };
  }

  const next: AppSecurityConfig = {
    ...current,
    version: 1,
    pinEnabled: true,
    pinLength: format.length,
    saltB64: derived.saltB64,
    hashB64: derived.hashB64,
    iterations: derived.iterations,
    failedAttempts: 0,
    lockoutUntilMs: null,
    updatedAt: nowMs,
  };

  if (!saveSecurityConfig(next)) {
    return { ok: false, config: current, errorCode: 'STORAGE_WRITE_FAILED' };
  }
  return { ok: true, config: next };
}

export async function verifyPinAgainstConfig(
  pin: string,
  config: AppSecurityConfig,
  nowMs = Date.now()
): Promise<SecurityActionResult> {
  if (!config.pinEnabled || !config.saltB64 || !config.hashB64) {
    return { ok: false, config, errorCode: 'PIN_NOT_CONFIGURED' };
  }

  const activeLockoutSec = getRemainingLockoutSeconds(config, nowMs);
  if (activeLockoutSec > 0) {
    return {
      ok: false,
      config,
      errorCode: 'LOCKED_OUT',
      failedAttempts: config.failedAttempts,
      remainingLockoutSeconds: activeLockoutSec,
    };
  }

  const format = validatePinFormat(pin, config.pinLength);
  if (!format.valid) {
    return { ok: false, config, errorCode: 'INVALID_PIN_FORMAT' };
  }

  let candidate: { saltB64: string; hashB64: string; iterations: number };
  try {
    candidate = await deriveSaltedPinHash(
      pin,
      config.saltB64,
      config.iterations || PBKDF2_ITERATIONS
    );
  } catch {
    return { ok: false, config, errorCode: 'CRYPTO_UNAVAILABLE' };
  }

  const expectedBytes = base64ToBytes(config.hashB64);
  const actualBytes = base64ToBytes(candidate.hashB64);
  const matched = constantTimeEqual(expectedBytes, actualBytes);

  if (matched) {
    const clean: AppSecurityConfig = {
      ...config,
      failedAttempts: 0,
      lockoutUntilMs: null,
      updatedAt: config.failedAttempts > 0 || config.lockoutUntilMs ? nowMs : config.updatedAt,
    };
    if (clean !== config && (config.failedAttempts > 0 || config.lockoutUntilMs)) {
      saveSecurityConfig(clean);
    }
    return { ok: true, config: clean, failedAttempts: 0, remainingLockoutSeconds: 0 };
  }

  const nextFailures = config.failedAttempts + 1;
  const lockoutMs = computeLockoutDurationMs(nextFailures);
  const nextLockoutUntil = lockoutMs ? nowMs + lockoutMs : null;

  const updated: AppSecurityConfig = {
    ...config,
    failedAttempts: nextFailures,
    lockoutUntilMs: nextLockoutUntil,
    updatedAt: nowMs,
  };
  saveSecurityConfig(updated);

  if (lockoutMs) {
    return {
      ok: false,
      config: updated,
      errorCode: 'LOCKED_OUT',
      failedAttempts: nextFailures,
      remainingLockoutSeconds: Math.ceil(lockoutMs / 1000),
    };
  }

  return {
    ok: false,
    config: updated,
    errorCode: 'WRONG_PIN',
    failedAttempts: nextFailures,
    remainingLockoutSeconds: 0,
  };
}

export async function verifyUnlockPin(
  pin: string,
  nowMs = Date.now()
): Promise<SecurityActionResult> {
  const current = loadSecurityConfig();
  return verifyPinAgainstConfig(pin, current, nowMs);
}

export async function changePin(
  currentPin: string,
  newPin: string,
  confirmNewPin: string,
  nowMs = Date.now()
): Promise<SecurityActionResult> {
  const check = await verifyUnlockPin(currentPin, nowMs);
  if (!check.ok) {
    return check;
  }

  const format = validatePinFormat(newPin);
  if (!format.valid || !format.length) {
    return { ok: false, config: check.config, errorCode: 'INVALID_PIN_FORMAT' };
  }
  if (newPin !== confirmNewPin) {
    return { ok: false, config: check.config, errorCode: 'PIN_MISMATCH' };
  }

  let derived: { saltB64: string; hashB64: string; iterations: number };
  try {
    derived = await deriveSaltedPinHash(newPin);
  } catch {
    return { ok: false, config: check.config, errorCode: 'CRYPTO_UNAVAILABLE' };
  }

  const next: AppSecurityConfig = {
    ...check.config,
    pinEnabled: true,
    pinLength: format.length,
    saltB64: derived.saltB64,
    hashB64: derived.hashB64,
    iterations: derived.iterations,
    failedAttempts: 0,
    lockoutUntilMs: null,
    updatedAt: nowMs,
  };

  if (!saveSecurityConfig(next)) {
    return { ok: false, config: check.config, errorCode: 'STORAGE_WRITE_FAILED' };
  }
  return { ok: true, config: next };
}

export async function disablePin(
  currentPin: string,
  nowMs = Date.now()
): Promise<SecurityActionResult> {
  const check = await verifyUnlockPin(currentPin, nowMs);
  if (!check.ok) {
    return check;
  }

  const next: AppSecurityConfig = {
    ...check.config,
    pinEnabled: false,
    pinLength: 4,
    saltB64: '',
    hashB64: '',
    biometricEnabled: false,
    failedAttempts: 0,
    lockoutUntilMs: null,
    updatedAt: nowMs,
  };

  if (!saveSecurityConfig(next)) {
    return { ok: false, config: check.config, errorCode: 'STORAGE_WRITE_FAILED' };
  }
  return { ok: true, config: next };
}

export async function setBiometricUnlockEnabled(options: {
  enabled: boolean;
  currentPin?: string;
  biometricAvailable: boolean;
  nowMs?: number;
}): Promise<SecurityActionResult> {
  const nowMs = options.nowMs ?? Date.now();
  const current = loadSecurityConfig();

  if (!options.enabled) {
    const next: AppSecurityConfig = {
      ...current,
      biometricEnabled: false,
      updatedAt: nowMs,
    };
    if (!saveSecurityConfig(next)) {
      return { ok: false, config: current, errorCode: 'STORAGE_WRITE_FAILED' };
    }
    return { ok: true, config: next };
  }

  // Enabling biometrics requires PIN to already exist, device biometric support, and PIN verification
  if (!current.pinEnabled) {
    return { ok: false, config: current, errorCode: 'BIOMETRIC_REQUIRES_PIN' };
  }
  if (!options.biometricAvailable) {
    return { ok: false, config: current, errorCode: 'BIOMETRIC_NOT_SUPPORTED' };
  }
  if (!options.currentPin) {
    return { ok: false, config: current, errorCode: 'INVALID_PIN_FORMAT' };
  }

  const check = await verifyPinAgainstConfig(options.currentPin, current, nowMs);
  if (!check.ok) {
    return check;
  }

  const next: AppSecurityConfig = {
    ...check.config,
    biometricEnabled: true,
    updatedAt: nowMs,
  };
  if (!saveSecurityConfig(next)) {
    return { ok: false, config: check.config, errorCode: 'STORAGE_WRITE_FAILED' };
  }
  return { ok: true, config: next };
}

export function updateAutoLockPreferences(
  updates: {
    lockOnBackground?: boolean;
    inactivityTimeoutSeconds?: AutoLockTimeoutSeconds;
  },
  nowMs = Date.now()
): SecurityActionResult {
  const current = loadSecurityConfig();
  const next: AppSecurityConfig = {
    ...current,
    lockOnBackground:
      typeof updates.lockOnBackground === 'boolean'
        ? updates.lockOnBackground
        : current.lockOnBackground,
    inactivityTimeoutSeconds: isValidAutoLockTimeout(updates.inactivityTimeoutSeconds)
      ? updates.inactivityTimeoutSeconds
      : current.inactivityTimeoutSeconds,
    updatedAt: nowMs,
  };
  if (!saveSecurityConfig(next)) {
    return { ok: false, config: current, errorCode: 'STORAGE_WRITE_FAILED' };
  }
  return { ok: true, config: next };
}

export function resetSecurityLockoutOnBiometricSuccess(
  nowMs = Date.now()
): AppSecurityConfig {
  const current = loadSecurityConfig();
  if (!current.pinEnabled) return current;
  if (current.failedAttempts === 0 && !current.lockoutUntilMs) {
    return current;
  }
  const clean: AppSecurityConfig = {
    ...current,
    failedAttempts: 0,
    lockoutUntilMs: null,
    updatedAt: nowMs,
  };
  saveSecurityConfig(clean);
  return clean;
}

/**
 * Security recovery: resets ONLY local App Lock security credentials (PIN + biometric toggle).
 * Financial ledgers (Udhaar, Bills, Expenses, Notes, Photos, and Settings) are preserved intact.
 */
export function recoverResetSecurityOnly(): AppSecurityConfig {
  const clean = createDefaultSecurityConfig();
  if (typeof localStorage !== 'undefined') {
    try {
      localStorage.removeItem(STORAGE_KEYS.securityConfig);
    } catch {
      saveSecurityConfig(clean);
    }
  }
  return clean;
}

export function shouldAutoLockOnResume(params: {
  config: AppSecurityConfig;
  lastActiveAtMs: number;
  backgroundedAtMs: number | null;
  nowMs?: number;
  nativeDialogGraceActive?: boolean;
}): boolean {
  const { config, lastActiveAtMs, backgroundedAtMs, nativeDialogGraceActive } = params;
  const nowMs = params.nowMs ?? Date.now();

  if (!config.pinEnabled) return false;
  if (nativeDialogGraceActive) return false;

  if (config.lockOnBackground && backgroundedAtMs !== null) {
    return true;
  }

  if (
    config.inactivityTimeoutSeconds > 0 &&
    nowMs - lastActiveAtMs >= config.inactivityTimeoutSeconds * 1000
  ) {
    return true;
  }

  return false;
}
