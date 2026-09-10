/**
 * Task 02 — URL <-> directory-state mapping, pure and generic.
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
} from '../constants/directory.constants';
import type {
  DirectoryFilterDef,
  DirectoryFilterValues,
  DirectoryLayout,
  DirectoryQueryParams,
  DirectoryUrlState,
} from '../types/directory.types';

export type { DirectoryFilterValues, DirectoryUrlState };

export function clampPage(raw: number, pageCount?: number): number {
  if (!Number.isInteger(raw) || raw < 1) return 1;
  if (pageCount !== undefined && pageCount > 0 && raw > pageCount) return pageCount;
  return raw;
}

/**
 * The canonical default every surface resets to ("Clear filters"). `layout` is
 * deliberately NOT an active control — a tiles ⇄ list swap is a view choice,
 * so neither `hasActiveControls` nor "Clear filters" snaps the view back.
 */
export function defaultUrlState(defaultSort: string): DirectoryUrlState {
  return { q: '', filters: {}, sort: defaultSort, page: 1, layout: '' };
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

/**
 * ops/34 — `prefix` namespaces every param this surface reads and writes, so
 * one page can host SEVERAL kit instances (two ranked watch lists, say) without
 * their `q`/`sort`/`page` colliding in the one query string. Empty (default) is
 * today's behaviour byte-for-byte; filters are prefixed with their def key the
 * same way (`<prefix><key>`).
 *
 * teacher/06 — when `layouts` is configured, the (prefixed) `layout` param
 * carries the URL's body choice, validated fail-open to `defaultLayout`;
 * unconfigured surfaces read and write no layout param at all.
 */
export function parseDirectoryParams(
  params: URLSearchParams,
  filters: readonly DirectoryFilterDef[],
  defaultSort: string,
  prefix = '',
  layouts?: readonly DirectoryLayout[],
  defaultLayout?: DirectoryLayout,
  sorts?: readonly string[],
): DirectoryUrlState {
  const rawPage = Number(params.get(`${prefix}${DIRECTORY_PARAMS.page}`));
  const rawLayout = params.get(`${prefix}${DIRECTORY_PARAMS.layout}`);
  const rawSort = params.get(`${prefix}${DIRECTORY_PARAMS.sort}`);
  const state: DirectoryUrlState = {
    q: sanitizeQuery(params.get(`${prefix}${DIRECTORY_PARAMS.q}`) ?? ''),
    filters: {},
    // ops/34 — the sort round-trips (the schools-filter pattern this file
    // mirrors reads it back with `oneOf`): a value on the surface's sort list
    // survives a reload, anything else degrades to the default.
    sort:
      rawSort !== null && rawSort !== '' && (sorts === undefined || sorts.includes(rawSort))
        ? rawSort
        : defaultSort,
    page: clampPage(rawPage),
    layout:
      layouts !== undefined && rawLayout !== null && layouts.includes(rawLayout as DirectoryLayout)
        ? rawLayout
        : (defaultLayout ?? ''),
  };
  for (const def of filters) {
    state.filters[def.key] = parseFilterValue(
      def.options.map((option) => option.value),
      params.get(`${prefix}${def.key}`),
    );
  }
  return state;
}

export function serializeDirectoryParams(
  state: DirectoryUrlState,
  defaultSort: string,
  prefix = '',
  defaultLayout?: DirectoryLayout,
): URLSearchParams {
  const params = new URLSearchParams();
  if (state.q !== '') params.set(`${prefix}${DIRECTORY_PARAMS.q}`, state.q);
  for (const [key, value] of Object.entries(state.filters)) {
    if (value !== DIRECTORY_ALL) params.set(`${prefix}${key}`, value);
  }
  if (state.sort !== defaultSort) params.set(`${prefix}${DIRECTORY_PARAMS.sort}`, state.sort);
  if (state.page > 1) params.set(`${prefix}${DIRECTORY_PARAMS.page}`, String(state.page));
  if (defaultLayout !== undefined && state.layout !== '' && state.layout !== defaultLayout) {
    params.set(`${prefix}${DIRECTORY_PARAMS.layout}`, state.layout);
  }
  return params;
}

/**
 * school-admin/03 (U-15 D-c) — carry a surface's own params across a kit write.
 *
 * `serializeDirectoryParams` deliberately builds a FRESH URLSearchParams so a
 * stale param cannot survive a control change. That is also why the four tabbed
 * detail screens had to rescue `?tab=` by hand (OpsSchoolTables.tsx:50-56). This
 * copies only the NAMED keys back: copying everything would resurrect exactly
 * the stale params the fresh build exists to drop.
 *
 * Pure, and it never overwrites a key the kit itself just wrote — the kit's own
 * state stays authoritative for the params it owns.
 */
export function preserveNamedParams(
  target: URLSearchParams,
  /** Structural, so next/navigation's ReadonlyURLSearchParams fits without a cast. */
  source: { get(name: string): string | null },
  keys: readonly string[],
): URLSearchParams {
  for (const key of keys) {
    if (target.has(key)) continue;
    const value = source.get(key);
    if (value !== null && value !== '') target.set(key, value);
  }
  return target;
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
