/**
 * Task 04 — URL <-> directory-state mapping, pure and generic.
 *
 * Mirrors the schools pattern (schools-filter.lib.ts): a state that differs
 * from the canonical default is written to the query string, everything else
 * is omitted. Parsing is FAIL-OPEN to documented defaults — a hand-edited or
 * stale URL degrades to "All" / page 1 / the default sort, never to a filter
 * that hides every row. (The API side of the same rule is stricter: malformed
 * API params are a 400 — ops-pagination.ts.)
 */
import {
  DIRECTORY_ALL,
  DIRECTORY_PARAMS,
  DIRECTORY_PAGE_SIZE_DEFAULT,
  DIRECTORY_PAGE_SIZE_MAX,
  DIRECTORY_Q_MAX,
} from '../constants/ops-directory.constants';
import type {
  DirectoryFilterDef,
  DirectoryFilterValues,
  DirectoryQueryParams,
  DirectoryUrlState,
} from '../types/ops-directory.types';

export type { DirectoryFilterValues, DirectoryUrlState };

export function clampPage(raw: number, pageCount?: number): number {
  if (!Number.isInteger(raw) || raw < 1) return 1;
  if (pageCount !== undefined && pageCount > 0 && raw > pageCount) return pageCount;
  return raw;
}

/** The canonical default every surface resets to ("Clear filters"). */
export function defaultUrlState(defaultSort: string): DirectoryUrlState {
  return { q: '', filters: {}, sort: defaultSort, page: 1 };
}

export function isDefaultUrlState(state: DirectoryUrlState, defaultSort: string): boolean {
  return (
    state.q === '' &&
    state.page === 1 &&
    state.sort === defaultSort &&
    Object.values(state.filters).every((value) => value === DIRECTORY_ALL)
  );
}

/** Trims to the server's `q` rule: literal trimmed text, bounded length. */
export function sanitizeQuery(raw: string): string {
  return raw.trim().slice(0, DIRECTORY_Q_MAX);
}

/**
 * A filter value that is not one of the def's options (and not the sentinel)
 * degrades to the sentinel. Unknown filter KEYS in the URL are kept as-is so a
 * consumer's own extra params survive a round-trip untouched.
 */
function parseFilterValue(options: readonly string[], raw: string | null): string {
  if (raw === null) return DIRECTORY_ALL;
  return options.includes(raw) ? raw : DIRECTORY_ALL;
}

export function parseDirectoryParams(
  params: URLSearchParams,
  filters: readonly DirectoryFilterDef[],
  defaultSort: string,
): DirectoryUrlState {
  const rawPage = Number(params.get(DIRECTORY_PARAMS.page));
  const state: DirectoryUrlState = {
    q: sanitizeQuery(params.get(DIRECTORY_PARAMS.q) ?? ''),
    filters: {},
    sort: defaultSort,
    page: clampPage(rawPage),
  };
  for (const def of filters) {
    state.filters[def.key] = parseFilterValue(
      def.options.map((option) => option.value),
      params.get(def.key),
    );
  }
  return state;
}

export function serializeDirectoryParams(
  state: DirectoryUrlState,
  defaultSort: string,
): URLSearchParams {
  const params = new URLSearchParams();
  if (state.q !== '') params.set(DIRECTORY_PARAMS.q, state.q);
  for (const [key, value] of Object.entries(state.filters)) {
    if (value !== DIRECTORY_ALL) params.set(key, value);
  }
  if (state.sort !== defaultSort) params.set(DIRECTORY_PARAMS.sort, state.sort);
  if (state.page > 1) params.set(DIRECTORY_PARAMS.page, String(state.page));
  return params;
}

/**
 * The server request shape built from the URL state. This object is what a
 * consumer spreads into its query key, so its identity must change only when
 * a VALUE changes — the state hook memoizes on a stable string form.
 */
export function toQueryParams(
  state: DirectoryUrlState,
  pageSize: number,
): DirectoryQueryParams {
  const activeFilters: Record<string, string> = {};
  for (const [key, value] of Object.entries(state.filters)) {
    if (value !== DIRECTORY_ALL) activeFilters[key] = value;
  }
  return {
    q: state.q === '' ? undefined : state.q,
    filters: activeFilters,
    sort: state.sort,
    page: state.page,
    pageSize,
  };
}

/** Stable identity string for memo deps / query keys. */
export function queryParamsIdentity(params: DirectoryQueryParams): string {
  return JSON.stringify([params.q, params.filters, params.sort, params.page, params.pageSize]);
}

export { DIRECTORY_PAGE_SIZE_DEFAULT, DIRECTORY_PAGE_SIZE_MAX };
