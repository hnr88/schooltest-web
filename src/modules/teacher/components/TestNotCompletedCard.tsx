'use client';

import { useTranslations } from 'next-intl';

import type { TestNotCompletedCardProps } from '@/modules/teacher/types/student-drill-down.types';

// .qa/DESIGN.md §Single test completed — "Then `Test B — not yet completed`".
//
// The variant comes from `drillDownTests().missing`: the closed variant set of the
// shared contract minus the variants C-TR-2 actually returned. So this card states
// an ABSENCE the response itself proves, and it carries no score, no phase and no
// tiles — there is nothing to show, and a 0 or a grey tile row would claim a
// measurement that does not exist.
function TestNotCompletedCard({ variant }: TestNotCompletedCardProps) {
  const t = useTranslations('Teacher.results.drillDown');
  const headingId = `not-completed-test-${variant}`;

  return (
    <section
      data-slot="test-not-completed"
      data-variant={variant}
      aria-labelledby={headingId}
      className="flex flex-col gap-1 rounded-card border border-dashed border-border bg-surface-inset px-4 py-5 sm:px-6"
    >
      <h2 id={headingId} className="text-body-lg font-semibold text-foreground">
        {t('notCompletedHeading', { variant })}
      </h2>
      <p className="text-meta text-balance text-body">{t('notCompletedDescription')}</p>
    </section>
  );
}

export { TestNotCompletedCard };
