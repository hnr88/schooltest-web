'use client';

import { useFormatter, useTranslations } from 'next-intl';

import { SubskillPillList } from '@/modules/teacher/components/SubskillPillList';
import type { CollapsedTestSummaryProps } from '@/modules/teacher/types/student-drill-down.types';

// .qa/DESIGN.md §Both tests completed — "Test A COLLAPSES to a single summary row:
// Test A — Reading diagnostic · 28 Jul 2026 · 72 / 100 · Developing, followed by a
// row of coloured pills".
//
// "Collapsed" is a DENSITY, not a disclosure widget: the wireframe shows no
// expander, and hiding the older test behind a control the wireframe does not have
// would be invented UI. Every value the full card would print is still here — the
// date, the overall score, the ACARA phase and all seven subskill likelihoods —
// only laid out in one line plus a pill row.
//
// Which test collapses is decided by RECENCY alone (`lib/student-drill-down.ts`
// splits C-TR-2's most-recent-first array at index 0), never by variant letter.
// A `null` field prints its explicit "Not available" words, never a 0.
function CollapsedTestSummary({ test }: CollapsedTestSummaryProps) {
  const t = useTranslations('Teacher.results.drillDown');
  const format = useFormatter();
  const headingId = `collapsed-test-${test.variant}`;

  const meta: string[] = [];
  meta.push(
    test.completed_at
      ? t('completedOn', {
          date: format.dateTime(new Date(test.completed_at), { dateStyle: 'medium' }),
        })
      : t('valueUnavailable'),
  );
  meta.push(
    test.score === null ? t('valueUnavailable') : t('collapsedScore', { score: test.score }),
  );
  if (test.acara_phase) meta.push(t('collapsedPhase', { phase: test.acara_phase }));

  return (
    <section
      data-slot="collapsed-test-summary"
      data-variant={test.variant}
      aria-labelledby={headingId}
      className="flex flex-col gap-3 rounded-card bg-card px-4 py-5 shadow-sm sm:px-6"
    >
      <div className="flex flex-col gap-1">
        <h2 id={headingId} className="text-body-lg font-semibold break-words text-foreground">
          {t('testHeading', { variant: test.variant })}
        </h2>
        <p data-slot="collapsed-test-meta" className="text-meta text-body tabular-nums">
          {meta.join(t('metaSeparator'))}
        </p>
        <p data-slot="collapsed-test-note" className="text-caption text-muted-foreground">
          {t('collapsedNote')}
        </p>
      </div>

      <SubskillPillList variant={test.variant} subskills={test.subskills} />
    </section>
  );
}

export { CollapsedTestSummary };
