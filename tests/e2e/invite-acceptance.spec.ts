/**
 * GAP-B16 (T-B.md) — the /invite/<token> golden path, end to end through the
 * real UI against the real API and Postgres. The invitation SURFACE is well
 * covered elsewhere (auth-revocation.spec.ts pins the negative paths on the
 * API side; revocation.spec.ts pins the revoked-token screen here), but the
 * positive acceptance flow had no web e2e: visit → see who/where/role →
 * activate → signed in → landed on the role's own dashboard.
 *
 * Everything is real: the invitation is minted through the school-admin
 * contract (never a UI form, rule 40), the token is read out of Postgres with
 * psql, the form is driven as a user drives it, and the landing is proven by
 * CONTENT (each role's dashboard carries its own copy), never by URL alone —
 * /dashboard/teach would 404-shape identically to a redirect bug, and a bare
 * waitForURL proves nothing about what rendered.
 *
 * Runs against the live stack: web on E2E_PORT (export E2E_PORT=3000; the
 * marketing site hazard does not apply — these ARE schooltest-web specs), API
 * on :5500, Postgres on :5540.
 */
import { execFileSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import path from 'node:path';

import { expect, test } from '@playwright/test';

import { cat, loadMessages } from './helpers/i18n';

const en = loadMessages('en');

/** Read one value from schooltest-api/.env (DATABASE_*, SEED_*). */
function apiEnv(key: string): string {
  const file = path.resolve(process.cwd(), '..', 'schooltest-api', '.env');
  for (const line of readFileSync(file, 'utf8').split('\n')) {
    const match = line.match(/^([A-Z0-9_]+)=(.*)$/);
    if (match && match[1] === key) return match[2].replace(/^(['"])(.*)\1$/, '$2');
  }
  throw new Error(`[e2e] ${key} missing from schooltest-api/.env`);
}

/** One SQL scalar through psql against the dev database (reads only). */
function runSql(sql: string): string {
  return execFileSync(
    'psql',
    [
      '-h', apiEnv('DATABASE_HOST'),
      '-p', apiEnv('DATABASE_PORT'),
      '-U', apiEnv('DATABASE_USERNAME'),
      '-d', apiEnv('DATABASE_NAME'),
      '-t', '-A', '-c', sql,
    ],
    { env: { ...process.env, PGPASSWORD: apiEnv('DATABASE_PASSWORD') }, encoding: 'utf8' },
  ).trim();
}

const API_BASE = 'http://127.0.0.1:5500';

/** A live school-admin bearer (seeded account, seeded password). */
async function schoolAdminJwt(request: import('@playwright/test').APIRequestContext): Promise<string> {
  const res = await request.post(`${API_BASE}/api/auth/local`, {
    data: {
      identifier: 'schooladmin-a@schooltest.local',
      password: apiEnv('SEED_SCHOOLADMIN_A_PASSWORD'),
    },
  });
  expect(res.status(), `school-admin login: ${await res.text()}`).toBe(200);
  return ((await res.json()) as { jwt: string }).jwt;
}

/** Mint one staff invitation through the school-admin contract; return its token. */
async function mintInvitation(
  request: import('@playwright/test').APIRequestContext,
  role: 'teacher' | 'school_admin',
): Promise<{ token: string; email: string }> {
  const email = `e2e-b16-${role}-${Date.now()}@schooltest.local`;
  const jwt = await schoolAdminJwt(request);
  const res = await request.post(`${API_BASE}/api/schools/me/invitations`, {
    headers: { Authorization: `Bearer ${jwt}` },
    data: { email, first_name: 'Invitee', last_name: 'E2E', role },
  });
  expect(res.status(), `invitation create: ${await res.text()}`).toBe(201);
  const documentId = ((await res.json()) as { data: { documentId: string } }).data.documentId;
  const token = runSql(`select token from invitations where document_id='${documentId}'`);
  expect(token, 'invitation token row').not.toBe('');
  return { token, email };
}

test.describe('GAP-B16 — invite acceptance golden path (/invite/<token>)', () => {
  test('a teacher invitee activates through the UI and lands signed in on their dashboard', async ({
    page,
    request,
  }) => {
    const { token, email } = await mintInvitation(request, 'teacher');

    await page.goto(`/invite/${token}`);

    // The screen states WHO was invited, WHERE, in WHICH role — by content.
    // The badge slot is the discriminator: the role word alone also appears
    // inside the invitee's email address in the welcome body below it.
    await expect(
      page.locator('[data-slot="badge"]', { hasText: cat(en, 'Invite.roles.teacher') }),
    ).toBeVisible({ timeout: 20_000 });
    await expect(page.getByText(email)).toBeVisible();
    await expect(
      page.getByRole('heading', { name: new RegExp(cat(en, 'Invite.welcomeTitle').replace('{school}', '.*')) }),
    ).toBeVisible();

    // Names arrive prefilled from the invitation; only the password is typed.
    const password = 'Invitee1!Abcd';
    await page.locator('#invite-password').fill(password);
    await page.locator('#invite-confirm-password').fill(password);
    await page.getByRole('button', { name: cat(en, 'Invite.form.submit') }).click();

    // Landed, signed in, on the TEACHER surface — proven by the sidebar user
    // menu's role chip (same pattern as teacher-sidebar.spec.ts) plus the rail
    // itself, never by URL alone.
    await expect(
      page
        .locator('[data-slot="sidebar"]')
        .getByRole('button', { name: cat(en, 'Shell.topbar.userMenuLabel') }),
    ).toBeVisible({ timeout: 20_000 });
    await expect(page.locator('[data-slot="sidebar"]')).toBeVisible();

    // The account is real: the seeded credential works against the live API.
    const login = await request.post(`${API_BASE}/api/auth/local`, {
      data: { identifier: email, password },
    });
    expect(login.status(), 'activated account can sign in via /api/auth/local').toBe(200);
  });

  test('the invitation contract refuses a second active school administrator (409)', async ({
    request,
  }) => {
    // Product rule, enforced at the contract: ONE active school_admin per
    // school. The seeded school already carries its admin, so a second
    // school_admin invitation must be refused with 409 — and this is also why
    // the /invite school-admin ACCEPTANCE leg is not mintable on a seeded
    // school: that flow is exercised end to end by the ops onboarding-link
    // specs (web 018 + the api's school-onboarding-invitation* family), which
    // create the FIRST admin of a FRESH school. Teacher invitations (the leg
    // above) are unlimited, which is why the golden path rides a teacher.
    const email = `e2e-b16-admin-${Date.now()}@schooltest.local`;
    const jwt = await schoolAdminJwt(request);
    const res = await request.post(`${API_BASE}/api/schools/me/invitations`, {
      headers: { Authorization: `Bearer ${jwt}` },
      data: { email, first_name: 'Invitee', last_name: 'E2E', role: 'school_admin' },
    });
    expect(res.status()).toBe(409);
    const body = (await res.json()) as { error: { name: string; message: string } };
    expect(body.error.name).toBe('ConflictError');
    expect(body.error.message).toContain('already has an active school administrator');
  });
});
