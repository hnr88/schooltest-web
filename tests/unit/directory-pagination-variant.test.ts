import { act, createElement } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';

import { DirectoryPagination } from '@/modules/directory/components/DirectoryPagination';
import { DIRECTORY_DEFAULT_LABELS } from '@/modules/directory/constants/directory.constants';
import { useDirectoryState } from '@/modules/directory/hooks/use-directory-state';
import { getPaginationRange } from '@/modules/search-shared/lib/pagination-range';
import type {
  DirectoryFilterDef,
  DirectorySortDef,
  DirectoryStateApi,
} from '@/modules/directory/types/directory.types';

// school-admin/03 — U-16 §L-pagination. Three variants over ONE algorithm, and
// D-25's two page-size ceilings on one product: /schools/me/children is 25/100
// with a 400 above the cap, ops-pagination is 25/200. The kit never assumes 200.

(globalThis as Record<string, unknown>).IS_REACT_ACT_ENVIRONMENT = true;

let currentSearch = new URLSearchParams();

vi.mock('next/navigation', () => ({
  useRouter: () => ({ replace: vi.fn() }),
  useSearchParams: () => currentSearch,
}));

vi.mock('@/i18n/navigation', () => ({
  usePathname: () => '/dashboard/schools/me',
}));

vi.mock('@/modules/dashboard', () => ({
  useDebouncedValue: (value: string) => value,
}));

let root: Root | null = null;
let container: HTMLDivElement | null = null;

function render(node: Parameters<Root['render']>[0]): HTMLDivElement {
  container = document.createElement('div');
  document.body.append(container);
  root = createRoot(container);
  act(() => {
    root!.render(node);
  });
  return container;
}

const META = { page: 4, pageSize: 25, pageCount: 9, total: 220 };

function pager(overrides: Record<string, unknown> = {}) {
  return createElement(DirectoryPagination, {
    meta: META,
    onPageChange: vi.fn(),
    labels: DIRECTORY_DEFAULT_LABELS,
    ...overrides,
  });
}

beforeEach(() => {
  currentSearch = new URLSearchParams();
});

afterEach(() => {
  act(() => {
    root?.unmount();
  });
  container?.remove();
  root = null;
  container = null;
});

describe('§L-pagination — the three variants', () => {
  test("variant 'none' renders nothing", () => {
    const host = render(pager({ variant: 'none' }));
    expect(host.querySelector('[data-slot="directory-pagination"]')).toBeNull();
    expect(host.textContent).toBe('');
  });

  test("the DEFAULT is 'steps' — prev/next and the count, and no page numbers", () => {
    const host = render(pager());
    // COUNTED, not merely present: a presence check passes twice over and so
    // cannot tell one correct pager from two duplicated ones.
    const navs = host.querySelectorAll('[data-slot="directory-pagination"]');
    expect(navs.length).toBe(1);
    const nav = navs[0]!;
    expect(nav.getAttribute('data-variant')).toBeNull();
    const buttons = [...host.querySelectorAll('button')].map((button) => button.textContent);
    expect(buttons).toEqual([DIRECTORY_DEFAULT_LABELS.previous, DIRECTORY_DEFAULT_LABELS.next]);
    expect(host.querySelector('[data-slot="directory-pagination-ellipsis"]')).toBeNull();
  });

  test("variant 'steps' is identical to the default", () => {
    const host = render(pager({ variant: 'steps' }));
    const buttons = [...host.querySelectorAll('button')].map((button) => button.textContent);
    expect(buttons).toEqual([DIRECTORY_DEFAULT_LABELS.previous, DIRECTORY_DEFAULT_LABELS.next]);
  });

  test("variant 'numbered' renders getPaginationRange's window, ellipsis included", () => {
    const host = render(pager({ variant: 'numbered' }));
    // The ONE algorithm decides the window; the test reads it from the same body
    // rather than restating it, so the two can never drift apart.
    const tokens = getPaginationRange(META.page, META.pageCount);
    expect(tokens).toContain('ellipsis');
    const expectedNumbers = tokens.filter((token): token is number => token !== 'ellipsis');

    const rendered = [...host.querySelectorAll('button')]
      .map((button) => button.textContent ?? '')
      .filter((text) => /^\d+$/.test(text))
      .map(Number);
    expect(rendered).toEqual(expectedNumbers);

    const ellipses = host.querySelectorAll('[data-slot="directory-pagination-ellipsis"]');
    expect(ellipses.length).toBe(tokens.filter((token) => token === 'ellipsis').length);
    expect(ellipses[0]!.getAttribute('aria-hidden')).toBe('true');
  });

  test("variant 'numbered' marks EXACTLY ONE page with aria-current", () => {
    const host = render(pager({ variant: 'numbered' }));
    // Counted: two aria-current="page" nodes is an a11y defect a presence
    // check would wave through, and so is a duplicated pager.
    const current = host.querySelectorAll('button[aria-current="page"]');
    expect(current.length).toBe(1);
    expect(current[0]!.textContent).toBe(String(META.page));
    expect(host.querySelectorAll('[data-slot="directory-pagination"]').length).toBe(1);
  });

  test('every variant still renders nothing on an empty scope', () => {
    for (const variant of ['steps', 'numbered'] as const) {
      const host = render(pager({ variant, meta: { page: 1, pageSize: 25, pageCount: 0, total: 0 } }));
      expect(host.textContent, `${variant} on an empty scope`).toBe('');
      act(() => {
        root?.unmount();
      });
      container?.remove();
    }
  });
});

// ── the algorithm itself, anchored with LITERAL windows ─────────────────────
//
// The variant test above deliberately reads its expected window FROM
// `getPaginationRange`, which proves the WIRING — that the component routes
// through the shared algorithm instead of reimplementing it — but proves
// nothing about the algorithm being right: if it returned nonsense, that test
// would assert the component faithfully renders the nonsense and pass.
// `getPaginationRange` predates this row and has NO other test in the repo
// (`grep -rl getPaginationRange tests/` finds only this file), so the wiring
// test had quietly become the only test. These cases pin the algorithm
// independently, with hard-coded windows and no reference to the component.

describe('getPaginationRange — literal windows, independent of any component', () => {
  test('a middle page gets an ellipsis on BOTH sides', () => {
    expect(getPaginationRange(4, 9)).toEqual([1, 'ellipsis', 3, 4, 5, 'ellipsis', 9]);
  });

  test('a single page is just that page — no ellipsis, no duplicate', () => {
    expect(getPaginationRange(1, 1)).toEqual([1]);
  });

  test('a short range is contiguous, so no ellipsis appears at all', () => {
    expect(getPaginationRange(1, 3)).toEqual([1, 2, 3]);
    expect(getPaginationRange(2, 3)).toEqual([1, 2, 3]);
  });

  test('the first page ellipsises only the tail', () => {
    expect(getPaginationRange(2, 10)).toEqual([1, 2, 3, 'ellipsis', 10]);
  });

  test('the last page ellipsises only the head', () => {
    expect(getPaginationRange(5, 5)).toEqual([1, 'ellipsis', 4, 5]);
  });

  test('a wider sibling window widens the run, not the ellipsis count', () => {
    expect(getPaginationRange(5, 11, 2)).toEqual([1, 'ellipsis', 3, 4, 5, 6, 7, 'ellipsis', 11]);
  });
});

// ── D-25: two ceilings on one product ───────────────────────────────────────

const FILTERS: readonly DirectoryFilterDef[] = [];
const SORTS: readonly DirectorySortDef[] = [{ value: 'name:asc', label: 'Name A-Z' }];

function renderHook(options: Record<string, unknown>): { current: DirectoryStateApi } {
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
  render(createElement(Probe));
  return handle;
}

describe('D-25 — pageSize comes from the surface, and the kit never assumes 200', () => {
  test('a /schools/me/children consumer is clamped at its OWN ceiling of 100', () => {
    const handle = renderHook({ maxPageSize: 100, pageSize: 250 });
    expect(handle.current.params.pageSize).toBe(100);
  });

  test('an ops consumer keeps the 200 ceiling ops-pagination serves', () => {
    const handle = renderHook({ pageSize: 250 });
    expect(handle.current.params.pageSize).toBe(200);
  });

  test('the two ceilings are DIFFERENT — a single shared cap would move a deployed 400', () => {
    const children = renderHook({ maxPageSize: 100, pageSize: 250 });
    const childrenCap = children.current.params.pageSize;
    act(() => {
      root?.unmount();
    });
    container?.remove();
    const ops = renderHook({ pageSize: 250 });
    expect(childrenCap).toBe(100);
    expect(ops.current.params.pageSize).toBe(200);
    expect(childrenCap).not.toBe(ops.current.params.pageSize);
  });

  test('a surface that states no pageSize still gets the default 25, never its ceiling', () => {
    const handle = renderHook({ maxPageSize: 100 });
    expect(handle.current.params.pageSize).toBe(25);
  });

  test('every existing consumer is unchanged — no maxPageSize behaves exactly as before', () => {
    const handle = renderHook({ pageSize: 50 });
    expect(handle.current.params.pageSize).toBe(50);
  });
});
