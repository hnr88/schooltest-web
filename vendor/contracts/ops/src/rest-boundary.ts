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

import { errorEnvelopeSchema, isErrorEnvelopeForStatus, type ErrorEnvelope } from './core';

/** A Retry-After header that is absent, unparsable or negative carries no hint. */
function parseRetryAfter(header: string | null | undefined): number | null {
  if (header == null) return null;
  const seconds = Number(header);
  return Number.isFinite(seconds) && seconds >= 0 ? seconds : null;
}

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
export type RestFailure =
  | { kind: 'auth-invalid'; envelope: ErrorEnvelope | null }
  | { kind: 'auth-missing'; envelope: ErrorEnvelope | null }
  | { kind: 'auth-forbidden'; envelope: ErrorEnvelope | null }
  | { kind: 'rate-limited'; retryAfterSeconds: number | null; envelope: ErrorEnvelope | null }
  | { kind: 'transport'; uncertainWrite: boolean }
  | {
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

export function classifyRestFailure(input: RestFailureInput): RestFailure {
  if (input.status === null) {
    return { kind: 'transport', uncertainWrite: Boolean(input.writeSent) && !input.idempotencyKey };
  }
  const parsed = errorEnvelopeSchema.safeParse(input.body);
  const envelope = parsed.success ? parsed.data : null;
  if (input.status === 401) return { kind: 'auth-invalid', envelope };
  if (input.status === 403) {
    return input.tokenWasAttached
      ? { kind: 'auth-forbidden', envelope }
      : { kind: 'auth-missing', envelope };
  }
  if (input.status === 429) {
    return {
      kind: 'rate-limited',
      retryAfterSeconds: parseRetryAfter(input.retryAfterHeader),
      envelope,
    };
  }
  return {
    kind: 'contract',
    status: input.status,
    envelope,
    bodyMatchedContract: isErrorEnvelopeForStatus(input.body, input.status),
  };
}

/** Thrown when a 2xx body fails the operation's own shared schema. */
export class RestContractViolation extends Error {
  constructor(readonly issues: z.ZodError['issues']) {
    super('response body violated the operation contract');
    this.name = 'RestContractViolation';
  }
}

/**
 * Parses a success body through the operation's own schema and unwraps
 * `{ data: ... }`. Unknown transport keys (e.g. `meta`) are tolerated; the
 * data itself is validated exactly as contracted, so a drifted shape throws
 * instead of flowing into the UI as a silent empty success.
 */
export function parseDataEnvelope<T extends z.ZodType>(inner: T, body: unknown): z.output<T> {
  const parsed = z.object({ data: inner }).safeParse(body);
  if (!parsed.success) throw new RestContractViolation(parsed.error.issues);
  return (parsed.data as { data: z.output<T> }).data;
}
