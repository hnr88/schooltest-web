import { errorEnvelopeSchema, type FieldIssue } from '@schooltest/ops-contracts';

// U-19 (SHARED-LAYER.md §F-server-errors): a server's field errors are PARSED
// against the contracted envelope, never optional-chained through `unknown`.
// Lifted from ops/queries/use-school-create.mutation.ts, whose
// `schoolFieldIssues` / `schoolStale` now re-export these two.

const BAD_REQUEST = 400;
const PRECONDITION_FAILED = 412;
const NON_FIELD_PATHS = new Set(['(root)', 'If-Match']);

function responseOf(error: unknown): { status?: unknown; data?: unknown } | null {
  if (typeof error !== 'object' || error === null || !('response' in error)) return null;
  const { response } = error as { response?: unknown };
  return typeof response === 'object' && response !== null
    ? (response as { status?: unknown; data?: unknown })
    : null;
}

/** The field issues of a contracted 400, `(root)` and `If-Match` dropped; `[]` for anything else. */
export function serverIssues(error: unknown): readonly FieldIssue[] {
  const response = responseOf(error);
  if (response?.status !== BAD_REQUEST) return [];
  const parsed = errorEnvelopeSchema.safeParse(response.data);
  if (!parsed.success) return [];
  return (parsed.data.error.details.errors ?? []).filter(
    (issue) => issue.path !== '' && !NON_FIELD_PATHS.has(issue.path),
  );
}

/** True only for HTTP 412 — the write lost an `If-Match` race. A 409 is its own message. */
export function isStaleWrite(error: unknown): boolean {
  return responseOf(error)?.status === PRECONDITION_FAILED;
}
