'use client';

import { useTranslations } from 'next-intl';

import type { OpsSchool } from '@/modules/ops/types/ops.types';

interface OpsSchoolCountCardsProps {
  school: OpsSchool;
}

// The C-OPS-01 summary cards on the ops school detail page. Split out of
// OpsSchoolDetail so that component stays under the 120-line cap.
export function OpsSchoolCountCards({ school }: OpsSchoolCountCardsProps) {
  const t = useTranslations('Ops.detail');
  const counts = [
    { label: t('teachersLabel'), value: school.teacher_count },
    { label: t('classesLabel'), value: school.class_count },
    { label: t('studentsLabel'), value: school.student_count },
    { label: t('resultsLabel'), value: school.results_count },
  ];

  return (
    <dl className="grid grid-cols-2 gap-4 sm:grid-cols-4">
      {counts.map((count) => (
        <div
          key={count.label}
          className="flex flex-col gap-1 rounded-xl border border-border bg-card p-4"
        >
          <dt className="text-sm text-body">{count.label}</dt>
          <dd className="text-2xl font-semibold text-foreground">{count.value}</dd>
        </div>
      ))}
    </dl>
  );
}
