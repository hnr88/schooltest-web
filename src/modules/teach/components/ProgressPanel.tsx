'use client';

import { useTranslations } from 'next-intl';

import { ProgressEmptyState } from '@/modules/teach/components/ProgressEmptyState';
import { ProgressTransitionRow } from '@/modules/teach/components/ProgressTransitionRow';
import { useClassProgressQuery } from '@/modules/teach/queries/use-class-progress.query';

import type { ProgressPanelProps } from '@/modules/teach/types/components.types';

// Teacher progress panel (task 76, mvp-updates §4.9, C-RPT-02): Test B
// measured against Test A as the benchmark. The empty state is a first-class
// server payload (populated:false + reason), rendered verbatim until Test B
// results exist; afterwards each student lists per-area transitions with the
// weeks between the two sittings. Areas never assessed on either form are
// called out explicitly - never read as "no change".
export function ProgressPanel({ classId }: ProgressPanelProps) {
  const t = useTranslations('Teach.progress');
  const td = useTranslations('Teach.diagnostic');
  const query = useClassProgressQuery(classId);

  const data = query.data ?? null;
  const notAssessedFor = (studentRef: string): string[] =>
    (data?.not_assessed ?? [])
      .filter((row) => row.student_ref === studentRef)
      .map((row) => td(`areas.${row.attribute}`));

  return (
    <section
      data-slot="progress-panel"
      data-surface="teacher-progress"
      aria-label={t('title')}
      className="flex flex-col gap-3 px-4 pb-6 sm:px-6 lg:px-8"
    >
      <h2 className="text-lg font-semibold text-foreground">{t('title')}</h2>
      <p className="max-w-xl text-sm text-body">{t('description')}</p>

      {query.isPending ? (
        <p className="text-sm text-muted-foreground">{t('loading')}</p>
      ) : null}
      {query.isError ? (
        <p role="alert" className="text-sm text-danger-ink">
          {t('loadError')}
        </p>
      ) : null}

      {query.isSuccess && data && !data.populated ? <ProgressEmptyState /> : null}

      {query.isSuccess && data?.populated ? (
        <>
          <p className="text-sm font-medium text-foreground">
            {t('formsLine', {
              benchmark: data.benchmark_form ?? '-',
              progress: data.progress_form ?? '-',
            })}
          </p>
          <ul data-slot="progress-students" className="flex flex-col gap-3">
            {data.students.map((student) => {
              const notAssessed = notAssessedFor(student.student_ref);
              return (
                <li
                  key={student.student_document_id}
                  data-slot="progress-student"
                  className="flex flex-col gap-3 rounded-xl border border-border bg-card px-4 py-3"
                >
                  <div className="flex flex-wrap items-baseline gap-2">
                    <span className="text-sm font-semibold text-foreground">
                      {student.student_ref}
                    </span>
                    <span className="text-xs text-body">
                      {t('weeksBetween', { weeks: student.weeks_between })}
                    </span>
                  </div>
                  {student.transitions.length > 0 ? (
                    <ul className="flex flex-col gap-2">
                      {student.transitions.map((transition) => (
                        <ProgressTransitionRow key={transition.attribute} transition={transition} />
                      ))}
                    </ul>
                  ) : null}
                  {notAssessed.length > 0 ? (
                    <p data-slot="progress-not-assessed" className="text-xs text-body">
                      {t('notAssessedLine', { areas: notAssessed.join(', ') })}
                    </p>
                  ) : null}
                </li>
              );
            })}
          </ul>
        </>
      ) : null}
    </section>
  );
}
