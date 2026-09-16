/**
 * FLEET-7 / 02 — invitation lifecycle through the school-admin UI: RESEND
 * (second email, fresh token, old link dies), REVOKE (row leaves the pending
 * table, both links refuse), duplicate-email invites (409 inline), and the
 * reissue path. Screenshots: tests/e2e/captures/fleet7/2*-*.png
 */
import { expect, test } from '@playwright/test';

import {
  cat,
  en,
  freshEmail,
  inviteEmailFor,
  icu,
  loginAsPage,
  mailpitCount,
  schoolAdminJwt,
  screenshotMailpitMessage,
  shot,
  signOut,
} from './helpers/fleet7';

const API = 'http://127.0.0.1:5500';

test.describe('F7-02 invite lifecycle: resend / revoke / duplicate', () => {
  test.describe.configure({ mode: 'serial' });
  test.setTimeout(240_000);

  test('resend issues a second email whose new link works while the old link dies', async ({
    page,
    request,
  }) => {
    const email = freshEmail('resend');
    const password = 'F7Invite!2026b';

    await loginAsPage(page, 'schoolAdmin');
    await page.goto('/dashboard/school/teachers');
    const surface = page.locator('[data-surface="school-admin-teachers"]');
    await expect(surface).toBeVisible({ timeout: 60_000 });

    // Invite through the dialog.
    await page.getByRole('button', { name: cat(en, 'Teachers.addButton') }).click();
    await page.locator('#inv-first-name').fill('Re');
    await page.locator('#inv-last-name').fill('Senda');
    await page.locator('#inv-email').fill(email);
    await page.getByRole('button', { name: cat(en, 'Teachers.invite.submit'), exact: true }).click();
    await expect(page.getByText(icu(cat(en, 'Teachers.invite.successToast'), { email }))).toBeVisible({
      timeout: 30_000,
    });

    // Email #1 arrives; grab its token.
    const first = await inviteEmailFor(request, email, 1);
    const firstPath = first.invitePath;
    await screenshotMailpitMessage(page, request, email, '20-mailpit-first-invite');

    // RESEND from the row menu (the Mailpit render replaced the document, so
    // navigate back to the staff screen first).
    await page.goto('/dashboard/school/teachers');
    await expect(surface).toBeVisible({ timeout: 60_000 });
    const search = page.getByPlaceholder(cat(en, 'Teachers.table.searchPlaceholder'));
    await search.fill(email);
    const row = surface.locator('[data-directory-row]', { hasText: email });
    await expect(row).toBeVisible({ timeout: 45_000 });
    await row.locator('[data-directory-row-menu] button').first().click();
    await page.getByRole('menuitem', { name: cat(en, 'Teachers.actions.reissue') }).click();
    await expect(
      page.getByText(icu(cat(en, 'Teachers.actions.reissuedToast'), { email })),
    ).toBeVisible({ timeout: 30_000 });
    await shot(page, '21-resend-toast');

    // Email #2 arrives — a NEW token (the old link is superseded).
    const second = await inviteEmailFor(request, email, 2);
    const secondToken = second.invitePath.split('/invite/')[1];
    const firstToken = firstPath.split('/invite/')[1];
    expect(secondToken, 'resend mints a different token').not.toBe(firstToken);
    await screenshotMailpitMessage(page, request, email, '22-mailpit-resend-email');

    // The OLD link must now refuse (product claim: previous link no longer
    // works). A signed-out visitor opens it.
    await signOut(page);
    await page.goto(firstPath);
    await expect(
      page
        .getByText(cat(en, 'Invite.errors.invalidTitle'))
        .or(page.getByText(cat(en, 'Invite.errors.usedTitle')))
        .or(page.getByText(cat(en, 'Invite.errors.expiredTitle'))),
    ).toBeVisible({ timeout: 60_000 });
    await shot(page, '23-old-link-refused-after-resend');

    // The NEW link still works — accept it to keep the flow self-contained.
    await page.goto(second.invitePath);
    await expect(
      page.getByRole('heading', { name: new RegExp(cat(en, 'Invite.welcomeTitle').replace('{school}', '.*')) }),
    ).toBeVisible({ timeout: 60_000 });
    await page.locator('#invite-first-name').fill('Re');
    await page.locator('#invite-last-name').fill('Senda');
    await page.locator('#invite-password').fill(password);
    await page.locator('#invite-confirm-password').fill(password);
    await page.getByRole('button', { name: cat(en, 'Invite.form.submit'), exact: true }).click();
    await page.waitForURL(/\/dashboard/, { timeout: 60_000 });
    await shot(page, '24-resend-new-link-accepted');
  });

  test('revoke removes the pending row and kills the link', async ({ page, request }) => {
    const email = freshEmail('revoke');

    await loginAsPage(page, 'schoolAdmin');
    await page.goto('/dashboard/school/teachers');
    const surface = page.locator('[data-surface="school-admin-teachers"]');
    await expect(surface).toBeVisible({ timeout: 60_000 });

    await page.getByRole('button', { name: cat(en, 'Teachers.addButton') }).click();
    await page.locator('#inv-first-name').fill('Re');
    await page.locator('#inv-last-name').fill('Voke');
    await page.locator('#inv-email').fill(email);
    await page.getByRole('button', { name: cat(en, 'Teachers.invite.submit'), exact: true }).click();
    await expect(page.getByText(icu(cat(en, 'Teachers.invite.successToast'), { email }))).toBeVisible({
      timeout: 30_000,
    });

    const { invitePath } = await inviteEmailFor(request, email, 1);

    // Revoke through the row menu (confirmed dialog).
    const search = page.getByPlaceholder(cat(en, 'Teachers.table.searchPlaceholder'));
    await search.fill(email);
    const row = surface.locator('[data-directory-row]', { hasText: email });
    await expect(row).toBeVisible({ timeout: 45_000 });
    await row.locator('[data-directory-row-menu] button').first().click();
    await page.getByRole('menuitem', { name: cat(en, 'Teachers.actions.revoke') }).click();
    await page
      .getByRole('button', { name: cat(en, 'Teachers.actions.revokeConfirm'), exact: true })
      .click();
    await expect(
      page.getByText(icu(cat(en, 'Teachers.actions.revokedToast'), { email })),
    ).toBeVisible({ timeout: 30_000 });
    await shot(page, '25-revoke-toast');

    // Cross-check: the pending row disappears from the staff table.
    await expect(row).toHaveCount(0, { timeout: 45_000 });
    await shot(page, '26-revoked-row-gone');

    // And the link refuses a signed-out visitor.
    await signOut(page);
    await page.goto(invitePath);
    await expect(
      page
        .getByText(cat(en, 'Invite.errors.invalidTitle'))
        .or(page.getByText(cat(en, 'Invite.errors.usedTitle')))
        .or(page.getByText(cat(en, 'Invite.errors.expiredTitle'))),
    ).toBeVisible({ timeout: 60_000 });
    await shot(page, '27-revoked-link-refused');
  });

  test('inviting an email that already holds a PENDING invitation fails clearly', async ({
    page,
  }) => {
    const email = freshEmail('dupe');

    await loginAsPage(page, 'schoolAdmin');
    await page.goto('/dashboard/school/teachers');
    const surface = page.locator('[data-surface="school-admin-teachers"]');
    await expect(surface).toBeVisible({ timeout: 60_000 });

    // First invite succeeds.
    await page.getByRole('button', { name: cat(en, 'Teachers.addButton') }).click();
    await page.locator('#inv-first-name').fill('Du');
    await page.locator('#inv-last-name').fill('Pe');
    await page.locator('#inv-email').fill(email);
    await page.getByRole('button', { name: cat(en, 'Teachers.invite.submit'), exact: true }).click();
    await expect(page.getByText(icu(cat(en, 'Teachers.invite.successToast'), { email }))).toBeVisible({
      timeout: 30_000,
    });
    await page.keyboard.press('Escape');

    // Second invite of the SAME address: the dialog must refuse inline.
    await page.getByRole('button', { name: cat(en, 'Teachers.addButton') }).click();
    await page.locator('#inv-first-name').fill('Du');
    await page.locator('#inv-last-name').fill('Pe');
    await page.locator('#inv-email').fill(email);
    await page.getByRole('button', { name: cat(en, 'Teachers.invite.submit'), exact: true }).click();
    const emailError = page.locator('#inv-email-error');
    await expect(emailError).toBeVisible({ timeout: 30_000 });
    expect((await emailError.innerText()).trim()).not.toBe('');
    await shot(page, '28-duplicate-pending-invite-inline-error');
  });

  test('invalid email is refused inline before anything is sent', async ({ page, request }) => {
    await loginAsPage(page, 'schoolAdmin');
    await page.goto('/dashboard/school/teachers');
    await expect(page.locator('[data-surface="school-admin-teachers"]')).toBeVisible({
      timeout: 60_000,
    });

    await page.getByRole('button', { name: cat(en, 'Teachers.addButton') }).click();
    await page.locator('#inv-first-name').fill('Ba');
    await page.locator('#inv-last-name').fill('Dmail');
    await page.locator('#inv-email').fill('definitely-not-an-email');
    await page.getByRole('button', { name: cat(en, 'Teachers.invite.submit'), exact: true }).click();
    await expect(page.locator('#inv-email-error')).toBeVisible({ timeout: 15_000 });
    await shot(page, '29-invalid-email-inline-error');

    // Nothing was sent: no invitation row, no email for the garbage address.
    const jwt = await schoolAdminJwt(request);
    const sent = await request.get(`${API}/api/schools/me/invitations`, {
      headers: { Authorization: `Bearer ${jwt}` },
    });
    const rows = ((await sent.json()) as { data: Array<{ email: string }> }).data.filter(
      (candidate) => candidate.email.includes('definitely-not-an-email'),
    );
    expect(rows, 'no invitation row for a malformed address').toHaveLength(0);
    expect(await mailpitCount(request, 'definitely-not-an-email@schooltest.local')).toBe(0);
  });
});
