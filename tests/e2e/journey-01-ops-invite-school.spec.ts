/**
 * Journey J01 — ops invites a school and appoints its school admin.
 *
 * ONE chained test, entirely through the real UI against the real Strapi on
 * :5500, no mocks: ops signs in, creates a school through the Create School
 * modal — whose owner invitation IS the act of inviting the school, proven by
 * the emailed magic link in Mailpit — then appoints that school's admin
 * through the Admins tab invite dialog, the appointed person accepts through
 * the real emailed /invite/<token> link, and after a full browser reload the
 * school still shows in the ops schools list with its admin attached.
 * 1440x900 screenshots of every meaningful state land in
 * .qa/journeys/01-ops-invite-school/shots/.
 */
import { mkdirSync, writeFileSync } from 'node:fs';
import path from 'node:path';

import { expect, test, type Page, type TestInfo } from '@playwright/test';

import { runSql } from './helpers/auth-db';
import { cat, icu, loadMessages } from './helpers/i18n';
import { getMessage, searchMessages } from './helpers/mailpit';
import { cleanupSchool, opsJwt } from './helpers/ops-onboarding';
import { magicLinkFromEmail } from './helpers/ops-onboarding-db';
import { loginAs } from './helpers/roles';

const en = loadMessages('en');
const t = (key: string) => cat(en, `Ops.staffInvitations.${key}`);

const SHOTS = path.resolve(__dirname, '..', '..', '..', '.qa', 'journeys', '01-ops-invite-school', 'shots');
const VIEWPORT = { width: 1440, height: 900 };
// The directory kit's search input carries a useId()-generated id; the
// stable address is its toolbar slot + type.
const SEARCH = '[data-slot="directory-toolbar"] input[type="search"]';

const STAMP = Date.now();
const SCHOOL = {
  name: `J01 Journey School ${STAMP}`,
  suburb: 'Belmore',
  contact: 'Ada Lovelace',
  email: `j01-owner-${STAMP}@schooltest.local`,
};
const ADMIN = {
  first: 'Grace',
  last: 'Hopper',
  email: `j01-admin-${STAMP}@schooltest.local`,
  password: 'J01!journeyPass',
};

let schoolDocumentId = '';

const API_BASE = process.env.E2E_API_BASE_URL ?? 'http://127.0.0.1:5500';

/** The created school through the ops contract — rows are plain cells, not links. */
async function findSchoolRow(name: string): Promise<{ documentId: string; name: string } | null> {
  const res = await fetch(
    `${API_BASE}/api/ops/schools?q=${encodeURIComponent(name)}&pageSize=5`,
    { headers: { Authorization: `Bearer ${await opsJwt()}` } },
  );
  const rows = ((await res.json()) as { data?: { documentId: string; name: string }[] }).data ?? [];
  return rows.find((entry) => entry.name === name) ?? null;
}

async function shot(page: Page, testInfo: TestInfo, name: string): Promise<void> {
  const body = await page.screenshot();
  await testInfo.attach(`${name}.png`, { body, contentType: 'image/png' });
  mkdirSync(SHOTS, { recursive: true });
  writeFileSync(path.join(SHOTS, `${name}.png`), body);
}

/** Poll Mailpit for the admin invitation email; return its /invite token. */
async function inviteTokenFromEmail(request: import('@playwright/test').APIRequestContext, email: string): Promise<string> {
  for (let attempt = 0; attempt < 40; attempt += 1) {
    const found = await searchMessages(request, `to:${email}`);
    if (found.length > 0) {
      const message = await getMessage(request, found[0].ID);
      const match = message.Text.match(/\/(?:en\/)?invite\/([0-9a-f]{64})/);
      if (match) return match[1];
    }
    await new Promise((resolve) => setTimeout(resolve, 500));
  }
  throw new Error(`[j01] no invitation email reached ${email}`);
}

test('J01: ops invites a school, appoints its admin, the invite is accepted, and it all survives a reload', async ({
  page,
  request,
}, testInfo) => {
  test.setTimeout(240_000);
  await page.setViewportSize(VIEWPORT);

  // --- 1. ops signs in and opens the schools directory -------------------
  // The JWT lives in localStorage; a tab a previous session left signed in
  // would redirect /sign-in away and strand the form fill below. The public
  // landing is viewable unauthenticated, so clear the stale session there.
  await page.goto('/');
  await page.evaluate(() => window.localStorage.clear());
  await loginAs(page, 'ops');
  await page.goto('/dashboard/ops/schools');
  await expect(page.locator('[data-slot="ops-schools"]')).toBeVisible({ timeout: 60_000 });

  // --- 2. invite the school: Create School (owner invitation included) ---
  await page.getByTestId('ops-create-school').click();
  const dialog = page.locator('[data-slot="ops-create-school-dialog"]');
  await expect(dialog).toBeVisible();
  await page.locator('#create-school-name').fill(SCHOOL.name);
  await page.locator('#create-school-suburb').fill(SCHOOL.suburb);
  await page.locator('#create-school-contact-name').fill(SCHOOL.contact);
  await page.locator('#create-school-contact-email').fill(SCHOOL.email);
  await shot(page, testInfo, '01-create-school-form');
  await dialog.locator('button[type="submit"]').click();
  await expect(dialog).toBeHidden({ timeout: 30_000 });

  // The school is really on the server, and the filtered list shows it.
  await page.locator(SEARCH).fill(SCHOOL.name);
  const row = page.locator('[data-slot="ops-schools"] tbody tr', { hasText: SCHOOL.name });
  await expect(row).toBeVisible({ timeout: 30_000 });
  const created = await findSchoolRow(SCHOOL.name);
  if (!created) throw new Error('the created school was not found through the ops contract');
  schoolDocumentId = created.documentId;
  await shot(page, testInfo, '02-school-in-list');

  // "Invite a school" — the owner invitation went out by EMAIL.
  const ownerLink = await magicLinkFromEmail(SCHOOL.email, 1);
  expect(ownerLink).toContain('/school-onboarding/');

  // --- 3. appoint the school admin through the Admins tab ----------------
  // Direct route: rows are plain cells and the row-menu nav is the
  // ops-schools-open-navigation spec's own subject, not this journey's.
  await page.goto(`/dashboard/ops/schools/${schoolDocumentId}`);
  await expect(page.locator('[data-surface="ops-school-detail"]')).toBeVisible({ timeout: 60_000 });
  await expect(
    page.getByText(cat(en, 'Ops.schools.portalStatus.pending_setup'), { exact: true }),
  ).toBeVisible();
  await shot(page, testInfo, '03-school-detail-pending-setup');

  await page.getByRole('tab', { name: cat(en, 'Ops.schoolTables.tab.admins') }).click();
  await page.getByTestId('ops-admins-invite').click();
  const inviteDialog = page.locator('[data-slot="ops-staff-invitations-dialog"]');
  await expect(inviteDialog).toBeVisible();
  await page.locator('#ops-invite-role').click();
  await page.getByRole('option', { name: t('roleAdmin'), exact: true }).click();
  await page.locator('#ops-invite-name').fill(`${ADMIN.first} ${ADMIN.last}`);
  await page.locator('#ops-invite-email').fill(ADMIN.email);
  await inviteDialog.getByRole('button', { name: t('inviteSubmit'), exact: true }).click();
  await expect(inviteDialog.getByText(t('inviteSentTitle'), { exact: true })).toBeVisible({
    timeout: 30_000,
  });
  await shot(page, testInfo, '04-admin-invitation-sent');
  await page.keyboard.press('Escape');
  await expect(inviteDialog).toBeHidden();

  // --- 4. the appointed admin accepts through the emailed link -----------
  const token = await inviteTokenFromEmail(request, ADMIN.email);
  await page.goto(`/en/invite/${token}`);
  await expect(
    page.getByRole('heading', {
      name: icu(cat(en, 'Invite.welcomeTitle'), { school: SCHOOL.name }),
    }),
  ).toBeVisible({ timeout: 30_000 });
  await expect(
    page.locator('[data-slot="badge"]', { hasText: cat(en, 'Invite.roles.school_admin') }),
  ).toBeVisible();
  await shot(page, testInfo, '05-invite-acceptance');

  // The accept form's name fields are required by the client schema — a
  // submit without them fails validation client-side and never navigates.
  await page.locator('#invite-first-name').fill(ADMIN.first);
  await page.locator('#invite-last-name').fill(ADMIN.last);
  await page.locator('#invite-password').fill(ADMIN.password);
  await page.locator('#invite-confirm-password').fill(ADMIN.password);
  await page.getByRole('button', { name: cat(en, 'Invite.form.submit'), exact: true }).click();
  await page.waitForURL('**/dashboard/school**', { timeout: 30_000 });
  await expect(page.locator('[data-surface="school-admin-home"]')).toBeVisible({ timeout: 30_000 });
  await shot(page, testInfo, '06-admin-dashboard');

  // The acceptance is REAL: the invitation row reads accepted/school_admin.
  expect(
    runSql(
      `select status || '|' || role from invitations where email = '${ADMIN.email}' order by id desc limit 1`,
    ),
  ).toBe('accepted|school_admin');

  // --- 5. full reload: ops still sees the school with its admin ----------
  await page.evaluate(() => window.localStorage.clear());
  await loginAs(page, 'ops');
  await page.goto('/dashboard/ops/schools');
  await page.reload();
  await expect(page.locator('[data-slot="ops-schools"]')).toBeVisible({ timeout: 60_000 });
  await page.locator(SEARCH).fill(SCHOOL.name);
  const reloadedRow = page.locator('[data-slot="ops-schools"] tbody tr', { hasText: SCHOOL.name });
  await expect(reloadedRow).toBeVisible({ timeout: 30_000 });
  await expect(
    reloadedRow.getByText(cat(en, 'Ops.schools.portalStatus.pending_setup'), { exact: true }),
  ).toBeVisible();
  await expect(reloadedRow.getByRole('cell', { name: '1', exact: true })).toBeVisible();
  await shot(page, testInfo, '07-school-list-after-reload');

  await page.goto(`/dashboard/ops/schools/${schoolDocumentId}`);
  await expect(page.locator('[data-surface="ops-school-detail"]')).toBeVisible({ timeout: 60_000 });
  await page.getByRole('tab', { name: cat(en, 'Ops.schoolTables.tab.admins') }).click();
  await expect(
    page.locator('[data-surface="ops-school-detail"] tbody tr', { hasText: ADMIN.email }),
  ).toBeVisible({ timeout: 30_000 });
  await shot(page, testInfo, '08-admin-attached-after-reload');
});

test.afterAll(async () => {
  // Green runs capture the documentId right after the create; a run that died
  // earlier would otherwise strand the created school, so fall back to the
  // API search by the unique name.
  const documentId = schoolDocumentId || (await findSchoolRow(SCHOOL.name))?.documentId || '';
  if (documentId) await cleanupSchool(documentId, [ADMIN.email]);
});
