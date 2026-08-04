'use client';

import type { Map as LeafletMap } from 'leaflet';
import { Minus, Plus, RotateCcw } from 'lucide-react';
import { useTranslations } from 'next-intl';

import {
  AU_MAP_CENTER,
  AU_MAP_ZOOM,
} from '@/modules/school-search/constants/school-search.constants';
import { BUTTON_CLASS } from '@/modules/school-search/constants/components.constants';

function MapZoomControls({ map }: { map: LeafletMap }) {
  const t = useTranslations('SchoolSearch.map');

  return (
    <div
      data-slot="map-zoom-controls"
      className="absolute top-5 right-5 z-20 flex flex-col gap-2 duration-300 ease-out-expo animate-in fade-in slide-in-from-top-2 motion-reduce:animate-none"
    >
      <button
        type="button"
        aria-label={t('zoomIn')}
        onClick={() => map.zoomIn()}
        className={BUTTON_CLASS}
      >
        <Plus className="size-4.5" strokeWidth={1.75} aria-hidden />
      </button>
      <button
        type="button"
        aria-label={t('zoomOut')}
        onClick={() => map.zoomOut()}
        className={BUTTON_CLASS}
      >
        <Minus className="size-4.5" strokeWidth={1.75} aria-hidden />
      </button>
      <button
        type="button"
        aria-label={t('reset')}
        onClick={() => map.setView(AU_MAP_CENTER, AU_MAP_ZOOM)}
        className={BUTTON_CLASS}
      >
        <RotateCcw className="size-4" strokeWidth={1.75} aria-hidden />
      </button>
    </div>
  );
}

export { MapZoomControls };
