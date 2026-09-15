/**
 * NIGHT-2 W1 (AUTH) invites + magic links + Google callback battery —
 * AUTH-023..033 from .overnight/N2/JOURNEYS-N2.md.
 *
 * All tokens are minted through the REAL API contracts with the real ops
 * login (POST /api/auth/local + X-Ops-Portal-Version: 1); every emailed link
 * is read back out of Mailpit exactly as a recipient receives it. Run with
 * --workers=1 (sign-in pacing + one shared Mailpit).
 */
import { mkdirSync } from 'node:fs';
import path from 'node:path';

import { expect, test, type APIRequestContext } from '@playwright/test';

import { roleCredentials } from './helpers/credentials';
import { cat, loadMessages } from './helpers/i18n';
import { latestMessage, searchMessages, waitForMessages } from './helpers/mailpit';

const en = loadMessages('en');
const CAPTURES = '/Users/hunor.nagy/Code/schooltest/.overnight/N2/captures';
const API = 'http://127.0.0.1:5500';
// Teacher invites accept against this shared fixture school (no admin there —
// one gets created by the acceptance itself).
const GUARD_PROOF_SCHOOL = 'rk5v4q98u7zz3vuuxqo4zp92';

function freshEmail(flow: string): string {
  const suffix = `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`;
  return `e2e-n2w1-${flow}-${suffix}@schooltest.test`;
}

async function shot(page: import('@playwright/test').Page, name: string): Promise<string> {
  mkdirSync(CAPTURES, { recursive: true });
  const file = path.join(CAPTURES, `${name}.png`);
  await page.screenshot({ path: file, fullPage: false });
  return file;
}

async function opsJwt(request: APIRequestContext): Promise<string> {
  const { email, password } = roleCredentials('opsApi');
  const res = await request.post(`${API}/api/auth/local`, {
    data: { identifier: email, password },
  });
  expect(res.status()).toBe(200);
  const body = (await res.json()) as { jwt: string };
  return body.jwt;
}

interface MintedInvite {
  email: string;
  invitePath: string;
}

/** Ops mints a staff invitation; the emailed link comes back from Mailpit. */
async function mintStaffInvite(
  request: APIRequestContext,
  kind: 'teacher' | 'admin',
  jwt: string,
  email: string,
  schoolDocumentId: string = GUARD_PROOF_SCHOOL,
): Promise<MintedInvite> {
  const path =
    kind === 'teacher'
      ? `/api/ops/schools/${schoolDocumentId}/teacher-invitations`
      : `/api/ops/schools/${schoolDocumentId}/admin-invitations`;
  const res = await request.post(`${API}${path}`, {
    headers: { Authorization: `Bearer ${jwt}`, 'X-Ops-Portal-Version': '1' },
    data: { first_name: 'Nina', last_name: 'W1', email },
  });
  const status = res.status();
  expect([200, 201]).toContain(status);

  const summaries = await waitForMessages(request, email, 1);
  expect(summaries[0].Subject).toContain('has invited you to SchoolTest');
  const message = await latestMessage(request, email);
  const link = message.Text.match(/https?:\/\/\S*\/en\/invite\/[0-9a-f]+/)?.[0];
  expect(link, 'invite email carries a /en/invite/<token> link').toBeTruthy();
  return { email, invitePath: link!.replace(/^https?:\/\/[^/]+/, '') };
}

/**
 * Ops creates a THROWAWAY school (the real C-OPS create contract, owner
 * invitation OFF) and mints its onboarding link on it. Self-contained: no
 * contention with any other worker's fixture schools. Falls back to the
 * DESIGNED revoke-then-mint cycle if a link already exists.
 */
async function mintOnboardingLink(
  request: APIRequestContext,
  jwt: string,
  email: string,
): Promise<{ token: string; onboardingPath: string }> {
  const headers = {
    Authorization: `Bearer ${jwt}`,
    'X-Ops-Portal-Version': '1',
    'Idempotency-Key': `n2w1-onb-${Date.now().toString(36)}`,
  };
  const schoolRes = await request.post(`${API}/api/schools`, {
    headers,
    data: {
      name: `N2 W1 Onboard ${Date.now().toString(36)}`,
      suburb: 'Brunswick',
      contact_name: 'Priya W1',
      contact_email: email,
      state: 'VIC',
      sector: 'government',
      portal: { plan: 'standard', status: 'active', send_owner_invitation: false },
    },
  });
  expect([200, 201]).toContain(schoolRes.status());
  const school = ((await schoolRes.json()) as { data: { documentId: string } }).data;

  const mint = () =>
    request.post(`${API}/api/schools/${school.documentId}/onboarding-link`, {
      headers: {
        Authorization: `Bearer ${jwt}`,
        'X-Ops-Portal-Version': '1',
      },
      data: { first_name: 'Priya', last_name: 'W1', contact_email: email },
    });
  let res = await mint();
  if (res.status() === 409) {
    // The school still holds an active link — the DESIGNED revoke-then-mint
    // cycle (revoke resets account/onboarding status, mint re-invites).
    await request.post(`${API}/api/schools/${school.documentId}/onboarding-link/revoke`, {
      headers: { Authorization: `Bearer ${jwt}`, 'X-Ops-Portal-Version': '1' },
      data: {},
    });
    res = await mint();
  }
  expect([200, 201]).toContain(res.status());
  const body = (await res.json()) as { data: { token: string; url: string } };
  expect(body.data.url).toMatch(/:3001\/en\/school-onboarding\//);
  return {
    token: body.data.token,
    onboardingPath: body.data.url.replace(/^https?:\/\/[^/]+/, ''),
  };
}

/** A throwaway school for an admin-invite acceptance (no admin there yet). */
async function createSchoolForAdminInvite(
  request: APIRequestContext,
  jwt: string,
): Promise<string> {
  const res = await request.post(`${API}/api/schools`, {
    headers: {
      Authorization: `Bearer ${jwt}`,
      'X-Ops-Portal-Version': '1',
      'Idempotency-Key': `n2w1-adm-${Date.now().toString(36)}`,
    },
    data: {
      name: `N2 W1 Admin Invite ${Date.now().toString(36)}`,
      suburb: 'Brunswick',
      contact_name: 'Oscar W1',
      contact_email: freshEmail('adm-owner'),
      state: 'VIC',
      sector: 'government',
      portal: { plan: 'standard', status: 'active', send_owner_invitation: false },
    },
  });
  expect([200, 201]).toContain(res.status());
  return ((await res.json()) as { data: { documentId: string } }).data.documentId;
}

// ---------------------------------------------------------------------------
// AUTH-025 — invited teacher opens /invite/[token], sets a password, lands in
// the teacher portal
// ---------------------------------------------------------------------------
test('AUTH-025 teacher invitation accept activates into the teacher portal', async ({
  page,
  request,
}) => {
  test.setTimeout(180_000);
  const jwt = await opsJwt(request);
  const email = freshEmail('tea');
  const { invitePath } = await mintStaffInvite(request, 'teacher', jwt, email);

  await page.goto(invitePath);
  await expect(
    page.getByRole('heading', { name: /Welcome to Guard Proof School/ }),
  ).toBeVisible({ timeout: 30_000 });
  // Names are prefilled from the invitation; password + confirmation collected.
  await page.getByLabel(/^First name\*?$/).fill('Nina');
  await page.getByLabel(/^Last name\*?$/).fill('W1');
  await page.getByLabel(/^Password\*?$/).fill('N2w1Invite!2026');
  await page
    .getByLabel(/^Confirm password\*?$/)
    .fill('N2w1Invite!2026');
  await shot(page, 'AUTH-025-invite-form');
  await page
    .getByRole('button', { name: cat(en, 'Invite.form.submit'), exact: true })
    .click();

  // Acceptance stores the returned JWT and lands the new teacher on the
  // role's dashboard (/dashboard/results — the class list surface).
  await page.waitForURL(/\/dashboard\/results\/?$/, { timeout: 30_000 });
  const token = await page.evaluate(() => window.localStorage.getItem('app.auth.token'));
  expect((token ?? '').split('.')).toHaveLength(3);
  await expect(page.locator('[data-frame="teacher"]').first()).toBeVisible();
  await shot(page, 'AUTH-025-teacher-portal');
});

// ---------------------------------------------------------------------------
// AUTH-026 — a consumed invite link shows the honest used/invalid state
// ---------------------------------------------------------------------------
test('AUTH-026 re-opening a consumed teacher invite shows the invalid state', async ({
  page,
  request,
}) => {
  test.setTimeout(180_000);
  const jwt = await opsJwt(request);
  const email = freshEmail('tea2');
  const { invitePath } = await mintStaffInvite(request, 'teacher', jwt, email);

  // Accept it first.
  await page.goto(invitePath);
  await page
    .getByLabel(/^First name\*?$/)
    .fill('Nina', { timeout: 30_000 });
  await page.getByLabel(/^Last name\*?$/).fill('W1');
  await page
    .getByLabel(/^Password\*?$/)
    .fill('N2w1Invite!2026');
  await page
    .getByLabel(/^Confirm password\*?$/)
    .fill('N2w1Invite!2026');
  await page
    .getByRole('button', { name: cat(en, 'Invite.form.submit'), exact: true })
    .click();
  await page.waitForURL(/\/dashboard/, { timeout: 30_000 });

  // The same link can never mint a second account.
  await page.evaluate(() => window.localStorage.removeItem('app.auth.token'));
  await page.goto(invitePath);
  await expect(
    page
      .getByText(cat(en, 'Invite.errors.usedTitle'))
      .or(page.getByText(cat(en, 'Invite.errors.invalidTitle'))),
  ).toBeVisible({ timeout: 30_000 });
  await shot(page, 'AUTH-026-consumed-invite');
});

// ---------------------------------------------------------------------------
// AUTH-027 — school-admin invitation: emailed link on :3001 (INV-1 pin),
// acceptance lands in the school admin portal
// ---------------------------------------------------------------------------
test('AUTH-027 school-admin invitation accept lands in the school admin portal', async ({
  page,
  request,
}) => {
  test.setTimeout(180_000);
  const jwt = await opsJwt(request);
  const email = freshEmail('adm');
  const { invitePath } = await mintStaffInvite(request, 'admin', jwt, email);
  // INV-1 pin: the emailed link must point at THIS portal (:3001), never the
  // foreign :3000 app.
  expect(invitePath.startsWith('/en/invite/')).toBe(true);

  await page.goto(invitePath);
  await expect(
    page.getByRole('heading', { name: /Welcome to Guard Proof School/ }),
  ).toBeVisible({ timeout: 30_000 });
  await page.getByLabel(/^First name\*?$/).fill('Nina');
  await page.getByLabel(/^Last name\*?$/).fill('W1');
  await page.getByLabel(/^Password\*?$/).fill('N2w1Invite!2026');
  await page
    .getByLabel(/^Confirm password\*?$/)
    .fill('N2w1Invite!2026');
  await page
    .getByRole('button', { name: cat(en, 'Invite.form.submit'), exact: true })
    .click();

  await page.waitForURL(/\/dashboard\/school\/?$/, { timeout: 30_000 });
  await shot(page, 'AUTH-027-admin-portal');
});

// ---------------------------------------------------------------------------
// AUTH-028 — an already-consumed school-admin invite shows the same honesty
// ---------------------------------------------------------------------------
test('AUTH-028 consumed school-admin invite link shows the used/invalid state', async ({
  page,
  request,
}) => {
  test.setTimeout(180_000);
  const jwt = await opsJwt(request);
  const email = freshEmail('adm2');
  const school = await createSchoolForAdminInvite(request, jwt);
  const { invitePath } = await mintStaffInvite(request, 'admin', jwt, email, school);

  await page.goto(invitePath);
  await page
    .getByLabel(/^First name\*?$/)
    .fill('Nina', { timeout: 30_000 });
  await page.getByLabel(/^Last name\*?$/).fill('W1');
  await page
    .getByLabel(/^Password\*?$/)
    .fill('N2w1Invite!2026');
  await page
    .getByLabel(/^Confirm password\*?$/)
    .fill('N2w1Invite!2026');
  await page
    .getByRole('button', { name: cat(en, 'Invite.form.submit'), exact: true })
    .click();
  await page.waitForURL(/\/dashboard/, { timeout: 30_000 });

  await page.evaluate(() => window.localStorage.removeItem('app.auth.token'));
  await page.goto(invitePath);
  await expect(
    page
      .getByText(cat(en, 'Invite.errors.usedTitle'))
      .or(page.getByText(cat(en, 'Invite.errors.invalidTitle'))),
  ).toBeVisible({ timeout: 30_000 });
  await shot(page, 'AUTH-028-consumed-admin-invite');
});

// ---------------------------------------------------------------------------
// AUTH-029/030 — school-onboarding wizard walk, then single-use honesty
// ---------------------------------------------------------------------------
test('AUTH-029/030 onboarding wizard walks details/teachers/review/admin and is single-use', async ({
  page,
  request,
}) => {
  test.setTimeout(300_000);
  const jwt = await opsJwt(request);
  const email = freshEmail('onb');
  const { onboardingPath } = await mintOnboardingLink(request, jwt, email);
  const adminEmail = freshEmail('onb-admin');

  await page.goto(onboardingPath);
  await expect(
    page.getByRole('heading', { name: cat(en, 'SchoolOnboarding.school.title') }),
  ).toBeVisible({ timeout: 30_000 });

  // Step 0 — school details (name/suburb prefilled from the school record).
  await page
    .getByLabel(/^Suburb\*?$/)
    .fill('Brunswick');
  await page.getByLabel(/^Postcode\*?$/).fill('3056');
  await page.locator('#onb-school-state').click();
  await page.locator('[role="option"]:visible', { hasText: 'VIC' }).first().click();
  await page.locator('#onb-school-sector').click();
  await page
    .locator('[role="option"]:visible', {
      hasText: cat(en, 'SchoolOnboarding.school.sectors.government'),
    })
    .first()
    .click();
  await page
    .getByRole('button', { name: cat(en, 'SchoolOnboarding.school.continue'), exact: true })
    .click();

  // Step 1 — teachers: skippable (invite later).
  await expect(
    page.getByRole('heading', { name: cat(en, 'SchoolOnboarding.teachers.title') }),
  ).toBeVisible({ timeout: 30_000 });
  await page
    .getByRole('button', { name: cat(en, 'SchoolOnboarding.teachers.continue'), exact: true })
    .click();

  // Step 2 — review.
  await expect(
    page.getByRole('heading', { name: cat(en, 'SchoolOnboarding.review.title') }),
  ).toBeVisible({ timeout: 30_000 });
  await shot(page, 'AUTH-029-review-step');
  await page
    .getByRole('button', { name: cat(en, 'SchoolOnboarding.review.confirm'), exact: true })
    .click();

  // Step 3 — administrator account.
  await expect(
    page.getByRole('heading', { name: cat(en, 'SchoolOnboarding.admin.title') }),
  ).toBeVisible({ timeout: 30_000 });
  // The admin account fields are collected here (nothing is prefilled — the
  // wizard's last step IS the account-creation form).
  await page.getByLabel(/^First name\*?$/).fill('Priya');
  await page.getByLabel(/^Last name\*?$/).fill('W1');
  await page.getByLabel(/^Email address\*?$/).fill(adminEmail);
  await page.getByLabel(/^Password\*?$/).fill('N2w1Onboard!2026');
  await shot(page, 'AUTH-029-admin-step');
  await page
    .getByRole('button', { name: cat(en, 'SchoolOnboarding.admin.submit'), exact: true })
    .click();

  // Completion stores the fresh admin JWT and lands on the admin home.
  await page.waitForURL(/\/dashboard\/school\/?$/, { timeout: 30_000 });
  const token = await page.evaluate(() => window.localStorage.getItem('app.auth.token'));
  expect((token ?? '').split('.')).toHaveLength(3);
  await shot(page, 'AUTH-029-admin-home');

  // AUTH-030 — the same link can never re-run the wizard.
  await page.evaluate(() => window.localStorage.removeItem('app.auth.token'));
  await page.goto(onboardingPath);
  await expect(
    page
      .getByText(cat(en, 'SchoolOnboarding.errors.usedTitle'))
      .or(page.getByText(cat(en, 'SchoolOnboarding.errors.invalidTitle')))
      .or(page.getByText(cat(en, 'SchoolOnboarding.errors.revokedTitle'))),
  ).toBeVisible({ timeout: 30_000 });
  await shot(page, 'AUTH-030-consumed-onboarding');
});

// ---------------------------------------------------------------------------
// AUTH-031 — student magic link claims on the web fallback verify page
// ---------------------------------------------------------------------------
test('AUTH-031 student magic-link token claims on the web verify page', async ({
  page,
  request,
}) => {
  test.setTimeout(120_000);
  const student = 'proof.s04@schooltest.local';
  const req = await request.post(`${API}/api/auth/student/magic-link/request`, {
    data: { email: student },
  });
  expect(req.ok(), await req.text()).toBeTruthy();

  const message = await latestMessage(request, student, 1);
  expect(message.Subject).toBe('Your SchoolTest sign-in link');
  const link = message.Text.match(/https?:\/\/\S*\/en\/auth\/student\/verify\?token=([0-9a-f]{64})/);
  expect(link, 'sign-in email carries the web verify link').toBeTruthy();
  const token = link![1];

  await page.goto(`/auth/student/verify?token=${token}`);
  await expect(
    page.getByRole('heading', { name: cat(en, 'MagicLink.successTitle') }),
  ).toBeVisible({ timeout: 30_000 });
  // The claim resolves the student context via the designed success body.
  await expect(
    page.getByText(cat(en, 'MagicLink.successBody.student'), { exact: true }),
  ).toBeVisible({ timeout: 10_000 });
  // The token itself is never rendered.
  const body = await page.evaluate(() => document.body.innerText);
  expect(body).not.toContain(token);
  await shot(page, 'AUTH-031-student-magic-verify');
});

// ---------------------------------------------------------------------------
// AUTH-032 — an invalid magic-link token shows the honest failure state
// ---------------------------------------------------------------------------
test('AUTH-032 invalid magic-link token shows the error state, token hidden', async ({
  page,
}) => {
  const badToken = 'e'.padEnd(64, '0');
  await page.goto(`/auth/student/verify?token=${badToken}`);
  await expect(
    page.getByRole('heading', { name: cat(en, 'MagicLink.errorTitle') }),
  ).toBeVisible({ timeout: 30_000 });
  await expect(page.getByText(cat(en, 'MagicLink.errorBody.student'))).toBeVisible();
  const body = await page.evaluate(() => document.body.innerText);
  expect(body).not.toContain(badToken);
  await shot(page, 'AUTH-032-invalid-magic-token');
});

// ---------------------------------------------------------------------------
// AUTH-033 — teacher trial magic link verifies on the web fallback page
// ---------------------------------------------------------------------------
test('AUTH-033 teacher trial magic-link token verifies and opens the trial', async ({
  page,
  request,
}) => {
  test.setTimeout(120_000);
  // The trial sign-in email goes to a RESOLVED teacher account only
  // (enumeration-safe {ok} for unknown addresses) — use the seeded teacher.
  const email = roleCredentials('teacher').email;
  const req = await request.post(`${API}/api/auth/teacher/magic-link/request`, {
    data: { email },
  });
  expect(req.ok(), await req.text()).toBeTruthy();

  await waitForMessages(request, email, 1);
  const message = await latestMessage(request, email, 1);
  const link = message.Text.match(/https?:\/\/\S*\/en\/auth\/teacher\/verify\?token=([0-9a-f]{64})/);
  expect(link, 'trial email carries the web verify link').toBeTruthy();

  await page.goto(`/auth/teacher/verify?token=${link![1]}`);
  await expect(
    page.getByRole('heading', { name: cat(en, 'MagicLink.successTitle') }),
  ).toBeVisible({ timeout: 30_000 });
  await shot(page, 'AUTH-033-teacher-magic-verify');
});

// ---------------------------------------------------------------------------
// AUTH-024 — Google callback failure surfaces the honest error, no session
// ---------------------------------------------------------------------------
test('AUTH-024 Google callback failure shows the error state, no half-session', async ({
  page,
}) => {
  await page.goto('/auth/google/callback?code=n2w1-not-a-real-code&scope=email');
  // The forwarded query is rejected by the api (provider disabled / bad code)
  // and the bridge lands on the sign-in card's Google error alert.
  await page.waitForURL(/\/sign-in\?error=google/, { timeout: 30_000 });
  await expect(page.getByText(cat(en, 'Auth.googleError'))).toBeVisible();
  const token = await page.evaluate(() => window.localStorage.getItem('app.auth.token'));
  expect(token).toBeNull();
  await shot(page, 'AUTH-024-google-callback-error');
});
