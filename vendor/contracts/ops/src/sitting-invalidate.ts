/**
 * C-OPS-PORTAL-063 — `POST /api/ops/sittings/{documentId}/invalidate` (OPS-073).
 *
 * ONE definition of the ops sitting-invalidation wire contract, imported by the
 * Strapi handler that serves it and by the web mutation that calls it, so the
 * two cannot drift. Pure Zod: nothing here may reach for Strapi, Next or any
 * node-only module — this file is bundled into the browser.
 *
 * The operation is deliberately SHAPE-STABLE: the incumbent C-OPS-02 response
 * DTO (`{ documentId, status: "closed" }`) is the contract, unchanged, because
 * the confirmation dialog and the recovery panel already consume it. What
 * OPS-073 hardens is the behaviour BEHIND it — the sitting closes and every one
 * of its sessions is stamped `invalidated_at` in one transaction, no scoring job
 * or completion notification is enqueued through this administrative path, and
 * the raw rows survive for audit while dropping out of official reporting.
 *
 * Legacy compatibility (D-COMPAT): a caller that omits `X-Ops-Portal-Version`
 * keeps the behaviour it observes today — an ignored request body and a 404 for
 * any unresolvable `documentId`. A versioned caller gets the declared contract:
 * a strict empty body and a 400 for a malformed identifier. The header selects a
 * wire shape and NEVER grants permission.
 */
import { z } from 'zod';

import { dataEnvelope, documentIdSchema, type OpsOperation } from './core';

/** Path parameters — the sitting to void. Strapi v5 identity, never numeric id. */
export const sittingInvalidateParamsSchema = z.strictObject({
  documentId: documentIdSchema,
});
export type SittingInvalidateParams = z.infer<typeof sittingInvalidateParamsSchema>;

/**
 * The operation takes NO body. Strict, so a versioned caller that smuggles
 * `{ status: "open" }` or a stray `student_documentId` is refused with a field
 * error instead of having it silently dropped — an administrative void must
 * never look like it accepted an instruction it ignored.
 */
export const sittingInvalidateBodySchema = z.strictObject({});
export type SittingInvalidateBody = z.infer<typeof sittingInvalidateBodySchema>;

/**
 * 200 body data — the incumbent flat whitelist projection. `status` is the
 * literal `"closed"`: the operation has exactly one successful outcome, so a
 * server that answered 200 while leaving the sitting open fails the parse on
 * both sides rather than reading as a silent success.
 */
export const sittingInvalidateResultSchema = z.strictObject({
  documentId: documentIdSchema,
  status: z.literal('closed'),
});
export type SittingInvalidateResult = z.infer<typeof sittingInvalidateResultSchema>;

/** `{ data: { documentId, status } }` — the envelope every ops operation returns. */
export const sittingInvalidateResponseSchema = dataEnvelope(sittingInvalidateResultSchema);

/**
 * The named operation: request shape, response shape and the exact status set
 * bound together, so a test asserts the whole contract from one symbol instead
 * of restating the codes by hand.
 *
 * 400 malformed identifier / non-empty body / unsupported portal version ·
 * 401 invalid or expired JWT · 403 missing JWT (the current Strapi convention)
 * or a non-ops role · 404 unknown sitting · 429 rate limit · 500 server failure.
 * There is no 409: repeating the call on an already-closed sitting is the
 * idempotent replay of a completed void, not a conflict.
 */
export const SittingInvalidateOperation: OpsOperation<
  typeof sittingInvalidateBodySchema,
  typeof sittingInvalidateResponseSchema
> = Object.freeze({
  contractId: 'C-OPS-PORTAL-063',
  method: 'POST',
  path: '/api/ops/sittings/{documentId}/invalidate',
  request: sittingInvalidateBodySchema,
  response: sittingInvalidateResponseSchema,
  success: 200,
  errors: [400, 401, 403, 404, 429, 500],
});

/** Fills the `{documentId}` template so no call site hand-builds the path. */
export function sittingInvalidatePath(documentId: string): string {
  return `/api/ops/sittings/${encodeURIComponent(documentId)}/invalidate`;
}
