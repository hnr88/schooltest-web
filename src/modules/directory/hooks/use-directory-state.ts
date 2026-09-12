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
  /**
   * teacher/FX-URL1 (TB-08 + FLAKE-01) — write the URL with
   * `window.history.replaceState` instead of `router.replace`. OPT-IN, default
   * `false`: every existing consumer keeps today's App-Router navigation.
   *
   * MEASURED on the teacher Classes list (12 layout writes, :3002, 2026-09-12):
   * the body swaps in 21–278 ms, but `router.replace` is SWALLOWED and the
   * address bar takes 1470–5585 ms (median 1626) to settle, because the
   * convergence interval below has to re-dispatch it 3–11 times at 300 ms
   * apiece — each retry costing its own RSC round-trip — and three of the
   * twelve exhausted the retries and fell back to a full page reload. Two of
   * twelve therefore MISSED Playwright's 5 s expectation (TB-08/FLAKE-01's
   * four failures today); shallow, the same twelve settle in 27–68 ms.
   *
   * A surface whose filtering is PURELY CLIENT-SIDE (`mode: 'client'`, the
   * reduction done by `applyClientDirectoryMode` over an already-loaded array)
   * renders nothing new on the server, so the round-trip buys it nothing. The
   * App Router supports `history.replaceState` for search-param-only updates
   * and `useSearchParams` still observes it, so the write is synchronous and
   * cannot be swallowed at all. Do NOT set this where the URL drives a server
   * render or a route-level read — there the navigation IS the point.
   */
  shallow?: boolean;
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
    shallow = false,
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

  // App-Router write races (measured live on the ops schools list and the
  // school detail tabs, 2026-09-11): a `router.replace` dispatched while
  // another navigation is still in flight can be SWALLOWED outright, and a
  // re-render that still carries the pre-write URL re-runs the sync effect
  // against the stale snapshot and reverts a write that was fine. Three pieces
  // of state make a write survive both:
  //
  // - `pendingState` — the write we authored but have not yet seen land in the
  //   URL. It is the base every control composes onto (rapid writes no longer
  //   collapse into the last one) and what the controls and the query read, so
  //   the UI holds steady while the URL catches up.
  // - `staleSeen` — every query string that legitimately shows up while a
  //   write is in flight (the pre-write URL, superseded written strings). A
  //   live URL in that set means "still catching up — re-dispatch"; anything
  //   else means the URL moved for a reason that is not ours (Back/Forward, a
  //   tab switch) and the pending write must be dropped.
  const [pendingState, setPendingState] = useState<DirectoryUrlState | null>(null);
  const pendingRef = useRef<DirectoryUrlState | null>(null);
  const staleSeen = useRef<Set<string>>(new Set());
  const setPending = useCallback((next: DirectoryUrlState | null) => {
    pendingRef.current = next;
    if (next === null) staleSeen.current = new Set();
    setPendingState(next);
  }, []);

  // The live query string, in a ref the convergence interval can read without
  // re-rendering (the URL lags the write by a navigation). Kept in an effect —
  // refs are never written during render.
  const seenRef = useRef(searchParams.toString());
  useEffect(() => {
    seenRef.current = searchParams.toString();
  }, [searchParams]);

  // Whether the settled search matches the CURRENT input, tracked as versions:
  // a clear or keystroke bumps `inputVersion` immediately while the debounced
  // `q` still reports the PREVIOUS text. Without this, a Clear filters (which
  // writes `q` out of the URL) was followed by the effect re-writing the stale
  // settled text back into the URL until the debounce settled — a visible
  // revert that also re-fetched the filtered query.
  const inputVersion = useRef(0);
  const settledInputVersion = useRef(0);

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
      // Remember the strings that can legitimately show up while this write is
      // in flight, so the convergence check can tell "still catching up" from
      // "the URL changed for someone else's reason": the string the browser
      // shows right now (which may differ from `lastWritten` — the raw URL can
      // carry explicit defaults the serializer omits) and the string it was
      // last written with.
      staleSeen.current.add(seenRef.current);
      if (lastWritten.current !== null) staleSeen.current.add(lastWritten.current);
      lastWritten.current = qs;
      setPending(next);
      if (shallow) {
        // The shallow write lands in the address bar synchronously — there is
        // no in-flight navigation for it to be swallowed by, so the pending /
        // re-dispatch machinery below has nothing to do. `seenRef` is advanced
        // here rather than waited for: the convergence effect reads the LIVE
        // URL through that ref, and we have just set the live URL ourselves.
        // The real path is used (next-intl's `pathname` drops a locale prefix),
        // exactly as the hard-navigation fallback below does.
        window.history.replaceState(null, '', `${window.location.pathname}${qs === '' ? '' : `?${qs}`}`);
        seenRef.current = qs;
        return;
      }
      router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
    },
    [router, pathname, buildQs, setPending, shallow],
  );

  // The parsed URL with the pending write (when one is in flight) and the
  // SETTLED search overlaid — the state every control reads and writes through.
  const state: DirectoryUrlState = useMemo(
    () => ({ ...(pendingState ?? urlState), q }),
    [pendingState, urlState, q],
  );

  // Mark the settled search as current whenever it matches the live input.
  // Declared BEFORE the sync effect so a settle is visible to it same-pass.
  useEffect(() => {
    if (q === sanitizeQuery(searchInput)) settledInputVersion.current = inputVersion.current;
  });

  // Once the settled search changes, it lands in the URL alongside the other
  // controls. On mount the URL is adopted as-is (the input initialised from it).
  useEffect(() => {
    const next = { ...(pendingRef.current ?? parseDirectoryParams(searchParams, filters, defaultSort, paramPrefix, layouts, defaultLayout, sortValues)) };
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
    // A newer input edit is still in its debounce window (a clear, a fresh
    // keystroke): the settled `q` is yesterday's text, and writing it would
    // fight the edit that is about to land. Skip and wait for the settle.
    if (settledInputVersion.current < inputVersion.current) return;
    if (qs === lastWritten.current) return;
    writeUrl(next);
  }, [q, searchParams, filters, defaultSort, paramPrefix, layouts, defaultLayout, sortValues, resetPageOnSearch, buildQs, writeUrl]);

  // Convergence: the URL must end up matching the pending write. A replace
  // dispatched while another navigation is in flight can be swallowed without
  // ANY further render following it, so the check lives on an interval that
  // reads the live URL from a ref: it re-dispatches until the query string
  // matches, drops the write if the URL moved for someone else's reason, and
  // clears the moment the write lands. The target is the pending write's OWN
  // search — the settled-input overlay does not belong in it (during a Clear's
  // debounce window the settled text is the value the clear just discarded).
  useEffect(() => {
    if (pendingState === null) return;
    if (staleSeen.current.size === 0 && lastWritten.current !== null) {
      staleSeen.current.add(seenRef.current);
    }
    const want = buildQs(pendingState);
    const reconcile = (): boolean => {
      const seen = seenRef.current;
      if (seen === want || !staleSeen.current.has(seen)) {
        // Landed, or the URL now belongs to someone else (Back/Forward, a tab
        // switch). Either way the pending write is no longer the truth.
        setPending(null);
        return true;
      }
      return false;
    };
    if (reconcile()) return;
    let attempts = 0;
    const iv = setInterval(() => {
      attempts += 1;
      if (reconcile()) return;
      if (attempts > 10) {
        // The router has swallowed every soft retry for ~3s — it is wedged on
        // an in-flight navigation and will drop any further replace. A hard
        // navigation is the only remaining way this write lands; the URL is
        // the store, so the reload restores exactly the written state. The
        // real path is kept (next-intl's pathname drops a locale prefix).
        const target = `${window.location.pathname}${want === '' ? '' : `?${want}`}`;
        setPending(null);
        if (window.location.pathname + window.location.search !== target) {
          window.location.replace(target);
        }
        return;
      }
      // Still catching up (or the write was swallowed): re-dispatch. A
      // replace is idempotent, so a retry racing the original is harmless.
      writeUrl(pendingState);
    }, 300);
    return () => clearInterval(iv);
  }, [pendingState, buildQs, writeUrl, setPending]);

  // Back/Forward is always an external verdict: drop the pending write so the
  // retry cannot fight the browser for the URL.
  useEffect(() => {
    const onPop = () => setPending(null);
    window.addEventListener('popstate', onPop);
    return () => window.removeEventListener('popstate', onPop);
  }, [setPending]);

  // The write base is the pending write when one is in flight — composing onto
  // it is what keeps two rapid control changes from collapsing into one.
  const writeBase = useCallback(
    (): DirectoryUrlState => pendingRef.current ?? urlState,
    [urlState],
  );

  const setFilter = useCallback(
    (key: string, rawValue: string) => {
      const def = filters.find((candidate) => candidate.key === key);
      const allowed = def ? def.options.map((option) => option.value) : [DIRECTORY_ALL];
      const value = allowed.includes(rawValue) ? rawValue : DIRECTORY_ALL;
      const base = writeBase();
      // Any result-set change (applying or clearing a filter) belongs to page 1.
      writeUrl({ ...base, q, filters: { ...base.filters, [key]: value }, page: 1 });
    },
    [filters, q, writeBase, writeUrl],
  );

  const setSort = useCallback(
    (rawSort: string) => {
      const sort = sorts.some((option) => option.value === rawSort) ? rawSort : defaultSort;
      const base = writeBase();
      writeUrl({ ...base, q, sort, page: 1 });
    },
    [sorts, q, defaultSort, writeBase, writeUrl],
  );

  const setPage = useCallback(
    (page: number) => {
      const base = writeBase();
      writeUrl({ ...base, q, page: clampPage(page) });
    },
    [q, writeBase, writeUrl],
  );

  // teacher/06 — the layout toggle. A view choice, not a filter: the page and
  // the controls stay exactly where they are.
  const setLayout = useCallback(
    (rawLayout: string) => {
      const value =
        layouts !== undefined && isDirectoryLayout(rawLayout) && layouts.includes(rawLayout)
          ? rawLayout
          : (defaultLayout ?? '');
      const base = writeBase();
      writeUrl({ ...base, q, layout: value });
    },
    [layouts, defaultLayout, q, writeBase, writeUrl],
  );

  const clearFilters = useCallback(() => {
    inputVersion.current += 1;
    setSearchInput('');
    const base = writeBase();
    // The layout choice survives a clear — it is the view, not a filter.
    writeUrl({ ...defaultUrlState(defaultSort), q: '', layout: base.layout });
  }, [defaultSort, writeBase, writeUrl]);

  // Value-stable identity for the consumer's query key comes from the memo on
  // `state` (which only changes when a parsed value changes) plus pageSize.
  const params: DirectoryQueryParams = useMemo(
    () => toQueryParams(state, pageSize),
    [state, pageSize],
  );

  const setPureSearchInput = useCallback((value: string) => {
    inputVersion.current += 1;
    setSearchInput(value);
  }, []);

  return {
    params,
    mode,
    layout:
      state.layout !== '' && isDirectoryLayout(state.layout)
        ? state.layout
        : (defaultLayout ?? 'table'),
    setLayout,
    searchInput,
    setSearchInput: setPureSearchInput,
    setFilter,
    setSort,
    setPage,
    clearFilters,
    hasActiveControls: !isDefaultUrlState(state, defaultSort),
  };
}
