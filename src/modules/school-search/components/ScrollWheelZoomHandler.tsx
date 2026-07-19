'use client';

import { useCallback, useEffect, useRef, useState } from 'react';

import type { Map as LeafletMap } from 'leaflet';
import { useTranslations } from 'next-intl';

const HINT_DURATION_MS = 1500;

// Native scroll-zoom is off; the wheel only zooms while ctrl/⌘ is held. A plain
// scroll surfaces a transient hint overlay instead of hijacking the page scroll.
function ScrollWheelZoomHandler({ map }: { map: LeafletMap }) {
  const t = useTranslations('SchoolSearch.map');
  const [showHint, setShowHint] = useState(false);
  const hideTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const clearHideTimer = useCallback(() => {
    if (hideTimer.current) {
      clearTimeout(hideTimer.current);
      hideTimer.current = null;
    }
  }, []);

  useEffect(() => {
    const container = map.getContainer();

    function handleWheel(e: WheelEvent) {
      if (e.ctrlKey || e.metaKey) {
        e.preventDefault();
        const delta = e.deltaY > 0 ? -1 : 1;
        map.zoomIn(delta, { animate: true });
        setShowHint(false);
        clearHideTimer();
      } else {
        setShowHint(true);
        clearHideTimer();
        hideTimer.current = setTimeout(() => setShowHint(false), HINT_DURATION_MS);
      }
    }

    container.addEventListener('wheel', handleWheel, { passive: false });

    return () => {
      container.removeEventListener('wheel', handleWheel);
      clearHideTimer();
    };
  }, [map, clearHideTimer]);

  if (!showHint) return null;

  return (
    <div className="pointer-events-none absolute inset-0 z-20 flex items-center justify-center bg-foreground/30 animate-in fade-in duration-150 motion-reduce:animate-none">
      <p className="rounded-lg bg-card px-4 py-2.5 text-sm font-semibold text-foreground shadow-lg">
        {t('ctrlScrollHint')}
      </p>
    </div>
  );
}

export { ScrollWheelZoomHandler };
