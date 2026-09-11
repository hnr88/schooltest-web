import { describe, expect, test } from 'vitest';

import { latestReadingSitting } from '@/modules/teacher/lib/v2/latest-sitting';
import { classSittingSchema } from '@/modules/test-day/schemas/test-day.schema';

import sittingsJson from './__fixtures__/t2-sittings.json';

// GET /api/sittings?filters[class]=…&sort=createdAt:desc, recorded live as t2 on
// 2026-09-11 for "Reading 8B — Alvarez" (first page of 6).
const sittings = sittingsJson.data.map((row) => classSittingSchema.parse(row));

describe('latestReadingSitting — recorded t2 class sittings, newest first', () => {
  test('the first reading row, with its form', () => {
    expect(latestReadingSitting(sittings)).toMatchObject({
      documentId: 't18m7jdko74h40rdmmg3djxe',
      skill: 'reading',
      form: { form_code: 'RDG-DIAG-A-79' },
    });
  });

  test('a newer sitting of another skill is skipped (the recorded first row re-tagged listening)', () => {
    const [first, ...rest] = sittings;
    expect(latestReadingSitting([{ ...first, skill: 'listening' }, ...rest])?.documentId).toBe(rest[0].documentId);
  });

  test('no reading sitting (every recorded row re-tagged speaking) is null, never a guess', () => {
    expect(latestReadingSitting(sittings.map((sitting) => ({ ...sitting, skill: 'speaking' })))).toBeNull();
  });
});
