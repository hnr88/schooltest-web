import type { GeoSchoolHit } from '@/modules/school-search/types/school-search.types';

export const SINGLE_SCHOOL_FOCUS_ZOOM = 14;
export const MULTI_SCHOOL_MAX_FIT_ZOOM = 12;

// Camera target the map should fly to for the current result set (ported from
// schoolgo lib/map-result-focus): one hit → centre + close zoom; many → fit their
// bounds. Pure (no Leaflet) so it stays testable and out of the hook.
export type MapResultFocusTarget =
  | { type: 'school'; key: string; center: [number, number]; zoom: number }
  | {
      type: 'bounds';
      key: string;
      bounds: [[number, number], [number, number]];
      maxZoom: number;
    };

export function getMapResultFocusTarget(
  schools: GeoSchoolHit[],
): MapResultFocusTarget | null {
  const points = schools.map((school) => ({
    lat: school.latitude,
    lng: school.longitude,
    key: school.documentId,
  }));

  if (points.length === 0) return null;

  if (points.length === 1) {
    const [point] = points;
    return {
      type: 'school',
      key: point.key,
      center: [point.lat, point.lng],
      zoom: SINGLE_SCHOOL_FOCUS_ZOOM,
    };
  }

  const lats = points.map((point) => point.lat);
  const lngs = points.map((point) => point.lng);

  return {
    type: 'bounds',
    key: points
      .map((point) => point.key)
      .sort()
      .join('|'),
    bounds: [
      [Math.min(...lats), Math.min(...lngs)],
      [Math.max(...lats), Math.max(...lngs)],
    ],
    maxZoom: MULTI_SCHOOL_MAX_FIT_ZOOM,
  };
}
