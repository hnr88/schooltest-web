'use client';

/**
 * Task 04 — the headless directory state. The URL is the store (the
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
} from '../constants/ops-directory.constants';
import {
  clampPage,
  defaultUrlState,
  isDefaultUrlState,
  parseDirectoryParams,
  sanitizeQuery,
  serializeDirectoryParams,
  toQueryParams,
} from '../lib/ops-directory-url';
import type {
  DirectoryFilterDef,
  DirectoryQueryParams,
  DirectorySortDef,
  DirectoryStateApi,
  DirectoryUrlState,
  UseDirectoryStateOptions,
} from '../types/ops-directory.types';

export function useOpsDirectoryState(options: UseDirectoryStateOptions): DirectoryStateApi {
  const { filters, sorts, defaultSort } = options;
  const pageSize =
    options.pageSize === undefined
      ? DIRECTORY_PAGE_SIZE_DEFAULT
      : Math.min(Math.max(1, Math.trunc(options.pageSize)), DIRECTORY_PAGE_SIZE_MAX);

  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  // Fail-open parse; a filter def added later simply starts at the sentinel.
  const urlState = useMemo(
    () => parseDirectoryParams(searchParams, filters, defaultSort),
    [searchParams, filters, defaultSort],
  );

  const [searchInput, setSearchInput] = useState(urlState.q);
  const debouncedInput = useDebouncedValue(searchInput, DIRECTORY_SEARCH_DEBOUNCE_MS);
  const q = sanitizeQuery(debouncedInput);

  // Last query string this hook wrote (null before mount). The debounced-search
  // effect re-runs whenever searchParams changes identity after a replace; the
  // guard turns those re-runs into no-ops, which is what lets the effect list
  // every dependency honestly — no lint suppression.
  const lastWritten = useRef<string | null>(null);

  const writeUrl = useCallback(
    (next: DirectoryUrlState) => {
      const qs = serializeDirectoryParams(next, defaultSort).toString();
      lastWritten.current = qs;
      router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
    },
    [router, pathname, defaultSort],
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
    const next = parseDirectoryParams(searchParams, filters, defaultSort);
    next.q = q;
    const qs = serializeDirectoryParams(next, defaultSort).toString();
    if (lastWritten.current === null) {
      lastWritten.current = qs;
      return;
    }
    if (qs === lastWritten.current) return;
    writeUrl(next);
  }, [q, searchParams, filters, defaultSort, writeUrl]);

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

  // Deleting the last row of the last page: clamp, keep the filters.
  const { pageCount } = options;
  useEffect(() => {
    if (pageCount !== undefined && pageCount > 0 && state.page > pageCount) {
      writeUrl({ ...state, page: pageCount });
    }
  }, [pageCount, state, writeUrl]);

  const clearFilters = useCallback(() => {
    setSearchInput('');
    writeUrl(defaultUrlState(defaultSort));
  }, [defaultSort, writeUrl]);

  // Value-stable identity for the consumer's query key comes from the memo on
  // `state` (which only changes when a parsed value changes) plus pageSize.
  const params: DirectoryQueryParams = useMemo(
    () => toQueryParams(state, pageSize),
    [state, pageSize],
  );

  return {
    params,
    searchInput,
    setSearchInput,
    setFilter,
    setSort,
    setPage,
    clearFilters,
    hasActiveControls: !isDefaultUrlState(state, defaultSort),
  };
}
