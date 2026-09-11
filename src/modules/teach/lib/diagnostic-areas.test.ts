import { ATTRIBUTE_NAMES } from '@schooltest/scoring-contracts';
import { describe, expect, test } from 'vitest';

import { displaySkillOfAttribute } from '@/modules/results/lib/display-skills';
import { diagnosticAreaCode } from '@/modules/teach/lib/diagnostic-areas';
import { classDiagnosticSchema } from '@/modules/teach/schemas/diagnostic.schema';

import scoredJson from '@/modules/teacher/lib/v2/__fixtures__/t2-diagnostic.json';
import unscoredJson from './__fixtures__/school-a-diagnostic.json';

// Two class diagnostics recorded live on 2026-09-11: t2's "Reading 8B — Alvarez" (every
// student scored: cells named by model attribute) and school A's "Reading 8A — Okonkwo"
// (no student scored: cells named by area code R1..R7).
const scored = classDiagnosticSchema.parse(scoredJson);
const unscored = classDiagnosticSchema.parse(unscoredJson.data);

describe('displaySkillOfAttribute', () => {
  test('each model attribute rolls up to its display skill; both vocabulary strands to Vocabulary', () => {
    expect(Object.fromEntries(ATTRIBUTE_NAMES.map((name) => [name, displaySkillOfAttribute(name)]))).toEqual({
      Decoding: 'Decoding',
      Vocab_A2: 'Vocabulary',
      Grammar: 'Grammar',
      Vocab_B1: 'Vocabulary',
      Gist: 'Gist',
      Detail: 'Detail',
      Inference: 'Inference',
    });
  });
});

describe('diagnosticAreaCode — recorded live class diagnostics', () => {
  test('a scored student’s attribute cells land on their teach area; the vocabulary strands on Vocabulary (R2)', () => {
    const codes = [...new Set(scored.mastery.flatMap((row) => row.attributes.map((attribute) => attribute.code)))];
    expect(Object.fromEntries(codes.map((code) => [code, diagnosticAreaCode(code)]))).toEqual({
      Decoding: 'R1',
      Detail: 'R5',
      Gist: 'R4',
      Grammar: 'R3',
      Inference: 'R6',
      Vocab_A2: 'R2',
      Vocab_B1: 'R2',
    });
  });

  test('an unscored student’s area codes land on themselves', () => {
    expect(unscored.mastery.length).toBeGreaterThan(0);
    for (const row of unscored.mastery) {
      expect(row.attributes.map((attribute) => diagnosticAreaCode(attribute.code))).toEqual(['R1', 'R2', 'R3', 'R4', 'R5', 'R6', 'R7']);
    }
  });

  test('the recorded group codes: attribute groups land on areas, the not-yet-assessed sentinel has none', () => {
    expect(scored.groups.map((group) => diagnosticAreaCode(group.limiting_attribute))).toEqual(['R1', 'R5', 'R6', null]);
  });
});
