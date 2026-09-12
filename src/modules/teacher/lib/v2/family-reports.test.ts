import { describe, expect, test } from 'vitest';

import type { ResultView } from '@schooltest/scoring-contracts';

import type { RosterRow } from '@/modules/results';
import { t2Result, t2Roster, t2Row } from '@/modules/teacher/lib/v2/__fixtures__/t2';
import { dayFirstDate, familyReportRow, familyReportRows } from '@/modules/teacher/lib/v2/family-reports';
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
  const unscoredNames = ['Lucia', 'Panit', 'Qadir', 'Sunniva', 'Chen', 'Nour'];

  test('counts: the 6 recorded held rows with no score are not scored and not releasable (TB-40)', () => {
    expect(view.counts).toEqual({
      total: 20,
      scored: 14,
      released: 0,
      held: 14,
      recalled: 0,
      open: 0,
      blocked: 0,
      unscored: 6,
      noResult: 6,
    });
    expect(view.counts.scored).toBe(view.rows.filter((row) => row.score !== null).length);
    expect(view.counts.scored + view.counts.noResult).toBe(view.counts.total);
  });

  test('an unscored held attempt is a gap, so the banner is not complete (TB-40)', () => {
    expect(view.banner).toEqual({
      kind: 'incomplete',
      open: 0,
      blocked: 0,
      unscored: 6,
      tone: { fg: '#92610B', bg: '#FDF9EF', border: '#EBD9AE' },
    });
  });

  test('only the 14 scored held results are releasable', () => {
    expect(view.releasableResultIds).toHaveLength(14);
    expect(view.releasableResultIds).toContain('gdijynxot3d31d0pt053jv37');
    const unscoredIds = view.rows
      .filter((row) => unscoredNames.includes(row.name.split(' ')[0]))
      .map((row) => row.resultDocumentId);
    expect(unscoredIds.every((id) => id !== null && !view.releasableResultIds.includes(id))).toBe(true);
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

  test('a held result with no score never says "Scored and ready" (P1 row 6)', () => {
    const unscored = view.rows.filter((row) => row.status.kind === 'held' && row.score === null);
    expect(unscored.map((row) => row.name.split(' ')[0])).toEqual(unscoredNames);
    expect([...new Set(unscored.map((row) => row.whyKey))]).toEqual(['release.why.heldNoScore']);
    expect(view.rows.filter((row) => row.whyKey === 'release.why.held').every((row) => row.score !== null)).toBe(true);
  });

  test('readiness drives the expected band; null or not-assessed readiness shows none', () => {
    expect(rowOf(view, 'Bilal').expected).toBeNull();
    expect(rowOf(view, 'Lucia').expected).toBeNull();
    expect(rowOf(view, 'Lucia').score).toBeNull();
  });

  test('filters on the recorded roster, in roster order — each pill matches its tile (TB-40)', () => {
    expect(view.rows.map((row) => row.name)).toEqual(t2Roster.map((row) => row.student.name));
    expect(familyReportRows(t2Roster, { filter: 'held' }).rows).toHaveLength(view.counts.held);
    expect(familyReportRows(t2Roster, { filter: 'released' }).rows).toHaveLength(view.counts.released);
    const blocked = familyReportRows(t2Roster, { filter: 'blocked' }).rows;
    expect(blocked).toHaveLength(view.counts.noResult);
    expect(blocked.map((row) => row.name.split(' ')[0])).toEqual(unscoredNames);
    expect(familyReportRows(t2Roster, { filter: 'held' }).rows.every((row) => row.score !== null)).toBe(true);
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
    expect(view.counts).toEqual({
      total: 7,
      scored: 2,
      released: 1,
      held: 1,
      recalled: 1,
      open: 1,
      blocked: 3,
      unscored: 0,
      noResult: 4,
    });
  });

  test('anything open or blocked raises the incomplete banner', () => {
    expect(view.banner).toEqual({
      kind: 'incomplete',
      open: 1,
      blocked: 3,
      unscored: 0,
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
    expect(empty.counts).toEqual({
      total: 0,
      scored: 0,
      released: 0,
      held: 0,
      recalled: 0,
      open: 0,
      blocked: 0,
      unscored: 0,
      noResult: 0,
    });
    expect(empty).toMatchObject({ rows: [], banner: null, releasableResultIds: [], filter: 'all' });
  });
});

// P1 row 6 — every arm derived from the recorded held, unscored Lucia row by moving the
// result's own `status`; the recorded value is `complete`, which is the neutral arm.
describe('familyReportRows — a held result with no score reports its own scoring status', () => {
  const unscored = t2Result('Lucia');
  const whyOf = (status: ResultView['status']): string =>
    familyReportRow({ ...t2Row('Lucia'), result: { ...unscored, status } }).whyKey;

  test('the recorded row is held, complete and scoreless', () => {
    expect([unscored.release_state, unscored.status, unscored.overall.domain_score]).toEqual(['held', 'complete', null]);
  });

  test('hand scoring, a failed run and a running one each say what is true', () => {
    expect(whyOf('manual_scoring')).toBe('release.why.manual');
    expect(whyOf('scoring_failed')).toBe('release.why.heldScoringFailed');
    expect(whyOf('scoring')).toBe('release.why.heldScoring');
    expect(whyOf('partial_pending')).toBe('release.why.heldScoring');
    expect(whyOf('complete')).toBe('release.why.heldNoScore');
  });

  test('a held result WITH a score keeps the design sentence', () => {
    const scored = t2Result('Dilnoza');
    expect(familyReportRow({ ...t2Row('Dilnoza'), result: scored }).whyKey).toBe('release.why.held');
    expect(familyReportRow({ ...t2Row('Dilnoza'), result: { ...scored, status: 'partial_pending' } }).whyKey).toBe(
      'release.why.held',
    );
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

// TB-40 — the tiles and the banner read the row, not the release state alone. Derived from
// the recorded roster: every held row that carries a score, plus the recorded unscored one.
describe('familyReportRows — "complete" needs every attempt to carry a score', () => {
  const scoredOnly = t2Roster.filter((row) => row.result !== null && row.result.overall.domain_score !== null);

  test('a roster whose every held result is scored is complete and fully releasable', () => {
    const view = familyReportRows(scoredOnly);
    expect(view.counts).toMatchObject({ total: 14, scored: 14, held: 14, unscored: 0, noResult: 0 });
    expect(view.banner).toMatchObject({ kind: 'complete', unscored: 0 });
    expect(view.releasableResultIds).toHaveLength(14);
  });

  test('adding back one unscored held row breaks completeness', () => {
    const view = familyReportRows([...scoredOnly, t2Row('Lucia')]);
    expect(view.counts).toMatchObject({ total: 15, scored: 14, held: 14, unscored: 1, noResult: 1 });
    expect(view.banner).toMatchObject({ kind: 'incomplete', open: 0, blocked: 0, unscored: 1 });
    expect(view.releasableResultIds).toHaveLength(14);
  });
});
