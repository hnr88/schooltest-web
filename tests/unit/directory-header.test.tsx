import { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';

import { DirectoryChips } from '@/modules/directory/components/DirectoryChips';
import { DirectoryHeader } from '@/modules/directory/components/DirectoryHeader';
import { DirectoryTable } from '@/modules/directory/components/DirectoryTable';
import { DIRECTORY_DEFAULT_LABELS } from '@/modules/directory/constants/directory.constants';
import type {
  DirectoryFilterDef,
  DirectoryHeaderDef,
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

const HEADER: DirectoryHeaderDef = {
  title: 'School admins',
  summary: '2 invited · 1 active',
  primary: { label: 'Invite admin', onSelect: () => {} },
  secondary: { onSelect: () => {} },
};

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
  test('a header-less table renders byte-identically: no header, no chips, snapshot pinned', () => {
    renderTable({});
    const html = container.innerHTML;
    expect(html).not.toContain('panel-header-row');
    expect(html).not.toContain('ds.exportCsv');
    expect(html).not.toContain('role="group"');
    expect(html).toMatchSnapshot();
  });

  test('header renders title, summary and both buttons; secondary falls back to the Export label', () => {
    renderTable({ header: HEADER });
    const header = container.querySelector('[data-slot="panel-header-row"]')!;
    expect(header).not.toBeNull();
    expect(header.querySelector('h2')!.textContent).toBe('School admins');
    expect(header.textContent).toContain('2 invited · 1 active');
    const buttons = [...header.querySelectorAll('button')];
    expect(buttons.map((button) => button.textContent)).toEqual(['ds.exportCsv', 'Invite admin']);
  });

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

  test('chipFilterKey renders that filter as chips and drops only its select', () => {
    renderTable({ chipFilterKey: 'status' }, fakeState());
    const chips = container.querySelector('[role="group"]');
    expect(chips).not.toBeNull();
    expect([...chips!.querySelectorAll('button')].map((b) => b.textContent)).toEqual([
      'All',
      'Active',
      'Archived',
    ]);
    // The remaining filter stays a select; the chip-served one does not double-render.
    expect(container.textContent).toContain('Year');
    expect(container.textContent).not.toContain('Archived\nArchived');
  });

  test('an unknown chipFilterKey throws — a misconfiguration never renders silently', () => {
    expect(() => renderTable({ chipFilterKey: 'nope' })).toThrowError(
      /chipFilterKey "nope" does not match any filters key/,
    );
  });

  test('emptyCopy overrides the empty arm; the labels stand when it is absent', () => {
    renderTable({ rows: [], emptyCopy: { title: 'No admins yet', body: 'Invite the first one.' } });
    expect(container.textContent).toContain('No admins yet');
    expect(container.textContent).toContain('Invite the first one.');
  });

  test('DirectoryChips falls back to the kit All label for an unlabelled sentinel', () => {
    const target = document.createElement('div');
    document.body.append(target);
    const chipRoot = createRoot(target);
    act(() => {
      chipRoot.render(
        <DirectoryChips
          filter={{ key: 'status', label: 'Status', options: [{ value: 'all', label: '' }, { value: 'active', label: 'Active' }] }}
          value="all"
          onValueChange={() => {}}
        />,
      );
    });
    expect(target.textContent).toContain('ds.chipAll');
    act(() => chipRoot.unmount());
    target.remove();
  });
});
