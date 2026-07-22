'use client';

import { useEffect } from 'react';

import type { Map as LeafletMap } from 'leaflet';

import {
  CLUSTER_DISABLE_AT_ZOOM,
  PLACE_FOCUS_ZOOM,
} from '@/modules/school-search/constants/school-search.constants';
import { prefersReducedMotion } from '@/modules/school-search/lib/school-map-utils';
import type { GeoSchoolHit } from '@/modules/school-search/types/school-search.types';

// The design's ONE piece of real motion (spec 01 §11.4): choosing a school moves the
// camera to it — an animated setView to zoom 11 when the map is still above the
// cluster threshold, an animated panTo when it is already zoomed in. Reduced motion
// keeps the same destination and drops the tween.
export function useSelectedSchoolCamera(
  map: LeafletMap | null,
  schools: GeoSchoolHit[],
  selectedSchoolId: string | null,
): void {
  useEffect(() => {
    if (!map || !selectedSchoolId) return;

    const target = schools.find((school) => school.documentId === selectedSchoolId);
    if (!target) return;

    const center: [number, number] = [target.latitude, target.longitude];
    const animate = !prefersReducedMotion();

    if (map.getZoom() < CLUSTER_DISABLE_AT_ZOOM) {
      map.setView(center, PLACE_FOCUS_ZOOM, { animate });
      return;
    }

    map.panTo(center, { animate });
  }, [map, schools, selectedSchoolId]);
}
