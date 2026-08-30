import { expect, test, type APIRequestContext, type Page } from '@playwright/test';

import { cat, loadMessages } from './helpers/i18n';
import { roleCredentials } from './helpers/credentials';

// Task 29 (st-mvp-pivot) targeted live check — NOT part of the suite.
// Drives the full classes CRUD round-trip through the real UI as the seeded
// school_admin and cross-checks every step against the live API: create ->
// listed -> edit name + single teacher -> delete (C-CLS-01..04). Student
// membership moved to the class-scoped import flow in the current redesign,
// so this journey deliberately verifies that editing metadata leaves the
// roster untouched.
const en = loadMessages('en');

const API = 'http://127.0.0.1:5500';
const SCHOOL_ADMIN = roleCredentials('schoolAdmin');
const CREATE_TEACHER_NAME = 'Tara Okonkwo';
const EDIT_TEACHER_NAME = 'Marco Alvarez';

interface SchoolClassRow {
  documentId: string;
  name: string;
  year_band: string | null;
  teachers: Array<{ documentId: string }>;
  student_count: number;
}

async function login(request: APIRequestContext): Promise<string> {
  const res = await request.post(`${API}/api/auth/local`, {
    data: { identifier: SCHOOL_ADMIN.email, password: SCHOOL_ADMIN.password },
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

async function signIn(page: Page): Promise<void> {
  await page.goto('/sign-in');
  await page.getByLabel(cat(en, 'Auth.emailLabel'), { exact: true }).fill(SCHOOL_ADMIN.email);
  await page.getByLabel(cat(en, 'Auth.passwordLabel'), { exact: true }).fill(SCHOOL_ADMIN.password);
  await page.getByRole('button', { name: cat(en, 'Auth.signInButton'), exact: true }).click();
  await page.waitForURL('**/dashboard/school', { timeout: 30_000 });
}

test.describe('task 29: classes CRUD round-trip vs live C-CLS-01..04', () => {
  test('create -> assign teacher -> edit name/teacher -> delete, roster stays untouched', async ({
    page,
    request,
  }) => {
    const jwt = await login(request);
    const className = `PW29 Probe ${Date.now()}`;
    const editedName = `${className} edited`;
    await signIn(page);
    await page.goto('/en/dashboard/school/classes');

    const screen = page.locator('[data-slot="school-classes"]');
    await expect(screen).toBeVisible({ timeout: 20_000 });
    // The seeded fixture class renders with its teacher chip and count.
    await expect(screen.getByRole('row', { name: /EAL\/D Year 7 - Room 4/ })).toBeVisible();

    // CREATE (C-CLS-02) with a teacher picked from C-TCH-01.
    await screen.getByRole('button', { name: cat(en, 'Classes.addButton'), exact: true }).click();
    const createDialog = page.getByRole('dialog');
    // Redesign spec section 2: the Add class modal now takes the class name plus a
    // SINGLE-teacher DROPDOWN (was a multi-select checkbox list), and its copy
    // lives under Classes.addForm.*. FieldShell appends a required-marker "*" to
    // the label text, so the accessible name is "Class name*" — match non-exact.
    await createDialog.getByLabel(cat(en, 'Classes.addForm.name')).fill(className);
    await createDialog.getByLabel(cat(en, 'Classes.addForm.teacher')).click();
    await page.getByRole('option', { name: CREATE_TEACHER_NAME }).click();
    await createDialog
      .getByRole('button', { name: cat(en, 'Classes.addForm.submit'), exact: true })
      .click();
    await expect(createDialog).toBeHidden();
    const row = screen.getByRole('row', { name: new RegExp(className) });
    await expect(row).toBeVisible();
    await expect(row.getByText(CREATE_TEACHER_NAME, { exact: true })).toBeVisible();

    // API cross-check: created with the teacher, count 0, default band.
    let classes = await apiClasses(request, jwt);
    let created = classes.find((entry) => entry.name === className);
    expect(created).toBeDefined();
    expect(created?.teachers.length).toBe(1);
    expect(created?.student_count).toBe(0);
    // Redesign spec section 2: the Add class modal is class name + teacher +
    // student import only, so a class created through it carries no year band.
    expect(created?.year_band ?? null).toBeNull();

    // EDIT (C-CLS-03): the redesign permits only name + one teacher and must
    // not replace the roster as the legacy assignment form did.
    await page.getByRole('button', { name: `Actions for ${className}`, exact: true }).click();
    await page
      .getByRole('menuitem', { name: cat(en, 'Classes.actions.edit'), exact: true })
      .click();
    const editDialog = page.getByRole('dialog');
    await expect(editDialog).toBeVisible();
    await editDialog.getByLabel(cat(en, 'Classes.detail.edit.nameLabel')).fill(editedName);
    await editDialog
      .getByLabel(cat(en, 'Classes.detail.edit.teacherLabel'))
      .selectOption({ label: EDIT_TEACHER_NAME });
    await editDialog
      .getByRole('button', { name: cat(en, 'Classes.detail.edit.save'), exact: true })
      .click();
    await expect(editDialog).toBeHidden();
    const editedRow = screen.getByRole('row', { name: new RegExp(editedName) });
    await expect(editedRow).toBeVisible();
    await expect(editedRow.getByText(EDIT_TEACHER_NAME, { exact: true })).toBeVisible();

    // API cross-check: metadata changed and the zero-student roster did not.
    classes = await apiClasses(request, jwt);
    created = classes.find((entry) => entry.name === className);
    expect(created).toBeUndefined();
    created = classes.find((entry) => entry.name === editedName);
    expect(created?.student_count).toBe(0);
    expect(created?.teachers).toHaveLength(1);

    // DELETE (C-CLS-04): the confirm copy states children are not deleted.
    await page.getByRole('button', { name: `Actions for ${editedName}`, exact: true }).click();
    await page
      .getByRole('menuitem', { name: cat(en, 'Classes.actions.delete'), exact: true })
      .click();
    const confirm = page.getByRole('alertdialog');
    await expect(confirm).toBeVisible();
    await expect(
      confirm.getByText(cat(en, 'Classes.deleteDialog.description'), { exact: true }),
    ).toBeVisible();
    await confirm
      .getByRole('button', { name: cat(en, 'Classes.deleteDialog.confirm'), exact: true })
      .click();
    // While the alertdialog is open the table is aria-hidden, so the row
    // locator reads 0 prematurely — wait for the dialog to close (fires only
    // after the DELETE resolves) before asserting the row is gone.
    await expect(confirm).toBeHidden();
    await expect(editedRow).toHaveCount(0);

    // API cross-check: the class is gone.
    classes = await apiClasses(request, jwt);
    expect(classes.find((entry) => entry.name === editedName)).toBeUndefined();
  });
});
