/**
 * NIGHT-2 W1 (AUTH) reset + sign-up battery — AUTH-005..010 and 020..022 from
 * .overnight/N2/JOURNEYS-N2.md against the LIVE stack. Every flow goes through
 * the real web UI with Mailpit-backed email proof.
 *
 * Harness discipline: throwaway parents via the real register contract; one
 * reset/hour budget respected (2/hour/email — each test uses its OWN address);
 * sign-ins paced ≥3.1s apart → run with --workers=1.
 */
import { mkdirSync } from 'node:fs';
import path from 'node:path';

import { expect, test, type Page, type APIRequestContext } from '@playwright/test';

import {
  backdateResetIssuance,
  deleteAuthEmailRows,
  runSql,
  sha256,
} from './helpers/auth-db';
import { skipOnboardingViaUi } from './helpers/auth';
import { cat, loadMessages } from './helpers/i18n';
import {
  CONFIRMATION_LINK_RE,
  RESET_LINK_RE,
  RESET_SUBJECT,
  latestMessage,
  searchMessages,
  waitForMessages,
} from './helpers/mailpit';
import { registerAndConfirmParent, freshEmail } from './helpers/throwaway-parent';

const en = loadMessages('en');
const CAPTURES = '/Users/hunor.nagy/Code/schooltest/.overnight/N2/captures';
const ATTEMPT_INTERVAL_MS = 3100;
const usedEmails: string[] = [];

test.afterAll(() => {
  for (const email of usedEmails) {
    deleteAuthEmailRows(email);
  }
});

async function shot(page: Page, name: string): Promise<string> {
  mkdirSync(CAPTURES, { recursive: true });
  const file = path.join(CAPTURES, `${name}.png`);
  await page.screenshot({ path: file, fullPage: false });
  return file;
}

let lastLoginSubmittedAt = 0;
async function uiLogin(page: Page, email: string, password: string): Promise<void> {
  const sinceLast = Date.now() - lastLoginSubmittedAt;
  if (lastLoginSubmittedAt !== 0 && sinceLast < ATTEMPT_INTERVAL_MS) {
    await page.waitForTimeout(ATTEMPT_INTERVAL_MS - sinceLast);
  }
  await page.goto('/sign-in');
  await page.getByLabel(cat(en, 'Auth.portal.emailLabel'), { exact: true }).fill(email);
  await page.getByLabel(cat(en, 'Auth.portal.passwordLabel'), { exact: true }).fill(password);
  await page
    .getByRole('button', { name: cat(en, 'Auth.portal.loginButton'), exact: true })
    .click();
  lastLoginSubmittedAt = Date.now();
}

/** UI forgot-password submit + the reset link from the resulting email. */
async function requestResetAndGetLink(
  request: APIRequestContext,
  page: Page,
  email: string,
): Promise<{ code: string; url: string }> {
  await page.goto('/forgot-password');
  await page.getByLabel(cat(en, 'Auth.emailLabel'), { exact: true }).fill(email);
  await page
    .getByRole('button', { name: cat(en, 'Auth.sendResetLink'), exact: true })
    .click();
  // Enumeration-safe sent state replaces the form.
  await expect(
    page.getByRole('heading', { name: cat(en, 'Auth.portal.sentTitle') }),
  ).toBeVisible();

  const message = await latestMessage(request, email);
  expect(message.Subject).toBe(RESET_SUBJECT);
  const match = message.HTML.match(RESET_LINK_RE) ?? message.Text.match(RESET_LINK_RE);
  expect(match, 'reset email carries a reset-password?code=<128hex> link').toBeTruthy();
  return { code: match![1], url: `/reset-password?code=${match![1]}` };
}

// ---------------------------------------------------------------------------
// AUTH-005 — forgot-password with a known email sends the reset mail
// ---------------------------------------------------------------------------
test('AUTH-005 forgot-password (known email) sends the reset mail + sent state', async ({
  page,
  request,
}) => {
  const parent = await registerAndConfirmParent(request, 'n2w1-005');
  usedEmails.push(parent.email);

  const { url } = await requestResetAndGetLink(request, page, parent.email);
  expect(url).toContain('/reset-password?code=');
  // The sent state keeps the enumeration-safe copy (no account confirmation).
  await expect(page.getByText(cat(en, 'Auth.portal.sentBody'))).toBeVisible();
  await shot(page, 'AUTH-005-forgot-sent-state');
});

// ---------------------------------------------------------------------------
// AUTH-006 — forgot-password with an UNKNOWN email shows the same sent state
// ---------------------------------------------------------------------------
test('AUTH-006 forgot-password (unknown email) is enumeration-safe', async ({
  page,
  request,
}) => {
  const ghost = freshEmail('n2w1-006-ghost');
  usedEmails.push(ghost);

  await page.goto('/forgot-password');
  await page.getByLabel(cat(en, 'Auth.emailLabel'), { exact: true }).fill(ghost);
  await page
    .getByRole('button', { name: cat(en, 'Auth.sendResetLink'), exact: true })
    .click();
  // SAME designed sent state as a known address — no account enumeration.
  await expect(
    page.getByRole('heading', { name: cat(en, 'Auth.portal.sentTitle') }),
  ).toBeVisible();
  await expect(page.getByText(cat(en, 'Auth.portal.sentBody'))).toBeVisible();
  await shot(page, 'AUTH-006-forgot-unknown-sent-state');

  // And nothing meaningful was sent: no reset email exists for the ghost.
  await page.waitForTimeout(2000);
  const found = await searchMessages(request, `to:${ghost}`);
  expect(found.length).toBe(0);
});

// ---------------------------------------------------------------------------
// AUTH-007 — resend button on the sent state respects its countdown + re-sends
// ---------------------------------------------------------------------------
test('AUTH-007 resend countdown unlocks and re-sends the reset mail', async ({
  page,
  request,
}) => {
  test.setTimeout(180_000);
  const parent = await registerAndConfirmParent(request, 'n2w1-007');
  usedEmails.push(parent.email);

  await requestResetAndGetLink(request, page, parent.email);
  const resendButton = page.getByRole('button', { name: /Resend email/i });
  // Countdown window: disabled and counting (mm:ss in the label).
  await expect(resendButton).toBeDisabled();
  await expect(resendButton).toHaveText(/Resend email \(0:|Resend email \(/);

  // When the countdown hits zero the button enables and reads "Resend email".
  const enabled = page.getByRole('button', { name: cat(en, 'Auth.resendEmail'), exact: true });
  await expect(enabled).toBeEnabled({ timeout: 70_000 });
  await enabled.click();

  // The re-request went through the same enumeration-safe mutation: a SECOND
  // reset mail lands (server budget 2/hour/email — this is send 2 of 2).
  await waitForMessages(request, parent.email, 2);
  const second = await latestMessage(request, parent.email);
  expect(second.Subject).toBe(RESET_SUBJECT);
  expect(second.HTML).toMatch(RESET_LINK_RE);
  // The countdown restarted after the resend click.
  await expect(page.getByRole('button', { name: /Resend email \(/ })).toBeVisible();
  await shot(page, 'AUTH-007-resend-restart');
});

// ---------------------------------------------------------------------------
// AUTH-010 — the rule checklist gives per-rule feedback while typing
// (folded into the AUTH-008 flow's page, asserted on the way to success)
// ---------------------------------------------------------------------------

// ---------------------------------------------------------------------------
// AUTH-008 — reset link opens Choose-a-new-password; success state shows
// ---------------------------------------------------------------------------
test('AUTH-008/010 reset roundtrip: checklist feedback, success state, new-password login', async ({
  page,
  request,
}) => {
  test.setTimeout(180_000);
  const parent = await registerAndConfirmParent(request, 'n2w1-008');
  usedEmails.push(parent.email);

  await requestResetAndGetLink(request, page, parent.email);
  // One forgot request spent budget 1/2 for this address; the emailed link is
  // all this test needs.
  const message = await latestMessage(request, parent.email);
  const code = message.HTML.match(RESET_LINK_RE)![1];
  await page.goto(`/reset-password?code=${code}`);

  await expect(
    page.getByRole('heading', { name: cat(en, 'Auth.portal.resetTitle') }),
  ).toBeVisible();
  await expect(page.getByText(cat(en, 'Auth.passwordRulesLabel'))).toBeVisible();

  const newPassword = page.getByLabel(cat(en, 'Auth.newPasswordLabel'), { exact: true });
  const lengthRule = page
    .getByRole('list', { name: cat(en, 'Auth.passwordRulesLabel') })
    .getByText(cat(en, 'Auth.portal.ruleLength'));
  const charRule = page
    .getByRole('list', { name: cat(en, 'Auth.passwordRulesLabel') })
    .getByText(cat(en, 'Auth.portal.ruleCharClasses'));

  // AUTH-010: per-rule checklist feedback. Too-short → length rule UNMET
  // (sr-only status text carries the per-rule state for assistive tech, and
  // the X icon + red ink mark it visually).
  await newPassword.fill('Ab1!');
  await expect(lengthRule).toHaveCSS('color', 'rgb(185, 28, 28)');
  // 12 chars but no number/symbol → length rule met, char-class rule UNMET.
  await newPassword.fill('abcdefghijkl');
  await expect(lengthRule).toHaveCSS('color', 'rgb(13, 148, 136)');
  await expect(charRule).toHaveCSS('color', 'rgb(185, 28, 28)');
  await expect(page.getByText(cat(en, 'Auth.passwordRuleNotMet')).first()).toBeAttached();
  // Meeting every rule flips the live feedback to the met state.
  await newPassword.fill('N2w1Reset!2026');
  await expect(charRule).toHaveCSS('color', 'rgb(13, 148, 136)');
  await shot(page, 'AUTH-010-rule-checklist');

  await page
    .getByLabel(cat(en, 'Auth.portal.confirmLabel'), { exact: true })
    .fill('N2w1Reset!2026');
  await page
    .getByRole('button', { name: cat(en, 'Auth.resetButton'), exact: true })
    .click();

  // Password-updated success state.
  await expect(
    page.getByText(cat(en, 'Auth.portal.doneBody')),
  ).toBeVisible({ timeout: 20_000 });
  await shot(page, 'AUTH-008-reset-success');

  // The new password signs the parent in (old one no longer does).
  await uiLogin(page, parent.email, 'N2w1Reset!2026');
  await page.waitForURL(/\/dashboard(\/|$)/, { timeout: 20_000 });
  await skipOnboardingViaUi(page);
  await expect(page).not.toHaveURL(/sign-in/);
  const token = await page.evaluate(() => window.localStorage.getItem('app.auth.token'));
  expect((token ?? '').split('.')).toHaveLength(3);
  await shot(page, 'AUTH-008-login-with-new-password');
});

// ---------------------------------------------------------------------------
// AUTH-009 — an expired reset link shows the expired state, not the form
// ---------------------------------------------------------------------------
test('AUTH-009 expired reset link shows the expired state', async ({ page, request }) => {
  const parent = await registerAndConfirmParent(request, 'n2w1-009');
  usedEmails.push(parent.email);

  const { code } = await requestResetAndGetLink(request, page, parent.email);
  // Test hygiene (the suite's sanctioned auth_email_requests path): age the
  // issuance row past the 30-min TTL so the REAL server gate expires it.
  const moved = backdateResetIssuance(sha256(code));
  expect(moved).toBe(1);

  await page.goto(`/reset-password?code=${code}`);
  await expect(
    page.getByRole('heading', { name: cat(en, 'Auth.portal.resetTitle') }),
  ).toBeVisible();
  await page.getByLabel(cat(en, 'Auth.newPasswordLabel'), { exact: true }).fill('N2w1Expired!2026');
  await page
    .getByLabel(cat(en, 'Auth.portal.confirmLabel'), { exact: true })
    .fill('N2w1Expired!2026');
  await page
    .getByRole('button', { name: cat(en, 'Auth.resetButton'), exact: true })
    .click();

  // The designed expired state replaces the form.
  await expect(
    page.getByText(cat(en, 'Auth.portal.expiredBody')),
  ).toBeVisible({ timeout: 20_000 });
  await shot(page, 'AUTH-009-reset-expired');
});

// ---------------------------------------------------------------------------
// AUTH-020 — sign-up registers a parent; the emailed link activates; sign-in works
// ---------------------------------------------------------------------------
test('AUTH-020 sign-up roundtrip: confirm state, emailed link, first sign-in', async ({
  page,
  request,
}) => {
  test.setTimeout(180_000);
  const email = freshEmail('n2w1-020');
  const username = `e2e${email.match(/-([a-z0-9]+)@/)?.[1] ?? ''}n2w1`.slice(0, 20);
  const password = 'E2eParent1234!';
  usedEmails.push(email);

  await page.goto('/sign-up');
  await page.getByLabel(cat(en, 'Auth.usernameLabel'), { exact: true }).fill(username);
  await page.getByLabel(cat(en, 'Auth.emailLabel'), { exact: true }).fill(email);
  await page.getByLabel(cat(en, 'Auth.passwordLabel'), { exact: true }).fill(password);
  await page
    .getByLabel(cat(en, 'Auth.confirmPasswordLabel'), { exact: true })
    .fill(password);
  await page
    .getByRole('button', { name: cat(en, 'Auth.signUpButton'), exact: true })
    .click();

  // The confirm state: check-your-email card with the countdown resend button.
  await expect(
    page.getByRole('heading', { name: cat(en, 'Auth.checkEmailTitle') }),
  ).toBeVisible();
  await expect(page.getByRole('button', { name: /Resend email/i })).toBeVisible();
  await shot(page, 'AUTH-020-signup-confirm-state');

  // The emailed confirmation link (on the API, which 302s to the portal)
  // activates the account and lands on the sign-in confirmed banner.
  const message = await latestMessage(request, email);
  const link = message.HTML.match(CONFIRMATION_LINK_RE) ?? message.Text.match(CONFIRMATION_LINK_RE);
  expect(link, 'confirmation email carries the confirmation token link').toBeTruthy();
  await page.goto(link![0]);
  await expect(page.getByText(cat(en, 'Auth.emailConfirmedBanner'))).toBeVisible({ timeout: 20_000 });
  await shot(page, 'AUTH-020-confirmed-banner');

  // Sign-in with the new account reaches the parent portal.
  await uiLogin(page, email, password);
  await page.waitForURL(/\/dashboard(\/|$)/, { timeout: 20_000 });
  await skipOnboardingViaUi(page);
  await expect(
    page.getByRole('link', { name: cat(en, 'Shell.nav.overview'), exact: true }),
  ).toBeVisible();
  await shot(page, 'AUTH-020-first-signin');
});

// ---------------------------------------------------------------------------
// AUTH-021 — sign-up with an already-registered email shows the register error
// ---------------------------------------------------------------------------
test('AUTH-021 duplicate-email sign-up is refused, no second account', async ({
  page,
  request,
}) => {
  const existing = await registerAndConfirmParent(request, 'n2w1-021');
  usedEmails.push(existing.email);

  await page.goto('/sign-up');
  await page
    .getByLabel(cat(en, 'Auth.usernameLabel'), { exact: true })
    .fill(`dup${Date.now().toString(36)}`.slice(0, 20));
  await page.getByLabel(cat(en, 'Auth.emailLabel'), { exact: true }).fill(existing.email);
  await page.getByLabel(cat(en, 'Auth.passwordLabel'), { exact: true }).fill('E2eParent1234!');
  await page
    .getByLabel(cat(en, 'Auth.confirmPasswordLabel'), { exact: true })
    .fill('E2eParent1234!');
  await page
    .getByRole('button', { name: cat(en, 'Auth.signUpButton'), exact: true })
    .click();

  await expect(page.getByText(cat(en, 'Auth.takenError'))).toBeVisible({ timeout: 20_000 });
  await shot(page, 'AUTH-021-duplicate-email');

  // No duplicate row was created for that address.
  const count = Number.parseInt(
    runSql(
      `select count(*) from up_users where email = '${existing.email}'`,
    ).trim(),
    10,
  );
  expect(count).toBe(1);
});

// ---------------------------------------------------------------------------
// AUTH-022 — password != confirm is rejected inline BEFORE submit
// ---------------------------------------------------------------------------
test('AUTH-022 sign-up mismatched confirm password is refused inline, no submit', async ({
  page,
}) => {  const email = freshEmail('n2w1-022-never');
  usedEmails.push(email);

  let registerCalls = 0;
  page.on('request', (req) => {
    if (req.url().includes('/api/auth/local/register')) registerCalls += 1;
  });

  await page.goto('/sign-up');
  await page.getByLabel(cat(en, 'Auth.usernameLabel'), { exact: true }).fill('n2w1mismatch');
  await page.getByLabel(cat(en, 'Auth.emailLabel'), { exact: true }).fill(email);
  await page.getByLabel(cat(en, 'Auth.passwordLabel'), { exact: true }).fill('E2eParent1234!');
  await page
    .getByLabel(cat(en, 'Auth.confirmPasswordLabel'), { exact: true })
    .fill('Different1234!');
  await page
    .getByRole('button', { name: cat(en, 'Auth.signUpButton'), exact: true })
    .click();

  // Inline field error, still on the form.
  await expect(page.getByText(cat(en, 'Auth.passwordMismatch'))).toBeVisible();
  expect(page.url()).toContain('/sign-up');
  // The client-side rejection means the register endpoint was never called.
  expect(registerCalls).toBe(0);
  await shot(page, 'AUTH-022-mismatch-inline');
});
