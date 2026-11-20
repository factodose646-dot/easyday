import { AD_FREQUENCY_CONFIG } from '../config/adConfig';
import { GlobalAdRecord } from '../services/globalAdService';

export interface PersistedAdState {
  lastAdId: string | null;
  lastAdShownAt: number | null;
  lastAdDismissedAt: number | null;
  activeUsageSinceAdMs: number;
  inAppAdsShownCount: number;
}

export const INITIAL_PERSISTED_AD_STATE: PersistedAdState = {
  lastAdId: null,
  lastAdShownAt: null,
  lastAdDismissedAt: null,
  activeUsageSinceAdMs: 0,
  inAppAdsShownCount: 0,
};

export function loadPersistedAdState(): PersistedAdState {
  try {
    if (typeof localStorage === 'undefined') {
      return { ...INITIAL_PERSISTED_AD_STATE };
    }
    const raw = localStorage.getItem(AD_FREQUENCY_CONFIG.storageKey);
    if (!raw) return { ...INITIAL_PERSISTED_AD_STATE };
    const parsed = JSON.parse(raw) as Partial<PersistedAdState>;
    return {
      lastAdId: typeof parsed.lastAdId === 'string' ? parsed.lastAdId : null,
      lastAdShownAt:
        typeof parsed.lastAdShownAt === 'number' &&
        Number.isFinite(parsed.lastAdShownAt)
          ? parsed.lastAdShownAt
          : null,
      lastAdDismissedAt:
        typeof parsed.lastAdDismissedAt === 'number' &&
        Number.isFinite(parsed.lastAdDismissedAt)
          ? parsed.lastAdDismissedAt
          : null,
      activeUsageSinceAdMs:
        typeof parsed.activeUsageSinceAdMs === 'number' &&
        Number.isFinite(parsed.activeUsageSinceAdMs) &&
        parsed.activeUsageSinceAdMs >= 0
          ? parsed.activeUsageSinceAdMs
          : 0,
      inAppAdsShownCount:
        typeof parsed.inAppAdsShownCount === 'number' &&
        Number.isFinite(parsed.inAppAdsShownCount) &&
        parsed.inAppAdsShownCount >= 0
          ? parsed.inAppAdsShownCount
          : 0,
    };
  } catch {
    return { ...INITIAL_PERSISTED_AD_STATE };
  }
}

export function savePersistedAdState(state: PersistedAdState): void {
  try {
    if (typeof localStorage === 'undefined') return;
    localStorage.setItem(
      AD_FREQUENCY_CONFIG.storageKey,
      JSON.stringify(state)
    );
  } catch {
    // Ignore storage quota or restricted context errors
  }
}

/**
 * Selects the next eligible (active && published) advertisement,
 * avoiding repeating the last displayed ad whenever multiple ads exist.
 */
export function selectNextEligibleAd(
  ads: GlobalAdRecord[],
  lastAdId: string | null
): GlobalAdRecord | null {
  const eligible = ads.filter((ad) => ad.active && ad.published);
  if (eligible.length === 0) return null;
  if (eligible.length === 1) return eligible[0];

  if (!lastAdId) {
    return eligible[0];
  }

  const lastIndex = eligible.findIndex((ad) => ad.id === lastAdId);
  if (lastIndex === -1) {
    return eligible[0];
  }

  return eligible[(lastIndex + 1) % eligible.length];
}

/**
 * Determines whether the required active foreground usage interval has elapsed
 * for displaying an occasional in-app advertisement.
 */
export function isInAppAdDue(
  activeUsageSinceAdMs: number,
  inAppAdsShownCount: number,
  config = AD_FREQUENCY_CONFIG
): boolean {
  const requiredMs =
    inAppAdsShownCount === 0
      ? config.inAppInitialDelayMs
      : config.inAppCooldownMs;
  return activeUsageSinceAdMs >= requiredMs;
}

/**
 * Checks whether the DOM indicates the user is currently performing
 * critical input (typing in forms, notes, calculator expressions, or open tool dialogs).
 */
export function isUserInProtectedInteraction(
  lastInteractionAt: number,
  now: number = Date.now(),
  quietWindowMs: number = AD_FREQUENCY_CONFIG.userInteractionQuietMs
): boolean {
  if (now - lastInteractionAt < quietWindowMs) {
    return true;
  }

  if (typeof document === 'undefined') return false;

  const activeEl = document.activeElement;
  if (activeEl) {
    const tag = activeEl.tagName.toUpperCase();
    if (
      tag === 'INPUT' ||
      tag === 'TEXTAREA' ||
      tag === 'SELECT' ||
      (activeEl as HTMLElement).isContentEditable
    ) {
      return true;
    }
  }

  if (
    document.querySelector(
      '[data-ad-block="active"], [role="dialog"], [role="alertdialog"]'
    )
  ) {
    return true;
  }

  return false;
}
