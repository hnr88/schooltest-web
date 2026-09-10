'use client';

/**
 * Task 02 — the ONE generic directory component. The consumer owns its query:
 * it calls useDirectoryState, spreads `state.params` into its server query
 * (the `q`/filters/sort/page/pageSize contract shape), and hands the result to
 * this component as `rows` + `meta` + `query`. Everything visual — toolbar,
 * filter bar, sortable headers, row menus, selection, bulk bar, the three
 * empty states, pager — is the kit's.
 *
 * teacher/04 — the body is a LOOKUP over §L-states' ten arms
 * (`lib/list-scenario.ts` decides; this file renders). Two rules this file
 * owns beyond the lookup:
 *
 * - LAYOUT AFTER SCENARIO (the ruling recorded in the task file): the
 *   scenario arm is chosen first, and only the rows arm then dispatches on
 *   `layout` — `table` renders `DirectoryRows`, `rows`/`cards`/`tiles` render
 *   `DirectoryList` with `renderRow`. Every arm composes with every layout
 *   and with task 01's grouping and whole-row navigation.
 * - A5 (§L-a11y): when the body swaps from rows to an arm, focus lands on the
 *   arm (its container carries `tabIndex={-1}`); when focus falls to
 *   `<body>` because the focused row was removed, it lands on the nearest
 *   surviving row's action trigger.
 */
import { useEffect, useMemo, useRef, type ReactElement } from 'react';

import { useTranslations } from 'next-intl';

import { cn } from '@/lib/utils';
import type { OpsActionTarget } from '@/modules/ops/actions';
import { QueryErrorFallback } from '@/modules/query-errors';

import {
  DIRECTORY_STICKY_SCROLL_CLASS,
  DIRECTORY_TABLE_SCROLL_CLASS,
} from '../constants/directory-scroll.constants';
import { useDirectorySelection } from '../hooks/use-directory-selection';
import { buildDirectoryRowGroups } from '../lib/directory-row-api';
import { listScenarioOf, type ListScenario } from '../lib/list-scenario';
import type {
  DirectoryBulkAction,
  DirectoryEmptyCopy,
  DirectoryGroupDef,
  DirectoryFilterDef,
  DirectoryHeaderDef,
  DirectoryLabels,
  DirectoryLayoutOption,
  DirectoryLayoutProps,
  DirectoryMarkupAttrs,
  DirectoryMeta,
  DirectoryQueryStatus,
  DirectoryRowAction,
  DirectoryRowNavProps,
  DirectoryRowTargetProps,
  DirectorySortDef,
  DirectoryStateApi,
} from '../types/directory.types';
import { DirectoryChips } from './DirectoryChips';
import { DirectoryHeader } from './DirectoryHeader';
import { DIRECTORY_ALL } from '../constants/directory.constants';
import { DirectoryBulkBar } from './DirectoryBulkBar';
import { DirectoryPagination } from './DirectoryPagination';
import { DirectoryRows } from './DirectoryRows';
import {
  DirectoryEmpty,
  DirectoryError,
  DirectoryLoading,
  DirectoryStaleBanner,
} from './DirectoryStates';
import { DirectoryList } from './DirectoryList';
import { DirectoryToolbar } from './DirectoryToolbar';

export interface DirectoryTableBaseProps<Row> {
  state: DirectoryStateApi;
  query: DirectoryQueryStatus;
  rows: readonly Row[];
  /** U-11 — explicit row identity; wins over `selectionKey(getRowTarget(row))`. */
  getRowKey?: (row: Row) => string;
  /**
   * Everything that scopes the list (school, tab, filters) — any change clears
   * the selection, so a bulk action can never address a row the operator can
   * no longer see. Thread the consumer's own scope keys through here.
   */
  scope?: readonly unknown[];
  meta?: DirectoryMeta;
  filters: readonly DirectoryFilterDef[];
  sorts: readonly DirectorySortDef[];
  rowActions?: (row: Row) => readonly DirectoryRowAction<Row>[];
  bulkActions?: readonly DirectoryBulkAction[];
  emptyAction?: { label: string; onRun: () => void };
  /** U-05 — grouping is legal in EVERY layout (full-width row under `table`). */
  groupBy?: DirectoryGroupDef<Row>;
  labels?: Partial<DirectoryLabels>;
  /** U-17 — apply the kit's sticky recipe and pin the header row to it. */
  sticky?: boolean;
  /**
   * teacher/06 — when provided, the toolbar renders the layout toggle for these
   * options, reading `state.layout` and writing through `state.setLayout`.
   */
  layoutOptions?: readonly DirectoryLayoutOption[];
  /**
   * SHARED-LAYER §L-descriptor's `pagination` arm. `'meta'` (default) renders
   * the pager from `meta`; `'none'` suppresses it — a whole-array client list
   * still passes `meta` for the count label and the state machine, and simply
   * offers no pages.
   */
  pagination?: 'meta' | 'none';
  /**
   * ops/34 — attributes merged onto the body's scroll region, so a migrating
   * surface keeps the labelling its tests and screen readers pin there
   * (`role="group"` + `aria-label` for a region whose rows hold no interactive
   * element — the recipe note in directory-scroll.constants.ts). Absent: the
   * region renders exactly as before.
   */
  regionAttrs?: DirectoryMarkupAttrs<HTMLDivElement>;
  /**
   * ops/34 — attributes merged onto every `<table>` body row, so a migrating
   * surface keeps its ROW-level markers (row slot, status) on the kit's
   * contract instead of forking the body. Absent: rows carry only the kit's.
   */
  rowAttrs?: (row: Row) => DirectoryMarkupAttrs<HTMLTableRowElement>;
  /**
   * ops/14 — the design's tab-body header (`Ops Portal.dc.html:353-368`):
   * title, one-line summary, the Export secondary and an optional contextual
   * primary. Absent: nothing renders above the toolbar — byte-identical to
   * before this prop existed.
   */
  header?: DirectoryHeaderDef;
  /**
   * ops/14 — render THIS filter as chips instead of a select (same def, same
   * URL param, same `DIRECTORY_ALL` sentinel). Passing a key that is ALSO in
   * `filters` throws: one filter must never grow two controls.
   */
  chipFilterKey?: string;
  /**
   * ops/14 — per-surface copy for the empty (nothing-here) arm, overriding the
   * labels' `emptyNoneTitle`/`emptyNoneDescription`; absent, the labels stand.
   */
  emptyCopy?: DirectoryEmptyCopy;
}

/**
 * `columns` XOR `renderRow` (teacher/01's layout axis), `rowHref` XOR
 * `onRowSelect` (§L-rownav), and `getRowTarget` required ONLY while
 * `selectable: true` (U-11's `DirectoryRowTargetProps` — task 01's public
 * contract, wired here where the axis mounts).
 */
export type DirectoryTableProps<Row> = DirectoryTableBaseProps<Row> &
  DirectoryLayoutProps<Row> &
  DirectoryRowNavProps<Row> &
  DirectoryRowTargetProps<Row>;

/** The arms that render rows (arm 5's banner sits above them). */
const ROW_RENDERING_ARMS: readonly ListScenario[] = ['happy', 'slow', 'stale'];

export function DirectoryTable<Row>(props: DirectoryTableProps<Row>) {
  const {
    state,
    query,
    rows,
    getRowTarget,
    getRowKey,
    scope = [],
    meta,
    filters,
    sorts,
    rowActions,
    bulkActions = [],
    emptyAction,
    groupBy,
    labels: labelOverrides,
    sticky = false,
    layoutOptions,
    pagination = 'meta',
    regionAttrs,
    rowAttrs,
    header,
    chipFilterKey,
    emptyCopy,
  } = props;
  // ops/14 — one filter, one control, BY CONSTRUCTION: `chipFilterKey` selects
  // the def out of `filters`; the kit renders it as chips and the toolbar
  // receives the list WITHOUT it, so a select for the same param can never
  // mount next to the chips. A key with no def is a misconfiguration and
  // throws loudly instead of rendering nothing.
  const chipFilter =
    chipFilterKey === undefined
      ? undefined
      : filters.find((filter) => filter.key === chipFilterKey);
  if (chipFilterKey !== undefined && chipFilter === undefined) {
    throw new Error(
      `directory: chipFilterKey "${chipFilterKey}" does not match any filters key — there is no filter to render as chips.`,
    );
  }
  const selectFilters =
    chipFilterKey === undefined ? filters : filters.filter((filter) => filter.key !== chipFilterKey);
  const selectable = props.selectable === true;
  const isTable = props.layout === undefined || props.layout === 'table';
  // teacher/04 — the restricted/gone arm's heading needs the SAME two existing
  // QueryError strings the fallback itself renders, so the h2 can BE the title
  // without duplicating it. R-15 bend (kit reads no catalogue): deliberately
  // narrow — two existing keys, one namespace, recorded as a deviation.
  const tQueryError = useTranslations('QueryError');
  // Translated defaults for every label a caller did not override — the old
  // English DIRECTORY_DEFAULT_LABELS merge leaked fallback copy in any locale
  // whenever a consumer passed a Partial set.
  const tDefaults = useTranslations('Directory.defaults');
  // Narrowed once, at the discriminant: `columns` exists only for `table`,
  // `renderRow` + the concrete list layout only for the other three.
  const tableColumns = isTable ? props.columns : undefined;
  const listLayout =
    !isTable && props.layout !== undefined && props.layout !== 'table' ? props.layout : undefined;
  const listRenderRow = isTable ? undefined : props.renderRow;
  const labels = useMemo<DirectoryLabels>(
    () => ({
      searchPlaceholder: tDefaults('searchPlaceholder'),
      searchLabel: tDefaults('searchLabel'),
      filtersLabel: tDefaults('filtersLabel'),
      sortLabel: tDefaults('sortLabel'),
      layoutLabel: tDefaults('layoutLabel'),
      clearFilters: tDefaults('clearFilters'),
      paginationLabel: tDefaults('paginationLabel'),
      previous: tDefaults('previous'),
      next: tDefaults('next'),
      rowMenuLabel: tDefaults('rowMenuLabel'),
      selectAllLabel: tDefaults('selectAllLabel'),
      selectRowLabel: (rowKey) => tDefaults('selectRowLabel', { key: rowKey }),
      showingCount: ({ showing, total }) => tDefaults('showingCount', { showing, total }),
      pageCount: ({ page, pageCount, total }) => tDefaults('pageCount', { page, pageCount, total }),
      selectedEntityNoun: tDefaults('selectedEntityNoun'),
      emptyNoneTitle: tDefaults('emptyNoneTitle'),
      emptyNoneDescription: tDefaults('emptyNoneDescription'),
      emptyNoMatchesTitle: tDefaults('emptyNoMatchesTitle'),
      emptyNoMatchesDescription: tDefaults('emptyNoMatchesDescription'),
      errorTitle: tDefaults('errorTitle'),
      errorStaleBanner: tDefaults('errorStaleBanner'),
      errorDescription: tDefaults('errorDescription'),
      retry: tDefaults('retry'),
      loadingLabel: tDefaults('loadingLabel'),
      exportLabel: tDefaults('exportLabel'),
      primaryActionLabel: tDefaults('primaryActionLabel'),
      chipAllLabel: tDefaults('chipAllLabel'),
      ...labelOverrides,
    }),
    [tDefaults, labelOverrides],
  );
  // ops/14 — the per-surface empty copy layers on top of the resolved labels
  // for the empty-none arm only; without `emptyCopy` this is the same object.
  const resolvedLabels = useMemo<DirectoryLabels>(
    () =>
      emptyCopy
        ? { ...labels, emptyNoneTitle: emptyCopy.title, emptyNoneDescription: emptyCopy.body }
        : labels,
    [labels, emptyCopy],
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

  // §L-states — the body is a lookup, first match winning (U-13, U-46).
  const scenario = listScenarioOf({
    isPending: query.isPending,
    isError: query.isError,
    isFetching: query.isFetching,
    error: query.error,
    enabled: query.enabled ?? true,
    isPlaceholderData: query.isPlaceholderData ?? false,
    polled: query.polled ?? false,
    rowCount: rows.length,
    total,
    hasActiveControls: state.hasActiveControls,
  });

  const regionRef = useRef<HTMLDivElement>(null);
  const armRef = useRef<HTMLHeadingElement>(null);
  const previousScenario = useRef<ListScenario>(scenario);
  const lastFocusedRowIndex = useRef<number | null>(null);

  // §L-a11y A5, arm swap: rows -> arm lands focus on the arm's HEADING target
  // (`tabIndex={-1}`, reachable through `headingRef`). `stale` counts as a
  // row-rendering arm — its banner sits ABOVE the rows and focus stays put.
  useEffect(() => {
    const previous = previousScenario.current;
    previousScenario.current = scenario;
    if (previous === scenario) return;
    const wasRows = ROW_RENDERING_ARMS.includes(previous);
    const isRows = ROW_RENDERING_ARMS.includes(scenario);
    if (wasRows && !isRows) {
      armRef.current?.focus({ preventScroll: true });
    }
  }, [scenario]);

  // §L-a11y A5, row removal: a removed row drags focus to `<body>`; hand it to
  // the nearest surviving row's action trigger.
  useEffect(() => {
    if (document.activeElement !== document.body) return;
    const index = lastFocusedRowIndex.current;
    if (index === null || !regionRef.current) return;
    const rowsInRegion = regionRef.current.querySelectorAll('[data-directory-row]');
    if (rowsInRegion.length === 0) return;
    const target = Math.min(index, rowsInRegion.length - 1);
    const trigger = regionRef.current.querySelector<HTMLElement>(
      `[data-directory-row-index="${target}"] [data-directory-row-menu] button`,
    );
    trigger?.focus({ preventScroll: true });
    if (trigger) lastFocusedRowIndex.current = null;
  });

  const handleFocusCapture = (event: React.FocusEvent<HTMLDivElement>) => {
    const row = (event.target as HTMLElement).closest<HTMLElement>('[data-directory-row]');
    const index = row?.getAttribute('data-directory-row-index');
    if (index !== null && index !== undefined) lastFocusedRowIndex.current = Number(index);
  };

  const showRows = ROW_RENDERING_ARMS.includes(scenario);

  // §L-stale-vs-loading — aria-busy is an affordance, not a scenario:
  // placeholder rows (case 2) and a plain refetch (case 3) are busy; a polled
  // refetch (case 4) NEVER is. A STALE list being retried is case 3 — the
  // banner's own button carries `retrying`, and the region carries `aria-busy`.
  const rowsBusy =
    scenario === 'slow' ||
    (showRows && (query.isPlaceholderData ?? false) && !(query.polled ?? false)) ||
    (scenario === 'stale' && query.isFetching && !(query.polled ?? false));

  let body: ReactElement | null;
  if (scenario === 'disabled') {
    // §L-disabled / R-23 — the guard above owns the wall; the kit renders no
    // skeleton and no gate copy of its own.
    body = null;
  } else if (scenario === 'loading') {
    body = <DirectoryLoading labels={labels} headingRef={armRef} />;
  } else if (scenario === 'restricted' || scenario === 'gone') {
    // D-04: the classifier's 403 flip is what makes this arm reachable.
    // `action={null}` — the kit's forbidden arm carries no action slot. The
    // h2 is the arm's REAL heading (A5): its text is the same existing
    // QueryError string the fallback renders; the fallback's own title line
    // is suppressed with the established descendant variant, so the copy
    // appears exactly once and focus lands on the visible heading.
    body = (
      <div className="mt-6 [&_[data-slot=empty-state]>p:first-of-type]:hidden">
        <h2
          ref={armRef}
          tabIndex={-1}
          className="text-center font-semibold outline-none"
        >
          {scenario === 'restricted' ? tQueryError('forbiddenTitle') : tQueryError('goneTitle')}
        </h2>
        <QueryErrorFallback error={query.error} action={null} />
      </div>
    );
  } else if (scenario === 'loadError') {
    body = (
      <DirectoryError
        labels={labels}
        onRetry={query.refetch}
        retrying={query.isFetching}
        headingRef={armRef}
      />
    );
  } else if (scenario === 'empty-no-matches' || scenario === 'empty-none') {
    body = (
      <DirectoryEmpty
        variant={scenario === 'empty-no-matches' ? 'no-matches' : 'none'}
        labels={resolvedLabels}
        onClearFilters={state.clearFilters}
        emptyAction={emptyAction}
        headingRef={armRef}
      />
    );
  } else {
    // LAYOUT AFTER SCENARIO: only now does `layout` pick the body.
    body =
      isTable && tableColumns ? (
        <DirectoryRows
          state={state}
          columns={tableColumns}
          rows={rows}
          getRowTarget={getRowTarget}
          getRowKey={getRowKey}
          selectable={selectable}
          selection={selection}
          rowActions={rowActions}
          labels={labels}
          groupBy={groupBy}
          rowHref={props.rowHref}
          onRowSelect={props.onRowSelect}
          sticky={sticky}
          rowAttrs={rowAttrs}
        />
      ) : listLayout && listRenderRow ? (
        <DirectoryList
          layout={listLayout}
          groups={buildDirectoryRowGroups({
            rows,
            getRowKey,
            getRowTarget,
            selection,
            rowActions,
            groupBy,
          })}
          renderRow={listRenderRow}
          rowHref={props.rowHref}
        />
      ) : null;
  }

  return (
    <section data-slot="directory" className="flex flex-col gap-4">
      {header ? <DirectoryHeader header={header} /> : null}
      <DirectoryToolbar
        state={state}
        filters={selectFilters}
        sorts={sorts}
        labels={labels}
        showing={rows.length}
        total={total}
        layoutControl={
          layoutOptions && layoutOptions.length > 1
            ? {
                value: state.layout,
                options: layoutOptions,
                onChange: state.setLayout,
              }
            : undefined
        }
      />
      {chipFilter ? (
        <DirectoryChips
          filter={chipFilter}
          value={state.params.filters[chipFilter.key] ?? DIRECTORY_ALL}
          onValueChange={(next) => state.setFilter(chipFilter.key, next)}
        />
      ) : null}
      {scenario === 'stale' ? (
        <DirectoryStaleBanner labels={labels} onRetry={query.refetch} retrying={query.isFetching} />
      ) : null}
      {selection.count > 0 && bulkActions.length > 0 ? (
        <DirectoryBulkBar selection={selection} bulkActions={bulkActions} labels={labels} />
      ) : null}
      {showRows && (query.isPlaceholderData ?? false) && !query.polled ? (
        // §L-stale-vs-loading case 2 — announce the landed page, politely.
        <span className="sr-only" aria-live="polite">
          {labels.showingCount({ showing: rows.length, total })}
        </span>
      ) : null}
      <div
        ref={regionRef}
        onFocusCapture={isTable ? handleFocusCapture : undefined}
        tabIndex={isTable ? 0 : undefined}
        aria-busy={showRows && rowsBusy ? true : undefined}
        {...regionAttrs}
        className={
          isTable
            ? cn(DIRECTORY_TABLE_SCROLL_CLASS, sticky && DIRECTORY_STICKY_SCROLL_CLASS)
            : 'rounded-xl border border-border bg-card'
        }
      >
        {body}
      </div>
      {pagination === 'meta' && meta ? (
        <DirectoryPagination meta={meta} onPageChange={state.setPage} labels={labels} />
      ) : null}
    </section>
  );
}
