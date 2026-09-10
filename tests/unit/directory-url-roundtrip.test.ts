import { act, createElement } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';

import {
  parseDirectoryParams,
  preserveNamedParams,
  serializeDirectoryParams,
} from '@/modules/directory/lib/directory-url';
import { useDirectoryState } from '@/modules/directory/hooks/use-directory-state';
import type {
  DirectoryFilterDef,
  DirectorySortDef,
  DirectoryStateApi,
  DirectoryUrlState,
} from '@/modules/directory/types/directory.types';

// school-admin/03 — U-15's URL round-trip. The three defects §L-sync tabulates:
//   D-a  `sort` written but never read back      -> landed by ops/34 (directory-url.ts:96-99)
//   D-b  a new search keeps a now-out-of-range page  -> `resetPageOnSearch`, here
//   D-c  a fresh serialize drops the surface's own params -> `preserveParams`, here
// The prefix/namespace mechanics are ops/34's and are covered by
// tests/unit/directory-url-prefix.test.ts; this file does not restate them.

(globalThis as Record<string, unknown>).IS_REACT_ACT_ENVIRONMENT = true;

/** The URL the mocked router reports. Reassigned to simulate navigation. */
let currentSearch = new URLSearchParams();
const replace = vi.fn<(href: string, options?: { scroll?: boolean }) => void>();

vi.mock('next/navigation', () => ({
  useRouter: () => ({ replace }),
  useSearchParams: () => currentSearch,
}));

vi.mock('@/i18n/navigation', () => ({
  usePathname: () => '/dashboard/schools/me',
}));

// The 200ms debounce is timing owned by use-debounced-value; these cases are
// about what the SETTLED search does to the page, so the settle is immediate.
vi.mock('@/modules/dashboard', () => ({
  useDebouncedValue: (value: string) => value,
}));

const FILTERS: readonly DirectoryFilterDef[] = [
  {
    key: 'status',
    label: 'Status',
    options: [
      { value: 'all', label: 'All' },
      { value: 'active', label: 'Active' },
    ],
  },
];

const SORTS: readonly DirectorySortDef[] = [
  { value: 'name:asc', label: 'Name A-Z' },
  { value: 'name:desc', label: 'Name Z-A' },
];

interface HookOptions {
  resetPageOnSearch?: boolean;
  preserveParams?: readonly string[];
  maxPageSize?: number;
  pageSize?: number;
  paramPrefix?: string;
}

let root: Root | null = null;
let container: HTMLDivElement | null = null;

/** Renders the hook and hands back a live handle on its API. */
function renderHook(options: HookOptions = {}): { current: DirectoryStateApi } {
  const handle = { current: null as unknown as DirectoryStateApi };
  function Probe() {
    handle.current = useDirectoryState({
      filters: FILTERS,
      sorts: SORTS,
      defaultSort: 'name:asc',
      ...options,
    });
    return null;
  }
  container = document.createElement('div');
  document.body.append(container);
  root = createRoot(container);
  act(() => {
    root!.render(createElement(Probe));
  });
  return handle;
}

/** The query string of the LAST router.replace, or null if none happened. */
function lastWrittenQs(): string | null {
  if (replace.mock.calls.length === 0) return null;
  const href = replace.mock.calls[replace.mock.calls.length - 1]![0];
  const index = href.indexOf('?');
  return index === -1 ? '' : href.slice(index + 1);
}

beforeEach(() => {
  currentSearch = new URLSearchParams();
  replace.mockClear();
});

afterEach(() => {
  act(() => {
    root?.unmount();
  });
  container?.remove();
  root = null;
  container = null;
});

describe('U-15 D-b — resetPageOnSearch', () => {
  test('a new search writes a URL with NO page param, so the next request is page 1', () => {
    currentSearch = new URLSearchParams('q=alpha&page=4');
    const handle = renderHook();
    expect(handle.current.params.page).toBe(4); // the reload restored page 4

    act(() => {
      handle.current.setSearchInput('beta');
    });

    const qs = lastWrittenQs();
    expect(qs).not.toBeNull();
    const written = new URLSearchParams(qs!);
    expect(written.get('q')).toBe('beta');
    // page 1 is OMITTED from the URL, which is how the reset reaches the wire.
    expect(written.has('page')).toBe(false);
  });

  test('THE REQUEST THAT FOLLOWS carries page 1 — the params the query key is built from', () => {
    currentSearch = new URLSearchParams('q=alpha&page=4');
    const handle = renderHook();

    act(() => {
      handle.current.setSearchInput('beta');
    });
    // The router replace landed; the URL the app now reads is that query string.
    const settled = renderAfter(lastWrittenQs()!);
    expect(settled.current.params.q).toBe('beta');
    expect(settled.current.params.page).toBe(1);
  });

  test('NEGATIVE CONTROL — with resetPageOnSearch:false the stale page survives', () => {
    currentSearch = new URLSearchParams('q=alpha&page=4');
    const handle = renderHook({ resetPageOnSearch: false });

    act(() => {
      handle.current.setSearchInput('beta');
    });

    const written = new URLSearchParams(lastWrittenQs()!);
    expect(written.get('q')).toBe('beta');
    // This is the 400 the default closes: page 4 on a freshly narrowed set.
    expect(written.get('page')).toBe('4');
  });

  test('an unrelated param change does NOT reset the page', () => {
    currentSearch = new URLSearchParams('q=alpha&page=4&status=active');
    const handle = renderHook();
    // No search interaction at all: mount adopts the URL as-is and writes nothing.
    expect(handle.current.params.page).toBe(4);
    expect(replace).not.toHaveBeenCalled();
  });
});

describe('U-15 D-c — preserveParams', () => {
  test('a named param survives a search, a filter change, a sort change and a page step', () => {
    const steps: Array<[string, (api: DirectoryStateApi) => void]> = [
      ['search', (api) => api.setSearchInput('beta')],
      ['filter', (api) => api.setFilter('status', 'active')],
      ['sort', (api) => api.setSort('name:desc')],
      ['page', (api) => api.setPage(3)],
    ];

    for (const [label, run] of steps) {
      currentSearch = new URLSearchParams('tab=classes&page=2');
      replace.mockClear();
      const handle = renderHook({ preserveParams: ['tab'] });
      act(() => {
        run(handle.current);
      });
      const written = new URLSearchParams(lastWrittenQs()!);
      expect(written.get('tab'), `tab survives a ${label} change`).toBe('classes');
      act(() => {
        root?.unmount();
      });
      container?.remove();
    }
  });

  test('an UNNAMED param is still dropped — the fresh build is the point', () => {
    currentSearch = new URLSearchParams('tab=classes&stale=1');
    const handle = renderHook({ preserveParams: ['tab'] });
    act(() => {
      handle.current.setSort('name:desc');
    });
    const written = new URLSearchParams(lastWrittenQs()!);
    expect(written.get('tab')).toBe('classes');
    expect(written.has('stale')).toBe(false);
  });
});

describe('U-15 D-a — sort round-trip (ops/34 landed it; pinned here against regression)', () => {
  test('a sort on the surface list round-trips through the URL', () => {
    const state = parseDirectoryParams(
      new URLSearchParams('sort=name:desc&status=active&page=3'),
      FILTERS,
      'name:asc',
      '',
      undefined,
      undefined,
      SORTS.map((option) => option.value),
    );
    expect(state.sort).toBe('name:desc');
    expect(state.filters.status).toBe('active');
    expect(state.page).toBe(3);
  });

  test('a sort ABSENT from `sorts` falls back to defaultSort rather than being written through', () => {
    const state = parseDirectoryParams(
      new URLSearchParams('sort=bogus:desc'),
      FILTERS,
      'name:asc',
      '',
      undefined,
      undefined,
      SORTS.map((option) => option.value),
    );
    expect(state.sort).toBe('name:asc');
  });

  test('sort is OMITTED from the URL when it equals defaultSort, so clean URLs stay clean', () => {
    const state: DirectoryUrlState = {
      q: '',
      filters: {},
      sort: 'name:asc',
      page: 1,
      layout: '',
    };
    expect(serializeDirectoryParams(state, 'name:asc').toString()).toBe('');
    expect(serializeDirectoryParams({ ...state, sort: 'name:desc' }, 'name:asc').get('sort')).toBe(
      'name:desc',
    );
  });
});

describe('preserveNamedParams — the pure copy rule', () => {
  test('copies only the named keys and never overwrites one the kit already wrote', () => {
    const target = new URLSearchParams('q=kit');
    const source = new URLSearchParams('tab=classes&q=stale&other=x');
    const merged = preserveNamedParams(target, source, ['tab', 'q']);
    expect(merged.get('tab')).toBe('classes');
    expect(merged.get('q')).toBe('kit'); // the kit's own value wins
    expect(merged.has('other')).toBe(false);
  });

  test('two namespaced instances coexist when each preserves the other keys', () => {
    // Two kit lists on one route (ops/34's two ranked watch lists). Prefixing
    // stops the NAMES colliding; naming the sibling's keys is what stops the
    // fresh build from dropping them.
    const a: DirectoryUrlState = { q: 'gains', filters: {}, sort: 'name:asc', page: 1, layout: '' };
    const written = serializeDirectoryParams(a, 'name:asc', 'watch-gains-');
    const url = preserveNamedParams(written, new URLSearchParams('watch-support-q=needs'), [
      'watch-support-q',
    ]);
    expect(url.get('watch-gains-q')).toBe('gains');
    expect(url.get('watch-support-q')).toBe('needs');
  });
});

// ── D-25 regression witness: the default preserves behaviour, measured ──────
//
// `maxPageSize` defaults to DIRECTORY_PAGE_SIZE_MAX so every existing consumer
// is unchanged. That is a claim about bytes, and a claim about bytes needs a
// witness rather than an argument. This quotes the PRE-CHANGE clamp verbatim
// from `git show HEAD:src/modules/directory/hooks/use-directory-state.ts:44-47`
// — the version before school-admin/03, ops/34 and teacher/06 all touched the
// file — and asserts the live hook agrees with it on every input, whenever a
// surface states no ceiling of its own.

/** The clamp exactly as it stood at HEAD, before this row. */
function pageSizeBeforeThisRow(pageSize: number | undefined): number {
  const DIRECTORY_PAGE_SIZE_DEFAULT = 25;
  const DIRECTORY_PAGE_SIZE_MAX = 200;
  return pageSize === undefined
    ? DIRECTORY_PAGE_SIZE_DEFAULT
    : Math.min(Math.max(1, Math.trunc(pageSize)), DIRECTORY_PAGE_SIZE_MAX);
}

describe('D-25 — the maxPageSize default is byte-identical to the pre-change clamp', () => {
  const MATRIX: Array<number | undefined> = [
    undefined, 1, 25, 26, 50, 199, 200, 201, 250, 1000,
    0, -1, -250, 25.7, 199.999, 0.5, Number.MAX_SAFE_INTEGER,
  ];

  test('every input agrees with the HEAD formula when the surface states no ceiling', () => {
    const disagreements: string[] = [];
    for (const pageSize of MATRIX) {
      const handle = renderHook(pageSize === undefined ? {} : { pageSize });
      const actual = handle.current.params.pageSize;
      const expected = pageSizeBeforeThisRow(pageSize);
      if (actual !== expected) {
        disagreements.push(`pageSize=${String(pageSize)}: was ${expected}, now ${actual}`);
      }
      act(() => {
        root?.unmount();
      });
      container?.remove();
    }
    // Reported as a LIST, so a failure names every input that moved rather
    // than stopping at the first one.
    expect(disagreements).toEqual([]);
  });

  test('the witness is not vacuous — the matrix really does exercise both clamp arms', () => {
    // If the matrix only hit one arm, agreement above would prove little.
    const results = MATRIX.map(pageSizeBeforeThisRow);
    expect(new Set(results).size).toBeGreaterThan(2);
    expect(results).toContain(25); // the undefined/default arm
    expect(results).toContain(200); // the upper clamp
    expect(results).toContain(1); // the lower clamp
  });

  test('and a stated ceiling DOES change the answer — so the default is doing real work', () => {
    const handle = renderHook({ pageSize: 250, maxPageSize: 100 });
    expect(handle.current.params.pageSize).toBe(100);
    expect(pageSizeBeforeThisRow(250)).toBe(200);
  });
});

/** Mounts a second root at `qs` — the state the app reads after a replace. */
function renderAfter(qs: string): { current: DirectoryStateApi } {
  act(() => {
    root?.unmount();
  });
  container?.remove();
  currentSearch = new URLSearchParams(qs);
  return renderHook();
}
