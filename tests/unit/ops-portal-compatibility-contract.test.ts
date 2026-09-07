/**
 * OPS-009 — the client half of the compatibility proof. Drives the REAL strapi
 * axios instance through an in-process adapter (no network) over the edge cases
 * the task names:
 *  - "old cached web bundle" / "mixed deployments": a request that does NOT opt
 *    in reaches the wire with no version header, so the server keeps serving the
 *    legacy shape. The header is per-request, never a default — one migrated
 *    call cannot migrate every other ops/teacher/desktop call.
 *  - "new client misses required header": omitting it is a valid contract
 *    (legacy); a MISTYPED value is 400 UNSUPPORTED_PORTAL_VERSION, classified as
 *    a contract failure rather than a silent success. Empty/whitespace-only
 *    reads as ABSENT, not mistyped: Koa's ctx.get returns '' for an unsent
 *    header, and the school write paths read it that way.
 *  - "header spoof does not grant authorization": opting in attaches the version
 *    header and nothing else; the three auth outcomes stay distinct.
 *  - "old client receives new fields unexpectedly": unknown TRANSPORT keys
 *    (meta.pagination) are tolerated, drift inside `data` throws.
 * Negotiation assertions mirror the server half in
 * schooltest-api/tests/unit/ops-portal-compatibility-contract.spec.ts.
 */
import { AxiosError, type AxiosResponse, type InternalAxiosRequestConfig } from 'axios';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import {
  OPS_PORTAL_VERSION,
  OPS_PORTAL_VERSION_HEADER,
  PORTAL_CORS_ALLOW_HEADERS,
  PORTAL_CORS_EXPOSE_HEADERS,
  RestContractViolation,
  classifyRestFailure,
  isVersionedRequest,
  negotiatePortalVersion,
  parseDataEnvelope,
  portalVersionHeader,
  schoolInvitationStateSchema,
} from '@schooltest/ops-contracts';

import {
  idempotencyHeaders,
  portalVersionHeaders,
  restFailureOf,
  strapi,
  writeClientToken,
} from '@/lib/axios/strapi';

/** The legacy C-SCH-07 body an unversioned caller gets today. */
const LEGACY_STATE = {
  documentId: 'schooltest000000000000001',
  account_status: 'prospect',
  onboarding_status: 'not_started',
  contact_first_name: null,
  contact_last_name: null,
  contact_email: null,
};
const COMMIT_PATH = '/api/ops/schools/schooltest000000000000001/import-students/commit';

function errorEnvelope(status: number, code?: string) {
  const details = code ? { code } : {};
  return { data: null, error: { status, name: 'PortalError', message: 'probe', details } };
}

/** Captures the config the interceptor actually put on the wire. */
let sent: InternalAxiosRequestConfig | null = null;

function respondWith(status = 200, body: unknown = { data: LEGACY_STATE, meta: {} }) {
  return async (config: InternalAxiosRequestConfig): Promise<AxiosResponse> => {
    sent = config;
    const res: AxiosResponse = { data: body, status, statusText: String(status), headers: {}, config };
    if (status >= 200 && status < 300) return res;
    throw new AxiosError('request failed', 'ERR_BAD_REQUEST', config, undefined, res);
  };
}

function sentHeader(name: string): unknown {
  return sent?.headers?.[name];
}

const originalAdapter = strapi.defaults.adapter;

beforeEach(() => {
  sent = null;
  writeClientToken(null);
});

afterEach(() => {
  strapi.defaults.adapter = originalAdapter;
});

describe('OPS-009 the version header is opt-in per request', () => {
  it('an un-migrated call sends NO version header, and opting one in never migrates the next', async () => {
    strapi.defaults.adapter = respondWith();
    writeClientToken('ops-token');
    await strapi.get('/api/ops/schools');
    expect(sentHeader(OPS_PORTAL_VERSION_HEADER)).toBeUndefined();
    // Token attachment is untouched by the version work, and an absent header is
    // exactly what the server reads as legacy. Koa ctx.get returns '' for an
    // unsent header, so empty/whitespace-only must negotiate to legacy too —
    // rejecting it would 400 every legacy caller on the school write paths
    // (schooltest-api src/api/school/controllers/school.ts, school-create.actions.ts).
    expect(sentHeader('Authorization')).toBe('Bearer ops-token');
    expect(negotiatePortalVersion(undefined)).toEqual({ ok: true, mode: 'legacy' });
    expect(negotiatePortalVersion('')).toEqual({ ok: true, mode: 'legacy' });
    expect(negotiatePortalVersion(' ')).toEqual({ ok: true, mode: 'legacy' });
    expect(isVersionedRequest('')).toBe(false);

    await strapi.get('/api/ops/schools', { opsPortalVersioned: true });
    expect(sentHeader(OPS_PORTAL_VERSION_HEADER)).toBe(OPS_PORTAL_VERSION);

    await strapi.get('/api/ops/schools');
    expect(sentHeader(OPS_PORTAL_VERSION_HEADER)).toBeUndefined();

    // Explicit false is legacy too — no truthiness surprise — and the flag never
    // leaks onto the instance defaults.
    await strapi.get('/api/ops/schools', { opsPortalVersioned: false });
    expect(sentHeader(OPS_PORTAL_VERSION_HEADER)).toBeUndefined();
    expect(strapi.defaults.headers.common[OPS_PORTAL_VERSION_HEADER]).toBeUndefined();
  });

  it('the sent value is the shared constant, riding alongside the other headers', async () => {
    strapi.defaults.adapter = respondWith();
    await strapi.post(
      COMMIT_PATH,
      { csv: 'given name\nEmma\n', class_documentId: 'schooltest000000000000002' },
      { opsPortalVersioned: true, headers: idempotencyHeaders('commit-key-1') }
    );
    const value = sentHeader(OPS_PORTAL_VERSION_HEADER);
    expect(value).toBe(portalVersionHeader()[OPS_PORTAL_VERSION_HEADER]);
    expect(isVersionedRequest(value as string)).toBe(true);
    expect(sentHeader('Idempotency-Key')).toBe('commit-key-1');
    expect(portalVersionHeaders()).toEqual({ [OPS_PORTAL_VERSION_HEADER]: OPS_PORTAL_VERSION });
  });

  it('opting in attaches no token, and cannot smuggle one onto a public auth path', async () => {
    strapi.defaults.adapter = respondWith();
    await strapi.get('/api/ops/schools', { opsPortalVersioned: true });
    expect(sentHeader(OPS_PORTAL_VERSION_HEADER)).toBe(OPS_PORTAL_VERSION);
    expect(sentHeader('Authorization')).toBeUndefined();

    writeClientToken('ops-token');
    await strapi.post('/api/auth/local', { identifier: 'a@b.c' }, { opsPortalVersioned: true });
    expect(sentHeader(OPS_PORTAL_VERSION_HEADER)).toBe(OPS_PORTAL_VERSION);
    expect(sentHeader('Authorization')).toBeUndefined();
  });

  it('a spoofed header still meets 403/401 — the classifier keeps the outcomes distinct', async () => {
    const probe = async (status: number, token: string | null) => {
      strapi.defaults.adapter = respondWith(status, errorEnvelope(status));
      writeClientToken(token);
      const caught = await strapi
        .get('/api/ops/schools', { opsPortalVersioned: true })
        .catch((error: unknown) => error);
      expect(sentHeader(OPS_PORTAL_VERSION_HEADER)).toBe(OPS_PORTAL_VERSION);
      return restFailureOf(caught)?.kind;
    };

    expect(await probe(403, null)).toBe('auth-missing');
    expect(await probe(403, 'teacher-token')).toBe('auth-forbidden');
    expect(await probe(401, 'stale-token')).toBe('auth-invalid');
  });
});

describe('OPS-009 mixed deployments and old bundles', () => {
  it('a mistyped version is a loud 400, never a silent legacy fallback', async () => {
    // '' is absent, not mistyped: Koa's ctx.get returns '' for an unsent header
    // and the api school write paths read it that way; the legacy case is pinned
    // positively in the opt-in describe above. Mirror of the api spec fix.
    for (const value of ['2', 'v1', 'latest']) {
      expect(negotiatePortalVersion(value).ok, `value ${JSON.stringify(value)}`).toBe(false);
      expect(isVersionedRequest(value)).toBe(false);
    }

    strapi.defaults.adapter = respondWith(400, errorEnvelope(400, 'UNSUPPORTED_PORTAL_VERSION'));
    writeClientToken('ops-token');
    const rejected = await strapi
      .get('/api/ops/schools', { headers: { [OPS_PORTAL_VERSION_HEADER]: '2' } })
      .catch((error: unknown) => error);

    expect(restFailureOf(rejected)).toMatchObject({
      kind: 'contract',
      status: 400,
      bodyMatchedContract: true,
    });
  });

  it('an old consumer still parses an extended body: new transport keys are tolerated', () => {
    // A newer server answering an older bundle adds meta.pagination /
    // meta.status_counts alongside the same `data` — the legacy read must not
    // break on keys it never asked for.
    const meta = { pagination: { page: 1, pageSize: 25, pageCount: 1, total: 1 } };
    expect(parseDataEnvelope(schoolInvitationStateSchema, { data: LEGACY_STATE, meta }).documentId)
      .toBe(LEGACY_STATE.documentId);

    // Drift INSIDE data is loud: a silently-changed row must never reach the UI.
    expect(() =>
      parseDataEnvelope(schoolInvitationStateSchema, { data: { ...LEGACY_STATE, token: 'leak' } })
    ).toThrow(RestContractViolation);
  });

  it('every header the client can send survives the server CORS allow list', () => {
    // The browser preflight drops any request header the API did not allow, so
    // the client and config/middlewares.ts read the SAME shared constant.
    for (const name of [OPS_PORTAL_VERSION_HEADER, 'Idempotency-Key', 'Authorization']) {
      expect([...PORTAL_CORS_ALLOW_HEADERS]).toContain(name);
    }
    // Retry-After must be readable cross-origin or the 429 ride-out guesses.
    expect([...PORTAL_CORS_EXPOSE_HEADERS]).toContain('Retry-After');
    const body = errorEnvelope(429);
    const opts = { status: 429, body, tokenWasAttached: true, retryAfterHeader: '3' };
    expect(classifyRestFailure(opts)).toMatchObject({ kind: 'rate-limited', retryAfterSeconds: 3 });
  });
});
