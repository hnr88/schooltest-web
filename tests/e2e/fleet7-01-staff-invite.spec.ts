/**
 * FLEET-7 / 01 — school-admin staff invite, the full LIVE round trip through
 * the real UI: invite form → success toast → Mailpit email → signed-out
 * accept page (privacy) → activation → first sign-in → staff-list cross-check.
 *
 * Screenshots: tests/e2e/captures/fleet7/1*-*.png
 */
import { expect, test } from '@playwright/test';

import {
  acceptInviteViaUi,
  cat,
  en,
  freshEmail,
  icu,
  inviteEmailFor,
  loginAsPage,
  mailpitCount,
  screenshotMailpitMessage,
  schoolAdminJwt,
  shot,
  signOut,
} from './helpers/fleet7';

const PASSWORD = 'F7Invite!2026a';

test.describe('F7-01 school-admin staff invite round trip', () => {
  test.describe.configure({ mode: 'serial' });
  test.setTimeout(180_000);

  test('invite → email → accept → first sign-in → staff list', async ({ page, request }) => {
    const email = freshEmail('teacher');
    const jwt = await schoolAdminJwt(request);

    // --- 1. the admin drives the REAL invite dialog on the Teachers screen ---
    await loginAsPage(page, 'schoolAdmin');
    await page.goto('/dashboard/school/teachers');
    const surface = page.locator('[data-surface="school-admin-teachers"]');
    await expect(surface).toBeVisible({ timeout: 60_000 });
    await shot(page, '10-teachers-screen');

    await page.getByRole('button', { name: cat(en, 'Teachers.addButton') }).click();
    await expect(page.getByText(cat(en, 'Teachers.invite.title'))).toBeVisible({ timeout: 30_000 });
    await shot(page, '11-invite-form-empty');

    // Inline validation first: a malformed email must be refused client-side
    // with the FieldShell error paragraph (#inv-email-error).
    await page.locator('#inv-first-name').fill('Fleet');
    await page.locator('#inv-last-name').fill('Seven');
    await page.locator('#inv-email').fill('not-an-email');
    await page
      .getByRole('button', { name: cat(en, 'Teachers.invite.submit'), exact: true })
      .click();
    const emailError = page.locator('#inv-email-error');
    await expect(emailError).toBeVisible({ timeout: 15_000 });
    expect((await emailError.innerText()).trim(), 'inline error text is non-empty').not.toBe('');
    await shot(page, '12-invite-form-invalid-email');

    // The duplicate / already-has-account case (409) lands inline on email too.
    await page.locator('#inv-email').fill('t1@schooltest.local');
    await page
      .getByRole('button', { name: cat(en, 'Teachers.invite.submit'), exact: true })
      .click();
    await expect(
      page
        .getByText(cat(en, 'Teachers.invite.alreadyInSchool'))
        .or(page.locator('#inv-email-error').filter({ hasText: /.+/ })),
    ).toBeVisible({ timeout: 30_000 });
    await shot(page, '13-invite-form-duplicate-email');

    // Now the happy path — a fresh F7-stamped address.
    await page.locator('#inv-email').fill(email);
    await page
      .getByRole('button', { name: cat(en, 'Teachers.invite.submit'), exact: true })
      .click();
    await expect(
      page.getByText(icu(cat(en, 'Teachers.invite.successToast'), { email })),
    ).toBeVisible({ timeout: 30_000 });
    await shot(page, '14-invite-success-toast');

    // Exactly ONE invitation row was created server-side (count the API list).
    const list = await request.get(`${'http://127.0.0.1:5500'}/api/schools/me/invitations`, {
      headers: { Authorization: `Bearer ${jwt}` },
    });
    expect(list.ok()).toBeTruthy();
    const invitedRows = (
      (await list.json()) as { data: Array<{ email: string; status: string }> }
    ).data.filter((row) => row.email === email);
    expect(invitedRows.length, 'exactly one invitation row for the fresh address').toBe(1);

    // The invited row becomes visible in the staff table. Rows are the shared
    // directory kit's [data-directory-row] elements (the table is not a <tr>
    // grid any more), each carrying data-status. The table paginates and
    // name-sorts, so filter through the REAL search control exactly as an
    // admin would.
    const search = page.getByPlaceholder(cat(en, 'Teachers.table.searchPlaceholder'));
    await expect(search).toBeVisible({ timeout: 30_000 });
    await search.fill(email);
    const invitedRow = surface.locator('[data-directory-row]', { hasText: email });
    await expect(invitedRow).toBeVisible({ timeout: 45_000 });
    await expect(
      invitedRow.getByText(cat(en, 'Teachers.table.status.invited'), { exact: true }),
    ).toBeVisible();
    await shot(page, '15-staff-table-invited-row');
    await search.fill('');
    await signOut(page);

    // --- 2. the email lands in Mailpit, exactly once ---
    expect(await mailpitCount(request, email), 'one email for the fresh invite').toBe(1);
    const { message } = await inviteEmailFor(request, email);
    expect(message.Subject).toContain('has invited you to SchoolTest');
    await screenshotMailpitMessage(page, request, email, '16-mailpit-invite-email');

    // --- 3. a SIGNED-OUT visitor opens the accept link (privacy surface) ---
    const { invitePath } = await inviteEmailFor(request, email);
    await page.goto(invitePath);
    await expect(
      page.getByRole('heading', { name: new RegExp(cat(en, 'Invite.welcomeTitle').replace('{school}', '.*')) }),
    ).toBeVisible({ timeout: 60_000 });
    // The invitee's OWN email + role are on the page by design; nobody else's
    // data may leak to a signed-out visitor.
    await expect(page.getByText(email)).toBeVisible();
    const bodyText = await page.evaluate(() => document.body.innerText);
    const emailsOnPage = bodyText.match(/[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}/gi) ?? [];
    const foreign = emailsOnPage.filter((found) => found.toLowerCase() !== email.toLowerCase());
    expect(foreign, `no third-party emails on the signed-out accept page: ${foreign.join(',')}`)
      .toEqual([]);
    const storage = await page.evaluate(() => ({
      token: window.localStorage.getItem('app.auth.token'),
    }));
    expect(storage.token, 'signed-out accept page mints no session').toBeNull();
    await shot(page, '17-accept-page-signed-out');

    // --- 4. activate: names prefilled by contract, password set here ---
    await page.locator('#invite-password').fill(PASSWORD);
    await page.locator('#invite-confirm-password').fill(PASSWORD);
    await shot(page, '18-accept-form-filled');
    await page.getByRole('button', { name: cat(en, 'Invite.form.submit'), exact: true }).click();
    await page.waitForURL(/\/dashboard/, { timeout: 60_000 });
    const sessionToken = await page.evaluate(() => window.localStorage.getItem('app.auth.token'));
    expect((sessionToken ?? '').split('.')).toHaveLength(3);
    await page.waitForTimeout(2_000);
    await shot(page, '19-accepted-lands-dashboard');

    // --- 5. the account is real: first sign-in through the actual form ---
    await signOut(page);
    await page.goto('/sign-in');
    await page.getByLabel(cat(en, 'Auth.portal.emailLabel'), { exact: true }).fill(email);
    await page.getByLabel(cat(en, 'Auth.portal.passwordLabel'), { exact: true }).fill(PASSWORD);
    await page.getByRole('button', { name: cat(en, 'Auth.portal.loginButton'), exact: true }).click();
    await page.waitForURL(/\/dashboard/, { timeout: 30_000 });
    await page.waitForTimeout(2_000);
    await shot(page, '20-first-sign-in-new-account');

    // --- 6. cross-check: the accepted teacher is ACTIVE in the staff list ---
    await signOut(page);
    await loginAsPage(page, 'schoolAdmin');
    await page.goto('/dashboard/school/teachers');
    await expect(surface).toBeVisible({ timeout: 60_000 });
    const staffSearch = page.getByPlaceholder(cat(en, 'Teachers.table.searchPlaceholder'));
    await expect(staffSearch).toBeVisible({ timeout: 20_000 });
    await staffSearch.fill(email);
    const staffRow = surface.locator('[data-directory-row]', { hasText: email });
    await expect(staffRow).toBeVisible({ timeout: 45_000 });
    await expect(staffRow).toHaveAttribute('data-status', 'active');
    await staffRow.scrollIntoViewIfNeeded();
    await shot(page, '21-staff-list-active-crosscheck');
  });
});
