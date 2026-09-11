import { describe, expect, it } from 'vitest';

import { releaseInSequence } from '@/modules/results/lib/release-batch';
import { classRosterResponseSchema } from '@/modules/results/schemas/roster.schema';
import { resultReleaseOutcomeSchema } from '@/modules/results/schemas/result-release.schema';
import rosterJson from '@/modules/teacher/lib/v2/__fixtures__/t2-roster.json';

import recallHeld409 from '@/modules/results/schemas/__fixtures__/t2-recall-held-409.json';
import release200 from '@/modules/results/schemas/__fixtures__/t2-release-200.json';

// The outcome is the recorded release body; the ids are recorded t2 roster result ids.
const recorded = resultReleaseOutcomeSchema.parse(release200.body);
const ids = classRosterResponseSchema
  .parse(rosterJson)
  .flatMap((row) => (row.result === null ? [] : [row.result.document_id]))
  .slice(0, 3);

describe('releaseInSequence', () => {
  it('releases one at a time in the given order and keeps each failure with its id', async () => {
    const failedId = ids[1];
    const order: string[] = [];
    let inFlight = 0;
    let maxInFlight = 0;
    const outcome = await releaseInSequence(ids, async (id) => {
      inFlight += 1;
      maxInFlight = Math.max(maxInFlight, inFlight);
      order.push(id);
      await Promise.resolve();
      inFlight -= 1;
      if (id === failedId) throw Object.assign(new Error('conflict'), recallHeld409);
      return { ...recorded, document_id: id };
    });
    expect(ids).toHaveLength(3);
    expect(maxInFlight).toBe(1);
    expect(order).toEqual(ids);
    expect(outcome.released.map((entry) => entry.document_id)).toEqual([ids[0], ids[2]]);
    expect(outcome.failed.map((entry) => entry.resultDocumentId)).toEqual([failedId]);
  });

  it('sends nothing for an empty list', async () => {
    let calls = 0;
    const outcome = await releaseInSequence([], async () => {
      calls += 1;
      return recorded;
    });
    expect(calls).toBe(0);
    expect(outcome).toEqual({ released: [], failed: [] });
  });
});
