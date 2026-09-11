import type { ReleaseBatchOutcome, ResultReleaseOutcome } from '@/modules/results/types/result-release.types';

export async function releaseInSequence(
  resultDocumentIds: readonly string[],
  releaseOne: (resultDocumentId: string) => Promise<ResultReleaseOutcome>,
): Promise<ReleaseBatchOutcome> {
  const outcome: ReleaseBatchOutcome = { released: [], failed: [] };
  for (const resultDocumentId of resultDocumentIds) {
    try {
      outcome.released.push(await releaseOne(resultDocumentId));
    } catch (error) {
      outcome.failed.push({ resultDocumentId, error });
    }
  }
  return outcome;
}
