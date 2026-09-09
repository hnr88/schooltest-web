import { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { Eye, Pencil, Trash2 } from 'lucide-react';
import { afterEach, describe, expect, test, vi } from 'vitest';

import { DirectoryList } from '@/modules/directory/components/DirectoryList';
import { DirectoryRows } from '@/modules/directory/components/DirectoryRows';
import { buildDirectoryRowGroups } from '@/modules/directory/lib/directory-row-api';
import { DIRECTORY_DEFAULT_LABELS } from '@/modules/directory/constants/directory.constants';
import type {
  DirectoryGroupDef,
  DirectoryRowAction,
  DirectorySelectionApi,
  DirectoryStateApi,
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

const COLUMNS = [
  { key: 'name', header: 'Name', cell: (row: Row) => row.name },
  { key: 'band', header: 'Band', cell: (row: Row) => row.band },
];

const target = (row: Row) => ({ kind: 'school', documentId: row.id });

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

function fakeSelection(selected: ReadonlySet<string> = new Set()): DirectorySelectionApi<Row> {
  return {
    count: selected.size,
    atCap: false,
    headerState: 'none',
    targets: [],
    isSelected: (row) => selected.has(row.id),
    toggleRow: vi.fn(),
    toggleAllOnPage: vi.fn(),
    clear: vi.fn(),
  };
}

let host: HTMLElement | undefined;
let root: Root | undefined;

function render(node: React.ReactNode): HTMLElement {
  host = document.createElement('div');
  document.body.appendChild(host);
  root = createRoot(host);
  act(() => root!.render(node));
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

const renderRow = (row: Row) => <span data-testid="tile">{row.name}</span>;

describe('the layout axis — element shape per layout', () => {
  test('`rows` is a flex column of <li> inside an explicit <ul role="list">', () => {
    const container = render(
      <DirectoryList layout="rows" groups={groupsFor(ROWS)} renderRow={renderRow} />,
    );

    const list = container.querySelector('ul');
    expect(list).not.toBeNull();
    // Explicit on purpose: Safari drops the implicit list role once
    // `list-style: none` is set, which every track below does.
    expect(list!.getAttribute('role')).toBe('list');
    expect(list!.className).toContain('flex');
    expect(list!.className).toContain('flex-col');
    expect(list!.querySelectorAll(':scope > li')).toHaveLength(3);
  });

  test('`cards` and `tiles` add the named grid track from globals.css, never an arbitrary value', () => {
    const cards = render(
      <DirectoryList layout="cards" groups={groupsFor(ROWS)} renderRow={renderRow} />,
    );
    const cardTrack = cards.querySelector('ul')!;
    expect(cardTrack.className).toContain('grid');
    expect(cardTrack.className).toContain('grid-cols-directory-cards');
    expect(cardTrack.className).not.toMatch(/\[/);

    act(() => root!.unmount());
    host!.remove();

    const tiles = render(
      <DirectoryList layout="tiles" groups={groupsFor(ROWS)} renderRow={renderRow} />,
    );
    const tileTrack = tiles.querySelector('ul')!;
    expect(tileTrack.className).toContain('grid');
    expect(tileTrack.className).toContain('grid-cols-directory-tiles');
    expect(tileTrack.className).not.toMatch(/\[/);
  });

  test('the list body emits no role="listbox" — a surface that needs one supplies it via renderRow', () => {
    const container = render(
      <DirectoryList layout="tiles" groups={groupsFor(ROWS)} renderRow={renderRow} />,
    );
    expect(container.querySelector('[role="listbox"]')).toBeNull();
  });

  test('`table` stays a real <table> and carries no list markup', () => {
    const container = render(
      <DirectoryRows
        state={fakeState()}
        columns={COLUMNS}
        rows={ROWS}
        getRowTarget={target}
        selectable={false}
        selection={fakeSelection()}
        labels={DIRECTORY_DEFAULT_LABELS}
      />,
    );
    expect(container.querySelector('table')).not.toBeNull();
    expect(container.querySelector('ul')).toBeNull();
    expect(container.querySelectorAll('tbody tr')).toHaveLength(3);
  });

  test('DirectoryList holds no colSpan arithmetic — no <td> can escape a table', () => {
    const container = render(
      <DirectoryList layout="rows" groups={groupsFor(ROWS)} renderRow={renderRow} />,
    );
    expect(container.querySelector('td')).toBeNull();
    expect(container.querySelector('[colspan]')).toBeNull();
  });
});

describe('groupBy works in every layout', () => {
  const groupBy: DirectoryGroupDef<Row> = {
    key: (row) => row.band,
    heading: (key, count) => `${key} (${count})`,
    order: ['Year 6', 'Year 5'],
  };

  test('list layouts emit <section> + <h3> per group, in `order`', () => {
    const container = render(
      <DirectoryList layout="tiles" groups={groupsFor(ROWS, { groupBy })} renderRow={renderRow} />,
    );
    const headings = [...container.querySelectorAll('section > h3')].map((h) => h.textContent);
    expect(headings).toEqual(['Year 6 (1)', 'Year 5 (2)']);
    expect(container.querySelectorAll('ul')).toHaveLength(2);
  });

  test('table layout emits a full-width heading row instead, same order', () => {
    const container = render(
      <DirectoryRows
        state={fakeState()}
        columns={COLUMNS}
        rows={ROWS}
        getRowTarget={target}
        selectable={false}
        selection={fakeSelection()}
        labels={DIRECTORY_DEFAULT_LABELS}
        groupBy={groupBy}
      />,
    );
    const headings = [...container.querySelectorAll('[data-slot="directory-group-heading"] td')];
    expect(headings.map((cell) => cell.textContent)).toEqual(['Year 6 (1)', 'Year 5 (2)']);
    // Full width: two columns, no selection column, no actions column.
    expect(headings[0]!.getAttribute('colspan')).toBe('2');
  });

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

describe('§L-rownav — the whole-row link without a nested interactive', () => {
  const actions: DirectoryRowAction<Row>[] = [{ label: 'Archive', onSelect: vi.fn() }];

  test('rowHref renders exactly one anchor, in the first cell, with rowActions outside it', () => {
    const container = render(
      <DirectoryRows
        state={fakeState()}
        columns={COLUMNS}
        rows={[ROWS[0]!]}
        getRowTarget={target}
        selectable={false}
        selection={fakeSelection()}
        rowActions={() => actions}
        labels={DIRECTORY_DEFAULT_LABELS}
        rowHref={(row) => `/dashboard/ops/schools/${row.id}`}
      />,
    );

    const anchors = container.querySelectorAll('a[data-row-href]');
    expect(anchors).toHaveLength(1);

    const cells = container.querySelectorAll('tbody td');
    expect(cells[0]!.contains(anchors[0]!)).toBe(true);
    expect(anchors[0]!.textContent).toBe('Alpha Primary');

    // The row menu is a sibling of the link, never inside it — that nesting is
    // the axe `nested-interactive` failure this rule exists to prevent.
    const menuTrigger = container.querySelector('button[aria-label="Row actions"]');
    expect(menuTrigger).not.toBeNull();
    expect(anchors[0]!.contains(menuTrigger!)).toBe(false);
  });

  test('onRowSelect renders a button in the first cell instead — never onClick on the <tr>', () => {
    const onRowSelect = vi.fn();
    const container = render(
      <DirectoryRows
        state={fakeState()}
        columns={COLUMNS}
        rows={[ROWS[0]!]}
        getRowTarget={target}
        selectable={false}
        selection={fakeSelection()}
        labels={DIRECTORY_DEFAULT_LABELS}
        onRowSelect={onRowSelect}
      />,
    );

    const button = container.querySelector<HTMLButtonElement>('button[data-row-select]');
    expect(button).not.toBeNull();
    expect(container.querySelector('a[data-row-href]')).toBeNull();

    act(() => {
      button!.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    });
    expect(onRowSelect).toHaveBeenCalledWith(ROWS[0]);
  });

  test('rowHref is ignored in a non-table layout and warns in dev', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const container = render(
      <DirectoryList
        layout="tiles"
        groups={groupsFor(ROWS)}
        renderRow={renderRow}
        rowHref={(row) => `/x/${row.id}`}
      />,
    );

    expect(container.querySelector('a[data-row-href]')).toBeNull();
    expect(warn).toHaveBeenCalledTimes(1);
    expect(warn.mock.calls[0]![0]).toContain('rowHref');
    warn.mockRestore();
  });

  test('the kit never ships the stretched-row shape §11.1 forbids', () => {
    const container = render(
      <DirectoryRows
        state={fakeState()}
        columns={COLUMNS}
        rows={ROWS}
        getRowTarget={target}
        selectable={false}
        selection={fakeSelection()}
        labels={DIRECTORY_DEFAULT_LABELS}
        rowHref={(row) => `/x/${row.id}`}
      />,
    );
    for (const row of container.querySelectorAll('tbody tr')) {
      expect(row.className).not.toContain('after:absolute');
      expect(row.className).not.toContain('after:inset-0');
    }
  });
});
