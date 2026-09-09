import { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { Eye, Pencil, Trash2 } from 'lucide-react';
import { afterEach, describe, expect, test, vi } from 'vitest';

import { DirectoryRows } from '@/modules/directory/components/DirectoryRows';
import { DIRECTORY_DEFAULT_LABELS } from '@/modules/directory/constants/directory.constants';
import type {
  DirectoryRowAction,
  DirectorySelectionApi,
  DirectoryStateApi,
} from '@/modules/directory/types/directory.types';

// Task 02 — the per-row actions cell: up to two `quick` actions (with an
// icon) render inline ahead of the ⋯ menu, and the menu still lists EVERY
// action — inline is a shortcut, not a filter.

(globalThis as Record<string, unknown>).IS_REACT_ACT_ENVIRONMENT = true;

interface Row {
  id: string;
  name: string;
}

const ROW: Row = { id: 'r1', name: 'Alpha Primary' };
const COLUMNS = [{ key: 'name', header: 'Name', cell: (row: Row) => row.name }];

function fakeState(): DirectoryStateApi {
  return {
    params: { filters: {}, sort: 'name:asc', page: 1, pageSize: 25 },
    mode: 'server',
    searchInput: '',
    setSearchInput: vi.fn(),
    setFilter: vi.fn(),
    setSort: vi.fn(),
    setPage: vi.fn(),
    clearFilters: vi.fn(),
    hasActiveControls: false,
  };
}

function fakeSelection(): DirectorySelectionApi<Row> {
  return {
    count: 0,
    atCap: false,
    headerState: 'none',
    targets: [],
    isSelected: () => false,
    toggleRow: vi.fn(),
    toggleAllOnPage: vi.fn(),
    clear: vi.fn(),
  };
}

let host: HTMLElement | undefined;
let root: Root | undefined;

function renderRows(actions: readonly DirectoryRowAction<Row>[]): HTMLElement {
  host = document.createElement('div');
  document.body.appendChild(host);
  root = createRoot(host);
  act(() => {
    root!.render(
      <DirectoryRows
        state={fakeState()}
        columns={COLUMNS}
        rows={[ROW]}
        getRowTarget={(row) => ({ kind: 'thing', documentId: row.id })}
        selectable={false}
        selection={fakeSelection()}
        rowActions={() => actions}
        labels={DIRECTORY_DEFAULT_LABELS}
      />,
    );
  });
  return host;
}

afterEach(() => {
  if (root !== undefined && host !== undefined) {
    act(() => root!.unmount());
    host!.remove();
    root = undefined;
    host = undefined;
  }
});

function openRowMenu(container: HTMLElement): void {
  const trigger = container.querySelector<HTMLButtonElement>('button[aria-label="Row actions"]');
  expect(trigger).not.toBeNull();
  act(() => trigger!.click());
}

describe('DirectoryRows quick actions', () => {
  test('two quick actions render inline; the menu still lists every action', () => {
    const onEdit = vi.fn();
    const actions: readonly DirectoryRowAction<Row>[] = [
      { label: 'Edit', onSelect: onEdit, quick: true, icon: Pencil },
      { label: 'View', onSelect: vi.fn(), quick: true, icon: Eye },
      { label: 'Delete', onSelect: vi.fn(), quick: true, icon: Trash2, destructive: true },
      { label: 'Archive', onSelect: vi.fn() },
    ];
    const container = renderRows(actions);

    // Exactly the first two quick actions inline; the third stays menu-only.
    expect(container.querySelector('[data-slot="row-actions-cluster"]')).not.toBeNull();
    expect(container.querySelectorAll('button[aria-label="Edit"]')).toHaveLength(1);
    expect(container.querySelectorAll('button[aria-label="View"]')).toHaveLength(1);
    expect(container.querySelectorAll('button[aria-label="Delete"]')).toHaveLength(0);
    expect(container.querySelectorAll('button[aria-label="Archive"]')).toHaveLength(0);

    // The inline shortcut fires the action with the row.
    act(() => container.querySelector<HTMLButtonElement>('button[aria-label="Edit"]')!.click());
    expect(onEdit).toHaveBeenCalledWith(ROW);

    // The menu lists ALL four actions — inline did not filter it.
    openRowMenu(container);
    const menuText = document.body.textContent ?? '';
    for (const label of ['Edit', 'View', 'Delete', 'Archive']) {
      expect(menuText).toContain(label);
    }
  });

  test('no quick actions renders the bare menu trigger, no cluster', () => {
    const container = renderRows([
      { label: 'Edit', onSelect: vi.fn() },
      { label: 'Archive', onSelect: vi.fn() },
    ]);
    expect(container.querySelector('[data-slot="row-actions-cluster"]')).toBeNull();
    expect(container.querySelectorAll('button[aria-label="Edit"]')).toHaveLength(0);
    expect(container.querySelectorAll('button[aria-label="Row actions"]')).toHaveLength(1);

    openRowMenu(container);
    const menuText = document.body.textContent ?? '';
    expect(menuText).toContain('Edit');
    expect(menuText).toContain('Archive');
  });
});
