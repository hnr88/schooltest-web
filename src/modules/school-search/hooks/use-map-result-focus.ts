'use client';

import { useEffect, useRef } from 'react';

import L, { type LatLng, type Map as LeafletMap } from 'leaflet';

import { getMapResultFocusTarget } from '@/modules/school-search/lib/map-result-focus';
import { prefersReducedMotion } from '@/modules/school-search/lib/school-map-utils';
import type { GeoSchoolHit } from '@/modules/school-search/types/school-search.types';

const FOCUS_PADDING_TOP_LEFT: [number, number] = [50, 50];
// Reserve space under the sticky results column so pins never hide behind cards.
const FOCUS_PADDING_BOTTOM_RIGHT: [number, number] = [340, 50];
const CAMERA_DISTANCE_TOLERANCE_METERS = 75;
const CAMERA_ZOOM_TOLERANCE = 0.25;

function isAlreadyFocused(map: LeafletMap, center: LatLng, zoom: number): boolean {
  return (
    Math.abs(map.getZoom() - zoom) <= CAMERA_ZOOM_TOLERANCE &&
    map.getCenter().distanceTo(center) <= CAMERA_DISTANCE_TOLERANCE_METERS
  );
}

function getBoundsCamera(
  map: LeafletMap,
  boundsInput: [[number, number], [number, number]],
  maxZoom: number,
) {
  const bounds = L.latLngBounds(boundsInput);
  const paddingTopLeft = L.point(FOCUS_PADDING_TOP_LEFT);
  const paddingBottomRight = L.point(FOCUS_PADDING_BOTTOM_RIGHT);
  const zoom = Math.min(
    map.getBoundsZoom(bounds, false, paddingTopLeft.add(paddingBottomRight)),
    maxZoom,
  );
  const offset = paddingBottomRight.subtract(paddingTopLeft).divideBy(2);
  const southWest = map.project(bounds.getSouthWest(), zoom);
  const northEast = map.project(bounds.getNorthEast(), zoom);
  const center = map.unproject(southWest.add(northEast).divideBy(2).add(offset), zoom);

  return { bounds, center, zoom };
}

// Fly the camera to the current result set (ported from schoolgo useMapResultFocus).
// The initial mount keeps the Australia-wide default view; the camera only flies
// once the result set CHANGES (a new documentId set). Snaps under reduced motion.
export function useMapResultFocus(map: LeafletMap | null, schools: GeoSchoolHit[]): void {
  const focusedKeyRef = useRef<string | null>(null);
  const isFirstRef = useRef(true);

  useEffect(() => {
    if (!map) return;

    const target = getMapResultFocusTarget(schools);
    if (!target) return;

    const focusKey = `${target.type}:${target.key}`;
    if (isFirstRef.current) {
      isFirstRef.current = false;
      focusedKeyRef.current = focusKey;
      return;
    }
    if (focusedKeyRef.current === focusKey) return;
    focusedKeyRef.current = focusKey;

    const animate = !prefersReducedMotion();

    if (target.type === 'school') {
      const center = L.latLng(target.center);
      const zoom = Math.max(map.getZoom(), target.zoom);
      if (map.getBounds().contains(center) || isAlreadyFocused(map, center, zoom)) return;
      map.flyTo(center, zoom, { animate });
      return;
    }

    const targetBounds = L.latLngBounds(target.bounds);
    if (map.getBounds().contains(targetBounds)) return;

    const camera = getBoundsCamera(map, target.bounds, target.maxZoom);
    if (isAlreadyFocused(map, camera.center, camera.zoom)) return;

    map.flyToBounds(camera.bounds, {
      paddingTopLeft: FOCUS_PADDING_TOP_LEFT,
      paddingBottomRight: FOCUS_PADDING_BOTTOM_RIGHT,
      maxZoom: target.maxZoom,
      animate,
    });
  }, [map, schools]);
}
