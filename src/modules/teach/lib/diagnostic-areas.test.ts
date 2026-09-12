import { ATTRIBUTE_NAMES } from '@schooltest/scoring-contracts';
import { describe, expect, test } from 'vitest';

import { displaySkillOfAttribute } from '@/modules/results/lib/display-skills';
import { diagnosticAreaCode } from '@/modules/teach/lib/diagnostic-areas';
import {
  masteryAreaAttribute,
  MASTERY_AREA_CODES,
} from '@/modules/teach/lib/mastery-directory.lib';
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

// TB-12 — the placement the mastery TABLE CELL and the student drill-down read: which of a
// row's attributes lands on one of the seven area columns. Both surfaces used to compare
// `attribute.code === 'R1'`, which matches nothing once a student is scored, so every cell of
// a scored class rendered the em dash on the school-admin analytics screen.
describe('masteryAreaAttribute — recorded live class diagnostics', () => {
  const areaStatuses = (row: (typeof scored.mastery)[number]) =>
    Object.fromEntries(
      MASTERY_AREA_CODES.map((code) => [code, masteryAreaAttribute(row, code)?.status ?? null]),
    );

  test('a scored row fills the six model-fed areas with the status the wire carried', () => {
    expect(scored.mastery.length).toBeGreaterThan(0);
    for (const row of scored.mastery) {
      const wire = new Map(row.attributes.map((attribute) => [attribute.code, attribute.status]));
      expect(areaStatuses(row), row.student_ref).toEqual({
        R1: wire.get('Decoding'),
        // R2 is the limiting vocabulary strand — asserted per row below.
        R2: masteryAreaAttribute(row, 'R2')?.status ?? null,
        R3: wire.get('Grammar'),
        R4: wire.get('Gist'),
        R5: wire.get('Detail'),
        R6: wire.get('Inference'),
        // Critical reading is the Rasch gate: no model attribute feeds it, so the
        // cell is an honest absence rather than an invented band.
        R7: null,
      });
      for (const code of ['R1', 'R3', 'R4', 'R5', 'R6'] as const) {
        expect(areaStatuses(row)[code], `${row.student_ref} ${code}`).not.toBeNull();
      }
    }
  });

  test('Vocabulary carries the LIMITING strand: a band beats the other strand’s absence', () => {
    // Recorded row "Amara B.": Vocab_A2 not_assessed, Vocab_B1 not_yet.
    const split = scored.mastery.find((row) => row.student_ref === 'Amara B.');
    expect(split?.attributes.map((attribute) => [attribute.code, attribute.status])).toEqual(
      expect.arrayContaining([
        ['Vocab_A2', 'not_assessed'],
        ['Vocab_B1', 'not_yet'],
      ]),
    );
    const cell = masteryAreaAttribute(split!, 'R2');
    expect([cell?.code, cell?.status]).toEqual(['Vocab_B1', 'not_yet']);
    // Both strands banded the same way: the cell still names a real strand.
    const both = scored.mastery.find((row) => row.student_ref === 'Tenzin B.');
    expect(masteryAreaAttribute(both!, 'R2')?.status).toBe('not_yet');
  });

  test('an unscored row names its cells by area code, so each area keeps its own attribute', () => {
    for (const row of unscored.mastery) {
      for (const code of MASTERY_AREA_CODES) {
        expect(masteryAreaAttribute(row, code)?.code, `${row.student_ref} ${code}`).toBe(code);
      }
    }
  });

  test('the defect this closes: comparing the wire code to the area code matches nothing once scored', () => {
    // What both surfaces did before TB-12 — `row.attributes.find((a) => a.code === 'R1')`.
    // On every recorded row of a SCORED class it finds nothing, which is the em-dash wall
    // the school-admin analytics screen showed; on an UNSCORED class it happens to work,
    // which is why the defect survived.
    const naive = (row: (typeof scored.mastery)[number]) =>
      MASTERY_AREA_CODES.filter((code) => row.attributes.some((attribute) => attribute.code === code));
    expect(scored.mastery.every((row) => naive(row).length === 0)).toBe(true);
    expect(unscored.mastery.every((row) => naive(row).length === 7)).toBe(true);
  });

  test('a row the class carries with no attributes at all resolves every area to null', () => {
    // Derived from a recorded row: the live API serves exactly this shape for a
    // rostered student with no scored attributes on the class diagnostic.
    const empty = { ...scored.mastery[0]!, attributes: [] };
    expect(MASTERY_AREA_CODES.map((code) => masteryAreaAttribute(empty, code))).toEqual(
      MASTERY_AREA_CODES.map(() => null),
    );
  });
});
