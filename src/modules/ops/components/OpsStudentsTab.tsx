'use client';

import { useMemo } from 'react';
import { useTranslations } from 'next-intl';
import {
  OPS_STUDENT_STATUSES,
  type OpsStudentsListQuery,
} from '@schooltest/ops-contracts';

import { useOpsDirectoryState } from '@/modules/ops/directory';
import { OpsStudentsTable } from '@/modules/ops/components/OpsStudentsTable';
import {
  OPS_STUDENT_YEAR_LEVELS,
  opsStudentClassOptions,
  opsStudentStatusFilterValue,
  opsStudentStatusLabelKey,
} from '@/modules/ops/lib/ops-students-list.helpers';
import { useTeachersListQuery } from '@/modules/ops/queries/use-teachers-list.query';
import { useStudentsListQuery } from '@/modules/ops/queries/use-students-list.query';

import type { DirectoryFilterDef } from '@/modules/ops/directory';
import type { OpsStudentsTabProps } from '@/modules/ops/types/students-list.types';

// C-OPS-PORTAL-035 (OPS-045) — the ops Students tab, on the task-04 directory
// kit (the spec's "OpsStudentsFilters collapses into the kit"): the kit owns
// the URL <-> state sync, the empty/error states and the pager, while every
// filter here maps to a REAL server filter — status, year (7..12) and class —
// so the count under the table always describes the whole filtered scope.
// The endpoint declares no sort parameter, so the kit gets an empty sort list.
export function OpsStudentsTab({ schoolDocumentId }: OpsStudentsTabProps) {
  const t = useTranslations('Ops.schoolTables');
  const teachers = useTeachersListQuery(schoolDocumentId, { page: 1, pageSize: 200 }, true);
  const classOptions = opsStudentClassOptions(teachers.data?.data ?? []);

  const filters = useMemo<DirectoryFilterDef[]>(
    () => [
      {
        key: 'status',
        label: t('studentsStatusLabel'),
        options: [
          { value: 'all', label: t('filterAll') },
          ...OPS_STUDENT_STATUSES.map((status) => ({
            value: status,
            label: t(opsStudentStatusLabelKey(status)),
          })),
        ],
      },
      {
        key: 'year_level',
        label: t('studentsYearLabel'),
        options: [
          { value: 'all', label: t('filterAll') },
          ...OPS_STUDENT_YEAR_LEVELS.map((year) => ({
            value: String(year),
            label: t('yearLevelValue', { year }),
          })),
        ],
      },
      {
        key: 'class',
        label: t('studentsClassLabel'),
        options: [{ value: 'all', label: t('filterAll') }, ...classOptions],
      },
    ],
    [t, classOptions],
  );

  const state = useOpsDirectoryState({ filters, sorts: [], defaultSort: '' });

  // The kit stores filter values as strings; the contract wants the status
  // enum and a NUMERIC year — narrowed/decoded once, here.
  const query = useMemo<OpsStudentsListQuery>(
    () => ({
      page: state.params.page,
      pageSize: state.params.pageSize,
      q: state.params.q,
      status: opsStudentStatusFilterValue(state.params.filters.status),
      class: state.params.filters.class,
      year_level:
        state.params.filters.year_level === undefined
          ? undefined
          : Number(state.params.filters.year_level),
    }),
    [state.params],
  );

  const students = useStudentsListQuery(schoolDocumentId, query, true);

  return (
    <OpsStudentsTable
      state={state}
      filters={filters}
      rows={students.data?.data ?? []}
      meta={students.data?.meta.pagination}
      query={students}
    />
  );
}
