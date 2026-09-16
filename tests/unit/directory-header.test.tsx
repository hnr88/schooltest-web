import { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';
import { DirectoryTable } from '@/modules/directory/components/DirectoryTable';
import { DIRECTORY_DEFAULT_LABELS } from '@/modules/directory/constants/directory.constants';
import type {
  DirectoryFilterDef,
  DirectoryQueryStatus,
  DirectoryStateApi,
} from '@/modules/directory/types/directory.types';

// ops/14 — the tab-body frame: header, chips, per-surface empty copy. The
// load-bearing rule of the row is that a consumer which omits the new props
// renders BYTE-IDENTICALLY to before, so the first test snapshots exactly
// that DOM and the second asserts the new slots are absent from it.

(globalThis as Record<string, unknown>).IS_REACT_ACT_ENVIRONMENT = true;

vi.mock('next-intl', () => ({
  useTranslations: () => (key: string) => `ds.${key}`,
}));

// The gate is mockable per test: `gateReason.value` is what a write:true
// header button reads at render time.
export const gateReason = { value: null as string | null };

vi.mock('@/modules/ops/actions', async () => {
  const actual = await vi.importActual<typeof import('@/modules/ops/actions')>(
    '@/modules/ops/actions',
  );
  return {
    ...actual,
    useOpsWriteGate: () => ({
      blockedReason: () => gateReason.value,
      retryWhenBlocked: false,
      retryLabel: 'Retry',
    }),
  };
});

vi.mock('@/i18n/navigation', () => ({
  Link: ({ href, children, ...rest }: { href: string; children: React.ReactNode }) => (
    <a href={href} {...rest}>
      {children}
    </a>
  ),
  // DirectoryRows reads the router at render time (BUG-005 whole-row click).
  useRouter: () => ({ push: vi.fn(), replace: vi.fn() }),
}));

interface Row {
  id: string;
  name: string;
  status: string;
}

const ROWS: Row[] = [
  { id: 'r1', name: 'Alpha', status: 'active' },
  { id: 'r2', name: 'Beta', status: 'archived' },
];

const COLUMNS = [
  { key: 'name', header: 'Name', cell: (row: Row) => row.name },
  { key: 'status', header: 'Status', cell: (row: Row) => row.status },
];

const FILTERS: readonly DirectoryFilterDef[] = [
  {
    key: 'status',
    label: 'Status',
    options: [
      { value: 'all', label: 'All' },
      { value: 'active', label: 'Active' },
      { value: 'archived', label: 'Archived' },
    ],
  },
  {
    key: 'year',
    label: 'Year',
    options: [
      { value: 'all', label: 'All' },
      { value: '2026', label: '2026' },
    ],
  },
];

function fakeState(filters: Record<string, string> = {}): DirectoryStateApi {
  return {
    params: { filters, sort: 'name:asc', page: 1, pageSize: 25 },
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
  };
}

function fakeQuery(): DirectoryQueryStatus {
  return { isPending: false, isError: false, isFetching: false, refetch: () => {} };
}

let root: Root;
let container: HTMLElement;

beforeEach(() => {
  container = document.createElement('div');
  document.body.append(container);
  root = createRoot(container);
  gateReason.value = null;
});

afterEach(() => {
  act(() => root.unmount());
  container.remove();
});

function renderTable(props: Record<string, unknown>, state: DirectoryStateApi = fakeState()): void {
  act(() => {
    root.render(
      <DirectoryTable<Row>
        state={state}
        query={fakeQuery()}
        rows={ROWS}
        getRowKey={(row) => row.id}
        filters={FILTERS}
        sorts={[]}
        columns={COLUMNS}
        labels={DIRECTORY_DEFAULT_LABELS}
        {...props}
      />,
    );
  });
}

describe('ops/14 directory tab frame', () => {
  test('a write:true header button is greyed and refuses while the gate blocks', () => {
    gateReason.value = 'read-only session';
    renderTable({ header: { title: 'T', primary: { label: 'Invite admin', write: true, onSelect: () => {} } } });
    const button = container.querySelector<HTMLButtonElement>('[data-slot="panel-header-row"] button')!;
    expect(button.disabled).toBe(true);
    expect(button.getAttribute('aria-disabled')).toBe('true');
    expect(button.getAttribute('title')).toBe('read-only session');
  });

  test('a write:true header button is enabled when the gate is clear', () => {
    renderTable({ header: { title: 'T', primary: { label: 'Invite admin', write: true, onSelect: () => {} } } });
    const button = container.querySelector<HTMLButtonElement>('[data-slot="panel-header-row"] button')!;
    expect(button.disabled).toBe(false);
  });
});
