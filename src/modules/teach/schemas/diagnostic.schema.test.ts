import { describe, expect, test } from 'vitest';
import { z } from 'zod';

import { classDiagnosticSchema, diagnosticAttributeSchema } from '@/modules/teach/schemas/diagnostic.schema';

import diagnosticJson from '@/modules/teacher/lib/v2/__fixtures__/t2-diagnostic.json';

// The class diagnostic GET /api/schools/me/classes/:id/diagnostic, recorded live
// as t2 on 2026-09-11 ("Reading 8B — Alvarez"). Its attribute statuses are the
// current reading bands, which the retired v1 enum rejected.
const RETIRED_STATUS = z.enum(['mastered', 'emerging', 'not_mastered', 'not_assessed']);

function recordedStatuses(): string[] {
  return diagnosticJson.mastery.flatMap((row) => row.attributes.map((attribute) => attribute.status));
}

describe('classDiagnosticSchema — recorded live t2 class diagnostic', () => {
  test('parses the whole recorded response', () => {
    const parsed = classDiagnosticSchema.parse(diagnosticJson);
    expect(parsed.class.name).toBe('Reading 8B — Alvarez');
    expect(parsed.form_code).toBe('SPK-PROG-A-79');
    expect(parsed.sat_count).toBe(20);
    expect(parsed.roster_count).toBe(20);
    expect(parsed.mastery).toHaveLength(20);
    expect(parsed.groups.map((group) => [group.limiting_attribute, group.count])).toEqual([
      ['Decoding', 7],
      ['Detail', 1],
      ['Inference', 4],
      ['not_yet_assessed', 8],
    ]);
    expect(parsed.heatmap).toHaveLength(21);
  });

  test('keeps every recorded status verbatim: the live bands not_yet, emerging and not_assessed', () => {
    const parsed = classDiagnosticSchema.parse(diagnosticJson);
    const statuses = parsed.mastery.flatMap((row) => row.attributes.map((attribute) => attribute.status));
    expect(statuses).toEqual(recordedStatuses());
    expect(new Set(statuses)).toEqual(new Set(['not_assessed', 'not_yet', 'emerging']));
    expect(parsed.mastery[0].attributes[1]).toEqual({ code: 'Detail', status: 'not_yet', prob: 0.000136688173033573 });
  });

  test('the retired v1 status enum rejects the recorded response (the bug this schema fixes)', () => {
    expect(recordedStatuses().some((status) => !RETIRED_STATUS.safeParse(status).success)).toBe(true);
  });

  test('a recorded attribute re-banded secure or developing still parses (the other two reading bands)', () => {
    const recorded = diagnosticJson.mastery[0].attributes[1];
    expect(diagnosticAttributeSchema.parse({ ...recorded, status: 'secure' }).status).toBe('secure');
    expect(diagnosticAttributeSchema.parse({ ...recorded, status: 'developing' }).status).toBe('developing');
  });

  test('listening keeps its own stored three-band status on the same wire field', () => {
    const recorded = diagnosticJson.mastery[0].attributes[1];
    expect(diagnosticAttributeSchema.parse({ ...recorded, status: 'mastered' }).status).toBe('mastered');
    expect(diagnosticAttributeSchema.parse({ ...recorded, status: 'not_mastered' }).status).toBe('not_mastered');
  });

  test('a status outside the stored contract is still rejected', () => {
    const recorded = diagnosticJson.mastery[0].attributes[1];
    expect(diagnosticAttributeSchema.safeParse({ ...recorded, status: 'approaching' }).success).toBe(false);
  });
});
