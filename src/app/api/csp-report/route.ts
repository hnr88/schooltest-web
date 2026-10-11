// W3-09 — POST /api/csp-report: collector for Content-Security-Policy
// violation reports (the CSP's `report-uri`). Browsers send these anonymously,
// so the route has no auth; it therefore does the least it can. It reads at
// most 8 KB, logs ONE line holding the violated directive, the effective
// directive and the blocked URI's ORIGIN (never a path, query, full URL or the
// script sample, which can carry user data), stores nothing and always answers
// 204. Anything it cannot parse is dropped silently, still with 204.

const MAX_BODY_BYTES = 8 * 1024;
const ACCEPTED_TYPES = ['application/csp-report', 'application/reports+json'];
// Non-URL blocked-uri values the CSP spec defines. Anything else is 'unknown'.
const KEYWORD_SOURCES = new Set(['inline', 'eval', 'self', 'data', 'blob', 'wasm-eval', 'unknown']);

function directiveName(value: unknown): string {
  // `violated-directive` can carry the whole matched policy text; keep only the
  // leading directive name and only if it looks like one.
  if (typeof value !== 'string') return 'unknown';
  const name = value.trim().split(/\s+/)[0]?.toLowerCase() ?? '';
  return /^[a-z][a-z-]{0,39}$/.test(name) ? name : 'unknown';
}

function blockedOrigin(value: unknown): string {
  if (typeof value !== 'string' || value === '') return 'unknown';
  const lower = value.toLowerCase();
  if (KEYWORD_SOURCES.has(lower)) return lower;
  try {
    const url = new URL(value);
    // data:, blob: and similar have an opaque origin of "null": keep the scheme.
    return url.origin === 'null' ? url.protocol.replace(':', '') : url.origin;
  } catch {
    return 'unknown';
  }
}

type RawReport = Record<string, unknown>;

// Handles both wire formats: the legacy `{ "csp-report": {...} }` object and
// the Reporting API array `[ { type: 'csp-violation', body: {...} } ]`.
function firstViolation(parsed: unknown): RawReport | null {
  const record = (value: unknown): RawReport | null =>
    value !== null && typeof value === 'object' && !Array.isArray(value)
      ? (value as RawReport)
      : null;
  if (Array.isArray(parsed)) {
    for (const entry of parsed) {
      const body = record(record(entry)?.body);
      if (body) return body;
    }
    return null;
  }
  const top = record(parsed);
  return record(top?.['csp-report']) ?? null;
}

async function readCapped(request: Request): Promise<string | null> {
  const declared = Number(request.headers.get('content-length'));
  if (Number.isFinite(declared) && declared > MAX_BODY_BYTES) return null;
  if (!request.body) return null;
  const reader = request.body.getReader();
  const chunks: Uint8Array[] = [];
  let total = 0;
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    total += value.byteLength;
    if (total > MAX_BODY_BYTES) {
      await reader.cancel().catch(() => undefined);
      return null;
    }
    chunks.push(value);
  }
  const merged = new Uint8Array(total);
  let offset = 0;
  for (const chunk of chunks) {
    merged.set(chunk, offset);
    offset += chunk.byteLength;
  }
  return new TextDecoder().decode(merged);
}

export async function POST(request: Request): Promise<Response> {
  try {
    const contentType = (request.headers.get('content-type') ?? '').toLowerCase();
    if (ACCEPTED_TYPES.some((type) => contentType.startsWith(type))) {
      const text = await readCapped(request);
      if (text !== null) {
        const violation = firstViolation(JSON.parse(text));
        if (violation) {
          const violated = directiveName(violation['violated-directive'] ?? violation.violatedDirective);
          const effective = directiveName(
            violation['effective-directive'] ?? violation.effectiveDirective ?? violated,
          );
          const origin = blockedOrigin(violation['blocked-uri'] ?? violation.blockedURL ?? violation.blockedURI);
          console.info(
            `[csp-report] violatedDirective=${violated} effectiveDirective=${effective} blockedOrigin=${origin}`,
          );
        }
      }
    }
  } catch {
    // A malformed report is not an error worth surfacing to an anonymous caller.
  }
  return new Response(null, { status: 204 });
}

export function GET(): Response {
  return new Response(null, { status: 405, headers: { Allow: 'POST' } });
}
