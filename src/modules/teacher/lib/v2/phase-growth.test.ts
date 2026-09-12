import { GROWTH_FG } from '@/modules/teacher/constants/v2-tones.constants';
import { describe, expect, test } from 'vitest';

import { t2Result, t2ResultDilnoza } from '@/modules/teacher/lib/v2/__fixtures__/t2';
import { growthFromServer, parseSignedDisplay, scoreSpan } from '@/modules/teacher/lib/v2/growth';
import { phaseFromScore, phaseFromServer, phaseOfResult } from '@/modules/teacher/lib/v2/phase';

describe('phaseOfResult — server acara_phase first, the design score cuts only when it is null', () => {
  test('recorded Jae-won: server "beginning" becomes Beginning, sourced from the server', () => {
    expect(phaseOfResult(t2Result('Jae-won'))).toEqual({
      phase: 'Beginning',
      source: 'server',
      labelKey: 'phase.beginning',
      subLabelKey: 'phaseSub.beginning',
      tone: { fg: '#B42318', bg: '#FDEEEC' },
    });
  });

  test('recorded Bilal: null server phase with score 54 falls back to Emerging from the score', () => {
    expect(phaseOfResult(t2Result('Bilal'))).toMatchObject({
      phase: 'Emerging',
      source: 'score',
      tone: { fg: '#92610B', bg: '#FDF4E3' },
    });
  });

  test('recorded Rosa sits on the Emerging cut (45); recorded Amara (42) is Beginning', () => {
    expect(phaseOfResult(t2Result('Rosa'))?.phase).toBe('Emerging');
    expect(phaseOfResult(t2Result('Amara'))?.phase).toBe('Beginning');
  });

  test('recorded Lucia: null phase and null score yield no phase at all', () => {
    expect(phaseOfResult(t2Result('Lucia'))).toBeNull();
  });

  test('a roster row with no result yields no phase', () => {
    expect(phaseOfResult(null)).toBeNull();
  });

  test('the crosswalk ladder folds onto the four design phases; an unknown code is not guessed', () => {
    const codes = ['beginning', 'emerging', 'developing', 'developing_to_consolidating', 'consolidating'];
    expect(codes.map((code) => phaseFromServer(code))).toEqual([
      'Beginning',
      'Emerging',
      'Developing',
      'Developing',
      'Consolidating',
    ]);
    expect(phaseFromServer('pre_a1')).toBeNull();
    expect(phaseFromServer(null)).toBeNull();
  });

  test('the design score cuts are 80 / 62 / 45', () => {
    expect([80, 79, 62, 61, 45, 44].map((score) => phaseFromScore(score))).toEqual([
      'Consolidating',
      'Developing',
      'Developing',
      'Emerging',
      'Emerging',
      'Beginning',
    ]);
  });
});

describe('growthFromServer — the server movement claim, never recomputed', () => {
  test('recorded Rosa: a reliable "+5" is up five points', () => {
    expect(growthFromServer(t2Result('Rosa').overall)).toEqual({
      kind: 'up',
      delta: 5,
      points: 5,
      reliable: true,
      fg: '#1F7A4D',
    });
  });

  test('recorded Dilnoza: the display step "-45" is printed, the raw -43 is kept for ranking', () => {
    expect(growthFromServer(t2ResultDilnoza.overall)).toEqual({
      kind: 'down',
      delta: -43,
      points: -45,
      reliable: true,
      fg: '#B42318',
    });
  });

  test('recorded Amara: the server says steady although its delta of 2 is reliable', () => {
    expect(growthFromServer(t2Result('Amara').overall)).toEqual({
      kind: 'steady',
      delta: 2,
      points: null,
      reliable: true,
      fg: GROWTH_FG.steady,
    });
  });

  test('recorded Tenzin: an unreliable zero is steady', () => {
    expect(growthFromServer(t2Result('Tenzin').overall).kind).toBe('steady');
  });

  test('recorded Jae-won: a first sitting has no movement to show', () => {
    expect(growthFromServer(t2Result('Jae-won').overall)).toEqual({
      kind: 'none',
      delta: null,
      points: null,
      reliable: null,
      fg: GROWTH_FG.none,
    });
  });

  test('recorded Dilnoza vocabulary block: a reliable "-65" is down', () => {
    expect(growthFromServer(t2ResultDilnoza.vocab)).toMatchObject({ kind: 'down', points: -65, reliable: true });
  });

  test('no source is no movement', () => {
    expect(growthFromServer(null).kind).toBe('none');
  });

  test('signed display steps parse; the movement words do not', () => {
    const displays = ['+5', '-45', '−7', '0', 'steady', 'band_movement'];
    expect(displays.map((display) => parseSignedDisplay(display))).toEqual([5, -45, -7, 0, null, null]);
    expect(parseSignedDisplay(null)).toBeNull();
  });
});

describe('scoreSpan — plain arithmetic between two displayed scores', () => {
  test('recorded Dilnoza: first scored sitting to latest score', () => {
    const first = t2ResultDilnoza.history?.find((point) => point.overall !== null)?.overall ?? null;
    expect(scoreSpan(first, t2ResultDilnoza.overall.domain_score)).toEqual({ from: 76, to: 41, difference: -35 });
  });

  test('a missing end is no span', () => {
    expect(scoreSpan(null, t2ResultDilnoza.overall.domain_score)).toBeNull();
    expect(scoreSpan(t2ResultDilnoza.overall.domain_score, null)).toBeNull();
  });
});
