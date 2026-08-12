'use client';

import { useFormatter, useTranslations } from 'next-intl';

import { StatusPill } from '@/modules/design-system';
import { MasteryLegend } from '@/modules/teacher/components/MasteryLegend';
import { ResultsMissingValue } from '@/modules/teacher/components/ResultsMissingValue';
import { SubskillTileGrid } from '@/modules/teacher/components/SubskillTileGrid';
import type { StudentTestCardProps } from '@/modules/teacher/types/student-drill-down.types';

// One completed test of .qa/DESIGN.md §Student drill-down: "Test A — Reading
// diagnostic", the completion date, the big overall score, the ACARA pill, the
// mastery legend and the subskill tiles.
//
// Every value is C-TR-2's — `score` is the server's derived overall (ASSUMPTION
// A1), `acara_phase` and `display_label` are the crosswalk's. A `null` renders the
// em dash with its words, never a 0 and never a guessed phase.
function StudentTestCard({ test, bands }: StudentTestCardProps) {
  const t = useTranslations('Teacher.results.drillDown');
  const format = useFormatter();
  const headingId = `test-card-${test.variant}`;

  return (
    <section
      data-slot="student-test-card"
      data-variant={test.variant}
      aria-labelledby={headingId}
      className="flex flex-col gap-4 rounded-card bg-card px-4 py-6 shadow-sm sm:px-6"
    >
      <div className="flex flex-wrap items-start justify-between gap-x-6 gap-y-3">
        <div className="flex min-w-0 flex-col gap-1">
          <h2 id={headingId} className="text-panel-title font-semibold break-words text-foreground">
            {t('testHeading', { variant: test.variant })}
          </h2>
          <p className="text-meta text-muted-foreground">
            {test.completed_at ? (
              t('completedOn', {
                date: format.dateTime(new Date(test.completed_at), { dateStyle: 'medium' }),
              })
            ) : (
              <ResultsMissingValue />
            )}
          </p>
        </div>

        <div className="flex flex-col items-start gap-1.5 sm:items-end">
          <p className="text-h3 font-bold text-foreground tabular-nums">
            {test.score === null ? <ResultsMissingValue /> : t('scoreValue', { score: test.score })}
          </p>
          <span className="text-meta text-muted-foreground">{t('scoreLabel')}</span>
          {test.acara_phase ? <StatusPill tone="info">{test.acara_phase}</StatusPill> : null}
        </div>
      </div>

      {test.display_label ? (
        <p data-slot="student-test-display-label" className="text-body-sm text-muted-foreground">
          {t('displayLabel', { label: test.display_label })}
        </p>
      ) : null}

      <MasteryLegend bands={bands} />

      <SubskillTileGrid variant={test.variant} subskills={test.subskills} />
    </section>
  );
}

export { StudentTestCard };
