'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { useQueryClient } from '@tanstack/react-query';
import { MoreHorizontal } from 'lucide-react';
import type { OpsStudentRow } from '@schooltest/ops-contracts';

import { Link } from '@/i18n/navigation';
import { Table, TableBody, TableCell, TableRow } from '@/components/ui/table';
import { Checkbox } from '@/components/ui/checkbox';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Alert,
  Button,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  IconButton,
  Input,
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
import { OpsAssignTeacherDialog } from '@/modules/ops/components/OpsAssignTeacherDialog';
import { OpsConfirmDialog } from '@/modules/ops/components/OpsConfirmDialog';
import { OpsEditClassDialog } from '@/modules/ops/components/OpsEditClassDialog';
import { OpsStudentImportDialog } from '@/modules/ops/components/OpsStudentImportDialog';
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
import type { MoveStudentClassTarget } from '@/modules/ops/queries/use-student-actions.mutation';

import type { OpsClassDetailProps } from '@/modules/ops/types/components.types';

// Ops class inner page (task 015, extended by task 21). Reads ONE class with
// its roster, teacher and school through the ops-only class router, then
// renders the header, the summary card and the "Students in this class"
// roster. Styled pixel-exact against `Ops Portal.dc.html:421-529`.
/** The roster page size. The server caps pageSize at 200 and refuses more. */
const ROSTER_PAGE_SIZE = 25;
/** "Get everything" page size for the aggregate roster read (D-08) and the class-status/destination lookup — same pattern `windowsQuery` already uses on this page. */
const ALL_PAGE_SIZE = 200;

const STATUS_TONE: Record<ClassListStatus, StatusPillTone> = {
  active: 'success',
  pending_setup: 'warning',
  archived: 'neutral',
};

const STUDENT_STATUS_TONE: Record<string, StatusPillTone> = {
  active: 'success',
  enrolled: 'success',
  archived: 'neutral',
};

function studentTarget(row: OpsStudentRow): OpsActionTarget {
  return { kind: 'student', documentId: row.documentId };
}

function studentFullName(row: OpsStudentRow): string {
  return [row.given_name, row.family_name].filter(Boolean).join(' ');
}

function studentInitial(row: OpsStudentRow): string {
  return (row.given_name || row.family_name || '?').charAt(0).toUpperCase();
}

function studentDetail(row: OpsStudentRow): string {
  return [noValueIfMissing(row.year_level), noValueIfMissing(row.first_language)]
    .filter((part) => part !== '—')
    .join(' · ');
}

// No numeric "Level X" datum exists on the roster row — the strongest
// available is the latest official result's CEFR band, then the ACARA phase.
function studentLevel(row: OpsStudentRow): string {
  return row.latest_result?.cefr_level ?? row.acara_phase ?? '—';
}

function studentLastActivity(row: OpsStudentRow): string {
  const at = row.latest_result?.completed_at ?? null;
  return at === null ? '—' : new Date(at).toLocaleDateString();
}

interface RemoveConfirmState {
  rows: readonly OpsStudentRow[];
  origin: 'row' | 'bulk';
}

export function OpsClassDetail({ classDocumentId, schoolDocumentId }: OpsClassDetailProps) {
  const t = useTranslations('Ops.classDetail');
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
  // Task 22 — the design's Assign Teacher modal, replacing task 20's inline
  // NativeSelect. Mounted only while open, matching `editOpen` above.
  const [assignTeacherOpen, setAssignTeacherOpen] = useState(false);
  // task 26's import modal, entered from THIS class — the one caller that
  // pre-selects a class, per `OpsStudentImportDialogProps`.
  const [importOpen, setImportOpen] = useState(false);
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
  // The class-detail read (`opsClassDetailSchema`) carries no `archived_at` —
  // it cannot tell "archived" from "active"/"pending setup" on its own. The
  // classes list DOES (it is `classRowStatus`'s own input), and task 17's
  // `OpsClassesTab` already fetches it the same way for the same reason
  // (`fetchClassStatus`). Reused here, at the same pageSize-200 "get
  // everything" the pickers already use above, so this class's status pill
  // and its Move-class destination picker share ONE read.
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
      <main className="flex flex-1 flex-col gap-5 px-4 py-6 sm:px-6 lg:px-8">
        <Link
          href={`/dashboard/ops/schools/${schoolDocumentId}`}
          className="w-fit text-[13.5px] font-medium text-[#7C8698] hover:text-[#2563EB]"
        >
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
      <main className="flex flex-1 flex-col gap-5 px-4 py-6 sm:px-6 lg:px-8">
        <Link
          href={`/dashboard/ops/schools/${schoolDocumentId}`}
          className="w-fit text-[13.5px] font-medium text-[#7C8698] hover:text-[#2563EB]"
        >
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
      <main className="flex flex-1 flex-col gap-5 px-4 py-6 sm:px-6 lg:px-8">
        <Link
          href={`/dashboard/ops/schools/${schoolDocumentId}`}
          className="w-fit text-[13.5px] font-medium text-[#7C8698] hover:text-[#2563EB]"
        >
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
  // the Assign Teacher modal's own picker carries every teacher's email from
  // its own `useTeachersListQuery` read, which is where a long or duplicate
  // name gets disambiguated.
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
      className="flex flex-1 flex-col gap-5 px-4 py-6 sm:px-6 lg:px-8"
    >
      <Link
        href={`/dashboard/ops/schools/${schoolDocumentId}`}
        className="w-fit text-[13.5px] font-medium text-[#7C8698] hover:text-[#2563EB]"
      >
        {t('backToClasses')}
      </Link>

      <div className="flex flex-wrap items-center gap-[18px]">
        <span
          aria-hidden="true"
          className="grid size-14 flex-none place-items-center rounded-[16px] bg-[#0E2350] text-[17px] font-bold text-white"
        >
          {classHeaderBadge(classDetail.year_band, classDetail.name)}
        </span>
        <div className="min-w-[200px] flex-1">
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="text-2xl font-semibold tracking-[-0.015em] text-foreground">
              {classDetail.name}
            </h1>
            {classStatus ? (
              <StatusPill
                tone={STATUS_TONE[classStatus]}
                className="px-[13px] py-1.5 text-xs font-semibold"
              >
                {classesTabT(`status.${classStatus}`)}
              </StatusPill>
            ) : null}
          </div>
          <div className="mt-1 text-[13.5px] text-[#7C8698]">
            {noValueIfMissing(classDetail.year_band)}
            {' · '}
            {classDetail.test_window?.title ?? t('noWindowAssigned')}
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2.5">
          {/* The design's fixed "Assign teacher" pill (`Ops Portal.dc.html:435`).
              Greyed AND refused for `ops_support`: kept clickable so the refusal
              toast fires, matching the roster row-action pattern below. */}
          <Button
            type="button"
            variant="outline"
            data-slot="ops-class-assign-teacher"
            className={
              writeGate.blockedReason() !== null
                ? 'h-[42px] shrink-0 rounded-full px-[18px] text-[13.5px] font-semibold text-slate-400'
                : 'h-[42px] shrink-0 rounded-full px-[18px] text-[13.5px] font-semibold hover:border-[#0E2350]'
            }
            aria-disabled={writeGate.blockedReason() !== null ? true : undefined}
            onClick={() => {
              const blocked = writeGate.blockedReason();
              if (blocked !== null) {
                showOpsToast({ tone: 'error', message: blocked });
                return;
              }
              setAssignTeacherOpen(true);
            }}
          >
            {t('assign.trigger')}
          </Button>
          <Button
            type="button"
            variant="outline"
            className="h-[42px] shrink-0 rounded-full px-[18px] text-[13.5px] font-semibold hover:border-[#0E2350]"
            onClick={() => setEditOpen(true)}
          >
            {t('editClass')}
          </Button>
          {/* Add students — task 26's import modal, opened scoped to THIS
              class via `initialClassDocumentId`. */}
          <Button
            type="button"
            className="h-[42px] shrink-0 rounded-full px-5 text-[13.5px] font-semibold"
            onClick={() => setImportOpen(true)}
          >
            {t('addStudents')}
          </Button>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-y-5 rounded-[24px] bg-card px-[30px] py-6 shadow-[0_1px_2px_rgba(14,35,80,0.04)]">
        <dl className="flex w-full flex-wrap items-center gap-y-5">
          <div className="min-w-[150px] flex-1">
            <dt className="mb-1.5 text-xs text-[#9AA6B8]">{t('summaryStudents')}</dt>
            <dd className="text-2xl font-bold text-foreground">{classDetail.student_count}</dd>
          </div>
          <div className="mx-6 self-stretch bg-[#EEF1F6]" style={{ width: '1px' }} />
          <div className="min-w-[150px] flex-1">
            <dt className="mb-1.5 text-xs text-[#9AA6B8]">{t('summaryAverageLevel')}</dt>
            <dd className="text-2xl font-bold text-foreground">{averageLevel}</dd>
          </div>
          <div className="mx-6 self-stretch bg-[#EEF1F6]" style={{ width: '1px' }} />
          <div className="min-w-[150px] flex-1">
            <dt className="mb-1.5 text-xs text-[#9AA6B8]">{t('summaryTestsCompleted')}</dt>
            <dd className="text-2xl font-bold text-foreground">{testsCompletedValue}</dd>
          </div>
          <div className="mx-6 self-stretch bg-[#EEF1F6]" style={{ width: '1px' }} />
          <div className="flex min-w-[220px] flex-[2] items-center gap-3.5">
            {teacherInitial ? (
              <span
                aria-hidden="true"
                className="grid size-11 flex-none place-items-center rounded-full bg-[#EEF1F6] text-[15px] font-semibold text-foreground"
              >
                {teacherInitial}
              </span>
            ) : null}
            <div className="min-w-0">
              <div className="mb-[3px] text-xs text-[#9AA6B8]">{t('classTeacher')}</div>
              <div className="text-[15px] font-semibold text-foreground">{teacherName}</div>
            </div>
          </div>
        </dl>
      </div>

      <section
        aria-label={t('rosterTitle')}
        className="flex max-h-[calc(100vh-120px)] flex-col overflow-y-auto rounded-[24px] bg-card px-7 pb-2 pt-1.5 shadow-[0_1px_2px_rgba(14,35,80,0.04)]"
      >
        <div className="flex flex-wrap items-center justify-between gap-4 pb-2.5 pt-[22px]">
          <div>
            <h2 className="text-[17px] font-semibold text-foreground">{t('rosterTitle')}</h2>
            {rosterMeta ? (
              <p data-slot="ops-class-roster-count" className="mt-[5px] text-[13px] text-[#7C8698]">
                {t('rosterLabel', { shown: rosterRows.length, total: rosterMeta.total })}
              </p>
            ) : null}
          </div>
          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="outline"
              className="h-9 rounded-full px-4 text-[13px] font-semibold hover:border-[#0E2350]"
              onClick={handleExport}
            >
              {t('exportCsv')}
            </Button>
            <Button
              type="button"
              className="h-9 rounded-full px-[18px] text-[13px] font-semibold"
              onClick={() => setImportOpen(true)}
            >
              {sharedT('studentsImportCta')}
            </Button>
          </div>
        </div>

        {/* Deviation: the roster search is not in the design, but the roster
            endpoint's server-side `q` filter is load-bearing (C-OPS-PORTAL
            roster-list spec) — kept as a 40px pill under the header. */}
        <Input
          data-slot="ops-class-roster-search"
          type="search"
          value={rosterSearch}
          placeholder={t('rosterSearchPlaceholder')}
          aria-label={t('rosterSearchPlaceholder')}
          className="mb-2 h-10 w-full rounded-full sm:w-72"
          onChange={(event) => {
            // Page 1 on every new term: keeping the page would show an
            // empty table for a term that has results on page 1.
            setRosterSearch(event.target.value);
            setRosterPage(1);
          }}
        />

        <OpsBulkBar
          count={selection.count}
          atCap={selection.atCap}
          entityLabel={t('entityLabel')}
          actions={bulkActions}
          busy={moveRunner.state.status === 'running' || removeRunner.state.status === 'running'}
          onClear={selection.clear}
          selectAll={{
            checked: selection.headerState === 'all',
            indeterminate: selection.headerState === 'some',
            onCheckedChange: selection.toggleAllOnPage,
            ariaLabel: detailT('actions.menuLabel'),
          }}
          idleLabel={t('rosterCount', { count: rosterMeta?.total ?? rosterRows.length })}
        />

        {roster.isPending ? (
          <div data-slot="ops-class-roster-skeleton" aria-busy="true" className="flex flex-col">
            {[0, 1, 2, 3, 4].map((row) => (
              <div key={row} className="flex items-center gap-3 border-b border-[#F4F6FA] py-3">
                <Skeleton className="size-5 flex-none rounded-md" />
                <Skeleton className="size-[38px] flex-none rounded-full" />
                <div className="flex flex-1 flex-col gap-2">
                  <Skeleton className="h-3 w-2/5 rounded-md" />
                  <Skeleton className="h-2.5 w-[30%] rounded-md" />
                </div>
                <Skeleton className="h-[26px] w-24 flex-none rounded-full" />
              </div>
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
          // Two DIFFERENT facts. "This class has no students" is the design's
          // empty roster (`:519-522`); "no student matches that search" is a
          // filtered miss. Showing the first for the second would tell an
          // operator the class is empty when it is not.
          <div className="py-12 text-center">
            <div className="text-[15px] font-semibold text-foreground">
              {rosterSearch ? t('rosterNoMatchTitle') : t('emptyTitle')}
            </div>
            <div className="mt-[5px] text-[13.5px] text-[#7C8698]">
              {rosterSearch ? t('rosterNoMatchDescription') : t('emptyDescription')}
            </div>
          </div>
        ) : (
          <Table>
            <TableBody>
              {rosterRows.map((student) => (
                <TableRow
                  key={student.documentId}
                  className="flex flex-wrap items-center gap-x-3 gap-y-2.5 rounded-[10px] border-[#EEF1F6] px-2.5 py-[15px] hover:bg-[#F8FAFC]"
                >
                  <TableCell className="flex-none border-0 p-0 align-middle">
                    <Checkbox
                      aria-label={studentFullName(student)}
                      className="size-5 rounded-md"
                      checked={selection.isRowSelected(studentTarget(student))}
                      onCheckedChange={() => selection.toggleRow(studentTarget(student))}
                    />
                  </TableCell>
                  {/* 1024px fit: the old basis triple (220/90/120) needed ~750px,
                      so at the design's 1024 breakpoint the status pill and the
                      ⋯ menu wrapped onto a second line. The name keeps the
                      widest basis and the two numeric columns shrink further. */}
                  <TableCell className="flex min-w-0 flex-[3_1_170px] items-center gap-3 border-0 p-0 align-middle">
                    <span
                      aria-hidden="true"
                      className="grid size-[38px] flex-none place-items-center rounded-full bg-[#EEF1F6] text-[13.5px] font-semibold text-foreground"
                    >
                      {studentInitial(student)}
                    </span>
                    <div className="min-w-0">
                      <div className="text-[14.5px] font-semibold text-foreground">
                        {noValueIfMissing(studentFullName(student))}
                      </div>
                      <div className="mt-0.5 truncate text-[12.5px] text-[#7C8698]">
                        {studentDetail(student)}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="min-w-0 flex-[1_1_80px] truncate border-0 p-0 align-middle text-[13px] text-[#3D4A5C]">
                    {studentLevel(student)}
                  </TableCell>
                  <TableCell className="min-w-0 flex-[1_1_100px] truncate border-0 p-0 align-middle text-[12.5px] text-[#9AA6B8]">
                    {studentLastActivity(student)}
                  </TableCell>
                  <TableCell className="flex-none border-0 p-0 align-middle">
                    {student.status ? (
                      <StatusPill
                        tone={STUDENT_STATUS_TONE[student.status] ?? 'neutral'}
                        className="w-24 justify-center px-[13px] py-1.5 text-xs font-semibold"
                      >
                        {student.status}
                      </StatusPill>
                    ) : (
                      noValueIfMissing(student.status)
                    )}
                  </TableCell>
                  <TableCell className="flex-none border-0 p-0 align-middle">
                    <DropdownMenu>
                      <DropdownMenuTrigger
                        render={
                          <IconButton
                            icon={MoreHorizontal}
                            label={detailT('actions.menuLabel')}
                            className="size-9 rounded-full text-[#3D4A5C] hover:bg-[#EEF1F6]"
                          />
                        }
                      />
                      <DropdownMenuContent
                        align="end"
                        className="w-[220px] rounded-2xl border-[#EEF1F6] p-1.5 shadow-[0_16px_40px_rgba(14,35,80,0.18)]"
                      >
                        {classRosterRowActions().map((action) => {
                          const blocked = action.write && writeGate.blockedReason() !== null;
                          return (
                            <DropdownMenuItem
                              key={action.key}
                              variant={action.danger ? 'destructive' : 'default'}
                              aria-disabled={blocked ? true : undefined}
                              className={
                                blocked
                                  ? 'rounded-[10px] px-3 py-2.5 text-[13.5px] font-medium text-slate-400'
                                  : 'rounded-[10px] px-3 py-2.5 text-[13.5px] font-medium'
                              }
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
        )}

        {rosterMeta && rosterMeta.pageCount > 1 ? (
          <div
            data-slot="ops-class-roster-pagination"
            className="flex items-center justify-between gap-3 py-2 pt-4"
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

      <OpsStudentImportDialog
        schoolDocumentId={schoolDocumentId}
        open={importOpen}
        onOpenChange={setImportOpen}
        initialClassDocumentId={classDocumentId}
      />

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

      {assignTeacherOpen ? (
        <OpsAssignTeacherDialog
          schoolDocumentId={schoolDocumentId}
          classDocumentId={classDetail.documentId}
          className={classDetail.name ?? ''}
          currentTeacherDocumentId={classDetail.primary_teacher?.documentId ?? null}
          onClose={() => setAssignTeacherOpen(false)}
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
