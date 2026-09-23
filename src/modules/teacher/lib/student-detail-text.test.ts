import { describe, expect, test } from 'vitest';

import type { DisplaySkill, ResultView } from '@schooltest/scoring-contracts';

import {
  overallDeltaText,
  progressTiles,
  studentAnalysis,
  subskillDeltaText,
} from '@/modules/teacher/lib/student-detail-text';
import { t2Result, t2ResultAmara, t2ResultDilnoza } from '@/modules/teacher/lib/v2/__fixtures__/t2';
import { GROWTH_FG } from '@/modules/teacher/constants/v2-tones.constants';
import { studentDetail } from '@/modules/teacher/lib/v2/student-detail';
import type { StudentDetailView, SubskillCard } from '@/modules/teacher/types/v2-student-detail.types';

function card(view: StudentDetailView, skill: DisplaySkill): SubskillCard {
  const found = view.subskills.find((entry) => entry.skill === skill);
  if (found === undefined) throw new Error(`no ${skill} card`);
  return found;
}

function tile(view: StudentDetailView, id: string) {
  return progressTiles(view).find((entry) => entry.id === id);
}

function keysOf(paragraphs: ReturnType<typeof studentAnalysis>): string[] {
  return paragraphs.flat().map((sentence) => sentence.key);
}

describe('student detail text — recorded Dilnoza (reliable fall, 8 sittings, 3 scored)', () => {
  const view = studentDetail(t2ResultDilnoza);

  test('the overall chip prints the server step "-45" as a fall', () => {
    expect(overallDeltaText(view.overall.growth)).toEqual({ key: 'overallDelta.down', values: { points: 45 } });
  });

  test('baseline, latest, growth and sittings tiles', () => {
    expect(progressTiles(view)).toEqual([
      {
        id: 'baseline',
        label: { key: 'tiles.baseline', months: { month: '2026-09-10' } },
        value: { key: 'percent', values: { value: 76 } },
        fg: null,
      },
      {
        id: 'latest',
        label: { key: 'tiles.latest', months: { month: '2026-09-10' } },
        value: { key: 'percent', values: { value: 41 } },
        fg: null,
      },
      { id: 'growth', label: { key: 'tiles.growth' }, value: { key: 'tiles.growthDown', values: { points: 45 } }, fg: '#B42318' },
      {
        id: 'sittings',
        label: { key: 'tiles.sittings' },
        // 8 history points, 3 scored: the tile counts the scored sittings the trend plots.
        value: { key: 'tiles.sittingsSince', values: { count: 3 }, months: { month: '2026-09-10' } },
        fg: null,
      },
    ]);
  });

  test('subskill movement: band move, reliable points, and none on the gate', () => {
    expect(subskillDeltaText(card(view, 'Decoding').delta)).toEqual({
      key: 'subskills.deltaBands',
      labels: { before: 'band.secure', after: 'band.notYet' },
    });
    // Each vocabulary strand shows its OWN band move — the retired blend's "-65" is gone.
    for (const skill of ['Vocab_A2', 'Vocab_B1'] as const) {
      expect(subskillDeltaText(card(view, skill).delta)).toEqual({
        key: 'subskills.deltaBands',
        labels: { before: 'band.secure', after: 'band.notYet' },
      });
    }
    expect(subskillDeltaText(card(view, 'Critical').delta)).toBeNull();
  });

  test('analysis: overall + phase + reliable fall, strongest vs weakest, both strands level', () => {
    expect(studentAnalysis(view, 'Dilnoza')).toEqual([
      [
        { key: 'analysis.overall', values: { first: 'Dilnoza', score: 41 }, labels: { phase: 'phase.beginning' } },
        { key: 'analysis.growthDownReliable', values: { points: 45 } },
      ],
      [
        {
          key: 'analysis.strengthFocus',
          values: { first: 'Dilnoza' },
          labels: { strongestPhase: 'band.emerging', weakestPhase: 'band.notYet' },
          lowerLabels: { strongest: 'skill.inference', weakest: 'skill.decoding' },
        },
        { key: 'analysis.focusNext', values: { first: 'Dilnoza' }, lowerLabels: { weakest: 'skill.decoding' } },
      ],
      [{ key: 'analysis.vocabBoth', labels: { a2: 'band.notYet', b1: 'band.notYet' } }],
    ]);
  });
});

describe('student detail text — recorded Amara (server "steady", single B1 strand)', () => {
  const view = studentDetail(t2ResultAmara);

  test('steady is the server word, never a number', () => {
    expect(overallDeltaText(view.overall.growth)).toEqual({ ns: 'viewModel', key: 'growth.steady' });
    expect(tile(view, 'growth')).toEqual({
      id: 'growth',
      label: { key: 'tiles.growth' },
      value: { ns: 'viewModel', key: 'growth.steady' },
      fg: GROWTH_FG.steady,
    });
    // Classroom Vocabulary held its band: flat, from the attribute's own band pair.
    expect(subskillDeltaText(card(view, 'Vocab_B1').delta)).toEqual({ key: 'subskills.deltaFlat' });
  });

  test('latest tile carries the latest sitting date', () => {
    expect(tile(view, 'latest')).toMatchObject({
      label: { key: 'tiles.latest', months: { month: '2026-09-11' } },
      value: { key: 'percent', values: { value: 42 } },
    });
  });

  test('analysis: no server phase so none is named, held steady, Gist vs Classroom Vocabulary, B1 only', () => {
    expect(studentAnalysis(view, 'Amara')).toEqual([
      [
        { key: 'analysis.overallNoPhase', values: { first: 'Amara', score: 42 } },
        { key: 'analysis.growthSteady' },
      ],
      [
        {
          key: 'analysis.strengthFocus',
          values: { first: 'Amara' },
          labels: { strongestPhase: 'band.notYet', weakestPhase: 'band.notYet' },
          lowerLabels: { strongest: 'skill.gist', weakest: 'attribute.vocabB1' },
        },
        { key: 'analysis.focusNext', values: { first: 'Amara' }, lowerLabels: { weakest: 'attribute.vocabB1' } },
      ],
      [{ key: 'analysis.vocabB1Only', labels: { b1: 'band.notYet' } }],
    ]);
  });
});

describe('student detail text — other recorded roster rows', () => {
  test('Rosa: reliable "+5" rise, no vocabulary strands', () => {
    const view = studentDetail(t2Result('Rosa'));
    expect(overallDeltaText(view.overall.growth)).toEqual({ key: 'overallDelta.up', values: { points: 5 } });
    expect(tile(view, 'growth')).toMatchObject({ value: { key: 'tiles.growthUp', values: { points: 5 } }, fg: '#1F7A4D' });
    const analysis = studentAnalysis(view, 'Rosa');
    expect(analysis[0]).toEqual([
      { key: 'analysis.overallNoPhase', values: { first: 'Rosa', score: 45 } },
      { key: 'analysis.growthUpReliable', values: { points: 5 } },
    ]);
    expect(keysOf(analysis).some((key) => key.startsWith('analysis.vocab'))).toBe(false);
  });

  test('Jae-won: no growth from the server, so no chip, a dash tile and no growth sentence', () => {
    const view = studentDetail(t2Result('Jae-won'));
    expect(overallDeltaText(view.overall.growth)).toBeNull();
    expect(tile(view, 'growth')).toMatchObject({ value: null, fg: GROWTH_FG.none });
    expect(studentAnalysis(view, 'Jae-won')[0]).toEqual([
      { key: 'analysis.overall', values: { first: 'Jae-won', score: 38 }, labels: { phase: 'phase.beginning' } },
    ]);
  });

  test('Lucia: a result with no overall score has no latest value and no overall sentence', () => {
    const view = studentDetail(t2Result('Lucia'));
    expect(tile(view, 'latest')?.value).toBeNull();
    expect(keysOf(studentAnalysis(view, 'Lucia')).some((key) => key.startsWith('analysis.overall'))).toBe(false);
  });
});

describe('student detail text — edge cases derived from recorded rows', () => {
  const rosa = t2Result('Rosa');

  test('a zero step (Rosa with delta_display "0") is flat', () => {
    const view = studentDetail({ ...rosa, overall: { ...rosa.overall, delta: 0, delta_display: '0' } });
    expect(overallDeltaText(view.overall.growth)).toEqual({ key: 'overallDelta.flat' });
    expect(tile(view, 'growth')).toMatchObject({ value: { key: 'tiles.growthFlat' }, fg: '#5B6472' });
    expect(studentAnalysis(view, 'Rosa')[0]?.[1]).toEqual({ key: 'analysis.growthFlat' });
  });

  test('a rise without a reliability flag (Rosa, delta_reliable null) claims no reliability', () => {
    const view = studentDetail({ ...rosa, overall: { ...rosa.overall, delta_reliable: null } });
    expect(studentAnalysis(view, 'Rosa')[0]?.[1]).toEqual({ key: 'analysis.growthUp', values: { points: 5 } });
  });

  test('classroom vocabulary a phase below everyday (Dilnoza, Everyday at Emerging) adds the academic-words advice', () => {
    const everyday = t2ResultDilnoza.attributes.Vocab_A2;
    if (everyday === undefined || everyday.status === 'not_assessed') throw new Error('fixture Vocab_A2 must be assessed');
    const derived: ResultView = {
      ...t2ResultDilnoza,
      attributes: { ...t2ResultDilnoza.attributes, Vocab_A2: { ...everyday, status: 'emerging' } },
    };
    expect(studentAnalysis(studentDetail(derived), 'Dilnoza').at(-1)).toEqual([
      { key: 'analysis.vocabBoth', labels: { a2: 'band.emerging', b1: 'band.notYet' } },
      { key: 'analysis.vocabAcademicNext', values: { first: 'Dilnoza' } },
    ]);
  });

  test('the same phase on both strands gives no academic-words advice, whatever the scores (Dilnoza, B1 20)', () => {
    const derived: ResultView = {
      ...t2ResultDilnoza,
      vocab: { ...t2ResultDilnoza.vocab, b1: { ...t2ResultDilnoza.vocab.b1, domain_score: 20 } },
    };
    expect(studentAnalysis(studentDetail(derived), 'Dilnoza').at(-1)).toEqual([
      { key: 'analysis.vocabBoth', labels: { a2: 'band.notYet', b1: 'band.notYet' } },
    ]);
  });

  test('an A2-only sitting (Dilnoza with Classroom Vocabulary unassessed) prints the A2 strand alone', () => {
    const derived: ResultView = {
      ...t2ResultDilnoza,
      attributes: { ...t2ResultDilnoza.attributes, Vocab_B1: t2ResultAmara.attributes.Vocab_A2 },
    };
    const view = studentDetail(derived);
    expect(studentAnalysis(view, 'Dilnoza').at(-1)).toEqual([{ key: 'analysis.vocabA2Only', labels: { a2: 'band.notYet' } }]);
  });

  test('subskill points up and zero (Dilnoza Everyday Vocabulary "+7" / "0")', () => {
    const everyday = t2ResultDilnoza.attributes.Vocab_A2;
    if (everyday === undefined || everyday.status === 'not_assessed') throw new Error('fixture drifted');
    const withEveryday = (delta: number, display: string): ResultView => ({
      ...t2ResultDilnoza,
      attributes: { ...t2ResultDilnoza.attributes, Vocab_A2: { ...everyday, delta, delta_reliable: true, delta_display: display, band_before: undefined, band_after: undefined } },
    });
    expect(subskillDeltaText(card(studentDetail(withEveryday(7, '+7')), 'Vocab_A2').delta)).toEqual({ key: 'subskills.deltaUp', values: { points: 7 } });
    expect(subskillDeltaText(card(studentDetail(withEveryday(0, '0')), 'Vocab_A2').delta)).toEqual({ key: 'subskills.deltaFlat' });
  });

  test('no history (omitted): undated baseline and latest labels, no baseline or sittings value', () => {
    const view = studentDetail({ ...t2ResultDilnoza, history: undefined });
    expect(progressTiles(view)).toMatchObject([
      { id: 'baseline', label: { key: 'tiles.baselineUndated' }, value: null },
      { id: 'latest', label: { key: 'tiles.latestUndated' }, value: { key: 'percent', values: { value: 41 } } },
      { id: 'growth' },
      { id: 'sittings', value: null },
    ]);
  });
});
