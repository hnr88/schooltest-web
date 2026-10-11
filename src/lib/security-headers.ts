// Request-time security headers for HTML document responses (W3-09).
//
// WHY request time and not next.config.ts headers(): headers() is evaluated at
// BUILD time, so a flag read there could only be changed by a rebuild. These
// helpers are called from src/proxy.ts for every request, and they read their
// flags from the runtime environment each time, so Coolify can switch them with
// a restart and no rebuild. Both flags default to OFF, which is today's
// behaviour (no headers of our own; HSTS comes only from the Cloudflare edge).
//
// Runtime env (server-only, never NEXT_PUBLIC_*):
//   SECURITY_HEADERS_ENABLED  strict 'true' to emit the five baseline headers.
//   SECURITY_CSP_MODE         'off' (default) | 'report-only' | 'enforce'.
//
// CSP CAVEAT: script-src and style-src keep 'unsafe-inline' because Next
// inlines its bootstrap and hydration scripts and per-request nonces are not
// wired yet. That makes the policy weaker than a nonce policy, so it is shipped
// as Report-Only first; moving to `enforce` is a human decision after a soak
// of reports at /api/csp-report. 'unsafe-eval' is NOT included, so `next dev`
// (React dev tooling uses eval) should keep SECURITY_CSP_MODE off locally.
//
// The module is pure: it takes the environment as an argument and never reads
// process.env itself, so a unit test can drive every branch.

export type CspMode = 'off' | 'report-only' | 'enforce';

export type SecurityEnv = Readonly<Record<string, string | undefined>>;

export const CSP_REPORT_PATH = '/api/csp-report';

const DEFAULT_API_BASE_URL = 'http://localhost:1337';

export function readCspMode(source: SecurityEnv): CspMode {
  const raw = source.SECURITY_CSP_MODE;
  return raw === 'report-only' || raw === 'enforce' ? raw : 'off';
}

export function securityHeadersEnabled(source: SecurityEnv): boolean {
  return source.SECURITY_HEADERS_ENABLED === 'true';
}

// The browser talks to NEXT_PUBLIC_API_BASE_URL (Strapi), so its ORIGIN is the
// one extra source the policy allows. An unparseable value falls back to the
// same default src/lib/env.ts uses, rather than failing a page render.
export function apiOrigin(source: SecurityEnv): string {
  const raw = source.NEXT_PUBLIC_API_BASE_URL || DEFAULT_API_BASE_URL;
  try {
    return new URL(raw).origin;
  } catch {
    return new URL(DEFAULT_API_BASE_URL).origin;
  }
}

export function buildContentSecurityPolicy(source: SecurityEnv): string {
  const api = apiOrigin(source);
  return [
    "default-src 'self'",
    "script-src 'self' 'unsafe-inline'",
    "style-src 'self' 'unsafe-inline'",
    `img-src 'self' data: blob: ${api}`,
    `media-src 'self' blob: ${api}`,
    `connect-src 'self' ${api}`,
    "font-src 'self' data:",
    "frame-ancestors 'self'",
    "base-uri 'self'",
    "form-action 'self'",
    "object-src 'none'",
    `report-uri ${CSP_REPORT_PATH}`,
  ].join('; ');
}

// The exact header set for this environment: empty when both flags are off.
export function buildSecurityHeaders(source: SecurityEnv): Array<[string, string]> {
  const headers: Array<[string, string]> = [];
  if (securityHeadersEnabled(source)) {
    headers.push(
      ['X-Content-Type-Options', 'nosniff'],
      ['Referrer-Policy', 'strict-origin-when-cross-origin'],
      ['X-Frame-Options', 'SAMEORIGIN'],
      ['Permissions-Policy', 'camera=(), microphone=(), geolocation=(), payment=()'],
      // No `preload`: submitting the domain to the preload list is a human
      // action tied to the edge setting, and is hard to undo.
      ['Strict-Transport-Security', 'max-age=31536000; includeSubDomains'],
    );
  }
  const mode = readCspMode(source);
  if (mode === 'report-only') {
    headers.push(['Content-Security-Policy-Report-Only', buildContentSecurityPolicy(source)]);
  } else if (mode === 'enforce') {
    headers.push(['Content-Security-Policy', buildContentSecurityPolicy(source)]);
  }
  return headers;
}

// Sets the headers on a response (mutating it) and returns it. With both flags
// off it touches nothing.
export function applySecurityHeaders<T extends { headers: Headers }>(
  response: T,
  source: SecurityEnv,
): T {
  for (const [name, value] of buildSecurityHeaders(source)) {
    response.headers.set(name, value);
  }
  return response;
}
