'use client';

import { useMemo } from 'react';

import { useFormatter, useTranslations } from 'next-intl';
import { Marker, Popup } from 'react-leaflet';

import { TUITION_CURRENCY } from '@/modules/school-search/constants/school-search.constants';
import { getSchoolLocation } from '@/modules/school-search/lib/school-card.helpers';
import {
  SCHOOL_MAP_ICON,
  SCHOOL_MAP_ICON_ACTIVE,
} from '@/modules/school-search/lib/school-map-utils';
import { useSchoolSearchStore } from '@/modules/school-search/stores/use-school-search-store';
import type { GeoSchoolHit } from '@/modules/school-search/types/school-search.types';

// One design-token DivIcon pin + compact popup per coord-bearing hit. Marker→card
// hover-sync (092): mouseover/mouseout drive the shared activeSchoolId; a boolean
// selector swaps THIS pin to the active icon + raises it, re-rendering only this one.
function SchoolMapMarker({ hit }: { hit: GeoSchoolHit }) {
  const t = useTranslations('SchoolSearch');
  const format = useFormatter();
  const location = getSchoolLocation(hit.suburb, hit.state);
  const position: [number, number] = [hit.latitude, hit.longitude];
  const isActive = useSchoolSearchStore((s) => s.activeSchoolId === hit.documentId);
  const setActiveSchoolId = useSchoolSearchStore((s) => s.setActiveSchoolId);
  const eventHandlers = useMemo(
    () => ({
      mouseover: () => setActiveSchoolId(hit.documentId),
      mouseout: () => setActiveSchoolId(null),
    }),
    [setActiveSchoolId, hit.documentId],
  );

  return (
    <Marker
      position={position}
      icon={isActive ? SCHOOL_MAP_ICON_ACTIVE : SCHOOL_MAP_ICON}
      zIndexOffset={isActive ? 1000 : 0}
      eventHandlers={eventHandlers}
      title={hit.name}
      alt={hit.name}
      keyboard
    >
      <Popup
        className="schoolgo-map-popup schoolgo-map-popup--compact"
        closeButton={false}
        autoPan={false}
      >
        <div className="flex min-w-44 max-w-52 flex-col gap-1 p-3">
          <h3 className="line-clamp-2 text-sm font-semibold leading-snug text-navy-950">
            {hit.name}
          </h3>
          {location ? (
            <p className="text-xs leading-none text-muted-foreground">{location}</p>
          ) : null}
          {hit.annualTuitionFrom === null ? null : (
            <span className="mt-0.5 inline-flex self-start rounded-full bg-primary/10 px-2 py-0.5 text-xs font-semibold leading-normal text-primary">
              {t.rich('card.tuition', {
                amount: format.number(hit.annualTuitionFrom, {
                  style: 'currency',
                  currency: TUITION_CURRENCY,
                  maximumFractionDigits: 0,
                  currencyDisplay: 'narrowSymbol',
                }),
                strong: (chunks) => <strong className="font-semibold text-primary">{chunks}</strong>,
              })}
            </span>
          )}
        </div>
      </Popup>
    </Marker>
  );
}

export { SchoolMapMarker };
