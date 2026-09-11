'use client';

import { useCallback, useMemo, useRef, useState } from 'react';
import { useTranslations } from 'next-intl';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { useQueryClient } from '@tanstack/react-query';

import { strapi } from '@/lib/axios/strapi';
import { Plus } from 'lucide-react';
import {
  Alert,
  Button,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  FieldShell,
  Input,
  NativeSelect,
  NativeSelectOption,
  StatusPill,
} from '@/modules/design-system';
import type { StatusPillTone } from '@/modules/design-system/types/data-display.types';
import { OpsTabTableCard, OPS_TAB_STATUS_PILL_CLASS } from '@/modules/ops/components/OpsTabTableCard';
import {
  DIRECTORY_ALL,
  DirectoryTable,
  useDirectoryState,
} from '@/modules/directory';
import type {
  DirectoryBulkAction,
  DirectoryColumnDef,
  DirectoryFilterDef,
  DirectoryLabels,
  DirectoryRowAction,
} from '@/modules/directory';
import {
  describeRunOutcome,
  showOpsToast,
  useOpsActionRunner,
  useOpsWriteGate,
} from '@/modules/ops/actions';
import type { OpsActionDefinition, OpsActionTarget } from '@/modules/ops/actions';
import { OpsAssignTeacherDialog } from '@/modules/ops/components/OpsAssignTeacherDialog';
import { OpsConfirmDialog } from '@/modules/ops/components/OpsConfirmDialog';
import { OpsEditClassDialog } from '@/modules/ops/components/OpsEditClassDialog';
import { YEAR_BANDS, isYearBand } from '@/modules/classes/constants/year-bands.constants';
import { classBulkActions, classRowActions } from '@/modules/ops/lib/class-actions';
import { noValueIfMissing, opsTeacherLabel } from '@/modules/ops/lib/ops-class-detail.helpers';
import {
  classListStatusSchema,
  classRowStatus,
  classesListPath,
  classesListQueryParams,
  classesListResponseSchema,
  type ClassListStatus,
  type ClassRow,
  type ClassesListQuery,
} from '@/modules/ops/lib/ops-classes-contract';
import { useAssessmentWindowCreateMutation } from '@/modules/ops/queries/use-assessment-window-create.mutation';
import { useClassesListQuery } from '@/modules/ops/queries/use-classes-list.query';
import { useFormsQuery } from '@/modules/ops/queries/use-forms.query';

// OPS-038 — the Classes tab of the ops school detail (C-OPS-PORTAL-028), on
// task 02's directory kit + task 03's action kit. It reads the real list
// operation, so an UNASSIGNED class appears: the old tab derived its rows
// from the staff directory and could only ever show classes that already had
// a teacher. The ?teacher= deep-link from the staff directory narrows the
// list to one teacher's classes and can be cleared without losing the other
// filters — `teacher` is not a kit filter (it has no visible control), so it
// is read straight off the URL and folded into the query by hand.
//
// header scope, updated 2026-09-10: the design draws an Export CSV secondary
// and a Create class primary. The Create primary is now REAL — task 23 added
// `classCreateBodySchema` and curl-proved `POST .../classes` -> 201 — so it is
// wired below to task 23's dialog in create mode. Export CSV is still NOT
// wired: no classes-list CSV route exists anywhere in the backlog (only the
// per-class roster export, task 21), and OP-2 forbids wiring a control to a
// stub. See decisions.md#d-53.

const STATUS_TONE: Record<ClassListStatus, StatusPillTone> = {
  active: 'success',
  pending_setup: 'warning',
  archived: 'neutral',
};

/**
 * The design's badge tile carries the YEAR NUMBER (`:1325`: `initial:
 * c.year.replace('Year ', '')`). This platform's classes carry a BAND
 * (`7_9`/`10_12`), so the tile shows the short range; a class with no band
 * falls back to the class name's leading token, then the no-value dash.
 */
const YEAR_BADGE: Record<string, string> = { '7_9': '7–9', '10_12': '10–12' };
function classBadgeLabel(row: ClassRow): string {
  if (row.year_band !== null && isYearBand(row.year_band)) return YEAR_BADGE[row.year_band];
  const name = (row.name ?? '').trim();
  return name === '' ? '—' : (name.split(/\s+/)[0] ?? '—');
}

async function fetchClassStatus(
  schoolDocumentId: string,
  classDocumentId: string,
): Promise<ClassListStatus | null> {
  const res = await strapi.get<unknown>(classesListPath(schoolDocumentId), {
    params: classesListQueryParams({ page: 1, pageSize: 200 }),
    opsPortalVersioned: true,
  });
  const parsed = classesListResponseSchema.parse(res.data);
  const row = parsed.data.find((candidate) => candidate.documentId === classDocumentId);
  return row ? classRowStatus(row) : null;
}

interface ClassLifecycleTarget extends OpsActionTarget {
  lifecycleAction: 'archive' | 'restore';
}

export function OpsClassesTab({ schoolDocumentId }: { schoolDocumentId: string }) {
  const t = useTranslations('Ops.classesTab');
  const tActions = useTranslations('Ops.classActions');
  const tCreate = useTranslations('Ops.classDetail.create');
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const router = useRouter();
  const queryClient = useQueryClient();

  const teacherParam = searchParams.get('teacher');
  const teacherId = teacherParam?.trim() ?? '';

  const clearTeacher = useCallback(() => {
    const query = new URLSearchParams(searchParams.toString());
    query.delete('teacher');
    router.replace(query.size === 0 ? pathname : `${pathname}?${query}`, { scroll: false });
  }, [pathname, router, searchParams]);

  const filters = useMemo<DirectoryFilterDef[]>(
    () => [
      {
        key: 'status',
        label: t('filterStatus'),
        kind: 'chips',
        options: [
          { value: DIRECTORY_ALL, label: t('filterAll') },
          ...classListStatusSchema.options.map((value) => ({ value, label: t(`status.${value}`) })),
        ],
      },
      {
        key: 'year_band',
        label: t('filterYear'),
        options: [
          { value: DIRECTORY_ALL, label: t('filterAll') },
          ...YEAR_BANDS.map((value) => ({ value, label: t(`year.${value}`) })),
        ],
      },
    ],
    [t],
  );

  const state = useDirectoryState({ filters, sorts: [], defaultSort: '', preserveParams: ['teacher', 'tab'] });

  const query = useMemo<ClassesListQuery>(
    () => ({
      page: state.params.page,
      pageSize: state.params.pageSize,
      ...(state.params.q ? { q: state.params.q } : {}),
      ...(state.params.filters.status
        ? { status: state.params.filters.status as ClassListStatus }
        : {}),
      ...(state.params.filters.year_band ? { year_band: state.params.filters.year_band } : {}),
      ...(teacherId === '' ? {} : { teacher: teacherId }),
    }),
    [state.params, teacherId],
  );

  const classes = useClassesListQuery(schoolDocumentId, query, true);
  const rows = classes.data?.data ?? [];

  const invalidateClasses = useCallback(() => {
    void queryClient.invalidateQueries({ queryKey: ['ops', 'schools', schoolDocumentId] });
  }, [queryClient, schoolDocumentId]);

  const writeGate = useOpsWriteGate();
  const refuseIfReadOnly = useCallback((): boolean => {
    const reason = writeGate.blockedReason();
    if (reason === null) return true;
    showOpsToast({ tone: 'error', message: reason });
    return false;
  }, [writeGate]);
  // ops/28 (D-53) — `refuseIfReadOnly` above returns true when NOT blocked
  // (opposite of OpsStaffUsersTable's `refuseIfBlocked`); `locked` names the
  // write-gate state directly so `disabled: action.write && locked` reads the
  // same everywhere in this file, independent of that helper's own polarity.
  // `readOnly` ALONE, never `blockedReason() !== null` (which also trips
  // offline) — offline must keep its clickable toast-with-Retry path, never
  // go natively inert.
  const locked = writeGate.readOnly;

  const toastTone = (tone: 'success' | 'warning' | 'error'): 'ok' | 'warn' | 'error' =>
    tone === 'success' ? 'ok' : tone === 'warning' ? 'warn' : 'error';

  const lifecycleDefinition = useMemo<OpsActionDefinition<ClassLifecycleTarget>>(
    () => ({
      write: true,
      async perform(target) {
        await strapi.post(
          `/api/ops/schools/${schoolDocumentId}/classes/${target.documentId}/${target.lifecycleAction}`,
          {},
        );
      },
      async readBack(target) {
        const status = await fetchClassStatus(schoolDocumentId, target.documentId);
        return target.lifecycleAction === 'archive'
          ? status === 'archived'
          : status !== null && status !== 'archived';
      },
      async isEligible(target) {
        const status = await fetchClassStatus(schoolDocumentId, target.documentId);
        return target.lifecycleAction === 'archive' ? status !== 'archived' : status === 'archived';
      },
    }),
    [schoolDocumentId],
  );
  const lifecycleRunner = useOpsActionRunner(lifecycleDefinition);

  const [singleLifecycle, setSingleLifecycle] = useState<{
    row: ClassRow;
    action: 'archive' | 'restore';
  } | null>(null);
  const [bulkArchiveTargets, setBulkArchiveTargets] = useState<readonly OpsActionTarget[] | null>(
    null,
  );
  const [reassignRow, setReassignRow] = useState<ClassRow | null>(null);
  const [editRow, setEditRow] = useState<ClassRow | null>(null);
  const [createOpen, setCreateOpen] = useState(false);
  const [setWindowTargets, setSetWindowTargets] = useState<readonly OpsActionTarget[] | null>(null);

  const runSingleLifecycle = useCallback(async () => {
    if (singleLifecycle === null) return;
    const { row, action } = singleLifecycle;
    const summary = await lifecycleRunner.run([
      { kind: 'class', documentId: row.documentId, lifecycleAction: action },
    ]);
    setSingleLifecycle(null);
    invalidateClasses();
    const feedback = describeRunOutcome(summary, tActions('entityLabel'));
    showOpsToast({ tone: toastTone(feedback.tone), message: feedback.message });
  }, [singleLifecycle, lifecycleRunner, invalidateClasses, tActions]);

  const runBulkArchive = useCallback(async () => {
    if (bulkArchiveTargets === null) return;
    const targets: ClassLifecycleTarget[] = bulkArchiveTargets.map((target) => ({
      ...target,
      lifecycleAction: 'archive',
    }));
    const summary = await lifecycleRunner.run(targets);
    setBulkArchiveTargets(null);
    invalidateClasses();
    const feedback = describeRunOutcome(summary, tActions('entityLabel'));
    showOpsToast({ tone: toastTone(feedback.tone), message: feedback.message });
  }, [bulkArchiveTargets, lifecycleRunner, invalidateClasses, tActions]);

  const rowActionsFor = useCallback(
    (row: ClassRow): DirectoryRowAction<ClassRow>[] => {
      const status = classRowStatus(row);
      return classRowActions(status).map((action) => {
        if (action.key === 'open') {
          return {
            label: tActions(action.labelKey),
            write: action.write,
            disabled: action.write && locked,
            onSelect: () =>
              router.push(`/dashboard/ops/schools/${schoolDocumentId}/classes/${row.documentId}`),
          };
        }
        if (action.key === 'reassignTeacher') {
          return {
            label: tActions(action.labelKey),
            write: action.write,
            disabled: action.write && locked,
            onSelect: () => {
              if (refuseIfReadOnly()) setReassignRow(row);
            },
          };
        }
        if (action.key === 'edit') {
          return {
            label: tActions(action.labelKey),
            write: action.write,
            disabled: action.write && locked,
            onSelect: () => {
              if (refuseIfReadOnly()) setEditRow(row);
            },
          };
        }
        const lifecycleAction: 'archive' | 'restore' = action.key === 'restore' ? 'restore' : 'archive';
        return {
          label: tActions(action.labelKey),
          write: action.write,
          destructive: action.danger,
          disabled: action.write && locked,
          onSelect: () => {
            if (refuseIfReadOnly()) setSingleLifecycle({ row, action: lifecycleAction });
          },
        };
      });
    },
    [tActions, router, schoolDocumentId, refuseIfReadOnly, locked],
  );

  const bulkActionDefs = useMemo<DirectoryBulkAction[]>(
    () =>
      classBulkActions().map((action) => {
        if (action.key === 'setTestWindow') {
          return {
            label: tActions(action.labelKey),
            write: action.write,
            disabled: action.write && locked,
            onRun: (_rows: readonly unknown[], targets: readonly OpsActionTarget[]) => {
              if (refuseIfReadOnly()) setSetWindowTargets(targets);
            },
          };
        }
        return {
          label: tActions(action.labelKey),
          write: action.write,
          destructive: action.danger,
          disabled: action.write && locked,
          eligible: (row: unknown) => classRowStatus(row as ClassRow) !== 'archived',
          skipLabel: (skipped: number) => tActions('bulk.archiveSkip', { skipped }),
          onRun: (_rows: readonly unknown[], targets: readonly OpsActionTarget[]) => {
            if (refuseIfReadOnly()) setBulkArchiveTargets(targets);
          },
        };
      }),
    [tActions, refuseIfReadOnly, locked],
  );

  const columns = useMemo<DirectoryColumnDef<ClassRow>[]>(
    () => [
      {
        key: 'name',
        header: t('columnClass'),
        // ops-tabs-audit — the design's class identity block (`:386-393`): a
        // 40px radius-12 badge tile (the year number), then the 14.5/600 name
        // with the test-window sub under it.
        cell: (row) => (
          <div className="flex items-center gap-3">
            <span
              aria-hidden="true"
              className="grid size-10 flex-none place-items-center rounded-[12px] bg-[#EEF1F6] text-[12.5px] font-bold text-[#0E2350]"
            >
              {classBadgeLabel(row)}
            </span>
            <div className="flex min-w-0 flex-col">
              <span className="truncate text-[14.5px] font-semibold text-foreground">
                {noValueIfMissing(row.name)}
              </span>
              <span className="mt-0.5 block truncate text-[12.5px] text-[#7C8698]">
                {row.test_window === null ? t('noWindow') : row.test_window.title}
              </span>
            </div>
          </div>
        ),
      },
      {
        key: 'teacher',
        header: t('columnTeacher'),
        grid: 'text',
        cell: (row) =>
          row.primary_teacher === null
            ? t('noTeacher')
            : opsTeacherLabel({ ...row.primary_teacher, email: null }),
      },
      {
        key: 'students',
        header: t('columnStudents'),
        grid: 'text',
        cell: (row) => <span data-testid="ops-classes-students">{String(row.student_count)}</span>,
      },
      {
        key: 'year',
        header: t('columnYear'),
        grid: 'text',
        // The design's last text column is the muted one (`:404`); a known
        // band reads through the catalogue ("Years 7–9"), never as the raw
        // `7_9` wire code.
        cell: (row) => (
          <span className="text-[12.5px] text-[#9AA6B8]">
            {row.year_band === null
              ? noValueIfMissing(null)
              : isYearBand(row.year_band)
                ? t(`year.${row.year_band}`)
                : noValueIfMissing(row.year_band)}
          </span>
        ),
      },
      {
        key: 'status',
        header: t('columnStatus'),
        grid: 'bare',
        // ops-tabs-audit — the design's 96px soft-tone pill (`:406`), fixed
        // width, title case.
        cell: (row) => {
          const status = classRowStatus(row);
          return (
            <StatusPill tone={STATUS_TONE[status]} className={OPS_TAB_STATUS_PILL_CLASS}>
              {t(`status.${status}`)}
            </StatusPill>
          );
        },
      },
    ],
    [t],
  );

  const labels = useMemo<Partial<DirectoryLabels>>(
    () => ({
      searchPlaceholder: t('searchPlaceholder'),
      searchLabel: t('searchLabel'),
      clearFilters: t('clearFilters'),
      paginationLabel: t('paginationLabel'),
      previous: t('previousPage'),
      next: t('nextPage'),
      showingCount: ({ showing, total }) => t('showing', { showing, total }),
      pageCount: ({ page, pageCount, total }) => t('paginationSummary', { page, pageCount, total }),
      selectedEntityNoun: tActions('entityLabel'),
      emptyNoMatchesTitle: t('noMatchesTitle'),
      emptyNoMatchesDescription: t('noMatchesDescription'),
      errorTitle: t('errorTitle'),
      errorStaleBanner: t('staleBanner'),
      errorDescription: t('errorDescription'),
      retry: t('retry'),
      loadingLabel: t('loadingLabel'),
    }),
    [t, tActions],
  );

  return (
    <div data-testid="ops-classes-tab">
      {/* ops-tabs-audit — the design's ONE tab-table card (`:352-418`): the
          19px/600 header with the Create class primary on its right (the
          design's Export secondary is NOT drawn — no classes CSV endpoint
          exists and OP-2 forbids wiring a control to a stub, see the file
          header), then chips, bulk bar, rows and pager on the same card. */}
      <OpsTabTableCard
        title={t('headerTitle')}
        summary={t('summary', { count: classes.data?.meta.pagination.total ?? 0 })}
        actions={
          <Button
            type="button"
            variant="navy"
            onClick={() => {
              if (refuseIfReadOnly()) setCreateOpen(true);
            }}
            className="h-10 rounded-[12px] px-[18px] text-[13.5px] font-semibold"
          >
            <Plus className="size-3.5" strokeWidth={2.2} aria-hidden="true" />
            {tCreate('submit')}
          </Button>
        }
      >
        <DirectoryTable
          state={state}
          query={classes}
          rows={rows}
          scope={[JSON.stringify(query)]}
          meta={classes.data?.meta.pagination}
          filters={filters}
          chipFilterKey="status"
          sorts={[]}
          columns={columns}
          selectable
          getRowTarget={(row) => ({ kind: 'class', documentId: row.documentId })}
          rowHref={(row) => `/dashboard/ops/schools/${schoolDocumentId}/classes/${row.documentId}`}
          rowActions={rowActionsFor}
          bulkActions={bulkActionDefs}
          rowAttrs={() => ({ 'data-testid': 'ops-classes-row' })}
          labels={labels}
          emptyAction={teacherId === '' ? undefined : { label: t('clearFilter'), onRun: clearTeacher }}
          emptyCopy={{ title: t('emptyTitle'), body: t('emptyDescription') }}
          // filters-audit 2026-09-11: 40px pill controls, hidden labels, count +
          // sort pill right (`Ops Portal.dc.html:353-374`).
          toolbarVariant="pill"
        />
      </OpsTabTableCard>

      {reassignRow ? (
        <OpsAssignTeacherDialog
          schoolDocumentId={schoolDocumentId}
          classDocumentId={reassignRow.documentId}
          className={reassignRow.name ?? ''}
          currentTeacherDocumentId={reassignRow.primary_teacher?.documentId ?? null}
          onClose={() => setReassignRow(null)}
        />
      ) : null}

      {createOpen ? (
        <OpsEditClassDialog
          mode="create"
          schoolDocumentId={schoolDocumentId}
          onClose={() => setCreateOpen(false)}
        />
      ) : null}

      {editRow ? (
        <OpsEditClassDialog
          classDocumentId={editRow.documentId}
          schoolDocumentId={schoolDocumentId}
          className={editRow.name ?? ''}
          classUpdatedAt={editRow.updatedAt}
          currentYearBand={editRow.year_band}
          onClose={() => setEditRow(null)}
        />
      ) : null}

      {singleLifecycle ? (
        <OpsConfirmDialog
          open
          onOpenChange={(open) => {
            if (!open && lifecycleRunner.state.status !== 'running') setSingleLifecycle(null);
          }}
          title={tActions(
            singleLifecycle.action === 'archive'
              ? 'actions.confirm.archive.title'
              : 'actions.confirm.restore.title',
            { name: singleLifecycle.row.name ?? '' },
          )}
          description={tActions(
            singleLifecycle.action === 'archive'
              ? 'actions.confirm.archive.body'
              : 'actions.confirm.restore.body',
          )}
          confirmLabel={tActions(
            singleLifecycle.action === 'archive'
              ? 'actions.confirm.archive.cta'
              : 'actions.confirm.restore.cta',
          )}
          cancelLabel={tActions('actions.cancel')}
          tone={singleLifecycle.action === 'archive' ? 'destructive' : 'neutral'}
          pending={lifecycleRunner.state.status === 'running'}
          onConfirm={() => void runSingleLifecycle()}
        />
      ) : null}

      {bulkArchiveTargets ? (
        <OpsConfirmDialog
          open
          onOpenChange={(open) => {
            if (!open && lifecycleRunner.state.status !== 'running') setBulkArchiveTargets(null);
          }}
          title={tActions('bulk.confirm.archive.title', { count: bulkArchiveTargets.length })}
          description={tActions('bulk.confirm.archive.body')}
          confirmLabel={tActions('bulk.confirm.archive.cta', { count: bulkArchiveTargets.length })}
          cancelLabel={tActions('actions.cancel')}
          tone="destructive"
          pending={lifecycleRunner.state.status === 'running'}
          onConfirm={() => void runBulkArchive()}
        />
      ) : null}

      {setWindowTargets ? (
        <ClassSetTestWindowDialog
          schoolDocumentId={schoolDocumentId}
          targets={setWindowTargets}
          onDone={() => {
            setSetWindowTargets(null);
            invalidateClasses();
          }}
          onCancel={() => setSetWindowTargets(null)}
        />
      ) : null}
    </div>
  );
}

function ClassSetTestWindowDialog({
  schoolDocumentId,
  targets,
  onDone,
  onCancel,
}: {
  schoolDocumentId: string;
  targets: readonly OpsActionTarget[];
  onDone: () => void;
  onCancel: () => void;
}) {
  const t = useTranslations('Ops.classActions.setTestWindow');
  const tActions = useTranslations('Ops.classActions');
  const forms = useFormsQuery(true);
  const [title, setTitle] = useState('');
  const [timezone, setTimezone] = useState('');
  const [opensAt, setOpensAt] = useState('');
  const [closesAt, setClosesAt] = useState('');
  const [formDocumentId, setFormDocumentId] = useState('');
  const [createErrorMessage, setCreateErrorMessage] = useState<string | null>(null);
  const windowIdRef = useRef<string | null>(null);
  const create = useAssessmentWindowCreateMutation(schoolDocumentId);

  const assignDefinition = useMemo<OpsActionDefinition<OpsActionTarget>>(
    () => ({
      write: true,
      async perform(target) {
        await strapi.put(`/api/ops/schools/${schoolDocumentId}/classes/${target.documentId}/window`, {
          window_documentId: windowIdRef.current,
        });
      },
      async readBack(target) {
        const res = await strapi.get<unknown>(classesListPath(schoolDocumentId), {
          params: classesListQueryParams({ page: 1, pageSize: 200 }),
          opsPortalVersioned: true,
        });
        const parsed = classesListResponseSchema.parse(res.data);
        const row = parsed.data.find((candidate) => candidate.documentId === target.documentId);
        return row?.test_window?.documentId === windowIdRef.current;
      },
    }),
    [schoolDocumentId],
  );
  const assignRunner = useOpsActionRunner(assignDefinition);

  const busy = create.isPending || assignRunner.state.status === 'running';
  const invalid =
    title.trim() === '' ||
    timezone.trim() === '' ||
    opensAt === '' ||
    closesAt === '' ||
    formDocumentId === '' ||
    busy;

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (invalid) return;
    setCreateErrorMessage(null);
    try {
      const created = await create.mutateAsync({
        schoolDocumentId,
        body: {
          title: title.trim(),
          class_documentIds: targets.map((target) => target.documentId),
          forms: [{ skill: 'reading', form_documentId: formDocumentId }],
          opens_at: new Date(opensAt).toISOString(),
          closes_at: new Date(closesAt).toISOString(),
          timezone: timezone.trim(),
        },
      });
      windowIdRef.current = created.documentId;
      const summary = await assignRunner.run(targets);
      const feedback = describeRunOutcome(summary, tActions('entityLabel'));
      showOpsToast({
        tone: feedback.tone === 'success' ? 'ok' : feedback.tone === 'warning' ? 'warn' : 'error',
        message: feedback.message,
      });
      onDone();
    } catch {
      setCreateErrorMessage(t('createErrorTitle'));
    }
  };

  return (
    <Dialog
      open
      onOpenChange={(next) => {
        if (!next && !busy) onCancel();
      }}
    >
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t('title')}</DialogTitle>
          <DialogDescription>{t('description', { count: targets.length })}</DialogDescription>
        </DialogHeader>
        <form onSubmit={(event) => void submit(event)} noValidate className="flex flex-col gap-4">
          {createErrorMessage ? (
            <Alert variant="error" title={createErrorMessage}>
              {null}
            </Alert>
          ) : null}
          <FieldShell id="ops-set-window-title" label={t('titleLabel')} required>
            <Input
              id="ops-set-window-title"
              value={title}
              onChange={(event) => setTitle(event.target.value)}
            />
          </FieldShell>
          <FieldShell id="ops-set-window-timezone" label={t('timezoneLabel')} required>
            <Input
              id="ops-set-window-timezone"
              value={timezone}
              onChange={(event) => setTimezone(event.target.value)}
            />
          </FieldShell>
          <div className="grid gap-4 sm:grid-cols-2">
            <FieldShell id="ops-set-window-opens" label={t('opensLabel')} required>
              <Input
                id="ops-set-window-opens"
                type="datetime-local"
                value={opensAt}
                onChange={(event) => setOpensAt(event.target.value)}
              />
            </FieldShell>
            <FieldShell id="ops-set-window-closes" label={t('closesLabel')} required>
              <Input
                id="ops-set-window-closes"
                type="datetime-local"
                value={closesAt}
                onChange={(event) => setClosesAt(event.target.value)}
              />
            </FieldShell>
          </div>
          <FieldShell id="ops-set-window-form" label={t('formLabel')} required>
            <NativeSelect
              id="ops-set-window-form"
              className="w-full"
              value={formDocumentId}
              onChange={(event) => setFormDocumentId(event.target.value)}
            >
              <NativeSelectOption value="">{t('formPlaceholder')}</NativeSelectOption>
              {(forms.data ?? []).map((form) => (
                <NativeSelectOption key={form.documentId} value={form.documentId}>
                  {form.form_code}
                </NativeSelectOption>
              ))}
            </NativeSelect>
          </FieldShell>
          <DialogFooter>
            <Button type="button" size="lg" variant="outline" onClick={onCancel} disabled={busy}>
              {t('cancel')}
            </Button>
            <Button type="submit" size="lg" loading={busy} disabled={invalid}>
              {busy ? t('submitting') : t('submit')}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
