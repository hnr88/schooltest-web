'use client';

import { useTranslations } from 'next-intl';

import { cn } from '@/lib/utils';
import { SchoolCardCover } from '@/modules/school-search/components/SchoolCardCover';
import { SchoolCardFacts } from '@/modules/school-search/components/SchoolCardFacts';
import { SECTOR_LABEL_KEYS } from '@/modules/school-search/constants/school-search.constants';
import { getSchoolMetaParts } from '@/modules/school-search/lib/school-card.helpers';
import { useSchoolSearchStore } from '@/modules/school-search/stores/use-school-search-store';
import type { SchoolHit } from '@/modules/school-search/types/school-search.types';

// The design's result card (spec 01 §8.4): r20 white panel, name over a `·` meta
// line, a hairline rule and a fact row — grown the image slot the brief asks for,
// which is a REAL `coverImage` when the record carries one and the canonical
// medallion when it does not.
// Selection is a CLICK (navy border + lift + the map camera); hover keeps the
// existing card↔pin sync. The click target is a stretched button rather than a
// clickable <article>, so the title stays a real <h3> in the a11y tree and the card
// keeps one tab stop with the visible focus ring the design never specified.
function SchoolCard({ hit }: { hit: SchoolHit }) {
  const t = useTranslations('SchoolSearch');
  // Boolean equality selectors (REQUIRED, M2 §4): only the cards whose state flips
  // re-render on hover or selection — never the whole grid.
  const isActive = useSchoolSearchStore((s) => s.activeSchoolId === hit.documentId);
  const isSelected = useSchoolSearchStore((s) => s.selectedSchoolId === hit.documentId);
  const setActiveSchoolId = useSchoolSearchStore((s) => s.setActiveSchoolId);
  const setSelectedSchoolId = useSchoolSearchStore((s) => s.setSelectedSchoolId);
  const sectorLabel = hit.sector ? t(`sectors.${SECTOR_LABEL_KEYS[hit.sector]}`) : null;
  const typeLabel = hit.schoolType ? t(`schoolTypes.${hit.schoolType}`) : null;
  const meta = getSchoolMetaParts(hit, sectorLabel, typeLabel);
  const coverAlt = hit.coverImage?.alternativeText ?? t('card.coverImageAlt', { name: hit.name });

  return (
    <article
      data-slot="school-card"
      data-active={isActive}
      data-selected={isSelected}
      onMouseEnter={() => setActiveSchoolId(hit.documentId)}
      onMouseLeave={() => setActiveSchoolId(null)}
      className={cn(
        'group relative flex min-w-0 flex-col rounded-result border bg-card p-2 pb-3 transition duration-200 ease-out-expo hover:-translate-y-0.5 motion-reduce:transition-none motion-reduce:hover:translate-y-0',
        isSelected
          ? 'border-navy-900 shadow-lg ring-1 ring-navy-900 ring-inset'
          : 'border-transparent shadow-sm hover:shadow-md',
      )}
    >
      {hit.coverImage ? <SchoolCardCover coverImage={hit.coverImage} alt={coverAlt} /> : null}
      <div className="flex min-w-0 flex-1 flex-col gap-2.5 px-3 pt-2.5">
        <div className="flex min-w-0 items-start gap-3">
          {hit.coverImage ? null : <SchoolCardCover coverImage={null} alt={coverAlt} />}
          <div className="min-w-0 flex-1">
            <h3 className="text-body-lg leading-snug font-semibold text-balance text-foreground">
              {hit.name}
            </h3>
            {meta.length > 0 ? (
              <p className="mt-1 text-body-sm text-muted-foreground">{meta.join(' · ')}</p>
            ) : null}
          </div>
        </div>
        <SchoolCardFacts hit={hit} />
      </div>
      <button
        type="button"
        aria-pressed={isSelected}
        aria-label={t('card.select', { name: hit.name })}
        onFocus={() => setActiveSchoolId(hit.documentId)}
        onBlur={() => setActiveSchoolId(null)}
        onClick={() => setSelectedSchoolId(isSelected ? null : hit.documentId)}
        className="absolute inset-0 rounded-result focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
      />
    </article>
  );
}

export { SchoolCard };
