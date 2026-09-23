/**
 * BUG-006 — a school admin assigns an INVITED (not yet activated) teacher to a
 * class right after inviting them; the class shows the pending state and links
 * to the teacher's account the moment they accept. A revoked invitation turns
 * the class into a "reassign teacher" state, and reassigning clears it.
 *
 * REQUIRES THE BUG-006 API (class.pending_teacher + the accept reconciliation)
 * to be running on the target Strapi — against an API without it the create
 * refuses `pending_teacher_documentId` as an unknown field and this spec fails
 * at step 2. Everything is real: a FRESH school whose only staff member is its
 * admin (helpers/bug005-006.ts), the portal UI for every admin action, the
 * public accept route for the invitee, and the API for the cross-checks.
 *
 * Screenshots: /Users/hunor.nagy/Desktop/live_feedback_1/proof/BUG-006/.
 */
import { expect, test, type Page } from '@playwright/test';

import {
  acceptInvitation,
  API,
  createSchoolWithAdminOnly,
  en,
  inviteTeacher,
  proofPath,
  removeSchool,
  signIn,
  signOut,
  teacherPerson,
  tokenFromInviteUrl,
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

let school: FreshSchool | null = null;
// Distinct first names: teacherPerson stamps all three in the same millisecond,
// so their full names would otherwise be identical in every picker and row.
const firstTeacher = { ...teacherPerson('bug006-first'), first: 'First' };
const secondTeacher = { ...teacherPerson('bug006-second'), first: 'Second' };
const thirdTeacher = { ...teacherPerson('bug006-third'), first: 'Third' };
const STAMP = Date.now();
const FIRST_CLASS = `BUG006 Pending 7A ${STAMP}`;
const SECOND_CLASS = `BUG006 Revoked 7B ${STAMP}`;
const THIRD_CLASS = `BUG006 Detail 7C ${STAMP}`;
let firstTeacherDocumentId = '';

const escapeRegExp = (value: string) => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
const fullName = (person: Person) => `${person.first} ${person.last}`;

async function adminClasses(): Promise<ClassRow[]> {
  const res = await fetch(`${API}/api/schools/me/classes`, {
    headers: { Authorization: `Bearer ${school?.adminJwt ?? ''}` },
  });
  expect(res.status).toBe(200);
  return ((await res.json()) as { data: ClassRow[] }).data;
}

async function openClasses(page: Page) {
  await page.goto('/en/dashboard/school/classes');
  const screen = page.locator('[data-slot="school-classes"]');
  await expect(screen).toBeVisible({ timeout: 30_000 });
  return screen;
}

function classRow(page: Page, name: string) {
  return page.getByRole('row', { name: new RegExp(escapeRegExp(name)) });
}

async function openClassDetail(page: Page, classDocumentId: string) {
  await page.goto(`/en/dashboard/school/classes/${classDocumentId}`);
  const detail = page.locator('[data-slot="school-class-detail"]');
  await expect(detail).toBeVisible({ timeout: 30_000 });
  return detail;
}

test.afterAll(async () => {
  if (!school) return;
  for (const row of await adminClasses().catch(() => [] as ClassRow[])) {
    await fetch(`${API}/api/schools/me/classes/${row.documentId}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${school.adminJwt}` },
    });
  }
  await removeSchool(school, [firstTeacher.email, secondTeacher.email, thirdTeacher.email]);
});

test('BUG-006: invite → assign the pending teacher at once → accept links the class → the teacher sees it', async ({
  page,
}) => {
  test.setTimeout(300_000);
  await page.setViewportSize({ width: 1440, height: 900 });
  school = await createSchoolWithAdminOnly('BUG006 Pending School');
  await signIn(page, school.admin);

  // ---- 1. The admin invites a teacher through the Teachers screen ----
  await page.goto('/en/dashboard/school/teachers');
  const teachersScreen = page.locator('[data-surface="school-admin-teachers"]');
  await expect(teachersScreen).toBeVisible({ timeout: 30_000 });
  await teachersScreen.getByRole('button', { name: cat(en, 'Teachers.addButton'), exact: true }).click();
  const inviteDialog = page.getByRole('dialog');
  await inviteDialog.getByLabel(cat(en, 'Teachers.invite.firstName')).fill(firstTeacher.first);
  await inviteDialog.getByLabel(cat(en, 'Teachers.invite.lastName')).fill(firstTeacher.last);
  await inviteDialog.getByLabel(cat(en, 'Teachers.invite.email')).fill(firstTeacher.email);
  const invitationPost = page.waitForResponse(
    (res) => res.url().includes('/api/schools/me/invitations') && res.request().method() === 'POST',
  );
  await inviteDialog.getByRole('button', { name: cat(en, 'Teachers.invite.submit'), exact: true }).click();
  const invitationResponse = await invitationPost;
  expect(invitationResponse.status()).toBe(201);
  const invitation = ((await invitationResponse.json()) as { data: { documentId: string; invite_url?: string } }).data;
  const token = tokenFromInviteUrl(invitation.invite_url);
  await expect(inviteDialog).toBeHidden();

  // ---- 2. IMMEDIATELY (no activation) create a class with that invited teacher ----
  const screen = await openClasses(page);
  // The pending invitation counts as an assignable teacher: no BUG-005 hint.
  await expect(screen.locator('[data-slot="add-class-blocked-hint"]')).toHaveCount(0);
  const addClass = screen.getByRole('button', { name: cat(en, 'Classes.addButton'), exact: true });
  await expect(addClass).toBeEnabled({ timeout: 30_000 });
  await page.screenshot({ path: proofPath('BUG-006', '01-classes-after-invite-no-hint.png'), animations: 'disabled' });

  await addClass.click();
  const classDialog = page.getByRole('dialog');
  await classDialog.getByLabel(cat(en, 'Classes.addForm.name')).fill(FIRST_CLASS);
  await classDialog.locator('#add-class-teacher').click();
  const pendingOption = page.getByRole('option', {
    name: icu(cat(en, 'Classes.teacherPicker.pendingOption'), { name: fullName(firstTeacher) }),
  });
  await expect(pendingOption).toBeVisible();
  await page.screenshot({ path: proofPath('BUG-006', '02-picker-invited-pending-option.png'), animations: 'disabled' });
  await pendingOption.click();
  const createPost = page.waitForRequest(
    (req) => req.url().endsWith('/api/schools/me/classes') && req.method() === 'POST',
  );
  await classDialog.getByRole('button', { name: cat(en, 'Classes.addForm.submit'), exact: true }).click();
  const createBody = (await createPost).postDataJSON() as Record<string, unknown>;
  expect(createBody).toEqual({ name: FIRST_CLASS, teacher_documentIds: [], pending_teacher_documentId: invitation.documentId });
  await expect(classDialog).toBeHidden({ timeout: 30_000 });

  // ---- 3. The row reads "Invited (pending)"; the API stores the INVITATION ----
  await screen.getByLabel(cat(en, 'Classes.list.searchLabel'), { exact: true }).fill(FIRST_CLASS);
  const row = classRow(page, FIRST_CLASS);
  const pendingCell = row.locator('[data-slot="class-pending-teacher"]');
  await expect(pendingCell).toHaveAttribute('data-state', 'pending', { timeout: 30_000 });
  await expect(row).toContainText(fullName(firstTeacher));
  await expect(row).toContainText(cat(en, 'Classes.table.teacherPending'));
  await page.screenshot({ path: proofPath('BUG-006', '03-row-teacher-invited-pending.png'), animations: 'disabled' });
  const before = (await adminClasses()).find((entry) => entry.name === FIRST_CLASS);
  expect(before?.teachers).toEqual([]);
  expect(before?.pending_teacher).toMatchObject({ documentId: invitation.documentId, state: 'pending' });

  // ---- 4. The teacher accepts (the emailed link's public leg) ----
  firstTeacherDocumentId = (await acceptInvitation(token, firstTeacher)).documentId;

  // No admin action: the class now carries the new account, pending cleared.
  const after = (await adminClasses()).find((entry) => entry.name === FIRST_CLASS);
  expect(after?.teachers.map((teacher) => teacher.documentId)).toEqual([firstTeacherDocumentId]);
  expect(after?.pending_teacher ?? null).toBeNull();
  await page.reload();
  await expect(screen).toBeVisible({ timeout: 30_000 });
  await screen.getByLabel(cat(en, 'Classes.list.searchLabel'), { exact: true }).fill(FIRST_CLASS);
  await expect(row).toContainText(fullName(firstTeacher), { timeout: 30_000 });
  await expect(row.locator('[data-slot="class-pending-teacher"]')).toHaveCount(0);
  await page.screenshot({ path: proofPath('BUG-006', '04-row-after-accept-linked.png'), animations: 'disabled' });

  // ---- 5. The new teacher signs in and sees the class ----
  await signOut(page);
  await signIn(page, firstTeacher);
  await page.goto('/dashboard/results');
  await expect(page.locator('[data-surface="teacher-results"]')).toHaveAttribute('data-status', 'ready', {
    timeout: 60_000,
  });
  await expect(page.getByText(FIRST_CLASS).first()).toBeVisible({ timeout: 30_000 });
  await page.screenshot({ path: proofPath('BUG-006', '05-teacher-sees-class.png'), animations: 'disabled' });
});

test('BUG-006: a revoked invitation surfaces "reassign teacher"; reassigning clears it', async ({ page }) => {
  test.setTimeout(240_000);
  expect(school, 'the first journey created the school').not.toBeNull();
  const fresh = school as FreshSchool;
  await page.setViewportSize({ width: 1440, height: 900 });

  // Setup through the API: a second invited teacher held as a class's pending teacher.
  const invite = await inviteTeacher(fresh.adminJwt, secondTeacher);
  const created = await fetch(`${API}/api/schools/me/classes`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${fresh.adminJwt}` },
    body: JSON.stringify({ name: SECOND_CLASS, teacher_documentIds: [], pending_teacher_documentId: invite.documentId }),
  });
  expect(created.status).toBe(201);

  // The admin revokes the invitation from the Teachers screen's API (C-INV-04).
  const revoked = await fetch(`${API}/api/schools/me/invitations/${invite.documentId}`, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${fresh.adminJwt}` },
  });
  expect(revoked.status).toBe(200);

  // A revoked invitation can no longer be assigned anywhere.
  const refused = await fetch(`${API}/api/schools/me/classes`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${fresh.adminJwt}` },
    body: JSON.stringify({ name: `${SECOND_CLASS} again`, pending_teacher_documentId: invite.documentId }),
  });
  expect(refused.status).toBe(400);

  await signIn(page, fresh.admin);
  const screen = await openClasses(page);
  await screen.getByLabel(cat(en, 'Classes.list.searchLabel'), { exact: true }).fill(SECOND_CLASS);
  const row = classRow(page, SECOND_CLASS);
  await expect(row.locator('[data-slot="class-pending-teacher"]')).toHaveAttribute('data-state', 'revoked', {
    timeout: 30_000,
  });
  await expect(row).toContainText(cat(en, 'Classes.table.teacherReassignRevoked'));
  await page.screenshot({ path: proofPath('BUG-006', '06-row-revoked-reassign-teacher.png'), animations: 'disabled' });

  // The class detail page carries the same reassign state.
  const secondClassId = (await adminClasses()).find((entry) => entry.name === SECOND_CLASS)?.documentId ?? '';
  const detail = await openClassDetail(page, secondClassId);
  const detailPending = detail.locator('[data-slot="class-teacher-pending"] [data-slot="class-pending-teacher"]');
  await expect(detailPending).toHaveAttribute('data-state', 'revoked', { timeout: 30_000 });
  await expect(detailPending).toContainText(cat(en, 'Classes.table.teacherReassignRevoked'));
  await page.screenshot({ path: proofPath('BUG-006', '06b-detail-revoked-reassign-teacher.png'), animations: 'disabled' });
  await openClasses(page);
  await screen.getByLabel(cat(en, 'Classes.list.searchLabel'), { exact: true }).fill(SECOND_CLASS);

  // Reassign through Edit class: the lapsed invitation is not preselected.
  await row.getByRole('button', { name: cat(en, 'Classes.list.rowMenuLabel'), exact: true }).click();
  await page.getByRole('menuitem', { name: cat(en, 'Classes.actions.edit'), exact: true }).click();
  const editDialog = page.getByRole('dialog');
  const teacherSelect = editDialog.getByLabel(cat(en, 'Classes.detail.edit.teacherLabel'));
  await expect(teacherSelect).toHaveValue('');
  await teacherSelect.selectOption({ label: fullName(firstTeacher) });
  await page.screenshot({ path: proofPath('BUG-006', '07-edit-reassign-teacher.png'), animations: 'disabled' });
  const patch = page.waitForRequest((req) => req.method() === 'PATCH' && req.url().includes('/api/schools/me/classes/'));
  await editDialog.getByRole('button', { name: cat(en, 'Classes.detail.edit.save'), exact: true }).click();
  expect((await patch).postDataJSON()).toMatchObject({
    teacher_documentIds: [firstTeacherDocumentId],
    pending_teacher_documentId: null,
  });
  await expect(editDialog).toBeHidden({ timeout: 30_000 });

  await expect(row).toContainText(fullName(firstTeacher), { timeout: 30_000 });
  await expect(row.locator('[data-slot="class-pending-teacher"]')).toHaveCount(0);
  await page.screenshot({ path: proofPath('BUG-006', '08-row-reassigned.png'), animations: 'disabled' });
  const reassigned = (await adminClasses()).find((entry) => entry.name === SECOND_CLASS);
  expect(reassigned?.teachers.map((teacher) => teacher.documentId)).toEqual([firstTeacherDocumentId]);
  expect(reassigned?.pending_teacher ?? null).toBeNull();
});

test('BUG-006: the class detail shows the pending teacher; assigning a real teacher there clears it', async ({
  page,
}) => {
  test.setTimeout(240_000);
  expect(school, 'the first journey created the school').not.toBeNull();
  const fresh = school as FreshSchool;
  await page.setViewportSize({ width: 1440, height: 900 });

  // Setup through the API: a third invited teacher held as a class's pending teacher.
  const invite = await inviteTeacher(fresh.adminJwt, thirdTeacher);
  const created = await fetch(`${API}/api/schools/me/classes`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${fresh.adminJwt}` },
    body: JSON.stringify({ name: THIRD_CLASS, teacher_documentIds: [], pending_teacher_documentId: invite.documentId }),
  });
  expect(created.status).toBe(201);
  const classDocumentId = ((await created.json()) as { data: { documentId: string } }).data.documentId;

  await signIn(page, fresh.admin);
  const detail = await openClassDetail(page, classDocumentId);
  const panelPending = detail.locator('[data-slot="class-teacher-pending"] [data-slot="class-pending-teacher"]');
  await expect(panelPending).toHaveAttribute('data-state', 'pending', { timeout: 30_000 });
  await expect(panelPending).toContainText(fullName(thirdTeacher));
  await expect(panelPending).toContainText(cat(en, 'Classes.table.teacherPending'));
  await page.screenshot({ path: proofPath('BUG-006', '09-detail-invited-pending.png'), animations: 'disabled' });

  // Assign a REAL teacher from the detail page.
  await detail.getByRole('button', { name: cat(en, 'Classes.detail.teachers.add'), exact: true }).click();
  const picker = page.getByRole('dialog');
  // The picker row is a <label> wrapping the checkbox, the name and the email,
  // so the checkbox's accessible name is the whole row; the email is unique.
  await picker.locator('label', { hasText: firstTeacher.email }).getByRole('checkbox').check();
  const patch = page.waitForRequest((req) => req.method() === 'PATCH' && req.url().includes(`/api/schools/me/classes/${classDocumentId}`));
  await picker.getByRole('button', { name: cat(en, 'Classes.detail.teachers.save'), exact: true }).click();
  expect((await patch).postDataJSON()).toEqual({ teacher_documentIds: [firstTeacherDocumentId] });
  await expect(picker).toBeHidden({ timeout: 30_000 });
  await expect(detail.locator('[data-slot="class-teacher-chip"]')).toContainText(fullName(firstTeacher), {
    timeout: 30_000,
  });
  await expect(detail.locator('[data-slot="class-teacher-pending"]')).toHaveCount(0);
  await page.screenshot({ path: proofPath('BUG-006', '10-detail-real-teacher-clears-pending.png'), animations: 'disabled' });

  // The pending link is gone server-side, so the invitee's later accept does
  // NOT silently add them to this class.
  const assigned = (await adminClasses()).find((entry) => entry.documentId === classDocumentId);
  expect(assigned?.pending_teacher ?? null).toBeNull();
  await acceptInvitation(invite.token, thirdTeacher);
  const afterAccept = (await adminClasses()).find((entry) => entry.documentId === classDocumentId);
  expect(afterAccept?.teachers.map((teacher) => teacher.documentId)).toEqual([firstTeacherDocumentId]);
});
