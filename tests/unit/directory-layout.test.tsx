import { act } from 'react';
import { type Root } from 'react-dom/client';
import { Eye, Pencil, Trash2 } from 'lucide-react';
import { afterEach, describe, expect, test, vi } from 'vitest';
import { buildDirectoryRowGroups } from '@/modules/directory/lib/directory-row-api';
import type {
  DirectoryGroupDef,
  DirectoryRowAction,
  DirectorySelectionApi,
} from '@/modules/directory/types/directory.types';

// teacher/01 — the layout axis (U-05, U-11, U-44). `layout` changes the BODY
// and nothing else, so every case here is about element shape, grouping, row
// identity and the row-nav rules — never about filtering, sorting, selection
// modes, pagination or the state arms, which the axis does not touch.

(globalThis as Record<string, unknown>).IS_REACT_ACT_ENVIRONMENT = true;

// `DirectoryRows` navigates with next-intl's locale-aware <Link>, which needs a
// provider this bare createRoot render has no reason to stand up. The mock
// keeps the ELEMENT SHAPE the assertions are actually about — one anchor, in
// the first cell, with the row menu outside it — and weakens nothing.
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
  band: string;
}

const ROWS: Row[] = [
  { id: 'r1', name: 'Alpha Primary', band: 'Year 5' },
  { id: 'r2', name: 'Beta Primary', band: 'Year 6' },
  { id: 'r3', name: 'Gamma Primary', band: 'Year 5' },
];

const target = (row: Row) => ({ kind: 'school', documentId: row.id });

function fakeSelection(selected: ReadonlySet<string> = new Set()): DirectorySelectionApi<Row> {
  return {
    count: selected.size,
    atCap: false,
    headerState: 'none',
    targets: [],
    selectedRows: [],
    isSelected: (row) => selected.has(row.id),
    toggleRow: vi.fn(),
    toggleAllOnPage: vi.fn(),
    clear: vi.fn(),
  };
}

let host: HTMLElement | undefined;
let root: Root | undefined;

afterEach(() => {
  if (root !== undefined && host !== undefined) {
    act(() => root!.unmount());
    host!.remove();
    root = undefined;
    host = undefined;
  }
});

function groupsFor(
  rows: readonly Row[],
  options: {
    groupBy?: DirectoryGroupDef<Row>;
    rowActions?: (row: Row) => readonly DirectoryRowAction<Row>[];
    getRowKey?: (row: Row) => string;
    selected?: ReadonlySet<string>;
  } = {},
) {
  return buildDirectoryRowGroups({
    rows,
    getRowKey: options.getRowKey,
    getRowTarget: target,
    selection: fakeSelection(options.selected),
    rowActions: options.rowActions,
    groupBy: options.groupBy,
  });
}

describe('groupBy works in every layout', () => {
  const groupBy: DirectoryGroupDef<Row> = {
    key: (row) => row.band,
    heading: (key, count) => `${key} (${count})`,
    order: ['Year 6', 'Year 5'],
  };

  test('keys absent from `order` follow it, in first-seen order, stably', () => {
    const partial: DirectoryGroupDef<Row> = { ...groupBy, order: ['Year 5'] };
    const rows: Row[] = [
      { id: 'a', name: 'A', band: 'Year 7' },
      { id: 'b', name: 'B', band: 'Year 5' },
      { id: 'c', name: 'C', band: 'Year 6' },
    ];
    const groups = groupsFor(rows, { groupBy: partial });
    expect(groups.map((group) => group.key)).toEqual(['Year 5', 'Year 7', 'Year 6']);
  });

  test('`last` is the final row OF ITS GROUP, not merely of the page', () => {
    const groups = groupsFor(ROWS, { groupBy });
    const flags = groups.map((group) => group.rows.map((entry) => entry.api.last));
    // Year 6 has one row (last), Year 5 has two (only the second is last).
    expect(flags).toEqual([[true], [false, true]]);
  });
});

describe('the row api is derived once, for both bodies', () => {
  test('getRowKey defaults to selectionKey(getRowTarget(row)) — `kind:documentId`', () => {
    const [group] = groupsFor(ROWS);
    expect(group!.rows.map((entry) => entry.api.key)).toEqual([
      'school:r1',
      'school:r2',
      'school:r3',
    ]);
  });

  test('an explicit getRowKey wins over the default', () => {
    const [group] = groupsFor(ROWS, { getRowKey: (row) => `custom-${row.id}` });
    expect(group!.rows[0]!.api.key).toBe('custom-r1');
  });

  test('quickActions is capped at two, and the menu still lists every action', () => {
    const actions: DirectoryRowAction<Row>[] = [
      { label: 'View', onSelect: vi.fn(), quick: true, icon: Eye },
      { label: 'Edit', onSelect: vi.fn(), quick: true, icon: Pencil },
      { label: 'Delete', onSelect: vi.fn(), quick: true, icon: Trash2, destructive: true },
      { label: 'Menu only', onSelect: vi.fn() },
      // `quick` without an icon is menu-only — there is nothing to draw.
      { label: 'Quick without icon', onSelect: vi.fn(), quick: true },
    ];
    const [group] = groupsFor(ROWS, { rowActions: () => actions });
    const api = group!.rows[0]!.api;

    expect(api.quickActions.map((action) => action.label)).toEqual(['View', 'Edit']);
    expect(api.actions).toHaveLength(5);
  });

  test('selection state reaches renderRow through the same api the table uses', () => {
    const [group] = groupsFor(ROWS, { selected: new Set(['r2']) });
    expect(group!.rows.map((entry) => entry.api.selected)).toEqual([false, true, false]);
  });
});
