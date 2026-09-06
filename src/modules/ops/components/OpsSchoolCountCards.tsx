'use client';

import { useTranslations } from 'next-intl';

import type { OpsSchoolCountCardsProps } from '@/modules/ops/types/components.types';

// The summary cards on the ops school detail page. Split out of
// OpsSchoolDetail so that component stays under the 120-line cap. The
// Teachers card is the OPS-teacher-details entry point: clicking it opens the
// staff directory dialog (wired by the parent).
//
// Teachers shows `portal_teacher_count` — teacher-role accounts ONLY — and
// Admins is its own card. The legacy `teacher_count` still means teachers plus
// school admins and is left with that meaning for its existing callers, but
// showing it under a label reading "Teachers" was counting admins twice on one
// screen: once in the number and once in the directory behind it.
export function OpsSchoolCountCards({ school, onTeachersClick }: OpsSchoolCountCardsProps) {
  const t = useTranslations('Ops.detail');
  const counts = [
    { label: t('teachersLabel'), value: school.portal_teacher_count, onClick: onTeachersClick },
    { label: t('adminsLabel'), value: school.admin_count },
    { label: t('classesLabel'), value: school.class_count },
    { label: t('studentsLabel'), value: school.student_count },
    { label: t('resultsLabel'), value: school.results_count },
  ];

  return (
    <div className="grid grid-cols-2 gap-4 sm:grid-cols-5">
      {counts.map((count) =>
        count.onClick ? (
          <button
            key={count.label}
            type="button"
            onClick={count.onClick}
            data-slot="ops-count-card-teachers"
            data-count-label={count.label}
            className="flex w-full flex-col gap-1 rounded-xl border border-border bg-card p-4 text-left underline-offset-4 transition-colors hover:border-foreground/25 focus-visible:border-foreground/25 focus-visible:outline-none"
          >
            <span className="text-sm text-body">{count.label}</span>
            <span data-slot="ops-count-value" className="text-2xl font-semibold text-foreground">
              {count.value}
            </span>
          </button>
        ) : (
          <div
            key={count.label}
            data-slot="ops-count-card"
            data-count-label={count.label}
            className="flex flex-col gap-1 rounded-xl border border-border bg-card p-4"
          >
            <span className="text-sm text-body">{count.label}</span>
            <span data-slot="ops-count-value" className="text-2xl font-semibold text-foreground">
              {count.value}
            </span>
          </div>
        ),
      )}
    </div>
  );
}
