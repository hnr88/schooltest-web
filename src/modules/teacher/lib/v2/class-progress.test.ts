import { GROWTH_FG } from '@/modules/teacher/constants/v2-tones.constants';
import { describe, expect, test } from 'vitest';
import type { AssessedBand, DisplaySkill, ResultView, ResultViewAttribute } from '@schooltest/scoring-contracts';

import type { RosterRow } from '@/modules/results';
import { t2Result, t2Roster, t2Row } from '@/modules/teacher/lib/v2/__fixtures__/t2';
import { classProgress } from '@/modules/teacher/lib/v2/class-progress';
import { bandOf, bandPosition, monthOf } from '@/modules/teacher/lib/v2/progress/band-placement';

const view = classProgress(t2Roster);

function rowOf(firstName: string) {
  const row = view.dotMap.rows.find((entry) => entry.firstName === firstName);
  if (row === undefined) throw new Error(`no ${firstName} row`);
  return row;
}

describe('band placement — the ACARA equal-width geometry', () => {
  test('edges 45/62/80 sit in the band above them', () => {
    expect([bandOf(0), bandOf(44), bandOf(45), bandOf(61), bandOf(62), bandOf(79), bandOf(80), bandOf(100)]).toEqual([
      'Beginning',
      'Beginning',
      'Emerging',
      'Emerging',
      'Developing',
      'Developing',
      'Consolidating',
      'Consolidating',
    ]);
  });

  test('a band edge is its band-left quarter mark; the scale ends are 0 and 1', () => {
    expect([bandPosition(0), bandPosition(45), bandPosition(62), bandPosition(80), bandPosition(100)]).toEqual([
      0,
      0.25,
      0.5,
      0.75,
      1,
    ]);
    expect(bandPosition(75)).toBeCloseTo(49 / 72, 5);
  });

  test('the month is the UTC month number of the ISO sat_at', () => {
    expect([monthOf('2026-02-14'), monthOf('2026-09-10'), monthOf('2026-12-01')]).toEqual([2, 9, 12]);
  });
});

describe('classProgress — recorded t2 roster', () => {
  test('the sitting count is the longest scored history any row holds (unscored points never count)', () => {
    expect(view.sittings).toBe(5);
  });

  test('rows: every student with a scored overall, latest score descending; an all-null history has no row', () => {
    expect(view.dotMap.rows.map((row) => [row.firstName, row.latest.score])).toEqual([
      ['Chen', 73],
      ['Bilal', 54],
      ['Rosa', 45],
      ['Amara', 42],
      ['Dilnoza', 41],
      ['Lucia', 40],
      ['Panit', 40],
      ['Eitan', 40],
      ['Kaveh', 40],
      ['Nour', 40],
      ['Farida', 40],
      ['Jae-won', 38],
      ['Oluwaseun', 38],
      ['Mihail', 38],
      ['Qadir', 38],
      ['Gia', 38],
      ['Hamza', 38],
      ['Ines', 38],
      ['Tenzin', 37],
    ]);
    expect(view.dotMap.rows.some((row) => row.firstName === 'Sunniva')).toBe(false);
  });

  test('a reliable mover across a band edge draws the arrow: Rosa up, Dilnoza back', () => {
    expect(rowOf('Rosa')).toMatchObject({
      studentDocumentId: t2Row('Rosa').student.document_id,
      name: 'Rosa Baptiste',
      firstName: 'Rosa',
      movement: 'up',
      sittings: 2,
      first: { score: 40, satAt: '2026-09-10', month: 9, phase: 'Beginning' },
      latest: { score: 45, satAt: '2026-09-11', month: 9, phase: 'Emerging', position: 0.25 },
    });
    expect(rowOf('Rosa').first.position).toBeCloseTo(2 / 9, 5);
    expect(rowOf('Dilnoza')).toMatchObject({
      movement: 'back',
      first: { score: 76, phase: 'Developing' },
      latest: { score: 41, phase: 'Beginning' },
    });
    expect(rowOf('Dilnoza').first.position).toBeCloseTo(25 / 36, 5);
  });

  test('the reliable gate: no arrow without the server reliability, however large the raw change', () => {
    expect(rowOf('Chen').movement).toBe('held');
    expect(rowOf('Tenzin').movement).toBe('held');
    expect(rowOf('Amara').movement).toBe('held');
  });

  test('null overalls are skipped, never plotted as zero', () => {
    expect(rowOf('Lucia')).toMatchObject({ sittings: 1, first: { score: 40 }, latest: { score: 40 } });
    expect(rowOf('Kaveh')).toMatchObject({ sittings: 1, first: { score: 40 }, latest: { score: 40 } });
  });

  test('band counts read the LATEST overall of every row', () => {
    expect(view.dotMap.phases).toEqual([
      { phase: 'Beginning', count: 16 },
      { phase: 'Emerging', count: 2 },
      { phase: 'Developing', count: 1 },
      { phase: 'Consolidating', count: 0 },
    ]);
  });

  test('the summary counts reliable band movers only; everyone else held', () => {
    expect(view.dotMap.summary).toEqual({ up: 1, held: 17, down: 1 });
  });

  test('highest gains: the reliable positive server deltas, descending', () => {
    expect(view.gainTop).toEqual([
      {
        studentDocumentId: t2Row('Rosa').student.document_id,
        name: 'Rosa Baptiste',
        firstName: 'Rosa',
        score: 45,
        growth: { kind: 'up', delta: 5, points: 5, reliable: true, fg: GROWTH_FG.up },
      },
      {
        studentDocumentId: t2Row('Amara').student.document_id,
        name: 'Amara Baptiste',
        firstName: 'Amara',
        score: 42,
        growth: { kind: 'steady', delta: 2, points: null, reliable: true, fg: GROWTH_FG.steady },
      },
    ]);
  });

  test('lowest gains: reliable deltas ascending, never repeating a Highest student', () => {
    expect(view.gainLow.map((mover) => [mover.firstName, mover.score, mover.growth.delta, mover.growth.points])).toEqual([
      ['Dilnoza', 41, -43, -45],
    ]);
    const top = new Set(view.gainTop.map((mover) => mover.studentDocumentId));
    expect(view.gainLow.some((mover) => top.has(mover.studentDocumentId))).toBe(false);
  });
});

describe('classProgress — gains cap and no-reliable-delta exclusion', () => {
  const base = t2Row('Jae-won');

  function withDelta(given: string, delta: number | null, reliable: boolean, display: string | null): RosterRow {
    return {
      ...base,
      student: { ...base.student, document_id: `${base.student.document_id}-${given}`, name: `${given} Recorded` },
      result:
        base.result === null
          ? null
          : {
              ...base.result,
              document_id: `${base.result.document_id}-${given}`,
              overall: { ...base.result.overall, delta, delta_reliable: reliable, delta_display: display },
            },
    };
  }

  const roster = [
    ...[1, 2, 3, 4, 5, 6].map((delta) => withDelta(`G${delta}`, delta, true, `+${delta}`)),
    withDelta('Gnone', null, false, null),
  ];
  const capped = classProgress(roster);

  test('both gains lists stop at four students', () => {
    expect(capped.gainTop.map((mover) => mover.firstName)).toEqual(['G6', 'G5', 'G4', 'G3']);
    expect(capped.gainLow.map((mover) => mover.firstName)).toEqual(['G1', 'G2']);
  });

  test('a student with no reliable delta appears in neither list', () => {
    expect(capped.gainTop.some((mover) => mover.firstName === 'Gnone')).toBe(false);
    expect(capped.gainLow.some((mover) => mover.firstName === 'Gnone')).toBe(false);
  });
});

// ── §3d "Subskill growth by student" — the sub-map over the server's own bands ──

describe('classProgress subMap — the recorded t2 roster (history predates attribute_bands)', () => {
  test('§3d is gated on BUG-009: no history point carries attribute_bands, so no map is drawn and nobody is claimed "Held"', () => {
    expect(view.subMap).toEqual([]);
  });
});

describe('classProgress subMap — synthesized rows carrying attribute_bands (post-BUG-009)', () => {
  const SEVEN: readonly DisplaySkill[] = ['Decoding', 'Vocab_A2', 'Grammar', 'Vocab_B1', 'Gist', 'Detail', 'Inference'];

  const scored = (status: AssessedBand): ResultViewAttribute => ({
    domain_score: 40,
    se: 0.2,
    status,
    prob: 0.5,
    prob_se: 0.05,
    items_seen: 10,
    delta: null,
    delta_reliable: null,
    delta_display: null,
  });

  const HISTORY_SCORES: Record<DisplaySkill, number | null> = {
    Decoding: 40,
    Vocab_A2: 40,
    Grammar: 40,
    Vocab_B1: 40,
    Gist: 40,
    Detail: 40,
    Inference: 40,
    Vocab_B2: null,
    Critical: 40,
  };

  function bandsOf(partial: Partial<Record<DisplaySkill, AssessedBand | null>>): Record<DisplaySkill, AssessedBand | null> {
    return {
      Decoding: null,
      Vocab_A2: null,
      Grammar: null,
      Vocab_B1: null,
      Gist: null,
      Detail: null,
      Inference: null,
      Vocab_B2: null,
      Critical: null,
      ...partial,
    };
  }

  interface SubCase {
    name: string;
    /** The first sitting's server bands; absent = the point carries no band for that skill (old data). */
    first: Partial<Record<DisplaySkill, AssessedBand>>;
    /** The latest sitting: a band sets `attributes[skill].status` (or academic_vocab.band for Vocab_B2); null leaves the attribute off the view. */
    latest: Partial<Record<DisplaySkill, AssessedBand | null>>;
  }

  function subRoster(cases: readonly SubCase[]): RosterRow[] {
    const base = t2Row('Rosa');
    const baseResult = t2Result('Rosa');
    return cases.map(({ name, first, latest }) => {
      const attributes = Object.fromEntries(
        SEVEN.flatMap((skill) => {
          const band = latest[skill];
          return band === undefined || band === null ? [] : [[skill, scored(band)] as const];
        }),
      ) as ResultView['attributes'];
      const result: ResultView = {
        ...baseResult,
        document_id: `${baseResult.document_id}-${name}`,
        academic_vocab: { ...baseResult.academic_vocab, band: latest.Vocab_B2 ?? null },
        attributes,
        history: [
          { sat_at: '2026-02-14', overall: 40, attributes: HISTORY_SCORES, attribute_bands: bandsOf(first) },
          { sat_at: '2026-09-11', overall: 40, attributes: HISTORY_SCORES, attribute_bands: bandsOf(latest) },
        ],
      };
      return { ...base, student: { ...base.student, document_id: `${base.student.document_id}-${name}`, name }, result };
    });
  }

  const sub = classProgress(
    subRoster([
      { name: 'Up One', first: { Decoding: 'emerging' }, latest: { Decoding: 'developing' } },
      { name: 'Aad', first: { Decoding: 'not_yet' }, latest: { Decoding: 'emerging' } },
      { name: 'Zed', first: { Decoding: 'not_yet' }, latest: { Decoding: 'emerging' } },
      { name: 'Down Two', first: { Gist: 'secure' }, latest: { Gist: 'emerging' } },
      { name: 'Held Same', first: { Grammar: 'developing' }, latest: { Grammar: 'developing' } },
      { name: 'Old Data', first: {}, latest: { Detail: 'developing' } },
      { name: 'Academic Up', first: { Vocab_B2: 'emerging' }, latest: { Vocab_B2: 'secure' } },
      { name: 'Unbanded', first: { Decoding: 'secure' }, latest: { Decoding: null } },
    ]),
  );

  function mapOf(skill: DisplaySkill) {
    const map = sub.subMap.find((entry) => entry.skill === skill);
    if (map === undefined) throw new Error(`no ${skill} map`);
    return map;
  }

  function named(map: ReturnType<typeof mapOf>, name: string) {
    const row = map.rows.find((entry) => entry.name === name);
    if (row === undefined) throw new Error(`no ${name} row on ${map.skill}`);
    return row;
  }

  test('a first→latest band rise draws an up arrow of the rank difference, months from the sittings', () => {
    expect(named(mapOf('Decoding'), 'Up One')).toMatchObject({
      first: { band: 'emerging', month: 2 },
      latest: { band: 'developing', month: 9 },
      movement: 'up',
      phases: 1,
    });
  });

  test('a fall of two ranks is movement down with phases 2', () => {
    expect(named(mapOf('Gist'), 'Down Two')).toMatchObject({
      first: { band: 'secure', month: 2 },
      latest: { band: 'emerging', month: 9 },
      movement: 'down',
      phases: 2,
    });
  });

  test('the same band at both sittings is held, not flat-zeroed into an arrow', () => {
    const row = named(mapOf('Grammar'), 'Held Same');
    expect(row.movement).toBe('held');
    expect(row.phases).toBe(0);
    expect(row.first).toMatchObject({ band: 'developing' });
  });

  test('the EIGHT band-carrying subskills in display order; Critical is never charted', () => {
    expect(sub.subMap.map((map) => map.skill)).toEqual([
      'Decoding',
      'Vocab_A2',
      'Grammar',
      'Vocab_B1',
      'Gist',
      'Detail',
      'Inference',
      'Vocab_B2',
    ]);
    expect(sub.subMap.some((map) => map.skill === 'Critical')).toBe(false);
  });

  test('a sitting that did not band the skill is skipped: the first band is the earliest sitting that carries one', () => {
    expect(named(mapOf('Detail'), 'Old Data')).toMatchObject({
      first: { band: 'developing', month: 9 },
      latest: { band: 'developing', month: 9 },
      movement: 'held',
      phases: 0,
    });
  });

  test('Vocab_B2 reads its first band from attribute_bands and its latest from academic_vocab.band', () => {
    const academic = mapOf('Vocab_B2');
    expect(academic.rows).toHaveLength(1);
    expect(named(academic, 'Academic Up')).toMatchObject({
      first: { band: 'emerging', month: 2 },
      latest: { band: 'secure', month: 9 },
      movement: 'up',
      phases: 2,
    });
  });

  test('a student with no band at the latest sitting is skipped entirely, never zeroed into a band', () => {
    const decoding = mapOf('Decoding');
    expect(decoding.rows.map((row) => row.name)).toEqual(['Up One', 'Aad', 'Zed']);
  });

  test('rows rank by the latest band (top first), then by name; counts and the mover tally follow', () => {
    const decoding = mapOf('Decoding');
    expect(decoding.phases).toEqual([
      { band: 'not_yet', count: 0 },
      { band: 'emerging', count: 2 },
      { band: 'developing', count: 1 },
      { band: 'secure', count: 0 },
    ]);
    expect(decoding.summary).toEqual({ up: 3, held: 0, down: 0 });
    expect(named(mapOf('Gist'), 'Down Two').movement).toBe('down');
    expect(mapOf('Gist').summary).toEqual({ up: 0, held: 0, down: 1 });
  });
});
