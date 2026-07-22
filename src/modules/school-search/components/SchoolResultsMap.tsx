'use client';

import { useMemo, useState } from 'react';

import type { Map as LeafletMap } from 'leaflet';
import { useTranslations } from 'next-intl';
import { MapContainer, TileLayer } from 'react-leaflet';

import { MapZoomControls } from '@/modules/school-search/components/MapZoomControls';
import { SchoolMapClusterLayer } from '@/modules/school-search/components/SchoolMapClusterLayer';
import { ScrollWheelZoomHandler } from '@/modules/school-search/components/ScrollWheelZoomHandler';
import { SelectedSchoolCard } from '@/modules/school-search/components/SelectedSchoolCard';
import {
  AU_MAP_CENTER,
  AU_MAP_MAX_BOUNDS,
  AU_MAP_ZOOM,
} from '@/modules/school-search/constants/school-search.constants';
import { useMapResultFocus } from '@/modules/school-search/hooks/use-map-result-focus';
import { useSelectedSchoolCamera } from '@/modules/school-search/hooks/use-selected-school-camera';
import { getGeoHits } from '@/modules/school-search/lib/school-map-utils';
import { useSchoolSearchStore } from '@/modules/school-search/stores/use-school-search-store';
import type { SchoolHit } from '@/modules/school-search/types/school-search.types';

// Client-only Leaflet leaf — reached ONLY through the SchoolResultsMapPanel
// next/dynamic(ssr:false) boundary (Leaflet touches `window`). leaflet.css is
// imported globally in globals.css (090); no per-file value import of L here.
// The region role + accessible name are owned by the canonical MapPanelFrame this
// leaf renders into (and by the sheet title on mobile).
function SchoolResultsMap({ hits }: { hits: SchoolHit[] }) {
  const t = useTranslations('SchoolSearch.map');
  const [map, setMap] = useState<LeafletMap | null>(null);
  const geoHits = useMemo(() => getGeoHits(hits), [hits]);
  const selectedSchoolId = useSchoolSearchStore((s) => s.selectedSchoolId);
  const selectedHit = geoHits.find((hit) => hit.documentId === selectedSchoolId) ?? null;
  useMapResultFocus(map, geoHits);
  useSelectedSchoolCamera(map, geoHits, selectedSchoolId);

  return (
    <div className="relative isolate h-full w-full overflow-hidden animate-in fade-in duration-300 motion-reduce:animate-none">
      <MapContainer
        ref={setMap}
        center={AU_MAP_CENTER}
        zoom={AU_MAP_ZOOM}
        minZoom={AU_MAP_ZOOM}
        maxBounds={AU_MAP_MAX_BOUNDS}
        maxBoundsViscosity={0.85}
        zoomControl={false}
        scrollWheelZoom={false}
        // `isolate` is load-bearing, not decoration: .leaflet-container is
        // position:relative with z-index:auto, so WITHOUT its own stacking context
        // every Leaflet pane (z-index 400+) competes directly with this component's
        // overlays and paints over the zoom stack and the selected-school card.
        className="isolate h-full w-full"
      >
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        />
        <SchoolMapClusterLayer geoHits={geoHits} />
      </MapContainer>

      {map ? <MapZoomControls map={map} /> : null}
      {map ? <ScrollWheelZoomHandler map={map} /> : null}
      {selectedHit ? <SelectedSchoolCard hit={selectedHit} /> : null}

      <p className="sr-only" role="status" aria-live="polite">
        {t('markerCount', { count: geoHits.length })}
      </p>
    </div>
  );
}

export default SchoolResultsMap;
