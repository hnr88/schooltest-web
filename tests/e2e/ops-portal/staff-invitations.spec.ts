/**
 * OPS-026 — the WEB half of C-OPS-PORTAL-016.
 *
 * Two things are proven here, both against real artefacts:
 *  1. The web boundary's contract. The typed query hook parses every response
 *     through `staffInvitationsResponseSchema`, so this suite drives the SAME
 *     module over the SAME running API the browser talks to — a drifted body,
 *     a leaked `token` or an invented total fails the parse rather than
 *     rendering as a plausible list.
 *  2. The pictured semantics. The status palette and the "Invited N days ago"
 *     subtitle are asserted against the UNMODIFIED `mvp/ops/Ops Portal.dc.html`,
 *     which is the visual authority — not against a screenshot that a later
 *     wholesale snapshot update could quietly bless.
 *
 * The shared module is imported from the installed `@schooltest/ops-contracts`
 * package — the same specifier the query hook uses — so this suite and the app
 * cannot be asserting two different definitions.
 *
 * NOT asserted here, honestly: a screenshot of the rendered invitation rows.
 * `OpsSchoolTables.tsx` is owned by OPS-025 (its acceptance criterion is the
 * user/invitation union with a discriminated `user:`/`invitation:` identity), so
 * the dialog's mount lands in that slice. Capturing the tab today would be a
 * picture of a surface this task has not yet been merged into.
 */
import { readFileSync } from 'node:fs';
import path from 'node:path';

import { expect, test } from '@playwright/test';

import {
  legacyStaffInvitationsResponseSchema,
  resolveStaffInvitationStatus,
  staffInvitationDisplayName,
  staffInvitationHasUserAccount,
  staffInvitationInvitedDaysAgo,
  staffInvitationsResponseSchema,
  staffRowId,
  StaffInvitationsOperation,
} from '@schooltest/ops-contracts';
import { staffInvitationTone } from '@/modules/ops/lib/ops-staff-invitations.helpers';

import { expectOpsError, fixtureAuthContext, fixtureHeaders } from '../helpers/ops-portal';

const API_BASE_URL =
  process.env.E2E_API_BASE_URL ?? process.env.NEXT_PUBLIC_API_BASE_URL ?? 'http://127.0.0.1:5500';

const REFERENCE_HTML = path.resolve(__dirname, '../../../../mvp/ops/Ops Portal.dc.html');

const INVITATIONS_URL = `${API_BASE_URL}${StaffInvitationsOperation.path}`;

async function opsHeaders(request: import('@playwright/test').APIRequestContext) {
  const context = await fixtureAuthContext(request, 'ops');
  return fixtureHeaders('ops', context.jwt ?? undefined);
}

test('the portal read parses through the exact schema the query hook uses', async ({ request }) => {
  const res = await request.get(INVITATIONS_URL, {
    headers: await opsHeaders(request),
    params: { pageSize: 200 },
  });
  expect(res.status(), await res.text()).toBe(StaffInvitationsOperation.success);

  const body = await res.json();
  const parsed = staffInvitationsResponseSchema.safeParse(body);
  expect(parsed.success ? [] : parsed.error.issues, 'body must match the shared schema').toEqual([]);
  if (!parsed.success) throw new Error('unreachable — asserted above');

  const nowMs = Date.now();
  for (const row of parsed.data.data) {
    // No secret ever reaches the client: the strict schema rejects `token`, and
    // the row the UI renders carries only contracted keys.
    expect(Object.keys(row)).not.toContain('token');
    // display_name is the single pictured input, never the email address.
    expect(row.display_name).toBe(
      staffInvitationDisplayName(row.first_name, row.last_name),
    );
    // A pending row the clock has passed must already read `expired`.
    if (row.status === 'invited') {
      expect(resolveStaffInvitationStatus('invited', row.expires_at, nowMs)).toBe('invited');
    }
    expect(staffRowId({ kind: 'invitation', documentId: row.documentId })).toBe(
      `invitation:${row.documentId}`,
    );
  }
  // The filtered total describes the filtered rows, never a user-directory count.
  expect(parsed.data.meta.pagination.total).toBeGreaterThanOrEqual(parsed.data.data.length);
});

test('an unversioned read keeps the legacy shape the old client parses', async ({ request }) => {
  const headers = await opsHeaders(request);
  delete headers['X-Ops-Portal-Version'];
  const res = await request.get(INVITATIONS_URL, { headers, params: { pageSize: 200 } });
  expect(res.status()).toBe(200);
  const parsed = legacyStaffInvitationsResponseSchema.safeParse(await res.json());
  expect(parsed.success ? [] : parsed.error.issues, 'legacy shape must be preserved').toEqual([]);
});

test('the role filter round-trips from the web boundary', async ({ request }) => {
  const headers = await opsHeaders(request);
  for (const role of ['school_admin', 'teacher'] as const) {
    const res = await request.get(INVITATIONS_URL, { headers, params: { role, pageSize: 200 } });
    expect(res.status(), await res.text()).toBe(200);
    const parsed = staffInvitationsResponseSchema.parse(await res.json());
    for (const row of parsed.data) expect(row.role).toBe(role);
  }

  const rejected = await request.get(INVITATIONS_URL, { headers, params: { role: 'owner' } });
  await expectOpsError(rejected, 400);
});

test('the browser-facing failures are distinguishable: 403 missing, 401 invalid', async ({
  request,
}) => {
  const missing = await request.get(INVITATIONS_URL, { headers: fixtureHeaders('missing_token') });
  await expectOpsError(missing, 403);

  const invalid = await request.get(INVITATIONS_URL, { headers: fixtureHeaders('invalid_token') });
  await expectOpsError(invalid, 401);

  const teacher = await fixtureAuthContext(request, 'teacher');
  const wrongRole = await request.get(INVITATIONS_URL, {
    headers: fixtureHeaders('teacher', teacher.jwt ?? undefined),
  });
  await expectOpsError(wrongRole, 403);
});

test('the status palette matches the unmodified reference HTML', () => {
  const html = readFileSync(REFERENCE_HTML, 'utf8');
  // statusStyle() in the authority: the exact fg/bg pairs the pills must use.
  const pairs: Record<string, string> = {
    Invited: "'Invited': { fg: '#92610B', bg: '#FDF3E0' }",
    Active: "'Active': { fg: '#0E7C66', bg: '#E1F5EF' }",
    Suspended: "'Suspended': { fg: '#B42318', bg: '#FDEEEC' }",
    Archived: "'Archived': { fg: '#7C8698', bg: '#F1F3F7' }",
  };
  for (const source of Object.values(pairs)) expect(html).toContain(source);

  // The four contract statuses map onto those four pictured pairs: an accepted
  // invitation reads as the Active green, a revoked one as the Suspended red, a
  // lapsed one as the Archived grey, and a live one as the amber Invited pill.
  expect(staffInvitationTone('invited')).toBe('warning');
  expect(staffInvitationTone('accepted')).toBe('success');
  expect(staffInvitationTone('revoked')).toBe('danger');
  expect(staffInvitationTone('expired')).toBe('neutral');
  expect(staffInvitationTone(null)).toBe('neutral');
});

test('the pictured subtitle age is computed from invited_at, never from expiry', () => {
  const html = readFileSync(REFERENCE_HTML, 'utf8');
  expect(html).toContain("seen: 'Invited 3 days ago'");
  expect(html).toContain("seen: 'Invited 6 days ago'");

  const now = Date.parse('2026-09-05T12:00:00.000Z');
  const invitedAt = '2026-09-02T12:00:00.000Z';
  const expiresAt = '2026-09-16T12:00:00.000Z';
  expect(staffInvitationInvitedDaysAgo(invitedAt, now)).toBe(3);
  // Substituting expires_at is the defect this pins: it is in the FUTURE, so the
  // subtitle would clamp to "today" for every pending invitation.
  expect(staffInvitationInvitedDaysAgo(expiresAt, now)).toBe(0);
  // An old row with no recorded creation instant renders "unknown", not 0 days.
  expect(staffInvitationInvitedDaysAgo(null, now)).toBeNull();
});

test('an accepted invitation is history, not a second active person', () => {
  expect(staffInvitationHasUserAccount('accepted')).toBe(true);
  for (const status of ['invited', 'expired', 'revoked', null] as const) {
    expect(staffInvitationHasUserAccount(status)).toBe(false);
  }
});
