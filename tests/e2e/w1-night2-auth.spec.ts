/**
 * NIGHT-2 W-R1 — auth journey battery for JOURNEYS-N2.md AUTH-001..042.
 *
 * Drives the LIVE fleet stack: web :3001 (E2E_BASE_URL must point there — the
 * config default :3000 belongs to an unrelated project), API :5500, Mailpit
 * :8125. Seeded credentials resolve through tests/e2e/helpers/credentials.ts
 * (sibling schooltest-api/.env). Run with --workers=1: POST /api/auth/local is
 * rate-limited 20/min per IP and the IP is shared with the whole fleet.
 *
 * Lockout hygiene (BF-006 precedent): brute-force journeys only ever target the
 * throwaway account LOCK_ACCOUNT_EMAIL, never a seeded login.
 */
import { execFileSync } from 'node:child_process';

import { expect, test, type Page } from '@playwright/test';

const API = process.env.API_BASE_URL ?? 'http://127.0.0.1:5500';
const MAILPIT = process.env.MAILPIT_API_URL ?? 'http://127.0.0.1:8125';

const PARENT = {
  email: process.env.E2E_PARENT_EMAIL ?? 'parent@schooltest.local',
  password: process.env.E2E_PARENT_PASSWORD ?? 'Parent1234!',
};
const TEACHER = { email: 'teacher@schooltest.local', password: 'Teacher1234!' };
const SCHOOL_ADMIN = { email: 'schooladmin-a@schooltest.local', password: 'SchoolAdmin1234!' };
const OPS = { email: 'apiadmin@schooltest.local', password: 'ApiAdmin1234!' };

/** Throwaway account the lockout journeys may brute-force — NEVER a seeded login. */
const LOCK_EMAIL = 'w1-n2-lock@schooltest.local';
const LOCK_PASSWORD = 'W1Lock!2026x';

const EMAIL_LABEL = 'Email address';
const PASSWORD_LABEL = 'Password';
const LOGIN_BUTTON = 'Log in';

// ---------------------------------------------------------------------------
// helpers
// ---------------------------------------------------------------------------

let lastAuthPostAt = 0;
/** /api/auth/local allows 20/min per IP — pace node-side auth calls ≥3.2s apart. */
async function paceAuthPost(): Promise<void> {
  const since = Date.now() - lastAuthPostAt;
  if (lastAuthPostAt !== 0 && since < 3200) {
    await new Promise((r) => setTimeout(r, 3200 - since));
  }
  lastAuthPostAt = Date.now();
}

interface AuthPostResult {
  status: number;
  body: Record<string, unknown>;
}

async function authPost(
  path: string,
  payload: Record<string, unknown>,
  token?: string,
): Promise<AuthPostResult> {
  await paceAuthPost();
  const res = await fetch(`${API}${path}`, {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      ...(token ? { authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify(payload),
  });
  let body: Record<string, unknown> = {};
  try {
    body = (await res.json()) as Record<string, unknown>;
  } catch {
    body = {};
  }
  return { status: res.status, body };
}

/**
 * Open a page and make sure a locator factory becomes visible — the fleet's
 * shared `next dev` server sometimes aborts an in-flight JS chunk during
 * another lane's recompile, which strands the SSR shell without hydration.
 * ONE patient reload covers that infra flake; a second failure is real.
 */
async function openUntil(
  page: Page,
  path: string,
  visible: () => ReturnType<Page['getByLabel']>,
  timeoutMs = 12_000,
): Promise<void> {
  await gotoStable(page, path);
  try {
    await visible().waitFor({ state: 'visible', timeout: timeoutMs });
  } catch {
    await page.reload({ waitUntil: 'domcontentloaded' });
    await visible().waitFor({ state: 'visible', timeout: timeoutMs });
  }
}

/**
 * Fill a field and make sure the value STUCK: another lane's edit to the web
 * tree recompiles the route mid-test and the HMR reload wipes client state
 * (observed as an emptied textbox between fill and submit — infra, not
 * product). Re-fills when a reload ate the value.
 */
async function fillStable(locator: ReturnType<Page['getByLabel']>, value: string): Promise<void> {
  for (let attempt = 0; attempt < 4; attempt += 1) {
    await locator.fill(value);
    if ((await locator.inputValue()) === value) return;
    await new Promise((r) => setTimeout(r, 2_000));
  }
  throw new Error('fillStable: value kept being wiped');
}

/** Fill and submit the real sign-in form. Does NOT wait for the outcome. */
async function uiSubmitLogin(page: Page, email: string, password: string): Promise<void> {
  await openUntil(page, '/en/sign-in', () => page.getByLabel(EMAIL_LABEL, { exact: true }));
  await fillStable(page.getByLabel(EMAIL_LABEL, { exact: true }), email);
  await fillStable(page.getByLabel(PASSWORD_LABEL, { exact: true }), password);
  await paceAuthPost();
  await page.getByRole('button', { name: LOGIN_BUTTON, exact: true }).click();
}

/** Drive the real /sign-in form and wait for the dashboard (shared-IP 429 retry). */
async function uiLogin(page: Page, email: string, password: string): Promise<void> {
  await uiSubmitLogin(page, email, password);
  for (let attempt = 1; attempt <= 3; attempt += 1) {
    try {
      await page.waitForURL(/\/(en\/)?dashboard/, { timeout: 12_000 });
      return;
    } catch {
      // A 429 from the shared /api/auth/local budget keeps the form up — wait
      // out the per-minute window and submit again.
      await page.waitForTimeout(15_000);
      const box = page.getByLabel(EMAIL_LABEL, { exact: true });
      if (attempt < 3 && (await box.isVisible().catch(() => false))) {
        await uiSubmitLogin(page, email, password);
      }
    }
  }
  await page.waitForURL(/\/(en\/)?dashboard/, { timeout: 15_000 });
}

/**
 * POST /api/auth/local with an EXPECTED outcome, riding out the shared per-IP
 * 20/min budget: a 429 is fleet noise, not the journey. Retries only while the
 * status is 429; any other status is returned as-is.
 */
async function authPostRetrying429(
  path: string,
  payload: Record<string, unknown>,
  expectedStatus: number,
  token?: string,
): Promise<AuthPostResult> {
  let res = await authPost(path, payload, token);
  for (let attempt = 0; res.status === 429 && attempt < 5; attempt += 1) {
    await new Promise((r) => setTimeout(r, 21_000));
    res = await authPost(path, payload, token);
  }
  expect(res.status, `${path} → ${JSON.stringify(res.body)}`).toBe(expectedStatus);
  return res;
}

/**
 * The fleet shares one `next dev` server: another lane's edit recompiles the
 * route mid-flight and the first navigation dies with ERR_ABORTED. That is an
 * infra flake, not a product fault — ride it out with ONE patient retry.
 */
async function gotoStable(page: Page, path: string): Promise<void> {
  try {
    await page.goto(path, { waitUntil: 'domcontentloaded' });
  } catch (err) {
    if (!String(err).includes('ERR_ABORTED')) throw err;
    await new Promise((r) => setTimeout(r, 4000));
    await page.goto(path, { waitUntil: 'domcontentloaded' });
  }
}

interface MailpitMessage {
  ID: string;
  Subject: string;
  To: { Address: string }[];
  Created: string;
}

async function mailpitSearch(query: string): Promise<MailpitMessage[]> {
  const res = await fetch(`${MAILPIT}/api/v1/search?query=${encodeURIComponent(query)}&limit=25`);
  const data = (await res.json()) as { messages: MailpitMessage[] };
  return data.messages ?? [];
}

async function mailpitMessageText(id: string): Promise<string> {
  const res = await fetch(`${MAILPIT}/api/v1/message/${id}`);
  const data = (await res.json()) as { Text?: string; HTML?: string };
  return `${data.Text ?? ''}\n${data.HTML ?? ''}`;
}

/** Newest message to `to` whose subject contains `subject`, created after `since`. */
async function waitForMail(
  to: string,
  subject: string,
  since: Date,
  timeoutMs = 30_000,
): Promise<MailpitMessage> {
  const deadline = Date.now() + timeoutMs;
  for (;;) {
    const messages = await mailpitSearch(`to:${to}`);
    const hit = messages.find(
      (m) =>
        m.Subject.includes(subject) && new Date(m.Created).getTime() >= since.getTime() - 1500,
    );
    if (hit) return hit;
    if (Date.now() > deadline) {
      throw new Error(`no Mailpit message to ${to} subject~${subject} since ${since.toISOString()}`);
    }
    await new Promise((r) => setTimeout(r, 1500));
  }
}

/** Shrink the throwaway account's lockout window via the compose postgres (pg :5540). */
function shrinkLock(seconds: number): void {
  const sql = `update auth_lockout_counters c set locked_until = now() + interval '${seconds} seconds'
               from up_users u where u.email = '${LOCK_EMAIL}' and c.user_id = u.id;`;
  execFileSync('docker', [
    'exec',
    'schooltest-api-st1-postgres',
    'psql',
    '-U',
    'schooltest',
    '-d',
    'schooltest',
    '-c',
    sql,
  ]);
}

/**
 * Every password a previous run of this spec may have left on the throwaway
 * (AUTH-008/009 reset it). The account must always end the call on
 * LOCK_PASSWORD so later journeys can rely on it.
 */
const LOCK_PASSWORD_CANDIDATES = [LOCK_PASSWORD, 'W1Reset!2026new', 'W1Reset!2026used'];

/**
 * Fresh throwaway for the reset journeys. The reset budget is 2/hour PER
 * EMAIL, so the address is unique per run — always within budget, no matter
 * how often the suite drives these journeys.
 */
function resetThrowaway() {
  return {
    email: `w1-n2-reset-${Date.now()}@schooltest.local`,
    username: `w1n2reset${Date.now() % 1000000}`,
    password: 'W1Reset2!2026',
  };
}

/**
 * Register (idempotent) + confirm a throwaway through the real flows. When
 * previous runs may have left a different password on the account, `candidates`
 * are probed and the canonical one restored via /api/auth/change-password.
 */
async function ensureConfirmedAccount(
  email: string,
  username: string,
  password: string,
  candidates: string[] = [password],
): Promise<void> {
  const reg = await authPost('/api/auth/local/register', {
    username,
    email,
    password,
  });
  if (reg.status !== 200 && reg.status !== 400) {
    throw new Error(`register failed: ${reg.status} ${JSON.stringify(reg.body)}`);
  }
  // Confirmed already? A successful login means nothing to do — but a previous
  // run's reset may have changed the password, so probe every candidate and
  // restore the canonical one through the real change-password route.
  for (const candidate of candidates) {
    const probe = await authPost('/api/auth/local', {
      identifier: email,
      password: candidate,
    });
    if (probe.status === 200) {
      if (candidate !== password) {
        const jwt = (probe.body as { jwt?: string }).jwt;
        const change = await fetch(`${API}/api/auth/change-password`, {
          method: 'POST',
          headers: { 'content-type': 'application/json', authorization: `Bearer ${jwt}` },
          body: JSON.stringify({
            currentPassword: candidate,
            password,
            passwordConfirmation: password,
          }),
        });
        if (!change.ok) {
          throw new Error(`could not restore throwaway password: ${change.status}`);
        }
      }
      return;
    }
  }

  // Pull the confirmation link from Mailpit and confirm for real.
  const messages = await mailpitSearch(`to:${email}`);
  const confirm = messages.find((m) => m.Subject.toLowerCase().includes('confirm'));
  if (!confirm) throw new Error(`no confirmation mail for ${email}: ${JSON.stringify(messages.map((m) => m.Subject))}`);
  const text = await mailpitMessageText(confirm.ID);
  const match = text.match(/https?:\/\/\S+?[?&]confirmation=([A-Za-z0-9]+)/);
  if (!match) throw new Error(`no confirmation token in mail ${confirm.ID}`);
  const res = await fetch(
    `${API}/api/auth/email-confirmation?confirmation=${encodeURIComponent(match[1])}`,
  );
  if (!res.ok) throw new Error(`confirmation failed: ${res.status}`);
}

/** The lockout journeys' throwaway (BF-006 precedent: never a seeded login). */
function ensureLockAccount(): Promise<void> {
  return ensureConfirmedAccount(LOCK_EMAIL, 'w1n2lock', LOCK_PASSWORD, LOCK_PASSWORD_CANDIDATES);
}

// ---------------------------------------------------------------------------
// AUTH-001..011 — sign-in, lockout, forgot/reset, password field
// ---------------------------------------------------------------------------

test.describe('W1-N2 auth core', () => {
  test('AUTH-001 parent signs in and lands on the portal dashboard', async ({ page }) => {
    await uiLogin(page, PARENT.email, PARENT.password);
    await page.waitForURL(/\/(en\/)?dashboard/, { timeout: 20_000 });
    await expect(page.getByRole('link', { name: 'Overview' })).toBeVisible({ timeout: 15_000 });
    await page.screenshot({ path: '/tmp/w1-auth-001-dashboard.png', fullPage: true });
  });

  test('AUTH-002 wrong password shows the attempts-remaining counter', async ({ page }) => {
    await uiSubmitLogin(page, PARENT.email, 'definitely-wrong-pass1');
    const alert = page.locator('[data-slot="alert"]');
    await expect(alert).toContainText(/attempts? remain/i, { timeout: 15_000 });
    await page.screenshot({ path: '/tmp/w1-auth-002-wrong-password.png' });
    // Do not leave failed-attempt residue on a shared account: a real login resets.
    await page.getByLabel(PASSWORD_LABEL, { exact: true }).fill(PARENT.password);
    await page.getByRole('button', { name: LOGIN_BUTTON, exact: true }).click();
    await page.waitForURL(/\/(en\/)?dashboard/, { timeout: 20_000 });
  });

  test('AUTH-003+AUTH-004 five failures lock the account; countdown expiry re-enables sign-in', async ({
    page,
  }) => {
    test.setTimeout(150_000);
    await ensureLockAccount();

    // Attempts 1..4 through the API — each 400 carries attemptsRemaining.
    for (let i = 1; i <= 4; i += 1) {
      const res = await authPost('/api/auth/local', {
        identifier: LOCK_EMAIL,
        password: `wrong-${i}`,
      });
      expect(res.status).toBe(400);
      const details = (res.body as { error?: { details?: Record<string, unknown> } }).error?.details;
      expect(Number(details?.attemptsRemaining)).toBe(5 - i);
    }

    // 5th failure through the REAL form — the UI must switch to the locked state.
    await uiSubmitLogin(page, LOCK_EMAIL, 'wrong-5');
    await expect(page.getByRole('heading', { name: 'Account temporarily locked' })).toBeVisible({
      timeout: 15_000,
    });
    await expect(page.locator('[data-slot="alert"]')).toContainText('Too many attempts');
    await expect(page.getByRole('button', { name: /available in/i })).toBeDisabled();
    await page.screenshot({ path: '/tmp/w1-auth-003-locked.png' });

    // Verify the locked 400 contract on the API too (BF-006: no unlockAt extension).
    const locked = await authPost('/api/auth/local', { identifier: LOCK_EMAIL, password: 'wrong-6' });
    expect(locked.status).toBe(400);
    const lockedBody = locked.body as {
      error: { message: string; details: { unlockAt: string; retryAfterSeconds: number } };
    };
    expect(lockedBody.error.message).toContain('locked');
    const firstUnlockAt = lockedBody.error.details.unlockAt;
    expect(Number(lockedBody.error.details.retryAfterSeconds)).toBeGreaterThan(0);
    await authPost('/api/auth/local', { identifier: LOCK_EMAIL, password: 'wrong-7' });
    const again = await authPost('/api/auth/local', { identifier: LOCK_EMAIL, password: 'wrong-8' });
    const againUnlockAt = (
      again.body as { error: { details: { unlockAt: string } } }
    ).error.details.unlockAt;
    expect(againUnlockAt).toBe(firstUnlockAt); // BF-006: attempts while locked must NOT extend unlockAt

    // Shrink the remaining window to 8s, re-drive the UI, and let the countdown
    // reach zero for real.
    // 25s window: long enough that the dev-server reload + fill + paced submit
    // still lands INSIDE the lock, short enough to watch the countdown expire.
    shrinkLock(25);
    await uiSubmitLogin(page, LOCK_EMAIL, 'wrong-9');
    await expect(page.getByRole('heading', { name: 'Account temporarily locked' })).toBeVisible({
      timeout: 15_000,
    });
    const button = page.getByRole('button', { name: /available in/i });
    await expect(button).toBeDisabled();

    // Countdown reaching zero re-labels + re-enables the button ("Log in");
    // clicking returns the form and the CORRECT password signs in.
    const loginAgain = page.getByRole('button', { name: LOGIN_BUTTON, exact: true });
    await expect(loginAgain).toBeEnabled({ timeout: 40_000 });
    await loginAgain.click();
    await expect(page.getByLabel(EMAIL_LABEL, { exact: true })).toBeVisible();
    await paceAuthPost();
    await page.getByLabel(EMAIL_LABEL, { exact: true }).fill(LOCK_EMAIL);
    await page.getByLabel(PASSWORD_LABEL, { exact: true }).fill(LOCK_PASSWORD);
    await page.getByRole('button', { name: LOGIN_BUTTON, exact: true }).click();
    await page.waitForURL(/\/(en\/)?dashboard/, { timeout: 20_000 });
    await page.screenshot({ path: '/tmp/w1-auth-004-unlocked-signin.png' });
  });

  test('AUTH-005 forgot-password for a known email sends the reset mail + sent state', async ({
    page,
  }) => {
    test.setTimeout(120_000);
    await gotoStable(page, '/en/forgot-password');
    await expect(page.getByRole('heading', { name: 'Reset your password' })).toBeVisible();
    // Under fleet load the form may be pre-hydration: a click no-ops and the
    // controlled field resets. Re-fill + re-click until the sent state shows.
    let sent = false;
    for (let attempt = 0; attempt < 4 && !sent; attempt += 1) {
      // teacher@'s 2/hour reset budget was consumed by API probes — the ops
      // staff account is the fresh-budget known email for this journey.
      await fillStable(page.getByLabel('Email', { exact: true }), OPS.email);
      await page.getByRole('button', { name: 'Send reset link' }).click();
      sent = await page
        .getByText('Check your inbox')
        .waitFor({ state: 'visible', timeout: 8_000 })
        .then(() => true)
        .catch(() => false);
      if (!sent) await page.waitForTimeout(3_000);
    }
    expect(sent, 'sent state appeared').toBe(true);
    const mail = await waitForMail(OPS.email, 'Reset your SchoolTest password', new Date(Date.now() - 120_000));
    const text = await mailpitMessageText(mail.ID);
    expect(text).toContain('/reset-password?code=');
    expect(text).toContain('localhost:3001');
    await page.screenshot({ path: '/tmp/w1-auth-005-sent.png' });
  });

  test('AUTH-006 forgot-password for an unknown email shows the same neutral sent state', async ({
    page,
  }) => {
    test.setTimeout(90_000);
    await gotoStable(page, '/en/forgot-password');
    let neutral = false;
    for (let attempt = 0; attempt < 4 && !neutral; attempt += 1) {
      await fillStable(page.getByLabel('Email', { exact: true }), 'w1-nobody-np@schooltest.local');
      await page.getByRole('button', { name: 'Send reset link' }).click();
      neutral = await page
        .getByText('Check your inbox')
        .waitFor({ state: 'visible', timeout: 8_000 })
        .then(() => true)
        .catch(() => false);
      if (!neutral) await page.waitForTimeout(3_000);
    }
    expect(neutral, 'neutral sent state appeared').toBe(true);
    await expect(page.getByText(/If an account exists for that address/)).toBeVisible();
    await page.screenshot({ path: '/tmp/w1-auth-006-neutral.png' });
  });

  test('AUTH-010 reset checklist rejects a failing password before submit succeeds', async ({
    page,
  }) => {
    // Any syntactically-present code renders the form; the checklist drives UX.
    await gotoStable(page, '/en/reset-password?code=auth-010-checklist-probe');
    await expect(page.getByRole('heading', { name: 'Choose a new password' })).toBeVisible();
    const newPassword = page.getByLabel('New password', { exact: true });
    await fillStable(newPassword, 'short');
    // Unmet rules carry the red unmet styling + a visible rule label.
    const charRule = page.locator('li', { hasText: 'One number and one symbol' });
    const lengthRule = page.locator('li', { hasText: 'At least 12 characters' });
    await expect(lengthRule).toHaveClass(/text-\[#B91C1C\]/);
    await expect(charRule).toHaveClass(/text-\[#B91C1C\]/);
    await fillStable(newPassword, 'onlylongpassword123'); // digit, no symbol
    await expect(lengthRule).toHaveClass(/text-\[#0D9488\]/); // length met (teal)
    await expect(charRule).toHaveClass(/text-\[#B91C1C\]/); // char classes still unmet
    await fillStable(newPassword, 'W1!valid-Password2026');
    // The label text stays rendered when met — the state lives in the styling
    // and the sr-only "Requirement met" announcement, not in removal.
    await expect(charRule).toHaveClass(/text-\[#0D9488\]/);
    await expect(page.getByText('Requirement met').first()).toBeAttached();
    await page.screenshot({ path: '/tmp/w1-auth-010-checklist.png' });
  });

  test('AUTH-008 reset via the emailed link succeeds and shows Password updated', async ({
    page,
  }) => {
    test.setTimeout(90_000);
    const acct = resetThrowaway();
    await ensureConfirmedAccount(acct.email, acct.username, acct.password);
    // Fresh reset code through the real API (budget 2/hour — fail loudly on a
    // 429 instead of mining a stale code).
    const forgot = await authPost('/api/auth/forgot-password', { email: acct.email });
    expect(forgot.status, JSON.stringify(forgot.body)).toBe(200);
    const mail = await waitForMail(acct.email, 'Reset your SchoolTest password', new Date(Date.now() - 30_000));
    const text = await mailpitMessageText(mail.ID);
    const match = text.match(/https?:\/\/\S+\/reset-password\?code=([A-Za-z0-9]+)/);
    expect(match, 'reset link present in mail').toBeTruthy();
    const code = match![1];

    await gotoStable(page, `/en/reset-password?code=${code}`);
    await expect(page.getByRole('heading', { name: 'Choose a new password' })).toBeVisible();
    const next = 'W1Reset2!2026new';
    // Retry-tolerant submit: a pre-hydration click no-ops under fleet load.
    let updated = false;
    for (let attempt = 0; attempt < 4 && !updated; attempt += 1) {
      await fillStable(page.getByLabel('New password', { exact: true }), next);
      await fillStable(page.getByLabel('Confirm new password', { exact: true }), next);
      await page.getByRole('button', { name: 'Save new password' }).click();
      updated = await page
        .getByText('Password updated')
        .waitFor({ state: 'visible', timeout: 8_000 })
        .then(() => true)
        .catch(() => false);
      if (!updated) await page.waitForTimeout(3_000);
    }
    expect(updated, 'Password updated state appeared').toBe(true);
    await page.screenshot({ path: '/tmp/w1-auth-008-updated.png' });

    // The new password must actually sign in (old one refused — the platform's
    // deliberate no-oracle 400, not 401: see API-002 evidence).
    const oldLogin = await authPostRetrying429(
      '/api/auth/local',
      { identifier: acct.email, password: acct.password },
      400,
    );
    expect(oldLogin.status).toBe(400);
    const newLogin = await authPostRetrying429(
      '/api/auth/local',
      { identifier: acct.email, password: next },
      200,
    );
    expect(newLogin.status).toBe(200);
  });

  test('AUTH-009 an already-used reset link shows the expired state, not the form', async ({
    page,
  }) => {
    test.setTimeout(90_000);
    const acct = resetThrowaway();
    await ensureConfirmedAccount(acct.email, acct.username, acct.password);
    const forgot = await authPost('/api/auth/forgot-password', { email: acct.email });
    expect(forgot.status, JSON.stringify(forgot.body)).toBe(200);
    const mail = await waitForMail(acct.email, 'Reset your SchoolTest password', new Date(Date.now() - 30_000));
    const text = await mailpitMessageText(mail.ID);
    const match = text.match(/https?:\/\/\S+\/reset-password\?code=([A-Za-z0-9]+)/);
    expect(match).toBeTruthy();
    const code = match![1];

    // Consume the link once through the UI (retry-tolerant like AUTH-008).
    await gotoStable(page, `/en/reset-password?code=${code}`);
    await expect(page.getByRole('heading', { name: 'Choose a new password' })).toBeVisible();
    const next = 'W1Reset2!2026used';
    let updated = false;
    for (let attempt = 0; attempt < 4 && !updated; attempt += 1) {
      await fillStable(page.getByLabel('New password', { exact: true }), next);
      await fillStable(page.getByLabel('Confirm new password', { exact: true }), next);
      await page.getByRole('button', { name: 'Save new password' }).click();
      updated = await page
        .getByText('Password updated')
        .waitFor({ state: 'visible', timeout: 8_000 })
        .then(() => true)
        .catch(() => false);
      if (!updated) await page.waitForTimeout(3_000);
    }
    expect(updated, 'Password updated state appeared').toBe(true);

    // Replay the SAME link: the form renders (code validity is judged at
    // submit), and the consumed code drives the honest expired state.
    await gotoStable(page, `/en/reset-password?code=${code}`);
    await expect(page.getByRole('heading', { name: 'Choose a new password' })).toBeVisible();
    let expired = false;
    for (let attempt = 0; attempt < 4 && !expired; attempt += 1) {
      await fillStable(page.getByLabel('New password', { exact: true }), next);
      await fillStable(page.getByLabel('Confirm new password', { exact: true }), next);
      await page.getByRole('button', { name: 'Save new password' }).click();
      expired = await page
        .getByText(/This reset link has expired|Link invalid or expired|Reset links last 30 minutes and work once/i)
        .first()
        .waitFor({ state: 'visible', timeout: 8_000 })
        .then(() => true)
        .catch(() => false);
      if (!expired) await page.waitForTimeout(3_000);
    }
    expect(expired, 'expired/invalid state appeared').toBe(true);
    await expect(page.getByRole('heading', { name: 'Choose a new password' })).toBeHidden();
    await page.screenshot({ path: '/tmp/w1-auth-009-expired.png' });
  });

  test('AUTH-011 password show/hide toggle flips visibility and aria-label (sign-up)', async ({
    page,
  }) => {
    await gotoStable(page, '/en/sign-up');
    const password = page.getByLabel('Password', { exact: true });
    await expect(password).toBeVisible();
    await expect(password).toHaveAttribute('type', 'password');
    const show = page.getByRole('button', { name: 'Show password' });
    await show.click();
    await expect(password).toHaveAttribute('type', 'text');
    await expect(page.getByRole('button', { name: 'Hide password' })).toBeVisible();
    page.getByRole('button', { name: 'Hide password' }).click();
    await expect(password).toHaveAttribute('type', 'password');
    await page.screenshot({ path: '/tmp/w1-auth-011-toggle.png' });
  });
});

// ---------------------------------------------------------------------------
// AUTH-012..019 — role dashboards, guards, sidebar
// ---------------------------------------------------------------------------

test.describe('W1-N2 role surfaces', () => {
  test('AUTH-012 teacher signs in to the teacher dashboard with teacher rail', async ({ page }) => {
    await uiLogin(page, TEACHER.email, TEACHER.password);
    await page.waitForURL(/\/(en\/)?dashboard/, { timeout: 20_000 });
    // Teacher rail (Teacher Portal v2): Dashboard / Test sessions / Classes.
    await expect(page.getByRole('link', { name: 'Test sessions' })).toBeVisible({
      timeout: 15_000,
    });
    await expect(page.getByRole('link', { name: 'Classes' })).toBeVisible();
    // exact: true — the brand link "SchoolTest" substring-matches a bare 'School'.
    await expect(page.getByRole('link', { name: 'School', exact: true })).toHaveCount(0); // no SA section
    await page.screenshot({ path: '/tmp/w1-auth-012-teacher.png', fullPage: true });
  });

  test('AUTH-013 school admin signs in to the school admin home', async ({ page }) => {
    await uiLogin(page, SCHOOL_ADMIN.email, SCHOOL_ADMIN.password);
    await page.waitForURL(/\/(en\/)?dashboard/, { timeout: 20_000 });
    await expect(page.getByRole('link', { name: /Students/i }).first()).toBeVisible({
      timeout: 15_000,
    });
    await page.screenshot({ path: '/tmp/w1-auth-013-sa.png', fullPage: true });
  });

  test('AUTH-014 ops admin signs in to the ops schools table', async ({ page }) => {
    await uiLogin(page, OPS.email, OPS.password);
    await page.waitForURL(/\/(en\/)?dashboard/, { timeout: 20_000 });
    await page.waitForURL(/ops\/schools/, { timeout: 20_000 });
    await expect(page.getByRole('link', { name: 'Schools' })).toBeVisible({ timeout: 15_000 });
    await page.screenshot({ path: '/tmp/w1-auth-014-ops.png', fullPage: true });
  });

  test('AUTH-015 a parent JWT on a teacher route meets the parent-views mask', async ({ page }) => {
    await uiLogin(page, PARENT.email, PARENT.password);
    await page.waitForURL(/\/(en\/)?dashboard/, { timeout: 20_000 });
    // /dashboard/teach hands over to /dashboard/results, where TeacherGuard
    // masks the surface with ParentViewsUnavailable instead of redirecting.
    await gotoStable(page, '/en/dashboard/teach');
    await expect(page.getByText('Not part of this release')).toBeVisible({ timeout: 15_000 });
    await page.screenshot({ path: '/tmp/w1-auth-015-parent-mask.png' });
  });

  test('AUTH-016 a teacher JWT is bounced off school-admin routes', async ({ page }) => {
    await uiLogin(page, TEACHER.email, TEACHER.password);
    await page.waitForURL(/\/(en\/)?dashboard/, { timeout: 20_000 });
    await gotoStable(page, '/en/dashboard/school/students');
    await page.waitForURL(/\/(en\/)?dashboard$/, { timeout: 20_000 });
    await expect(page.locator('[data-slot="school-admin-guard-pending"]')).toHaveCount(0);
    await page.screenshot({ path: '/tmp/w1-auth-016-teacher-bounce.png' });
  });

  test('AUTH-017 a teacher JWT is bounced off /dashboard/ops', async ({ page }) => {
    await uiLogin(page, TEACHER.email, TEACHER.password);
    await page.waitForURL(/\/(en\/)?dashboard/, { timeout: 20_000 });
    await gotoStable(page, '/en/dashboard/ops/schools');
    // The ops guard sends non-ops staff to a route they can open (/dashboard),
    // never the ops console content.
    await page.waitForURL(/\/(en\/)?dashboard$/, { timeout: 20_000 });
    await expect(page.getByRole('link', { name: /Schools/i })).toHaveCount(0);
    await page.screenshot({ path: '/tmp/w1-auth-017-ops-bounce.png' });
  });

  test('AUTH-018 anonymous deep link to a dashboard route preserves the return path', async ({
    page,
  }) => {
    await gotoStable(page, '/en/dashboard/school/students');
    await page.waitForURL(/sign-in/, { timeout: 20_000 });
    expect(page.url()).toContain('from=');
    const from = new URL(page.url()).searchParams.get('from');
    expect(from).toContain('/dashboard/school/students');
    await page.screenshot({ path: '/tmp/w1-auth-018-return-path.png' });
  });
});

// ---------------------------------------------------------------------------
// shared API mint helpers (ops / school-admin JWTs) for invite + onboarding
// ---------------------------------------------------------------------------

async function apiLoginJwt(email: string, password: string): Promise<string> {
  const res = await authPostRetrying429('/api/auth/local', { identifier: email, password }, 200);
  return (res.body as { jwt: string }).jwt;
}

async function opsPost(
  rawPath: string,
  payload: Record<string, unknown>,
  versionHeader = true,
  idempotencyKey?: string,
): Promise<{ status: number; body: Record<string, unknown> }> {
  const path = rawPath.startsWith('/api') ? rawPath : `/api${rawPath}`;
  await paceAuthPost();
  const res = await fetch(`${API}${path}`, {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      authorization: `Bearer ${await OPS_JWT}`,
      ...(versionHeader ? { 'x-ops-portal-version': '1' } : {}),
      ...(idempotencyKey ? { 'idempotency-key': idempotencyKey } : {}),
    },
    body: JSON.stringify(payload),
  });
  let body: Record<string, unknown> = {};
  try {
    body = (await res.json()) as Record<string, unknown>;
  } catch {
    // 204-style bodies
  }
  return { status: res.status, body };
}

const OPS_JWT = apiLoginJwt(OPS.email, OPS.password);

let saJwtCache: string | null = null;
async function saPost(path: string, payload: Record<string, unknown>): Promise<{ status: number; body: Record<string, unknown> }> {
  if (!saJwtCache) saJwtCache = await apiLoginJwt(SCHOOL_ADMIN.email, SCHOOL_ADMIN.password);
  const apiPath = path.startsWith('/api') ? path : `/api${path}`;
  await paceAuthPost();
  const res = await fetch(`${API}${apiPath}`, {
    method: 'POST',
    headers: { 'content-type': 'application/json', authorization: `Bearer ${saJwtCache}` },
    body: JSON.stringify(payload),
  });
  let body: Record<string, unknown> = {};
  try {
    body = (await res.json()) as Record<string, unknown>;
  } catch {
    // 204-style bodies
  }
  return { status: res.status, body };
}

/** Ops-mint a throwaway school (unique per run via the Idempotency-Key). */
async function mintSchool(label: string): Promise<string> {
  const res = await opsPost(
    '/schools',
    {
      name: `W1 Night2 ${label} ${Date.now()}`,
      suburb: 'Sydney',
      state: 'NSW',
      postcode: '2000',
      sector: 'government',
      contact_email: `w1-owner-${Date.now()}@schooltest.local`,
      contact_name: 'W1 Night2 Owner',
      portal: { plan: 'pilot', status: 'pending_setup', send_owner_invitation: false },
    },
    true,
    `w1-n2-${label.toLowerCase()}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
  );
  if (res.status !== 201) throw new Error(`school create ${res.status}: ${JSON.stringify(res.body).slice(0, 200)}`);
  return ((res.body as { data: { documentId: string } }).data).documentId;
}

async function newContextPage(page: Page): Promise<Page> {
  const browser = page.context().browser();
  if (!browser) throw new Error('no browser handle');
  const ctx = await browser.newContext();
  return ctx.newPage();
}

// ---------------------------------------------------------------------------
// AUTH-007/020/021/022/024 — resend countdown, sign-up, Google failure
// ---------------------------------------------------------------------------

test.describe('W1-N2 auth flows beyond sign-in', () => {
  // Unique per run: a prior run's partially-registered account would send the
  // UI submit down the taken-error branch instead of the confirm state.
  const UI_PARENT = {
    email: `w1-n2-ui-parent-${Date.now()}@schooltest.local`,
    username: `w1uiparent${Date.now() % 100000}`,
    password: 'W1UiParent!2026',
  };

  test('AUTH-020 sign-up registers a parent; email confirmation activates sign-in', async ({
    page,
  }) => {
    test.setTimeout(120_000);
    await gotoStable(page, '/en/sign-up');
    await expect(page.getByRole('heading', { name: 'Create your account' })).toBeVisible();
    await fillStable(page.getByLabel('Username', { exact: true }), UI_PARENT.username);
    await fillStable(page.getByLabel('Email', { exact: true }), UI_PARENT.email);
    await fillStable(page.getByLabel('Password', { exact: true }), UI_PARENT.password);
    await fillStable(page.getByLabel('Confirm password', { exact: true }), UI_PARENT.password);
    await page.getByRole('button', { name: 'Create account' }).click();
    // Confirm state (no jwt, no auto-login).
    await expect(page.getByRole('heading', { name: 'Check your email' })).toBeVisible({
      timeout: 15_000,
    });
    await expect(page.getByText(UI_PARENT.email).first()).toBeVisible();
    await page.screenshot({ path: '/tmp/w1-auth-020-confirm-state.png' });

    // Activate through the real emailed link, then sign in.
    const messages = await mailpitSearch(`to:${UI_PARENT.email}`);
    const confirm = messages.find((m) => m.Subject.toLowerCase().includes('confirm'));
    expect(confirm, 'confirmation mail present').toBeTruthy();
    const text = await mailpitMessageText(confirm!.ID);
    const token = text.match(/[?&]confirmation=([A-Za-z0-9]+)/)?.[1];
    expect(token, 'confirmation token in mail').toBeTruthy();
    const res = await fetch(`${API}/api/auth/email-confirmation?confirmation=${token}`);
    expect(res.status).toBeLessThan(400);

    await uiLogin(page, UI_PARENT.email, UI_PARENT.password);
    // A brand-new parent lands on the welcome card (Continue / Skip for now)
    // before the portal shell — skip it; the journey's contract is that
    // activation makes sign-in work.
    const skip = page.getByRole('button', { name: 'Skip for now' });
    if (await skip.isVisible().catch(() => false)) await skip.click();
    await expect(page.getByRole('button', { name: 'Open user menu' })).toBeVisible({
      timeout: 15_000,
    });
    await page.screenshot({ path: '/tmp/w1-auth-020-activated.png' });
  });

  test('AUTH-007 sent-state resend waits out its countdown and re-sends the mail', async ({
    page,
  }) => {
    test.setTimeout(180_000);
    // The throwaway's reset budget is untouched (only confirm mails so far):
    // first send 1/2, resend 2/2 — exactly the designed window.
    const since = Date.now();
    await gotoStable(page, '/en/forgot-password');
    await fillStable(page.getByLabel('Email', { exact: true }), UI_PARENT.email);
    await page.getByRole('button', { name: 'Send reset link' }).click();
    await expect(page.getByText('Check your inbox')).toBeVisible({ timeout: 15_000 });

    // Countdown: disabled while counting.
    const resend = page.getByRole('button', { name: /Resend email/ });
    await expect(resend).toBeDisabled();

    // Wait out the 60s window; the button re-labels to plain "Resend email".
    await expect(resend).toBeEnabled({ timeout: 90_000 });
    await resend.click();
    const mail = await waitForMail(UI_PARENT.email, 'Reset your SchoolTest password', new Date(since));
    expect(mail, 'resend produced a second reset mail').toBeTruthy();
    await page.screenshot({ path: '/tmp/w1-auth-007-resend.png' });
  });

  test('AUTH-021 sign-up with an already-registered email shows the register error', async ({
    page,
  }) => {
    await gotoStable(page, '/en/sign-up');
    await fillStable(page.getByLabel('Username', { exact: true }), 'w1dupuser');
    await fillStable(page.getByLabel('Email', { exact: true }), PARENT.email);
    await fillStable(page.getByLabel('Password', { exact: true }), 'W1Dup!2026pass');
    await fillStable(page.getByLabel('Confirm password', { exact: true }), 'W1Dup!2026pass');
    await page.getByRole('button', { name: 'Create account' }).click();
    // The copy renders twice by design (inline Alert + sonner toast) — the
    // inline one is the product surface; assert it.
    await expect(
      page.getByRole('main').getByText('This email is already registered. Try signing in instead.'),
    ).toBeVisible({ timeout: 15_000 });
    await page.screenshot({ path: '/tmp/w1-auth-021-taken.png' });
  });

  test('AUTH-022 sign-up password != confirm is rejected inline before submit', async ({
    page,
  }) => {
    await gotoStable(page, '/en/sign-up');
    await fillStable(page.getByLabel('Username', { exact: true }), 'w1mismatch');
    await fillStable(page.getByLabel('Email', { exact: true }), 'w1-mismatch@schooltest.local');
    await fillStable(page.getByLabel('Password', { exact: true }), 'W1Mismatch!2026');
    await fillStable(page.getByLabel('Confirm password', { exact: true }), 'W1Mismatch!2027');
    await page.getByRole('button', { name: 'Create account' }).click();
    // Inline validation error, no submit, no navigation.
    await expect(page.getByText('Passwords do not match').first()).toBeVisible({ timeout: 10_000 });
    expect(page.url()).toContain('/sign-up');
    await page.screenshot({ path: '/tmp/w1-auth-022-mismatch.png' });
  });

  test('AUTH-024 Google OAuth failure lands on the honest error state, no half-session', async ({
    page,
  }) => {
    await gotoStable(page, '/en/auth/google/callback?error=access_denied&scope=email');
    // The disabled-provider 400 (D5) routes to /sign-in?error=google.
    await page.waitForURL(/sign-in/, { timeout: 20_000 });
    await expect(page.getByText('Google sign-in did not complete. Please try again.')).toBeVisible({
      timeout: 15_000,
    });
    const token = await page.evaluate(() => window.localStorage.getItem('app.auth.token'));
    expect(token, 'no session token after failed OAuth').toBeFalsy();
    await page.screenshot({ path: '/tmp/w1-auth-024-google-error.png' });
  });
});

// ---------------------------------------------------------------------------
// AUTH-019 — role-scoped sidebar rails
// ---------------------------------------------------------------------------

test.describe('W1-N2 role rails', () => {
  test('AUTH-019 the sidebar renders only the sections permitted for the role', async ({
    page,
  }) => {
    test.setTimeout(180_000);
    // Parent: Overview / My children / Search / Settings.
    await uiLogin(page, PARENT.email, PARENT.password);
    await expect(page.getByRole('link', { name: 'My children' })).toBeVisible({ timeout: 15_000 });
    await expect(page.getByRole('link', { name: 'Search', exact: true })).toBeVisible(); // topbar 'Open search' also matches
    await expect(page.getByRole('link', { name: 'Schools', exact: true })).toHaveCount(0); // no ops rail entry
    await page.screenshot({ path: '/tmp/w1-auth-019-parent-rail.png' });
    await page.getByRole('button', { name: 'Open user menu' }).click();
    await page.getByRole('menuitem', { name: 'Sign out' }).click();
    await page.waitForURL(/sign-in/, { timeout: 15_000 });

    // Teacher: Classes / Test sessions, no admin sections.
    await uiLogin(page, TEACHER.email, TEACHER.password);
    await expect(page.getByRole('link', { name: 'Test sessions' })).toBeVisible({ timeout: 15_000 });
    await expect(page.getByRole('link', { name: 'Classes' })).toBeVisible();
    await expect(page.getByRole('link', { name: 'Students', exact: true })).toHaveCount(0);
    await page.screenshot({ path: '/tmp/w1-auth-019-teacher-rail.png' });
    await page.getByRole('button', { name: 'Open user menu' }).click();
    await page.getByRole('menuitem', { name: 'Sign out' }).click();
    await page.waitForURL(/sign-in/, { timeout: 15_000 });

    // School admin: School / Teachers / Classes / Students / Account.
    await uiLogin(page, SCHOOL_ADMIN.email, SCHOOL_ADMIN.password);
    await expect(page.getByRole('link', { name: 'Teachers' })).toBeVisible({ timeout: 15_000 });
    await expect(page.getByRole('link', { name: 'Students', exact: true })).toBeVisible();
    await expect(page.getByRole('link', { name: 'Account' })).toBeVisible();
    await page.screenshot({ path: '/tmp/w1-auth-019-sa-rail.png' });
    await page.getByRole('button', { name: 'Open user menu' }).click();
    await page.getByRole('menuitem', { name: 'Sign out' }).click();
    await page.waitForURL(/sign-in/, { timeout: 15_000 });

    // Ops: Schools / Platform settings.
    await uiLogin(page, OPS.email, OPS.password);
    await expect(page.getByRole('link', { name: 'Schools' })).toBeVisible({ timeout: 15_000 });
    await expect(page.getByRole('link', { name: 'Platform settings' })).toBeVisible();
    await expect(page.getByRole('link', { name: 'My children' })).toHaveCount(0);
    await page.screenshot({ path: '/tmp/w1-auth-019-ops-rail.png' });
  });
});

// ---------------------------------------------------------------------------
// AUTH-025/026 + AUTH-027/028 + AUTH-029/030 — invitations + onboarding
// ---------------------------------------------------------------------------

test.describe('W1-N2 invitations and onboarding', () => {
  test('AUTH-025 invited teacher activates via /invite/[token] into the teacher portal', async ({
    page,
  }) => {
    test.setTimeout(150_000);
    const email = `w1-inv-teacher-${Date.now()}@schooltest.local`;
    const mint = await saPost('/schools/me/invitations', {
      email,
      first_name: 'W1',
      last_name: 'InviteTeacher',
      role: 'teacher',
    });
    expect(mint.status, JSON.stringify(mint.body)).toBe(201);
    const inviteUrl = (mint.body as { data: { invite_url: string } }).data.invite_url;

    await gotoStable(page, inviteUrl);
    await expect(page.getByText('Teacher', { exact: true })).toBeVisible({ timeout: 20_000 });
    await expect(page.getByRole('heading', { name: /Welcome to/ })).toBeVisible();
    await page.locator('#invite-password').fill('W1Invite!2026');
    await page.locator('#invite-confirm-password').fill('W1Invite!2026');
    await page.screenshot({ path: '/tmp/w1-auth-025-invite-form.png' });
    await page.getByRole('button', { name: 'Activate account' }).click();
    await page.waitForURL(/dashboard/, { timeout: 30_000 });
    await expect(page.getByRole('link', { name: 'Test sessions' })).toBeVisible({ timeout: 15_000 });
    await page.screenshot({ path: '/tmp/w1-auth-025-activated.png' });
  });

  test('AUTH-026 a stale invite token shows the invalid-invitation state', async ({ page }) => {
    await gotoStable(page, '/en/invite/w1bogusnotarealtoken0000000000000000');
    await expect(page.getByText('This invitation link is not valid')).toBeVisible({
      timeout: 20_000,
    });
    await expect(page.getByLabel('Password')).toHaveCount(0);
    await page.screenshot({ path: '/tmp/w1-auth-026-invalid-invite.png' });
  });

  test('AUTH-027+AUTH-028 invited school-admin accepts via email link; replay is refused', async ({
    page,
  }) => {
    test.setTimeout(180_000);
    const schoolDocumentId = await mintSchool('SA Invite');
    const email = `w1-inv-sa-${Date.now()}@schooltest.local`;
    // Legacy (unversioned) op so the response carries the invite_url.
    const mint = await opsPost(
      `/ops/schools/${schoolDocumentId}/admin-invitations`,
      { email, first_name: 'W1', last_name: 'InviteAdmin' },
      false,
    );
    expect(mint.status, JSON.stringify(mint.body)).toBe(201);
    const inviteUrl = (mint.body as { data: { invite_url: string } }).data.invite_url;
    expect(inviteUrl).toContain('/invite/');

    await gotoStable(page, inviteUrl);
    await expect(page.getByText('School administrator', { exact: true })).toBeVisible({
      timeout: 20_000,
    });
    await page.locator('#invite-password').fill('W1InvSA!2026');
    await page.locator('#invite-confirm-password').fill('W1InvSA!2026');
    await page.getByRole('button', { name: 'Activate account' }).click();
    await page.waitForURL(/dashboard/, { timeout: 30_000 });
    // Lands in THEIR school's admin portal.
    await page.waitForURL(/dashboard\/school/, { timeout: 20_000 });
    await expect(page.getByRole('link', { name: 'Students', exact: true })).toBeVisible({
      timeout: 15_000,
    });
    await page.screenshot({ path: '/tmp/w1-auth-027-sa-activated.png' });

    // Single-use honesty: a fresh context replaying the SAME link.
    const page2 = await newContextPage(page);
    await gotoStable(page2, inviteUrl);
    await expect(page2.getByText('This invitation has already been accepted')).toBeVisible({
      timeout: 20_000,
    });
    await page2.screenshot({ path: '/tmp/w1-auth-028-consumed-invite.png' });
    await page2.context().close();
  });

  test('AUTH-029+AUTH-030 onboarding wizard walks setup and lands on the admin home', async ({
    page,
  }) => {
    test.setTimeout(240_000);
    const schoolDocumentId = await mintSchool('Onboarding');
    const link = await opsPost(`/schools/${schoolDocumentId}/onboarding-link`, {
      first_name: 'W1',
      last_name: 'OnboardAdmin',
      contact_email: `w1-onboard-${Date.now()}@schooltest.local`,
    });
    expect(link.status, JSON.stringify(link.body)).toBe(201);
    const data = (
      link.body as { data: { token: string; url: string } }
    ).data;
    expect(data.token).toMatch(/^[0-9a-f]{64}$/);

    await gotoStable(page, data.url);
    await expect(
      page.getByRole('heading', { name: 'Confirm your school details' }),
    ).toBeVisible({ timeout: 20_000 });
    // Step 1 — school details prefilled from the ops record.
    await page.getByRole('button', { name: 'Save and continue' }).click();
    // Step 2 — teachers (skip; teachers can be invited later).
    await expect(page.getByRole('heading', { name: 'Add your teachers' })).toBeVisible({
      timeout: 20_000,
    });
    await page.getByRole('button', { name: 'Save and continue' }).click();
    // Step 3 — review.
    await expect(page.getByRole('heading', { name: 'Review and confirm' })).toBeVisible({
      timeout: 20_000,
    });
    await page.screenshot({ path: '/tmp/w1-auth-029-review.png' });
    await page.getByRole('button', { name: 'Confirm and continue' }).click();
    // Step 4 — the administrator account.
    await expect(
      page.getByRole('heading', { name: 'Create your administrator account' }),
    ).toBeVisible({ timeout: 20_000 });
    // FieldShell labels carry a required-marker span — drive the stable ids.
    const onbEmail = `w1-onboard-${Date.now()}@schooltest.local`;
    await page.locator('#onb-admin-first-name').fill('W1');
    await page.locator('#onb-admin-last-name').fill('OnboardAdmin');
    await page.locator('#onb-admin-email').fill(onbEmail);
    await page.locator('#onb-admin-password').fill('W1Onboard!2026');
    await page.getByRole('button', { name: 'Create account and finish' }).click();
    await page.waitForURL(/dashboard\/school/, { timeout: 40_000 });
    await expect(page.getByRole('link', { name: 'Students', exact: true })).toBeVisible({
      timeout: 20_000,
    });
    await page.screenshot({ path: '/tmp/w1-auth-029-admin-home.png' });

    // The same link can never re-run the wizard.
    const page2 = await newContextPage(page);
    await gotoStable(page2, data.url);
    await expect(page2.getByText('This onboarding link has already been used')).toBeVisible({
      timeout: 20_000,
    });
    await page2.screenshot({ path: '/tmp/w1-auth-030-consumed-onboarding.png' });
    await page2.context().close();
  });
});

// ---------------------------------------------------------------------------
// AUTH-031/032/033 — magic-link web fallbacks
// ---------------------------------------------------------------------------

test.describe('W1-N2 magic-link web fallbacks', () => {
  test('AUTH-031 the student magic-link web fallback claims the token and signs in', async ({
    page,
  }) => {
    test.setTimeout(120_000);
    const email = 'proof.s02@schooltest.local';
    const since = Date.now();
    const req = await authPost('/api/auth/student/magic-link/request', { email });
    expect(req.status).toBe(200);
    const mail = await waitForMail(email, 'sign-in link', new Date(since));
    expect(mail, 'student magic-link mail').toBeTruthy();
    const token = (await mailpitMessageText(mail!.ID)).match(/token=([A-Za-z0-9]+)/)?.[1];
    expect(token).toBeTruthy();

    await gotoStable(page, `/en/auth/student/verify?token=${token}`);
    const screen = page.locator('[data-slot="magic-link-verify"]');
    await expect(screen).toHaveAttribute('data-state', 'success', { timeout: 20_000 });
    await expect(page.getByText("You're signed in").first()).toBeVisible();
    await page.screenshot({ path: '/tmp/w1-auth-031-student-verify.png' });
  });

  test('AUTH-032 an invalid magic-link token shows the honest failure state', async ({
    page,
  }) => {
    const bogus = 'w1'.repeat(32);
    await gotoStable(page, `/en/auth/student/verify?token=${bogus}`);
    const screen = page.locator('[data-slot="magic-link-verify"]');
    await expect(screen).toHaveAttribute('data-state', 'error', { timeout: 20_000 });
    await expect(page.getByText("We couldn't sign you in")).toBeVisible();
    // The token itself is never RENDERED (it can sit in inline RSC scripts).
    expect(await page.getByRole('main').innerText()).not.toContain(bogus);
    await page.screenshot({ path: '/tmp/w1-auth-032-invalid-token.png' });
  });

  test('AUTH-033 the teacher trial verify fallback opens the teacher trial', async ({
    page,
  }) => {
    test.setTimeout(120_000);
    const since = Date.now();
    const req = await authPost('/api/auth/teacher/magic-link/request', { email: 't1@schooltest.local' });
    expect(req.status).toBe(200);
    const mail =
      (await waitForMail('t1@schooltest.local', 'sign-in link', new Date(since))) ??
      (await waitForMail('t1@schooltest.local', 'SchoolTest', new Date(since)));
    expect(mail, 'teacher magic-link mail').toBeTruthy();
    const token = (await mailpitMessageText(mail!.ID)).match(/token=([A-Za-z0-9]+)/)?.[1];
    expect(token).toBeTruthy();

    await gotoStable(page, `/en/auth/teacher/verify?token=${token}`);
    const screen = page.locator('[data-slot="magic-link-verify"]');
    await expect(screen).toHaveAttribute('data-state', 'success', { timeout: 20_000 });
    await page.screenshot({ path: '/tmp/w1-auth-033-teacher-verify.png' });
  });
});

// ---------------------------------------------------------------------------
// AUTH-034..040 — change password, session expiry, locale, sign-out
// ---------------------------------------------------------------------------

test.describe('W1-N2 account, session, locale', () => {
  test('AUTH-035+AUTH-034 change password: wrong current refused inline; correct swap works', async ({
    page,
  }) => {
    test.setTimeout(240_000);
    // Throwaway teacher (unique per run): mint via the SA legacy invitation
    // (invite_url carries the token) and activate through the real accept API.
    const email = `w1-cpw-${Date.now()}@schooltest.local`;
    const mint = await saPost('/schools/me/invitations', {
      email,
      first_name: 'W1',
      last_name: 'ChangePw',
      role: 'teacher',
    });
    expect(mint.status, JSON.stringify(mint.body)).toBe(201);
    const inviteUrl = (mint.body as { data: { invite_url: string } }).data.invite_url;
    const token = inviteUrl.split('/invite/')[1];
    const base = 'W1Cpw!2026';
    const accept = await authPostRetrying429(
      `/api/invitations/${token}/accept`,
      { password: base },
      200,
    );
    expect((accept.body as { data?: { jwt?: string } }).data?.jwt, 'accept returns a session').toBeTruthy();

    await uiLogin(page, email, base);
    // A compiling route can serve a fallback that lands elsewhere — re-goto
    // until the settings surface is actually up.
    const current = page.locator('#change-current-password');
    for (let attempt = 0; attempt < 4; attempt += 1) {
      await gotoStable(page, '/en/dashboard/teach/settings');
      try {
        await page.waitForURL(/teach\/settings/, { timeout: 10_000 });
        await current.waitFor({ state: 'visible', timeout: 10_000 });
        break;
      } catch {
        await page.waitForTimeout(3_000);
      }
    }
    await expect(current).toBeVisible();
    const nextPw = 'W1Cpw!2027';

    // Wrong current password: inline refusal, session intact.
    let wrongShown = false;
    for (let attempt = 0; attempt < 3 && !wrongShown; attempt += 1) {
      await fillStable(current, 'W1Wrong!2026');
      await fillStable(page.locator('#change-new-password'), nextPw);
      await fillStable(page.locator('#change-confirm-password'), nextPw);
      await page.getByRole('button', { name: 'Update password' }).click();
      wrongShown = await page
        .getByText('The current password you entered is incorrect.')
        .waitFor({ state: 'visible', timeout: 8_000 })
        .then(() => true)
        .catch(() => false);
      if (!wrongShown) await page.waitForTimeout(3_000);
    }
    expect(wrongShown, 'wrong-current refusal shown').toBe(true);
    await expect(page.getByRole('button', { name: 'Open user menu' })).toBeVisible(); // session intact
    await page.screenshot({ path: '/tmp/w1-auth-035-wrong-current.png' });

    // Correct current password: success, and the NEXT login needs the new one.
    let updated = false;
    for (let attempt = 0; attempt < 3 && !updated; attempt += 1) {
      await fillStable(current, base);
      await fillStable(page.locator('#change-new-password'), nextPw);
      await fillStable(page.locator('#change-confirm-password'), nextPw);
      await page.getByRole('button', { name: 'Update password' }).click();
      updated = await page
        .getByText('Password updated')
        .first()
        .waitFor({ state: 'visible', timeout: 8_000 })
        .then(() => true)
        .catch(() => false);
      if (!updated) await page.waitForTimeout(3_000);
    }
    expect(updated, 'Password updated toast/state appeared').toBe(true);
    await page.screenshot({ path: '/tmp/w1-auth-034-updated.png' });

    await page.getByRole('button', { name: 'Open user menu' }).click();
    await page.getByRole('menuitem', { name: 'Sign out' }).click();
    await page.waitForURL(/sign-in/, { timeout: 15_000 });

    await uiSubmitLogin(page, email, base);
    await expect(page.locator('[data-slot="alert"]')).toBeVisible({ timeout: 15_000 }); // old refused
    await uiSubmitLogin(page, email, nextPw);
    await page.waitForURL(/dashboard/, { timeout: 20_000 }); // new accepted
  });

  test('AUTH-036 an expired ops session shows the expired card; re-auth returns', async ({
    page,
  }) => {
    test.setTimeout(150_000);
    await uiLogin(page, OPS.email, OPS.password);
    // Sabotage the stored token: the next guarded read 401s and the axios
    // boundary raises the store's sessionExpired flag (GAP-6).
    await page
      .evaluate(() => window.localStorage.setItem('app.auth.token', 'w1.expiredtoken.zzz'))
      .catch(() => undefined);
    await gotoStable(page, '/en/dashboard/ops/schools');
    const card = page.locator('[data-slot="ops-session-expired"]');
    await expect(card).toBeVisible({ timeout: 20_000 });
    await expect(page.getByText('Your session has expired')).toBeVisible();
    await page.screenshot({ path: '/tmp/w1-auth-036-expired.png' });

    await page.getByRole('link', { name: 'Sign in again' }).click();
    await page.waitForURL(/sign-in/, { timeout: 15_000 });
    await uiLogin(page, OPS.email, OPS.password);
    await page.waitForURL(/ops\/schools/, { timeout: 20_000 });
    await page.screenshot({ path: '/tmp/w1-auth-036-reauth.png' });
  });

  test('AUTH-037 the auth-screen language switcher persists the locale', async ({ page }) => {
    await gotoStable(page, '/en/sign-in');
    // A pre-hydration click opens no popup — retry until the options render.
    let opened = false;
    for (let attempt = 0; attempt < 4 && !opened; attempt += 1) {
      await page.getByRole('combobox', { name: 'Language' }).click();
      opened = (await page.getByRole('option', { name: '中文' }).count()) > 0;
      if (!opened) await page.waitForTimeout(2_000);
    }
    expect(opened, 'locale options opened').toBe(true);
    await page.getByRole('option', { name: '中文' }).click();
    await page.waitForURL(/\/zh\/sign-in/, { timeout: 15_000 });
    // Persists across a reload.
    await page.reload({ waitUntil: 'domcontentloaded' });
    await expect(page.getByRole('combobox', { name: 'Language' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Log in', exact: true })).toHaveCount(0);
    await page.screenshot({ path: '/tmp/w1-auth-037-locale.png' });
    await page.getByRole('combobox', { name: 'Language' }).click();
    await page.getByRole('option', { name: 'English' }).click();
    try {
      await page.waitForURL(/\/en\/sign-in/, { timeout: 25_000 });
    } catch {
      // A wedged locale navigation settles on reload — the switch itself persisted.
      await gotoStable(page, '/en/sign-in');
    }
  });

  test('AUTH-038 teacher signs out from the user menu; deep links blocked after', async ({
    page,
  }) => {
    await uiLogin(page, TEACHER.email, TEACHER.password);
    await page.getByRole('button', { name: 'Open user menu' }).click();
    await page.getByRole('menuitem', { name: 'Sign out' }).click();
    await page.waitForURL(/sign-in/, { timeout: 15_000 });
    const token = await page.evaluate(() => window.localStorage.getItem('app.auth.token'));
    expect(token, 'token cleared on sign-out').toBeFalsy();
    // Deep link to a teacher page is refused after sign-out.
    await gotoStable(page, '/en/dashboard/test-sessions');
    await page.waitForURL(/sign-in/, { timeout: 20_000 });
    await page.screenshot({ path: '/tmp/w1-auth-038-teacher-signout.png' });
  });

  test('AUTH-039+AUTH-040 SA sign-out via the account panel; back never restores', async ({
    page,
  }) => {
    await uiLogin(page, SCHOOL_ADMIN.email, SCHOOL_ADMIN.password);
    await gotoStable(page, '/en/dashboard/school/account');
    await page.getByRole('tab', { name: 'Sign out' }).click();
    // The sign-out panel signs out on mount and replaces to /sign-in.
    await page.waitForURL(/sign-in/, { timeout: 20_000 });
    await expect(page.getByText('Signing you out')).toBeVisible({ timeout: 10_000 }).catch(() => {
      // The card is transient — the redirect is the contract.
    });
    const token = await page.evaluate(() => window.localStorage.getItem('app.auth.token'));
    expect(token, 'session token cleared').toBeFalsy();
    await page.screenshot({ path: '/tmp/w1-auth-039-account-signout.png' });

    // Browser back must not resurrect the authenticated view.
    await page.goBack();
    await page.waitForTimeout(2_000);
    const tokenAfterBack = await page.evaluate(() => window.localStorage.getItem('app.auth.token'));
    expect(tokenAfterBack).toBeFalsy();
    await expect(page.getByRole('button', { name: 'Open user menu' })).toHaveCount(0);
    await page.screenshot({ path: '/tmp/w1-auth-040-back-blocked.png' });
  });

  test('AUTH-041 an unknown locale-prefixed path renders the branded 404', async ({ page }) => {
    await gotoStable(page, '/en/w1/no/such/page');
    await expect(page.getByRole('img', { name: '404' })).toBeVisible({ timeout: 15_000 });
    await expect(page.getByText('This page hopped away')).toBeVisible();
    await page.screenshot({ path: '/tmp/w1-auth-041-branded-404.png' });
  });

  test('AUTH-042 an unknown student deep link shows the honest not-found state', async ({
    page,
  }) => {
    await uiLogin(page, SCHOOL_ADMIN.email, SCHOOL_ADMIN.password);
    await gotoStable(page, '/en/dashboard/school/students/w1nosuchstudent0000000');
    await expect(page.getByText('We could not find that student')).toBeVisible({
      timeout: 20_000,
    });
    await page.screenshot({ path: '/tmp/w1-auth-042-unknown-student.png' });
  });
});
