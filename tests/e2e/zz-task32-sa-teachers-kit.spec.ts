import { expect, test, type APIRequestContext, type Page } from '@playwright/test';
import path from 'node:path';

import { cat, loadMessages } from './helpers/i18n';
import { roleCredentials } from './helpers/credentials';

// ops/32 — the school-admin staff table (teachers + open invitations) on the
// shared directory kit. Asserts through the table's own stable slot
// (`school-staff-table`) and captures the task's two proof shots at 1440x900:
//   mvp/ops/proof/shots/32-sa-teachers.png           — the merged list
//   mvp/ops/proof/shots/32-sa-teachers-invited.png   — the Invited chip active
// The invited state is produced live (one API-created invitation, revoked
// again once captured) so the proof shows the state the design draws.
const en = loadMessages('en');

const API = 'http://127.0.0.1:5500';
const SCHOOL_ADMIN = roleCredentials('schoolAdmin');
const SHOT_DIR = path.resolve(process.cwd(), '../mvp/ops/proof/shots');
const RUN = Date.now();
const INVITE = {
  first_name: 'Kit',
  last_name: 'Proof',
  email: `task32-kit-${RUN}@schooltest.local`,
  role: 'teacher',
};

async function signIn(page: Page, email: string, password: string): Promise<void> {
  await page.goto('/sign-in');
  await page.getByLabel(cat(en, 'Auth.emailLabel'), { exact: true }).fill(email);
  await page.getByLabel(cat(en, 'Auth.passwordLabel'), { exact: true }).fill(password);
  await page.getByRole('button', { name: cat(en, 'Auth.signInButton'), exact: true }).click();
  await page.waitForURL('**/dashboard**', { timeout: 30_000 });
}

async function adminJwt(request: APIRequestContext): Promise<string> {
  const res = await request.post(`${API}/api/auth/local`, {
    data: { identifier: SCHOOL_ADMIN.email, password: SCHOOL_ADMIN.password },
  });
  const body = (await res.json()) as { jwt: string };
  return body.jwt;
}

async function openStaffTable(page: Page) {
  await page.setViewportSize({ width: 1440, height: 900 });
  await signIn(page, SCHOOL_ADMIN.email, SCHOOL_ADMIN.password);
  await page.goto('/dashboard/school/teachers');
  const surface = page.locator('[data-surface="school-admin-teachers"]');
  await expect(surface).toBeVisible({ timeout: 20_000 });
  // The kit table's own slot — the stable locator this migration adds.
  const table = page.locator('[data-slot="school-staff-table"]');
  await expect(table).toBeVisible({ timeout: 20_000 });
  return table;
}

test.describe('ops/32: staff table on the directory kit', () => {
  test('merged list renders through the kit; search, chips, sort and both captures', async ({
    page,
    request,
  }) => {
    const jwt = await adminJwt(request);
    const teachersRes = await request.get(`${API}/api/schools/me/teachers`, {
      headers: { Authorization: `Bearer ${jwt}` },
    });
    const teachers = ((await teachersRes.json()) as { data: { email: string; first_name: string | null }[] })
      .data;
    expect(teachers.length, 'the demo school must have staff for this capture').toBeGreaterThan(0);

    // A live pending invitation so the Invited state is real, not invented.
    const created = await request.post(`${API}/api/schools/me/invitations`, {
      headers: { Authorization: `Bearer ${jwt}` },
      data: INVITE,
    });
    expect(created.ok(), 'the proof invitation must be created').toBe(true);

    const table = await openStaffTable(page);
    const td = (key: string) => cat(en, `Teachers.table.${key}`);

    // The kit's toolbar: search, the design's status chips, the sort select.
    await expect(table.getByRole('textbox', { name: td('searchLabel') })).toBeVisible();
    for (const label of [td('filterAll'), td('statusActive'), td('statusInvited'), td('statusSuspended')]) {
      await expect(table.getByRole('button', { name: label, exact: true })).toBeVisible();
    }
    await expect(table.getByRole('combobox', { name: td('sortLabel') })).toBeVisible();

    // The design's four columns, now kit headers (Name is sortable).
    for (const header of ['columnName', 'columnEmail', 'columnClasses']) {
      await expect(table.getByRole('columnheader', { name: td(header), exact: true })).toBeVisible();
    }
    const nameHeader = table.getByRole('button', { name: td('columnName'), exact: true });
    await expect(nameHeader).toBeVisible();

    // The kit count line reports the WHOLE merged list (accounts + invitations).
    await expect(table.getByRole('status')).toHaveText(/Showing .+ of .+/);

    // An invitation row is distinguishable: pending badge + data-status.
    const invitedRow = table.locator('tr', { hasText: INVITE.email });
    await expect(invitedRow).toBeVisible({ timeout: 20_000 });
    await expect(invitedRow).toHaveAttribute('data-status', 'invited');
    await expect(
      invitedRow.getByText(td('status.invited'), { exact: true }),
    ).toBeVisible();
    await expect(
      invitedRow.getByText(td('classesPending'), { exact: true }),
    ).toBeVisible();

    // CAPTURE 1 — the merged list. 1440x900 viewport, no fullPage.
    await page.screenshot({ path: path.join(SHOT_DIR, '32-sa-teachers.png') });

    // Kit search (client mode): narrows the MERGED list to the needle.
    const needle = teachers[0];
    await table.getByRole('textbox', { name: td('searchLabel') }).fill(needle.first_name ?? '');
    await page.waitForTimeout(700); // search debounce settles before the URL write
    await expect(
      table.locator('tr', { hasText: needle.email }),
    ).toBeVisible({ timeout: 20_000 });

    // The name sort round-trips through the URL.
    await nameHeader.click();
    await expect(page).toHaveURL(/sort=name:desc/);
    await nameHeader.click();
    await expect(page).toHaveURL(/sort=name:asc/);

    // Clear filters resets the kit state.
    await table.getByRole('button', { name: td('clearFilters') }).click();
    await expect(page).not.toHaveURL(/sort=|q=/);

    // The status chips: Invited narrows to open invitations only.
    await table.getByRole('button', { name: td('statusInvited'), exact: true }).click();
    await expect(page).toHaveURL(/status=invited/);
    await expect(invitedRow).toBeVisible({ timeout: 20_000 });
    await expect(
      table.locator('tr', { hasText: needle.email }),
    ).toHaveCount(0);

    // CAPTURE 2 — the Invited chip active on the live invitation.
    await page.screenshot({ path: path.join(SHOT_DIR, '32-sa-teachers-invited.png') });

    // Cleanup: the proof invitation is revoked (kept for the audit trail).
    const list = await request.get(`${API}/api/schools/me/invitations`, {
      headers: { Authorization: `Bearer ${jwt}` },
    });
    const rows = ((await list.json()) as { data: { documentId: string; email: string }[] }).data;
    const mine = rows.find((row) => row.email === INVITE.email);
    if (mine) {
      await request.delete(`${API}/api/schools/me/invitations/${mine.documentId}`, {
        headers: { Authorization: `Bearer ${jwt}` },
      });
    }
  });
});
