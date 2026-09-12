import { describe, expect, test } from 'vitest';

import type { DisplaySkill, ResultView } from '@schooltest/scoring-contracts';

import {
  overallDeltaText,
  progressTiles,
  strandsText,
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
        value: { key: 'tiles.sittingsSince', values: { count: 8 }, months: { month: '2026-09-10' } },
        fg: null,
      },
    ]);
  });

  test('subskill movement: band move, reliable points, and none on the gate', () => {
    expect(subskillDeltaText(card(view, 'Decoding').delta)).toEqual({
      key: 'subskills.deltaBands',
      labels: { before: 'band.secure', after: 'band.notYet' },
    });
    expect(subskillDeltaText(card(view, 'Vocabulary').delta)).toEqual({ key: 'subskills.deltaDown', values: { points: 65 } });
    expect(subskillDeltaText(card(view, 'Critical').delta)).toBeNull();
  });

  test('both vocabulary strands, and none on other cards', () => {
    expect(strandsText(card(view, 'Vocabulary').strands)).toEqual({ key: 'subskills.strands', values: { a2: 25, b1: 25 } });
    expect(strandsText(card(view, 'Grammar').strands)).toBeNull();
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
          values: { first: 'Dilnoza', strongestScore: 49, weakestScore: 25 },
          lowerLabels: { strongest: 'skill.inference', weakest: 'skill.decoding' },
        },
        { key: 'analysis.focusNext', values: { first: 'Dilnoza' }, lowerLabels: { weakest: 'skill.decoding' } },
      ],
      [{ key: 'analysis.vocabBoth', values: { a2: 25, b1: 25 } }],
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
    expect(subskillDeltaText(card(view, 'Vocabulary').delta)).toEqual({ ns: 'viewModel', key: 'growth.steady' });
  });

  test('latest tile carries the latest sitting date', () => {
    expect(tile(view, 'latest')).toMatchObject({
      label: { key: 'tiles.latest', months: { month: '2026-09-11' } },
      value: { key: 'percent', values: { value: 42 } },
    });
  });

  test('only the B1 strand is printed', () => {
    expect(strandsText(card(view, 'Vocabulary').strands)).toEqual({ key: 'subskills.strandB1', values: { b1: 25 } });
  });

  test('analysis: score-cut phase, held steady, Gist vs Vocabulary, B1 only', () => {
    expect(studentAnalysis(view, 'Amara')).toEqual([
      [
        { key: 'analysis.overall', values: { first: 'Amara', score: 42 }, labels: { phase: 'phase.beginning' } },
        { key: 'analysis.growthSteady' },
      ],
      [
        {
          key: 'analysis.strengthFocus',
          values: { first: 'Amara', strongestScore: 29, weakestScore: 25 },
          lowerLabels: { strongest: 'skill.gist', weakest: 'skill.vocabulary' },
        },
        { key: 'analysis.focusNext', values: { first: 'Amara' }, lowerLabels: { weakest: 'skill.vocabulary' } },
      ],
      [{ key: 'analysis.vocabB1Only', values: { b1: 25 } }],
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
      { key: 'analysis.overall', values: { first: 'Rosa', score: 45 }, labels: { phase: 'phase.emerging' } },
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

  test('academic vocabulary below everyday (Dilnoza, B1 20) adds the academic-words advice', () => {
    const derived: ResultView = {
      ...t2ResultDilnoza,
      vocab: { ...t2ResultDilnoza.vocab, b1: { ...t2ResultDilnoza.vocab.b1, domain_score: 20 } },
    };
    expect(studentAnalysis(studentDetail(derived), 'Dilnoza').at(-1)).toEqual([
      { key: 'analysis.vocabBoth', values: { a2: 25, b1: 20 } },
      { key: 'analysis.vocabAcademicNext', values: { first: 'Dilnoza' } },
    ]);
  });

  test('an A2-only sitting (Amara, single_strand a2) prints the A2 strand alone', () => {
    const derived: ResultView = {
      ...t2ResultAmara,
      vocab: { ...t2ResultAmara.vocab, single_strand: 'a2', a2: { ...t2ResultAmara.vocab.a2, domain_score: 25 } },
    };
    const view = studentDetail(derived);
    expect(strandsText(card(view, 'Vocabulary').strands)).toEqual({ key: 'subskills.strandA2', values: { a2: 25 } });
    expect(studentAnalysis(view, 'Amara').at(-1)).toEqual([{ key: 'analysis.vocabA2Only', values: { a2: 25 } }]);
  });

  test('subskill points up and zero (Dilnoza vocab "+7" / "0")', () => {
    const up = studentDetail({ ...t2ResultDilnoza, vocab: { ...t2ResultDilnoza.vocab, delta_display: '+7' } });
    expect(subskillDeltaText(card(up, 'Vocabulary').delta)).toEqual({ key: 'subskills.deltaUp', values: { points: 7 } });
    const zero = studentDetail({ ...t2ResultDilnoza, vocab: { ...t2ResultDilnoza.vocab, delta: 0, delta_display: '0' } });
    expect(subskillDeltaText(card(zero, 'Vocabulary').delta)).toEqual({ key: 'subskills.deltaFlat' });
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
