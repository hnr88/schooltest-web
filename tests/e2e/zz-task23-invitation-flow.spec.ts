import { execSync } from 'node:child_process';

import { expect, test, type APIRequestContext, type Page } from '@playwright/test';

import { cat, loadMessages } from './helpers/i18n';
import { roleCredentials } from './helpers/credentials';

// Task 23 (st-mvp-pivot) targeted live checks — NOT part of the suite.
// Full invitation loop through the real UI against the live stack:
//  - school_admin invites a teacher from /dashboard/school/teachers (C-INV-01)
//  - the token is read from Mailpit, the guest accept page (C-INV-05/06) signs
//    the teacher in and lands on /dashboard/teach
//  - the accepted teacher shows Active in the staff table; deactivate and
//    reactivate toggle the row (C-TCH-02); reissue resends email (C-INV-03);
//    revoke removes the row (C-INV-04)
//  - bogus / expired / accepted invite links render their dedicated screens
//  - SchoolAdminGuard keeps a teacher off the Teachers page
const en = loadMessages('en');

const API = 'http://127.0.0.1:5500';
const MAILPIT = 'http://127.0.0.1:8125';
const SCHOOL_ADMIN = roleCredentials('schoolAdmin');
const TEACHER = roleCredentials('teacher');
const SCHOOL_NAME = 'SchoolTest Demo School A';

const RUN = Date.now();
const INVITED = { first: 'Play', last: 'Wright', email: `task23-e2e-${RUN}@schooltest.local` };
const REISSUED = { first: 'Rei', last: 'ssue', email: `task23-e2e-re-${RUN}@schooltest.local` };
const PASSWORD = 'Task23!pass';

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

async function inviteTokenFor(request: APIRequestContext, email: string): Promise<string> {
  await expect
    .poll(
      async () => {
        const list = await request.get(`${MAILPIT}/api/v1/messages`);
        const { messages } = (await list.json()) as {
          messages: { ID: string; To: { Address: string }[] }[];
        };
        const hit = messages.find((m) => m.To.some((t) => t.Address === email));
        if (!hit) return null;
        const detail = await request.get(`${MAILPIT}/api/v1/message/${hit.ID}`);
        const { Text } = (await detail.json()) as { Text: string };
        const match = Text.match(/\/en\/invite\/([a-f0-9]{64})/);
        return match ? match[1] : null;
      },
      { timeout: 20_000, intervals: [500, 1_000, 2_000] },
    )
    .not.toBeNull();
  const list = await request.get(`${MAILPIT}/api/v1/messages`);
  const { messages } = (await list.json()) as {
    messages: { ID: string; To: { Address: string }[] }[];
  };
  const hit = messages.find((m) => m.To.some((t) => t.Address === email));
  const detail = await request.get(`${MAILPIT}/api/v1/message/${hit!.ID}`);
  const { Text } = (await detail.json()) as { Text: string };
  return Text.match(/\/en\/invite\/([a-f0-9]{64})/)![1];
}

async function inviteViaUi(page: Page, first: string, last: string, email: string): Promise<void> {
  await page.getByRole('button', { name: cat(en, 'Teachers.addButton') }).click();
  // FieldShell appends a required marker to the label, so the inputs are
  // located by their stable ids instead of the accessible name.
  await page.locator('#inv-first-name').fill(first);
  await page.locator('#inv-last-name').fill(last);
  await page.locator('#inv-email').fill(email);
  await page.getByRole('button', { name: cat(en, 'Teachers.invite.submit'), exact: true }).click();
}

test.describe('task 23: invitation flow + teachers screen', () => {
  test.describe.configure({ mode: 'serial' });

  test('full loop: invite, accept, staff list, toggle, reissue, revoke', async ({
    page,
    request,
  }) => {
    await signIn(page, SCHOOL_ADMIN.email, SCHOOL_ADMIN.password);
    await page.goto('/dashboard/school/teachers');
    const surface = page.locator('[data-surface="school-admin-teachers"]');
    await expect(surface).toBeVisible({ timeout: 20_000 });

    // C-INV-01 through the dialog; the invited row appears after invalidation.
    await inviteViaUi(page, INVITED.first, INVITED.last, INVITED.email);
    const invitedRow = surface.locator('tr', { hasText: INVITED.email });
    await expect(invitedRow).toBeVisible({ timeout: 20_000 });
    await expect(
      invitedRow.getByText(cat(en, 'Teachers.table.status.invited'), { exact: true }),
    ).toBeVisible();

    // The invite email carries the /en/invite/<token> link (Mailpit).
    const token = await inviteTokenFor(request, INVITED.email);

    // C-INV-05 renders the welcome screen with school, role and email.
    await page.goto(`/en/invite/${token}`);
    await expect(
      page.getByRole('heading', { name: `Welcome to ${SCHOOL_NAME}` }),
    ).toBeVisible({ timeout: 20_000 });
    await expect(page.getByText(INVITED.email)).toBeVisible();
    await expect(
      page.getByText(cat(en, 'Invite.roles.teacher'), { exact: true }),
    ).toBeVisible();

    // C-INV-06 accepts and lands signed in on the teacher dashboard.
    await page.locator('#invite-password').fill(PASSWORD);
    await page.locator('#invite-confirm-password').fill(PASSWORD);
    await page
      .getByRole('button', { name: cat(en, 'Invite.form.submit'), exact: true })
      .click();
    await page.waitForURL('**/dashboard/teach', { timeout: 30_000 });
    await expect(page.locator('[data-surface="teacher-home"]')).toBeVisible({ timeout: 20_000 });

    // The accepted link now renders the used screen (409).
    await page.goto(`/en/invite/${token}`);
    await expect(page.locator('[data-state="used"]')).toBeVisible({ timeout: 20_000 });

    // Back as the school admin: the new teacher is Active in the staff table.
    await page.evaluate(() => window.localStorage.clear());
    await signIn(page, SCHOOL_ADMIN.email, SCHOOL_ADMIN.password);
    await page.goto('/dashboard/school/teachers');
    const staffRow = surface.locator('tr', { hasText: INVITED.email });
    await expect(staffRow).toBeVisible({ timeout: 20_000 });
    // Spec section 3's Name column is avatar + full name, so an ACTIVE account
    // carries no status badge; only the rows the spec does not describe
    // (invited / expired / deactivated) do. `data-status` is the row's state.
    await expect(staffRow).toHaveAttribute('data-status', 'active');

    // C-TCH-02 deactivate (confirmed), then reactivate (confirmed).
    const displayName = `${INVITED.first} ${INVITED.last}`;
    await staffRow
      .getByLabel(cat(en, 'Teachers.actions.menuLabel').replace('{name}', displayName))
      .click();
    await page
      .getByRole('menuitem', { name: cat(en, 'Teachers.actions.deactivate') })
      .click();
    await page
      .getByRole('button', { name: cat(en, 'Teachers.actions.deactivateConfirm'), exact: true })
      .click();
    await expect(
      staffRow.getByText(cat(en, 'Teachers.table.status.deactivated'), { exact: true }),
    ).toBeVisible({ timeout: 20_000 });

    await staffRow
      .getByLabel(cat(en, 'Teachers.actions.menuLabel').replace('{name}', displayName))
      .click();
    await page
      .getByRole('menuitem', { name: cat(en, 'Teachers.actions.reactivate') })
      .click();
    await page
      .getByRole('button', { name: cat(en, 'Teachers.actions.reactivateConfirm'), exact: true })
      .click();
    await expect(staffRow).toHaveAttribute('data-status', 'active', { timeout: 20_000 });

    // C-INV-03 reissue on an invited row sends a fresh email; C-INV-04 revoke
    // (confirmed) removes the row.
    await inviteViaUi(page, REISSUED.first, REISSUED.last, REISSUED.email);
    const reissuedRow = surface.locator('tr', { hasText: REISSUED.email });
    await expect(reissuedRow).toBeVisible({ timeout: 20_000 });
    const reName = `${REISSUED.first} ${REISSUED.last}`;
    await reissuedRow
      .getByLabel(cat(en, 'Teachers.actions.menuLabel').replace('{name}', reName))
      .click();
    await page.getByRole('menuitem', { name: cat(en, 'Teachers.actions.reissue') }).click();
    await expect(
      reissuedRow.getByText(cat(en, 'Teachers.table.status.invited'), { exact: true }),
    ).toBeVisible();
    const newToken = await inviteTokenFor(request, REISSUED.email);
    expect(newToken).toMatch(/^[a-f0-9]{64}$/);

    await reissuedRow
      .getByLabel(cat(en, 'Teachers.actions.menuLabel').replace('{name}', reName))
      .click();
    await page.getByRole('menuitem', { name: cat(en, 'Teachers.actions.revoke') }).click();
    await page
      .getByRole('button', { name: cat(en, 'Teachers.actions.revokeConfirm'), exact: true })
      .click();
    await expect(reissuedRow).toHaveCount(0, { timeout: 20_000 });
  });

  test('bogus and expired invite links render their dedicated screens', async ({
    page,
    request,
  }) => {
    await page.goto('/en/invite/not-a-real-token');
    await expect(page.locator('[data-state="invalid"]')).toBeVisible({ timeout: 20_000 });

    // Expired: create an invitation via the API, age it past expiry in the DB.
    const jwt = await adminJwt(request);
    const email = `task23-expired-${RUN}@schooltest.local`;
    const res = await request.post(`${API}/api/schools/me/invitations`, {
      headers: { Authorization: `Bearer ${jwt}` },
      data: { email, first_name: 'Ex', last_name: 'Pired', role: 'teacher' },
    });
    const { data } = (await res.json()) as { data: { documentId: string; invite_url: string } };
    execSync(
      `docker exec -e PGPASSWORD=wizhBo7fa7h2-szhi1HxBYz1 schooltest-api-st1-postgres ` +
        `psql -U schooltest -d schooltest_dev -c ` +
        `"UPDATE invitations SET expires_at = NOW() - INTERVAL '1 day' WHERE document_id = '${data.documentId}'"`,
    );
    const token = data.invite_url.split('/invite/')[1];
    await page.goto(`/en/invite/${token}`);
    await expect(page.locator('[data-state="expired"]')).toBeVisible({ timeout: 20_000 });
  });

  test('teacher role is bounced off the Teachers page', async ({ page }) => {
    await signIn(page, TEACHER.email, TEACHER.password);
    await page.goto('/dashboard/school/teachers');
    await page.waitForURL('**/dashboard/teach', { timeout: 20_000 });
    await expect(page.locator('[data-surface="school-admin-teachers"]')).toHaveCount(0);
  });
});
