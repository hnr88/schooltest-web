"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.isPortalRejection = exports.PORTAL_CORS_EXPOSE_HEADERS = exports.PORTAL_CORS_ALLOW_HEADERS = exports.PORTAL_VARY_HEADERS = void 0;
exports.isPortalVersionRejected = isPortalVersionRejected;
exports.negotiatePortalVersion = negotiatePortalVersion;
exports.isVersionedRequest = isVersionedRequest;
exports.portalVersionHeader = portalVersionHeader;
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
const core_1 = require("./core");
/** Responses whose body depends on the version header must Vary on it. */
exports.PORTAL_VARY_HEADERS = [core_1.OPS_PORTAL_VERSION_HEADER];
/** Headers a browser must be allowed to SEND cross-origin. */
exports.PORTAL_CORS_ALLOW_HEADERS = [
    'Content-Type',
    'Authorization',
    core_1.OPS_PORTAL_VERSION_HEADER,
    'Idempotency-Key',
    'If-Match',
];
/** Headers a browser must be allowed to READ cross-origin. */
exports.PORTAL_CORS_EXPOSE_HEADERS = ['Content-Disposition', 'Retry-After'];
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
function isPortalVersionRejected(negotiated) {
    return negotiated.ok === false;
}
/**
 * Shorter alias for the same guard. Kept because several ops controllers already
 * import this name; both point at one implementation, so there is nothing to
 * drift. Prefer `isPortalVersionRejected` in new code.
 */
exports.isPortalRejection = isPortalVersionRejected;
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
function negotiatePortalVersion(raw) {
    if (raw === undefined || raw === null)
        return { ok: true, mode: 'legacy' };
    // Koa reports an unsent header as '' — absent, not deliberately empty.
    if (typeof raw === 'string' && raw.trim() === '')
        return { ok: true, mode: 'legacy' };
    // A repeated header is ambiguous: two values cannot both be the contract.
    if (Array.isArray(raw)) {
        return unsupported(raw.join(', '));
    }
    if (raw === core_1.OPS_PORTAL_VERSION)
        return { ok: true, mode: 'versioned' };
    return unsupported(raw);
}
function unsupported(value) {
    return {
        ok: false,
        status: 400,
        code: 'UNSUPPORTED_PORTAL_VERSION',
        message: `Unsupported ${core_1.OPS_PORTAL_VERSION_HEADER}: "${value}". Supported: "${core_1.OPS_PORTAL_VERSION}". Omit the header for the legacy contract.`,
        path: core_1.OPS_PORTAL_VERSION_HEADER,
    };
}
/** Convenience for a handler that only needs the boolean. Throws nothing. */
function isVersionedRequest(raw) {
    const negotiated = negotiatePortalVersion(raw);
    return negotiated.ok && negotiated.mode === 'versioned';
}
/**
 * The header set a versioned client sends. Kept here rather than in the client
 * so a second consumer (the desktop app, a test harness) cannot drift from it.
 */
function portalVersionHeader() {
    return Object.freeze({ [core_1.OPS_PORTAL_VERSION_HEADER]: core_1.OPS_PORTAL_VERSION });
}
