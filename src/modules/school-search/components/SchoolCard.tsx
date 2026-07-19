'use client';

import { useFormatter, useTranslations } from 'next-intl';

import { cn } from '@/lib/utils';
import { PresenceAvatar } from '@/modules/design-system';
import {
  SchoolCardBadges,
  SchoolSectorPill,
  SchoolStateBadge,
} from '@/modules/school-search/components/SchoolCardBadges';
import { TUITION_CURRENCY } from '@/modules/school-search/constants/school-search.constants';
import {
  getSchoolInitials,
  getSchoolLocation,
} from '@/modules/school-search/lib/school-card.helpers';
import { useSchoolSearchStore } from '@/modules/school-search/stores/use-school-search-store';
import type { SchoolHit } from '@/modules/school-search/types/school-search.types';

function SchoolCard({ hit }: { hit: SchoolHit }) {
  const t = useTranslations('SchoolSearch');
  const format = useFormatter();
  const location = getSchoolLocation(hit.suburb, hit.state);
  // Boolean equality selector (REQUIRED, M2 §4): only the two cards whose active
  // state flips re-render on hover — never the whole grid.
  const isActive = useSchoolSearchStore((s) => s.activeSchoolId === hit.documentId);
  const setActiveSchoolId = useSchoolSearchStore((s) => s.setActiveSchoolId);

  return (
    <article
      data-slot="school-card"
      data-active={isActive}
      onMouseEnter={() => setActiveSchoolId(hit.documentId)}
      onMouseLeave={() => setActiveSchoolId(null)}
      onFocus={() => setActiveSchoolId(hit.documentId)}
      onBlur={() => setActiveSchoolId(null)}
      className={cn(
        'group flex flex-col gap-3 rounded-2xl border bg-card p-5 transition duration-150 ease-out hover:border-input motion-reduce:transition-none',
        isActive
          ? '-translate-y-0.5 border-primary shadow-md ring-2 ring-primary motion-reduce:translate-y-0'
          : 'border-border',
      )}
    >
      <div className="flex items-center gap-2.5">
        <PresenceAvatar initials={getSchoolInitials(hit.name)} size="lg" />
        <div className="flex min-w-0 flex-wrap items-center gap-2">
          <SchoolSectorPill sector={hit.sector} />
          <SchoolStateBadge state={hit.state} />
        </div>
      </div>

      <div className="flex min-w-0 flex-col gap-1">
        <h3 className="line-clamp-1 text-base font-bold text-navy-950">{hit.name}</h3>
        {location ? <p className="text-sm text-muted-foreground">{location}</p> : null}
      </div>

      <SchoolCardBadges hit={hit} />

      <p className="mt-auto text-xs text-muted-foreground">
        {hit.annualTuitionFrom === null ? (
          <span>—</span>
        ) : (
          t.rich('card.tuition', {
            amount: format.number(hit.annualTuitionFrom, {
              style: 'currency',
              currency: TUITION_CURRENCY,
              maximumFractionDigits: 0,
              currencyDisplay: 'narrowSymbol',
            }),
            strong: (chunks) => (
              <strong className="font-bold text-muted-foreground">{chunks}</strong>
            ),
          })
        )}
      </p>
    </article>
  );
}

export { SchoolCard };
