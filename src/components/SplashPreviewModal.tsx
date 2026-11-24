import React, { useEffect, useState } from 'react';
import { TranslationBundle } from '../i18n/translations';
import { SplashScreen } from './SplashScreen';

interface SplashPreviewModalProps {
  open: boolean;
  onClose: () => void;
  t: TranslationBundle;
}

export const SplashPreviewModal: React.FC<SplashPreviewModalProps> = ({
  open,
  onClose,
}) => {
  const [previewProgress, setPreviewProgress] = useState(0);

  useEffect(() => {
    if (!open) {
      setPreviewProgress(0);
      return;
    }

    const start = performance.now();
    const duration = 8000;
    let rafId = 0;

    const tick = (now: number) => {
      const elapsed = now - start;
      const pct = Math.min(100, (elapsed / duration) * 100);
      setPreviewProgress(pct);
      if (pct < 100) {
        rafId = window.requestAnimationFrame(tick);
      }
    };

    rafId = window.requestAnimationFrame(tick);
    return () => window.cancelAnimationFrame(rafId);
  }, [open]);

  if (!open) return null;

  return (
    <SplashScreen
      progress={previewProgress}
      error={null}
      previewMode={true}
      onClosePreview={onClose}
    />
  );
};
