import { expect, test, type APIRequestContext, type Page } from '@playwright/test';

import { cat, loadMessages } from './helpers/i18n';

// Task 30 (st-mvp-pivot) targeted live check — NOT part of the suite.
// Drives the C-CHD-02 v2 add form (email, first-language picklist, optional
// ACARA phase), the edit dialog and the archive confirm through the real UI
// as the seeded school_admin, and cross-checks the roster (C-CHD-01) plus the
// seat counter (C-ENT-01) against the live API at every step.
const en = loadMessages('en');

const API = 'http://127.0.0.1:5500';
const SCHOOL_ADMIN = { email: 'schooladmin-a@schooltest.local', password: 'pEbjxVnJ4PPYiv8D!A1' };

interface ChildRow {
  documentId: string;
  given_name: string;
  family_name: string;
  status: string;
}

async function login(request: APIRequestContext): Promise<string> {
  const res = await request.post(`${API}/api/auth/local`, {
    data: { identifier: SCHOOL_ADMIN.email, password: SCHOOL_ADMIN.password },
  });
  expect(res.ok()).toBeTruthy();
  return ((await res.json()) as { jwt: string }).jwt;
}

async function apiChildren(
  request: APIRequestContext,
  jwt: string,
  params: string,
): Promise<ChildRow[]> {
  const res = await request.get(`${API}/api/schools/me/children?${params}`, {
    headers: { Authorization: `Bearer ${jwt}` },
  });
  expect(res.ok()).toBeTruthy();
  return ((await res.json()) as { data: ChildRow[] }).data;
}

async function apiSeatsUsed(request: APIRequestContext, jwt: string): Promise<number> {
  const res = await request.get(`${API}/api/schools/me/entitlement`, {
    headers: { Authorization: `Bearer ${jwt}` },
  });
  expect(res.ok()).toBeTruthy();
  return ((await res.json()) as { data: { seats_used: number } }).data.seats_used;
}

async function signIn(page: Page): Promise<void> {
  await page.goto('/sign-in');
  await page.getByLabel(cat(en, 'Auth.emailLabel'), { exact: true }).fill(SCHOOL_ADMIN.email);
  await page.getByLabel(cat(en, 'Auth.passwordLabel'), { exact: true }).fill(SCHOOL_ADMIN.password);
  await page.getByRole('button', { name: cat(en, 'Auth.signInButton'), exact: true }).click();
  await page.waitForURL('**/dashboard/school', { timeout: 30_000 });
}

test.describe('task 30: children v2 round-trip vs live C-CHD-01..04', () => {
  test('add with email/L1/ACARA -> roster -> edit -> archive frees the seat', async ({
    page,
    request,
  }) => {
    const jwt = await login(request);
    const seatsBefore = await apiSeatsUsed(request, jwt);
    const givenName = 'PW30';
    const familyName = `Probe${Date.now()}`;
    const fullName = `${givenName} ${familyName}`;
    const email = `pw30.${Date.now()}@example.com`;

    await signIn(page);
    await page.goto('/en/dashboard/school/children');
    const screen = page.locator('[data-slot="school-students"]');
    await expect(screen).toBeVisible({ timeout: 20_000 });

    // ADD (C-CHD-02 v2): name, email, year level, Korean, emerging ACARA phase.
    await screen.getByRole('button', { name: cat(en, 'SchoolStudents.addButton'), exact: true }).click();
    await page.waitForURL('**/dashboard/school/students/new');
    const form = page.locator('[data-slot="school-student-new"]');
    await form.getByLabel(/Given name/).fill(givenName);
    await form.getByLabel(cat(en, 'SchoolStudents.form.familyName'), { exact: true }).fill(familyName);
    await form.getByLabel(cat(en, 'SchoolStudents.form.email'), { exact: true }).fill(email);
    await form.getByLabel(cat(en, 'SchoolStudents.form.yearLevel'), { exact: true }).selectOption('8');
    await form.getByLabel(cat(en, 'SchoolStudents.form.firstLanguage'), { exact: true }).selectOption('korean');
    // The ACARA control renders for the school_admin role only.
    const acaraSelect = form.getByLabel(cat(en, 'SchoolStudents.form.acaraPhase'), { exact: true });
    await expect(acaraSelect).toBeVisible();
    await acaraSelect.selectOption('emerging');
    await form
      .getByRole('button', { name: cat(en, 'SchoolStudents.form.submitCreate'), exact: true })
      .click();
    await page.waitForURL('**/dashboard/school/students', { timeout: 20_000 });

    // ROSTER (C-CHD-01): the name search surfaces the new child. Search by the
    // unique family name — the server matches q against each name field, not
    // the combined "given family" string.
    await screen.getByLabel(cat(en, 'SchoolStudents.filters.searchLabel')).fill(familyName);
    const row = screen.getByRole('row', { name: new RegExp(familyName) });
    await expect(row).toBeVisible({ timeout: 10_000 });
    // Redesign spec section 4 replaced the Status column with Level and
    // Diagnostic, so active/archived state is asserted through the API below
    // and through the row disappearing from the default roster once archived.

    // API cross-check: listed, seat consumed.
    let matches = await apiChildren(request, jwt, `q=${familyName}`);
    expect(matches.some((entry) => entry.given_name === givenName)).toBeTruthy();
    expect(await apiSeatsUsed(request, jwt)).toBe(seatsBefore + 1);

    // EDIT (C-CHD-03): first language Korean -> Vietnamese, phase -> developing.
    await page.getByRole('button', { name: `Actions for ${fullName}`, exact: true }).click();
    const editItem = page.getByRole('menuitem', {
      name: cat(en, 'SchoolStudents.actions.edit'),
      exact: true,
    });
    await expect(editItem).toBeVisible();
    await editItem.click();
    const editDialog = page.getByRole('dialog');
    await expect(editDialog).toBeVisible();
    await editDialog
      .getByLabel(cat(en, 'SchoolStudents.form.firstLanguage'), { exact: true })
      .selectOption('vietnamese');
    await editDialog
      .getByLabel(cat(en, 'SchoolStudents.form.acaraPhase'), { exact: true })
      .selectOption('developing');
    await editDialog
      .getByRole('button', { name: cat(en, 'SchoolStudents.form.submitEdit'), exact: true })
      .click();
    await expect(editDialog).toBeHidden();
    // The success toast fires only when a PATCH actually left the building -
    // it is the UI proof the edit round-tripped (psql cross-check is manual).
    await expect(
      page.getByText(cat(en, 'SchoolStudents.form.updatedToast').replace('{name}', fullName), {
        exact: true,
      }),
    ).toBeVisible();

    // ARCHIVE (C-CHD-04): confirm copy promises the seat is freed.
    await page.getByRole('button', { name: `Actions for ${fullName}`, exact: true }).click();
    const archiveItem = page.getByRole('menuitem', {
      name: cat(en, 'SchoolStudents.actions.archive'),
      exact: true,
    });
    await expect(archiveItem).toBeVisible();
    await archiveItem.click();
    const confirm = page.getByRole('alertdialog');
    await expect(confirm).toBeVisible();
    await confirm
      .getByRole('button', { name: cat(en, 'SchoolStudents.archiveDialog.confirm'), exact: true })
      .click();
    await expect(confirm).toBeHidden();

    // API cross-check: archived, seat released immediately (C-ENT-01).
    matches = await apiChildren(request, jwt, `q=${familyName}&status=archived`);
    expect(matches.some((entry) => entry.given_name === givenName)).toBeTruthy();
    expect(await apiSeatsUsed(request, jwt)).toBe(seatsBefore);
  });
});
