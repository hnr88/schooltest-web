import type { ErrorEnvelope, RestFailure } from '@schooltest/ops-contracts';

/**
 * What the transport actually proved about one write.
 *
 * The distinction this type exists to hold: a settled 4xx is the server saying
 * it refused, so nothing was written; a transport failure carries no status at
 * all and proves NOTHING — not success, and specifically not rollback. A 5xx
 * sits between them: the server answered, but an error mid-write can leave work
 * behind, so it is unproven until a read-back settles it.
 */
export type OpsActionDisposition =
  | { kind: 'acknowledged'; status: number }
  | { kind: 'refused'; status: number; envelope: ErrorEnvelope | null }
  | { kind: 'unproven'; status: number | null; envelope: ErrorEnvelope | null }
  | { kind: 'denied'; envelope: ErrorEnvelope | null }
  | { kind: 'unauthenticated'; envelope: ErrorEnvelope | null }
  | { kind: 'cooldown'; retryAfterSeconds: number | null; envelope: ErrorEnvelope | null };

/** A server error may follow a partial write, so it is never proof of refusal. */
function isServerError(status: number): boolean {
  return status >= 500;
}

/** Classify a rejected write from the boundary's own typed failure. */
export function dispositionOfFailure(failure: RestFailure | null): OpsActionDisposition {
  if (failure === null) return { kind: 'unproven', status: null, envelope: null };
  switch (failure.kind) {
    case 'transport':
      return { kind: 'unproven', status: null, envelope: null };
    case 'auth-invalid':
      return { kind: 'unauthenticated', envelope: failure.envelope };
    case 'auth-missing':
    case 'auth-forbidden':
      return { kind: 'denied', envelope: failure.envelope };
    case 'rate-limited':
      return {
        kind: 'cooldown',
        retryAfterSeconds: failure.retryAfterSeconds,
        envelope: failure.envelope,
      };
    case 'contract':
      return isServerError(failure.status)
        ? { kind: 'unproven', status: failure.status, envelope: failure.envelope }
        : { kind: 'refused', status: failure.status, envelope: failure.envelope };
  }
}

/** The status to report for a disposition, or null when none was transported. */
export function statusOfDisposition(disposition: OpsActionDisposition): number | null {
  switch (disposition.kind) {
    case 'acknowledged':
    case 'refused':
      return disposition.status;
    case 'unproven':
      return disposition.status;
    case 'denied':
    case 'unauthenticated':
    case 'cooldown':
      return disposition.envelope?.error.status ?? null;
  }
}

/** The error envelope a disposition carries, if the server sent a contracted one. */
export function envelopeOfDisposition(disposition: OpsActionDisposition): ErrorEnvelope | null {
  return disposition.kind === 'acknowledged' ? null : disposition.envelope;
}
