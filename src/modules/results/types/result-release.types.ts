import type { z } from 'zod';

import type {
  resultRecallBodySchema,
  resultReleaseOutcomeSchema,
} from '@/modules/results/schemas/result-release.schema';

export type ResultReleaseOutcome = z.infer<typeof resultReleaseOutcomeSchema>;
export type ResultRecallBody = z.infer<typeof resultRecallBodySchema>;

export interface RecallResultInput {
  resultDocumentId: string;
  recallReason: string;
}

export interface ReleaseFailure {
  resultDocumentId: string;
  error: unknown;
}

export interface ReleaseBatchOutcome {
  released: ResultReleaseOutcome[];
  failed: ReleaseFailure[];
}
