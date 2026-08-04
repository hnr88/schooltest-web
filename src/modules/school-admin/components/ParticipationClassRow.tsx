'use client';

import { useTranslations } from 'next-intl';

import type { ParticipationClassRow as ParticipationClassRowData } from '@/modules/school-admin/types/participation.types';

import type { ParticipationClassRowProps } from '@/modules/school-admin/types/components.types';

// One class row of the C-RPT-04 participation monitor (task 78): roster size
// plus the Test A / Test B completion buckets. Completion status ONLY - no
// results data exists in this payload, so none can render here.
export function ParticipationClassRow({ row }: ParticipationClassRowProps) {
  const t = useTranslations('SchoolAdmin.participation');

  return (
    <tr data-slot="participation-row" className="border-b border-border last:border-b-0">
      <th scope="row" className="px-4 py-3 text-left text-sm font-semibold text-foreground">
        {row.name ?? t('unnamedClass')}
      </th>
      <td className="px-4 py-3 text-sm text-body">{row.teacher ?? t('noTeacher')}</td>
      <td className="px-4 py-3 text-sm text-body tabular-nums">{row.roster_count}</td>
      {[row.test_a, row.test_b].map((buckets, index) => (
        <td key={index} className="px-4 py-3 text-sm text-body">
          <span className="flex flex-wrap gap-x-3 gap-y-1 tabular-nums">
            <span>
              {t('buckets.submitted')}: {buckets.submitted}
            </span>
            <span>
              {t('buckets.inProgress')}: {buckets.in_progress}
            </span>
            <span>
              {t('buckets.notStarted')}: {buckets.not_started}
            </span>
          </span>
        </td>
      ))}
    </tr>
  );
}
