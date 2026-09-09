/** Responses whose body depends on the version header must Vary on it. */
export declare const PORTAL_VARY_HEADERS: readonly ["X-Ops-Portal-Version"];
/** Headers a browser must be allowed to SEND cross-origin. */
export declare const PORTAL_CORS_ALLOW_HEADERS: readonly ["Content-Type", "Authorization", "X-Ops-Portal-Version", "Idempotency-Key", "If-Match"];
/** Headers a browser must be allowed to READ cross-origin. */
export declare const PORTAL_CORS_EXPOSE_HEADERS: readonly ["Content-Disposition", "Retry-After"];
export type PortalMode = 'legacy' | 'versioned';
export type PortalNegotiation = {
    readonly ok: true;
    readonly mode: PortalMode;
} | PortalVersionRejected;
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
export declare function isPortalVersionRejected(negotiated: PortalNegotiation): negotiated is PortalVersionRejected;
/**
 * Shorter alias for the same guard. Kept because several ops controllers already
 * import this name; both point at one implementation, so there is nothing to
 * drift. Prefer `isPortalVersionRejected` in new code.
 */
export declare const isPortalRejection: typeof isPortalVersionRejected;
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
export declare function negotiatePortalVersion(raw: string | string[] | null | undefined): PortalNegotiation;
/** Convenience for a handler that only needs the boolean. Throws nothing. */
export declare function isVersionedRequest(raw: string | string[] | null | undefined): boolean;
/**
 * The header set a versioned client sends. Kept here rather than in the client
 * so a second consumer (the desktop app, a test harness) cannot drift from it.
 */
export declare function portalVersionHeader(): Readonly<Record<string, string>>;
