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

/**
 * The WIRE shape one pending queue row arrives in from the API — the bare
 * projection `api::exit-request.exit-request.listPending` hands out: the
 * student and sitting are nested, snake_cased, and neither `studentName` nor
 * `testLabel` exists server-side. The query layer parses THIS, then maps to
 * `pendingExitRequestSchema` — so a shape the contract does not describe still
 * throws at the boundary.
 */
export const pendingExitRequestWireSchema = z.object({
  id: str,
  status: z.literal('pending'),
  reason: str,
  createdAt: str,
  student: z
    .object({
      document_id: str,
      given_name: z.string().nullable(),
      family_name: z.string().nullable(),
    })
    .optional(),
  sitting: z
    .object({
      document_id: str,
      code: z.string().nullable(),
      mode: z.string().nullable(),
      skill: z.string().nullable(),
      phase: z.string().nullable(),
    })
    .optional(),
});

/** `GET /api/exit-requests/pending` answers a BARE array of wire rows. */
export const pendingExitRequestsWireResponseSchema = z.array(pendingExitRequestWireSchema);

export type PendingExitRequestWire = z.infer<typeof pendingExitRequestWireSchema>;

/**
 * Wire row → the panel's queue row. A row without its sitting cannot say
 * where it came from and is dropped (null); the display name joins the
 * student's given/family parts, and the sitting code stands in as the test
 * label (the panel's own `testFallback` covers a null one).
 */
export function pendingExitRequestFromWire(wire: PendingExitRequestWire): PendingExitRequest | null {
  if (!wire.sitting) return null;
  const studentName = [wire.student?.given_name, wire.student?.family_name]
    .filter((part): part is string => Boolean(part))
    .join(' ');
  return {
    id: wire.id,
    studentName: studentName.length > 0 ? studentName : 'Unknown student',
    sittingDocumentId: wire.sitting.document_id,
    testLabel: wire.sitting.code,
    reason: wire.reason,
    createdAt: wire.createdAt,
  };
}

/** `POST /api/exit-requests/:id/approve | /deny` answers the decided request. */
export const exitRequestDecisionResponseSchema = z.object({
  id: str,
  status: exitRequestDecisionSchema,
});

export type PendingExitRequest = z.infer<typeof pendingExitRequestSchema>;
export type ExitRequestDecision = z.infer<typeof exitRequestDecisionSchema>;
export type ExitRequestDecisionResponse = z.infer<typeof exitRequestDecisionResponseSchema>;
