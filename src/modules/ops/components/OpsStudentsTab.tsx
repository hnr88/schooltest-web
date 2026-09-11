'use client';

import { useMemo, useState } from 'react';
import { Plus } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useQueryClient } from '@tanstack/react-query';
import {
  OPS_STUDENT_STATUSES,
  type OpsStudentRow,
  type OpsStudentsListQuery,
} from '@schooltest/ops-contracts';

import {
  Button,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  SelectField,
} from '@/modules/design-system';
import {
  describeRunOutcome,
  showOpsToast,
  useOpsActionRunner,
  useOpsWriteGate,
  type OpsActionSummary,
  type OpsActionTarget,
} from '@/modules/ops/actions';
import {
  useOpsDirectoryState,
  type DirectoryBulkAction,
  type DirectoryFilterDef,
  type DirectoryRowAction,
} from '@/modules/ops/directory';
import { OpsConfirmDialog } from '@/modules/ops/components/OpsConfirmDialog';
import { OpsStudentImportDialog } from '@/modules/ops/components/OpsStudentImportDialog';
import { OpsStudentProfilePanel } from '@/modules/ops/components/OpsStudentProfilePanel';
import { OpsStudentsTable } from '@/modules/ops/components/OpsStudentsTable';
import {
  DEACTIVATE_ACTION,
  MOVE_CLASS_ACTION,
  REACTIVATE_ACTION,
  studentRowActions,
  type StudentActionKey,
} from '@/modules/ops/lib/student-actions';
import {
  OPS_STUDENT_YEAR_LEVELS,
  opsStudentClassOptions,
  opsStudentDestinationClassOptions,
  opsStudentFullName,
  opsStudentStatusFilterValue,
  opsStudentStatusLabelKey,
} from '@/modules/ops/lib/ops-students-list.helpers';
import {
  deactivateStudentAction,
  moveStudentClassAction,
  reactivateStudentAction,
  type MoveStudentClassTarget,
} from '@/modules/ops/queries/use-student-actions.mutation';
import { useClassesListQuery } from '@/modules/ops/queries/use-classes-list.query';
import { useTeachersListQuery } from '@/modules/ops/queries/use-teachers-list.query';
import { useStudentsListQuery } from '@/modules/ops/queries/use-students-list.query';

import type { OpsStudentsTabProps } from '@/modules/ops/types/students-list.types';

interface LifecycleConfirmState {
  key: Extract<StudentActionKey, 'deactivate' | 'reactivate'>;
  row: OpsStudentRow;
}

/**
 * `OpsBulkBar`'s consumers all reach for `outcomeToast` (task 03's one-sentence
 * run summary), which is not part of the actions barrel's public surface yet
 * (`actions/index.ts` is out of this task's Touches). Composed here from the
 * two pieces that ARE exported — same tone mapping, same Refresh action.
 */
function studentOutcomeToast(summary: OpsActionSummary): void {
  const feedback = describeRunOutcome(summary, 'student');
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

/**
 * C-OPS-PORTAL-035 (OPS-045) — the ops Students tab, on the task-04 directory
 * kit (the spec's "OpsStudentsFilters collapses into the kit"): the kit owns
 * the URL <-> state sync, the empty/error states and the pager, while every
 * filter here maps to a REAL server filter — status, year (7..12) and class —
 * so the count under the table always describes the whole filtered scope.
 * The endpoint declares no sort parameter, so the kit gets an empty sort list.
 *
 * ops/18 — the design's chips, row menu (View profile / Move class /
 * Deactivate|Reactivate) and bulk bar (Move class / Deactivate), `:1352-1376`,
 * `:1439`, `:1465-1492`. Move class and Deactivate/Reactivate run through the
 * SAME action-kit runner every write goes through (task 03). The design's
 * bulk/header Export is NOT wired: there is no school-scoped students CSV
 * endpoint (checked exhaustively — the only students CSVs in the API are the
 * import template and the import error report, neither of which return a
 * student roster), and the row schema carries `given_name`/`family_name`
 * with no `student_key` to de-identify with, so a client-built CSV would ship
 * PII the task's own contract note forbids. Removed rather than stubbed
 * (orchestrator ruling, 2026-09-10) — a real students export is future work
 * for whichever task adds the endpoint.
 */
export function OpsStudentsTab({ schoolDocumentId }: OpsStudentsTabProps) {
  const t = useTranslations('Ops.schoolTables');
  const queryClient = useQueryClient();
  const writeGate = useOpsWriteGate();
  // ops/28 (D-53) — this file has no `refuseIf…` helper of its own (its
  // writes refuse at the runner's dispatch, inside the confirm flow); `locked`
  // is read directly off the gate for the row/bulk `disabled` below.
  // `readOnly` ALONE, never `blockedReason() !== null` (which also trips
  // offline) — offline must keep its clickable toast-with-Retry path, never
  // go natively inert. The move-dialog's confirm Button below (~:381) reads
  // `readOnly` for the same reason: it is a plain Dialog button rather than a
  // DirectoryRowAction/DirectoryBulkAction, but the offline hazard is
  // identical — gating it on `blockedReason()` would leave an operator whose
  // connection dropped with a dead confirm and no Retry.
  const locked = writeGate.readOnly;
  const teachers = useTeachersListQuery(schoolDocumentId, { page: 1, pageSize: 200 }, true);
  const classOptions = opsStudentClassOptions(teachers.data?.data ?? []);
  const [profileDocumentId, setProfileDocumentId] = useState<string | null>(null);
  const [lifecycleConfirm, setLifecycleConfirm] = useState<LifecycleConfirmState | null>(null);
  const [moveTargetRows, setMoveTargetRows] = useState<readonly OpsStudentRow[] | null>(null);
  const [destinationClassDocumentId, setDestinationClassDocumentId] = useState('');
  // ops/26 — the tab is school-wide, never scoped to one class, so the dialog
  // opens with no class pre-selected (task 21 supplies that from the class page).
  const [importOpen, setImportOpen] = useState(false);

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

  // Preserve ?tab= — without it any filter/page change rewrites the URL and
  // the detail page flips back to the Overview tab.
  const state = useOpsDirectoryState({ filters, sorts: [], defaultSort: '', preserveParams: ['tab'] });

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
  const total = students.data?.meta.pagination.total ?? 0;

  const destinationClasses = useClassesListQuery(
    schoolDocumentId,
    { pageSize: 200 },
    moveTargetRows !== null,
  );
  const destinationOptions = opsStudentDestinationClassOptions(destinationClasses.data?.data ?? []);

  const invalidateStudents = () => {
    void queryClient.invalidateQueries({ queryKey: ['ops', 'schools', schoolDocumentId, 'students'] });
  };

  const openMoveDialog = (rows: readonly OpsStudentRow[]) => {
    setDestinationClassDocumentId('');
    setMoveTargetRows(rows);
  };

  const deactivateRunner = useOpsActionRunner(deactivateStudentAction(schoolDocumentId));
  const reactivateRunner = useOpsActionRunner(reactivateStudentAction(schoolDocumentId));
  const moveRunner = useOpsActionRunner(
    moveStudentClassAction(schoolDocumentId, destinationClassDocumentId),
  );

  const runLifecycleConfirmed = async () => {
    if (lifecycleConfirm === null) return;
    const runner = lifecycleConfirm.key === 'deactivate' ? deactivateRunner : reactivateRunner;
    const target: OpsActionTarget = { kind: 'student', documentId: lifecycleConfirm.row.documentId };
    const summary = await runner.run([target]);
    setLifecycleConfirm(null);
    invalidateStudents();
    studentOutcomeToast(summary);
  };

  const runMoveConfirmed = async () => {
    if (moveTargetRows === null || destinationClassDocumentId === '') return;
    const targets: MoveStudentClassTarget[] = moveTargetRows.map((row) => ({
      kind: 'student',
      documentId: row.documentId,
      expectedClassDocumentId: row.class?.documentId ?? null,
    }));
    const summary = await moveRunner.run(targets);
    setMoveTargetRows(null);
    invalidateStudents();
    studentOutcomeToast(summary);
  };

  const rowActions = (row: OpsStudentRow): readonly DirectoryRowAction<OpsStudentRow>[] =>
    studentRowActions(row.status).map((action) => ({
      label: t(action.labelKey),
      write: action.write,
      destructive: action.danger,
      disabled: action.write && locked,
      onSelect: () => {
        if (action.key === 'viewProfile') {
          setProfileDocumentId(row.documentId);
          return;
        }
        if (action.key === 'moveClass') {
          openMoveDialog([row]);
          return;
        }
        setLifecycleConfirm({ key: action.key as 'deactivate' | 'reactivate', row });
      },
    }));

  const bulkActions: readonly DirectoryBulkAction[] = [
    {
      label: t(MOVE_CLASS_ACTION.labelKey),
      write: true,
      disabled: locked,
      onRun: (rows) => openMoveDialog(rows as readonly OpsStudentRow[]),
    },
    {
      label: t('studentsBulkDeactivate'),
      write: true,
      destructive: true,
      disabled: locked,
      eligible: (row) => (row as OpsStudentRow).status !== 'archived',
      skipLabel: (count) => t('studentsBulkDeactivateSkip', { count }),
      onRun: (_rows, targets) => {
        void deactivateRunner.run(targets).then((summary) => {
          invalidateStudents();
          studentOutcomeToast(summary);
        });
      },
    },
  ];

  // ops-tabs-audit — the card header (`:352-368`): the tab's Import-students
  // primary as the header's right-hand action. The design's Export secondary
  // is deliberately NOT drawn next to it: there is no school-scoped students
  // CSV endpoint (the only students CSVs are the import template and the
  // import error report) and the row schema carries `given_name`/`family_name`
  // with no de-identifying `student_key`, so a client-built CSV is forbidden
  // by the contract note — a dead button would violate OP-2. Revisit when a
  // students export endpoint lands.
  const header = {
    title: t('tab.students'),
    summary: t('studentsHeaderSummary', { count: total }),
    primary: (
      <Button
        type="button"
        variant="navy"
        onClick={() => setImportOpen(true)}
        className="h-10 rounded-[12px] px-[18px] text-[13.5px] font-semibold"
      >
        <Plus className="size-3.5" strokeWidth={2.2} aria-hidden="true" />
        {t('studentsImportCta')}
      </Button>
    ),
  };

  const confirmAction =
    lifecycleConfirm === null ? null : lifecycleConfirm.key === 'deactivate' ? DEACTIVATE_ACTION : REACTIVATE_ACTION;
  const lifecycleRunning =
    deactivateRunner.state.status === 'running' || reactivateRunner.state.status === 'running';

  return (
    <div className="flex flex-col gap-4">
      <OpsStudentsTable
        state={state}
        filters={filters}
        chipFilterKey="status"
        header={header}
        rows={students.data?.data ?? []}
        meta={students.data?.meta.pagination}
        query={students}
        bulkActions={bulkActions}
        scope={[
          schoolDocumentId,
          state.params.page,
          state.params.q,
          state.params.filters.status,
          state.params.filters.class,
          state.params.filters.year_level,
        ]}
        rowActions={rowActions}
        onRowSelect={(row) => setProfileDocumentId(row.documentId)}
        // filters-audit 2026-09-11: the design's pill toolbar arrangement
        // (hidden labels, count right) like every other ops tab.
        toolbarVariant="pill"
      />
      <OpsStudentProfilePanel
        schoolDocumentId={schoolDocumentId}
        studentDocumentId={profileDocumentId}
      />

      {/* ops/26 — the design's IMPORT STUDENTS MODAL (`:745-817`), opened from
          this tab's primary button. No class is in scope here, so it opens
          with none pre-selected. */}
      <OpsStudentImportDialog
        schoolDocumentId={schoolDocumentId}
        open={importOpen}
        onOpenChange={setImportOpen}
      />

      {lifecycleConfirm === null || confirmAction === null || confirmAction.confirm === null ? null : (
        <OpsConfirmDialog
          open
          onOpenChange={(open) => {
            if (!open && !lifecycleRunning) setLifecycleConfirm(null);
          }}
          title={t(confirmAction.confirm.titleKey, { name: opsStudentFullName(lifecycleConfirm.row) })}
          description={t(confirmAction.confirm.bodyKey)}
          confirmLabel={t(confirmAction.confirm.ctaKey)}
          cancelLabel={t('makeOwnerCancel')}
          tone={confirmAction.danger ? 'destructive' : 'neutral'}
          pending={lifecycleRunning}
          onConfirm={() => void runLifecycleConfirmed()}
        />
      )}

      <Dialog
        open={moveTargetRows !== null}
        onOpenChange={(open) => {
          if (!open && moveRunner.state.status !== 'running') setMoveTargetRows(null);
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t('studentsMoveClassTitle')}</DialogTitle>
            <DialogDescription>
              {t('studentsMoveClassBody', { count: moveTargetRows?.length ?? 1 })}
            </DialogDescription>
          </DialogHeader>
          <SelectField
            id="ops-students-move-class-destination"
            label={t('studentsMoveClassDestinationLabel')}
            placeholder={t('studentsMoveClassPlaceholder')}
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
              {t('makeOwnerCancel')}
            </Button>
            <Button
              type="button"
              loading={moveRunner.state.status === 'running'}
              disabled={destinationClassDocumentId === '' || writeGate.readOnly}
              onClick={() => void runMoveConfirmed()}
            >
              {t('studentsMoveClassCta', { count: moveTargetRows?.length ?? 1 })}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
