'use client';

import type { Map as LeafletMap } from 'leaflet';
import { Minus, Plus, RotateCcw } from 'lucide-react';
import { useTranslations } from 'next-intl';

import {
  AU_MAP_CENTER,
  AU_MAP_ZOOM,
} from '@/modules/school-search/constants/school-search.constants';

// Spec 01 §8.5 zoom controls: a 40×40 r12 white stack pinned to the TOP-RIGHT of the
// map panel (Leaflet's own zoomControl is off). "Reset" keeps the existing
// recentre-on-Australia behaviour and inherits the same geometry.
const BUTTON_CLASS =
  'grid size-10 place-items-center rounded-tile bg-card text-foreground shadow-md transition duration-200 ease-out-expo hover:-translate-y-0.5 hover:text-primary hover:shadow-lg focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none active:translate-y-0 active:scale-95 motion-reduce:transition-none motion-reduce:hover:translate-y-0 motion-reduce:active:scale-100';

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
