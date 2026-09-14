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
  // ops/30 — the portal auth redesign moved the accessible labels to
  // Auth.portal.* (invitation-only portal: no Google, no sign-up link).
  await page.goto('/sign-in');
  await page.getByLabel(cat(en, 'Auth.portal.emailLabel'), { exact: true }).fill(SCHOOL_ADMIN.email);
  await page
    .getByLabel(cat(en, 'Auth.portal.passwordLabel'), { exact: true })
    .fill(SCHOOL_ADMIN.password);
  await page
    .getByRole('button', { name: cat(en, 'Auth.portal.loginButton'), exact: true })
    .click();
  await page.waitForURL(/\/dashboard(\/|$)/, { timeout: 30_000 });
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
    // The seeded fixture class renders with its teacher chip and count. The
    // kit paginates the school's classes (25 per page, name-ascending), so on
    // a database with more than one page the fixture sits beyond page 1 — the
    // list's OWN search narrows to it first (the client-mode reducer runs over
    // the fully loaded array).
    const search = screen.getByLabel(cat(en, 'Classes.list.searchLabel'), { exact: true });
    await search.fill('Room 4');
    await expect(screen.getByRole('row', { name: /EAL\/D Year 7 - Room 4/ })).toBeVisible();
    // The CRUD flow mutates a uniquely-named class; reset the needle so each
    // step below scopes its own search instead.
    await search.fill('');

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
    // The freshly created class sorts beyond page 1 of the paginated kit —
    // narrow to its unique name before asserting the row.
    await search.fill(className);
    const row = screen.getByRole('row', { name: new RegExp(className) });
    await expect(row).toBeVisible({ timeout: 10_000 });
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
    // ops/30 — the row actions render through the shared directory kit now:
    // two inline quick actions (edit/delete) plus the ⋯ overflow, whose
    // trigger carries the kit's static row-menu label scoped to the row.
    await row
      .getByRole('button', { name: cat(en, 'Classes.list.rowMenuLabel'), exact: true })
      .click();
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
    // The active search still pins the OLD name; move the needle to the new
    // one, then assert the renamed row.
    await search.fill(editedName);
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
    // Same kit row-menu contract as the edit step above.
    await editedRow
      .getByRole('button', { name: cat(en, 'Classes.list.rowMenuLabel'), exact: true })
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
    await expect(editedRow).toHaveCount(0);

    // API cross-check: the class is gone.
    classes = await apiClasses(request, jwt);
    expect(classes.find((entry) => entry.name === editedName)).toBeUndefined();
  });

  // ops/30 — the classes list renders through the shared directory kit in
  // client mode: the search, the year-band filter and the sorts reduce the
  // loaded array, and every choice round-trips through the URL.
  test('ops/30: the classes list is a kit list — search, year-band filter and sort round-trip', async ({
    page,
    request,
  }) => {
    const jwt = await login(request);
    const classes = await apiClasses(request, jwt);
    expect(classes.length).toBeGreaterThan(0);

    await signIn(page);
    await page.goto('/en/dashboard/school/classes');

    const screen = page.locator('[data-slot="school-classes"]');
    const table = screen.locator('[data-slot="school-classes-table"]');
    await expect(table).toBeVisible({ timeout: 20_000 });
    await expect(table.locator('[data-directory-row]').first()).toBeVisible({ timeout: 20_000 });

    // SEARCH narrows to the needle. The kit PAGINATES the client-mode list
    // (25 rows per page), so the count line reads "Showing <page rows> of
    // <filtered total> classes" — assert the TOTAL half, which is the mode
    // contract: unfiltered it names the whole loaded array, narrowed it names
    // the filtered set (ops/30 Done-when).
    const showingTotal = (total: number) =>
      screen.getByText(new RegExp(`Showing \\d+ of ${total} classes`));
    const search = screen.getByLabel(cat(en, 'Classes.list.searchLabel'), { exact: true });
    await expect(showingTotal(classes.length)).toBeVisible();
    const initialRows = await table.locator('[data-directory-row]').count();
    await search.fill('Room 4');
    const room4 = classes.filter((entry) => entry.name.includes('Room 4')).length;
    await expect
      .poll(async () => table.locator('[data-directory-row]').count(), { timeout: 10_000 })
      .toBe(room4);
    await expect(showingTotal(room4)).toBeVisible();

    // CLEAR FILTERS restores the unfiltered list and the URL — page 1 again
    // carries the same window of rows it started with.
    await screen.getByRole('button', { name: cat(en, 'Classes.list.clearFilters'), exact: true }).click();
    await expect
      .poll(async () => table.locator('[data-directory-row]').count(), { timeout: 10_000 })
      .toBe(initialRows);
    await expect(showingTotal(classes.length)).toBeVisible();

    // SORT round-trips through the URL and reorders the rows. The grid is a
    // div kit (no <td>): the row's first cell IS the class name.
    await screen.getByLabel(cat(en, 'Classes.list.sortLabel'), { exact: true }).click();
    await page.getByRole('option', { name: cat(en, 'Classes.list.sortNameDesc'), exact: true }).click();
    // The router percent-encodes the comparator colon in the query (?sort=name%3Adesc).
    await page.waitForURL(/sort=name(?::|%3A)desc/);
    const alphaLast = [...classes].sort((a, b) => b.name.localeCompare(a.name))[0];
    await expect(table.locator('[data-directory-row]').first()).toContainText(alphaLast.name);

    // YEAR-BAND FILTER round-trips and matches the API's band membership — the
    // filtered TOTAL names the band's size even when only the first page renders.
    await screen.getByLabel(cat(en, 'Classes.table.columnYearBand'), { exact: true }).click();
    await page.getByRole('option', { name: cat(en, 'Classes.yearBands.7_9'), exact: true }).click();
    await page.waitForURL('**/dashboard/school/classes?**year_band=7_9**');
    const banded = classes.filter((entry) => entry.year_band === '7_9');
    await expect(showingTotal(banded.length)).toBeVisible();
    await expect(table.locator('[data-directory-row]').first()).toBeVisible();
  });
});
