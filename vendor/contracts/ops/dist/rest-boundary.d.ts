/**
 * REST boundary primitives (OPS-007) — shared by schooltest-web's axios
 * instance and the unit suites on BOTH sides, so the client's failure
 * classification and the server's contract assertions cannot drift.
 *
 * Transport-agnostic on purpose: everything here takes plain status/body
 * values, never axios or fetch types, because this file is bundled into the
 * browser and run under node test runners alike.
 */
import { z } from 'zod';
import { type ErrorEnvelope } from './core';
/**
 * One classified shape for every non-success outcome of a portal request.
 * `auth-missing` vs `auth-forbidden` keeps Strapi's 403-for-a-missing-JWT
 * convention distinct from an authenticated role/scope denial, so the UI can
 * tell "your session ended" from "your role may not do this". `transport`
 * means no HTTP status was received: a network failure does not prove
 * rollback, and a non-idempotent write whose request reached the wire is
 * `uncertainWrite` — it must be reconciled (refetch) before any manual retry.
 * `contract` covers every other non-2xx plus a body that fails the shared
 * error envelope (an HTML proxy page, a malformed JSON shape).
 */
export type RestFailure = {
    kind: 'auth-invalid';
    envelope: ErrorEnvelope | null;
} | {
    kind: 'auth-missing';
    envelope: ErrorEnvelope | null;
} | {
    kind: 'auth-forbidden';
    envelope: ErrorEnvelope | null;
} | {
    kind: 'rate-limited';
    retryAfterSeconds: number | null;
    envelope: ErrorEnvelope | null;
} | {
    kind: 'transport';
    uncertainWrite: boolean;
} | {
    kind: 'contract';
    status: number;
    envelope: ErrorEnvelope | null;
    bodyMatchedContract: boolean;
};
export interface RestFailureInput {
    /** Transported HTTP status, or null when the request produced no response. */
    status: number | null;
    body: unknown;
    /** Whether the failed request actually carried a bearer token. */
    tokenWasAttached: boolean;
    retryAfterHeader?: string | null;
    /** Whether the request reached the wire (axios always builds a config). */
    writeSent?: boolean;
    /** The Idempotency-Key the request carried, if any. */
    idempotencyKey?: string | null;
}
export declare function classifyRestFailure(input: RestFailureInput): RestFailure;
/** Thrown when a 2xx body fails the operation's own shared schema. */
export declare class RestContractViolation extends Error {
    readonly issues: z.ZodError['issues'];
    constructor(issues: z.ZodError['issues']);
}
/**
 * Parses a success body through the operation's own schema and unwraps
 * `{ data: ... }`. Unknown transport keys (e.g. `meta`) are tolerated; the
 * data itself is validated exactly as contracted, so a drifted shape throws
 * instead of flowing into the UI as a silent empty success.
 */
export declare function parseDataEnvelope<T extends z.ZodType>(inner: T, body: unknown): z.output<T>;
