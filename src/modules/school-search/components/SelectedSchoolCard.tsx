'use client';

import { School, X } from 'lucide-react';
import { useTranslations } from 'next-intl';

import { SECTOR_LABEL_KEYS } from '@/modules/school-search/constants/school-search.constants';
import { getSchoolMetaParts } from '@/modules/school-search/lib/school-card.helpers';
import { useSchoolSearchStore } from '@/modules/school-search/stores/use-school-search-store';
import type { SchoolHit } from '@/modules/school-search/types/school-search.types';

// The floating card the design pins to the bottom-left of the map (spec 01 §8.5):
// a 40×40 navy tile, the school's name and its meta line.
// The design's tile holds the school's rating and the card ends in a "View →" link.
// CONTRACTS B-11 records that no rating field exists, and there is no school detail
// route to send "View" to, so the tile carries the school's STATE (a real field, or
// the canonical school glyph when the record has none) and the trailing control
// dismisses the selection instead of inventing a destination.
function SelectedSchoolCard({ hit }: { hit: SchoolHit }) {
  const t = useTranslations('SchoolSearch');
  const setSelectedSchoolId = useSchoolSearchStore((s) => s.setSelectedSchoolId);
  const sectorLabel = hit.sector ? t(`sectors.${SECTOR_LABEL_KEYS[hit.sector]}`) : null;
  const typeLabel = hit.schoolType ? t(`schoolTypes.${hit.schoolType}`) : null;
  const meta = getSchoolMetaParts(hit, sectorLabel, typeLabel);

  return (
    <div
      data-slot="selected-school-card"
      className="absolute bottom-5 left-5 z-20 flex max-w-85 items-center gap-3.5 rounded-panel bg-card px-4.5 py-3.5 shadow-lg duration-300 ease-out-expo animate-in fade-in slide-in-from-bottom-2 motion-reduce:animate-none"
    >
      <span
        aria-hidden="true"
        className="grid size-10 shrink-0 place-items-center rounded-tile bg-navy-900 text-caption font-bold text-primary-foreground"
      >
        {hit.state ?? <School className="size-4.5" strokeWidth={2} />}
      </span>
      <div className="min-w-0">
        <p className="truncate text-body-md font-semibold text-foreground">{hit.name}</p>
        {meta.length > 0 ? (
          <p className="truncate text-meta text-muted-foreground">{meta.join(' · ')}</p>
        ) : null}
      </div>
      <button
        type="button"
        aria-label={t('map.clearSelection')}
        onClick={() => setSelectedSchoolId(null)}
        className="grid size-8 shrink-0 place-items-center rounded-full text-muted-foreground transition duration-200 ease-out-expo hover:bg-muted hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none active:scale-90 motion-reduce:transition-none motion-reduce:active:scale-100"
      >
        <X aria-hidden="true" className="size-4" />
      </button>
    </div>
  );
}

export { SelectedSchoolCard };
