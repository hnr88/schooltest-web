import { describe, expect, test } from 'vitest';

import type { RosterRow } from '@/modules/results';
import { t2Result, t2Roster, t2Row } from '@/modules/teacher/lib/v2/__fixtures__/t2';
import { dayFirstDate, reportsView } from '@/modules/teacher/lib/v2/family-reports';
import { studentsTabRow } from '@/modules/teacher/lib/v2/students-tab';

function derive(firstName: string, patch: Partial<RosterRow>): RosterRow {
  return { ...t2Row(firstName), ...patch };
}

describe('reportsView — recorded t2 roster (Spec 06: no release workflow)', () => {
  const view = reportsView(t2Roster);

  test('one row per roster student, in roster order, from the Students tab derivation', () => {
    expect(view.rows).toHaveLength(20);
    expect(view.rows.map((row) => row.name)).toEqual(t2Roster.map((row) => row.student.name));
    expect(view.rows).toEqual(t2Roster.map(studentsTabRow));
  });

  test('totals come from the roster scored count', () => {
    expect(view.total).toBe(20);
    expect(view.scored).toBe(14);
    expect(view.scored).toBe(view.rows.filter((row) => row.isScored).length);
  });

  test('the recorded Dilnoza row wires initials, phase and the result id', () => {
    const row = view.rows.find((entry) => entry.name.startsWith('Dilnoza '));
    expect(row).toMatchObject({
      studentDocumentId: t2Row('Dilnoza').student.document_id,
      resultDocumentId: 'gdijynxot3d31d0pt053jv37',
      name: 'Dilnoza Baptiste',
      initials: 'DB',
      hasResult: true,
      isScored: true,
    });
    expect(row?.phase?.phase).toBe('Beginning');
  });

  test('an unscored held result still has a report row and its phase; release state is not read', () => {
    const row = view.rows.find((entry) => entry.name.startsWith('Lucia '));
    expect(row).toMatchObject({ hasResult: true, isScored: false });
    expect(row).not.toHaveProperty('status');
    expect(row).not.toHaveProperty('whyKey');
    expect(row).not.toHaveProperty('actions');
  });

  test('a student with no result carries the grey-dash row state', () => {
    const view = reportsView([derive('Lucia', { result: null, release_state: 'open' })]);
    expect(view.rows[0]).toMatchObject({
      resultDocumentId: null,
      hasResult: false,
      isScored: false,
      phase: null,
    });
    expect(view).toMatchObject({ scored: 0, total: 1 });
  });

  test('release state changes nothing about the rows a student gets', () => {
    const states: RosterRow['release_state'][] = ['held', 'released', 'recalled'];
    const rows = states.map(
      (release_state) => reportsView([derive('Dilnoza', { release_state })]).rows[0],
    );
    expect(rows[1]).toEqual(rows[0]);
    expect(rows[2]).toEqual(rows[0]);
  });

  test('an empty roster reports zero totals', () => {
    expect(reportsView([])).toEqual({ rows: [], scored: 0, total: 0 });
  });
});

// P1 row 8 — the design writes "sat 31 August", day before month. The date is the recorded
// last history point of the recorded roster (2026-09-10), formatted for every catalogue.
describe('dayFirstDate — day before month, in the reader’s own locale', () => {
  const satAt = t2Result('Dilnoza').history?.at(-1)?.sat_at ?? '';
  const long: Intl.DateTimeFormatOptions = { day: 'numeric', month: 'long', timeZone: 'UTC' };

  test('the recorded sitting date', () => {
    expect(satAt).toBe('2026-09-10');
  });

  test('en swaps the month-first pattern; ms, th and vi already read day-first', () => {
    expect(dayFirstDate('en', satAt, long)).toBe('10 September');
    expect(dayFirstDate('ms', satAt, long)).toBe('10 September');
    expect(dayFirstDate('th', satAt, long)).toBe('10 กันยายน');
    expect(dayFirstDate('vi', satAt, long)).toBe('10 tháng 9');
  });

  test('a locale that numbers its months keeps its own order', () => {
    expect(dayFirstDate('ko', satAt, long)).toBe('9월 10일');
    expect(dayFirstDate('zh', satAt, long)).toBe('9月10日');
  });

  test('the design’s own dates, long and short', () => {
    expect(dayFirstDate('en', '2026-08-31', long)).toBe('31 August');
    expect(dayFirstDate('en', '2026-08-31', { day: 'numeric', month: 'short', timeZone: 'UTC' })).toBe('31 Aug');
  });
});
