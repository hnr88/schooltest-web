'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { useQueryClient } from '@tanstack/react-query';
import { MoreHorizontal, Pencil, Users } from 'lucide-react';
import type { OpsStudentRow } from '@schooltest/ops-contracts';

import { Link } from '@/i18n/navigation';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Checkbox } from '@/components/ui/checkbox';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Alert,
  Badge,
  Button,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  EmptyState,
  IconButton,
  Input,
  NativeSelect,
  NativeSelectOption,
  SelectField,
  Skeleton,
  StatusPill,
} from '@/modules/design-system';
import type { StatusPillTone } from '@/modules/design-system/types/data-display.types';
import {
  describeRunOutcome,
  showOpsToast,
  useOpsActionRunner,
  useOpsSelection,
  useOpsWriteGate,
  OpsBulkBar,
  type OpsActionSummary,
  type OpsActionTarget,
  type OpsBulkBarAction,
} from '@/modules/ops/actions';
import { OpsConfirmDialog } from '@/modules/ops/components/OpsConfirmDialog';
import { OpsEditClassDialog } from '@/modules/ops/components/OpsEditClassDialog';
import { OpsStudentProfilePanel } from '@/modules/ops/components/OpsStudentProfilePanel';
import {
  classHeaderBadge,
  classModalCefrLevel,
  classRosterBulkActions,
  classRosterRowActions,
  classTestsCompletedCount,
  noValueIfMissing,
  opsTeacherLabel,
  type ClassRosterAction,
  type ClassRosterActionKey,
} from '@/modules/ops/lib/ops-class-detail.helpers';
import { classRowStatus, type ClassListStatus } from '@/modules/ops/lib/ops-classes-contract';
import { opsStudentDestinationClassOptions } from '@/modules/ops/lib/ops-students-list.helpers';
import { useClassesListQuery } from '@/modules/ops/queries/use-classes-list.query';
import {
  downloadClassRoster,
  moveClassRosterAction,
  removeFromClassAction,
} from '@/modules/ops/queries/use-class-roster-actions.mutation';
import { useClassRosterQuery } from '@/modules/ops/queries/use-class-roster.query';
import { opsClassDetailQueryKey, useOpsClassDetailQuery } from '@/modules/ops/queries/use-ops-class-detail.query';
import { useTeachersListQuery } from '@/modules/ops/queries/use-teachers-list.query';
import { useResultWindowsQuery } from '@/modules/ops/queries/use-result-windows.query';
import type { MoveStudentClassTarget } from '@/modules/ops/queries/use-student-actions.mutation';
import {
  useOpsAssignClassWindowMutation,
  useOpsAssignTeacherMutation,
} from '@/modules/ops/queries/use-ops-update-class.mutation';

import type { OpsClassDetailProps } from '@/modules/ops/types/components.types';

// Ops class inner page (task 015, extended by task 21). Reads ONE class with
// its roster, teacher and school through the ops-only class router, then
// renders the header, the four summary cells and the "Students in this
// class" roster. Task 21 adds every roster WRITE the design draws: the
// row/bulk Move class and Remove from class (through the action kit's
// runner), the real Export CSV (C-OPS-CLASS-EXPORT) and the Add-students
// entry points. Assign teacher and the window select are UNCHANGED — tasks
// 22/23 replace them with the design's modals; until then this screen leaves
// the pickers working exactly as task 20 shipped them.
/** The roster page size. The server caps pageSize at 200 and refuses more. */
const ROSTER_PAGE_SIZE = 25;
/** "Get everything" page size for the aggregate roster read (D-08) and the class-status/destination lookup — same pattern `teachersQuery`/`windowsQuery` already use on this page. */
const ALL_PAGE_SIZE = 200;

const STATUS_TONE: Record<ClassListStatus, StatusPillTone> = {
  active: 'success',
  pending_setup: 'warning',
  archived: 'neutral',
};

function studentTarget(row: OpsStudentRow): OpsActionTarget {
  return { kind: 'student', documentId: row.documentId };
}

function studentFullName(row: OpsStudentRow): string {
  return [row.given_name, row.family_name].filter(Boolean).join(' ');
}

interface RemoveConfirmState {
  rows: readonly OpsStudentRow[];
  origin: 'row' | 'bulk';
}

export function OpsClassDetail({ classDocumentId, schoolDocumentId }: OpsClassDetailProps) {
  const t = useTranslations('Ops.classDetail');
  const windowTitle = useTranslations('Ops.window');
  // Reused verbatim (task 21 binding instruction) — the SAME label/confirm
  // copy task 18 already shipped for the Students tab's row+bulk Move class.
  const sharedT = useTranslations('Ops.schoolTables');
  // Reused: "More actions" / "Cancel" already exist for exactly this purpose
  // (`OpsSchoolSuspendPanel`), and "Active"/"Pending setup"/"Archived" already
  // exist for exactly this status pill (`OpsClassesTab`).
  const detailT = useTranslations('Ops.detail');
  const classesTabT = useTranslations('Ops.classesTab');
  const queryClient = useQueryClient();
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
  // D-08 — the unfiltered, unpaginated roster the two derived summary cells
  // aggregate over. A second read rather than reusing the display page: the
  // display roster is SEARCHED and PAGED, and the summary cells must describe
  // the whole class, not whatever the operator last typed into the search box.
  const aggregateRoster = useClassRosterQuery(
    schoolDocumentId,
    classDocumentId,
    { page: 1, pageSize: ALL_PAGE_SIZE },
    true,
  );
  // Task 20 — the class-scoped assignment + named-window controls. The picker
  // rows always carry the EMAIL so long or duplicate names can never be
  // confused; the API enforces the same eligibility the picker shows.
  const teachersQuery = useTeachersListQuery(schoolDocumentId, { page: 1, pageSize: 200 }, true);
  const windowsQuery = useResultWindowsQuery(schoolDocumentId, { page: 1, pageSize: 200 });
  const assignTeacher = useOpsAssignTeacherMutation(classDocumentId, schoolDocumentId);
  const assignWindow = useOpsAssignClassWindowMutation(classDocumentId, schoolDocumentId);
  // The class-detail read (`opsClassDetailSchema`) carries no `archived_at` —
  // it cannot tell "archived" from "active"/"pending setup" on its own. The
  // classes list DOES (it is `classRowStatus`'s own input), and task 17's
  // `OpsClassesTab` already fetches it the same way for the same reason
  // (`fetchClassStatus`). Reused here, at the same pageSize-200 "get
  // everything" the teacher/window pickers already use above, so this class's
  // status pill and its Move-class destination picker share ONE read.
  const classesQuery = useClassesListQuery(schoolDocumentId, { page: 1, pageSize: ALL_PAGE_SIZE }, true);
  const thisClassRow = (classesQuery.data?.data ?? []).find((row) => row.documentId === classDocumentId);
  const classStatus = thisClassRow ? classRowStatus(thisClassRow) : null;
  const destinationOptions = opsStudentDestinationClassOptions(classesQuery.data?.data ?? []).filter(
    (option) => option.value !== classDocumentId,
  );

  const writeGate = useOpsWriteGate();
  const [profileDocumentId, setProfileDocumentId] = useState<string | null>(null);
  const [moveTargetRows, setMoveTargetRows] = useState<readonly OpsStudentRow[] | null>(null);
  const [destinationClassDocumentId, setDestinationClassDocumentId] = useState('');
  const [removeConfirm, setRemoveConfirm] = useState<RemoveConfirmState | null>(null);

  const selection = useOpsSelection({
    page: rosterRows.map(studentTarget),
    scope: [schoolDocumentId, classDocumentId, rosterPage, rosterSearch],
  });

  // ONE prefix invalidation covers the paged roster, the aggregate roster and
  // the classes-list read (status pill + destination options) in one call —
  // all three query keys nest under `['ops','schools',schoolDocumentId,
  // 'classes', …]`. The class-DETAIL key sits under a different root
  // (`['ops','classes',classDocumentId]`, task 20's own, unchanged here) and
  // is invalidated separately: `student_count` on it changes with every
  // roster add/remove.
  const invalidateClassData = () => {
    void queryClient.invalidateQueries({ queryKey: ['ops', 'schools', schoolDocumentId, 'classes'] });
    void queryClient.invalidateQueries({ queryKey: opsClassDetailQueryKey(classDocumentId) });
  };

  function rosterOutcomeToast(summary: OpsActionSummary): void {
    const feedback = describeRunOutcome(summary, t('entityLabel'));
    const tone = feedback.tone === 'success' ? 'ok' : feedback.tone === 'warning' ? 'warn' : 'error';
    showOpsToast({
      tone,
      message: feedback.message,
      ...(feedback.needsReconciliation
        ? { action: { label: 'Refresh', run: () => window.location.reload() } }
        : feedback.action
          ? { action: feedback.action }
          : {}),
    });
  }

  const openMoveDialog = (rows: readonly OpsStudentRow[]) => {
    setDestinationClassDocumentId('');
    setMoveTargetRows(rows);
  };

  const moveRunner = useOpsActionRunner<MoveStudentClassTarget>(
    moveClassRosterAction(
      schoolDocumentId,
      classDocumentId,
      destinationClassDocumentId,
      moveTargetRows?.length ?? 1,
    ),
  );
  const removeRunner = useOpsActionRunner(removeFromClassAction(schoolDocumentId, classDocumentId));

  const runMoveConfirmed = async () => {
    if (moveTargetRows === null || destinationClassDocumentId === '') return;
    const targets: MoveStudentClassTarget[] = moveTargetRows.map((row) => ({
      kind: 'student',
      documentId: row.documentId,
      expectedClassDocumentId: row.class?.documentId ?? null,
    }));
    const summary = await moveRunner.run(targets);
    setMoveTargetRows(null);
    selection.clear();
    invalidateClassData();
    rosterOutcomeToast(summary);
  };

  const runRemoveConfirmed = async () => {
    if (removeConfirm === null) return;
    const summary = await removeRunner.run(removeConfirm.rows.map(studentTarget));
    setRemoveConfirm(null);
    selection.clear();
    invalidateClassData();
    rosterOutcomeToast(summary);
  };

  const rosterActionLabel = (action: ClassRosterAction): string =>
    action.key === 'removeFromClass' ? t(action.labelKey) : sharedT(action.labelKey);

  const runRosterAction = (key: ClassRosterActionKey, row: OpsStudentRow) => {
    if (key === 'viewProfile') {
      setProfileDocumentId(row.documentId);
      return;
    }
    if (key === 'moveClass') {
      openMoveDialog([row]);
      return;
    }
    setRemoveConfirm({ rows: [row], origin: 'row' });
  };

  const handleExport = () => {
    void downloadClassRoster(classDocumentId, query.data?.name ?? null).catch(() => {
      showOpsToast({ tone: 'error', message: t('errorDescription') });
    });
  };

  const bulkActions: OpsBulkBarAction[] = [
    ...classRosterBulkActions().map(
      (action): OpsBulkBarAction => ({
        id: action.key,
        label: rosterActionLabel(action),
        destructive: action.danger,
        disabled: action.write && writeGate.blockedReason() !== null,
        onSelect: () => {
          if (action.key === 'moveClass') {
            openMoveDialog(rosterRows.filter((row) => selection.isRowSelected(studentTarget(row))));
            return;
          }
          setRemoveConfirm({
            rows: rosterRows.filter((row) => selection.isRowSelected(studentTarget(row))),
            origin: 'bulk',
          });
        },
      }),
    ),
    {
      id: 'export',
      label: sharedT('bulkExport'),
      disabled: false,
      onSelect: handleExport,
    },
  ];

  if (query.isPending) {
    return (
      <main className="flex flex-1 flex-col gap-6 px-4 py-6 sm:px-6 lg:px-8">
        <Link href={`/dashboard/ops/schools/${schoolDocumentId}`} className="text-sm font-medium text-body underline-offset-4 hover:underline">
          {t('backToClasses')}
        </Link>
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
        <Link href={`/dashboard/ops/schools/${schoolDocumentId}`} className="text-sm font-medium text-body underline-offset-4 hover:underline">
          {t('backToClasses')}
        </Link>
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
        <Link href={`/dashboard/ops/schools/${schoolDocumentId}`} className="text-sm font-medium text-body underline-offset-4 hover:underline">
          {t('backToClasses')}
        </Link>
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
  const teacherInitial = classDetail.primary_teacher ? teacherName.charAt(0).toUpperCase() : null;

  const hasWindow = classDetail.test_window !== null;
  const averageLevel = hasWindow
    ? (classModalCefrLevel(aggregateRoster.data?.data ?? []) ?? t('notAvailable'))
    : t('notAvailable');
  const testsCompletedValue = hasWindow
    ? t('summaryTestsCompletedValue', {
        completed: classTestsCompletedCount(aggregateRoster.data?.data ?? []),
        enrolled: classDetail.student_count,
      })
    : t('notAvailable');

  return (
    <main
      data-slot="ops-class-detail"
      data-surface="ops-class-detail"
      className="flex flex-1 flex-col gap-6 px-4 py-6 sm:px-6 lg:px-8"
    >
      <div className="flex flex-col gap-2">
        {/* This screen's OWN back link (`Ops Portal.dc.html:424`) — task 04
            gates the dashboard crumb trail off `/dashboard/ops/**` (R-26), so
            this is the only way up on every state of this screen. */}
        <Link
          href={`/dashboard/ops/schools/${schoolDocumentId}`}
          className="w-fit text-sm font-medium text-body underline-offset-4 hover:underline"
        >
          {t('backToClasses')}
        </Link>
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

        <div className="flex flex-wrap items-center gap-4">
          <span
            aria-hidden="true"
            className="grid size-14 flex-none place-items-center rounded-2xl bg-foreground text-lg font-bold text-background"
          >
            {classHeaderBadge(classDetail.year_band, classDetail.name)}
          </span>
          <div className="flex min-w-0 flex-1 flex-col gap-1">
            <div className="flex flex-wrap items-center gap-3">
              <h1 className="text-2xl font-semibold text-foreground">{classDetail.name}</h1>
              {classStatus ? (
                <StatusPill tone={STATUS_TONE[classStatus]}>{classesTabT(`status.${classStatus}`)}</StatusPill>
              ) : null}
            </div>
            <div className="text-sm text-body">
              {noValueIfMissing(classDetail.year_band)}
              {' · '}
              {classDetail.test_window?.title ?? t('noWindowAssigned')}
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
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
          {/* Add students — task 26 owns the design's import MODAL scoped to
              this class (`After: 03`, still `todo`). Until it lands this is a
              real navigation to the school's own import panel rather than a
              control wired to nothing (OP-2). */}
          <Button
            size="sm"
            href={`/dashboard/ops/schools/${schoolDocumentId}`}
            className="shrink-0"
          >
            {t('addStudents')}
          </Button>
        </div>
      </div>

      <dl className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <SummaryCell label={t('summaryStudents')} value={String(classDetail.student_count)} />
        <SummaryCell label={t('summaryAverageLevel')} value={averageLevel} />
        <SummaryCell label={t('summaryTestsCompleted')} value={testsCompletedValue} />
        <SummaryCell label={t('summaryTeacher')} value={teacherName} initial={teacherInitial} />
      </dl>

      <section className="flex flex-col gap-3" aria-label={t('rosterTitle')}>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-col gap-1">
            <h2 className="text-lg font-semibold text-foreground">{t('rosterTitle')}</h2>
            {rosterMeta ? (
              <p data-slot="ops-class-roster-count" className="text-sm text-muted-foreground">
                {t('rosterLabel', { shown: rosterRows.length, total: rosterMeta.total })}
              </p>
            ) : null}
          </div>
          <div className="flex items-center gap-2">
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
            <Button type="button" size="sm" variant="outline" onClick={handleExport}>
              {t('exportCsv')}
            </Button>
            <Button size="sm" href={`/dashboard/ops/schools/${schoolDocumentId}`}>
              {sharedT('studentsImportCta')}
            </Button>
          </div>
        </div>

        {selection.count > 0 ? (
          <OpsBulkBar
            count={selection.count}
            atCap={selection.atCap}
            entityLabel={t('entityLabel')}
            actions={bulkActions}
            busy={moveRunner.state.status === 'running' || removeRunner.state.status === 'running'}
            onClear={selection.clear}
          />
        ) : null}

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
                  <TableHead className="w-10">
                    <Checkbox
                      aria-label={detailT('actions.menuLabel')}
                      checked={selection.headerState === 'all'}
                      indeterminate={selection.headerState === 'some'}
                      onCheckedChange={selection.toggleAllOnPage}
                    />
                  </TableHead>
                  <TableHead>{t('rosterName')}</TableHead>
                  <TableHead>{t('rosterYear')}</TableHead>
                  <TableHead>{t('rosterLanguage')}</TableHead>
                  <TableHead>{t('rosterLevel')}</TableHead>
                  <TableHead>{t('rosterStatus')}</TableHead>
                  <TableHead className="w-10" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {rosterRows.map((student) => (
                  <TableRow key={student.documentId}>
                    <TableCell>
                      <Checkbox
                        aria-label={studentFullName(student)}
                        checked={selection.isRowSelected(studentTarget(student))}
                        onCheckedChange={() => selection.toggleRow(studentTarget(student))}
                      />
                    </TableCell>
                    <TableCell className="font-medium text-foreground">
                      {noValueIfMissing(studentFullName(student))}
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
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger
                          render={<IconButton icon={MoreHorizontal} label={detailT('actions.menuLabel')} size="sm" />}
                        />
                        <DropdownMenuContent align="end">
                          {classRosterRowActions().map((action) => {
                            const blocked = action.write && writeGate.blockedReason() !== null;
                            return (
                              <DropdownMenuItem
                                key={action.key}
                                variant={action.danger ? 'destructive' : 'default'}
                                aria-disabled={blocked ? true : undefined}
                                className={blocked ? 'text-slate-400' : action.danger ? 'text-destructive' : ''}
                                onClick={() => {
                                  if (blocked) {
                                    showOpsToast({ tone: 'error', message: writeGate.blockedReason() ?? '' });
                                    return;
                                  }
                                  runRosterAction(action.key, student);
                                }}
                              >
                                {rosterActionLabel(action)}
                              </DropdownMenuItem>
                            );
                          })}
                        </DropdownMenuContent>
                      </DropdownMenu>
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

      <OpsStudentProfilePanel schoolDocumentId={schoolDocumentId} studentDocumentId={profileDocumentId} />

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

      <Dialog
        open={moveTargetRows !== null}
        onOpenChange={(open) => {
          if (!open && moveRunner.state.status !== 'running') setMoveTargetRows(null);
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{sharedT('studentsMoveClassTitle')}</DialogTitle>
            <DialogDescription>
              {sharedT('studentsMoveClassBody', { count: moveTargetRows?.length ?? 1 })}
            </DialogDescription>
          </DialogHeader>
          <SelectField
            id="ops-class-roster-move-destination"
            label={sharedT('studentsMoveClassDestinationLabel')}
            placeholder={sharedT('studentsMoveClassPlaceholder')}
            value={destinationClassDocumentId}
            onValueChange={setDestinationClassDocumentId}
            options={destinationOptions}
            disabled={moveRunner.state.status === 'running'}
          />
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              disabled={moveRunner.state.status === 'running'}
              onClick={() => setMoveTargetRows(null)}
            >
              {detailT('actions.cancel')}
            </Button>
            <Button
              type="button"
              loading={moveRunner.state.status === 'running'}
              disabled={destinationClassDocumentId === '' || writeGate.blockedReason() !== null}
              onClick={() => void runMoveConfirmed()}
            >
              {sharedT('studentsMoveClassCta', { count: moveTargetRows?.length ?? 1 })}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {removeConfirm === null ? null : (
        <OpsConfirmDialog
          open
          onOpenChange={(open) => {
            if (!open && removeRunner.state.status !== 'running') setRemoveConfirm(null);
          }}
          title={
            removeConfirm.origin === 'row'
              ? t('rosterRemoveConfirmTitleRow', {
                  name: studentFullName(removeConfirm.rows[0]),
                  className: classDetail.name ?? '',
                })
              : t('rosterRemoveConfirmTitleBulk', {
                  count: removeConfirm.rows.length,
                  className: classDetail.name ?? '',
                })
          }
          description={t('rosterRemoveConfirmBody')}
          confirmLabel={
            removeConfirm.origin === 'row'
              ? t('rosterActionRemove')
              : t('rosterRemoveConfirmCtaBulk', { count: removeConfirm.rows.length })
          }
          cancelLabel={detailT('actions.cancel')}
          tone="destructive"
          pending={removeRunner.state.status === 'running'}
          onConfirm={() => void runRemoveConfirmed()}
        />
      )}
    </main>
  );
}

function SummaryCell({ label, value, initial }: { label: string; value: string; initial?: string | null }) {
  return (
    <div className="flex min-w-0 flex-col gap-1 rounded-tile bg-surface-inset px-3.5 py-3">
      <dt className="text-meta font-semibold tracking-wide text-body uppercase">{label}</dt>
      <dd className="flex items-center gap-2 text-stat-sm font-bold break-words text-foreground">
        {initial ? (
          <span aria-hidden="true" className="grid size-8 flex-none place-items-center rounded-full bg-secondary text-sm font-semibold">
            {initial}
          </span>
        ) : null}
        {value}
      </dd>
    </div>
  );
}
