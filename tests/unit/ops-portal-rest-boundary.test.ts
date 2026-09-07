/**
 * OPS-007 — the client half of the rest-boundary proof.
 *
 * Drives the REAL strapi axios instance through a request adapter (no
 * network, no environment beyond jsdom) and asserts the boundary contract:
 * the three auth outcomes stay distinct, the stored token is invalidated and
 * auth-change listeners fire on 401, the automatic 429 ride-out is confined
 * to reads, success bodies are parsed through operation-specific shared
 * schemas, and a network failure after a write is reported as uncertain
 * instead of a silent empty success.
 */
import { AxiosError, type AxiosResponse, type InternalAxiosRequestConfig } from 'axios';
import { afterEach, describe, expect, it, beforeEach } from 'vitest';

import {
  OPS_PORTAL_VERSION,
  OPS_PORTAL_VERSION_HEADER,
  RestContractViolation,
  classifyRestFailure,
  parseDataEnvelope,
  schoolInvitationStateSchema,
} from '@schooltest/ops-contracts';

import {
  idempotencyHeaders,
  onAuthChange,
  portalVersionHeaders,
  readClientToken,
  restFailureOf,
  strapi,
  writeClientToken,
} from '@/lib/axios/strapi';

const VALID_STATE = {
  documentId: 'schooltest000000000000001',
  account_status: 'prospect',
  onboarding_status: 'not_started',
  contact_first_name: null,
  contact_last_name: null,
  contact_email: null,
};

function errorEnvelope(status: number) {
  return { data: null, error: { status, name: 'TestError', message: 'boundary probe', details: {} } };
}

function respond(config: InternalAxiosRequestConfig, status: number, body: unknown, headers: Record<string, string> = {}): AxiosResponse {
  return { data: body, status, statusText: String(status), headers, config };
}

function adapterFor(handler: (config: InternalAxiosRequestConfig) => AxiosResponse) {
  return async (config: InternalAxiosRequestConfig): Promise<AxiosResponse> => {
    const response = handler(config);
    if (response.status >= 200 && response.status < 300) return response;
    throw new AxiosError('request failed', 'ERR_BAD_REQUEST', config, undefined, response);
  };
}

const originalAdapter = strapi.defaults.adapter;

beforeEach(() => {
  writeClientToken(null);
});

afterEach(() => {
  strapi.defaults.adapter = originalAdapter;
});

describe('OPS-007 rest boundary (web client)', () => {
  it('keeps the three auth outcomes distinct: 401, anonymous 403, forbidden 403', async () => {
    let attached: unknown;
    strapi.defaults.adapter = adapterFor((config) => {
      attached = config.headers?.Authorization;
      return respond(config, 403, errorEnvelope(403));
    });

    const anonymous = await strapi.get('/api/ops/users').catch((error: unknown) => error);
    expect(restFailureOf(anonymous)?.kind).toBe('auth-missing');
    expect(attached).toBeUndefined();

    writeClientToken('ops-token');
    const forbidden = await strapi.get('/api/ops/users').catch((error: unknown) => error);
    expect(restFailureOf(forbidden)?.kind).toBe('auth-forbidden');
    expect(attached).toBe('Bearer ops-token');

    strapi.defaults.adapter = adapterFor((config) => respond(config, 401, errorEnvelope(401)));
    const invalid = await strapi.get('/api/ops/users').catch((error: unknown) => error);
    expect(restFailureOf(invalid)?.kind).toBe('auth-invalid');
  });

  it('a 401 invalidates the stored token and fires the auth-change listeners', async () => {
    writeClientToken('session-token');
    let changes = 0;
    const off = onAuthChange(() => {
      changes += 1;
    });
    strapi.defaults.adapter = adapterFor((config) => respond(config, 401, errorEnvelope(401)));

    await strapi.get('/api/ops/users').catch(() => null);

    expect(readClientToken()).toBeNull();
    expect(changes).toBe(1);
    off();
  });

  it('auth-change listeners fire on sign-in and sign-out token writes', () => {
    let changes = 0;
    const off = onAuthChange(() => {
      changes += 1;
    });
    writeClientToken('token-a');
    writeClientToken('token-b');
    writeClientToken(null);
    off();
    writeClientToken('ignored');
    expect(changes).toBe(3);
  });

  it('the automatic 429 ride-out retries reads and honors Retry-After', async () => {
    let calls = 0;
    strapi.defaults.adapter = adapterFor((config) => {
      calls += 1;
      if (calls < 3) return respond(config, 429, errorEnvelope(429), { 'retry-after': '0' });
      return respond(config, 200, { data: { ok: true } });
    });

    const response = await strapi.get('/api/ops/schools');

    expect(response.status).toBe(200);
    expect(calls).toBe(3);
  });

  it('a 429 on a write is never auto-retried — the caller sees rate-limited', async () => {
    let calls = 0;
    strapi.defaults.adapter = adapterFor((config) => {
      calls += 1;
      return respond(config, 429, errorEnvelope(429), { 'retry-after': '0' });
    });

    const error = await strapi.post('/api/schools/schooltest000000000000001/onboarding-link/resend').catch(
      (caught: unknown) => caught,
    );

    expect(calls).toBe(1);
    expect(restFailureOf(error)?.kind).toBe('rate-limited');
  });

  it('Retry-After absent or unparsable classifies as no hint instead of a bogus wait', () => {
    expect(
      classifyRestFailure({ status: 429, body: errorEnvelope(429), tokenWasAttached: true }),
    ).toMatchObject({ kind: 'rate-limited', retryAfterSeconds: null });
    expect(
      classifyRestFailure({ status: 429, body: errorEnvelope(429), tokenWasAttached: true, retryAfterHeader: 'soon' }),
    ).toMatchObject({ kind: 'rate-limited', retryAfterSeconds: null });
    expect(
      classifyRestFailure({ status: 429, body: errorEnvelope(429), tokenWasAttached: true, retryAfterHeader: '7' }),
    ).toMatchObject({ kind: 'rate-limited', retryAfterSeconds: 7 });
  });

  it('a network failure after a write is uncertain unless the write is idempotency-keyed', async () => {
    strapi.defaults.adapter = async (config) => {
      throw new AxiosError('timeout', 'ECONNABORTED', config);
    };

    const path = '/api/ops/schools/schooltest000000000000001/import-students/commit';
    const plain = await strapi.post(path, { csv: 'a,b\n1,2\n' }).catch((error: unknown) => error);
    expect(restFailureOf(plain)).toMatchObject({ kind: 'transport', uncertainWrite: true });

    const keyed = await strapi
      .post(path, { csv: 'a,b\n1,2\n' }, { headers: idempotencyHeaders('import-key-1') })
      .catch((error: unknown) => error);
    expect(restFailureOf(keyed)).toMatchObject({ kind: 'transport', uncertainWrite: false });
  });

  it('parses success bodies through the operation schema and rejects drift', () => {
    const state = parseDataEnvelope(schoolInvitationStateSchema, { data: VALID_STATE, meta: {} });
    expect(state.documentId).toBe(VALID_STATE.documentId);

    expect(() =>
      parseDataEnvelope(schoolInvitationStateSchema, { data: { ...VALID_STATE, revoked_links: 1 } }),
    ).toThrow(RestContractViolation);
    expect(() =>
      parseDataEnvelope(schoolInvitationStateSchema, '<html><body>gateway page</body></html>'),
    ).toThrow(RestContractViolation);
  });

  it('exposes the portal version and idempotency headers as typed helpers', () => {
    expect(portalVersionHeaders()).toEqual({ [OPS_PORTAL_VERSION_HEADER]: OPS_PORTAL_VERSION });
    expect(idempotencyHeaders('commit-1')).toEqual({ 'Idempotency-Key': 'commit-1' });
  });
});
