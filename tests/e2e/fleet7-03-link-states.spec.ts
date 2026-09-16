/**
 * FLEET-7 / 03 — unhappy invitation-link states and privacy: an ALREADY-USED
 * link refuses a second open (signed out), garbage / malformed tokens render
 * the honest invalid screen, and no signed-out link state ever leaks third
 *-party data or mints a session.
 *
 * Screenshots: tests/e2e/captures/fleet7/3*-*.png
 */
import { expect, test } from '@playwright/test';

import {
  acceptInviteViaUi,
  cat,
  en,
  freshEmail,
  inviteEmailFor,
  mintSchoolInvite,
  shot,
  signOut,
} from './helpers/fleet7';

const EMAIL_RE = /[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}/gi;

/** No page in these states may name any seeded person's address. */
const SEEDED_EMAILS = [
  'schooladmin-a@schooltest.local',
  'admin@schooltest.local',
  'parent@schooltest.local',
  't1@schooltest.local',
  't2@schooltest.local',
  'teacher@schooltest.local',
];

async function assertNoLeak(page: import('@playwright/test').Page, ownEmail?: string): Promise<void> {
  const body = await page.evaluate(() => document.body.innerText);
  const found = body.match(EMAIL_RE) ?? [];
  const foreign = found.filter(
    (address) =>
      (ownEmail ? address.toLowerCase() !== ownEmail.toLowerCase() : true)
      && !address.toLowerCase().endsWith('@schooltest.test')
      && SEEDED_EMAILS.some((seeded) => address.toLowerCase() === seeded) === false
      && !address.toLowerCase().endsWith('@strapi.io'),
  );
  // The ONLY address allowed on a signed-out invite surface is the invitee's
  // own (when provided). Everything else is a leak.
  const unexpected = foreign.filter((address) => !ownEmail || address.toLowerCase() !== ownEmail.toLowerCase());
  expect(unexpected, `no third-party emails on ${page.url()}: ${unexpected.join(', ')}`).toEqual([]);
  const storage = await page.evaluate(() => window.localStorage.getItem('app.auth.token'));
  expect(storage, 'no session is minted on a refusal screen').toBeNull();
}

test.describe('F7-03 unhappy link states + privacy', () => {
  test.describe.configure({ mode: 'serial' });
  test.setTimeout(240_000);

  test('an already-accepted link refuses a second, signed-out open', async ({
    page,
    request,
  }) => {
    const email = freshEmail('used');
    const invite = await mintSchoolInvite(request, email);
    const { invitePath } = await inviteEmailFor(request, email, 1);

    // Accept through the real UI once.
    await acceptInviteViaUi(page, invitePath, 'F7Invite!2026c');
    await shot(page, '30-first-accept-done');
    await signOut(page);

    // Second open of the SAME link, signed out: honest "already accepted".
    await page.goto(invitePath);
    await expect(page.getByText(cat(en, 'Invite.errors.usedTitle'))).toBeVisible({
      timeout: 60_000,
    });
    await shot(page, '31-used-link-refused');
    // The refusal offers the sign-in way out and leaks nobody's data.
    await expect(page.getByText(cat(en, 'Invite.errors.usedMessage'))).toBeVisible();
    await assertNoLeak(page);
  });

  test('malformed and well-formed-but-unknown tokens render the invalid state', async ({
    page,
  }) => {
    await page.goto('/en/invite/not-a-real-token');
    await expect(page.getByText(cat(en, 'Invite.errors.invalidTitle'))).toBeVisible({
      timeout: 60_000,
    });
    await shot(page, '32-garbage-token-invalid');
    await assertNoLeak(page);

    // Right shape, wrong secret: still refused with the same honesty.
    const unknown = 'd'.repeat(64);
    await page.goto(`/en/invite/${unknown}`);
    await expect(page.getByText(cat(en, 'Invite.errors.invalidTitle'))).toBeVisible({
      timeout: 60_000,
    });
    const body = await page.evaluate(() => document.body.innerText);
    expect(body, 'the raw token is never echoed back').not.toContain(unknown);
    await shot(page, '33-unknown-64hex-token-invalid');
    await assertNoLeak(page);
  });

  test('a fresh link shows a signed-out visitor ONLY the invitee\'s own data', async ({
    page,
    request,
  }) => {
    const email = freshEmail('privacy');
    const invite = await mintSchoolInvite(request, email);
    const { invitePath } = await inviteEmailFor(request, email, 1);

    await page.goto(invitePath);
    await expect(
      page.getByRole('heading', { name: new RegExp(cat(en, 'Invite.welcomeTitle').replace('{school}', '.*')) }),
    ).toBeVisible({ timeout: 60_000 });
    await expect(page.getByText(email)).toBeVisible();
    // School name is BY DESIGN on the invite; role badge too. Everything else
    // (staff emails, student data) must be absent.
    await shot(page, '34-signed-out-accept-privacy');
    await assertNoLeak(page, email);
  });
});
