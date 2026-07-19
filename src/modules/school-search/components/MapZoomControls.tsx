'use client';

import type { Map as LeafletMap } from 'leaflet';
import { Minus, Plus, RotateCcw } from 'lucide-react';
import { useTranslations } from 'next-intl';

import {
  AU_MAP_CENTER,
  AU_MAP_ZOOM,
} from '@/modules/school-search/constants/school-search.constants';

const BUTTON_CLASS =
  'flex h-10 w-10 cursor-pointer items-center justify-center rounded-full border border-border bg-card text-foreground shadow-md transition duration-150 ease-out hover:-translate-y-0.5 hover:text-primary active:translate-y-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring motion-reduce:transition-none motion-reduce:hover:translate-y-0';

// Custom keyboard-operable +/−/reset controls (Leaflet's own zoomControl is off).
// Reset recenters the map on Australia rather than touching store filter state.
function MapZoomControls({ map }: { map: LeafletMap }) {
  const t = useTranslations('SchoolSearch.map');

  return (
    <div className="absolute bottom-6 left-6 z-20 flex flex-col gap-2">
      <button
        type="button"
        aria-label={t('reset')}
        onClick={() => map.setView(AU_MAP_CENTER, AU_MAP_ZOOM)}
        className={BUTTON_CLASS}
      >
        <RotateCcw className="h-4 w-4" strokeWidth={1.75} aria-hidden />
      </button>
      <button
        type="button"
        aria-label={t('zoomIn')}
        onClick={() => map.zoomIn()}
        className={BUTTON_CLASS}
      >
        <Plus className="h-4 w-4" strokeWidth={1.75} aria-hidden />
      </button>
      <button
        type="button"
        aria-label={t('zoomOut')}
        onClick={() => map.zoomOut()}
        className={BUTTON_CLASS}
      >
        <Minus className="h-4 w-4" strokeWidth={1.75} aria-hidden />
      </button>
    </div>
  );
}

export { MapZoomControls };
