'use client';

import { useMemo, useState } from 'react';
import { useTranslations } from 'next-intl';
import { KeyRound, UserRoundCheck, UserRoundX } from 'lucide-react';

import {
  applyClientDirectoryMode,
  DIRECTORY_ALL,
  DirectoryTable,
  useDirectoryState,
  type DirectoryClientConfig,
  type DirectoryColumnDef,
  type DirectoryFilterDef,
  type DirectoryLabels,
  type DirectoryRowAction,
  type DirectorySortDef,
} from '@/modules/directory';
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  Badge,
  Button,
} from '@/modules/design-system';
import { RESITTABLE_STATES } from '@/modules/test-day/constants/test-day.constants';
import { STATE_ORDER } from '@/modules/test-day/constants/components.constants';
import {
  deriveRowState,
  effectiveRevealedIds,
  studentDisplayName,
} from '@/modules/test-day/lib/monitor-row-state';
import { useRevealAuditStore } from '@/modules/test-day/stores/use-reveal-audit-store';
import { useSittingMonitorQuery } from '@/modules/test-day/queries/use-sitting-monitor.query';
import type { MonitorStudent } from '@/modules/test-day/types/test-day.types';
import { MonitorStatePill } from './MonitorStatePill';
import { StudentRevealDialog } from './StudentRevealDialog';

import type { MonitorTableProps } from '@/modules/test-day/types/components.types';

// C-SIT-02 live board rendered THROUGH the shared directory kit (ops/35) in
// `client` mode — a sitting is class-sized (D-KIT-MODE), so the loaded roster
// is reduced in memory. The kit owns search, the sitting-status chips, the
// name/progress sorts, the pager and the states; this file owns the columns
// and the three write actions.
//
// POLL SAFETY (the task's one real risk): filter/sort/page state lives in the
// URL (useDirectoryState), never in the data, and rows are keyed by
// documentId — so a 5 s poll reconciles rows in place and never resets the
// operator's filter, sort, page or scroll. The query is re-subscribed here
// (same key, same frozen hook, one cache entry and one interval — the
// cadence is unchanged) ONLY so the kit's state machine sees the real fetch
// signals; `polled: true` because this surface's ONLY refetch path is the
// background interval (U-46 case 4 — a tick never renders as busy).
//
// Quick actions (D-KIT-QUICK's two inline slots): reveal-code and the absent
// toggle — the two per-student moves a live sitting uses constantly. Re-sit
// stays menu-only per the task's watch-out: it is the consequential one, and
// its AlertDialog confirm (same keys, same dialog as the retired ResitButton)
// opens from the ⋯ menu. Reveal keeps the StudentRevealDialog — the
// credential never leaves its dialog. All three are `write: true` (D-20).
//
// paramPrefix/preserveParams: the test-day screen hosts TWO kit lists (this
// board and the sitting history below); each names the other's URL keys so
// one list's write never drops the sibling's params (ops/34's cross-instance
// rule).

const MONITOR_PREFIX = 'monitor-';
const SIBLING_PREFIX = 'history-';
/** Class-sized board; the pager exists for the long tail, it never bites. */
const MONITOR_PAGE_SIZE = 100;

const byName = (a: MonitorStudent, b: MonitorStudent): number =>
  studentDisplayName(a).localeCompare(studentDisplayName(b)) ||
  a.documentId.localeCompare(b.documentId);

function progressRank(
  row: MonitorStudent,
  revealedIds: ReadonlySet<string>,
  order: readonly string[],
): number {
  const index = order.indexOf(deriveRowState(row, revealedIds));
  return index === -1 ? order.length : index;
}

export function MonitorTable({
  sitting,
  students,
  resitPendingId,
  absentPendingId,
  onResit,
  onToggleAbsent,
}: MonitorTableProps) {
  const t = useTranslations('TestDay.monitor');
  const tReveal = useTranslations('TestDay.studentReveal');
  const tResit = useTranslations('TestDay.resit');
  const monitor = useSittingMonitorQuery(sitting.documentId);
  const recordReveal = useRevealAuditStore((state) => state.recordReveal);
  const revealEntries = useRevealAuditStore((state) => state.entries[sitting.documentId]);
  const [revealTarget, setRevealTarget] = useState<MonitorStudent | null>(null);
  const [resitTarget, setResitTarget] = useState<MonitorStudent | null>(null);
  const revealedIds = useMemo(
    () => effectiveRevealedIds(revealEntries, students, sitting.status),
    [revealEntries, students, sitting.status],
  );

  const filters = useMemo<readonly DirectoryFilterDef[]>(
    () => [
      {
        key: 'status',
        label: t('filterStatusLabel'),
        options: [
          { value: DIRECTORY_ALL, label: t('filterStatusAll') },
          ...STATE_ORDER.map((rowState) => ({ value: rowState, label: t(`state.${rowState}`) })),
        ],
      },
    ],
    [t],
  );

  const sorts = useMemo<readonly DirectorySortDef[]>(
    () => [
      { value: 'name:asc', label: t('sortNameAsc') },
      { value: 'name:desc', label: t('sortNameDesc') },
      { value: 'progress:asc', label: t('sortProgressAsc') },
      { value: 'progress:desc', label: t('sortProgressDesc') },
    ],
    [t],
  );

  const state = useDirectoryState({
    filters,
    sorts,
    defaultSort: 'name:asc',
    mode: 'client',
    pageSize: MONITOR_PAGE_SIZE,
    paramPrefix: MONITOR_PREFIX,
    preserveParams: [
      `${SIBLING_PREFIX}q`,
      `${SIBLING_PREFIX}sort`,
      `${SIBLING_PREFIX}page`,
      `${SIBLING_PREFIX}status`,
    ],
  });

  const clientConfig = useMemo<DirectoryClientConfig<MonitorStudent>>(
    () => ({
      searchText: (row) => [studentDisplayName(row), row.email ?? ''].filter(Boolean),
      // The status filter matches the STATUS COLUMN exactly: the derived
      // row state (code_shown is the reveal audit over not_joined), not the
      // raw backend enum.
      filterPredicates: {
        status: (row, value) => deriveRowState(row, revealedIds) === value,
      },
      comparators: {
        'name:asc': byName,
        'name:desc': (a, b) => byName(b, a),
        // Progress walks STATE_ORDER (not_joined -> ... -> submitted);
        // ties break by name, never by roster order.
        'progress:asc': (a, b) =>
          progressRank(a, revealedIds, STATE_ORDER) - progressRank(b, revealedIds, STATE_ORDER) ||
          byName(a, b),
        'progress:desc': (a, b) =>
          progressRank(b, revealedIds, STATE_ORDER) - progressRank(a, revealedIds, STATE_ORDER) ||
          byName(a, b),
      },
    }),
    [revealedIds],
  );

  const page = useMemo(
    () => applyClientDirectoryMode(students, state.params, clientConfig),
    [students, state.params, clientConfig],
  );

  const labels = useMemo<Partial<DirectoryLabels>>(
    () => ({
      searchPlaceholder: t('searchPlaceholder'),
      searchLabel: t('searchLabel'),
      filtersLabel: t('filterStatusLabel'),
      sortLabel: t('sortLabel'),
      clearFilters: t('clearFilters'),
      paginationLabel: t('paginationLabel'),
      previous: t('previous'),
      next: t('next'),
      rowMenuLabel: t('rowMenuLabel'),
      showingCount: ({ showing, total }) => t('showingCount', { showing, total }),
      pageCount: ({ page, pageCount, total }) => t('pageCount', { page, pageCount, total }),
      emptyNoneTitle: t('emptyTitle'),
      emptyNoneDescription: t('emptyBody'),
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

  const columns = useMemo<DirectoryColumnDef<MonitorStudent>[]>(
    () => [
      {
        key: 'name',
        header: t('columnName'),
        cell: (row) => (
          <span className="flex items-center gap-2 font-medium text-foreground">
            {studentDisplayName(row)}
            {row.absent ? <Badge variant="secondary">{t('absentLabel')}</Badge> : null}
          </span>
        ),
        sortable: true,
        sortValues: { asc: 'name:asc', desc: 'name:desc' },
      },
      {
        key: 'email',
        header: t('columnEmail'),
        cell: (row) => row.email ?? t('emailMissing'),
      },
      {
        key: 'status',
        header: t('columnStatus'),
        cell: (row) => {
          const rowState = deriveRowState(row, revealedIds);
          return (
            <span data-state={rowState}>
              <MonitorStatePill state={rowState} />
            </span>
          );
        },
      },
    ],
    [t, revealedIds],
  );

  const rowActions = (row: MonitorStudent): readonly DirectoryRowAction<MonitorStudent>[] => {
    const name = studentDisplayName(row);
    const actions: DirectoryRowAction<MonitorStudent>[] = [
      {
        label: tReveal('actionLabel', { name }),
        icon: KeyRound,
        quick: true,
        write: true,
        onSelect: (target) => {
          recordReveal(sitting.documentId, target.documentId);
          setRevealTarget(target);
        },
      },
      {
        label: t(row.absent ? 'clearAbsentLabel' : 'markAbsentLabel', { name }),
        icon: row.absent ? UserRoundCheck : UserRoundX,
        quick: true,
        write: true,
        onSelect: (target) => onToggleAbsent(target.documentId, !target.absent),
      },
    ];
    if (RESITTABLE_STATES.includes(row.state)) {
      actions.push({ label: tResit('cta'), write: true, onSelect: setResitTarget });
    }
    return actions;
  };

  const resitPending = resitTarget !== null && resitPendingId === resitTarget.documentId;

  return (
    <div data-slot="monitor-table">
      <DirectoryTable
        state={state}
        query={{
          isPending: monitor.isPending,
          isError: monitor.isError,
          isFetching: monitor.isFetching,
          error: monitor.error,
          refetch: monitor.refetch,
          polled: true,
        }}
        rows={page.rows}
        meta={page.meta}
        getRowKey={(row) => row.documentId}
        filters={filters}
        sorts={sorts}
        chipFilterKey="status"
        columns={columns}
        rowActions={rowActions}
        labels={labels}
        regionAttrs={{ 'data-slot': 'monitor-table-scroll' }}
        rowAttrs={(row) => {
          const rowState = deriveRowState(row, revealedIds);
          return {
            'data-student': row.documentId,
            'data-slot': rowState === 'code_shown' ? 'monitor-row-code-shown' : undefined,
            'data-absent': row.absent ? 'true' : undefined,
            className: row.absent ? 'bg-muted/50 text-muted-foreground' : undefined,
          };
        }}
      />
      <StudentRevealDialog
        open={revealTarget !== null}
        onClose={() => setRevealTarget(null)}
        code={sitting.code}
        status={sitting.status}
        studentName={revealTarget ? studentDisplayName(revealTarget) : ''}
        studentEmail={revealTarget?.email ?? null}
      />
      <AlertDialog
        open={resitTarget !== null}
        onOpenChange={(open) => {
          if (!open) setResitTarget(null);
        }}
      >
        <AlertDialogContent size="sm">
          <AlertDialogHeader>
            <AlertDialogTitle>
              {tResit('confirmTitle', {
                name: resitTarget ? studentDisplayName(resitTarget) : '',
              })}
            </AlertDialogTitle>
            <AlertDialogDescription>{tResit('confirmBody')}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="h-11 px-4" disabled={resitPending}>
              {tResit('cancel')}
            </AlertDialogCancel>
            <Button
              type="button"
              className="h-11 px-4"
              loading={resitPending}
              onClick={() => {
                if (resitTarget) onResit(resitTarget.documentId);
                setResitTarget(null);
              }}
            >
              {tResit('confirm')}
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
