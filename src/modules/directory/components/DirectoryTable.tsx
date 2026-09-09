'use client';

/**
 * Task 02 — the ONE generic directory component. The consumer owns its query:
 * it calls useDirectoryState, spreads `state.params` into its server query
 * (the `q`/filters/sort/page/pageSize contract shape), and hands the result to
 * this component as `rows` + `meta` + `query`. Everything visual — toolbar,
 * filter bar, sortable headers, row menus, selection, bulk bar, the three
 * empty states, pager — is the kit's.
 */
import { useEffect, useMemo, type ReactElement } from 'react';

import type { OpsActionTarget } from '@/modules/ops/actions';

import { DIRECTORY_DEFAULT_LABELS } from '../constants/directory.constants';
import { useDirectorySelection } from '../hooks/use-directory-selection';
import type {
  DirectoryBulkAction,
  DirectoryColumnDef,
  DirectoryFilterDef,
  DirectoryLabels,
  DirectoryMeta,
  DirectoryQueryStatus,
  DirectoryRowAction,
  DirectorySortDef,
  DirectoryStateApi,
} from '../types/directory.types';
import { DirectoryBulkBar } from './DirectoryBulkBar';
import { DirectoryPagination } from './DirectoryPagination';
import { DirectoryRows } from './DirectoryRows';
import {
  DirectoryEmpty,
  DirectoryError,
  DirectoryLoading,
  DirectoryStaleBanner,
} from './DirectoryStates';
import { DirectoryToolbar } from './DirectoryToolbar';

export interface DirectoryTableProps<Row> {
  state: DirectoryStateApi;
  query: DirectoryQueryStatus;
  rows: readonly Row[];
  /** Names a row as a selection/bulk target — the kit's only row assumption. */
  getRowTarget: (row: Row) => OpsActionTarget;
  /**
   * Everything that scopes the list (school, tab, filters) — any change clears
   * the selection, so a bulk action can never address a row the operator can
   * no longer see. Thread the consumer's own scope keys through here.
   */
  scope?: readonly unknown[];
  meta?: DirectoryMeta;
  filters: readonly DirectoryFilterDef[];
  sorts: readonly DirectorySortDef[];
  columns: readonly DirectoryColumnDef<Row>[];
  selectable?: boolean;
  rowActions?: (row: Row) => readonly DirectoryRowAction<Row>[];
  bulkActions?: readonly DirectoryBulkAction[];
  emptyAction?: { label: string; onRun: () => void };
  labels?: Partial<DirectoryLabels>;
}

export function DirectoryTable<Row>({
  state,
  query,
  rows,
  getRowTarget,
  scope = [],
  meta,
  filters,
  sorts,
  columns,
  selectable = false,
  rowActions,
  bulkActions = [],
  emptyAction,
  labels: labelOverrides,
}: DirectoryTableProps<Row>) {
  const labels = useMemo<DirectoryLabels>(
    () => ({ ...DIRECTORY_DEFAULT_LABELS, ...labelOverrides }),
    [labelOverrides],
  );
  const selection = useDirectorySelection({ page: rows, getRowTarget, scope });

  // Deleting the last row of the last page: clamp, keep the filters (task 02 —
  // the clamp lives here because meta.pageCount only exists at the table).
  useEffect(() => {
    if (meta && meta.pageCount > 0 && state.params.page > meta.pageCount) {
      state.setPage(meta.pageCount);
    }
  }, [meta, state]);

  const total = meta?.total ?? 0;
  const hasData = rows.length > 0 || total > 0;
  const stale = query.isError && hasData;

  let body: ReactElement;
  if (query.isPending) {
    body = <DirectoryLoading labels={labels} />;
  } else if (query.isError && !hasData) {
    body = <DirectoryError labels={labels} onRetry={query.refetch} retrying={query.isFetching} />;
  } else if (total === 0) {
    body = (
      <DirectoryEmpty
        variant={state.hasActiveControls ? 'no-matches' : 'none'}
        labels={labels}
        onClearFilters={state.clearFilters}
        emptyAction={emptyAction}
      />
    );
  } else {
    body = (
      <DirectoryRows
        state={state}
        columns={columns}
        rows={rows}
        getRowTarget={getRowTarget}
        selectable={selectable}
        selection={selection}
        rowActions={rowActions}
        labels={labels}
      />
    );
  }

  return (
    <section data-slot="directory" className="flex flex-col gap-4">
      <DirectoryToolbar
        state={state}
        filters={filters}
        sorts={sorts}
        labels={labels}
        showing={rows.length}
        total={total}
      />
      {stale ? (
        <DirectoryStaleBanner labels={labels} onRetry={query.refetch} retrying={query.isFetching} />
      ) : null}
      {selection.count > 0 && bulkActions.length > 0 ? (
        <DirectoryBulkBar selection={selection} bulkActions={bulkActions} labels={labels} />
      ) : null}
      <div className="overflow-x-auto rounded-xl border border-border bg-card">{body}</div>
      {meta ? <DirectoryPagination meta={meta} onPageChange={state.setPage} labels={labels} /> : null}
    </section>
  );
}
