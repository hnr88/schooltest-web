/**
 * BUG-006 follow-up — the SERVER half, proven through the real API and the
 * portal. REQUIRES the follow-up API (schooltest-api "fix(bug-006 classes): an
 * invited teacher can never silently remove or join a class's real teachers"):
 * against an API without it, step 1 answers 200 (the silent wipe this guards
 * against) and step 2's `replace_teachers` is refused as an unknown field.
 *
 *  1. C-CLS-03 refuses to put a STAFFED class on an invited teacher — the bulk
 *     body ([] + invitation) and a pending-only body are both 400
 *     PENDING_TEACHER_REPLACES_TEACHERS naming the current teacher, and the
 *     class is untouched. A non-boolean replace_teachers is a 400 on that field.
 *  2. Edit class: switching the staffed class's single teacher to the invited
 *     one is the explicit replace — the PATCH carries replace_teachers: true,
 *     the class then waits on the invitation with no real teacher.
 *  3. The invitee accepts: the class links to the new account (one
 *     transaction on the server), pending cleared.
 *
 * Screenshots: /Users/hunor.nagy/Desktop/live_feedback_1/proof/BUG-006/followup-05-*.png.
 */
import { expect, test } from '@playwright/test';

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

interface ErrorBody {
  error?: { status?: number; message?: string; details?: { code?: string; fields?: string[]; teachers?: Array<{ documentId: string }> } };
}

const STAMP = Date.now();
const active = { ...teacherPerson('bug006a-active'), first: 'Active' };
const invited = { ...teacherPerson('bug006a-invited'), first: 'Invited' };
const STAFFED = `BUG006A Staffed 7A ${STAMP}`;

let school: FreshSchool | null = null;
let activeId = '';
let invitation: { documentId: string; token: string } | null = null;
let staffedId = '';
const fullName = (person: Person) => `${person.first} ${person.last}`;
const escapeRegExp = (value: string) => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

async function api<T>(path: string, init: RequestInit = {}): Promise<{ status: number; body: T }> {
  const res = await fetch(`${API}${path}`, {
    ...init,
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${school?.adminJwt ?? ''}`, ...init.headers },
  });
  return { status: res.status, body: (await res.json().catch(() => ({}))) as T };
}

async function staffedRow(): Promise<ClassRow | undefined> {
  const res = await api<{ data: ClassRow[] }>('/api/schools/me/classes');
  expect(res.status).toBe(200);
  return res.body.data.find((row) => row.documentId === staffedId);
}

test.beforeAll(async () => {
  test.setTimeout(120_000);
  school = await createSchoolWithAdminOnly('BUG006 Followup API School');
  const activeInvite = await inviteTeacher(school.adminJwt, active);
  activeId = (await acceptInvitation(activeInvite.token, active)).documentId;
  invitation = await inviteTeacher(school.adminJwt, invited);
  const created = await api<{ data: { documentId: string } }>('/api/schools/me/classes', {
    method: 'POST',
    body: JSON.stringify({ name: STAFFED, teacher_documentIds: [activeId] }),
  });
  expect(created.status).toBe(201);
  staffedId = created.body.data.documentId;
});

test.afterAll(async () => {
  if (!school) return;
  if (staffedId) await api(`/api/schools/me/classes/${staffedId}`, { method: 'DELETE' });
  await removeSchool(school, [active.email, invited.email]);
});

test('BUG-006 follow-up API: a staffed class is never put on an invited teacher without the explicit replace', async () => {
  const pendingId = invitation?.documentId ?? '';
  for (const body of [
    { teacher_documentIds: [], pending_teacher_documentId: pendingId },
    { pending_teacher_documentId: pendingId },
  ]) {
    const refused = await api<ErrorBody>(`/api/schools/me/classes/${staffedId}`, { method: 'PATCH', body: JSON.stringify(body) });
    expect(refused.status, JSON.stringify(refused.body)).toBe(400);
    expect(refused.body.error?.details?.code).toBe('PENDING_TEACHER_REPLACES_TEACHERS');
    expect(refused.body.error?.details?.teachers?.map((teacher) => teacher.documentId)).toEqual([activeId]);
  }
  const badFlag = await api<ErrorBody>(`/api/schools/me/classes/${staffedId}`, {
    method: 'PATCH',
    body: JSON.stringify({ pending_teacher_documentId: pendingId, replace_teachers: 'yes' }),
  });
  expect(badFlag.status).toBe(400);
  expect(badFlag.body.error?.details?.fields).toEqual(['replace_teachers']);

  const untouched = await staffedRow();
  expect(untouched?.teachers.map((teacher) => teacher.documentId)).toEqual([activeId]);
  expect(untouched?.pending_teacher ?? null).toBeNull();
});

test('BUG-006 follow-up API: Edit class replacing the teacher with the invitee sends replace_teachers and succeeds', async ({ page }) => {
  test.setTimeout(180_000);
  await page.setViewportSize({ width: 1440, height: 900 });
  await signIn(page, (school as FreshSchool).admin);
  await page.goto('/en/dashboard/school/classes');
  const screen = page.locator('[data-slot="school-classes"]');
  await expect(screen).toBeVisible({ timeout: 30_000 });
  await screen.getByLabel(cat(en, 'Classes.list.searchLabel'), { exact: true }).fill(STAFFED);
  const row = page.getByRole('row', { name: new RegExp(escapeRegExp(STAFFED)) });
  await row.getByRole('button', { name: cat(en, 'Classes.list.rowMenuLabel'), exact: true }).click();
  await page.getByRole('menuitem', { name: cat(en, 'Classes.actions.edit'), exact: true }).click();
  const dialog = page.getByRole('dialog');
  const teacherSelect = dialog.getByLabel(cat(en, 'Classes.detail.edit.teacherLabel'));
  await expect(teacherSelect).toHaveValue(activeId);
  await teacherSelect.selectOption({
    label: icu(cat(en, 'Classes.teacherPicker.pendingOption'), { name: fullName(invited) }),
  });
  await page.screenshot({ path: proofPath('BUG-006', 'followup-05-edit-replace-with-invitee.png'), animations: 'disabled' });
  const patch = page.waitForResponse((res) => res.request().method() === 'PATCH' && res.url().includes(`/api/schools/me/classes/${staffedId}`));
  await dialog.getByRole('button', { name: cat(en, 'Classes.detail.edit.save'), exact: true }).click();
  const answered = await patch;
  expect(answered.request().postDataJSON()).toEqual({
    name: STAFFED,
    teacher_documentIds: [],
    pending_teacher_documentId: invitation?.documentId,
    replace_teachers: true,
  });
  expect(answered.status(), await answered.text()).toBe(200);
  await expect(dialog).toBeHidden({ timeout: 30_000 });
  await expect(row.locator('[data-slot="class-pending-teacher"]')).toHaveAttribute('data-state', 'pending', { timeout: 30_000 });
  await page.screenshot({ path: proofPath('BUG-006', 'followup-05b-row-waits-on-invitee.png'), animations: 'disabled' });

  const replaced = await staffedRow();
  expect(replaced?.teachers).toEqual([]);
  expect(replaced?.pending_teacher).toMatchObject({ documentId: invitation?.documentId, state: 'pending' });
});

test('BUG-006 follow-up API: the invitee accepts and the class links to their new account', async () => {
  const accepted = await acceptInvitation(invitation?.token ?? '', invited);
  const linked = await staffedRow();
  expect(linked?.teachers.map((teacher) => teacher.documentId)).toEqual([accepted.documentId]);
  expect(linked?.pending_teacher ?? null).toBeNull();
});
