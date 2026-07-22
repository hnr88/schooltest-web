'use client';

import { useMemo } from 'react';

import { Marker } from 'react-leaflet';

import { getSchoolMarkerIcon } from '@/modules/school-search/lib/school-map-utils';
import { useSchoolSearchStore } from '@/modules/school-search/stores/use-school-search-store';
import type { GeoSchoolHit } from '@/modules/school-search/types/school-search.types';

// One design-token DivIcon pin per coord-bearing hit. Marker→card hover-sync (092):
// mouseover/mouseout drive the shared activeSchoolId; a boolean selector swaps THIS
// pin to the active icon and raises it, re-rendering only this one.
// Clicking a pin SELECTS its school (spec 01 §8.5) — the navy pin, the floating map
// card and the animated panTo all follow from that one piece of store state, so the
// pin no longer carries a popup of its own: the design puts that information in the
// pinned card at the bottom-left, where it cannot cover a neighbouring school.
function SchoolMapMarker({ hit }: { hit: GeoSchoolHit }) {
  const position: [number, number] = [hit.latitude, hit.longitude];
  const isActive = useSchoolSearchStore((s) => s.activeSchoolId === hit.documentId);
  const isSelected = useSchoolSearchStore((s) => s.selectedSchoolId === hit.documentId);
  const setActiveSchoolId = useSchoolSearchStore((s) => s.setActiveSchoolId);
  const setSelectedSchoolId = useSchoolSearchStore((s) => s.setSelectedSchoolId);
  const eventHandlers = useMemo(
    () => ({
      mouseover: () => setActiveSchoolId(hit.documentId),
      mouseout: () => setActiveSchoolId(null),
      click: () => setSelectedSchoolId(hit.documentId),
    }),
    [setActiveSchoolId, setSelectedSchoolId, hit.documentId],
  );

  return (
    <Marker
      position={position}
      icon={getSchoolMarkerIcon(isSelected, isActive)}
      zIndexOffset={isSelected ? 1500 : isActive ? 1000 : 0}
      eventHandlers={eventHandlers}
      title={hit.name}
      alt={hit.name}
      keyboard
    />
  );
}

export { SchoolMapMarker };
