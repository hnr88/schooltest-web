import { expect, test } from 'vitest';

import { classRosterResponseSchema } from '@/modules/results/schemas/roster.schema';
import dilnoza from '@/modules/teacher/lib/v2/__fixtures__/t2-result-dilnoza.json';

const bands = {
  Decoding: 'not_yet', Vocab_A2: 'emerging', Grammar: 'developing',
  Vocab_B1: 'secure', Gist: null, Detail: null, Inference: null,
  Vocab_B2: 'developing', Critical: null,
};

const roster = (history: unknown[]) => [{
  student: { document_id: dilnoza.student_document_id, name: 'Test student', initials: 'TS', eald_flag: false },
  result: { ...dilnoza, history },
  release_state: dilnoza.release_state,
}];

test('the roster parses historical responses without attribute_bands', () => {
  expect(dilnoza.history.length).toBeGreaterThan(0);
  const parsed = classRosterResponseSchema.parse(roster(dilnoza.history));
  expect(parsed[0].result?.history).toEqual(dilnoza.history);
  expect(parsed[0].result?.history?.[0]).not.toHaveProperty('attribute_bands');
});

test('the roster preserves optional attribute_bands and nulls on history points', () => {
  const history = dilnoza.history.map((point) => ({ ...point, attribute_bands: bands }));
  expect(classRosterResponseSchema.parse(roster(history))[0].result?.history).toEqual(history);
});

test('the roster rejects invalid or incomplete history band records', () => {
  for (const invalid of [{ ...bands, Decoding: 'mastered' }, { Decoding: 'secure' }, { ...bands, Extra: null }]) {
    const history = [{ ...dilnoza.history[0], attribute_bands: invalid }];
    expect(classRosterResponseSchema.safeParse(roster(history)).success).toBe(false);
  }
});
