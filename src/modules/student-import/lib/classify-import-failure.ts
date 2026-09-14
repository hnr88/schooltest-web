import { isAxiosError } from 'axios';

/**
 * THE shared import-failure classifier — every import surface (Students page,
 * class detail, ops) maps a refused preview/commit through this before showing
 * anything, so a seat cap can never again surface as "no students were
 * imported". The server's refusal codes are the contract:
 *
 *   - `SEAT_CAP` (403, entitlement gate: the batch precheck and the per-create
 *     middleware throw the same shape) — "your school has no seats left".
 *   - `SCHOOL_INACTIVE` (403, the same gate) — the school account is not active.
 *   - 413 — the file exceeds the contract's byte limit.
 *   - `NO_ROWS` — the strict parser read a header but zero data rows.
 *   - anything else with a server message — shown as-is: the validation
 *     refusals are written user-shaped ("csv is missing template columns: …",
 *     "row 3 has 6 values but the header declares 5"), which is the
 *     corresponding error, never a generic one.
 *
 * The kind maps onto the host's translated toasts; `server` carries the raw
 * server copy, which is en-AU product language by the repo copy rules.
 */

/** The slice of Strapi's error envelope the classifier reads. */
interface ImportErrorEnvelope {
  error?: {
    status?: number;
    message?: string;
    details?: { code?: unknown };
  };
}

export type ImportFailureKind =
  | 'seatCap'
  | 'schoolInactive'
  | 'forbidden'
  | 'tooBig'
  | 'noRows'
  | 'server'
  | 'generic';

export interface ImportFailure {
  kind: ImportFailureKind;
  /** The server's own refusal copy — present only for kind `server`. */
  serverMessage?: string;
}

export function classifyImportFailure(error: unknown): ImportFailure {
  if (!isAxiosError(error) || error.response === undefined) {
    // No response came back. The mutation's receipt reconciliation has already
    // had its chance to resolve a lost commit, so nothing more specific can be
    // claimed here than "it did not go through — try again".
    return { kind: 'generic' };
  }
  const status = error.response.status;
  const envelope = error.response.data as ImportErrorEnvelope | undefined;
  const code = envelope?.error?.details?.code;
  // The code is the discriminator, not the status: the entitlement gate owns
  // these two, and a refusal that carries one is never a generic failure.
  if (code === 'SEAT_CAP') return { kind: 'seatCap' };
  if (code === 'SCHOOL_INACTIVE') return { kind: 'schoolInactive' };
  if (status === 403) return { kind: 'forbidden' };
  if (status === 413) return { kind: 'tooBig' };
  if (code === 'NO_ROWS') return { kind: 'noRows' };
  const message = envelope?.error?.message;
  if (typeof message === 'string' && message !== '') {
    return { kind: 'server', serverMessage: message };
  }
  return { kind: 'generic' };
}
