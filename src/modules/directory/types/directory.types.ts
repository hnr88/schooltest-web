/**
 * Task 02 — the generic directory kit (`@/modules/directory`), portal-neutral.
 *
 * Shared types only; every value lives in the lib/hook/component files.
 * The kit is domain-free: rows, columns, actions and option labels arrive
 * through props from the consumer, and the only assumption it makes about a
 * row is that the consumer can derive a stable string key (the documentId,
 * in practice).
 */
import type { HTMLAttributes, ReactNode } from 'react';
import type { LucideIcon } from 'lucide-react';
import type { z } from 'zod';

import type { OpsActionTarget, OpsHeaderCheckboxState } from '@/modules/ops/actions';

/**
 * ops/34 — HTML attributes plus the `data-*` markers a migrating surface pins
 * on its rows or its body region (row slot, status flag, aria labelling). The
 * index signature is what lets a `{ 'data-slot': … }` literal typecheck;
 * booleans serialise the way React renders `data-*` ("true"/"false").
 */
export type DirectoryMarkupAttrs<T extends HTMLElement> = HTMLAttributes<T> &
  Record<`data-${string}`, string | boolean | undefined>;

/** One selectable entry of a filter or sort control. */
export interface DirectoryOption {
  value: string;
  label: string;
}

/**
 * §L-filters (U-07) — one filter's value. The string member is every kind's
 * URL form; the other members are what a kind's predicate decodes it to
 * (`lib/directory-filter-kinds.ts` owns the only codecs).
 */
export type DirectoryFilterValue =
  | string
  | readonly string[]
  | boolean
  | { from?: string; to?: string };

/**
 * §L-filters — widened from `Record<string, string>` ADDITIVELY: the URL and
 * wire layers keep the string serialisation (`DirectoryUrlState.filters` and
 * `DirectoryQueryParams.filters` stay string-keyed), so sentinel elision and
 * the fail-open parse are untouched; widened values live at the def and
 * predicate boundary.
 */
export type DirectoryFilterValues = Record<string, DirectoryFilterValue>;

/** The URL-backed directory state (before it becomes query params). */
export interface DirectoryUrlState {
  q: string;
  /** The URL slice: one string per filter key (see `DirectoryFilterValues`). */
  filters: Record<string, string>;
  sort: string;
  page: number;
  /** The layout axis's URL value; `''` = the surface configured none (default body). */
  layout: string;
}

/** Where the derived params are applied: the consumer's endpoint or its loaded array. */
export type DirectoryMode = 'server' | 'client';

/**
 * §L-filters (U-07) — the eight filter kinds. `select` is the kind the kit
 * shipped with; the other seven absorb the one implementation each that
 * already existed somewhere in the app (the §L-filters anchor lists them).
 */
export type DirectoryFilterKind =
  | 'select'
  | 'chips'
  | 'counted'
  | 'toggle'
  | 'multi'
  | 'text'
  | 'dateRange'
  | 'numberRange';

/**
 * One filter control; in `server` mode the endpoint applies it, in `client`
 * mode the consumer's predicate does. `options` MUST start with the sentinel
 * option (`DIRECTORY_ALL` value) meaning "not filtered" — the same shape
 * OpsSchoolsFilters already renders, so adoption is mechanical.
 */
export interface DirectoryFilterDef<Row = unknown> {
  /** URL param name and state key (e.g. `state`, `sector`). */
  key: string;
  label: string;
  /** §L-filters (U-07) — `undefined` IS the select kind: exactly today's render. */
  kind?: DirectoryFilterKind;
  options: readonly DirectoryOption[];
  /** `kind: 'counted'` ONLY — whole-dataset tallies from `meta`, never client-derived (D-02). */
  counts?: Readonly<Record<string, number>>;
  /** Client mode; required beyond a plain equality on `key`, forbidden in server mode. */
  predicate?: (row: Row, value: DirectoryFilterValue) => boolean;
  /** Held back from the toolbar while the state keeps the full set (the visibleFilters rule). */
  hidden?: boolean;
}

/**
 * §L-filters (U-45) — the same def while its `options` (fetched by the
 * SURFACE's second query) are still pending: the control renders disabled
 * with the sentinel shown and the URL value is preserved, never coerced.
 * A separate member rather than an optional `options?` on the def above, so
 * every non-pending reader (URL parse, state hook, chips unit) keeps its
 * non-optional contract until the state layer gains the pending-parse rule.
 */
export interface DirectoryPendingFilterDef<Row = unknown> {
  key: string;
  label: string;
  kind?: DirectoryFilterKind;
  options?: undefined;
  counts?: Readonly<Record<string, number>>;
  predicate?: (row: Row, value: DirectoryFilterValue) => boolean;
  hidden?: boolean;
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

/**
 * One bulk action, offered on the current selection. Generic over the surface's
 * row from teacher/05 (U-14, U-21): `Row` defaults to `unknown`, so an
 * existing consumer that declares no `eligible` compiles and behaves exactly
 * as before.
 */
export interface DirectoryBulkAction<Row = unknown> {
  label: string;
  /**
   * U-14 widened signature — receives the ELIGIBLE selected rows and their
   * targets, in page order, kind + documentId, never names. With no
   * `eligible` declared both arguments are the whole selection. Declared as a
   * method so a legacy one-argument handler remains assignable.
   */
  onRun(selectedRows: readonly Row[], selectedTargets: readonly OpsActionTarget[]): void;
  destructive?: boolean;
  /** Declared mutating action — the action-kit gate consumes this flag (D-20). */
  write?: boolean;
  /**
   * Synchronous, PRE-dispatch eligibility for the count label and the split
   * (`partitionSelection`). Distinct from `OpsActionDefinition.isEligible`,
   * which is async and re-checked before a retry. Undefined: every row.
   */
  eligible?: (row: Row) => boolean;
  /** R-15 copy by prop — read only when some selected rows were skipped. */
  skipLabel?: (skipped: number) => string;
}

/** The pagination block every versioned directory serves as `meta.pagination`. */
export interface DirectoryMeta {
  page: number;
  pageSize: number;
  pageCount: number;
  total: number;
}

/**
 * §L-pagination (U-16) — the pager a surface asks for; `steps` is today's default.
 * `none` (ops/34) is the UNBOUNDED-history idiom: client mode renders the WHOLE
 * loaded array — useDirectoryState resolves the state to an infinite pageSize
 * and DirectoryPagination renders no pager at all — so a growing history is
 * never truncated behind a pager. Server mode cannot be unbounded (the wire
 * contract caps pageSize at 200), so `'none'` there is a loud config error.
 */
export interface DirectoryPaginationDef {
  variant?: 'steps' | 'numbered' | 'none';
  pageSize?: number;
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
  /** teacher/06 — the layout toggle's group label. */
  layoutLabel: string;
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
  /** ops/14 — header-secondary fallback label (the design's "Export CSV"). */
  exportLabel?: string;
  /** ops/14 — header-primary fallback label (a contextual action needs a real one; this is the last resort). */
  primaryActionLabel?: string;
  /** ops/14 — the chips sentinel ("All") when a filter def ships an unlabelled sentinel option. */
  chipAllLabel?: string;
  /** school-admin/02 — the two field labels of the dateRange/numberRange kinds. */
  filterFrom?: string;
  filterTo?: string;
}

/**
 * The slice of a react-query result the table renders from. Structurally
 * typed so the consumer passes its query object straight through without this
 * module importing a react-query version.
 *
 * teacher/04 (U-46): `error`, `enabled`, `isPlaceholderData` and `polled` are
 * the four signals the ten-arm body machine reads. All four are OPTIONAL so
 * every existing consumer's query literal keeps compiling — `enabled` absent
 * means the query is not gated (`true`), the other three default to `false`.
 */
export interface DirectoryQueryStatus {
  isPending: boolean;
  isError: boolean;
  isFetching: boolean;
  refetch: () => void;
  /** U-13 — the raw error, so classifyQueryError becomes reachable (arms 2/3). */
  error?: unknown;
  /** U-46 — false => the query never ran; NOT loading (§L-states arm 0). */
  enabled?: boolean;
  /** U-46 — rows belong to the PREVIOUS params (§L-stale-vs-loading case 2). */
  isPlaceholderData?: boolean;
  /** U-46 — a background refetchInterval, never a user-triggered one (case 4). */
  polled?: boolean;
}

export interface UseDirectoryStateOptions {
  filters: readonly DirectoryFilterDef[];
  sorts: readonly DirectorySortDef[];
  defaultSort: string;
  /** Server pageSize; clamped into the documented 1..200 band. */
  pageSize?: number;
  /**
   * school-admin/02 — the U-16 handoff: the pager config a surface declares
   * for this list. The options object is the one config interface the types
   * file owns, so the member lands here under R-38; `variant` reaches the
   * pager when the table threads it through (proof/03.md's second line).
   */
  pagination?: DirectoryPaginationDef;
  /**
   * teacher/06 — the URL-backed layout axis (U-05). When `layouts` is provided,
   * the `layout` query param carries the chosen body across a reload, and
   * `layout`/`setLayout` drive the toolbar's toggle; the value is validated
   * against this set, fail-open to `defaultLayout`. Absent: no param is read or
   * written, and `layout` is the plain `'table'` default — every existing
   * consumer keeps its behaviour.
   */
  layouts?: readonly DirectoryLayout[];
  defaultLayout?: DirectoryLayout;
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
  /** The resolved body layout: the URL's choice, else `defaultLayout`, else `'table'`. */
  layout: DirectoryLayout;
  /** Swaps the body layout (URL-backed when the surface configured `layouts`). */
  setLayout: (rawLayout: string) => void;
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
  /**
   * teacher/05 — the selected ROWS in page order, capped: the same rows
   * `targets` names, without a reverse lookup by `kind:documentId`
   * (SHARED-LAYER §11.1 — one selection engine).
   */
  selectedRows: Row[];
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
 * teacher/06 — one segment of the toolbar's layout toggle (U-05): the body it
 * selects, its accessible name, and its icon. Rendered only when the consumer
 * passes `layoutOptions`.
 */
export interface DirectoryLayoutOption {
  value: DirectoryLayout;
  label: string;
  icon: LucideIcon;
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

/* ── ops/14 · the tab-body frame (ADD-ONLY appendix) ───────────────────────────
 * Everything here is OPTIONAL at the DirectoryTable boundary: with `header`,
 * `chipFilterKey` and `emptyCopy` omitted, a consumer renders exactly what it
 * rendered before these types existed. Anchors above are frozen; this appendix
 * is the only addition this task makes to the file.
 */

/** One header button, DirectoryRowAction-shaped so `write` reaches task 03's gate. */
export interface DirectoryHeaderAction {
  /** Falls back to the kit default ("Export CSV" for a secondary) when omitted. */
  label?: string;
  icon?: LucideIcon;
  onSelect: () => void;
  /** Declared mutating action — greyed and refusing in a read-only session. */
  write?: boolean;
}

/**
 * The design's tab-body header (`Ops Portal.dc.html:353-368`): an `<h2>` title,
 * a one-line summary, a secondary button (the Export) and an optional
 * contextual primary.
 */
export interface DirectoryHeaderDef {
  title: string;
  summary?: string;
  primary?: DirectoryHeaderAction;
  secondary?: DirectoryHeaderAction;
}

/** Per-surface copy for the empty (nothing-here) arm, overriding the kit default. */
export interface DirectoryEmptyCopy {
  title: string;
  body: string;
}

/* ── end ops/14 appendix ──────────────────────────────────────────────────── */

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

/* ── school-admin/02 · §L-modes (U-10) — the typed client-mode descriptor ──────
 * Both modes satisfy one contract: `server` sends listQueryParams and reads a
 * listEnvelope; `client` evaluates the SAME query schema in memory. The mapped
 * types are TOTAL — a client-mode surface can neither declare a predicate its
 * schema lacks nor omit one it has. `zod` is type-only here.
 */

/** The schema's filter keys: everything that is not one of the shared list params. */
export type FilterKeys<S extends z.ZodObject<z.ZodRawShape>> = Exclude<
  keyof z.infer<S>,
  'page' | 'pageSize' | 'q' | 'sort'
>;

/** The schema's sort values — a plain `z.string()` schema makes this an index signature. */
export type ListSortValue<S extends z.ZodObject<z.ZodRawShape>> = Extract<
  Exclude<z.infer<S>['sort'], undefined>,
  PropertyKey
>;

export interface ListPredicates<Row, S extends z.ZodObject<z.ZodRawShape>> {
  /** The row's searchable text; `q` matches case-insensitively against it. */
  q?: (row: Row) => readonly string[];
  /** `-?` — total over `FilterKeys<S>`: omitting one key is the compile error. */
  filters: { [K in FilterKeys<S>]-?: (row: Row, value: string) => boolean };
  /** Total over `ListSortValue<S>`: every server sort string owes a comparator. */
  sorts: { [V in ListSortValue<S>]: (a: Row, b: Row) => number };
}

/**
 * §L-modes — the mode discriminator. Server mode carries NO predicates at all
 * (`apply?: never` makes a supplied predicate the type error structurally,
 * not by freshness), which is §L-filters' own sentence: a predicate in server
 * mode is a silent lie about what the server returned.
 */
export type ListSource<Row, S extends z.ZodObject<z.ZodRawShape>> =
  | { mode: 'server'; apply?: never }
  | { mode: 'client'; rows: readonly Row[]; apply: ListPredicates<Row, S> };
