'use client';

import { useMemo } from 'react';
import { useTranslations } from 'next-intl';

import { Link } from '@/i18n/navigation';
import {
  applyClientDirectoryMode,
  DirectoryTable,
  useDirectoryState,
  type DirectoryColumnDef,
  type DirectoryLabels,
  type DirectorySortDef,
} from '@/modules/directory';
import { StatusPill } from '@/modules/design-system';
import { REPORTS_HREF } from '@/modules/shell';
import {
  masteryClientConfig,
  masterySorts,
  MASTERY_AREA_CODES,
} from '@/modules/teach/lib/mastery-directory.lib';
import { STATUS_TONE } from '@/modules/teach/constants/components.constants';

import type { MasteryTableProps } from '@/modules/teach/types/components.types';
import type { DiagnosticMasteryRow } from '@/modules/teach/types/diagnostic.types';

// ops/33 — the C-RPT-01 mastery list rendered THROUGH the shared directory kit
// in `client` mode. Read surface: NO row actions, NO bulk bar and NO selection
// — the kit renders neither a row menu nor a bulk bar unless the consumer
// passes them. Search matches the student name; every subskill column is a
// kit sortable column (whole loaded set, per the reducer), and the sort
// round-trips through the URL so it survives a reload. A missing attribute is
// an honest em dash, never a fabricated status. The row link to the full
// report keeps its `mastery-report-link` slot (task 126/129 contract).

export function MasteryTable({ rows, onSelect, query }: MasteryTableProps) {
  const t = useTranslations('Teach.diagnostic');

  const sorts = useMemo<readonly DirectorySortDef[]>(
    () =>
      masterySorts({
        nameAsc: t('sortNameAsc'),
        nameDesc: t('sortNameDesc'),
        weakest: (areaLabel) => t('sortAreaWeakest', { area: areaLabel }),
        strongest: (areaLabel) => t('sortAreaStrongest', { area: areaLabel }),
        areaLabel: (code) => t(`areas.${code}`),
      }),
    [t],
  );

  const state = useDirectoryState({
    filters: [],
    sorts,
    defaultSort: 'name:asc',
    mode: 'client',
    // The diagnostic loads the whole class and the design draws it as one
    // scroll — a class is tens of students, never a paged grid.
    pageSize: 100,
  });
  const page = useMemo(
    () => applyClientDirectoryMode(rows, state.params, masteryClientConfig),
    [rows, state.params],
  );

  const labels = useMemo<Partial<DirectoryLabels>>(
    () => ({
      searchPlaceholder: t('searchPlaceholder'),
      searchLabel: t('searchLabel'),
      sortLabel: t('sortLabel'),
      clearFilters: t('clearFilters'),
      paginationLabel: t('paginationLabel'),
      previous: t('previous'),
      next: t('next'),
      showingCount: ({ showing, total }) => t('showingCount', { showing, total }),
      pageCount: ({ page, pageCount, total }) => t('pageCount', { page, pageCount, total }),
      emptyNoneTitle: t('emptyMasteryTitle'),
      emptyNoneDescription: t('emptyMasteryBody'),
      emptyNoMatchesTitle: t('filteredEmptyTitle'),
      emptyNoMatchesDescription: t('filteredEmptyDescription'),
      errorTitle: t('loadError'),
      errorStaleBanner: t('errorStaleBanner'),
      errorDescription: t('errorDescription'),
      retry: t('retry'),
      loadingLabel: t('loading'),
    }),
    [t],
  );

  const columns = useMemo<DirectoryColumnDef<DiagnosticMasteryRow>[]>(
    () => [
      {
        key: 'student',
        header: t('columnStudent'),
        sortable: true,
        sortValues: { asc: 'name:asc', desc: 'name:desc' },
        cell: (row) => <span className="font-medium text-foreground">{row.student_ref}</span>,
      },
      ...MASTERY_AREA_CODES.map((code) => ({
        key: code,
        header: t(`areas.${code}`),
        sortable: true,
        sortValues: { asc: `${code}:asc`, desc: `${code}:desc` },
        cell: (row: DiagnosticMasteryRow) => <AreaCell row={row} code={code} />,
      })),
      {
        key: 'report',
        header: t('columnReport'),
        cell: (row) => <ReportLink row={row} label={t('mastery.viewFullReport', { student: row.student_ref })} />,
      },
    ],
    [t],
  );

  return (
    <div data-slot="mastery-table">
      <DirectoryTable
        state={state}
        query={query}
        rows={page.rows}
        meta={page.meta}
        getRowKey={(row) => row.student_document_id}
        filters={[]}
        sorts={sorts}
        columns={columns}
        onRowSelect={(row) => onSelect(row.student_ref)}
        labels={labels}
      />
    </div>
  );
}

function AreaCell({ row, code }: { row: DiagnosticMasteryRow; code: string }) {
  const t = useTranslations('Teach.diagnostic');
  const attribute = row.attributes.find((entry) => entry.code === code);
  if (!attribute) {
    return <span className="text-muted-foreground">—</span>;
  }
  return (
    <StatusPill tone={STATUS_TONE[attribute.status]}>{t(`status.${attribute.status}`)}</StatusPill>
  );
}

function ReportLink({ row, label }: { row: DiagnosticMasteryRow; label: string }) {
  if (!row.latest_result_document_id) return null;
  return (
    <Link
      data-slot="mastery-report-link"
      href={`${REPORTS_HREF}/${row.latest_result_document_id}`}
      aria-label={label}
      className="w-fit text-sm font-semibold text-primary transition-colors duration-150 hover:text-primary/80 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
    >
      {label}
    </Link>
  );
}
