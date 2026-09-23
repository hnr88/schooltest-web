import { describe, expect, test } from 'vitest';

import { areaLabelKey, diagnosticAreaCode, diagnosticAreaCodes } from '@/modules/teach/lib/diagnostic-areas';
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

describe('diagnosticAreaCode — recorded live class diagnostics', () => {
  test('a scored student’s attribute cells land on their teach area; each vocabulary strand on its own', () => {
    const codes = [...new Set(scored.mastery.flatMap((row) => row.attributes.map((attribute) => attribute.code)))];
    expect(Object.fromEntries(codes.map((code) => [code, diagnosticAreaCode(code)]))).toEqual({
      Decoding: 'R1',
      Detail: 'R5',
      Gist: 'R4',
      Grammar: 'R3',
      Inference: 'R6',
      Vocab_A2: 'Vocab_A2',
      Vocab_B1: 'Vocab_B1',
    });
  });

  test('an unscored student’s area codes land on themselves; the not-assessed R2 on BOTH vocabulary strands', () => {
    expect(unscored.mastery.length).toBeGreaterThan(0);
    for (const row of unscored.mastery) {
      expect(row.attributes.map((attribute) => diagnosticAreaCodes(attribute))).toEqual([
        ['R1'],
        ['Vocab_A2', 'Vocab_B1'],
        ['R3'],
        ['R4'],
        ['R5'],
        ['R6'],
        ['R7'],
      ]);
    }
  });

  test('a legacy R2 carrying a real status (the retired joint vocabulary) lands on neither strand', () => {
    expect(diagnosticAreaCodes({ code: 'R2', status: 'mastered', prob: 0.9 })).toEqual([]);
    expect(diagnosticAreaCodes({ code: 'R2', status: 'not_assessed', prob: null })).toEqual(['Vocab_A2', 'Vocab_B1']);
  });

  test('every recorded row puts at most ONE cell on each area, so an aggregate counts each student once per row', () => {
    for (const row of [...scored.mastery, ...unscored.mastery]) {
      for (const code of MASTERY_AREA_CODES) {
        const landing = row.attributes.filter((attribute) => diagnosticAreaCodes(attribute).includes(code));
        expect(landing.length, `${row.student_ref} ${code}`).toBeLessThanOrEqual(1);
      }
    }
  });

  test('the two vocabulary areas are labelled with the report’s own attribute names; no area reads the blended R2', () => {
    expect(MASTERY_AREA_CODES).toEqual(['R1', 'Vocab_A2', 'R3', 'Vocab_B1', 'R4', 'R5', 'R6', 'R7']);
    expect(MASTERY_AREA_CODES.map(areaLabelKey)).toEqual([
      'Teach.diagnostic.areas.R1',
      'Report.attributes.Vocab_A2',
      'Teach.diagnostic.areas.R3',
      'Report.attributes.Vocab_B1',
      'Teach.diagnostic.areas.R4',
      'Teach.diagnostic.areas.R5',
      'Teach.diagnostic.areas.R6',
      'Teach.diagnostic.areas.R7',
    ]);
  });

  test('the recorded group codes: attribute groups land on areas, the not-yet-assessed sentinel has none', () => {
    expect(scored.groups.map((group) => diagnosticAreaCode(group.limiting_attribute))).toEqual(['R1', 'R5', 'R6', null]);
  });
});

// TB-12 — the placement the mastery TABLE CELL and the student drill-down read: which of a
// row's attributes lands on one of the eight area columns. Both surfaces used to compare
// `attribute.code === 'R1'`, which matches nothing once a student is scored, so every cell of
// a scored class rendered the em dash on the school-admin analytics screen.
describe('masteryAreaAttribute — recorded live class diagnostics', () => {
  const areaStatuses = (row: (typeof scored.mastery)[number]) =>
    Object.fromEntries(
      MASTERY_AREA_CODES.map((code) => [code, masteryAreaAttribute(row, code)?.status ?? null]),
    );

  test('a scored row fills the seven model-fed areas with the status the wire carried', () => {
    expect(scored.mastery.length).toBeGreaterThan(0);
    for (const row of scored.mastery) {
      const wire = new Map(row.attributes.map((attribute) => [attribute.code, attribute.status]));
      expect(areaStatuses(row), row.student_ref).toEqual({
        R1: wire.get('Decoding'),
        Vocab_A2: wire.get('Vocab_A2'),
        R3: wire.get('Grammar'),
        Vocab_B1: wire.get('Vocab_B1'),
        R4: wire.get('Gist'),
        R5: wire.get('Detail'),
        R6: wire.get('Inference'),
        // Critical reading is the Rasch gate: no model attribute feeds it, so the
        // cell is an honest absence rather than an invented band.
        R7: null,
      });
      for (const code of ['R1', 'Vocab_A2', 'R3', 'Vocab_B1', 'R4', 'R5', 'R6'] as const) {
        expect(areaStatuses(row)[code], `${row.student_ref} ${code}`).not.toBeNull();
      }
    }
  });

  test('each vocabulary strand shows its OWN status — no strand stands in for the other', () => {
    // Recorded row "Amara B.": Vocab_A2 not_assessed, Vocab_B1 not_yet.
    const split = scored.mastery.find((row) => row.student_ref === 'Amara B.');
    expect(split?.attributes.map((attribute) => [attribute.code, attribute.status])).toEqual(
      expect.arrayContaining([
        ['Vocab_A2', 'not_assessed'],
        ['Vocab_B1', 'not_yet'],
      ]),
    );
    const everyday = masteryAreaAttribute(split!, 'Vocab_A2');
    const classroom = masteryAreaAttribute(split!, 'Vocab_B1');
    expect([everyday?.code, everyday?.status]).toEqual(['Vocab_A2', 'not_assessed']);
    expect([classroom?.code, classroom?.status]).toEqual(['Vocab_B1', 'not_yet']);
    // The retired single Vocabulary column is gone.
    expect(masteryAreaAttribute(split!, 'R2')).toBeNull();
  });

  test('an unscored row names its cells by area code; its R2 placeholder fills both vocabulary areas', () => {
    for (const row of unscored.mastery) {
      for (const code of MASTERY_AREA_CODES) {
        const expected = code === 'Vocab_A2' || code === 'Vocab_B1' ? 'R2' : code;
        expect(masteryAreaAttribute(row, code)?.code, `${row.student_ref} ${code}`).toBe(expected);
      }
    }
  });

  test('the defect this closes: comparing the wire code to the area code matches nothing once scored', () => {
    // What both surfaces did before TB-12 — `row.attributes.find((a) => a.code === 'R1')`.
    // On every recorded row of a SCORED class it finds nothing, which is the em-dash wall
    // the school-admin analytics screen showed; on an UNSCORED class it happens to work,
    // which is why the defect survived.
    const legacyAreas = ['R1', 'R2', 'R3', 'R4', 'R5', 'R6', 'R7'];
    const naive = (row: (typeof scored.mastery)[number]) =>
      legacyAreas.filter((code) => row.attributes.some((attribute) => attribute.code === code));
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
