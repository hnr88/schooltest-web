import { expect, test, type APIRequestContext, type Page } from '@playwright/test';

import { cat, loadMessages } from './helpers/i18n';

// Task 29 (st-mvp-pivot) targeted live check — NOT part of the suite.
// Drives the full classes CRUD round-trip through the real UI as the seeded
// school_admin and cross-checks every step against the live API: create ->
// listed -> assign teacher + child (counts update) -> edit year band ->
// delete -> the assigned child survives unlinked (C-CHD-01).
const en = loadMessages('en');

const API = 'http://127.0.0.1:5500';
const SCHOOL_ADMIN = { email: 'schooladmin-a@schooltest.local', password: 'pEbjxVnJ4PPYiv8D!A1' };
const TEACHER_NAME = 'Vee Twentyone';
// Seeded child with class null (never the fixture class's members).
const CHILD_NAME = 'VerifyAlpha RaceProbe';

interface SchoolClassRow {
  documentId: string;
  name: string;
  year_band: string | null;
  teachers: Array<{ documentId: string }>;
  student_count: number;
}

interface ChildRow {
  documentId: string;
  given_name: string;
  family_name: string;
  status: string;
  class: { documentId: string; name: string } | null;
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

// Pages through the WHOLE roster. C-CHD-01 caps pageSize at 100 and this school
// has more students than that, so reading only page 1 silently missed anyone
// past the cap — which is exactly the bug the edit-dialog picker had.
async function apiChildren(request: APIRequestContext, jwt: string): Promise<ChildRow[]> {
  const rows: ChildRow[] = [];
  let page = 1;
  let pageCount = 1;
  do {
    const res = await request.get(`${API}/api/schools/me/children?page=${page}&pageSize=100`, {
      headers: { Authorization: `Bearer ${jwt}` },
    });
    expect(res.ok()).toBeTruthy();
    const body = (await res.json()) as {
      data: ChildRow[];
      meta?: { pagination?: { pageCount?: number } };
    };
    rows.push(...body.data);
    pageCount = body.meta?.pagination?.pageCount ?? 1;
    page += 1;
  } while (page <= pageCount);
  return rows;
}

async function signIn(page: Page): Promise<void> {
  await page.goto('/sign-in');
  await page.getByLabel(cat(en, 'Auth.emailLabel'), { exact: true }).fill(SCHOOL_ADMIN.email);
  await page.getByLabel(cat(en, 'Auth.passwordLabel'), { exact: true }).fill(SCHOOL_ADMIN.password);
  await page.getByRole('button', { name: cat(en, 'Auth.signInButton'), exact: true }).click();
  await page.waitForURL('**/dashboard/school', { timeout: 30_000 });
}

test.describe('task 29: classes CRUD round-trip vs live C-CLS-01..04', () => {
  test('create -> assign teacher + child -> edit -> delete, child survives', async ({
    page,
    request,
  }) => {
    const jwt = await login(request);
    const className = `PW29 Probe ${Date.now()}`;
    await signIn(page);
    await page.goto('/en/dashboard/school/classes');

    const screen = page.locator('[data-slot="school-classes"]');
    await expect(screen).toBeVisible({ timeout: 20_000 });
    // The seeded fixture class renders with its teacher chip and count.
    await expect(
      screen.getByRole('row', { name: /EAL\/D Year 7 - Room 4/ }),
    ).toBeVisible();

    // CREATE (C-CLS-02) with a teacher picked from C-TCH-01.
    await screen.getByRole('button', { name: cat(en, 'Classes.addButton'), exact: true }).click();
    const createDialog = page.getByRole('dialog');
    // Redesign spec section 2: the Add class modal now takes the class name plus a
    // SINGLE-teacher DROPDOWN (was a multi-select checkbox list), and its copy
    // lives under Classes.addForm.*. FieldShell appends a required-marker "*" to
    // the label text, so the accessible name is "Class name*" — match non-exact.
    await createDialog.getByLabel(cat(en, 'Classes.addForm.name')).fill(className);
    await createDialog.getByLabel(cat(en, 'Classes.addForm.teacher')).click();
    await page.getByRole('option', { name: TEACHER_NAME }).click();
    await createDialog
      .getByRole('button', { name: cat(en, 'Classes.addForm.submit'), exact: true })
      .click();
    await expect(createDialog).toBeHidden();
    const row = screen.getByRole('row', { name: new RegExp(className) });
    await expect(row).toBeVisible();
    await expect(row.getByText(TEACHER_NAME, { exact: true })).toBeVisible();

    // API cross-check: created with the teacher, count 0, default band.
    let classes = await apiClasses(request, jwt);
    let created = classes.find((entry) => entry.name === className);
    expect(created).toBeDefined();
    expect(created?.teachers.length).toBe(1);
    expect(created?.student_count).toBe(0);
    // Redesign spec section 2: the Add class modal is class name + teacher +
    // student import only, so a class created through it carries no year band.
    expect(created?.year_band ?? null).toBeNull();

    // EDIT (C-CLS-03): year band -> 10_12, assign a child.
    await page
      .getByRole('button', { name: `Actions for ${className}`, exact: true })
      .click();
    await page.getByRole('menuitem', { name: cat(en, 'Classes.actions.edit'), exact: true }).click();
    const editDialog = page.getByRole('dialog');
    await expect(editDialog).toBeVisible();
    await editDialog
      .getByLabel(cat(en, 'Classes.form.yearBand'))
      .selectOption('10_12');
    await editDialog.getByRole('checkbox', { name: new RegExp(CHILD_NAME) }).click();
    await editDialog
      .getByRole('button', { name: cat(en, 'Classes.form.submitEdit'), exact: true })
      .click();
    await expect(editDialog).toBeHidden();
    // Redesign spec section 2 replaced the "Year band" column with "Tests
    // completed", so the band is no longer asserted in the row — the API
    // cross-check below is now the only proof it round-tripped.

    // API cross-check: band changed, and the class now carries the assigned
    // child. `student_count` counts ACTIVE students only — it is the same
    // quantity the entitlement seat count and the C-RPT-04 participation
    // buckets use, so an archived child contributes 0 (api::class.class
    // service countStudents). CHILD_NAME is an archived probe fixture, so the
    // assertion is on the class holding the link, not on a raw headcount.
    classes = await apiClasses(request, jwt);
    created = classes.find((entry) => entry.name === className);
    expect(created?.year_band).toBe('10_12');
    const assignedIsActive = (await apiChildren(request, jwt)).some(
      (row) => `${row.given_name} ${row.family_name}` === CHILD_NAME && row.status === 'active',
    );
    expect(created?.student_count).toBe(assignedIsActive ? 1 : 0);

    // DELETE (C-CLS-04): the confirm copy states children are not deleted.
    await page
      .getByRole('button', { name: `Actions for ${className}`, exact: true })
      .click();
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
    await expect(row).toHaveCount(0);

    // API cross-check: class gone, child survives unlinked (C-CHD-01).
    classes = await apiClasses(request, jwt);
    expect(classes.find((entry) => entry.name === className)).toBeUndefined();
    const children = await apiChildren(request, jwt);
    const child = children.find(
      (entry) => `${entry.given_name} ${entry.family_name}` === CHILD_NAME,
    );
    expect(child).toBeDefined();
    expect(child?.class).toBeNull();
  });
});
