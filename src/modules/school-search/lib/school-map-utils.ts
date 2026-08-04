import L from 'leaflet';

import type {
  GeoSchoolHit,
  SchoolHit,
} from '@/modules/school-search/types/school-search.types';
import { MARKER_PIN_HTML, SCHOOL_MAP_ICON, SCHOOL_MAP_ICON_ACTIVE, SCHOOL_MAP_ICON_SELECTED, SCHOOL_MAP_ICON_SELECTED_ACTIVE } from '@/modules/school-search/constants/lib.constants';

export function getSchoolMarkerIcon(selected: boolean, active: boolean): L.DivIcon {
  if (selected) return active ? SCHOOL_MAP_ICON_SELECTED_ACTIVE : SCHOOL_MAP_ICON_SELECTED;
  return active ? SCHOOL_MAP_ICON_ACTIVE : SCHOOL_MAP_ICON;
}

// Cluster count badge (DivIcon) — size scales with child count; styled in
// globals.css (.school-map-cluster*). Structural param type avoids depending on
// @types/leaflet.markercluster (not installed; react-leaflet-cluster options are
// erased under skipLibCheck).
export function createClusterIcon(cluster: { getChildCount: () => number }): L.DivIcon {
  const count = cluster.getChildCount();
  // 38px is the design's cluster bubble (spec 01 §8.5); a bubble holding 50+ schools
  // grows one step so a three-digit count is not clipped.
  const size = count < 100 ? 38 : 46;

  return new L.DivIcon({
    className: 'school-map-cluster',
    html: `<div class="school-map-cluster__circle">${count}</div>`,
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2],
  });
}

// Camera-animation gate: snap (never animate flyTo/flyToBounds) when the visitor
// opted out of motion. Called only from client event handlers / effects.
export function prefersReducedMotion(): boolean {
  return (
    typeof window !== 'undefined' &&
    typeof window.matchMedia === 'function' &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches
  );
}

// Coord filter — a hit only earns a pin when BOTH coordinates are present
// (the 36 null-coord / umbrella rows produce no marker; that is not an error).
export function hasCoords(hit: SchoolHit): hit is GeoSchoolHit {
  return typeof hit.latitude === 'number' && typeof hit.longitude === 'number';
}

export function getGeoHits(hits: readonly SchoolHit[]): GeoSchoolHit[] {
  return hits.filter(hasCoords);
}
