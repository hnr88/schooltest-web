'use client';

import { useTranslations } from 'next-intl';

import type { OpsSchool } from '@/modules/ops/types/ops.types';

import type { OpsSchoolCountCardsProps } from '@/modules/ops/types/components.types';

// The C-OPS-01 summary cards on the ops school detail page. Split out of
// OpsSchoolDetail so that component stays under the 120-line cap. The
// Teachers card is the OPS-teacher-details entry point: clicking it opens the
// staff directory dialog (wired by the parent).
export function OpsSchoolCountCards({ school, onTeachersClick }: OpsSchoolCountCardsProps) {
  const t = useTranslations('Ops.detail');
  const counts = [
    { label: t('teachersLabel'), value: school.teacher_count, onClick: onTeachersClick },
    { label: t('classesLabel'), value: school.class_count },
    { label: t('studentsLabel'), value: school.student_count },
    { label: t('resultsLabel'), value: school.results_count },
  ];

  return (
    <dl className="grid grid-cols-2 gap-4 sm:grid-cols-4">
      {counts.map((count) =>
        count.onClick ? (
          <div key={count.label}>
            <button
              type="button"
              onClick={count.onClick}
              data-slot="ops-count-card-teachers"
              className="flex w-full flex-col gap-1 rounded-xl border border-border bg-card p-4 text-left underline-offset-4 transition-colors hover:border-foreground/25 focus-visible:border-foreground/25 focus-visible:outline-none"
            >
              <dt className="text-sm text-body">{count.label}</dt>
              <dd className="text-2xl font-semibold text-foreground">{count.value}</dd>
            </button>
          </div>
        ) : (
          <div
            key={count.label}
            className="flex flex-col gap-1 rounded-xl border border-border bg-card p-4"
          >
            <dt className="text-sm text-body">{count.label}</dt>
            <dd className="text-2xl font-semibold text-foreground">{count.value}</dd>
          </div>
        ),
      )}
    </dl>
  );
}
