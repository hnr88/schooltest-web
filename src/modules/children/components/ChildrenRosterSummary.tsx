'use client';

import { Plus } from 'lucide-react';
import { useFormatter, useTranslations } from 'next-intl';

import { Button } from '@/modules/design-system';

// Canonical list page header — title, count pill, one-line roster readout and the
// primary action. Flat on the page background: no navy hero, no stat cards; the
// numbers live in the pill and the readout so the panel below stays the subject.
function ChildrenRosterSummary({
  activeCount,
  archivedCount,
  totalCount,
}: {
  activeCount: number;
  archivedCount: number;
  totalCount: number;
}) {
  const format = useFormatter();
  const t = useTranslations('Children');

  return (
    <header
      data-slot="children-roster-summary"
      className="flex flex-wrap items-end justify-between gap-4"
    >
      <div className="flex min-w-0 flex-col gap-1">
        <div className="flex flex-wrap items-center gap-3">
          <h1 className="text-page-title font-bold text-foreground">{t('heading')}</h1>
          <span className="rounded-full bg-muted px-2.5 py-1 text-meta font-semibold text-secondary-foreground tabular-nums">
            {format.number(totalCount)}
          </span>
        </div>
        {/* on the well, not on a card: #64748B is 4.23:1 there (axe-serious) —
            the DS Body ink #475569 is 6.74:1. CONTRAST-SPEC, --color-body. */}
        <p className="text-lede text-body">
          {t('rosterCounts', {
            active: format.number(activeCount),
            archived: format.number(archivedCount),
          })}
        </p>
      </div>
      <Button href="/dashboard/children/new" className="h-11 rounded-lg">
        <Plus aria-hidden="true" className="size-4" />
        {t('addStudent')}
      </Button>
    </header>
  );
}

export { ChildrenRosterSummary };
