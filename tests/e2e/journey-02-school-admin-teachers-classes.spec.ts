import path from 'node:path';

import { expect, test, type APIRequestContext, type Page } from '@playwright/test';

import { roleCredentials } from './helpers/credentials';
import { cat, icu, loadMessages } from './helpers/i18n';
import { loginAs } from './helpers/roles';

// Journey 02 — a school admin creates a teacher and a class, then links them.
// ONE test against the REAL Strapi on :5500 (no mocks): sign in -> Add teacher
// (C-INV-01 invitation) -> Add class (C-CLS-02) -> the invited teacher accepts
// their link (the public C-INV-05/06 endpoints, the web leg the emailed URL
// opens) -> "Assign to class" on the teacher detail (C-CLS teacher write) ->
// FULL browser reload -> both records persist and stay linked, asserted in the
// UI (staff table, classes list, class-detail chip) AND against the API.
// 1440x900 shots land in .qa/journeys/02-school-admin-teachers-classes/shots/.
const en = loadMessages('en');

const API = 'http://127.0.0.1:5500';
const ADMIN = roleCredentials('schoolAdmin');
const STAMP = Date.now();
const FIRST = 'Journey';
const LAST = `Pair${STAMP}`;
const TEACHER_EMAIL = `journey02-${STAMP}@schooltest.local`;
const CLASS_NAME = `Journey02 Class ${STAMP}`;
const TEACHER_PASSWORD = `Journey02!Pair${STAMP}`;
const SHOTS = path.resolve(
  process.cwd(),
  '.qa/journeys/02-school-admin-teachers-classes/shots',
);

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/** Cross-check jwt. The per-IP limiter is shared, so a 429 waits, never fails. */
async function apiLogin(request: APIRequestContext): Promise<string> {
  let last = 0;
  for (let attempt = 0; attempt < 10; attempt += 1) {
    const res = await request.post(`${API}/api/auth/local`, {
      data: { identifier: ADMIN.email, password: ADMIN.password },
    });
    if (res.ok()) return ((await res.json()) as { jwt: string }).jwt;
    last = res.status();
    await new Promise((resolve) => setTimeout(resolve, 5_000));
  }
  throw new Error(`[journey-02] api login kept failing with ${last}`);
}

async function apiGet<T>(
  request: APIRequestContext,
  jwt: string,
  pathName: string,
): Promise<T> {
  const res = await request.get(`${API}${pathName}`, {
    headers: { Authorization: `Bearer ${jwt}` },
  });
  expect(res.ok()).toBeTruthy();
  return ((await res.json()) as { data: T }).data;
}

test('school admin invites a teacher, creates a class, assigns the teacher, and both persist linked after reload', async ({
  page,
  request,
}, testInfo) => {
  testInfo.setTimeout(420_000);
  await page.setViewportSize({ width: 1440, height: 900 });
  const jwt = await apiLogin(request);

  // ---- SIGN IN through the real portal form ----
  await loginAs(page, 'schoolAdmin');

  // ---- 1. CREATE TEACHER: the Add teacher dialog sends the invitation ----
  await page.goto('/en/dashboard/school/teachers');
  const teachersScreen = page.locator('[data-surface="school-admin-teachers"]');
  await expect(teachersScreen).toBeVisible({ timeout: 20_000 });
  await teachersScreen
    .getByRole('button', { name: cat(en, 'Teachers.addButton'), exact: true })
    .click();
  const inviteDialog = page.getByRole('dialog');
  await expect(inviteDialog).toBeVisible();
  await inviteDialog.getByLabel(cat(en, 'Teachers.invite.firstName')).fill(FIRST);
  await inviteDialog.getByLabel(cat(en, 'Teachers.invite.lastName')).fill(LAST);
  await inviteDialog.getByLabel(cat(en, 'Teachers.invite.email')).fill(TEACHER_EMAIL);
  const invitationPost = page.waitForResponse(
    (res) => res.url().includes('/api/schools/me/invitations') && res.request().method() === 'POST',
  );
  await inviteDialog
    .getByRole('button', { name: cat(en, 'Teachers.invite.submit'), exact: true })
    .click();
  const invitationResponse = await invitationPost;
  expect(invitationResponse.status()).toBe(201);
  const inviteUrl =
    ((await invitationResponse.json()) as { data?: { invite_url?: string } }).data?.invite_url ??
    '';
  // The legacy response carries the emailed link; the token is its last segment.
  const token = inviteUrl.split('/invite/')[1] ?? '';
  expect(token, 'the 201 response must carry the invite_url the email uses').not.toBe('');
  await expect(inviteDialog).toBeHidden();

  // The invitation is persisted: an Invited row appears in the merged staff
  // table, and it survives a reload before anything else happens.
  await page.reload();
  await expect(teachersScreen).toBeVisible({ timeout: 20_000 });
  const invitedRow = page.locator('tr', { hasText: TEACHER_EMAIL });
  await expect(invitedRow).toBeVisible({ timeout: 20_000 });
  await expect(invitedRow).toHaveAttribute('data-status', 'invited');
  await expect(
    invitedRow.getByText(cat(en, 'Teachers.table.status.invited'), { exact: true }),
  ).toBeVisible();
  await page.screenshot({ path: path.join(SHOTS, '01-teacher-invited.png') });

  // ---- 2. CREATE CLASS through the Add class modal (no teacher yet — the
  // invited teacher is not an account, exactly the design's "add one later") ----
  await page.goto('/en/dashboard/school/classes');
  const classesScreen = page.locator('[data-slot="school-classes"]');
  await expect(classesScreen).toBeVisible({ timeout: 20_000 });
  await classesScreen
    .getByRole('button', { name: cat(en, 'Classes.addButton'), exact: true })
    .click();
  const classDialog = page.getByRole('dialog');
  await expect(classDialog).toBeVisible();
  await classDialog.getByLabel(cat(en, 'Classes.addForm.name')).fill(CLASS_NAME);
  await classDialog
    .getByRole('button', { name: cat(en, 'Classes.addForm.submit'), exact: true })
    .click();
  await expect(classDialog).toBeHidden({ timeout: 20_000 });

  // API truth: the class exists, empty and unassigned.
  const classes = await apiGet<Array<{ documentId: string; name: string; teachers: Array<{ documentId: string }> }>>(
    request,
    jwt,
    '/api/schools/me/classes',
  );
  const created = classes.find((row) => row.name === CLASS_NAME);
  expect(created, 'the created class must be served by the API').toBeDefined();
  expect(created?.teachers ?? []).toEqual([]);
  const classDocumentId = created?.documentId ?? '';

  await classesScreen
    .getByLabel(cat(en, 'Classes.list.searchLabel'), { exact: true })
    .fill(CLASS_NAME);
  const classRow = page.getByRole('row', { name: new RegExp(escapeRegExp(CLASS_NAME)) });
  await expect(classRow).toBeVisible({ timeout: 20_000 });
  await expect(classRow.getByText(cat(en, 'Classes.table.teacherNone'), { exact: true })).toBeVisible();
  await page.screenshot({ path: path.join(SHOTS, '02-class-created.png') });

  // ---- 3. THE TEACHER ACCEPTS: the emailed link's real web legs (C-INV-05/06).
  // Driven over the public endpoints, not the admin UI — this is the guest leg
  // that happens on the teacher's own machine, outside the admin portal. ----
  const publicRead = await request.get(`${API}/api/invitations/${token}`);
  expect(publicRead.ok()).toBeTruthy();
  expect(((await publicRead.json()) as { data: { email: string } }).data.email).toBe(TEACHER_EMAIL);
  const accept = await request.post(`${API}/api/invitations/${token}/accept`, {
    data: { password: TEACHER_PASSWORD, first_name: FIRST, last_name: LAST },
  });
  expect(accept.ok(), 'invitation acceptance must succeed').toBeTruthy();
  const accepted = ((await accept.json()) as { data: { user: { documentId: string } } }).data;
  const teacherDocumentId = accepted.user.documentId;
  expect(teacherDocumentId).toBeTruthy();

  // ---- 4. ASSIGN the teacher to the class from the teacher detail ----
  await page.goto(`/en/dashboard/school/teachers/${teacherDocumentId}`);
  const teacherScreen = page.locator('[data-slot="school-teacher-detail"]');
  await expect(teacherScreen).toBeVisible({ timeout: 20_000 });
  await expect(
    teacherScreen.getByText(cat(en, 'Teachers.detail.classesPanel.emptyTitle'), { exact: true }),
  ).toBeVisible();
  await teacherScreen
    .getByRole('button', { name: cat(en, 'Teachers.detail.assignButton'), exact: true })
    .click();
  const assignDialog = page.locator('[data-slot="ops-dialog-content"]');
  await expect(
    assignDialog.getByText(cat(en, 'Teachers.detail.assignDialog.title')),
  ).toBeVisible();
  await page.screenshot({ path: path.join(SHOTS, '03-assign-dialog.png') });
  await assignDialog.getByRole('checkbox', { name: new RegExp(escapeRegExp(CLASS_NAME)) }).check();
  await assignDialog
    .getByRole('button', { name: cat(en, 'Teachers.detail.assignDialog.submit'), exact: true })
    .click();
  await expect(assignDialog).toBeHidden({ timeout: 20_000 });
  const linkedNow = await apiGet<Array<{ documentId: string; teachers: Array<{ documentId: string }> }>>(
    request,
    jwt,
    '/api/schools/me/classes',
  );
  expect(
    linkedNow.find((row) => row.documentId === classDocumentId)?.teachers.map((t) => t.documentId),
  ).toContain(teacherDocumentId);

  // ---- 5. FULL RELOAD: both records persist and stay linked ----
  await page.reload();
  await expect(teacherScreen).toBeVisible({ timeout: 20_000 });
  const assignedClasses = page.locator('[data-slot="teacher-detail-classes"]');
  await expect(
    assignedClasses.getByRole('link', {
      name: icu(cat(en, 'Teachers.detail.classesPanel.openLabel'), { name: CLASS_NAME }),
    }),
  ).toBeVisible({ timeout: 20_000 });
  await page.screenshot({ path: path.join(SHOTS, '04-teacher-detail-after-reload.png') });

  // Teachers list: the account row is Active and carries the class tag.
  await page.goto('/en/dashboard/school/teachers');
  await expect(page.locator('[data-surface="school-admin-teachers"]')).toBeVisible({
    timeout: 20_000,
  });
  const teacherRow = page.locator('tr', { hasText: TEACHER_EMAIL });
  await expect(teacherRow).toBeVisible({ timeout: 20_000 });
  // Active accounts carry no status badge at all — only invited / deactivated
  // rows do (StaffNameCell) — so the transition is asserted by data-status and
  // the ABSENCE of the Invited badge.
  await expect(teacherRow).toHaveAttribute('data-status', 'active', { timeout: 20_000 });
  await expect(
    teacherRow.getByText(cat(en, 'Teachers.table.status.invited'), { exact: true }),
  ).toHaveCount(0);

  // Classes list: the class row now names its teacher.
  await page.goto('/en/dashboard/school/classes');
  await expect(classesScreen).toBeVisible({ timeout: 20_000 });
  await classesScreen
    .getByLabel(cat(en, 'Classes.list.searchLabel'), { exact: true })
    .fill(CLASS_NAME);
  await expect(classRow).toBeVisible({ timeout: 20_000 });
  await expect(classRow.getByText(`${FIRST} ${LAST}`, { exact: true })).toBeVisible();
  await page.screenshot({ path: path.join(SHOTS, '05-classes-list-after-reload.png') });

  // Class detail: the served teacher chip carries the teacher's name.
  await page.goto(`/en/dashboard/school/classes/${classDocumentId}`);
  const classScreen = page.locator('[data-slot="school-class-detail"]');
  await expect(classScreen).toBeVisible({ timeout: 20_000 });
  await expect(
    classScreen
      .locator('[data-slot="class-teacher-chip"]')
      .filter({ hasText: `${FIRST} ${LAST}` }),
  ).toBeVisible({ timeout: 20_000 });
  await page.screenshot({ path: path.join(SHOTS, '06-class-detail-after-reload.png') });

  // API truth, after everything: linked both ways, teacher active.
  const finalClasses = await apiGet<Array<{ documentId: string; teachers: Array<{ documentId: string }> }>>(
    request,
    jwt,
    '/api/schools/me/classes',
  );
  expect(
    finalClasses
      .find((row) => row.documentId === classDocumentId)
      ?.teachers.map((t) => t.documentId),
  ).toEqual([teacherDocumentId]);
  const finalTeachers = await apiGet<Array<{ documentId: string; email: string; blocked?: boolean }>>(
    request,
    jwt,
    '/api/schools/me/teachers',
  );
  const servedTeacher = finalTeachers.find((row) => row.documentId === teacherDocumentId);
  expect(servedTeacher?.email).toBe(TEACHER_EMAIL);
  expect(servedTeacher?.blocked ?? false).toBe(false);

  // ---- Cleanup: the class is deleted; the teacher account stays (records are
  // never deleted) but is deactivated so reruns start from a quiet school. ----
  await request.delete(`${API}/api/schools/me/classes/${classDocumentId}`, {
    headers: { Authorization: `Bearer ${jwt}` },
  });
  await request.post(`${API}/api/schools/me/teachers/${teacherDocumentId}/deactivate`, {
    headers: { Authorization: `Bearer ${jwt}` },
  });
});
