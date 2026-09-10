'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { Pencil, Users } from 'lucide-react';

import { Link } from '@/i18n/navigation';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Alert,
  Badge,
  Button,
  EmptyState,
  Input,
  NativeSelect,
  NativeSelectOption,
  Skeleton,
} from '@/modules/design-system';
import { OpsEditClassDialog } from '@/modules/ops/components/OpsEditClassDialog';
import { noValueIfMissing, opsTeacherLabel } from '@/modules/ops/lib/ops-class-detail.helpers';
import { useClassRosterQuery } from '@/modules/ops/queries/use-class-roster.query';
import { useOpsClassDetailQuery } from '@/modules/ops/queries/use-ops-class-detail.query';
import { useTeachersListQuery } from '@/modules/ops/queries/use-teachers-list.query';
import { useResultWindowsQuery } from '@/modules/ops/queries/use-result-windows.query';
import {
  useOpsAssignClassWindowMutation,
  useOpsAssignTeacherMutation,
} from '@/modules/ops/queries/use-ops-update-class.mutation';

import type { OpsClassDetailProps } from '@/modules/ops/types/components.types';

// Ops class inner page (task 015) — the Ops Portal "Class detail" artboard's
// class inner page. Reads ONE class with its roster, teacher and school through
// the ops-only class router, then renders the header, the four summary cells
// and the "Students in this class" roster. Everything rendered is real /api
// data. The design's actions that the ops API cannot serve (Add students,
// class-level Import, Export CSV, and the per-student "latest result" column /
// bulk Move/Export/Remove) are deliberately OMITTED — a control wired to
// nothing is a defect here — and named as contract gaps rather than invented.
/** The roster page size. The server caps pageSize at 200 and refuses more. */
const ROSTER_PAGE_SIZE = 25;

export function OpsClassDetail({ classDocumentId, schoolDocumentId }: OpsClassDetailProps) {
  const t = useTranslations('Ops.classDetail');
  const windowTitle = useTranslations('Ops.window');
  const query = useOpsClassDetailQuery(schoolDocumentId, classDocumentId, true);
  const [editOpen, setEditOpen] = useState(false);
  // Row 20 — the roster is its own PAGINATED read (C-OPS-PORTAL-037); the class
  // detail deliberately serves no student array. Search and page live here and
  // go to the SERVER, so `meta.pagination.total` always describes the whole
  // filtered roster rather than the rows on screen.
  const [rosterPage, setRosterPage] = useState(1);
  const [rosterSearch, setRosterSearch] = useState('');
  const roster = useClassRosterQuery(
    schoolDocumentId,
    classDocumentId,
    { page: rosterPage, pageSize: ROSTER_PAGE_SIZE, ...(rosterSearch ? { q: rosterSearch } : {}) },
    true,
  );
  const rosterRows = roster.data?.data ?? [];
  const rosterMeta = roster.data?.meta.pagination;
  // Task 20 — the class-scoped assignment + named-window controls. The picker
  // rows always carry the EMAIL so long or duplicate names can never be
  // confused; the API enforces the same eligibility the picker shows.
  const teachersQuery = useTeachersListQuery(schoolDocumentId, { page: 1, pageSize: 200 }, true);
  const windowsQuery = useResultWindowsQuery(schoolDocumentId, { page: 1, pageSize: 200 });
  const assignTeacher = useOpsAssignTeacherMutation(classDocumentId, schoolDocumentId);
  const assignWindow = useOpsAssignClassWindowMutation(classDocumentId, schoolDocumentId);

  if (query.isPending) {
    return (
      <main className="flex flex-1 flex-col gap-6 px-4 py-6 sm:px-6 lg:px-8">
        <Skeleton className="h-9 w-1/3" />
        <Skeleton className="h-4 w-1/2" />
        <Skeleton className="h-24 w-full" />
        <Skeleton className="h-64 w-full" />
      </main>
    );
  }

  if (query.isError) {
    return (
      <main className="flex flex-1 flex-col gap-6 px-4 py-6 sm:px-6 lg:px-8">
        <Alert
          variant="error"
          title={t('errorTitle')}
          action={
            <Button
              type="button"
              variant="outline"
              size="sm"
              loading={query.isFetching}
              onClick={() => query.refetch()}
            >
              {t('retry')}
            </Button>
          }
        >
          {t('errorDescription')}
        </Alert>
      </main>
    );
  }

  const classDetail = query.data;

  if (!classDetail) {
    return (
      <main className="flex flex-1 flex-col gap-6 px-4 py-6 sm:px-6 lg:px-8">
        <Alert variant="error" title={t('notFoundTitle')}>
          {t('notFoundDescription')}
        </Alert>
      </main>
    );
  }

  // The CALL is widened, not the helper: `opsTeacherLabel` takes an `email`
  // that the ops detail route does not serve, and narrowing a shared helper to
  // satisfy one caller is how a function loses a field another row depends on.
  // Passing null is honest — the helper falls back to the tree's no-value dash
  // if a teacher somehow has no name — and nothing user-facing is lost, because
  // the assignment picker below still carries every teacher's email from
  // `teachersQuery`, which is where a long or duplicate name gets disambiguated.
  const teacherName = classDetail.primary_teacher
    ? opsTeacherLabel({ ...classDetail.primary_teacher, email: null })
    : t('noTeacher');

  return (
    <main
      data-slot="ops-class-detail"
      data-surface="ops-class-detail"
      className="flex flex-1 flex-col gap-6 px-4 py-6 sm:px-6 lg:px-8"
    >
      <div className="flex flex-col gap-2">
        <nav className="flex items-center gap-2 text-sm text-body">
          <Link href="/dashboard/ops/schools" className="underline-offset-4 hover:underline">
            {t('breadcrumbSchools')}
          </Link>
          <span aria-hidden="true">/</span>
          <Link href={`/dashboard/ops/schools/${schoolDocumentId}`} className="underline-offset-4 hover:underline">
            {classDetail.school?.name ?? t('breadcrumbSchool')}
          </Link>
          <span aria-hidden="true">/</span>
          <span aria-current="page" className="font-semibold text-foreground">
            {classDetail.name}
          </span>
        </nav>

        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="flex min-w-0 flex-col gap-1">
            <h1 className="text-2xl font-semibold text-foreground">{classDetail.name}</h1>
            <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-body">
              {classDetail.year_band ? (
                <span>
                  {t('yearBand')}: {classDetail.year_band}
                </span>
              ) : null}
              {classDetail.school ? <span>{classDetail.school.name}</span> : null}
              {classDetail.primary_teacher ? (
                <span>
                  {t('classTeacher')}: {teacherName}
                </span>
              ) : null}
            </div>
          </div>

          <div className="flex shrink-0 flex-wrap items-center gap-2">
            <NativeSelect
              aria-label={t('classTeacher')}
              data-slot="ops-class-assign-teacher"
              className="w-64"
              value={classDetail.primary_teacher?.documentId ?? ''}
              disabled={assignTeacher.isPending}
              onChange={(event) =>
                assignTeacher.mutate(
                  event.target.value === '' ? [] : [event.target.value],
                )
              }
            >
              <NativeSelectOption value="">{t('noTeacher')}</NativeSelectOption>
              {(teachersQuery.data?.data ?? []).map((teacher) => (
                <NativeSelectOption key={teacher.documentId} value={teacher.documentId}>
                  {/* EMAIL on every option: long or duplicate names are
                      disambiguated by the address, never by truncation. */}
                  {opsTeacherLabel(teacher)}
                  {teacher.email ? ` · ${teacher.email}` : ''}
                </NativeSelectOption>
              ))}
            </NativeSelect>
            <NativeSelect
              aria-label={windowTitle('title')}
              data-slot="ops-class-assign-window"
              className="w-64"
              value={classDetail.test_window?.documentId ?? ''}
              disabled={assignWindow.isPending}
              onChange={(event) =>
                assignWindow.mutate(event.target.value === '' ? null : event.target.value)
              }
            >
              <NativeSelectOption value="">{windowTitle('title')}</NativeSelectOption>
              {(windowsQuery.data?.data ?? []).map((window) => (
                <NativeSelectOption
                  key={window.documentId}
                  value={window.documentId}
                  disabled={window.status === 'cancelled' || window.status === 'complete'}
                >
                  {window.title}
                  {window.status ? ` (${window.status})` : ''}
                </NativeSelectOption>
              ))}
            </NativeSelect>
            <Button
              type="button"
              size="sm"
              variant="outline"
              onClick={() => setEditOpen(true)}
              className="shrink-0"
            >
              <Pencil aria-hidden="true" className="mr-1.5 size-3.5" />
              {t('editClass')}
            </Button>
          </div>
        </div>
      </div>

      <dl className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <SummaryCell label={t('summaryStudents')} value={String(classDetail.student_count)} />
        <SummaryCell label={t('summaryTeacher')} value={teacherName} />
        <SummaryCell label={t('summaryAverageLevel')} value={t('notAvailable')} />
        <SummaryCell label={t('summaryTestsCompleted')} value={t('notAvailable')} />
      </dl>

      <section className="flex flex-col gap-3" aria-label={t('rosterTitle')}>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-lg font-semibold text-foreground">{t('rosterTitle')}</h2>
          <div className="flex items-center gap-3">
            <Input
              data-slot="ops-class-roster-search"
              type="search"
              value={rosterSearch}
              placeholder={t('rosterSearchPlaceholder')}
              aria-label={t('rosterSearchPlaceholder')}
              className="h-10 w-full sm:w-72"
              onChange={(event) => {
                // Page 1 on every new term: keeping the page would show an
                // empty table for a term that has results on page 1.
                setRosterSearch(event.target.value);
                setRosterPage(1);
              }}
            />
            {rosterMeta ? (
              <span data-slot="ops-class-roster-count" className="text-sm text-muted-foreground">
                {t('rosterCount', { count: rosterMeta.total })}
              </span>
            ) : null}
          </div>
        </div>

        {roster.isPending ? (
          <div data-slot="ops-class-roster-skeleton" className="flex flex-col gap-2" aria-busy="true">
            {[0, 1, 2, 3, 4].map((row) => (
              <Skeleton key={row} className="h-12 w-full rounded-card" />
            ))}
          </div>
        ) : roster.isError ? (
          <Alert
            variant="error"
            data-slot="ops-class-roster-error"
            title={t('rosterErrorTitle')}
            action={
              <Button
                type="button"
                variant="outline"
                size="sm"
                loading={roster.isFetching}
                onClick={() => roster.refetch()}
              >
                {t('retry')}
              </Button>
            }
          >
            {t('rosterErrorBody')}
          </Alert>
        ) : rosterRows.length === 0 ? (
          <div className="rounded-card border border-border bg-card px-6 py-6 shadow-sm">
            {/* Two DIFFERENT facts. "This class has no students" is the
                design's empty roster (`:522-525`); "no student matches that
                search" is a filtered miss. Showing the first for the second
                would tell an operator the class is empty when it is not. */}
            <EmptyState
              icon={Users}
              tone="brand"
              title={rosterSearch ? t('rosterNoMatchTitle') : t('emptyTitle')}
              description={rosterSearch ? t('rosterNoMatchDescription') : t('emptyDescription')}
              className="border-none px-0 py-2"
            />
          </div>
        ) : (
          <div className="overflow-hidden rounded-card border border-border bg-card shadow-sm">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t('rosterName')}</TableHead>
                  <TableHead>{t('rosterYear')}</TableHead>
                  <TableHead>{t('rosterLanguage')}</TableHead>
                  <TableHead>{t('rosterLevel')}</TableHead>
                  <TableHead>{t('rosterStatus')}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rosterRows.map((student) => (
                  <TableRow key={student.documentId}>
                    <TableCell className="font-medium text-foreground">
                      {noValueIfMissing(
                        [student.given_name, student.family_name].filter(Boolean).join(' '),
                      )}
                    </TableCell>
                    <TableCell>{noValueIfMissing(student.year_level)}</TableCell>
                    <TableCell>{noValueIfMissing(student.first_language)}</TableCell>
                    <TableCell>{noValueIfMissing(student.acara_phase)}</TableCell>
                    <TableCell>
                      {student.status ? (
                        <Badge variant="default">{student.status}</Badge>
                      ) : (
                        noValueIfMissing(student.status)
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}

        {rosterMeta && rosterMeta.pageCount > 1 ? (
          <div
            data-slot="ops-class-roster-pagination"
            className="flex items-center justify-between gap-3"
          >
            <span className="text-sm text-muted-foreground">
              {t('rosterPageOf', { page: rosterMeta.page, pageCount: rosterMeta.pageCount })}
            </span>
            <div className="flex items-center gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                data-slot="ops-class-roster-prev"
                disabled={rosterMeta.page <= 1 || roster.isFetching}
                onClick={() => setRosterPage((page) => Math.max(1, page - 1))}
              >
                {t('rosterPrev')}
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                data-slot="ops-class-roster-next"
                // The server refuses an out-of-range page with a 400, so the
                // control is bounded here rather than letting the UI ask for a
                // page that cannot exist.
                disabled={rosterMeta.page >= rosterMeta.pageCount || roster.isFetching}
                onClick={() => setRosterPage((page) => page + 1)}
              >
                {t('rosterNext')}
              </Button>
            </div>
          </div>
        ) : null}
      </section>

      {editOpen ? (
        <OpsEditClassDialog
          classDocumentId={classDetail.documentId}
          schoolDocumentId={schoolDocumentId}
          className={classDetail.name ?? ''}
          classUpdatedAt={classDetail.updated_at ?? null}
          currentYearBand={classDetail.year_band}
          onClose={() => setEditOpen(false)}
        />
      ) : null}
    </main>
  );
}

function SummaryCell({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex min-w-0 flex-col gap-1 rounded-tile bg-surface-inset px-3.5 py-3">
      <dt className="text-meta font-semibold tracking-wide text-body uppercase">{label}</dt>
      <dd className="text-stat-sm font-bold break-words text-foreground">{value}</dd>
    </div>
  );
}
