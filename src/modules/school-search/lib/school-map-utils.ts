import L from 'leaflet';

import type {
  GeoSchoolHit,
  SchoolHit,
} from '@/modules/school-search/types/school-search.types';

const MARKER_PIN_HTML = `<div class="school-map-marker__pin" aria-hidden="true">
    <div class="school-map-marker__inner">
      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" width="17" height="17">
        <path stroke-linecap="round" stroke-linejoin="round" d="M4.26 10.147a60.438 60.438 0 0 0-.491 6.347A48.62 48.62 0 0 1 12 20.904a48.62 48.62 0 0 1 8.232-4.41 60.46 60.46 0 0 0-.491-6.347m-15.482 0a50.636 50.636 0 0 0-2.658-.813A59.906 59.906 0 0 1 12 3.493a59.903 59.903 0 0 1 10.399 5.84c-.896.248-1.783.52-2.658.814m-15.482 0A50.717 50.717 0 0 1 12 13.489a50.702 50.702 0 0 1 7.74-3.342M6.75 15a.75.75 0 1 0 0-1.5.75.75 0 0 0 0 1.5Zm0 0v-3.675A55.378 55.378 0 0 1 12 8.443m-7.007 11.55A5.981 5.981 0 0 0 6.75 15.75v-1.5" />
      </svg>
    </div>
  </div>`;

// Design-token DivIcon pin — a round --primary/--card pill styled in globals.css
// (.school-map-marker*), NOT Leaflet's default raster marker (its bundler URL 404s).
// Shared singletons reused across every marker (ported from schoolgo school-map-utils).
export const SCHOOL_MAP_ICON = new L.DivIcon({
  className: 'school-map-marker',
  html: MARKER_PIN_HTML,
  iconSize: [36, 36],
  iconAnchor: [18, 18],
  popupAnchor: [0, -18],
});

// Hover-sync active pin (092): distinct class swap → raised scale + accent ring.
// Class swap (not a re-mount) so react-leaflet just calls marker.setIcon().
export const SCHOOL_MAP_ICON_ACTIVE = new L.DivIcon({
  className: 'school-map-marker school-map-marker--active',
  html: MARKER_PIN_HTML,
  iconSize: [36, 36],
  iconAnchor: [18, 18],
  popupAnchor: [0, -18],
});

// Cluster count badge (DivIcon) — size scales with child count; styled in
// globals.css (.school-map-cluster*). Structural param type avoids depending on
// @types/leaflet.markercluster (not installed; react-leaflet-cluster options are
// erased under skipLibCheck).
export function createClusterIcon(cluster: { getChildCount: () => number }): L.DivIcon {
  const count = cluster.getChildCount();
  const size = count < 10 ? 36 : count < 50 ? 42 : 48;

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
