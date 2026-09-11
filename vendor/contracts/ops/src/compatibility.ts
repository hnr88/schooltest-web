/**
 * OPS-009 — D-COMPAT. One definition of portal-version negotiation, imported by
 * the server that enforces it and the client that sends it, so the two cannot
 * disagree about what a legacy caller is owed.
 *
 * The rule, from mvp/tasks/ops/contract-rules.md:
 *   "New ops web requests send X-Ops-Portal-Version: 1. Existing endpoints
 *    preserve observed unversioned requests, response shapes/statuses and side
 *    effects; new endpoints have one declared contract. Reject unsupported
 *    header values with 400. Version selection never grants permissions."
 *
 * Three properties this module exists to guarantee:
 *  - ABSENT header  => legacy. The caller keeps the exact shape it has today.
 *  - "1"            => versioned. The extended contract applies.
 *  - anything else  => 400. Never a silent fallback to either mode, because a
 *                     typo'd version must not quietly serve legacy data to a
 *                     client that is parsing the new shape.
 * And the property that is a security boundary: the header carries NO
 * authority. It selects a wire shape and nothing else.
 */
import { OPS_PORTAL_VERSION, OPS_PORTAL_VERSION_HEADER } from './core';

/** Responses whose body depends on the version header must Vary on it. */
export const PORTAL_VARY_HEADERS = [OPS_PORTAL_VERSION_HEADER] as const;

/** Headers a browser must be allowed to SEND cross-origin. */
export const PORTAL_CORS_ALLOW_HEADERS = [
  'Content-Type',
  'Authorization',
  OPS_PORTAL_VERSION_HEADER,
  'Idempotency-Key',
  'If-Match',
  // Multi-tenant school switcher: every scoped /api/schools/me/** browser call
  // carries the active-school header once a school_admin picks a school — CORS
  // preflight rejects it unless allow-listed (school-admin lists all died).
  'X-School-DocumentId',
] as const;

/** Headers a browser must be allowed to READ cross-origin. */
export const PORTAL_CORS_EXPOSE_HEADERS = ['Content-Disposition', 'Retry-After'] as const;

export type PortalMode = 'legacy' | 'versioned';

export type PortalNegotiation =
  | { readonly ok: true; readonly mode: PortalMode }
  | PortalVersionRejected;

export interface PortalVersionRejected {
  readonly ok: false;
  readonly status: 400;
  readonly code: 'UNSUPPORTED_PORTAL_VERSION';
  readonly message: string;
  readonly path: string;
}

/**
 * NARROWING NOTE for schooltest-api consumers. Its tsconfig sets
 * `"strict": false`, and without `strictNullChecks` TypeScript does NOT narrow a
 * boolean-literal discriminant by truthiness: after `if (!negotiated.ok)` the
 * value is still the whole union and `negotiated.message` is a TS2339 error.
 * Use this guard, or compare explicitly (`negotiated.ok === true`), both of
 * which narrow under either setting:
 *
 *   const negotiated = negotiatePortalVersion(ctx.request.header[HEADER]);
 *   if (isPortalVersionRejected(negotiated)) {
 *     throw new ValidationError(negotiated.message, { code: negotiated.code });
 *   }
 */
export function isPortalVersionRejected(
  negotiated: PortalNegotiation,
): negotiated is PortalVersionRejected {
  return negotiated.ok === false;
}

/**
 * Shorter alias for the same guard. Kept because several ops controllers already
 * import this name; both point at one implementation, so there is nothing to
 * drift. Prefer `isPortalVersionRejected` in new code.
 */
export const isPortalRejection = isPortalVersionRejected;

/**
 * Decide which contract a request is asking for.
 *
 * `raw` is the header value exactly as the transport delivered it.
 *
 * ABSENT is `undefined`, `null` OR the empty string. The empty string matters:
 * Koa's `ctx.get(name)` returns `''` for a header that was never sent (verified
 * against koa directly), so it CANNOT distinguish "absent" from "sent empty".
 * Rejecting `''` therefore 400s every legacy caller that reads the header this
 * way — the exact breakage D-COMPAT exists to prevent. Preserving the legacy
 * caller outranks surfacing a hypothetical deliberately-empty header, so `''`
 * means legacy. A whitespace-only value is treated the same way.
 */
export function negotiatePortalVersion(raw: string | string[] | null | undefined): PortalNegotiation {
  if (raw === undefined || raw === null) return { ok: true, mode: 'legacy' };
  // Koa reports an unsent header as '' — absent, not deliberately empty.
  if (typeof raw === 'string' && raw.trim() === '') return { ok: true, mode: 'legacy' };

  // A repeated header is ambiguous: two values cannot both be the contract.
  if (Array.isArray(raw)) {
    return unsupported(raw.join(', '));
  }

  if (raw === OPS_PORTAL_VERSION) return { ok: true, mode: 'versioned' };

  return unsupported(raw);
}

function unsupported(value: string): PortalNegotiation {
  return {
    ok: false,
    status: 400,
    code: 'UNSUPPORTED_PORTAL_VERSION',
    message: `Unsupported ${OPS_PORTAL_VERSION_HEADER}: "${value}". Supported: "${OPS_PORTAL_VERSION}". Omit the header for the legacy contract.`,
    path: OPS_PORTAL_VERSION_HEADER,
  };
}

/** Convenience for a handler that only needs the boolean. Throws nothing. */
export function isVersionedRequest(raw: string | string[] | null | undefined): boolean {
  const negotiated = negotiatePortalVersion(raw);
  return negotiated.ok && negotiated.mode === 'versioned';
}

/**
 * The header set a versioned client sends. Kept here rather than in the client
 * so a second consumer (the desktop app, a test harness) cannot drift from it.
 */
export function portalVersionHeader(): Readonly<Record<string, string>> {
  return Object.freeze({ [OPS_PORTAL_VERSION_HEADER]: OPS_PORTAL_VERSION });
}
