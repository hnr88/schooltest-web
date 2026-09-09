/**
 * Task 02 — the generic directory kit (`@/modules/directory`), portal-neutral.
 *
 * Shared types only; every value lives in the lib/hook/component files.
 * The kit is domain-free: rows, columns, actions and option labels arrive
 * through props from the consumer, and the only assumption it makes about a
 * row is that the consumer can derive a stable string key (the documentId,
 * in practice).
 */
import type { ReactNode } from 'react';
import type { LucideIcon } from 'lucide-react';

import type { OpsActionTarget, OpsHeaderCheckboxState } from '@/modules/ops/actions';

/** One selectable entry of a filter or sort control. */
export interface DirectoryOption {
  value: string;
  label: string;
}

/** The filter slice of the URL state: filter key -> selected option value. */
export type DirectoryFilterValues = Record<string, string>;

/** The URL-backed directory state (before it becomes query params). */
export interface DirectoryUrlState {
  q: string;
  filters: DirectoryFilterValues;
  sort: string;
  page: number;
}

/** Where the derived params are applied: the consumer's endpoint or its loaded array. */
export type DirectoryMode = 'server' | 'client';

/**
 * One filter control; in `server` mode the endpoint applies it, in `client`
 * mode the consumer's predicate does. `options` MUST start with the sentinel
 * option (`DIRECTORY_ALL` value) meaning "not filtered" — the same shape
 * OpsSchoolsFilters already renders, so adoption is mechanical.
 */
export interface DirectoryFilterDef {
  /** URL param name and state key (e.g. `state`, `sector`). */
  key: string;
  label: string;
  options: readonly DirectoryOption[];
}

/** The sorts the endpoint serves, offered in the sort select. */
export interface DirectorySortDef {
  /** The value written to the server `sort` param (e.g. `name:asc`). */
  value: string;
  label: string;
}

/** A sortable column toggles between these two server sort values. */
export interface DirectorySortValues {
  asc: string;
  desc: string;
}

export interface DirectoryColumnDef<Row> {
  key: string;
  header: string;
  cell: (row: Row) => ReactNode;
  sortable?: boolean;
  sortValues?: DirectorySortValues;
  /** Extra classes for the header AND body cells of this column. */
  className?: string;
}

/** One row action: every action lives in the ⋯ menu; up to two `quick` ones also render inline. */
export interface DirectoryRowAction<Row> {
  label: string;
  onSelect: (row: Row) => void;
  destructive?: boolean;
  /** Also render inline via RowActionsCluster (max two per row); needs `icon`, otherwise menu-only. */
  quick?: boolean;
  /** The inline quick-action icon. */
  icon?: LucideIcon;
  /** Declared mutating action — task 03's action-kit gate consumes this flag; never inferred from the label (D-20). */
  write?: boolean;
}

/** One bulk action, offered on the current selection. */
export interface DirectoryBulkAction {
  label: string;
  /** Receives the selected targets in page order — kind + documentId, not names. */
  onRun: (selectedTargets: readonly OpsActionTarget[]) => void;
  destructive?: boolean;
  /** Declared mutating action — the action-kit gate consumes this flag (D-20). */
  write?: boolean;
}

/** The pagination block every versioned directory serves as `meta.pagination`. */
export interface DirectoryMeta {
  page: number;
  pageSize: number;
  pageCount: number;
  total: number;
}

/**
 * The params a consumer spreads into its query: the server contract shape
 * (`q`, filters, `sort`, `page`, `pageSize`). Object identity changes only
 * when a value changes, so it is safe as a react-query query key fragment.
 */
export interface DirectoryQueryParams {
  q?: string;
  filters: Record<string, string>;
  sort: string;
  page: number;
  pageSize: number;
}

/**
 * Consumer-overridable copy. The kit ships English defaults because its scope
 * is this folder only; the adopting surface task owns the translations and
 * passes them here (the Ops.schools pattern: `useTranslations` above, props
 * below).
 */
export interface DirectoryLabels {
  searchPlaceholder: string;
  searchLabel: string;
  filtersLabel: string;
  sortLabel: string;
  clearFilters: string;
  paginationLabel: string;
  previous: string;
  next: string;
  rowMenuLabel: string;
  selectAllLabel: string;
  selectRowLabel: (rowKey: string) => string;
  showingCount: (values: { showing: number; total: number }) => string;
  pageCount: (values: { page: number; pageCount: number; total: number }) => string;
  /** Noun for the bulk bar's count line, e.g. 'school' (the bar pluralises). */
  selectedEntityNoun: string;
  emptyNoneTitle: string;
  emptyNoneDescription: string;
  emptyNoMatchesTitle: string;
  emptyNoMatchesDescription: string;
  errorTitle: string;
  errorStaleBanner: string;
  errorDescription: string;
  retry: string;
  loadingLabel: string;
}

/**
 * The slice of a react-query result the table renders from. Structurally
 * typed so the consumer passes its query object straight through without this
 * module importing a react-query version.
 */
export interface DirectoryQueryStatus {
  isPending: boolean;
  isError: boolean;
  isFetching: boolean;
  refetch: () => void;
}

export interface UseDirectoryStateOptions {
  filters: readonly DirectoryFilterDef[];
  sorts: readonly DirectorySortDef[];
  defaultSort: string;
  /** Server pageSize; clamped into the documented 1..200 band. */
  pageSize?: number;
  /**
   * Where the derived params are applied (D-KIT-MODE). `server` (default):
   * the consumer's query applies them and the endpoint answers an out-of-range
   * page (400 — never a silent clamp). `client`: the consumer reduces its
   * loaded array with `applyClientDirectoryMode`, which clamps an out-of-range
   * page to the last one. Same props, same URL params, same states either way.
   */
  mode?: DirectoryMode;
}

/** What useDirectoryState hands the consumer and the table. */
export interface DirectoryStateApi {
  /** What the consumer's query consumes (and keys its cache with). */
  params: DirectoryQueryParams;
  /** The mode this state was created with; the consumer/table branches on it. */
  mode: DirectoryMode;
  /** The search box's live text; URL/state follow the debounced value. */
  searchInput: string;
  setSearchInput: (raw: string) => void;
  setFilter: (key: string, rawValue: string) => void;
  setSort: (rawSort: string) => void;
  setPage: (page: number) => void;
  clearFilters: () => void;
  hasActiveControls: boolean;
}

/**
 * Consumer wiring for `client` mode (`lib/client-mode.ts`). Every behaviour
 * the server would own — searchable text, filter semantics, sort order — is
 * supplied here, so the kit stays domain-free.
 */
export interface DirectoryClientConfig<Row> {
  /** The row's searchable text; `q` matches case-insensitively against it. */
  searchText?: (row: Row) => readonly string[];
  /** Per-filter-key predicate; a key without one passes every row through. */
  filterPredicates?: Readonly<Record<string, (row: Row, value: string) => boolean>>;
  /** Per-sort-value comparator; a sort without one keeps the loaded order. */
  comparators?: Readonly<Record<string, (a: Row, b: Row) => number>>;
}

/** The client-mode page window plus the synthesised meta (`total` = filtered length). */
export interface DirectoryClientResult<Row> {
  rows: Row[];
  meta: DirectoryMeta;
}

/**
 * Row selection for the table. This is the task 05 action kit's
 * `useOpsSelection` ENGINE re-exposed in row ergonomics — page-scoped,
 * capped, and reset when the scope changes — composed, never reimplemented
 * (house rule 1). "N selected" means the rows the operator can see and will
 * actually dispatch on, never a cross-page accumulator behind the filters.
 */
export interface DirectorySelectionApi<Row> {
  count: number;
  /** True when the selection cap stopped the selection growing. */
  atCap: boolean;
  headerState: OpsHeaderCheckboxState;
  /** The selected targets in page order — what bulk actions dispatch on. */
  targets: OpsActionTarget[];
  isSelected: (row: Row) => boolean;
  toggleRow: (row: Row) => void;
  toggleAllOnPage: () => void;
  clear: () => void;
}

/* ── teacher/01 · the layout axis (U-05, U-11, U-44) ──────────────────────────
 * SHARED-LAYER §L-layout and §L-rownav. `layout` changes the BODY and nothing
 * else — same toolbar, filters, sort, pager, states, URL sync and selection in
 * every layout. R-38: this file is appended to one task per wave; this is
 * wave 1's append. Task 04 (wave 2) is what teaches `DirectoryTable` to look
 * these up — it owns that component, this task owns the axis itself.
 */

/** §L-layout's four-member union. `table` is the default, so a-11y and sort semantics are the default too. */
export type DirectoryLayout = 'table' | 'rows' | 'cards' | 'tiles';

/**
 * Grouping, legal in EVERY layout: a full-width heading row under `table`,
 * a `<section><h3>` otherwise. `heading` is copy by prop — the kit never reads
 * a catalogue (R-15).
 */
export interface DirectoryGroupDef<Row> {
  key: (row: Row) => string;
  heading: (groupKey: string, count: number) => string;
  /** Fixed group order; keys not listed follow it, in first-seen order, stably. */
  order?: readonly string[];
}

/**
 * What `renderRow` receives. Derived in ONE place — `lib/directory-row-api.ts` —
 * so a `<tr>` and a tile can never compute key, selection or the gated action
 * lists differently.
 */
export interface DirectoryRowApi<Row> {
  key: string;
  selected: boolean;
  onToggleSelect: () => void;
  /** Every action, already gated by the action kit's write gate. */
  actions: readonly DirectoryRowAction<Row>[];
  /** The inline shortcut list, capped at two (ops/02's D-KIT-QUICK). */
  quickActions: readonly DirectoryRowAction<Row>[];
  /** True on the final row OF ITS GROUP — not merely of the page. */
  last: boolean;
}

/**
 * The layout/body pairing, enforced by the TYPE rather than a runtime warning:
 * `columns` is required for `table` and `renderRow` for the other three, and
 * the unused one is `never` so passing both is a compile error.
 */
export type DirectoryLayoutProps<Row> =
  | {
      layout?: 'table';
      columns: readonly DirectoryColumnDef<Row>[];
      renderRow?: never;
    }
  | {
      layout: Exclude<DirectoryLayout, 'table'>;
      renderRow: (row: Row, api: DirectoryRowApi<Row>) => ReactNode;
      columns?: never;
    };

/**
 * §L-rownav. `rowHref` makes the first column an anchor; `onRowSelect` renders
 * a button there instead. Passing BOTH is a type error, and passing neither is
 * the default and correct case. Never `onClick` on a `<tr>`.
 */
export type DirectoryRowNavProps<Row> =
  | { rowHref?: (row: Row) => string; onRowSelect?: never }
  | { onRowSelect?: (row: Row) => void; rowHref?: never };

/**
 * U-11. `getRowKey` is the row identity at every read site and defaults to
 * `selectionKey(getRowTarget(row))`, so no ops surface changes. `getRowTarget`
 * is therefore only REQUIRED while the surface is selectable — which is what
 * makes it optional for the `selection:'none'` surfaces that never had a target
 * to give.
 */
export type DirectoryRowTargetProps<Row> =
  | { selectable: true; getRowTarget: (row: Row) => OpsActionTarget }
  | { selectable?: false; getRowTarget?: (row: Row) => OpsActionTarget };
