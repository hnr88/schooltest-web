import { z } from 'zod';

// TEACHER EXIT REQUESTS — client mirror of the exit-request contract, field for
// field. SEMANTIC contract: the backend lands in parallel, so the endpoint
// paths live in the query/mutation files and a route-shape reconciliation is a
// two-file fix. The teacher reads the pending queue for their supervised
// sittings and answers each request; the student app polls the answer.

const str = z.string().min(1);

/** The decision state of one exit request (the teacher's two answers). */
export const exitRequestDecisionSchema = z.enum(['approved', 'denied']);

/**
 * One PENDING exit request in the supervised-sittings queue: who, which
 * sitting/test, why, and when they asked. `testLabel` may be absent when the
 * sitting carries no form label yet.
 */
export const pendingExitRequestSchema = z.object({
  id: str,
  studentName: str,
  sittingDocumentId: str,
  testLabel: z.string().min(1).nullable(),
  reason: str,
  createdAt: str,
});

/** `GET /api/exit-requests/pending` answers a BARE array of these. */
export const pendingExitRequestsResponseSchema = z.array(pendingExitRequestSchema);

/** `POST /api/exit-requests/:id/approve | /deny` answers the decided request. */
export const exitRequestDecisionResponseSchema = z.object({
  id: str,
  status: exitRequestDecisionSchema,
});

export type PendingExitRequest = z.infer<typeof pendingExitRequestSchema>;
export type ExitRequestDecision = z.infer<typeof exitRequestDecisionSchema>;
export type ExitRequestDecisionResponse = z.infer<typeof exitRequestDecisionResponseSchema>;
