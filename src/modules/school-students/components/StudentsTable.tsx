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
// the row menus; this file owns the pictured cells — identity block (avatar,
// name, first language under it), class, diagnostic, level pill.
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

  // School Admin Portal design (VIEW 5, :787-800): the row is identity block
  // (36px neutral avatar, 14.5/600 name, "First language: X" 12.5 below) ·
  // class text · bold value · the phase pill · the ⋯ menu. The name cell keeps
  // the C-CHD-05 email-fix flag and the archived pill beside the name;
  // `rowHref` turns the first cell into the row's ONE link to the detail view.
  const columns = useMemo<readonly DirectoryColumnDef<SchoolStudent>[]>(
    () => [
      {
        key: 'name',
        header: t('table.columnName'),
        cell: (student) => {
          const name = studentDisplayName(student);
          const language = toFirstLanguage(student.first_language);
          return (
            <span className="flex items-center gap-[13px]">
              <span
                aria-hidden="true"
                className="grid size-9 shrink-0 place-items-center rounded-full bg-[#EEF1F6] text-[13px] font-semibold text-foreground"
              >
                {name.charAt(0).toUpperCase()}
              </span>
              <span className="flex min-w-0 flex-col">
                <span className="flex flex-wrap items-center gap-2">
                  <span className="truncate text-[14.5px] font-semibold text-foreground">
                    {name}
                  </span>
                  {student.email_fix_requested ? (
                    <StatusPill tone="warning">{t('table.emailFixRequested')}</StatusPill>
                  ) : null}
                  {student.status === 'archived' ? (
                    <StatusPill tone="neutral">{t('table.statusArchived')}</StatusPill>
                  ) : null}
                </span>
                <span className="mt-0.5 truncate text-meta text-[#7C8698]">
                  {t('table.firstLanguageLine', {
                    language: language
                      ? t(`form.firstLanguageOption.${language}`)
                      : t('table.notSet'),
                  })}
                </span>
              </span>
            </span>
          );
        },
      },
      {
        key: 'class',
        header: t('table.columnClass'),
        grid: 'text',
        cell: (student) =>
          student.class?.name ?? (
            <span className="text-muted-foreground">{t('table.classNone')}</span>
          ),
      },
      {
        key: 'diagnostic',
        header: t('table.columnDiagnostic'),
        grid: 'bare',
        className: 'min-w-[90px] flex-[1_1_90px] overflow-hidden',
        cell: (student) => (
          <span className="block truncate text-[13.5px] font-semibold text-foreground">
            {t(`table.diagnosticOption.${toDiagnosticStatus(student.diagnostic_status)}`)}
          </span>
        ),
      },
      {
        key: 'level',
        header: t('table.columnLevel'),
        grid: 'bare',
        cell: (student) => <StudentLevelBadge phase={student.acara_phase} compact />,
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
