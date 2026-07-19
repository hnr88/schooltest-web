'use client';

import { useCallback } from 'react';

import L from 'leaflet';
import { useMap } from 'react-leaflet';
import MarkerClusterGroup from 'react-leaflet-cluster';

import { SchoolMapMarker } from '@/modules/school-search/components/SchoolMapMarker';
import {
  CLUSTER_DISABLE_AT_ZOOM,
  CLUSTER_MAX_RADIUS,
} from '@/modules/school-search/constants/school-search.constants';
import {
  createClusterIcon,
  prefersReducedMotion,
} from '@/modules/school-search/lib/school-map-utils';
import type { GeoSchoolHit } from '@/modules/school-search/types/school-search.types';

const FOCUS_PADDING_TOP_LEFT: [number, number] = [50, 50];
// Reserve room under the results column so expanded pins clear the cards.
const FOCUS_PADDING_BOTTOM_RIGHT: [number, number] = [340, 50];

function isMarkerCluster(
  layer: unknown,
): layer is { getBounds: () => L.LatLngBounds; spiderfy: () => void } {
  return (
    typeof layer === 'object' &&
    layer !== null &&
    'getBounds' in layer &&
    'spiderfy' in layer &&
    typeof (layer as { getBounds?: unknown }).getBounds === 'function' &&
    typeof (layer as { spiderfy?: unknown }).spiderfy === 'function'
  );
}

// "Zoom grouping": react-leaflet-cluster MarkerClusterGroup with the legacy config.
// Custom click: already zoomed in → spiderfy the overlapping pins; else flyToBounds
// the cluster (reserving space under the results column). animate:false is the
// sanctioned de-jitter — smoothness comes from the flyToBounds camera, not morphing.
function SchoolMapClusterLayer({ geoHits }: { geoHits: GeoSchoolHit[] }) {
  const map = useMap();

  const handleClusterClick = useCallback(
    (event: L.LeafletMouseEvent) => {
      const { layer } = event;
      if (!isMarkerCluster(layer)) return;

      event.originalEvent.preventDefault();
      event.originalEvent.stopPropagation();

      if (map.getZoom() >= CLUSTER_DISABLE_AT_ZOOM) {
        layer.spiderfy();
        return;
      }

      const bounds = layer.getBounds();
      if (!bounds.isValid()) return;

      map.flyToBounds(bounds, {
        paddingTopLeft: FOCUS_PADDING_TOP_LEFT,
        paddingBottomRight: FOCUS_PADDING_BOTTOM_RIGHT,
        maxZoom: CLUSTER_DISABLE_AT_ZOOM,
        animate: !prefersReducedMotion(),
      });
    },
    [map],
  );

  return (
    <MarkerClusterGroup
      iconCreateFunction={createClusterIcon}
      maxClusterRadius={CLUSTER_MAX_RADIUS}
      disableClusteringAtZoom={CLUSTER_DISABLE_AT_ZOOM}
      spiderfyOnMaxZoom
      showCoverageOnHover={false}
      zoomToBoundsOnClick={false}
      animate={false}
      animateAddingMarkers={false}
      removeOutsideVisibleBounds={false}
      onClick={handleClusterClick}
    >
      {geoHits.map((hit) => (
        <SchoolMapMarker key={hit.documentId} hit={hit} />
      ))}
    </MarkerClusterGroup>
  );
}

export { SchoolMapClusterLayer };
