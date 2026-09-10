'use client';

import { useCallback, useMemo } from 'react';
import { useTranslations } from 'next-intl';

import {
  DirectoryTable,
  type DirectoryColumnDef,
  type DirectoryFilterDef,
  type DirectoryLabels,
  type DirectoryMeta,
  type DirectoryQueryStatus,
  type DirectoryRowAction,
  type DirectoryStateApi,
} from '@/modules/directory';
import { StatusPill } from '@/modules/design-system';
import { StudentLevelBadge } from '@/modules/school-students/components/StudentLevelBadge';
import {
  studentDisplayName,
  studentRowActions,
} from '@/modules/school-students/hooks/use-student-row-actions';
import { toDiagnosticStatus, toFirstLanguage } from '@/modules/school-students/lib/student-level';

import type { SchoolStudent } from '@/modules/school-students/types/school-students.types';

export interface StudentsTableProps {
  state: DirectoryStateApi;
  filters: readonly DirectoryFilterDef[];
  query: DirectoryQueryStatus;
  rows: readonly SchoolStudent[];
  meta?: DirectoryMeta;
  onEdit: (student: SchoolStudent) => void;
  onArchive: (student: SchoolStudent) => void;
}

// Task 31 — the spec §4 roster table ON the shared directory kit, SERVER mode:
// the kit owns the toolbar (search + class/level filters), the ten state arms
// (loading/empty/no-matches/error/stale), the pager from `meta.pagination`, and
// the row menus; this file owns exactly the pictured columns (Name | Class |
// First language | Level | Diagnostic) and their cells. The bespoke filter bar,
// pager, empty row and per-row action menu are gone.
//
// Slots: `data-slot="school-students-table"` names the list region and
// `data-slot="school-students-row"` every body row — the stable contract the
// task-31 e2e specs assert through, so a presentation restyle cannot break
// them silently (the task's BOUNDED WRITE SET step 1).
export function StudentsTable({
  state,
  filters,
  query,
  rows,
  meta,
  onEdit,
  onArchive,
}: StudentsTableProps) {
  const t = useTranslations('SchoolStudents');

  const labels = useMemo<Partial<DirectoryLabels>>(
    () => ({
      searchPlaceholder: t('filters.searchPlaceholder'),
      searchLabel: t('filters.searchLabel'),
      clearFilters: t('list.clearFilters'),
      paginationLabel: t('list.paginationLabel'),
      previous: t('pagination.previous'),
      next: t('pagination.next'),
      rowMenuLabel: t('list.rowMenuLabel'),
      showingCount: ({ showing, total }) => t('list.showingCount', { showing, total }),
      pageCount: ({ page, pageCount }) => t('pagination.pageOf', { page, pageCount }),
      emptyNoneTitle: t('list.emptyTitle'),
      emptyNoneDescription: t('table.empty'),
      emptyNoMatchesTitle: t('table.emptyFiltered'),
      emptyNoMatchesDescription: t('list.noMatchesDescription'),
      errorTitle: t('errorTitle'),
      errorStaleBanner: t('list.staleBanner'),
      errorDescription: t('errorDescription'),
      retry: t('retry'),
      loadingLabel: t('list.loading'),
    }),
    [t],
  );

  const rowActions = useCallback(
    (student: SchoolStudent): readonly DirectoryRowAction<SchoolStudent>[] =>
      studentRowActions(
        student,
        { edit: t('actions.edit'), archive: t('actions.archive') },
        { onEdit, onArchive },
      ),
    [t, onEdit, onArchive],
  );

  // Spec §4 column order. The name cell keeps the C-CHD-05 email-fix flag and
  // the archived pill beside the name — the reshaped table has no status
  // column left to carry them; `rowHref` turns the whole first cell into the
  // row's ONE link to the detail view (the kit's §L-rownav shape, which
  // replaces the old stretched-link overlay).
  const columns = useMemo<readonly DirectoryColumnDef<SchoolStudent>[]>(
    () => [
      {
        key: 'name',
        header: t('table.columnName'),
        cell: (student) => (
          <span className="flex flex-wrap items-center gap-2 font-medium">
            {studentDisplayName(student)}
            {student.email_fix_requested ? (
              <StatusPill tone="warning">{t('table.emailFixRequested')}</StatusPill>
            ) : null}
            {student.status === 'archived' ? (
              <StatusPill tone="neutral">{t('table.statusArchived')}</StatusPill>
            ) : null}
          </span>
        ),
      },
      {
        key: 'class',
        header: t('table.columnClass'),
        cell: (student) =>
          student.class?.name ?? (
            <span className="text-muted-foreground">{t('table.classNone')}</span>
          ),
      },
      {
        key: 'first-language',
        header: t('table.columnFirstLanguage'),
        cell: (student) => {
          const language = toFirstLanguage(student.first_language);
          return language ? (
            t(`form.firstLanguageOption.${language}`)
          ) : (
            <span className="text-muted-foreground">{t('table.notSet')}</span>
          );
        },
      },
      {
        key: 'level',
        header: t('table.columnLevel'),
        cell: (student) => <StudentLevelBadge phase={student.acara_phase} />,
      },
      {
        key: 'diagnostic',
        header: t('table.columnDiagnostic'),
        className: 'text-center text-muted-foreground',
        cell: (student) =>
          t(`table.diagnosticOption.${toDiagnosticStatus(student.diagnostic_status)}`),
      },
    ],
    [t],
  );

  return (
    <DirectoryTable
      state={state}
      query={query}
      rows={rows}
      meta={meta}
      filters={filters}
      sorts={[]}
      columns={columns}
      rowActions={rowActions}
      getRowKey={(student) => student.documentId}
      rowHref={(student) => `/dashboard/school/students/${student.documentId}`}
      labels={labels}
      regionAttrs={{ 'data-slot': 'school-students-table' }}
      rowAttrs={(student) => ({
        'data-slot': 'school-students-row',
        'data-student-status': student.status ?? '',
      })}
    />
  );
}
