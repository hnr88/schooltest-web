'use client';

import { Plus } from 'lucide-react';
import { useFormatter, useTranslations } from 'next-intl';

import { Button } from '@/modules/design-system';

// §A.3 PageHeader — 30/500/-0.02em title over a 14px sub-line, with the navy pill
// action baseline-aligned to the right. The design's sub-line reads
// "2 children · Family plan covers up to 4"; the seat cap is B-7 (no plan or
// subscription content-type exists), so only the real roster counts are printed.
function ChildrenRosterSummary({
  activeCount,
  archivedCount,
}: {
  activeCount: number;
  archivedCount: number;
}) {
  const format = useFormatter();
  const t = useTranslations('Children');

  return (
    <header
      data-slot="children-roster-summary"
      className="flex flex-wrap items-end justify-between gap-5"
    >
      <div className="flex min-w-0 flex-col gap-1.5">
        <h1 className="text-portal-title font-medium text-foreground">{t('heading')}</h1>
        <p className="text-body-md text-body">
          {t('rosterCounts', {
            active: format.number(activeCount),
            archived: format.number(archivedCount),
          })}
        </p>
      </div>
      <Button
        href="/dashboard/children/new"
        className="h-11 rounded-full bg-foreground px-5.5 text-body-md font-semibold text-card shadow-none hover:bg-navy-800"
      >
        <Plus aria-hidden="true" className="size-4" strokeWidth={2.2} />
        {t('addChild')}
      </Button>
    </header>
  );
}

export { ChildrenRosterSummary };
