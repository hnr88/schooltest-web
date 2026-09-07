/**
 * OPS-006 — the client half of the shared-contract proof.
 *
 * Runs the same assertions as
 * schooltest-api/tests/unit/ops-portal-shared-contracts.spec.ts against the
 * same @schooltest/ops-contracts symbols. If the two halves ever disagree, a
 * shape has drifted between server and client — which is the exact defect this
 * package exists to prevent.
 *
 * It also guards the browser-safety rule: this package is bundled into client
 * code, so it must never pull in a server-only module.
 */
import { describe, expect, it } from 'vitest';

import {
  OPS_PORTAL_VERSION,
  OPS_PORTAL_VERSION_HEADER,
  OnboardingReadOperation,
  OnboardingSendOperation,
  dataEnvelope,
  documentIdSchema,
  errorEnvelopeSchema,
  isErrorEnvelopeForStatus,
  onboardingInviteBodySchema,
  onboardingLinkResultSchema,
  revokeInvitationResultSchema,
  schoolInvitationStateSchema,
} from '@schooltest/ops-contracts';

const VALID_TOKEN = 'a'.repeat(64);

const VALID_STATE = {
  documentId: 'schooltest000000000000001',
  account_status: 'prospect',
  onboarding_status: 'not_started',
  contact_first_name: null,
  contact_last_name: null,
  contact_email: null,
};

describe('OPS-006 shared contract package (web consumer)', () => {
  it('documentId accepts a Strapi v5 id and rejects malformed ids', () => {
    expect(documentIdSchema.safeParse('schooltest000000000000001').success).toBe(true);
    expect(documentIdSchema.safeParse('').success).toBe(false);
    expect(documentIdSchema.safeParse('has spaces').success).toBe(false);
  });

  it('invite body is strict: a server-owned field cannot be smuggled from the browser', () => {
    const valid = { first_name: 'Joanne', last_name: 'Nguyen', contact_email: 'ops@example.edu.au' };
    expect(onboardingInviteBodySchema.safeParse(valid).success).toBe(true);
    expect(onboardingInviteBodySchema.safeParse({ ...valid, account_status: 'active' }).success).toBe(
      false,
    );
  });

  it('invite body trims padding, so a padded form field is accepted not rejected', () => {
    const parsed = onboardingInviteBodySchema.parse({
      first_name: '  Joanne  ',
      last_name: '  Nguyen  ',
      contact_email: '  ops@example.edu.au  ',
    });
    expect(parsed.first_name).toBe('Joanne');
    expect(parsed.contact_email).toBe('ops@example.edu.au');
  });

  it('link result pins expires_at to null', () => {
    const base = {
      token: VALID_TOKEN,
      url: 'https://example.test/onboard/x',
      expires_at: null,
      contact: { first_name: 'A', last_name: 'B', email: 'a@b.test' },
    };
    expect(onboardingLinkResultSchema.safeParse(base).success).toBe(true);
    expect(
      onboardingLinkResultSchema.safeParse({ ...base, expires_at: '2026-01-01T00:00:00Z' }).success,
    ).toBe(false);
  });

  it('invitation state is exactly six keys — the UI can never render a leaked token', () => {
    expect(schoolInvitationStateSchema.safeParse(VALID_STATE).success).toBe(true);
    expect(schoolInvitationStateSchema.safeParse({ ...VALID_STATE, id: 7 }).success).toBe(false);
    expect(schoolInvitationStateSchema.safeParse({ ...VALID_STATE, token: VALID_TOKEN }).success).toBe(
      false,
    );
  });

  it('revoked_links may be 0 but never negative', () => {
    const base = {
      documentId: 'schooltest000000000000001',
      account_status: 'prospect' as const,
      onboarding_status: 'not_started' as const,
      revoked_links: 0,
    };
    expect(revokeInvitationResultSchema.safeParse(base).success).toBe(true);
    expect(revokeInvitationResultSchema.safeParse({ ...base, revoked_links: -1 }).success).toBe(false);
  });

  it('error envelope requires error.status to equal the HTTP status', () => {
    const body = {
      data: null,
      error: {
        status: 400,
        name: 'ValidationError',
        message: 'Name is required',
        details: { code: 'INVALID_FIELD', errors: [{ path: 'name', message: 'Name is required' }] },
      },
    };
    expect(errorEnvelopeSchema.safeParse(body).success).toBe(true);
    expect(isErrorEnvelopeForStatus(body, 400)).toBe(true);
    expect(isErrorEnvelopeForStatus(body, 500)).toBe(false);
  });

  it('success envelope is strict', () => {
    const envelope = dataEnvelope(schoolInvitationStateSchema);
    expect(envelope.safeParse({ data: VALID_STATE }).success).toBe(true);
    expect(envelope.safeParse({ data: VALID_STATE, meta: {} }).success).toBe(false);
  });

  it('operations carry their exact status codes', () => {
    expect(OnboardingReadOperation.contractId).toBe('C-OPS-PORTAL-011');
    expect(OnboardingReadOperation.success).toBe(200);
    expect(OnboardingSendOperation.contractId).toBe('C-OPS-PORTAL-012');
    expect(OnboardingSendOperation.success).toBe(201);
    expect(OnboardingSendOperation.errors).toContain(409);
  });

  it('exposes the portal version header both sides must agree on', () => {
    expect(OPS_PORTAL_VERSION_HEADER).toBe('X-Ops-Portal-Version');
    expect(OPS_PORTAL_VERSION).toBe('1');
  });

  it('is browser-safe: pulls in no server-only module', async () => {
    // Importing in a jsdom environment would throw if the package reached for
    // node:fs, Strapi, or any other server-only dependency.
    const mod = await import('@schooltest/ops-contracts');
    expect(Object.keys(mod).length).toBeGreaterThan(0);
    expect(typeof mod.dataEnvelope).toBe('function');
  });
});
