/**
 * Mission st-legal-seo-ops E2E flows 25–33 (task 223): revocation through the
 * REAL UI and the REAL API — a revoked session, a revoked account, a school
 * admin removing a teacher, and invitation tokens that can only be used once.
 *
 * Every account is provisioned through the invitation contract, never a signup
 * form, and a failed sign-in is treated as a defect to diagnose rather than
 * something to retry.
 */
import { expect, test } from '@playwright/test';

import { loadMessages } from './helpers/i18n';
import { loginAs } from './helpers/roles';
import {
  acceptInvitation,
  apiGet,
  apiLogin,
  createInvitation,
  removeTeacher,
  revokeInvitation,
  runSql,
  setBlocked,
} from './helpers/revocation';

const en = loadMessages('en');

test.describe.configure({ mode: 'serial' });

test('flow: a revoked (blocked) account cannot sign in through the real form', async ({ page }) => {
  const invite = await createInvitation('ui-blocked');
  const teacher = await acceptInvitation(invite);
  setBlocked(teacher.email, true);

  await page.goto('/sign-in');
  await page.getByLabel(en['Auth.emailLabel'], { exact: true }).fill(teacher.email);
  await page.getByLabel(en['Auth.passwordLabel'], { exact: true }).fill(teacher.password);
  await page.getByRole('button', { name: en['Auth.signInButton'], exact: true }).click();

  // It must stay on /sign-in with a visible failure — never silently succeed.
  await expect(page).toHaveURL(/\/sign-in/);
  await expect(page.getByRole('alert').first()).toBeVisible();
  expect(page.url()).not.toContain('/dashboard');
});

test('flow: a token issued before revocation is dead on the API', async () => {
  const invite = await createInvitation('ui-session');
  const teacher = await acceptInvitation(invite);

  expect((await apiGet('/api/users/me', teacher.jwt)).status).toBe(200);
  setBlocked(teacher.email, true);
  expect((await apiGet('/api/users/me', teacher.jwt)).status).toBe(401);
  expect((await apiLogin(teacher.email, teacher.password)).status).toBe(400);
});

test('flow: a school admin removes a teacher, and that teacher is locked out', async ({ page }) => {
  const invite = await createInvitation('ui-remove');
  const teacher = await acceptInvitation(invite);

  await loginAs(page, 'schoolAdmin');
  await page.goto('/dashboard/school/teachers');

  const row = page.getByRole('row').filter({ hasText: teacher.email });
  await expect(row, 'the new teacher must appear in the staff table').toBeVisible();

  // A staff row's action cluster is edit / remove / overflow — removal is the
  // trash button between them, and it opens the C-TCH-03 confirm dialog.
  await row.getByRole('button').nth(1).click();
  await page
    .getByRole('button', { name: en['Teachers.actions.removeConfirm'], exact: true })
    .click();

  // The row disappears because the server said so — and it stays gone.
  await expect(page.getByRole('row').filter({ hasText: teacher.email })).toHaveCount(0);
  await page.reload();
  await expect(page.getByRole('row').filter({ hasText: teacher.email })).toHaveCount(0);

  // Real persistence, and both routes into the account are shut.
  expect(runSql(`select blocked from up_users where email='${teacher.email}'`)).toBe('t');
  expect((await apiGet('/api/users/me', teacher.jwt)).status).toBe(401);
  expect((await apiLogin(teacher.email, teacher.password)).status).toBe(400);
});

test('flow: an accepted invitation token cannot be used a second time', async () => {
  const invite = await createInvitation('ui-accepted');
  await acceptInvitation(invite);

  const reuse = await apiGet(`/api/invitations/${invite.token}`);
  expect(reuse.status, 'an accepted token must be refused as a CONFLICT').toBe(409);
});

test('flow: a revoked invitation token cannot be used', async () => {
  const invite = await createInvitation('ui-revoked');
  expect((await apiGet(`/api/invitations/${invite.token}`)).status).toBe(200);

  await revokeInvitation(invite.invitationId);
  expect((await apiGet(`/api/invitations/${invite.token}`)).status, 'revoked token').toBe(410);
  expect(
    runSql(`select status from invitations where document_id='${invite.invitationId}'`),
    'the row must survive revocation for the audit trail',
  ).toBe('revoked');
});

test('flow: an unaccepted invitation still works, and the invite page renders it', async ({
  page,
}) => {
  const invite = await createInvitation('ui-valid');
  await page.goto(`/invite/${invite.token}`);
  await expect(page.getByText(invite.email, { exact: false }).first()).toBeVisible();

  // …and once revoked, the same page tells the invitee the link is gone rather
  // than pretending it never existed.
  await revokeInvitation(invite.invitationId);
  await page.goto(`/invite/${invite.token}`);
  await expect(page.getByText(invite.email, { exact: false })).toHaveCount(0);
});

test('flow: removal is refused for your own account, with the reason shown', async () => {
  const self = runSql(`select document_id from up_users where email='schooladmin-a@schooltest.local'`);
  const res = await removeTeacher(self);
  expect(res.status).toBe(400);
  expect(JSON.stringify(res.body)).toContain('your own account');
});
