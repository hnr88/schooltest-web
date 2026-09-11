import { describe, expect, test } from 'vitest';

import type { RosterRow } from '@/modules/results';
import { t2Roster, t2Row } from '@/modules/teacher/lib/v2/__fixtures__/t2';
import { familyReportRows } from '@/modules/teacher/lib/v2/family-reports';
import type { FamilyReportRow, FamilyReportsView } from '@/modules/teacher/types/v2-family.types';

function derive(firstName: string, patch: Partial<RosterRow>): RosterRow {
  return { ...t2Row(firstName), ...patch };
}

function rowOf(view: FamilyReportsView, firstName: string): FamilyReportRow {
  const row = view.rows.find((entry) => entry.name.startsWith(`${firstName} `));
  if (row === undefined) throw new Error(`no row for ${firstName}`);
  return row;
}

describe('familyReportRows — recorded t2 roster (every recorded result is held)', () => {
  const view = familyReportRows(t2Roster);

  test('counts', () => {
    expect(view.counts).toEqual({ total: 20, scored: 20, released: 0, held: 20, recalled: 0, open: 0, blocked: 0, noResult: 0 });
  });

  test('nothing open or blocked: the complete banner', () => {
    expect(view.banner).toEqual({
      kind: 'complete',
      open: 0,
      blocked: 0,
      tone: { fg: '#1F7A4D', bg: '#F2FAF5', border: '#CDE9DA' },
    });
  });

  test('all 20 held results are releasable', () => {
    expect(view.releasableResultIds).toHaveLength(20);
    expect(view.releasableResultIds).toContain('gdijynxot3d31d0pt053jv37');
  });

  test('recorded Dilnoza row', () => {
    expect(rowOf(view, 'Dilnoza')).toEqual({
      studentDocumentId: t2Row('Dilnoza').student.document_id,
      resultDocumentId: 'gdijynxot3d31d0pt053jv37',
      name: 'Dilnoza Baptiste',
      initials: 'DB',
      status: { kind: 'held', labelKey: 'release.label.held', tone: { fg: '#92610B', bg: '#FDF3E0' } },
      whyKey: 'release.why.held',
      releasedAt: null,
      score: 41,
      expected: { kind: 'below', labelKey: 'expected.below', tone: { fg: '#B42318', bg: '#FDEEEC' } },
      actions: { preview: true, release: true, recall: false },
    });
  });

  test('readiness drives the expected band; null or not-assessed readiness shows none', () => {
    expect(rowOf(view, 'Bilal').expected).toBeNull();
    expect(rowOf(view, 'Lucia').expected).toBeNull();
    expect(rowOf(view, 'Lucia').score).toBeNull();
  });

  test('filters on the recorded roster, in roster order', () => {
    expect(view.rows.map((row) => row.name)).toEqual(t2Roster.map((row) => row.student.name));
    expect(familyReportRows(t2Roster, { filter: 'held' }).rows).toHaveLength(20);
    expect(familyReportRows(t2Roster, { filter: 'released' }).rows).toEqual([]);
    expect(familyReportRows(t2Roster, { filter: 'blocked' }).rows).toEqual([]);
  });
});

describe('familyReportRows — every release kind, derived from recorded rows', () => {
  const roster: RosterRow[] = [
    derive('Rosa', { release_state: 'released' }),
    derive('Amara', { release_state: 'recalled' }),
    derive('Dilnoza', { release_state: 'held' }),
    derive('Lucia', { result: null, release_state: 'open' }),
    derive('Panit', { result: null, release_state: 'nosit' }),
    derive('Qadir', { result: null, release_state: 'absent' }),
    derive('Chen', { release_state: 'manual' }),
  ];
  const view = familyReportRows(roster);

  test('counts follow the design tiles', () => {
    expect(view.counts).toEqual({ total: 7, scored: 2, released: 1, held: 1, recalled: 1, open: 1, blocked: 3, noResult: 4 });
  });

  test('anything open or blocked raises the incomplete banner', () => {
    expect(view.banner).toEqual({
      kind: 'incomplete',
      open: 1,
      blocked: 3,
      tone: { fg: '#92610B', bg: '#FDF9EF', border: '#EBD9AE' },
    });
  });

  test('released: recall only, and undated because the recorded published_at is null', () => {
    expect(rowOf(view, 'Rosa')).toMatchObject({
      status: { kind: 'released', labelKey: 'release.label.released', tone: { fg: '#1F7A4D', bg: '#E9F6EF' } },
      whyKey: 'release.why.releasedUndated',
      releasedAt: null,
      actions: { preview: true, release: false, recall: true },
    });
  });

  test('recalled: preview and release again', () => {
    expect(rowOf(view, 'Amara')).toMatchObject({
      status: { kind: 'recalled', tone: { fg: '#B42318', bg: '#FDEEEC' } },
      whyKey: 'release.why.recalled',
      actions: { preview: true, release: true, recall: false },
    });
  });

  test('open, not sat, absent and manual scoring carry no report action', () => {
    const blocked = ['Lucia', 'Panit', 'Qadir', 'Chen'].map((name) => rowOf(view, name));
    expect(blocked.map((row) => [row.status.kind, row.status.labelKey, row.whyKey, row.status.tone.fg])).toEqual([
      ['open', 'release.label.open', 'release.why.open', '#0E2350'],
      ['nosit', 'release.label.nosit', 'release.why.nosit', '#5A6478'],
      ['absent', 'release.label.absent', 'release.why.absent', '#5A6478'],
      ['manual', 'release.label.manual', 'release.why.manual', '#B42318'],
    ]);
    expect(blocked.every((row) => !row.actions.preview && !row.actions.release && !row.actions.recall)).toBe(true);
    expect(rowOf(view, 'Lucia')).toMatchObject({ resultDocumentId: null, score: null, expected: null });
  });

  test('filters: Held, Released, Blocked (open included); a recalled report shows under All only', () => {
    const namesFor = (filter: 'all' | 'held' | 'released' | 'blocked') =>
      familyReportRows(roster, { filter }).rows.map((row) => row.name.split(' ')[0]);
    expect(namesFor('held')).toEqual(['Dilnoza']);
    expect(namesFor('released')).toEqual(['Rosa']);
    expect(namesFor('blocked')).toEqual(['Lucia', 'Panit', 'Qadir', 'Chen']);
    expect(namesFor('all')).toEqual(['Rosa', 'Amara', 'Dilnoza', 'Lucia', 'Panit', 'Qadir', 'Chen']);
    expect(familyReportRows(roster, { filter: 'blocked' }).filter).toBe('blocked');
  });

  test('only held results are releasable in bulk', () => {
    expect(view.releasableResultIds).toEqual(['gdijynxot3d31d0pt053jv37']);
  });
});

describe('familyReportRows — empty roster (every recorded row removed)', () => {
  test('zero counts and no banner', () => {
    const empty = familyReportRows(t2Roster.slice(0, 0));
    expect(empty.counts).toEqual({ total: 0, scored: 0, released: 0, held: 0, recalled: 0, open: 0, blocked: 0, noResult: 0 });
    expect(empty).toMatchObject({ rows: [], banner: null, releasableResultIds: [], filter: 'all' });
  });
});
