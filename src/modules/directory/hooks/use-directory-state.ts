'use client';

/**
 * Task 02 — the headless directory state. The URL is the store (the
 * use-schools-filter pattern): every control writes the full serialized state
 * with router.replace (filtering is not navigation history), and the parsed
 * URL is the single source the query params derive from.
 *
 * The hook is domain-free: which filters and sorts exist is the consumer's
 * configuration; rows never pass through here.
 */
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

import { usePathname } from '@/i18n/navigation';
import { useDebouncedValue } from '@/modules/dashboard';

import {
  DIRECTORY_ALL,
  DIRECTORY_PAGE_SIZE_DEFAULT,
  DIRECTORY_PAGE_SIZE_MAX,
  DIRECTORY_SEARCH_DEBOUNCE_MS,
} from '../constants/directory.constants';
import {
  clampPage,
  defaultUrlState,
  isDefaultUrlState,
  parseDirectoryParams,
  preserveNamedParams,
  sanitizeQuery,
  serializeDirectoryParams,
  toQueryParams,
} from '../lib/directory-url';
import type {
  DirectoryFilterDef,
  DirectoryLayout,
  DirectoryQueryParams,
  DirectorySortDef,
  DirectoryStateApi,
  DirectoryUrlState,
  UseDirectoryStateOptions,
} from '../types/directory.types';

/**
 * ops/34 — `paramPrefix` names this instance's slice of the query string, so
 * one page can host SEVERAL kit lists (the two ranked watch lists of the
 * Progress tab) without their `q`/`sort`/`page` colliding. Declared here
 * rather than on the shared options interface because the prefix is a property
 * of THIS hook's URL mechanics and nothing else in the kit reads it; the
 * shared interface stays untouched and every existing consumer compiles and
 * behaves unchanged.
 */
export interface UseDirectoryStatePrefixedOptions extends UseDirectoryStateOptions {
  /** Prepended to every URL param this instance reads/writes (`watch-gains-q=`…). */
  paramPrefix?: string;
  /**
   * school-admin/03 (U-15 D-b) — a new search lands on page 1. Default `true`.
   * `setFilter` and `setSort` already reset the page; the debounced-search
   * effect did not, which left page 4 pointing past a narrowed result set and
   * the server answering 400 (ops-pagination.ts:57-59).
   */
  resetPageOnSearch?: boolean;
  /**
   * school-admin/03 (U-15 D-c) — params the kit must carry across its own
   * writes (`['tab']` for the four tabbed detail screens). Only these named
   * keys survive; see `preserveNamedParams`.
   */
  preserveParams?: readonly string[];
  /**
   * school-admin/03 (D-25) — the SURFACE's page-size ceiling. Two ceilings
   * exist on one product: `GET /schools/me/children` is 25/max 100 with a 400
   * above the cap (school/controllers/students.ts:24-41) while ops-pagination
   * is 25/200. The kit must not assume 200, so the surface states its own.
   * Defaults to `DIRECTORY_PAGE_SIZE_MAX` — every existing consumer unchanged.
   */
  maxPageSize?: number;
}

/** The kit's layout union, at runtime — the URL carries it as a bare string. */
const DIRECTORY_LAYOUTS: readonly DirectoryLayout[] = ['table', 'rows', 'cards', 'tiles'];

/**
 * Narrows the URL's layout string to the union — never a cast, which would
 * admit a value the kit's type-enforced layout/scenario pairing does not
 * handle. A non-member fails open to the surface's default.
 */
function isDirectoryLayout(value: string): value is DirectoryLayout {
  return DIRECTORY_LAYOUTS.some((layout) => layout === value);
}

export function useDirectoryState(options: UseDirectoryStatePrefixedOptions): DirectoryStateApi {
  const {
    filters,
    sorts,
    defaultSort,
    mode = 'server',
    paramPrefix = '',
    layouts,
    defaultLayout,
    resetPageOnSearch = true,
    preserveParams,
  } = options;
  // D-25 — the ceiling is the SURFACE's, not the kit's. 200 only as the default.
  const maxPageSize = Math.max(
    1,
    Math.trunc(options.maxPageSize ?? DIRECTORY_PAGE_SIZE_MAX),
  );
  // ops/34 — `variant: 'none'` is the UNBOUNDED-history idiom (the C-TS-2 past
  // sessions panel): client mode renders the WHOLE loaded array and the pager
  // stays hidden (DirectoryPagination already nulls that arm). The state half
  // of the idiom lives here because the clamp below would cap any finite
  // number at the surface's ceiling — an unbounded history needs a pageSize no
  // clamp can reach. A server-mode surface cannot ask for it: the wire
  // contract caps pageSize at 200, so `'none'` there is a loud config error
  // rather than a pager-less surface silently truncating at the cap.
  const unbounded = options.pagination?.variant === 'none';
  if (unbounded && mode !== 'client')
    throw new Error(
      `[directory] pagination.variant 'none' renders the whole loaded array and is client-mode only — a '${mode}'-mode surface must page through the server contract`,
    );
  const pageSize = unbounded
    ? Number.POSITIVE_INFINITY
    : options.pageSize === undefined
      ? Math.min(DIRECTORY_PAGE_SIZE_DEFAULT, maxPageSize)
      : Math.min(Math.max(1, Math.trunc(options.pageSize)), maxPageSize);

  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  // ops/34 — the allowed sort values, for the URL sort's round-trip validation.
  const sortValues = useMemo(() => sorts.map((option) => option.value), [sorts]);

  // Fail-open parse; a filter def added later simply starts at the sentinel.
  const urlState = useMemo(
    () => parseDirectoryParams(searchParams, filters, defaultSort, paramPrefix, layouts, defaultLayout, sortValues),
    [searchParams, filters, defaultSort, paramPrefix, layouts, defaultLayout, sortValues],
  );

  const [searchInput, setSearchInput] = useState(urlState.q);
  const debouncedInput = useDebouncedValue(searchInput, DIRECTORY_SEARCH_DEBOUNCE_MS);
  const q = sanitizeQuery(debouncedInput);

  // Last query string this hook wrote (null before mount). The debounced-search
  // effect re-runs whenever searchParams changes identity after a replace; the
  // guard turns those re-runs into no-ops, which is what lets the effect list
  // every dependency honestly — no lint suppression.
  const lastWritten = useRef<string | null>(null);

  // Stable identity for the preserve list so an inline array literal from a
  // consumer cannot change `writeUrl`'s identity on every render.
  const preserveKey = (preserveParams ?? []).join(',');
  const preserveKeys = useMemo(
    () => (preserveKey === '' ? [] : preserveKey.split(',')),
    [preserveKey],
  );

  /**
   * The ONE query-string builder. Both the writer and the debounced-search
   * effect's idempotence check go through it: if the effect compared a string
   * built WITHOUT the preserved keys against a `lastWritten` built WITH them,
   * every run would look like a change and replace the URL in a loop.
   */
  const buildQs = useCallback(
    (next: DirectoryUrlState) =>
      // U-15 D-c — the surface's own params ride along. The kit's own keys are
      // written first and are never overwritten by the copy.
      preserveNamedParams(
        serializeDirectoryParams(next, defaultSort, paramPrefix, defaultLayout),
        searchParams,
        preserveKeys,
      ).toString(),
    [defaultSort, paramPrefix, defaultLayout, searchParams, preserveKeys],
  );

  const writeUrl = useCallback(
    (next: DirectoryUrlState) => {
      const qs = buildQs(next);
      lastWritten.current = qs;
      router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
    },
    [router, pathname, buildQs],
  );

  // The parsed URL with the SETTLED search overlaid — the state every control
  // reads and writes through.
  const state: DirectoryUrlState = useMemo(
    () => ({ ...urlState, q }),
    [urlState, q],
  );

  // Once the settled search changes, it lands in the URL alongside the other
  // controls. On mount the URL is adopted as-is (the input initialised from it).
  useEffect(() => {
    const next = parseDirectoryParams(searchParams, filters, defaultSort, paramPrefix, layouts, defaultLayout, sortValues);
    // U-15 D-b — a CHANGED search is a new result set, so it belongs on page 1.
    // `setFilter` and `setSort` already do this; this effect did not, which left
    // page 4 pointing past a narrowed set and the server answering 400
    // (ops-pagination.ts:57-59). Compared BEFORE `q` is overlaid: `next.q` is
    // still the URL's settled search, so an unrelated param change (a layout
    // swap, a preserved `tab`) never resets the page.
    const searchChanged = next.q !== q;
    if (resetPageOnSearch && searchChanged) next.page = 1;
    next.q = q;
    const qs = buildQs(next);
    if (lastWritten.current === null) {
      lastWritten.current = qs;
      return;
    }
    if (qs === lastWritten.current) return;
    writeUrl(next);
  }, [q, searchParams, filters, defaultSort, paramPrefix, layouts, defaultLayout, sortValues, resetPageOnSearch, buildQs, writeUrl]);

  const setFilter = useCallback(
    (key: string, rawValue: string) => {
      const def = filters.find((candidate) => candidate.key === key);
      const allowed = def ? def.options.map((option) => option.value) : [DIRECTORY_ALL];
      const value = allowed.includes(rawValue) ? rawValue : DIRECTORY_ALL;
      // Any result-set change (applying or clearing a filter) belongs to page 1.
      writeUrl({ ...state, filters: { ...state.filters, [key]: value }, page: 1 });
    },
    [filters, state, writeUrl],
  );

  const setSort = useCallback(
    (rawSort: string) => {
      const sort = sorts.some((option) => option.value === rawSort) ? rawSort : defaultSort;
      writeUrl({ ...state, sort, page: 1 });
    },
    [sorts, state, defaultSort, writeUrl],
  );

  const setPage = useCallback(
    (page: number) => {
      writeUrl({ ...state, page: clampPage(page) });
    },
    [state, writeUrl],
  );

  // teacher/06 — the layout toggle. A view choice, not a filter: the page and
  // the controls stay exactly where they are.
  const setLayout = useCallback(
    (rawLayout: string) => {
      const value =
        layouts !== undefined && isDirectoryLayout(rawLayout) && layouts.includes(rawLayout)
          ? rawLayout
          : (defaultLayout ?? '');
      writeUrl({ ...state, layout: value });
    },
    [layouts, defaultLayout, state, writeUrl],
  );

  const clearFilters = useCallback(() => {
    setSearchInput('');
    // The layout choice survives a clear — it is the view, not a filter.
    writeUrl({ ...defaultUrlState(defaultSort), layout: state.layout });
  }, [defaultSort, state.layout, writeUrl]);

  // Value-stable identity for the consumer's query key comes from the memo on
  // `state` (which only changes when a parsed value changes) plus pageSize.
  const params: DirectoryQueryParams = useMemo(
    () => toQueryParams(state, pageSize),
    [state, pageSize],
  );

  return {
    params,
    mode,
    layout:
      state.layout !== '' && isDirectoryLayout(state.layout)
        ? state.layout
        : (defaultLayout ?? 'table'),
    setLayout,
    searchInput,
    setSearchInput,
    setFilter,
    setSort,
    setPage,
    clearFilters,
    hasActiveControls: !isDefaultUrlState(state, defaultSort),
  };
}
