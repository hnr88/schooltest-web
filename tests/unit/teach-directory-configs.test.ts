import { describe, expect, test } from 'vitest';

import {
  masteryClientConfig,
  masterySorts,
  MASTERY_AREA_CODES,
} from '@/modules/teach/lib/mastery-directory.lib';

import type { DiagnosticMasteryRow } from '@/modules/teach/types/diagnostic.types';

// ops/33 — the mastery surface moved onto the shared directory kit in `client`
// mode, so the behaviour the surface used to hand-roll now lives in this pure
// config. These tests pin exactly that behaviour: the honest-absence sort rule,
// the searchable text and the kit contract that EVERY sortable column's sort
// values are offered in the sorts list (useDirectoryState falls back to the
// default sort for any value the list does not declare, so a missing pair would
// silently kill a column header's sort toggle).
//
// R1 PART B: the ROSTER half of this file went with `teach/RosterScreen` — the
// class roster is the v2 Students tab now, on `teacher/lib/v2/students-tab.ts`
// (its own unit tests) and the same shared kit.

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
