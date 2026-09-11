'use client';

import type { ReactNode } from 'react';
import { useMemo } from 'react';
import { useFormatter, useTranslations } from 'next-intl';
import type { OpsStudentRow } from '@schooltest/ops-contracts';

import {
  OpsDirectoryTable,
  type DirectoryBulkAction,
  type DirectoryColumnDef,
  type DirectoryEmptyCopy,
  type DirectoryFilterDef,
  type DirectoryLabels,
  type DirectoryMeta,
  type DirectoryQueryStatus,
  type DirectoryRowAction,
  type DirectoryStateApi,
} from '@/modules/ops/directory';
import { noValueIfMissing } from '@/modules/ops/lib/ops-class-detail.helpers';
import {
  opsStudentCefrLevel,
  opsStudentFullName,
  opsStudentLatestResultLabel,
  opsStudentStatusLabelKey,
} from '@/modules/ops/lib/ops-students-list.helpers';
import {
  OPS_TAB_STATUS_PILL_CLASS,
  OpsTabTableCard,
} from '@/modules/ops/components/OpsTabTableCard';
import { StatusPill } from '@/modules/design-system';

export interface OpsStudentsTableProps {
  state: DirectoryStateApi;
  query: DirectoryQueryStatus;
  rows: readonly OpsStudentRow[];
  meta?: DirectoryMeta;
  filters: readonly DirectoryFilterDef[];
  rowActions?: (row: OpsStudentRow) => readonly DirectoryRowAction<OpsStudentRow>[];
  /** ops/18 — the design's Move class / Deactivate bulk set (`:1465-1492`). */
  bulkActions?: readonly DirectoryBulkAction[];
  /**
   * ops-tabs-audit — the tab-table card header (`Ops Portal.dc.html:352-368`):
   * the 19px/600 title, the "N enrolled" summary and the Import-students
   * PRIMARY as a ready-made node (the design's Export secondary is NOT drawn —
   * there is no school-scoped students CSV endpoint and the contract note
   * forbids a client-built roster CSV; see OpsStudentsTab's file header).
   * Replaces the kit `DirectoryHeaderDef`, whose 32px header buttons and
   * header-outside-the-card layout were the mismatches.
   */
  header?: { title: string; summary?: string; primary?: ReactNode };
  /** ops/18 — the design's Active/Pending setup/Archived chips (`:368-374`) replace the status select. */
  chipFilterKey?: string;
  emptyCopy?: DirectoryEmptyCopy;
  scope?: readonly unknown[];
  /** filters-audit 2026-09-11 — forwarded to the kit toolbar; the ops tabs
   *  render the design's pill arrangement (hidden labels, count + sort right). */
  toolbarVariant?: 'default' | 'pill';
}

/** The design's soft-tone pair per student status (`:964-977`). */
const STUDENT_STATUS_TONE = {
  active: 'success',
  enrolled: 'warning',
  archived: 'neutral',
} as const;

// The C-OPS-PORTAL-035 roster grid rendered THROUGH the task-04 directory kit:
// the kit owns toolbar, URL sync, states and pager; this file owns exactly the
// pictured columns (identity, year, level, latest result, status). Every
// cell is served data — a student with no year, no ACARA phase or no
// result renders the shared "no value" dash rather than an invented figure,
// and `percentage === 0` is a real score that renders as "0%".
export function OpsStudentsTable({
  state,
  query,
  rows,
  meta,
  filters,
  rowActions,
  bulkActions,
  header,
  chipFilterKey,
  emptyCopy,
  scope,
  toolbarVariant,
}: OpsStudentsTableProps) {
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
        // ops-tabs-audit — the design's identity block (`:386-391`): a 40px
        // round initial avatar, the 14.5/600 name, and the CLASS as the 12.5
        // #7C8698 sub UNDER it (`:390`: `sub: s.klass`), not a column of its
        // own. A student with no class keeps the no-value dash there.
        cell: (row) => {
          const name = opsStudentFullName(row);
          return (
            <span className="flex items-center gap-3">
              <span
                aria-hidden="true"
                className="grid size-10 flex-none place-items-center rounded-full bg-[#EEF1F6] text-sm font-semibold text-[#0E2350]"
              >
                {(name.charAt(0) || '?').toUpperCase()}
              </span>
              <span className="flex min-w-0 flex-col">
                <span className="truncate text-[14.5px] font-semibold text-foreground">{name}</span>
                <span className="mt-0.5 truncate text-[12.5px] text-[#7C8698]">
                  {noValueIfMissing(row.class?.name ?? null)}
                </span>
              </span>
            </span>
          );
        },
      },
      // The class moved into the identity block's sublabel (design `:390`);
      // the former standalone class column is gone.
      {
        key: 'year',
        header: t('columnYear'),
        grid: 'text',
        cell: (row) =>
          row.year_level === null ? noValueIfMissing(null) : t('yearLevelValue', { year: row.year_level }),
      },
      {
        key: 'level',
        header: t('columnLevel'),
        grid: 'text',
        cell: (row) => noValueIfMissing(opsStudentCefrLevel(row)),
      },
      {
        key: 'latest-result',
        header: t('columnLatestResult'),
        grid: 'text',
        // The design's last text column is the muted one (`:404`).
        cell: (row) => (
          <span className="text-[12.5px] text-[#9AA6B8]">
            {opsStudentLatestResultLabel(row, formatDate) ?? t('studentsNoResult')}
          </span>
        ),
      },
      {
        key: 'status',
        header: t('columnStatus'),
        grid: 'bare',
        // ops-tabs-audit — the design's 96px soft-tone pill (`:406`), NOT the
        // solid `Badge`.
        cell: (row) => (
          <StatusPill
            tone={STUDENT_STATUS_TONE[row.status]}
            className={OPS_TAB_STATUS_PILL_CLASS}
          >
            {t(opsStudentStatusLabelKey(row.status))}
          </StatusPill>
        ),
      },
    ];
  }, [t, format]);

  const table = (
    <OpsDirectoryTable
      state={state}
      query={query}
      rows={rows}
      getRowTarget={(row) => ({ kind: 'student', documentId: row.documentId })}
      selectable
      scope={scope}
      meta={meta}
      filters={filters}
      sorts={[]}
      rowActions={rowActions}
      bulkActions={bulkActions}
      chipFilterKey={chipFilterKey}
      emptyCopy={emptyCopy}
      columns={columns}
      labels={labels}
      toolbarVariant={toolbarVariant}
    />
  );

  if (header === undefined) return table;
  return (
    <OpsTabTableCard title={header.title} summary={header.summary} actions={header.primary}>
      {table}
    </OpsTabTableCard>
  );
}
