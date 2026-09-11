import { restFailureOf } from '@/lib/axios/strapi';
import type { ReleaseBatchOutcome } from '@/modules/results';
import type {
  FamilyFailureGroup,
  FamilyReportRow,
  ReleaseBatchSummary,
} from '@/modules/teacher/types/v2-family.types';

export function failureReasonKey(error: unknown): string {
  const failure = restFailureOf(error);
  if (failure === null) return 'errors.generic';
  switch (failure.kind) {
    case 'transport':
      return 'errors.transport';
    case 'rate-limited':
      return 'errors.rateLimited';
    case 'auth-forbidden':
    case 'auth-invalid':
    case 'auth-missing':
      return 'errors.forbidden';
    case 'contract':
      if (failure.status === 409) return 'errors.notReady';
      if (failure.status === 404) return 'errors.notFound';
      return 'errors.generic';
  }
}

export function releaseBatchSummary(
  outcome: ReleaseBatchOutcome,
  rows: readonly FamilyReportRow[],
): ReleaseBatchSummary {
  const nameOf = new Map(rows.map((row) => [row.resultDocumentId, row.name]));
  const groups = new Map<string, string[]>();
  for (const failure of outcome.failed) {
    const reasonKey = failureReasonKey(failure.error);
    const names = groups.get(reasonKey) ?? [];
    names.push(nameOf.get(failure.resultDocumentId) ?? failure.resultDocumentId);
    groups.set(reasonKey, names);
  }
  const failures: FamilyFailureGroup[] = [...groups].map(([reasonKey, names]) => ({ reasonKey, names }));
  const released = outcome.released.length;
  const tone = outcome.failed.length === 0 ? 'ok' : released === 0 ? 'error' : 'warn';
  return { tone, released, total: released + outcome.failed.length, failures };
}
