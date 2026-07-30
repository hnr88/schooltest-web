import { expect, test, type APIRequestContext, type Page } from '@playwright/test';

import { cat, icu, loadMessages } from './helpers/i18n';

// Task 31 (st-mvp-pivot) targeted live check — NOT part of the suite.
// Drives the class detail assignment screen (C-CLS-03 full-replacement
// teacher/student lists) through the real UI as the seeded school_admin and
// cross-checks every step against the live API (C-CLS-01 / C-TCH-01 /
// C-CHD-01): teacher reassignment out and back, a child moving in and out,
// persistence across reload, and the cross-school 403 surfacing.
const en = loadMessages('en');

const API = 'http://127.0.0.1:5500';
const SCHOOL_ADMIN_A = { email: 'schooladmin-a@schooltest.local', password: 'pEbjxVnJ4PPYiv8D!A1' };
const SCHOOL_ADMIN_B = { email: 'schooladmin-b@schooltest.local', password: 'BT77uuUGgqVSpFkP!A1' };
const CLASS_NAME = 'EAL/D Year 7 - Room 4';
const TEACHER_KEPT = 'Vee Twentyone';
const TEACHER_PROBE = 'Pat Teacher';
const CHILD_MEMBER = 'Sofia Petrov';
const CHILD_MOVE = 'Verify Fields';
const CHILD_ARCHIVED = 'Daniel Kim';
const SERVER_403_MESSAGE = 'One or more members belong to a different school.';

interface SchoolClassRow {
  documentId: string;
  name: string;
  teachers: Array<{ documentId: string }>;
  student_count: number;
}

interface TeacherRow {
  documentId: string;
  first_name: string | null;
  last_name: string | null;
  classes: Array<{ documentId: string }>;
}

interface ChildRow {
  documentId: string;
  given_name: string;
  family_name: string;
  class: { documentId: string } | null;
}

async function login(
  request: APIRequestContext,
  credentials: { email: string; password: string },
): Promise<string> {
  const res = await request.post(`${API}/api/auth/local`, {
    data: { identifier: credentials.email, password: credentials.password },
  });
  expect(res.ok()).toBeTruthy();
  return ((await res.json()) as { jwt: string }).jwt;
}

async function apiClasses(request: APIRequestContext, jwt: string): Promise<SchoolClassRow[]> {
  const res = await request.get(`${API}/api/schools/me/classes`, {
    headers: { Authorization: `Bearer ${jwt}` },
  });
  expect(res.ok()).toBeTruthy();
  return ((await res.json()) as { data: SchoolClassRow[] }).data;
}

async function apiTeachers(request: APIRequestContext, jwt: string): Promise<TeacherRow[]> {
  const res = await request.get(`${API}/api/schools/me/teachers`, {
    headers: { Authorization: `Bearer ${jwt}` },
  });
  expect(res.ok()).toBeTruthy();
  return ((await res.json()) as { data: TeacherRow[] }).data;
}

async function apiChildren(request: APIRequestContext, jwt: string): Promise<ChildRow[]> {
  const res = await request.get(`${API}/api/schools/me/children?pageSize=100`, {
    headers: { Authorization: `Bearer ${jwt}` },
  });
  expect(res.ok()).toBeTruthy();
  return ((await res.json()) as { data: ChildRow[] }).data;
}

async function signIn(page: Page): Promise<void> {
  await page.goto('/sign-in');
  await page.getByLabel(cat(en, 'Auth.emailLabel'), { exact: true }).fill(SCHOOL_ADMIN_A.email);
  await page.getByLabel(cat(en, 'Auth.passwordLabel'), { exact: true }).fill(SCHOOL_ADMIN_A.password);
  await page.getByRole('button', { name: cat(en, 'Auth.signInButton'), exact: true }).click();
  await page.waitForURL('**/dashboard/school', { timeout: 30_000 });
}

function teacherCheckbox(page: Page, name: string) {
  return page.getByRole('checkbox', { name, exact: true });
}

// Student rows carry the current class as a hint inside the labelled element,
// so the accessible name is "<name> <class>" — anchor the match at the start.
function studentCheckbox(page: Page, name: string) {
  return page.getByRole('checkbox', { name: new RegExp(`^${name}`) });
}

async function saveAndExpectToast(page: Page): Promise<void> {
  await page.getByRole('button', { name: cat(en, 'Classes.detail.save'), exact: true }).click();
  await expect(
    page.getByText(icu(cat(en, 'Classes.detail.savedToast'), { name: CLASS_NAME }), {
      exact: true,
    }),
  ).toBeVisible();
}

test.describe('task 31: class detail assignment round-trip vs live C-CLS-03', () => {
  // Both tests share the seeded fixture class — serial keeps the count and
  // membership invariants race-free under fullyParallel.
  test.describe.configure({ mode: 'serial' });

  test('reassign teacher out and back, move a child in and out, persists on reload', async ({
    page,
    request,
  }) => {
    const jwt = await login(request, SCHOOL_ADMIN_A);
    const teachers = await apiTeachers(request, jwt);
    const kept = teachers.find(
      (row) => `${row.first_name ?? ''} ${row.last_name ?? ''}`.trim() === TEACHER_KEPT,
    );
    const probe = teachers.find(
      (row) => `${row.first_name ?? ''} ${row.last_name ?? ''}`.trim() === TEACHER_PROBE,
    );
    expect(kept).toBeDefined();
    expect(probe).toBeDefined();
    const classesBefore = await apiClasses(request, jwt);
    const fixture = classesBefore.find((row) => row.name === CLASS_NAME);
    expect(fixture).toBeDefined();

    await signIn(page);
    await page.goto('/en/dashboard/school/classes');

    // List rows link to the detail screen.
    const listScreen = page.locator('[data-slot="school-classes"]');
    await expect(listScreen).toBeVisible({ timeout: 20_000 });
    await listScreen.getByRole('link', { name: CLASS_NAME, exact: true }).click();
    await page.waitForURL(`**/dashboard/school/classes/${fixture?.documentId ?? ''}`);

    const screen = page.locator('[data-slot="school-class-detail"]');
    await expect(screen).toBeVisible();
    await expect(screen.getByRole('heading', { name: CLASS_NAME, exact: true })).toBeVisible();
    await expect(teacherCheckbox(page, TEACHER_KEPT)).toBeChecked();
    await expect(teacherCheckbox(page, TEACHER_PROBE)).not.toBeChecked();
    await expect(studentCheckbox(page, CHILD_MEMBER)).toBeChecked();
    await expect(
      page.getByRole('button', { name: cat(en, 'Classes.detail.save'), exact: true }),
    ).toBeDisabled();

    // REASSIGN (C-CLS-03): the class moves from the seeded teacher to the probe.
    await teacherCheckbox(page, TEACHER_KEPT).click();
    await teacherCheckbox(page, TEACHER_PROBE).click();
    await saveAndExpectToast(page);
    await page.reload();
    await expect(teacherCheckbox(page, TEACHER_PROBE)).toBeChecked();
    await expect(teacherCheckbox(page, TEACHER_KEPT)).not.toBeChecked();

    // API cross-check: C-CLS-01 shows the swap, C-TCH-01 shows it both ways.
    let classes = await apiClasses(request, jwt);
    let current = classes.find((row) => row.documentId === fixture?.documentId);
    expect(current?.teachers.map((row) => row.documentId)).toEqual([probe?.documentId]);
    let staff = await apiTeachers(request, jwt);
    expect(
      staff.find((row) => row.documentId === probe?.documentId)?.classes.map((c) => c.documentId),
    ).toContain(fixture?.documentId);
    expect(staff.find((row) => row.documentId === kept?.documentId)?.classes).toEqual([]);

    // ASSIGN BACK: the fixture teacher owns the class again.
    await teacherCheckbox(page, TEACHER_PROBE).click();
    await teacherCheckbox(page, TEACHER_KEPT).click();
    await saveAndExpectToast(page);
    await page.reload();
    await expect(teacherCheckbox(page, TEACHER_KEPT)).toBeChecked();
    await expect(teacherCheckbox(page, TEACHER_PROBE)).not.toBeChecked();
    classes = await apiClasses(request, jwt);
    current = classes.find((row) => row.documentId === fixture?.documentId);
    expect(current?.teachers.map((row) => row.documentId)).toEqual([kept?.documentId]);

    // MOVE A CHILD IN: an unassigned active child joins the class.
    await studentCheckbox(page, CHILD_MOVE).click();
    await saveAndExpectToast(page);
    // The list count updates after save.
    await page.getByRole('link', { name: cat(en, 'Classes.detail.backLink'), exact: true }).click();
    await page.waitForURL('**/dashboard/school/classes');
    const row = listScreen.getByRole('row', { name: new RegExp(CLASS_NAME.replace('/', '\\/')) });
    await expect(row).toBeVisible();
    expect(await row.getByRole('cell').allTextContents()).toContain('3');
    await row.getByRole('link', { name: CLASS_NAME, exact: true }).click();
    await page.waitForURL(`**/dashboard/school/classes/${fixture?.documentId ?? ''}`);
    await expect(studentCheckbox(page, CHILD_MOVE)).toBeChecked();

    classes = await apiClasses(request, jwt);
    current = classes.find((entry) => entry.documentId === fixture?.documentId);
    expect(current?.student_count).toBe(3);
    let children = await apiChildren(request, jwt);
    const moved = children.find(
      (entry) => `${entry.given_name} ${entry.family_name}` === CHILD_MOVE,
    );
    expect(moved?.class?.documentId).toBe(fixture?.documentId);

    // REMOVE AGAIN: the child is unlinked, never deleted; the archived member
    // (Daniel Kim) survives the replacement untouched.
    await studentCheckbox(page, CHILD_MOVE).click();
    await saveAndExpectToast(page);
    await page.reload();
    await expect(studentCheckbox(page, CHILD_MOVE)).not.toBeChecked();
    classes = await apiClasses(request, jwt);
    current = classes.find((entry) => entry.documentId === fixture?.documentId);
    expect(current?.student_count).toBe(2);
    children = await apiChildren(request, jwt);
    expect(
      children.find((entry) => `${entry.given_name} ${entry.family_name}` === CHILD_MOVE)?.class,
    ).toBeNull();
    expect(
      children.find((entry) => `${entry.given_name} ${entry.family_name}` === CHILD_ARCHIVED)
        ?.class?.documentId,
    ).toBe(fixture?.documentId);
  });

  test('cross-school rejection surfaces the server 403 message as a toast', async ({
    page,
    request,
  }) => {
    const jwtA = await login(request, SCHOOL_ADMIN_A);
    const classes = await apiClasses(request, jwtA);
    const fixture = classes.find((row) => row.name === CLASS_NAME);
    expect(fixture).toBeDefined();

    // UI path: a 403 from C-CLS-03 renders the server's message in a toast.
    await signIn(page);
    await page.goto(`/en/dashboard/school/classes/${fixture?.documentId ?? ''}`);
    const screen = page.locator('[data-slot="school-class-detail"]');
    await expect(screen).toBeVisible({ timeout: 20_000 });
    await page.route('**/api/schools/me/classes/*', async (route) => {
      if (route.request().method() !== 'PATCH') {
        await route.fallback();
        return;
      }
      await route.fulfill({
        status: 403,
        contentType: 'application/json',
        body: JSON.stringify({
          data: null,
          error: { status: 403, name: 'ForbiddenError', message: SERVER_403_MESSAGE },
        }),
      });
    });
    await studentCheckbox(page, 'Null Fields').click();
    await page.getByRole('button', { name: cat(en, 'Classes.detail.save'), exact: true }).click();
    await expect(page.getByText(SERVER_403_MESSAGE, { exact: true })).toBeVisible();
    await page.unroute('**/api/schools/me/classes/*');

    // API path: school B's admin cannot write school A's class (403), and a
    // missing token follows the platform convention (403).
    const jwtB = await login(request, SCHOOL_ADMIN_B);
    const crossSchool = await request.patch(
      `${API}/api/schools/me/classes/${fixture?.documentId ?? ''}`,
      {
        headers: { Authorization: `Bearer ${jwtB}` },
        data: { teacher_documentIds: [] },
      },
    );
    expect(crossSchool.status()).toBe(403);
    const anonymous = await request.patch(
      `${API}/api/schools/me/classes/${fixture?.documentId ?? ''}`,
      { data: { teacher_documentIds: [] } },
    );
    expect(anonymous.status()).toBe(403);

    // The failed write changed nothing.
    const after = await apiClasses(request, jwtA);
    expect(after.find((row) => row.documentId === fixture?.documentId)?.student_count).toBe(
      fixture?.student_count,
    );
  });
});
