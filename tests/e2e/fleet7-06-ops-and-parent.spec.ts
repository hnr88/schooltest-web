/**
 * FLEET-7 / 06 — the OPS-portal staff invite (a second, distinct entry point
 * to the same invitation machinery) and the PARENT-INVITE existence check:
 * the ops portal invites a teacher into the seeded school, the emailed link is
 * accepted, and the new teacher appears in the ops Teachers tab. The parent
 * portal is swept for ANY invite affordance — none is expected to exist.
 *
 * Screenshots: tests/e2e/captures/fleet7/6*-*.png
 */
import { expect, test } from '@playwright/test';

import {
  apiGetSafe,
  cat,
  en,
  freshEmail,
  inviteEmailFor,
  loginAsPage,
  opsJwt,
  screenshotMailpitMessage,
  shot,
  signOut,
} from './helpers/fleet7';

const PASSWORD = 'F7Invite!2026e';
const OPS_SCHOOL_NAME = 'SchoolTest Demo School A';

test.describe('F7-06 ops staff invite + parent sweep', () => {
  test.describe.configure({ mode: 'serial' });
  test.setTimeout(300_000);

  test('ops invites a teacher through the ops portal; the link accepts', async ({
    page,
    request,
  }) => {
    const email = freshEmail('ops-teacher');

    await loginAsPage(page, 'ops');
    await page.goto('/dashboard/ops/schools');
    await expect(page.locator('[data-slot="ops-schools"]')).toBeVisible({ timeout: 60_000 });
    await shot(page, '60-ops-schools');

    // Open the seeded school's detail, Teachers tab. The documentId comes
    // from the ops contract (deterministic; no row-click racing).
    const jwt = await opsJwt(request);
    const schools = await apiGetSafe(request, '/api/ops/schools?pagination[pageSize]=100', {
      Authorization: `Bearer ${jwt}`,
    });
    const school = ((await schools.json()) as { data: Array<{ documentId: string; name: string }> }).data.find(
      (candidate) => candidate.name === OPS_SCHOOL_NAME,
    );
    expect(school, 'seeded demo school is in the ops list').toBeTruthy();
    await page.goto(`/dashboard/ops/schools/${school!.documentId}`);
    await expect(page.locator('[data-surface="ops-school-detail"]')).toBeVisible({
      timeout: 60_000,
    });
    await page.getByRole('tab', { name: cat(en, 'Ops.schoolTables.tab.teachers') }).click();
    const invite = page.getByTestId('ops-teachers-invite');
    await invite.waitFor({ state: 'visible', timeout: 30_000 });
    await shot(page, '61-ops-teachers-tab');

    await invite.click();
    const dialog = page.locator('[data-slot="ops-staff-invitations-dialog"]');
    await dialog.waitFor({ state: 'visible', timeout: 30_000 });
    await shot(page, '62-ops-invite-dialog');

    await page.locator('#ops-invite-name').fill('Ops Invited Seven');
    await page.locator('#ops-invite-email').fill(email);
    await dialog.getByRole('button', { name: cat(en, 'Ops.staffInvitations.inviteSubmit'), exact: true }).click();
    await expect(dialog.getByText(cat(en, 'Ops.staffInvitations.inviteSentTitle'), { exact: true })).toBeVisible({
      timeout: 30_000,
    });
    await shot(page, '63-ops-invite-sent');
    await page.keyboard.press('Escape');

    // The invitation is in the ops dialog's own table as invited.
    const opsRow = dialog.locator('[data-slot="ops-staff-invitation-row"]', { hasText: email });
    await expect(opsRow).toBeVisible({ timeout: 30_000 });
    await expect(opsRow).toHaveAttribute('data-status', 'invited');

    // The email is real; accept it signed out.
    const { invitePath } = await inviteEmailFor(request, email, 1);
    await screenshotMailpitMessage(page, request, email, '64-mailpit-ops-invite-email');
    await signOut(page);
    await page.goto(invitePath);
    await expect(
      page.getByRole('heading', { name: new RegExp(cat(en, 'Invite.welcomeTitle').replace('{school}', '.*')) }),
    ).toBeVisible({ timeout: 60_000 });
    await page.locator('#invite-first-name').fill('Ops');
    await page.locator('#invite-last-name').fill('Seven');
    await page.locator('#invite-password').fill(PASSWORD);
    await page.locator('#invite-confirm-password').fill(PASSWORD);
    await shot(page, '65-ops-invite-accept-form');
    await page.getByRole('button', { name: cat(en, 'Invite.form.submit'), exact: true }).click();
    await page.waitForURL(/\/dashboard/, { timeout: 60_000 });
    await shot(page, '66-ops-invite-accepted-dashboard');

    // Cross-check: the ops dialog now shows the row accepted (has an account).
    await signOut(page);
    await loginAsPage(page, 'ops');
    await page.goto(`/dashboard/ops/schools/${school!.documentId}`);
    await expect(page.locator('[data-surface="ops-school-detail"]')).toBeVisible({ timeout: 60_000 });
    await page.getByRole('tab', { name: cat(en, 'Ops.schoolTables.tab.teachers') }).click();
    await page.getByTestId('ops-teachers-invite').click();
    await dialog.waitFor({ state: 'visible', timeout: 30_000 });
    const acceptedRow = dialog.locator('[data-slot="ops-staff-invitation-row"]', { hasText: email });
    await expect(acceptedRow).toBeVisible({ timeout: 30_000 });
    await expect(acceptedRow).toHaveAttribute('data-status', 'accepted');
    await shot(page, '67-ops-row-accepted');
  });

  test('parent portal offers NO invite affordance (feature does not exist)', async ({ page }) => {
    // Documented sweep: parents are linked by the school, never invited by
    // email — there is no parent-invitation contract in the API either.
    await loginAsPage(page, 'parent');
    await page.goto('/dashboard/children');
    await expect(page.locator('main')).toBeVisible({ timeout: 60_000 });
    await page.waitForTimeout(2_000);
    await shot(page, '68-parent-portal-children');

    const body = await page.evaluate(() => document.body.innerText);
    const inviteWords = body.match(/invit\w*/gi) ?? [];
    test.info().annotations.push({
      type: 'parent-invite-sweep',
      description:
        `children page invite-affordance words: [${inviteWords.join(', ') || 'none'}]. `
        + 'No parent/guardian invitation endpoint exists in the API (schooltest-api routes: '
        + 'school invitations, ops invitations, student magic link, teacher magic link only).',
    });
    // If such affordances ever appear, this soft check flags the report.
    expect(inviteWords.filter((word) => /invite/i.test(word)).length, 'parent invite affordances found — update this spec').toBe(0);
    await signOut(page);
  });
});
