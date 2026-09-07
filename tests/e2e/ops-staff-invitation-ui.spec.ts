import path from 'node:path';

import { expect, test } from '@playwright/test';

import { apiEnv } from './helpers/auth-db';
import { cat, loadMessages } from './helpers/i18n';

// GAP-1 visual proof — the ops staff invitations flow through the REAL portal:
// the "Invite staff" control on the Admins and Teachers tabs, the dialog's
// invite form, filters and invitations table, and the per-status eligibility
// of the Resend/Revoke actions column.
//
// RENDER-LEVEL ONLY: this spec never submits, resends or revokes anything —
// the only writes it may trigger are the sign-in itself. Exactly ONE login
// happens (the UI sign-in); the API reads reuse that session's JWT from
// localStorage, so the per-IP auth budget is spent once.
//
// Screenshots are attached to the test result AND saved under the mission
// captures directory as gap1-e2e-*, desktop and 375px.

const en = loadMessages('en');
const API = process.env.E2E_API_URL ?? 'http://127.0.0.1:5500';
// The mission captures directory sits at the PROJECT ROOT; this spec lives two
// directories below the web repo, so resolve from __dirname instead of the
// runner's process cwd (which depends on who launches the Tests run).
const CAPTURES =
  process.env.GAP1_CAPTURES_DIR
  ?? path.resolve(__dirname, '..', '..', '..', '.codephant', 'missions', 'msn-0da39441-f845-426b-88a1-037c9eb98442', 'captures');

test.describe('ops staff invitation UI (GAP-1 visual proof)', () => {
  test('invite control opens the invitations dialog on both staff tabs; actions follow row status', async ({
    page,
  }, testInfo) => {
    // --- the one login ---
    await page.goto('/sign-in');
    await page.getByLabel(cat(en, 'Auth.emailLabel'), { exact: true }).fill('apiadmin@schooltest.local');
    await page.getByLabel(cat(en, 'Auth.passwordLabel'), { exact: true }).fill(apiEnv('SEED_APIADMIN_PASSWORD'));
    await page.getByRole('button', { name: cat(en, 'Auth.signInButton'), exact: true }).click();
    await page.waitForURL('**/dashboard');

    // --- pick a real school with the session's JWT (read-only) ---
    const token = await page.evaluate(() => window.localStorage.getItem('app.auth.token'));
    expect(token, 'the sign-in must leave a JWT in localStorage').toBeTruthy();
    const schoolsRes = await page.request.get(`${API}/api/ops/schools?pagination[pageSize]=1`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    expect(schoolsRes.ok()).toBeTruthy();
    const schools = (await schoolsRes.json()) as { data: Array<{ documentId: string }> };
    expect(schools.data.length, 'the sweep needs at least one seeded school').toBeGreaterThan(0);
    const schoolDocumentId = schools.data[0].documentId;

    // --- Teachers tab: the invite control is mounted ---
    await page.goto(`/dashboard/ops/schools/${schoolDocumentId}?tab=teachers`);
    const teachersInvite = page.getByTestId('ops-teachers-invite');
    await teachersInvite.waitFor({ state: 'visible', timeout: 60_000 });
    await teachersInvite.scrollIntoViewIfNeeded();
    await page.waitForTimeout(500);
    const teachersShot = await page.screenshot({ path: `${CAPTURES}/gap1-e2e-teachers-desktop.png` });
    await testInfo.attach('gap1-e2e-teachers-desktop.png', {
      body: teachersShot,
      contentType: 'image/png',
    });

    // --- Admins tab: the same control is mounted there too ---
    await page.getByRole('tab', { name: cat(en, 'Ops.schoolTables.tab.admins') }).click();
    const adminsInvite = page.getByTestId('ops-admins-invite');
    await adminsInvite.waitFor({ state: 'visible', timeout: 30_000 });

    // --- open the dialog from Teachers and assert its render states ---
    await page.getByRole('tab', { name: cat(en, 'Ops.schoolTables.tab.teachers') }).click();
    await teachersInvite.waitFor({ state: 'visible', timeout: 30_000 });
    await teachersInvite.click();
    const dialog = page.locator('[data-slot="ops-staff-invitations-dialog"]');
    await dialog.waitFor({ state: 'visible', timeout: 30_000 });
    await expect(dialog.getByText(cat(en, 'Ops.staffInvitations.inviteEmailLabel'), { exact: true })).toBeVisible();
    await expect(dialog.getByRole('button', { name: cat(en, 'Ops.staffInvitations.inviteSubmit') })).toBeVisible();
    await expect(
      dialog.locator('table').getByText(cat(en, 'Ops.staffInvitations.columnActions')),
    ).toBeVisible();

    // Eligibility is render-derived: only invited/expired rows act; terminal
    // and unknown rows never render the controls. No row is clicked.
    const rows = dialog.locator('[data-slot="ops-staff-invitations-table"] tr[data-status]');
    const rowCount = await rows.count();
    const seen: string[] = [];
    let actionableRows = 0;
    for (let index = 0; index < rowCount; index += 1) {
      const row = rows.nth(index);
      const status = await row.getAttribute('data-status');
      seen.push(status ?? '(none)');
      const actionable = status === 'invited' || status === 'expired';
      if (actionable) actionableRows += 1;
      expect(
        await row.locator('[data-slot="ops-staff-invitation-row-actions"]').count(),
        `row ${index} (status=${status}) actions column`,
      ).toBe(actionable ? 1 : 0);
    }
    expect(rowCount, 'the seeded school has invitation history to render').toBeGreaterThan(0);

    // WHICH HALF OF THE RULE THIS LIVE RUN ACTUALLY PROVES. The loop above is
    // only as strong as the statuses the seeded data happens to contain, and a
    // green tick hides which branch ran. Recording the observed set makes the
    // coverage auditable instead of implied, and would fail loudly the day the
    // table renders a status the eligibility rule does not know about.
    const statuses = [...new Set(seen)].sort();
    testInfo.annotations.push({
      type: 'eligibility-coverage',
      description:
        `rows=${rowCount} statuses=[${statuses.join(', ')}] actionable=${actionableRows}. `
        + 'The POSITIVE branch (invited/expired => Resend + Revoke) is proven at component level in '
        + 'tests/unit/ops-staff-invitation-actions.test.tsx, which covers all four statuses plus the '
        + 'no-status and no-renderActions cases; it cannot be proven here without creating an '
        + 'invitation, and live mutations are out of scope for this spec.',
    });
    for (const status of statuses) {
      expect(
        ['invited', 'expired', 'accepted', 'revoked', '(none)'],
        `rendered status "${status}" must be one the eligibility rule handles`,
      ).toContain(status);
    }

    // The Actions COLUMN survives even when no row is eligible — that is what
    // proves `renderActions` is wired through the table at all, independently
    // of which statuses the seed happens to hold.
    const actionsHeader = dialog.locator('table thead').getByText(cat(en, 'Ops.staffInvitations.columnActions'));
    await expect(actionsHeader).toBeVisible();

    // The table lives in an `overflow-x-auto` container
    // (OpsStaffInvitationTable.tsx:46), so at 1280 the Actions column sits
    // outside the frame and a plain page screenshot proves nothing about it.
    // Scroll it into view before capturing, or the image is of the wrong half
    // of the table.
    await actionsHeader.scrollIntoViewIfNeeded();
    await page.waitForTimeout(400);
    const dialogShot = await page.screenshot({ path: `${CAPTURES}/gap1-e2e-dialog-desktop.png` });
    await testInfo.attach('gap1-e2e-dialog-desktop.png', { body: dialogShot, contentType: 'image/png' });

    // A tight capture of the table itself, so the Actions column and the
    // per-row eligibility are legible rather than a strip at the frame edge.
    const tableShot = await dialog
      .locator('[data-slot="ops-staff-invitations-table"]')
      .screenshot({ path: `${CAPTURES}/gap1-e2e-actions-column.png` });
    await testInfo.attach('gap1-e2e-actions-column.png', { body: tableShot, contentType: 'image/png' });

    // --- 375px: the same surfaces stay usable ---
    // Close the desktop dialog first: its modal overlay would otherwise
    // intercept the invite control's click below.
    await page.keyboard.press('Escape');
    await dialog.waitFor({ state: 'hidden', timeout: 30_000 });
    await page.setViewportSize({ width: 375, height: 812 });
    await teachersInvite.scrollIntoViewIfNeeded();
    await page.waitForTimeout(500);
    const teachersMobile = await page.screenshot({ path: `${CAPTURES}/gap1-e2e-teachers-mobile.png` });
    await testInfo.attach('gap1-e2e-teachers-mobile.png', {
      body: teachersMobile,
      contentType: 'image/png',
    });
    await teachersInvite.click();
    await dialog.waitFor({ state: 'visible', timeout: 30_000 });
    // Same overflow container at 375px — scroll the Actions column in so the
    // mobile capture shows it too.
    await dialog
      .locator('table thead')
      .getByText(cat(en, 'Ops.staffInvitations.columnActions'))
      .scrollIntoViewIfNeeded();
    await page.waitForTimeout(500);
    const dialogMobile = await page.screenshot({
      path: `${CAPTURES}/gap1-e2e-dialog-mobile.png`,
      fullPage: true,
    });
    await testInfo.attach('gap1-e2e-dialog-mobile.png', { body: dialogMobile, contentType: 'image/png' });
  });
});
