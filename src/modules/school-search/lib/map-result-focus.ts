import type { GeoSchoolHit } from '@/modules/school-search/types/school-search.types';

import type { MapResultFocusTarget } from '@/modules/school-search/types/lib.types';

export const SINGLE_SCHOOL_FOCUS_ZOOM = 14;
export const MULTI_SCHOOL_MAX_FIT_ZOOM = 12;

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
