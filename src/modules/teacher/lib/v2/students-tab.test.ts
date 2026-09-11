import { describe, expect, test } from 'vitest';

import type { RosterRow } from '@/modules/results';
import { t2Roster, t2Row } from '@/modules/teacher/lib/v2/__fixtures__/t2';
import { studentsTabRows } from '@/modules/teacher/lib/v2/students-tab';
import type { StudentsTabRow, StudentsTabView } from '@/modules/teacher/types/v2-class-tabs.types';

const UNSCORED = ['Chen Baptiste', 'Lucia Baptiste', 'Nour Baptiste', 'Panit Baptiste', 'Qadir Baptiste', 'Sunniva Baptiste'];

function names(view: StudentsTabView): string[] {
  return view.rows.map((row) => row.name);
}

function rowOf(firstName: string): StudentsTabRow {
  const row = studentsTabRows(t2Roster).rows.find((entry) => entry.name.startsWith(`${firstName} `));
  if (row === undefined) throw new Error(`no row for ${firstName}`);
  return row;
}

describe('studentsTabRows — recorded t2 roster (Reading 8B, 20 students)', () => {
  test('every roster student is a row; 14 carry a score', () => {
    const view = studentsTabRows(t2Roster);
    expect(view).toMatchObject({ total: 20, matched: 20, scored: 14 });
    expect(view.rows).toHaveLength(20);
  });

  test('the default sort is name A to Z', () => {
    const sorted = names(studentsTabRows(t2Roster));
    expect(sorted.slice(0, 3)).toEqual(['Amara Baptiste', 'Bilal Baptiste', 'Chen Baptiste']);
    expect(sorted.at(-1)).toBe('Tenzin Baptiste');
  });

  test('highest score first; unscored students sort last, by name', () => {
    const { rows } = studentsTabRows(t2Roster, { sort: 'high' });
    expect(rows.slice(0, 4).map((row) => [row.name, row.score])).toEqual([
      ['Bilal Baptiste', 54],
      ['Rosa Baptiste', 45],
      ['Amara Baptiste', 42],
      ['Dilnoza Baptiste', 41],
    ]);
    expect(rows.slice(-6).map((row) => row.name)).toEqual(UNSCORED);
  });

  test('lowest score first starts at Tenzin (37) and still sorts unscored last', () => {
    const { rows } = studentsTabRows(t2Roster, { sort: 'low' });
    expect([rows[0].name, rows[0].score]).toEqual(['Tenzin Baptiste', 37]);
    expect(rows.slice(-6).map((row) => row.name)).toEqual(UNSCORED);
  });

  test('ACARA phase sort puts the most advanced phase first and students with no phase last', () => {
    const { rows } = studentsTabRows(t2Roster, { sort: 'phase' });
    expect(rows.slice(0, 2).map((row) => [row.name, row.phase?.phase])).toEqual([
      ['Bilal Baptiste', 'Emerging'],
      ['Rosa Baptiste', 'Emerging'],
    ]);
    expect(rows.slice(-6).map((row) => row.name)).toEqual(UNSCORED);
  });

  test('recorded Dilnoza: score, server growth, weakest subskill and server phase', () => {
    expect(rowOf('Dilnoza')).toEqual({
      studentDocumentId: t2Row('Dilnoza').student.document_id,
      resultDocumentId: 'gdijynxot3d31d0pt053jv37',
      name: 'Dilnoza Baptiste',
      initials: 'DB',
      ealdFlag: false,
      score: 41,
      growth: { kind: 'down', delta: -43, points: -45, reliable: true, fg: '#B42318' },
      weakest: { skill: 'Decoding', labelKey: 'skill.decoding', score: 25 },
      phase: {
        phase: 'Beginning',
        source: 'server',
        labelKey: 'phase.beginning',
        subLabelKey: 'phaseSub.beginning',
        tone: { fg: '#B42318', bg: '#FDEEEC' },
      },
      hasResult: true,
      isScored: true,
    });
  });

  test('recorded Lucia: a result without an overall score is listed unscored, with nulls', () => {
    expect(rowOf('Lucia')).toMatchObject({
      score: null,
      isScored: false,
      hasResult: true,
      phase: null,
      weakest: null,
      growth: { kind: 'none' },
    });
  });

  test('recorded Amara: the weakest subskill can be the vocabulary blend', () => {
    expect(rowOf('Amara').weakest).toEqual({ skill: 'Vocabulary', labelKey: 'skill.vocabulary', score: 25 });
  });

  test('recorded Bilal: no subskill assessed, so no weakest subskill despite a score of 54', () => {
    expect(rowOf('Bilal')).toMatchObject({ score: 54, weakest: null });
  });

  test('search matches the name, trimmed and case-insensitive', () => {
    expect(names(studentsTabRows(t2Roster, { query: '  dilNOZA ' }))).toEqual(['Dilnoza Baptiste']);
    expect(studentsTabRows(t2Roster, { query: 'zzz' })).toMatchObject({ rows: [], matched: 0, total: 20 });
  });

  test('empty roster (the recorded roster with every row removed) gives an empty view', () => {
    expect(studentsTabRows(t2Roster.slice(0, 0))).toEqual({ rows: [], total: 0, matched: 0, scored: 0 });
  });

  test('a student with no result (recorded Lucia row, result removed) stays listed with nulls', () => {
    const derived: RosterRow[] = [{ ...t2Row('Lucia'), result: null, release_state: 'nosit' }];
    expect(studentsTabRows(derived).rows[0]).toMatchObject({
      resultDocumentId: null,
      score: null,
      hasResult: false,
      isScored: false,
      phase: null,
      weakest: null,
      growth: { kind: 'none' },
    });
  });
});
