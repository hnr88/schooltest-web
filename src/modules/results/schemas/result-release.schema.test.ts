import { describe, expect, it } from 'vitest';

import { resultRecallBodySchema, resultReleaseOutcomeSchema } from '@/modules/results/schemas/result-release.schema';

import recallEmpty400 from './__fixtures__/t2-recall-empty-400.json';
import recallHeld409 from './__fixtures__/t2-recall-held-409.json';
import recall200 from './__fixtures__/t2-recall-200.json';
import release200 from './__fixtures__/t2-release-200.json';

// Every body below was recorded live as t2 against POST /api/results/:id/{release,recall}
// (scratchpad record-release.mjs), then the row was written back to its prior values.

describe('resultReleaseOutcomeSchema on recorded C-REL-1 / C-REL-2 responses', () => {
  it('parses the recorded release: released, stamped, not recalled', () => {
    expect(release200.status).toBe(200);
    const outcome = resultReleaseOutcomeSchema.parse(release200.body);
    expect(outcome.release_state).toBe('released');
    expect(outcome.status).toBe('complete');
    expect(outcome.published_at).not.toBeNull();
    expect(outcome.recalled_at).toBeNull();
  });

  it('parses the recorded recall of the same result: recalled, release stamp kept', () => {
    const released = resultReleaseOutcomeSchema.parse(release200.body);
    const recalled = resultReleaseOutcomeSchema.parse(recall200.body);
    expect(recall200.status).toBe(200);
    expect(recalled.document_id).toBe(released.document_id);
    expect(recalled.release_state).toBe('recalled');
    expect(recalled.recalled_at).not.toBeNull();
    expect(recalled.published_at).toBe(released.published_at);
  });

  it('does not read the recorded 409 (recall of a held result) as an outcome', () => {
    expect(recallHeld409.status).toBe(409);
    expect(resultReleaseOutcomeSchema.safeParse(recallHeld409.body).success).toBe(false);
  });

  it('is strict: the recorded release plus one unknown key does not parse', () => {
    expect(resultReleaseOutcomeSchema.safeParse({ ...release200.body, viewed_at: null }).success).toBe(false);
  });
});

describe('resultRecallBodySchema mirrors the server’s refusal', () => {
  it('refuses the empty reason the server answered 400 for', () => {
    expect(recallEmpty400.status).toBe(400);
    expect(resultRecallBodySchema.safeParse({ recall_reason: '' }).success).toBe(false);
  });

  it('accepts 1 to 500 characters and refuses 501', () => {
    expect(resultRecallBodySchema.safeParse({ recall_reason: 'x' }).success).toBe(true);
    expect(resultRecallBodySchema.safeParse({ recall_reason: 'x'.repeat(500) }).success).toBe(true);
    expect(resultRecallBodySchema.safeParse({ recall_reason: 'x'.repeat(501) }).success).toBe(false);
  });
});
