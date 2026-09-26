import { describe, expect, test } from 'vitest';

import { NEXT_PHASE } from '@/modules/teacher/constants/teaching.constants';
import { BAND_TONE } from '@/modules/teacher/constants/v2-tones.constants';
import { groupPrompt, strandPrompt, studentPrompt, allStudentsPrompt } from '@/modules/teacher/lib/v2/teaching/prompts';
import { teachingRow } from '@/modules/teacher/lib/v2/teaching/test-roster';
import { teachingPlan } from '@/modules/teacher/lib/v2/teaching/view';

describe('roster-only Teaching plan', () => {
  test('pairs on lowest class mean, not fewest secure; Critical never competes', () => {
    const rows = [
      teachingRow('Ada Private', { Gist: [10, 'secure'], Detail: [90, 'not_yet'], Critical: [0, 'not_yet'] }),
      teachingRow('Ben Private', { Gist: [30, 'secure'], Detail: [90, 'not_yet'] }),
    ];
    const view = teachingPlan(rows);
    expect(view.pairings.skill?.skill).toBe('Gist');
    expect(view.pairings.pairs.map((pair) => [pair.strong.firstName, pair.support.firstName])).toEqual([['Ben', 'Ada']]);
    expect(view.counts).toEqual({ vocabularyGroups: 0, comprehensionGroups: 2, foundationsGroups: 0, pairs: 1, students: 2 });
    expect(view).not.toHaveProperty('kpis');
    expect(view).not.toHaveProperty('mastery');
    expect(view).not.toHaveProperty('cohort');
  });

  test('next steps use the same limiting skills as groups and current server-band tones', () => {
    const rows = [
      teachingRow('Ada Private', { Vocab_A2: [20, 'not_yet'], Vocab_B1: [60, 'secure'], Gist: [10, 'emerging'] }),
      teachingRow('Ben Private', { Vocab_A2: [20, 'developing'], Vocab_B1: [100, 'secure'], Gist: [30, 'secure'] }),
    ];
    const view = teachingPlan(rows);
    for (const student of view.nextSteps) {
      for (const strand of ['vocabulary', 'comprehension'] as const) {
        const group = view.strands[strand].find((entry) => entry.students.some((member) => member.studentDocumentId === student.studentDocumentId));
        expect(student[strand]?.skill).toBe(group?.skill);
      }
    }
    expect(view.nextSteps[0].vocabulary).toMatchObject({ skill: 'Vocab_B1', band: 'secure', nextPhase: 'Extend', tone: BAND_TONE.secure });
    expect(view.nextSteps[0].comprehension?.nextPhase).toBe('Developing');
    expect(view.nextSteps[1].vocabulary?.nextPhase).toBe('Consolidating');
    expect(NEXT_PHASE).toEqual({ Beginning: 'Emerging', Emerging: 'Developing', Developing: 'Consolidating', Consolidating: 'Extend' });
  });

  test('counts true/false gates only, honours provisional flags and missing focus', () => {
    const rows = [teachingRow('A', { Vocab_B2: [40, 'not_yet'] }), teachingRow('B', {}), teachingRow('C', {})];
    if (rows[0].result) rows[0].result.gate = { domain_score: 90, passed: true, provisional_cut: true };
    if (rows[1].result) rows[1].result.gate = { domain_score: 20, passed: false, provisional_cut: false };
    const view = teachingPlan(rows);
    expect(view.gate).toEqual({ passed: 1, notYet: 1, provisionalCut: true });
    expect(view.nextSteps[0].vocabulary).toMatchObject({ provisionalCut: true, nextPhase: 'Emerging' });
    expect(view.nextSteps[0].comprehension).toBeNull();
  });

  test('all prompt forms include real focus and phase, with no student names or IDs', () => {
    const view = teachingPlan([teachingRow('Secret Fullname', { Vocab_B2: [30, 'developing'], Gist: [20, 'secure'] })]);
    const prompts = [groupPrompt(view.strands.vocabulary[0]), strandPrompt('vocabulary', view.strands.vocabulary), studentPrompt(view.nextSteps[0]), allStudentsPrompt(view.nextSteps)];
    for (const prompt of prompts) {
      expect(prompt).not.toMatch(/Secret|Fullname/);
      expect(prompt).toContain('Academic vocabulary');
      expect(prompt).toContain('Developing');
      expect(prompt).toContain('provisional');
      expect(prompt).toContain('Suggest a short activity');
      expect(prompt).toContain('toward the next phase');
    }
  });

  test('empty roster produces no invented groups, targets, pairs or gate results', () => {
    expect(teachingPlan([])).toEqual({
      strands: { vocabulary: [], comprehension: [], foundations: [] },
      pairings: { skill: null, pairs: [] }, nextSteps: [], gate: { passed: 0, notYet: 0, provisionalCut: false },
      counts: { vocabularyGroups: 0, comprehensionGroups: 0, foundationsGroups: 0, pairs: 0, students: 0 },
    });
  });

  test('Academic reading pairs carry provisional flags and avatar initials', () => {
    const view = teachingPlan([
      teachingRow('A', { Vocab_B2: [10, 'emerging'] }),
      teachingRow('B', { Vocab_B2: [50, 'secure'] }),
    ]);
    expect(view.pairings.pairs[0]).toMatchObject({
      strong: { initials: 'B', provisionalCut: true }, support: { initials: 'A', provisionalCut: true },
    });
  });
});
