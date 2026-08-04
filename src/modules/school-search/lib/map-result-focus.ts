import type { GeoSchoolHit } from '@/modules/school-search/types/school-search.types';

import type { MapResultFocusTarget } from '@/modules/school-search/types/lib.types';
import { MULTI_SCHOOL_MAX_FIT_ZOOM, SINGLE_SCHOOL_FOCUS_ZOOM } from '@/modules/school-search/constants/lib.constants';

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
