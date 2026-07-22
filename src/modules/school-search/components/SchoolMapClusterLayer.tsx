'use client';

import { useCallback } from 'react';

import L from 'leaflet';
import { useMap } from 'react-leaflet';
import MarkerClusterGroup from 'react-leaflet-cluster';

import { SchoolMapMarker } from '@/modules/school-search/components/SchoolMapMarker';
import {
  CLUSTER_DISABLE_AT_ZOOM,
  CLUSTER_MAX_RADIUS,
  PLACE_FOCUS_ZOOM,
} from '@/modules/school-search/constants/school-search.constants';
import {
  createClusterIcon,
  prefersReducedMotion,
} from '@/modules/school-search/lib/school-map-utils';
import type { GeoSchoolHit } from '@/modules/school-search/types/school-search.types';

function isMarkerCluster(layer: unknown): layer is { getBounds: () => L.LatLngBounds } {
  return (
    typeof layer === 'object' &&
    layer !== null &&
    'getBounds' in layer &&
    typeof (layer as { getBounds?: unknown }).getBounds === 'function'
  );
}

// Spec 01 §8.5: below zoom 9 the map draws CLUSTER BUBBLES, at zoom 9 and above it
// draws individual pins — `disableClusteringAtZoom` is that exact threshold.
// Clicking a bubble opens its place with an animated `setView(centre, 11)`, which is
// the design's cluster behaviour verbatim; reduced motion keeps the destination and
// drops the tween. `animate:false` on the group itself is the sanctioned de-jitter —
// smoothness comes from the camera, not from morphing the bubbles.
function SchoolMapClusterLayer({ geoHits }: { geoHits: GeoSchoolHit[] }) {
  const map = useMap();

  const handleClusterClick = useCallback(
    (event: L.LeafletMouseEvent) => {
      const { layer } = event;
      if (!isMarkerCluster(layer)) return;

      event.originalEvent.preventDefault();
      event.originalEvent.stopPropagation();

      const bounds = layer.getBounds();
      if (!bounds.isValid()) return;

      map.setView(bounds.getCenter(), PLACE_FOCUS_ZOOM, { animate: !prefersReducedMotion() });
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
