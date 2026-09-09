import { describe, expect, test } from 'vitest';

import {
  masteryClientConfig,
  masterySorts,
  MASTERY_AREA_CODES,
} from '@/modules/teach/lib/mastery-directory.lib';
import {
  rosterClientConfig,
  rosterFilters,
  rosterSorts,
} from '@/modules/teach/lib/roster-directory.lib';

import type { DiagnosticMasteryRow } from '@/modules/teach/types/diagnostic.types';
import type { RosterChild } from '@/modules/teach/types/roster.types';

// ops/33 — the roster and mastery surfaces moved onto the shared directory
// kit in `client` mode, so the behaviour the surfaces used to hand-roll now
// lives in these two pure configs. These tests pin exactly that behaviour:
// the honest-absence sort rule, the status filter, the searchable text and
// the kit contract that EVERY sortable column's sort values are offered in
// the sorts list (useDirectoryState falls back to the default sort for any
// value the list does not declare, so a missing pair would silently kill a
// column header's sort toggle).

function rosterRow(overrides: Partial<RosterChild> & { documentId: string }): RosterChild {
  return {
    given_name: null,
    family_name: null,
    email: null,
    status: 'active',
    email_fix_requested: false,
    class: null,
    ...overrides,
  };
}

function masteryRow(
  overrides: Partial<DiagnosticMasteryRow> & { student_ref: string },
): DiagnosticMasteryRow {
  return {
    student_document_id: overrides.student_ref,
    latest_result_document_id: null,
    attributes: [],
    ...overrides,
  };
}

const ROSTER_ROWS: RosterChild[] = [
  rosterRow({ documentId: 'b2', given_name: 'Amy', family_name: 'Zed', status: 'archived' }),
  rosterRow({ documentId: 'a1', given_name: 'Zoe', family_name: 'Ann', email: 'zoe@x.test' }),
];

describe('ops/33 roster directory config', () => {
  test('sorts by display name in both directions, documentId as the tiebreak', () => {
    const asc = [...ROSTER_ROWS].sort(rosterClientConfig.comparators!['name:asc']!);
    const desc = [...ROSTER_ROWS].sort(rosterClientConfig.comparators!['name:desc']!);
    expect(asc.map((row) => row.documentId)).toEqual(['b2', 'a1']);
    expect(desc.map((row) => row.documentId)).toEqual(['a1', 'b2']);
  });

  test('the status filter predicate passes only the exact status', () => {
    const predicate = rosterClientConfig.filterPredicates!.status!;
    expect(ROSTER_ROWS.filter((row) => predicate(row, 'archived'))).toHaveLength(1);
    expect(ROSTER_ROWS.filter((row) => predicate(row, 'active'))).toHaveLength(1);
  });

  test('search matches the display name and the email', () => {
    const text = rosterClientConfig.searchText!;
    expect(text(ROSTER_ROWS[0]!).join(' ').toLowerCase()).toContain('amy zed');
    expect(text(ROSTER_ROWS[1]!).join(' ')).toContain('zoe@x.test');
  });

  test('the status filter offers the ALL sentinel first and the sorts declare both directions', () => {
    const filters = rosterFilters({
      label: 'Status',
      all: 'all',
      active: 'active',
      archived: 'archived',
    });
    expect(filters[0]!.options.map((option) => option.value)).toEqual([
      'all',
      'active',
      'archived',
    ]);
    expect(rosterSorts({ asc: 'A', desc: 'D' }).map((sort) => sort.value)).toEqual([
      'name:asc',
      'name:desc',
    ]);
  });
});

const MASTERED: DiagnosticMasteryRow = masteryRow({
  student_ref: 'Ann',
  attributes: [{ code: 'R1', status: 'mastered', prob: null }],
});
const EMERGING: DiagnosticMasteryRow = masteryRow({
  student_ref: 'Bea',
  attributes: [{ code: 'R1', status: 'emerging', prob: null }],
});
const NOT_MASTERED: DiagnosticMasteryRow = masteryRow({
  student_ref: 'Cat',
  attributes: [{ code: 'R1', status: 'not_mastered', prob: null }],
});
const NOT_ASSESSED: DiagnosticMasteryRow = masteryRow({ student_ref: 'Dot' });
const ROWS = [EMERGING, NOT_ASSESSED, MASTERED, NOT_MASTERED];

describe('ops/33 mastery directory config', () => {
  test('an area sort ranks mastered > emerging > not mastered, whole set, ties by name', () => {
    const asc = [...ROWS].sort(masteryClientConfig.comparators!['R1:asc']!);
    expect(asc.map((row) => row.student_ref)).toEqual(['Cat', 'Bea', 'Ann', 'Dot']);
    const desc = [...ROWS].sort(masteryClientConfig.comparators!['R1:desc']!);
    expect(desc.map((row) => row.student_ref)).toEqual(['Ann', 'Bea', 'Cat', 'Dot']);
  });

  test('a missing attribute — and not_assessed — sort LAST in BOTH directions, never as a score', () => {
    const neverFirst = (order: string[]) => order.at(-1) === 'Dot';
    expect(
      neverFirst([...ROWS].sort(masteryClientConfig.comparators!['R1:asc']!).map((r) => r.student_ref)),
    ).toBe(true);
    expect(
      neverFirst([...ROWS].sort(masteryClientConfig.comparators!['R1:desc']!).map((r) => r.student_ref)),
    ).toBe(true);
  });

  test('search matches only the student name', () => {
    expect(masteryClientConfig.searchText!(MASTERED)).toEqual(['Ann']);
  });

  test('every sortable column direction is declared in the sorts list', () => {
    const labels = {
      nameAsc: 'a',
      nameDesc: 'd',
      weakest: (area: string) => `w:${area}`,
      strongest: (area: string) => `s:${area}`,
      areaLabel: (code: string) => code,
    };
    const sorts = masterySorts(labels);
    const values = new Set(sorts.map((sort) => sort.value));
    expect(values.has('name:asc')).toBe(true);
    expect(values.has('name:desc')).toBe(true);
    for (const code of MASTERY_AREA_CODES) {
      expect(values.has(`${code}:asc`)).toBe(true);
      expect(values.has(`${code}:desc`)).toBe(true);
    }
    expect(values.size).toBe(sorts.length);
  });
});
