import { describe, expect, test } from 'vitest';

import { applyClientDirectoryMode } from '@/modules/directory/lib/client-mode';
import { defaultUrlState, toQueryParams } from '@/modules/directory/lib/directory-url';
import type { DirectoryQueryParams } from '@/modules/directory/types/directory.types';

// Task 02 — the client-mode reducer applies exactly what the server would
// have (q, filters, sort, page window) and synthesises the meta, including
// the last-page clamp server mode deliberately refuses to do (the endpoint
// answers a 400 there instead — pinned by the toQueryParams pass-through).

interface FixtureRow {
  id: string;
  name: string;
  state: string;
  level: string;
}

const ROWS: readonly FixtureRow[] = [
  { id: '1', name: 'Zulu College', state: 'NSW', level: 'secondary' },
  { id: '2', name: 'Alpha Primary', state: 'VIC', level: 'primary' },
  { id: '3', name: 'Mike Academy', state: 'NSW', level: 'primary' },
  { id: '4', name: 'Bravo School', state: 'QLD', level: 'secondary' },
  { id: '5', name: 'Charlie Grammar', state: 'VIC', level: 'secondary' },
];

function params(overrides: Partial<DirectoryQueryParams> = {}): DirectoryQueryParams {
  return { filters: {}, sort: 'name:asc', page: 1, pageSize: 2, ...overrides };
}

const CONFIG = {
  searchText: (row: FixtureRow) => [row.name],
  filterPredicates: {
    state: (row: FixtureRow, value: string) => row.state === value,
  },
  comparators: {
    'name:asc': (a: FixtureRow, b: FixtureRow) => a.name.localeCompare(b.name),
  },
};

describe('applyClientDirectoryMode', () => {
  test('q matches case-insensitively and total reports the FILTERED length', () => {
    const { rows, meta } = applyClientDirectoryMode(ROWS, params({ q: 'ALPHA', pageSize: 25 }), CONFIG);
    expect(rows.map((row) => row.id)).toEqual(['2']);
    expect(meta.total).toBe(1);
    expect(meta.pageCount).toBe(1);
  });

  test('q without a searchText config passes every row through', () => {
    const { rows, meta } = applyClientDirectoryMode(ROWS, params({ q: 'zzz' }), {});
    expect(rows).toHaveLength(2); // pageSize window of the untouched list
    expect(meta.total).toBe(5);
  });

  test('an active filter runs its predicate', () => {
    const { rows, meta } = applyClientDirectoryMode(
      ROWS,
      params({ filters: { state: 'NSW' }, pageSize: 25 }),
      CONFIG,
    );
    // Sorted by name:asc (the default sort's comparator) — Mike before Zulu.
    expect(rows.map((row) => row.id)).toEqual(['3', '1']);
    expect(meta.total).toBe(2);
  });

  test('a filter key without a predicate passes every row through', () => {
    const { meta } = applyClientDirectoryMode(
      ROWS,
      params({ filters: { unknown: 'x' }, pageSize: 25 }),
      CONFIG,
    );
    expect(meta.total).toBe(5);
  });

  test('the declared comparator sorts a copy — the input array keeps its load order', () => {
    const { rows } = applyClientDirectoryMode(ROWS, params({ pageSize: 25 }), CONFIG);
    expect(rows.map((row) => row.name)).toEqual([
      'Alpha Primary',
      'Bravo School',
      'Charlie Grammar',
      'Mike Academy',
      'Zulu College',
    ]);
    expect(ROWS[0]!.name).toBe('Zulu College');
  });

  test('a sort value without a comparator keeps the loaded order', () => {
    const { rows } = applyClientDirectoryMode(ROWS, params({ sort: 'level:asc', pageSize: 25 }), CONFIG);
    expect(rows.map((row) => row.id)).toEqual(['1', '2', '3', '4', '5']);
  });

  test('page 2 returns the second window', () => {
    const { rows, meta } = applyClientDirectoryMode(ROWS, params({ page: 2 }), CONFIG);
    expect(rows.map((row) => row.name)).toEqual(['Charlie Grammar', 'Mike Academy']);
    expect(meta.page).toBe(2);
    expect(meta.pageCount).toBe(3);
  });

  test('an out-of-range page clamps to the last page (client mode)', () => {
    const { rows, meta } = applyClientDirectoryMode(ROWS, params({ page: 99 }), CONFIG);
    expect(meta.page).toBe(3);
    expect(meta.pageCount).toBe(3);
    expect(rows.map((row) => row.name)).toEqual(['Zulu College']);
  });

  test('an empty result reports page 1 of 0 with no rows', () => {
    const { rows, meta } = applyClientDirectoryMode([], params(), CONFIG);
    expect(rows).toEqual([]);
    expect(meta).toEqual({ page: 1, pageSize: 2, pageCount: 0, total: 0 });
  });
});

describe('server mode page pass-through', () => {
  // toQueryParams is what a server-mode consumer spreads into its query: the
  // page is NOT clamped here — clamping would hide the endpoint's 400, which
  // is the documented server-mode answer to an out-of-range page.
  test('toQueryParams passes the URL page through unclamped', () => {
    const queryParams = toQueryParams({ ...defaultUrlState('name:asc'), page: 999 }, 25);
    expect(queryParams.page).toBe(999);
  });
});
