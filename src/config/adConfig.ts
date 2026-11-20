/**
 * Configurable frequency and interval limits for the EasyDay Global In-App Advertisement System.
 * Adjust these durations cleanly to tune ad cadence.
 */
export const AD_FREQUENCY_CONFIG = {
  /** Maximum app-open ads displayed per fresh app launch session. */
  maxAppOpenAdsPerLaunch: 1,

  /** Minimum active foreground usage (ms) before the first occasional in-app ad can appear. */
  inAppInitialDelayMs: 5 * 60 * 1000, // 5 minutes

  /** Minimum active foreground usage (ms) after dismissing an ad before the next in-app ad. */
  inAppCooldownMs: 5 * 60 * 1000, // 5 minutes

  /** Minimum idle gap (ms) after user typing/tool input before showing an in-app ad. */
  userInteractionQuietMs: 4000,

  /** Foreground usage tracking interval (ms). Background time is never counted. */
  activeTickMs: 1000,

  /** Persisted storage key for frequency & recent ad rotation state. */
  storageKey: 'easyday-global-ad-state-v1',
} as const;
