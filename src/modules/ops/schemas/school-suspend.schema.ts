import { z } from 'zod';

/**
 * OPS-015 — the ONE piece of shape this client owns for the suspend flow.
 *
 * The C-OPS-PORTAL-005 request/response contract is NOT redeclared here: it is
 * `@schooltest/ops-contracts#schoolSuspendResultSchema`, imported directly by the
 * mutation. What lives here is the client's projection of the AUTHORIZED school
 * read it takes the `If-Match` version from — a different endpoint, and not part
 * of the suspend contract.
 *
 * Not strict: the core school read returns the whole row, and this pins only the
 * two keys the lifecycle write depends on.
 */
export const schoolVersionSchema = z.object({
  documentId: z.string().min(1),
  updatedAt: z.iso.datetime({ offset: true }),
});
