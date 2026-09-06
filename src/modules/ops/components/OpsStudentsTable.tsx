'use client';

import { useMemo } from 'react';
import { useFormatter, useTranslations } from 'next-intl';
import type { OpsStudentRow } from '@schooltest/ops-contracts';

import {
  OpsDirectoryTable,
  type DirectoryColumnDef,
  type DirectoryFilterDef,
  type DirectoryLabels,
  type DirectoryMeta,
  type DirectoryQueryStatus,
  type DirectoryStateApi,
} from '@/modules/ops/directory';
import { noValueIfMissing } from '@/modules/ops/lib/ops-class-detail.helpers';
import {
  opsStudentCefrLevel,
  opsStudentFullName,
  opsStudentLatestResultLabel,
  opsStudentStatusLabelKey,
  opsStudentStatusTone,
} from '@/modules/ops/lib/ops-students-list.helpers';

import { Badge } from '@/modules/design-system';

export interface OpsStudentsTableProps {
  state: DirectoryStateApi;
  query: DirectoryQueryStatus;
  rows: readonly OpsStudentRow[];
  meta?: DirectoryMeta;
  filters: readonly DirectoryFilterDef[];
}

// The C-OPS-PORTAL-035 roster grid rendered THROUGH the task-04 directory kit:
// the kit owns toolbar, URL sync, states and pager; this file owns exactly the
// pictured columns (name, class, year, level, latest result, status). Every
// cell is served data — a student with no class, no year, no ACARA phase or no
// result renders the shared "no value" dash rather than an invented figure,
// and `percentage === 0` is a real score that renders as "0%".
export function OpsStudentsTable({ state, query, rows, meta, filters }: OpsStudentsTableProps) {
  const t = useTranslations('Ops.schoolTables');
  const format = useFormatter();

  const labels = useMemo<Partial<DirectoryLabels>>(
    () => ({
      searchPlaceholder: t('studentsSearchPlaceholder'),
      searchLabel: t('studentsSearchLabel'),
      clearFilters: t('studentsClearFilters'),
      paginationLabel: t('studentsPaginationLabel'),
      previous: t('paginationPrevious'),
      next: t('paginationNext'),
      showingCount: ({ total }) => t('studentsCount', { count: total }),
      pageCount: ({ page, pageCount }) => t('paginationSummary', { page, pageCount }),
      emptyNoneTitle: t('studentsEmptyTitle'),
      emptyNoneDescription: t('studentsEmptyDescription'),
      emptyNoMatchesTitle: t('studentsFilteredEmptyTitle'),
      emptyNoMatchesDescription: t('studentsFilteredEmptyDescription'),
      errorTitle: t('errorTitle'),
      errorStaleBanner: t('studentsStaleBanner'),
      errorDescription: t('errorDescription'),
      retry: t('studentsRetry'),
      loadingLabel: t('studentsLoading'),
    }),
    [t],
  );

  const columns = useMemo<DirectoryColumnDef<OpsStudentRow>[]>(() => {
    const formatDate = (isoDate: string): string =>
      format.dateTime(new Date(isoDate), { day: 'numeric', month: 'short' });
    return [
      {
        key: 'name',
        header: t('columnName'),
        cell: (row) => <span className="font-medium text-foreground">{opsStudentFullName(row)}</span>,
      },
      {
        key: 'class',
        header: t('columnClass'),
        cell: (row) => noValueIfMissing(row.class?.name ?? null),
      },
      {
        key: 'year',
        header: t('columnYear'),
        cell: (row) =>
          row.year_level === null ? noValueIfMissing(null) : t('yearLevelValue', { year: row.year_level }),
      },
      {
        key: 'level',
        header: t('columnLevel'),
        cell: (row) => noValueIfMissing(opsStudentCefrLevel(row)),
      },
      {
        key: 'latest-result',
        header: t('columnLatestResult'),
        cell: (row) => opsStudentLatestResultLabel(row, formatDate) ?? t('studentsNoResult'),
      },
      {
        key: 'status',
        header: t('columnStatus'),
        cell: (row) => (
          <Badge variant={opsStudentStatusTone(row.status)}>
            {t(opsStudentStatusLabelKey(row.status))}
          </Badge>
        ),
      },
    ];
  }, [t, format]);

  return (
    <OpsDirectoryTable
      state={state}
      query={query}
      rows={rows}
      getRowTarget={(row) => ({ kind: 'student', documentId: row.documentId })}
      meta={meta}
      filters={filters}
      sorts={[]}
      columns={columns}
      labels={labels}
    />
  );
}
