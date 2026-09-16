/**
 * FLEET-7 / 05 — idiot-proofing the invite flows: double-clicking Send must
 * produce exactly ONE email; refreshing mid-accept-form must not corrupt the
 * acceptance; going BACK after accepting must never allow a stale resubmit.
 *
 * Screenshots: tests/e2e/captures/fleet7/5*-*.png
 */
import { expect, test } from '@playwright/test';

import {
  cat,
  en,
  freshEmail,
  icu,
  inviteEmailFor,
  loginAsPage,
  mailpitCount,
  mintSchoolInvite,
  screenshotMailpitMessage,
  shot,
  signOut,
} from './helpers/fleet7';

const PASSWORD = 'F7Invite!2026d';

test.describe('F7-05 idiot-proofing', () => {
  test.describe.configure({ mode: 'serial' });
  test.setTimeout(240_000);

  test('double-clicking Send invitation sends exactly ONE email', async ({ page, request }) => {
    const email = freshEmail('doubleclick');

    await loginAsPage(page, 'schoolAdmin');
    await page.goto('/dashboard/school/teachers');
    const surface = page.locator('[data-surface="school-admin-teachers"]');
    await expect(surface).toBeVisible({ timeout: 60_000 });

    await page.getByRole('button', { name: cat(en, 'Teachers.addButton') }).click();
    await expect(page.getByText(cat(en, 'Teachers.invite.title'))).toBeVisible({ timeout: 30_000 });
    await page.locator('#inv-first-name').fill('Du');
    await page.locator('#inv-last-name').fill('Ble');
    await page.locator('#inv-email').fill(email);

    // Two rapid clicks — no waiting between them.
    const submit = page.getByRole('button', { name: cat(en, 'Teachers.invite.submit'), exact: true });
    await submit.click();
    await submit.click({ timeout: 5_000 }).catch(() => {
      // The dialog may close under the second click — that is acceptable
      // behaviour; the email count below is the contract.
    });

    // Exactly ONE invitation email lands in Mailpit for the address.
    await inviteEmailFor(request, email, 1);
    await page.waitForTimeout(5_000); // give a duplicate mail time to show up if it exists
    const count = await mailpitCount(request, email);
    expect(count, `exactly one email after double submit (got ${count})`).toBe(1);
    await screenshotMailpitMessage(page, request, email, '50-doubleclick-single-email');
  });

  test('refresh mid-accept-form keeps the acceptance working', async ({ page, request }) => {
    const email = freshEmail('refresh');
    const invite = await mintSchoolInvite(request, email);
    const { invitePath } = await inviteEmailFor(request, email, 1);

    await page.goto(invitePath);
    await expect(
      page.getByRole('heading', { name: new RegExp(cat(en, 'Invite.welcomeTitle').replace('{school}', '.*')) }),
    ).toBeVisible({ timeout: 60_000 });
    await page.locator('#invite-password').fill(PASSWORD);
    await page.locator('#invite-confirm-password').fill(PASSWORD);
    await shot(page, '51-accept-form-mid-fill');

    // Reload mid-form: fields reset (no stale secrets), the invite still works.
    await page.reload();
    await expect(
      page.getByRole('heading', { name: new RegExp(cat(en, 'Invite.welcomeTitle').replace('{school}', '.*')) }),
    ).toBeVisible({ timeout: 60_000 });
    await expect(page.locator('#invite-password')).toHaveValue('', { timeout: 30_000 });
    await shot(page, '52-accept-form-after-refresh');

    await page.locator('#invite-password').fill(PASSWORD);
    await page.locator('#invite-confirm-password').fill(PASSWORD);
    await page.getByRole('button', { name: cat(en, 'Invite.form.submit'), exact: true }).click();
    await page.waitForURL(/\/dashboard/, { timeout: 60_000 });
    await shot(page, '53-accepted-after-refresh');
  });

  test('back after accepting never allows a stale resubmit', async ({ page, request }) => {
    const email = freshEmail('back');
    const invite = await mintSchoolInvite(request, email);
    const { invitePath } = await inviteEmailFor(request, email, 1);

    await page.goto(invitePath);
    await expect(
      page.getByRole('heading', { name: new RegExp(cat(en, 'Invite.welcomeTitle').replace('{school}', '.*')) }),
    ).toBeVisible({ timeout: 60_000 });
    await page.locator('#invite-first-name').fill('Ba');
    await page.locator('#invite-last-name').fill('Ck');
    await page.locator('#invite-password').fill(PASSWORD);
    await page.locator('#invite-confirm-password').fill(PASSWORD);
    await page.getByRole('button', { name: cat(en, 'Invite.form.submit'), exact: true }).click();
    await page.waitForURL(/\/dashboard/, { timeout: 60_000 });
    await shot(page, '54-accepted-lands');

    // Browser BACK after acceptance.
    await page.goBack();
    await page.waitForTimeout(3_000);
    await shot(page, '55-back-after-accept');

    // Whatever renders, the form must not be usable for a second activation:
    // either the used/refusal state, or the dashboard redirect. The submit
    // button must NOT be present and the URL must not be the fresh form.
    const submitVisible = await page
      .getByRole('button', { name: cat(en, 'Invite.form.submit'), exact: true })
      .isVisible()
      .catch(() => false);
    expect(submitVisible, 'no activatable accept form after BACK').toBe(false);
    const body = await page.evaluate(() => document.body.innerText);
    const refusalShown =
      body.includes(cat(en, 'Invite.errors.usedTitle'))
      || body.includes(cat(en, 'Invite.errors.invalidTitle'))
      || /dashboard/i.test(page.url());
    expect(refusalShown, `BACK after accept shows refusal or dashboard (url=${page.url()})`).toBe(true);

    // And a fresh open of the same link refuses outright.
    await signOut(page);
    await page.goto(invitePath);
    await expect(page.getByText(cat(en, 'Invite.errors.usedTitle'))).toBeVisible({
      timeout: 60_000,
    });
    await shot(page, '56-reopened-after-accept-refused');
  });
});
