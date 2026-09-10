import { AxiosError } from 'axios';
import { describe, expect, test, vi } from 'vitest';
import { z } from 'zod';

import { listScenarioOf, type ListScenario } from '@/modules/directory/lib/list-scenario';

// teacher/04 — the ten-arm body machine (U-13, U-46). Pure decision, unit-tested
// arm by arm in §L-states' order, FIRST MATCH WINNING: each case pins one arm by
// making every earlier arm's trigger false, and the arm-0/1 cases prove the
// ordering itself (enabled beats isPending; isPending beats any error).
// §L-stale-vs-loading pins the rows arm's slow/happy split: `slow` ONLY for
// isFetching && !isPlaceholderData && !polled; placeholder and polled rows stay
// `happy` — the aria-busy affordance is the table's, not the scenario's.

function axiosError(status: number): AxiosError {
  return new AxiosError('request failed', 'ERR_BAD_REQUEST', undefined, undefined, {
    status,
  } as never);
}

const forbidden = axiosError(403);
const gone = axiosError(404);
const broken = axiosError(500);

function input(overrides: Partial<Parameters<typeof listScenarioOf>[0]> = {}) {
  return {
    isPending: false,
    isError: false,
    isFetching: false,
    error: undefined,
    enabled: true,
    isPlaceholderData: false,
    polled: false,
    rowCount: 3,
    total: 25,
    hasActiveControls: false,
    ...overrides,
  };
}

describe('listScenarioOf — §L-states first-match order', () => {
  test('arm 0 — enabled:false is Disabled even while isPending (the forever-skeleton trap)', () => {
    expect(
      listScenarioOf(input({ enabled: false, isPending: true, isError: true, error: forbidden })),
    ).toBe('disabled');
  });

  test('arm 1 — isPending is Loading, ahead of any error arm', () => {
    expect(listScenarioOf(input({ isPending: true, isError: true, error: forbidden }))).toBe(
      'loading',
    );
  });

  test('arm 2 — a classified 403 is Restricted, with or without rows', () => {
    expect(listScenarioOf(input({ isError: true, error: forbidden }))).toBe('restricted');
    expect(
      listScenarioOf(input({ isError: true, error: forbidden, rowCount: 2 })),
    ).toBe('restricted');
  });

  test('arm 3 — a classified gone (400/404) is Gone', () => {
    expect(listScenarioOf(input({ isError: true, error: gone }))).toBe('gone');
    expect(listScenarioOf(input({ isError: true, error: axiosError(400) }))).toBe('gone');
  });

  test('arm 4 — a broken error without data is loadError', () => {
    expect(listScenarioOf(input({ isError: true, error: broken, rowCount: 0, total: 0 }))).toBe(
      'loadError',
    );
  });

  test('arm 5 — a broken error with data is stale (banner above the rows)', () => {
    expect(listScenarioOf(input({ isError: true, error: broken }))).toBe('stale');
  });

  test('arm 6 — no data and active controls is empty-no-matches', () => {
    expect(
      listScenarioOf(input({ rowCount: 0, total: 0, hasActiveControls: true })),
    ).toBe('empty-no-matches');
  });

  test('arm 7 — no data and no controls is empty-none', () => {
    expect(listScenarioOf(input({ rowCount: 0, total: 0 }))).toBe('empty-none');
  });

  test('rows arm — settled rows are happy', () => {
    expect(listScenarioOf(input())).toBe('happy');
  });

  test('rows arm — a plain non-polled refetch is slow', () => {
    expect(listScenarioOf(input({ isFetching: true }))).toBe('slow');
  });

  test('rows arm — placeholder rows are happy, never slow (case 2 is an aria-busy, not an arm)', () => {
    expect(listScenarioOf(input({ isFetching: true, isPlaceholderData: true }))).toBe('happy');
  });

  test('rows arm — a polled refetch is happy, never slow (case 4)', () => {
    expect(listScenarioOf(input({ isFetching: true, polled: true }))).toBe('happy');
  });

  test('R-13 — hasData before total: rows with no meta render rows, not an empty arm', () => {
    expect(listScenarioOf(input({ rowCount: 2, total: 0, hasActiveControls: true }))).toBe('happy');
  });

  test('pure and exhaustive — frozen input, same answer twice, always a ten-member scenario', () => {
    const scenarios: readonly ListScenario[] = [
      'happy',
      'loading',
      'slow',
      'empty-none',
      'empty-no-matches',
      'stale',
      'loadError',
      'restricted',
      'gone',
      'disabled',
    ];
    const frozen = Object.freeze(input({ isError: true, error: broken }));
    const first = listScenarioOf(frozen);
    expect(listScenarioOf(frozen)).toBe(first);
    expect(scenarios).toContain(first);

    for (const scenario of scenarios) {
      expect(typeof scenario).toBe('string');
    }
  });

  test('error truthiness — a non-error truthy value classifies as broken, keeping arm 5 reachable', () => {
    expect(listScenarioOf(input({ isError: true, error: new z.ZodError([]) }))).toBe('stale');
  });
});

// ── teacher/04 — DirectoryTable arm wiring (reviewer-mandated) ────────────────
// The pure decision above is only half the unit: the table must RENDER the arm
// the scenario names, move focus to the arm's ACTUAL heading (role=heading,
// tabIndex={-1}) after a rows→arm swap, keep `stale` a row-rendering arm (its
// banner sits above live rows), and stay busy per §L-stale-vs-loading — while
// `selectable:false` compiles and runs with NO getRowTarget (U-11).

import { act, createElement } from 'react';
import type { CSSProperties, ReactElement, ReactNode } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { afterEach as afterEachTable } from 'vitest';
import { NextIntlClientProvider } from 'next-intl';

import { DirectoryTable } from '@/modules/directory/components/DirectoryTable';
import type { DirectoryTableProps } from '@/modules/directory/components/DirectoryTable';
import { DIRECTORY_DEFAULT_LABELS } from '@/modules/directory/constants/directory.constants';
import type { DirectoryQueryStatus, DirectoryStateApi } from '@/modules/directory/types/directory.types';

(globalThis as Record<string, unknown>).IS_REACT_ACT_ENVIRONMENT = true;

vi.mock('@/i18n/navigation', () => ({
  // The table body navigates with next-intl's locale-aware <Link>; the element
  // shape (one anchor) is what the assertions care about — nothing weakened.
  Link: (props: { href: string; children: ReactNode; style?: CSSProperties }) =>
    createElement('a', { href: props.href, style: props.style }, props.children),
}));

interface TableRow {
  id: string;
  name: string;
}

const TABLE_ROWS: TableRow[] = [
  { id: 'r1', name: 'Alpha' },
  { id: 'r2', name: 'Beta' },
  { id: 'r3', name: 'Gamma' },
];

const TABLE_COLUMNS = [
  { key: 'name', header: 'Name', cell: (row: TableRow) => row.name },
];

const rowTarget = (row: TableRow) => ({ kind: 'school', documentId: row.id });

const QUERY_MESSAGES = {
  QueryError: {
    forbiddenTitle: 'Need a teacher account',
    forbiddenDescription: 'This page needs a teacher account.',
    goneTitle: 'No longer available',
    goneDescription: 'This page is no longer available.',
    retry: 'Retry',
  },
};

function fakeDirectoryState(overrides: Partial<DirectoryStateApi> = {}): DirectoryStateApi {
  return {
    params: { filters: {}, sort: 'name:asc', page: 1, pageSize: 25 },
    mode: 'server',
    searchInput: '',
    setSearchInput: vi.fn(),
    setFilter: vi.fn(),
    setSort: vi.fn(),
    setPage: vi.fn(),
    layout: 'table',
    setLayout: vi.fn(),
    clearFilters: vi.fn(),
    hasActiveControls: false,
    ...overrides,
  };
}

function baseTableQuery(overrides: Partial<DirectoryQueryStatus> = {}): DirectoryQueryStatus {
  return {
    isPending: false,
    isError: false,
    isFetching: false,
    refetch: vi.fn(),
    ...overrides,
  };
}

function typedTable(props: DirectoryTableProps<TableRow>): ReactElement {
  return createElement(DirectoryTable as (p: DirectoryTableProps<TableRow>) => ReactElement, props);
}

// next-intl's provider types `children` as REQUIRED inside its props object,
// which fights createElement's third-argument form (and the repo lint rule
// `react/no-children-prop`). The cast narrows children to optional so the
// child is passed the idiomatic way; the runtime component is unchanged.
const Provider = NextIntlClientProvider as unknown as (
  props: { locale: string; messages: unknown; children?: ReactNode }
) => ReactElement;

function tableElement(
  query: DirectoryQueryStatus,
  overrides: Record<string, unknown> = {},
): ReactElement {
  const props = {
    state: fakeDirectoryState(),
    query,
    rows: TABLE_ROWS,
    getRowTarget: rowTarget,
    filters: [],
    sorts: [],
    columns: TABLE_COLUMNS,
    rowActions: (row: TableRow) => [{ label: `Act ${row.name}`, onSelect: () => undefined }],
    ...overrides,
  } as DirectoryTableProps<TableRow>;
  return createElement(Provider, { locale: 'en', messages: QUERY_MESSAGES }, typedTable(props));
}

describe('DirectoryTable — arm wiring (teacher/04)', () => {
  let root: Root | null = null;
  let container: HTMLDivElement | null = null;

  afterEachTable(() => {
    if (root && container) {
      act(() => {
        root?.unmount();
      });
    }
    root = null;
    container = null;
  });

  function mount(element: ReactElement): void {
    container = document.createElement('div');
    document.body.append(container);
    root = createRoot(container);
    act(() => {
      root?.render(element);
    });
  }

  function rerender(element: ReactElement): void {
    act(() => {
      root?.render(element);
    });
  }

  test('rows render under the region, indexed for A5', () => {
    mount(tableElement(baseTableQuery()));
    expect(container!.querySelectorAll('[data-directory-row]')).toHaveLength(3);
  });

  test('rows -> loading swaps the body and focus lands on the loading status heading', () => {
    mount(tableElement(baseTableQuery()));
    rerender(tableElement(baseTableQuery({ isPending: true })));
    const active = document.activeElement as HTMLElement;
    expect(active.tagName).toBe('H2');
    expect(active.getAttribute('tabindex')).toBe('-1');
    expect(active.textContent).toBe(DIRECTORY_DEFAULT_LABELS.loadingLabel);
    expect(active.closest('[data-slot="directory-loading"]')).not.toBeNull();
  });

  test('rows -> 403 renders the forbidden arm and focus lands on its heading', () => {
    mount(tableElement(baseTableQuery()));
    rerender(tableElement(baseTableQuery({ isError: true, error: axiosError(403) })));
    expect(container!.querySelector('[data-query-error="forbidden"]')).not.toBeNull();
    const active = document.activeElement as HTMLElement;
    expect(active.tagName).toBe('H2');
    expect(active.getAttribute('tabindex')).toBe('-1');
    expect(active.textContent).toBe(QUERY_MESSAGES.QueryError.forbiddenTitle);
    expect(active.parentElement!.querySelector('[data-query-error="forbidden"]')).not.toBeNull();
  });

  test('rows -> 404 renders the gone arm and focus lands on its heading', () => {
    mount(tableElement(baseTableQuery()));
    rerender(tableElement(baseTableQuery({ isError: true, error: axiosError(404) })));
    expect(container!.querySelector('[data-query-error="gone"]')).not.toBeNull();
    const active = document.activeElement as HTMLElement;
    expect(active.tagName).toBe('H2');
    expect(active.getAttribute('tabindex')).toBe('-1');
    expect(active.textContent).toBe(QUERY_MESSAGES.QueryError.goneTitle);
  });

  test('rows -> loadError focuses the error heading carrying its title', () => {
    mount(tableElement(baseTableQuery()));
    rerender(
      tableElement(baseTableQuery({ isError: true, error: axiosError(500) }), {
        rows: [],
        meta: undefined,
      }),
    );
    const active = document.activeElement as HTMLElement;
    expect(active.tagName).toBe('H2');
    expect(active.textContent).toBe(DIRECTORY_DEFAULT_LABELS.errorTitle);
  });

  test('rows -> empty-no-matches focuses that arm heading; Clear filters present', () => {
    mount(tableElement(baseTableQuery()));
    rerender(
      tableElement(baseTableQuery(), {
        rows: [],
        meta: { page: 1, pageSize: 25, pageCount: 0, total: 0 },
        ...{ state: fakeDirectoryState({ hasActiveControls: true }) },
      }),
    );
    const active = document.activeElement as HTMLElement;
    expect(active.tagName).toBe('H2');
    expect(active.textContent).toBe(DIRECTORY_DEFAULT_LABELS.emptyNoMatchesTitle);
    expect(container!.textContent).toContain(DIRECTORY_DEFAULT_LABELS.clearFilters);
  });

  test('rows -> empty-none (no active controls) focuses the none arm heading', () => {
    mount(tableElement(baseTableQuery()));
    rerender(
      tableElement(baseTableQuery(), {
        rows: [],
        meta: { page: 1, pageSize: 25, pageCount: 0, total: 0 },
      }),
    );
    const active = document.activeElement as HTMLElement;
    expect(active.tagName).toBe('H2');
    expect(active.textContent).toBe(DIRECTORY_DEFAULT_LABELS.emptyNoneTitle);
  });

  test('stale is a ROW arm: rows stay, the banner sits with them, retry is busy while refetching', () => {
    mount(tableElement(baseTableQuery()));
    rerender(
      tableElement(baseTableQuery({ isError: true, isFetching: true, error: axiosError(500) })),
    );
    expect(container!.querySelectorAll('[data-directory-row]')).toHaveLength(3);
    expect(container!.textContent).toContain(DIRECTORY_DEFAULT_LABELS.errorStaleBanner);
    const region = container!.querySelector('[data-slot="directory"] > div[aria-busy]');
    expect(region).not.toBeNull();
    expect(region!.getAttribute('aria-busy')).toBe('true');

    // Polled stale rows are never busy (case 4).
    rerender(
      tableElement(
        baseTableQuery({ isError: true, isFetching: true, polled: true, error: axiosError(500) }),
      ),
    );
    expect(
      container!.querySelector('[data-slot="directory"] > div[aria-busy="true"]'),
    ).toBeNull();
  });

  test('A5 row removal — focus moves to a SURVIVING row action trigger', () => {
    mount(tableElement(baseTableQuery()));
    const removedRowTrigger = container!.querySelector<HTMLElement>(
      '[data-directory-row-index="1"] [data-directory-row-menu] button',
    );
    removedRowTrigger?.focus();
    expect(document.activeElement).toBe(removedRowTrigger);

    rerender(
      tableElement(baseTableQuery(), { rows: TABLE_ROWS.filter((row) => row.id !== 'r2') }),
    );

    const active = document.activeElement as HTMLElement;
    expect(active.tagName).toBe('BUTTON');
    expect(active.closest('[data-directory-row]')).not.toBeNull();
    expect(active.closest('[data-directory-row-menu]')).not.toBeNull();
  });

  test('U-11 — selectable:false compiles and runs with NO getRowTarget (getRowKey identities)', () => {
    const props = {
      state: fakeDirectoryState(),
      query: baseTableQuery(),
      rows: TABLE_ROWS,
      getRowKey: (row: TableRow) => row.id,
      filters: [],
      sorts: [],
      columns: TABLE_COLUMNS,
    } as DirectoryTableProps<TableRow>;
    mount(
      createElement(Provider, { locale: 'en', messages: QUERY_MESSAGES }, typedTable(props)),
    );
    expect(container!.querySelectorAll('[data-directory-row]')).toHaveLength(3);
    expect(container!.querySelector('[data-directory-row-menu]')).toBeNull();
  });

  test('U-11 — selectable:true REQUIRES getRowTarget (compile-time, type-only)', () => {
    type SelectableTableProps = DirectoryTableProps<TableRow> & { selectable: true };
    // @ts-expect-error — U-11: a selectable table without getRowTarget must not compile.
    const missing: SelectableTableProps = {
      state: fakeDirectoryState(),
      query: baseTableQuery(),
      rows: TABLE_ROWS,
      filters: [],
      sorts: [],
      columns: TABLE_COLUMNS,
      selectable: true,
    };
    expect(missing).toBeDefined();
  });
});
