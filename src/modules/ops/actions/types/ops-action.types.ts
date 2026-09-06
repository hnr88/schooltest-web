import type { ErrorEnvelope } from '@schooltest/ops-contracts';

/** What a selection or an action addresses: entity kind plus `documentId`. */
export interface OpsActionTarget {
  /** Entity kind — 'school', 'invitation', 'class'. Scopes selection keys. */
  kind: string;
  /** Strapi v5 identity. NEVER a display name: names collide across schools. */
  documentId: string;
}

/**
 * The terminal state of one item.
 *
 * `success` and `failed` are both PROVEN: `success` was read back through an
 * authorized API, `failed` carries the HTTP status on which the server refused.
 * `not_started` was never dispatched. `uncertain` is the fourth value the
 * contracted three cannot express — a write that reached the wire and produced
 * no status. Calling that `failed` asserts a rollback nothing observed, and
 * calling it `success` asserts a write nothing read back; it stays its own
 * outcome until a later read-back settles it.
 */
export type OpsActionOutcome = 'success' | 'failed' | 'not_started' | 'uncertain';

export interface OpsActionResultItem {
  documentId: string;
  kind: string;
  outcome: OpsActionOutcome;
  /** Transported HTTP status, or null when the request produced no response. */
  status: number | null;
  error: ErrorEnvelope | null;
}

/**
 * One action, defined once and run over one or many targets.
 *
 * `readBack` is REQUIRED, and that is the point: a write is done only when it
 * is read back through an authorized API. Making it part of the type means an
 * action that cannot prove itself cannot be constructed, so no consumer can
 * report a 2xx as a finished write.
 */
export interface OpsActionDefinition<TTarget extends OpsActionTarget = OpsActionTarget> {
  /** Dispatch the single-item write. Rejects with the axios error on failure. */
  perform: (target: TTarget, signal: AbortSignal) => Promise<unknown>;
  /** True when the write is visible through an authorized read. */
  readBack: (target: TTarget) => Promise<boolean>;
  /** Re-checked before a retry, so an ineligible target is not re-dispatched. */
  isEligible?: (target: TTarget) => Promise<boolean>;
}

export type OpsActionRunStatus = 'idle' | 'running' | 'cancelling' | 'settled';

export interface OpsActionRunState {
  status: OpsActionRunStatus;
  /** Targets accepted for this run — the denominator every count reports on. */
  total: number;
  inFlight: number;
  results: readonly OpsActionResultItem[];
  /** A 403 is a role denial: retrying cannot change it, so the action stops. */
  denied: boolean;
  /** A 401 means the session ended; the caller re-authenticates. */
  requiresReauthentication: boolean;
  /** Whole seconds the server asked callers to wait, from a 429 Retry-After. */
  cooldownSeconds: number | null;
}

export interface OpsActionSummary {
  succeeded: number;
  failed: number;
  notStarted: number;
  uncertain: number;
  /** True ONLY when every accepted target was read back as applied. */
  allSucceeded: boolean;
  /** True while any item is unproven — no success or failure may be claimed. */
  hasUnresolved: boolean;
}
