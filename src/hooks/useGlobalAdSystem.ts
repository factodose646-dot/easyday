import { useCallback, useEffect, useRef, useState } from 'react';
import { AD_FREQUENCY_CONFIG } from '../config/adConfig';
import {
  AnnouncementRecord,
  fetchActiveAnnouncement,
  fetchEligibleGlobalAds,
  GlobalAdRecord,
} from '../services/globalAdService';
import {
  isInAppAdDue,
  isUserInProtectedInteraction,
  loadPersistedAdState,
  PersistedAdState,
  savePersistedAdState,
  selectNextEligibleAd,
} from '../utils/adFrequency';
import { registerAndroidAppStateChange } from '../utils/androidBridge';

export type ActiveAdPlacement = 'app-open' | 'in-app';

export interface ActiveAdPresentation {
  ad: GlobalAdRecord;
  placement: ActiveAdPlacement;
}

interface UseGlobalAdSystemParams {
  isReady: boolean; // True once the 10-second splash screen completes
  isBlockedContext: boolean; // True when Admin Portal or Splash Preview modal is open
}

export interface UseGlobalAdSystemResult {
  activePresentation: ActiveAdPresentation | null;
  dismissActiveAd: () => void;
  notifyNavigationMoment: () => void;
  announcement: AnnouncementRecord | null;
  eligibleAdsCount: number;
  refreshAdsAndAnnouncement: () => Promise<void>;
}

export function useGlobalAdSystem({
  isReady,
  isBlockedContext,
}: UseGlobalAdSystemParams): UseGlobalAdSystemResult {
  const [eligibleAds, setEligibleAds] = useState<GlobalAdRecord[]>([]);
  const [adsLoaded, setAdsLoaded] = useState(false);
  const [announcement, setAnnouncement] = useState<AnnouncementRecord | null>(
    null
  );
  const [activePresentation, setActivePresentation] =
    useState<ActiveAdPresentation | null>(null);

  // Per-launch session guard: app-open ad is evaluated at most once per app launch.
  const appOpenHandledRef = useRef<boolean>(false);
  const lastInteractionAtRef = useRef<number>(0);
  const activeUsageMsRef = useRef<number>(0);
  const isAppActiveRef = useRef<boolean>(true);
  const persistedRef = useRef<PersistedAdState>(loadPersistedAdState());

  const loadFeed = useCallback(async () => {
    const [adsResult, announcementResult] = await Promise.allSettled([
      fetchEligibleGlobalAds(),
      fetchActiveAnnouncement(),
    ]);

    if (adsResult.status === 'fulfilled') {
      setEligibleAds(adsResult.value.ads);
    }
    if (announcementResult.status === 'fulfilled') {
      setAnnouncement(announcementResult.value);
    }
    setAdsLoaded(true);
  }, []);

  // Pre-fetch ads and announcement during app startup so launch display is instant or skipped cleanly
  useEffect(() => {
    void loadFeed();
  }, [loadFeed]);

  // Track last active user input so occasional in-app ads never interrupt calculator taps or form editing
  useEffect(() => {
    const markInteraction = () => {
      lastInteractionAtRef.current = Date.now();
    };

    window.addEventListener('input', markInteraction, true);
    window.addEventListener('keydown', markInteraction, true);
    window.addEventListener('pointerdown', markInteraction, true);

    return () => {
      window.removeEventListener('input', markInteraction, true);
      window.removeEventListener('keydown', markInteraction, true);
      window.removeEventListener('pointerdown', markInteraction, true);
    };
  }, []);

  // App-Open Advertisement: evaluate once per launch right after splash finishes
  useEffect(() => {
    if (!isReady || !adsLoaded || isBlockedContext) return;
    if (appOpenHandledRef.current) return;

    appOpenHandledRef.current = true;

    if (
      typeof document !== 'undefined' &&
      document.visibilityState === 'hidden'
    ) {
      return;
    }

    const nextAd = selectNextEligibleAd(
      eligibleAds,
      persistedRef.current.lastAdId
    );
    if (!nextAd) return;

    const now = Date.now();
    const updatedState: PersistedAdState = {
      ...persistedRef.current,
      lastAdId: nextAd.id,
      lastAdShownAt: now,
      activeUsageSinceAdMs: 0,
    };
    persistedRef.current = updatedState;
    activeUsageMsRef.current = 0;
    savePersistedAdState(updatedState);

    setActivePresentation({ ad: nextAd, placement: 'app-open' });
  }, [adsLoaded, eligibleAds, isBlockedContext, isReady]);

  const tryShowOccasionalInAppAd = useCallback(() => {
    if (!isReady || !adsLoaded || isBlockedContext) return;
    if (activePresentation !== null) return;
    if (!appOpenHandledRef.current) return;
    if (!isAppActiveRef.current) return;
    if (
      typeof document !== 'undefined' &&
      document.visibilityState !== 'visible'
    ) {
      return;
    }

    if (
      !isInAppAdDue(
        activeUsageMsRef.current,
        persistedRef.current.inAppAdsShownCount
      )
    ) {
      return;
    }

    if (isUserInProtectedInteraction(lastInteractionAtRef.current)) {
      return;
    }

    const nextAd = selectNextEligibleAd(
      eligibleAds,
      persistedRef.current.lastAdId
    );
    if (!nextAd) return;

    const now = Date.now();
    const updatedState: PersistedAdState = {
      ...persistedRef.current,
      lastAdId: nextAd.id,
      lastAdShownAt: now,
      activeUsageSinceAdMs: 0,
      inAppAdsShownCount: persistedRef.current.inAppAdsShownCount + 1,
    };
    persistedRef.current = updatedState;
    activeUsageMsRef.current = 0;
    savePersistedAdState(updatedState);

    setActivePresentation({ ad: nextAd, placement: 'in-app' });
  }, [activePresentation, adsLoaded, eligibleAds, isBlockedContext, isReady]);

  // Foreground-only active usage clock (background time never increments active usage)
  useEffect(() => {
    if (!isReady || isBlockedContext || activePresentation !== null) return;

    const intervalId = window.setInterval(() => {
      if (!isAppActiveRef.current) {
        return;
      }
      if (
        typeof document !== 'undefined' &&
        document.visibilityState !== 'visible'
      ) {
        return;
      }

      activeUsageMsRef.current += AD_FREQUENCY_CONFIG.activeTickMs;

      if (
        isInAppAdDue(
          activeUsageMsRef.current,
          persistedRef.current.inAppAdsShownCount
        )
      ) {
        tryShowOccasionalInAppAd();
      }
    }, AD_FREQUENCY_CONFIG.activeTickMs);

    return () => {
      window.clearInterval(intervalId);
    };
  }, [activePresentation, isBlockedContext, isReady, tryShowOccasionalInAppAd]);

  // Handle background -> foreground returns cleanly: refresh eligibility if stale, never duplicate app-open ad
  useEffect(() => {
    const handleVisibilityChange = () => {
      const visible = document.visibilityState === 'visible';
      isAppActiveRef.current = visible;
      if (visible && isReady && !isBlockedContext) {
        void loadFeed();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    const cleanupNativeState = registerAndroidAppStateChange((isActive) => {
      isAppActiveRef.current = isActive;
      if (isActive && isReady && !isBlockedContext) {
        void loadFeed();
      }
    });

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      cleanupNativeState();
    };
  }, [isBlockedContext, isReady, loadFeed]);

  const dismissActiveAd = useCallback(() => {
    const now = Date.now();
    const updatedState: PersistedAdState = {
      ...persistedRef.current,
      lastAdDismissedAt: now,
      activeUsageSinceAdMs: 0,
    };
    persistedRef.current = updatedState;
    activeUsageMsRef.current = 0;
    savePersistedAdState(updatedState);
    setActivePresentation(null);
  }, []);

  const notifyNavigationMoment = useCallback(() => {
    tryShowOccasionalInAppAd();
  }, [tryShowOccasionalInAppAd]);

  return {
    activePresentation,
    dismissActiveAd,
    notifyNavigationMoment,
    announcement,
    eligibleAdsCount: eligibleAds.length,
    refreshAdsAndAnnouncement: loadFeed,
  };
}
