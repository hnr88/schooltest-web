/**
 * BUG-006 follow-up — the web half, on a FRESH school through the real API
 * (helpers/bug005-006.ts), portal UI for every admin action:
 *
 *  1. Bulk "Assign teachers" with an INVITED teacher skips every selected class
 *     that already has a teacher, names it before anything is sent, and PATCHes
 *     only the teacher-less classes — the staffed class keeps its teacher.
 *  2. A class whose invitation was revoked shows the invitee's name AND the whole
 *     "Invite revoked — reassign teacher" badge at 1280 and 1440 wide (the badge
 *     used to be clipped and the name squeezed to 0px).
 *  3. Renaming that class through Edit class sends ONLY the name, so the reassign
 *     state survives the save.
 *  4. The Teachers list names the classes already waiting on an invitation
 *     instead of "Assigned after joining".
 *
 * Runs against the CURRENT API (the web never sends a staffed class an invite).
 * The server-side refusal and the explicit replace live in
 * bug-006-followup-api.spec.ts, which needs the follow-up API.
 *
 * Screenshots: /Users/hunor.nagy/Desktop/live_feedback_1/proof/BUG-006/followup-*.png.
 */
import { expect, test, type Locator, type Page } from '@playwright/test';

import {
  acceptInvitation,
  API,
  createSchoolWithAdminOnly,
  en,
  inviteTeacher,
  proofPath,
  removeSchool,
  signIn,
  teacherPerson,
  type FreshSchool,
  type Person,
} from './helpers/bug005-006';
import { cat, icu } from './helpers/i18n';

test.describe.configure({ mode: 'serial' });

interface ClassRow {
  documentId: string;
  name: string;
  teachers: Array<{ documentId: string }>;
  pending_teacher?: { documentId: string; state: string } | null;
}

const STAMP = Date.now();
const active = { ...teacherPerson('bug006f-active'), first: 'Active' };
const invited = { ...teacherPerson('bug006f-invited'), first: 'Invited' };
const revoked = { ...teacherPerson('bug006f-revoked'), first: 'Revoked' };
const STAFFED = `BUG006F Staffed 7A ${STAMP}`;
const EMPTY = `BUG006F Empty 7B ${STAMP}`;
const LAPSED = `BUG006F Lapsed 7C ${STAMP}`;

let school: FreshSchool | null = null;
let activeId = '';
let invitedInvitationId = '';
const fullName = (person: Person) => `${person.first} ${person.last}`;
const escapeRegExp = (value: string) => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
const followup = (file: string) => proofPath('BUG-006', `followup-${file}`);

async function api<T>(path: string, init: RequestInit = {}): Promise<{ status: number; body: T }> {
  const res = await fetch(`${API}${path}`, {
    ...init,
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${school?.adminJwt ?? ''}`, ...init.headers },
  });
  return { status: res.status, body: (await res.json().catch(() => ({}))) as T };
}

async function adminClasses(): Promise<ClassRow[]> {
  const res = await api<{ data: ClassRow[] }>('/api/schools/me/classes');
  expect(res.status).toBe(200);
  return res.body.data;
}

const byName = async (name: string) => (await adminClasses()).find((row) => row.name === name);

async function openClasses(page: Page): Promise<Locator> {
  await page.goto('/en/dashboard/school/classes');
  const screen = page.locator('[data-slot="school-classes"]');
  await expect(screen).toBeVisible({ timeout: 30_000 });
  return screen;
}

async function searchRow(page: Page, screen: Locator, name: string): Promise<Locator> {
  await screen.getByLabel(cat(en, 'Classes.list.searchLabel'), { exact: true }).fill(name);
  const row = page.getByRole('row', { name: new RegExp(escapeRegExp(name)) });
  await expect(row).toBeVisible({ timeout: 30_000 });
  return row;
}

test.beforeAll(async () => {
  test.setTimeout(120_000);
  school = await createSchoolWithAdminOnly('BUG006 Followup School');
  const activeInvite = await inviteTeacher(school.adminJwt, active);
  activeId = (await acceptInvitation(activeInvite.token, active)).documentId;
  invitedInvitationId = (await inviteTeacher(school.adminJwt, invited)).documentId;
  const revokedInvite = await inviteTeacher(school.adminJwt, revoked);

  for (const body of [
    { name: STAFFED, teacher_documentIds: [activeId] },
    { name: EMPTY },
    { name: LAPSED, teacher_documentIds: [], pending_teacher_documentId: revokedInvite.documentId },
  ]) {
    const created = await api('/api/schools/me/classes', { method: 'POST', body: JSON.stringify(body) });
    expect(created.status, JSON.stringify(created.body)).toBe(201);
  }
  const revokedRes = await api(`/api/schools/me/invitations/${revokedInvite.documentId}`, { method: 'DELETE' });
  expect(revokedRes.status).toBe(200);
});

test.afterAll(async () => {
  if (!school) return;
  for (const row of await adminClasses().catch(() => [] as ClassRow[])) {
    await api(`/api/schools/me/classes/${row.documentId}`, { method: 'DELETE' });
  }
  await removeSchool(school, [active.email, invited.email, revoked.email]);
});

test('BUG-006 follow-up: bulk assign with an invited teacher skips the staffed class, names it, and keeps its teacher', async ({
  page,
}) => {
  test.setTimeout(180_000);
  await page.setViewportSize({ width: 1440, height: 900 });
  await signIn(page, (school as FreshSchool).admin);
  const screen = await openClasses(page);
  await screen.getByRole('button', { name: cat(en, 'Classes.assignTeachersButton'), exact: true }).click();
  const dialog = page.getByRole('dialog');
  await dialog.getByText(STAFFED, { exact: true }).click();
  await dialog.getByText(EMPTY, { exact: true }).click();
  await dialog
    .getByText(icu(cat(en, 'Classes.teacherPicker.pendingOption'), { name: fullName(invited) }), { exact: true })
    .click();

  const skipped = dialog.locator('[data-slot="assign-teachers-skipped"]');
  await expect(skipped).toContainText('1 class keeps its teacher');
  await expect(skipped).toContainText(`${STAFFED} won't be changed`);
  await expect(skipped).not.toContainText(EMPTY);
  await page.screenshot({ path: followup('01-bulk-invite-skips-staffed-class.png'), animations: 'disabled' });

  const patches: Array<{ url: string; body: unknown }> = [];
  page.on('request', (request) => {
    if (request.method() === 'PATCH' && request.url().includes('/api/schools/me/classes/')) {
      patches.push({ url: request.url(), body: request.postDataJSON() });
    }
  });
  const answered = page.waitForResponse((res) => res.request().method() === 'PATCH' && res.url().includes('/api/schools/me/classes/'));
  await dialog.getByRole('button', { name: cat(en, 'Classes.assignTeachers.submit'), exact: true }).click();
  expect((await answered).status()).toBe(200);
  await expect(dialog).toBeHidden({ timeout: 30_000 });

  const empty = await byName(EMPTY);
  const staffed = await byName(STAFFED);
  expect(patches).toEqual([
    { url: `${API}/api/schools/me/classes/${empty?.documentId}`, body: { teacher_documentIds: [], pending_teacher_documentId: invitedInvitationId } },
  ]);
  expect(staffed?.teachers.map((teacher) => teacher.documentId), 'the staffed class keeps its teacher').toEqual([activeId]);
  expect(staffed?.pending_teacher ?? null).toBeNull();
  expect(empty?.pending_teacher).toMatchObject({ documentId: invitedInvitationId, state: 'pending' });
});

for (const width of [1280, 1440]) {
  test(`BUG-006 follow-up: a revoked invite shows the name and the whole reassign badge at ${width}px`, async ({ page }) => {
    test.setTimeout(120_000);
    await page.setViewportSize({ width, height: 900 });
    await signIn(page, (school as FreshSchool).admin);
    const screen = await openClasses(page);
    const row = await searchRow(page, screen, LAPSED);
    const pending = row.locator('[data-slot="class-pending-teacher"]');
    await expect(pending).toHaveAttribute('data-state', 'revoked', { timeout: 30_000 });
    const name = pending.locator('[data-slot="class-pending-teacher-name"]');
    const badge = pending.locator('[data-slot="class-pending-teacher-badge"]');
    await expect(name).toHaveText(fullName(revoked));
    await expect(badge).toHaveText(cat(en, 'Classes.table.teacherReassignRevoked'));

    const cell = pending.locator('xpath=ancestor::*[self::td or @role="cell"][1]');
    const [nameBox, badgeBox, cellBox] = await Promise.all([name.boundingBox(), badge.boundingBox(), cell.boundingBox()]);
    expect(nameBox?.width ?? 0, 'the invitee name is not squeezed away').toBeGreaterThan(20);
    expect((badgeBox?.x ?? 0) + (badgeBox?.width ?? 0), 'the badge ends inside its cell').toBeLessThanOrEqual(
      (cellBox?.x ?? 0) + (cellBox?.width ?? 0) + 1,
    );
    const clipped = await badge.evaluate((element) => element.scrollWidth > element.clientWidth + 1);
    expect(clipped, 'the badge text is not clipped').toBe(false);
    await row.screenshot({ path: followup(`02-revoked-badge-row-${width}.png`), animations: 'disabled' });
    await page.screenshot({ path: followup(`02-revoked-badge-page-${width}.png`), animations: 'disabled' });
  });
}

test('BUG-006 follow-up: renaming a class whose invite was revoked sends only the name; the reassign state survives', async ({
  page,
}) => {
  test.setTimeout(120_000);
  await page.setViewportSize({ width: 1440, height: 900 });
  await signIn(page, (school as FreshSchool).admin);
  const screen = await openClasses(page);
  const row = await searchRow(page, screen, LAPSED);
  await row.getByRole('button', { name: cat(en, 'Classes.list.rowMenuLabel'), exact: true }).click();
  await page.getByRole('menuitem', { name: cat(en, 'Classes.actions.edit'), exact: true }).click();
  const dialog = page.getByRole('dialog');
  const renamed = `${LAPSED} renamed`;
  await dialog.getByLabel(cat(en, 'Classes.detail.edit.nameLabel')).fill(renamed);
  const patch = page.waitForRequest((req) => req.method() === 'PATCH' && req.url().includes('/api/schools/me/classes/'));
  await dialog.getByRole('button', { name: cat(en, 'Classes.detail.edit.save'), exact: true }).click();
  expect((await patch).postDataJSON()).toEqual({ name: renamed });
  await expect(dialog).toBeHidden({ timeout: 30_000 });

  const after = await byName(renamed);
  expect(after?.pending_teacher).toMatchObject({ state: 'revoked' });
  const renamedRow = await searchRow(page, screen, renamed);
  await expect(renamedRow.locator('[data-slot="class-pending-teacher"]')).toHaveAttribute('data-state', 'revoked');
  await page.screenshot({ path: followup('03-rename-keeps-reassign-state.png'), animations: 'disabled' });
});

test('BUG-006 follow-up: the Teachers list names the class already waiting on an invitation', async ({ page }) => {
  test.setTimeout(120_000);
  await page.setViewportSize({ width: 1440, height: 900 });
  await signIn(page, (school as FreshSchool).admin);
  await page.goto('/en/dashboard/school/teachers');
  const teachers = page.locator('[data-surface="school-admin-teachers"]');
  await expect(teachers).toBeVisible({ timeout: 30_000 });
  const row = teachers.getByRole('row', { name: new RegExp(escapeRegExp(fullName(invited))) });
  const cell = row.locator('[data-slot="staff-invite-classes"]');
  await expect(cell).toHaveText(icu(cat(en, 'Teachers.table.classesWaiting'), { classes: EMPTY }), { timeout: 30_000 });
  await expect(teachers).not.toContainText('Assigned after joining');
  await page.screenshot({ path: followup('04-teachers-list-invite-waiting-class.png'), animations: 'disabled' });
});
