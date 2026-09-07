/**
 * OPS-008 — proves the ops-portal contract fixtures enforce the shared
 * contract shapes exactly and fail loudly when a prerequisite is missing.
 * Everything here runs in-process against schemas and pure functions; no
 * network calls are made. The helper is imported dynamically so this spec
 * also proves the module is import-safe under vitest.
 */
import { describe, expect, it } from 'vitest';
import {
  OPS_PORTAL_VERSION,
  OPS_PORTAL_VERSION_HEADER,
  schoolInvitationStateSchema,
} from '@schooltest/ops-contracts';

const VALID_STATE = {
  documentId: 'schooltest000000000000001',
  account_status: 'prospect',
  onboarding_status: 'not_started',
  contact_first_name: null,
  contact_last_name: null,
  contact_email: null,
};

const VALID_400 = {
  data: null,
  error: {
    status: 400,
    name: 'ValidationError',
    message: 'Name is required',
    details: { code: 'INVALID_FIELD', errors: [{ path: 'name', message: 'Name is required' }] },
  },
};

const load = () => import('../e2e/helpers/ops-portal');

describe('OPS-008 contract fixtures', () => {
  it('is import-safe under vitest and exposes the settled API', async () => {
    const mod = await load();
    expect(typeof mod.fixtureAuthContext).toBe('function');
    expect(typeof mod.expectOpsError).toBe('function');
    expect(typeof mod.expectOpsSuccess).toBe('function');
    expect(typeof mod.expectCrossSchoolDenied).toBe('function');
    expect(typeof mod.createOpsFixtureSchool).toBe('function');
    expect(mod.OPS_FIXTURE_ROLES.length).toBe(8);
  });

  it('exposes exactly the eight fixture identities, all unique', async () => {
    const { OPS_FIXTURE_ROLES } = await load();
    expect([...OPS_FIXTURE_ROLES]).toEqual([
      'ops', 'ops_support', 'teacher', 'school_admin',
      'parent', 'student', 'missing_token', 'invalid_token',
    ]);
    expect(new Set(OPS_FIXTURE_ROLES).size).toBe(OPS_FIXTURE_ROLES.length);
  });

  it('opsFixtureLabel is unique per call and worker-scoped', async () => {
    const { opsFixtureLabel } = await load();
    const labels = new Set(Array.from({ length: 500 }, () => opsFixtureLabel('probe')));
    expect(labels.size).toBe(500);
    for (const label of labels) expect(label.startsWith('probe w')).toBe(true);
  });

  it('opsFixtureLabel carries the worker index from TEST_WORKER_INDEX', async () => {
    const { opsFixtureLabel } = await load();
    const saved = process.env.TEST_WORKER_INDEX;
    process.env.TEST_WORKER_INDEX = '7';
    try {
      expect(opsFixtureLabel('probe')).toContain(' w7 ');
    } finally {
      if (saved === undefined) delete process.env.TEST_WORKER_INDEX;
      else process.env.TEST_WORKER_INDEX = saved;
    }
  });

  it('assertErrorEnvelopeForStatus accepts a well-formed envelope', async () => {
    const { assertErrorEnvelopeForStatus } = await load();
    const envelope = assertErrorEnvelopeForStatus(VALID_400, 400);
    expect(envelope.error.status).toBe(400);
  });

  it('assertErrorEnvelopeForStatus rejects status drift', async () => {
    const { assertErrorEnvelopeForStatus } = await load();
    expect(() => assertErrorEnvelopeForStatus(VALID_400, 500)).toThrow(/400.*500|500.*400/);
  });

  it('assertErrorEnvelopeForStatus rejects a non-envelope body', async () => {
    const { assertErrorEnvelopeForStatus } = await load();
    expect(() => assertErrorEnvelopeForStatus({ error: 'nope' }, 400)).toThrow(/error envelope/);
  });

  it('parseOpsEnvelope returns validated data', async () => {
    const { parseOpsEnvelope } = await load();
    const state = parseOpsEnvelope(schoolInvitationStateSchema, { data: VALID_STATE }, 'state');
    expect(state).toEqual(VALID_STATE);
  });

  it('parseOpsEnvelope rejects extra keys and names the label', async () => {
    const { parseOpsEnvelope } = await load();
    const body = { data: VALID_STATE, meta: {} };
    expect(() => parseOpsEnvelope(schoolInvitationStateSchema, body, 'state')).toThrow(/state/);
  });

  it('fixtureHeaders covers the token matrix', async () => {
    const { INVALID_TOKEN, fixtureHeaders } = await load();
    expect(fixtureHeaders('missing_token')).toEqual({
      [OPS_PORTAL_VERSION_HEADER]: OPS_PORTAL_VERSION,
    });
    expect(fixtureHeaders('invalid_token')).toEqual({
      [OPS_PORTAL_VERSION_HEADER]: OPS_PORTAL_VERSION,
      Authorization: `Bearer ${INVALID_TOKEN}`,
    });
    expect(() => fixtureHeaders('ops')).toThrow(/needs a live JWT/);
  });

  it('opsSupportCredentials throws naming both env vars when absent', async () => {
    const { OpsFixturePrerequisiteError, opsSupportCredentials } = await load();
    const email = process.env.E2E_OPS_SUPPORT_EMAIL;
    const password = process.env.E2E_OPS_SUPPORT_PASSWORD;
    delete process.env.E2E_OPS_SUPPORT_EMAIL;
    delete process.env.E2E_OPS_SUPPORT_PASSWORD;
    try {
      expect(() => opsSupportCredentials()).toThrow(OpsFixturePrerequisiteError);
      expect(() => opsSupportCredentials()).toThrow(/E2E_OPS_SUPPORT_EMAIL/);
      expect(() => opsSupportCredentials()).toThrow(/E2E_OPS_SUPPORT_PASSWORD/);
    } finally {
      if (email !== undefined) process.env.E2E_OPS_SUPPORT_EMAIL = email;
      if (password !== undefined) process.env.E2E_OPS_SUPPORT_PASSWORD = password;
    }
  });

  it('ledger validates documentIds and tracks entries', async () => {
    const { OpsFixtureLedger } = await load();
    const ledger = new OpsFixtureLedger();
    ledger.track('school', 'schooltest000000000001');
    expect(ledger.size).toBe(1);
    expect(() => ledger.track('user', 'has spaces')).toThrow(/ledger user/);
  });
});
