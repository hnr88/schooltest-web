/**
 * Task 04 — the generic ops directory kit (`@/modules/ops/directory`).
 *
 * Shared types only; every value lives in the lib/hook/component files.
 * The kit is domain-free: rows, columns, actions and option labels arrive
 * through props from the consumer (tasks 07, 13, 18, 22, 25), and the only
 * assumptions it makes about a row is that the consumer can derive a stable
 * string key (the documentId, in practice).
 */
import type { ReactNode } from 'react';

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

/**
 * One server-applied filter. `options` MUST start with the sentinel option
 * (`DIRECTORY_ALL` value) meaning "not filtered" — the same shape
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

/** One entry of a row's dropdown menu. */
export interface DirectoryRowAction<Row> {
  label: string;
  onSelect: (row: Row) => void;
  destructive?: boolean;
}

/** One bulk action, offered on the current selection. */
export interface DirectoryBulkAction {
  label: string;
  onRun: (selectedKeys: readonly string[]) => void;
  destructive?: boolean;
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
  selectedCount: (count: number) => string;
  clearSelection: string;
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
   * Live pageCount from the query's meta. When a deletion empties the current
   * page the state clamps to the last valid page and keeps every filter.
   */
  pageCount?: number;
}

/** What useOpsDirectoryState hands the consumer and the table. */
export interface DirectoryStateApi {
  /** What the consumer's query consumes (and keys its cache with). */
  params: DirectoryQueryParams;
  /** The search box's live text; URL/state follow the debounced value. */
  searchInput: string;
  setSearchInput: (raw: string) => void;
  setFilter: (key: string, rawValue: string) => void;
  setSort: (rawSort: string) => void;
  setPage: (page: number) => void;
  clearFilters: () => void;
  hasActiveControls: boolean;
}

/** Row-selection state for the table (page-scoped header, cross-page keys). */
export interface OpsDirectorySelectionApi {
  selectedKeys: readonly string[];
  selectedCount: number;
  isSelected: (key: string) => boolean;
  toggleRow: (key: string) => void;
  /** Header-checkbox semantics: all-or-nothing over the CURRENT page's rows. */
  allOnPageSelected: boolean;
  someOnPageSelected: boolean;
  togglePage: () => void;
  clearSelection: () => void;
}
