'use client';

import { useTranslations } from 'next-intl';

import { ProgressEmptyState } from '@/modules/teach/components/ProgressEmptyState';
import { ProgressMovementRow } from '@/modules/teach/components/ProgressMovementRow';
import type { ResultView } from '@schooltest/scoring-contracts';

import { useClassResultsQuery } from '@/modules/results/queries/use-class-results.query';
import {
  buildStudentDrillDownView,
  drillDownLabelKey,
} from '@/modules/teacher/lib/student-drill-down-view';

import type { ProgressPanelProps } from '@/modules/teach/types/components.types';

// Teacher progress panel, re-pointed onto the CANONICAL read (web repoint,
// pre-24): the class roster carries each student's latest official ResultView,
// whose per-skill growth triplets ARE the Test A -> Test B movement the server
// has already judged — steady, a coarse signed step, or a band pair. The
// retired `/schools/me/classes/:id/progress` aggregation (C-RPT-02) is gone;
// no per-student fan-out replaces it (one roster read serves the whole panel).
//
// What the retired payload held that the roster contract does not: the two
// form ids (benchmark/progress) and the weeks between sittings. Both stay
// unrendered rather than inferred — the movement statement itself is the
// server's, verbatim. A student with no official Result renders as a gap row
// ("not assessed"), never as a zero.
export function ProgressPanel({ classId }: ProgressPanelProps) {
  const t = useTranslations('Teach.progress');
  const td = useTranslations('Teach.diagnostic');
  const roster = useClassResultsQuery(classId);

  const scored = (roster.data ?? []).filter(
    (row): row is typeof row & { result: ResultView } => row.result !== null,
  );

  return (
    <section
      data-slot="progress-panel"
      data-surface="teacher-progress"
      aria-label={t('title')}
      className="flex flex-col gap-3 px-4 pb-6 sm:px-6 lg:px-8"
    >
      <h2 className="text-lg font-semibold text-foreground">{t('title')}</h2>
      <p className="max-w-xl text-sm text-body">{t('description')}</p>

      {roster.isPending ? (
        <p className="text-sm text-muted-foreground">{t('loading')}</p>
      ) : null}
      {roster.isError ? (
        <p role="alert" className="text-sm text-danger-ink">
          {t('loadError')}
        </p>
      ) : null}

      {roster.isSuccess && scored.length === 0 ? <ProgressEmptyState /> : null}

      {roster.isSuccess && scored.length > 0 ? (
        <ul data-slot="progress-students" className="flex flex-col gap-3">
          {scored.map((row) => {
            const movement = buildStudentDrillDownView(row.result);
            return (
              <li
                key={row.student.document_id}
                data-slot="progress-student"
                className="flex flex-col gap-3 rounded-xl border border-border bg-card px-4 py-3"
              >
                <span className="text-sm font-semibold text-foreground">
                  {row.student.name}
                </span>
                <ul data-slot="progress-movements" className="flex flex-col gap-2">
                  {movement.skills.map((skill) => (
                    <ProgressMovementRow
                      key={skill.attribute}
                      attribute={skill.attribute}
                      label={td(`areas.${drillDownLabelKey(skill.attribute)}`)}
                      deltaDisplay={skill.deltaDisplay}
                      bandBefore={skill.bandBefore}
                      bandAfter={skill.bandAfter}
                    />
                  ))}
                </ul>
              </li>
            );
          })}
        </ul>
      ) : null}
    </section>
  );
}
