/**
 * MIRROR of schooltest-api/src/contracts/results.ts — C-REL-1
 * `POST /api/results/:id/release` and C-REL-2 `POST /api/results/:id/recall`.
 * Update it in the same task as the api contract.
 */
import { z } from 'zod';

import { resultStatusSchema, resultViewReleaseStateSchema } from '@schooltest/scoring-contracts';

export const resultRecallBodySchema = z.strictObject({
  recall_reason: z.string().min(1).max(500),
});

export const resultReleaseOutcomeSchema = z.strictObject({
  document_id: z.string().min(1),
  status: resultStatusSchema,
  release_state: resultViewReleaseStateSchema,
  published_at: z.iso.datetime().nullable(),
  recalled_at: z.iso.datetime().nullable(),
});
