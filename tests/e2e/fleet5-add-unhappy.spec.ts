import { expect, test, type Page } from '@playwright/test';

import {
  apiChildren,
  apiCreateStudent,
  apiLogin,
  dbStudentUserLink,
  realErrors,
  shot,
  signIn,
  STAMP,
} from './helpers/fleet5-live';
import { watchErrors } from './helpers/ui';

/**
 * Fleet 5 — ADD STUDENT, unhappy paths. Every refusal must be an inline field
 * error or a clean toast — never a crash, never a half-created row. All data
 * stamped F5-<epoch>; every step screenshotted into captures/fleet5/.
 */

const ROSTER = '/en/dashboard/school/students';
const NEW = '/en/dashboard/school/students/new';

async function gotoForm(page: Page): Promise<void> {
  await signIn(page);
  await page.goto(NEW);
  const form = page.locator('[data-slot="school-student-new"]');
  await expect(form).toBeVisible({ timeout: 30_000 });
  return;
}

async function submit(page: Page): Promise<void> {
  await page
    .locator('[data-slot="school-student-new"]')
    .getByRole('button', { name: 'Add student', exact: true })
    .click();
}

test.describe('fleet5: add student (unhappy)', () => {
  // Shared dev stack: sign-in alone can eat a minute under fleet load.
  test.setTimeout(180_000);

  test('20 empty submit: required given-name inline error, no navigation, no row', async ({
    page,
  }) => {
    page.setDefaultTimeout(30_000);
    const errors = watchErrors(page);
    await page.setViewportSize({ width: 1440, height: 900 });

    await gotoForm(page);
    await submit(page);
    await expect(
      page.getByText("Enter the student's given name."),
    ).toBeVisible({ timeout: 60_000 });
    expect(new URL(page.url()).pathname).toContain('/students/new');
    await shot(page, '20a-empty-given-name-required');
    // No-row proof: other fleet agents mutate this school concurrently, so a
    // before/after total is not stable — the inline error + stay-on-form IS
    // the refusal (nothing was submitted to the server at all).
    expect(realErrors(errors), realErrors(errors).join('\n')).toEqual([]);
  });

  test('21 bad email: inline validation, no navigation', async ({ page }) => {
    page.setDefaultTimeout(30_000);
    const errors = watchErrors(page);
    await page.setViewportSize({ width: 1440, height: 900 });

    await gotoForm(page);
    const form = page.locator('[data-slot="school-student-new"]');
    await form.getByLabel('Given name').fill('Badly');
    await form.getByLabel('Family name', { exact: true }).fill(`${STAMP}BadMail`);
    await form.getByLabel('Email', { exact: true }).fill('not-an-email');
    await submit(page);
    await expect(page.getByText('Enter a valid email address.')).toBeVisible({ timeout: 60_000 });
    expect(new URL(page.url()).pathname).toContain('/students/new');
    await shot(page, '21-bad-email-inline');
    expect(realErrors(errors), realErrors(errors).join('\n')).toEqual([]);
  });

  test('22 duplicate email of an existing student: clear refusal, no orphan row', async ({
    page,
    request,
  }) => {
    page.setDefaultTimeout(30_000);
    const errors = watchErrors(page);
    await page.setViewportSize({ width: 1440, height: 900 });
    const jwt = await apiLogin(request);
    const email = `f5.dup.${STAMP.toLowerCase()}@schooltest.local`;

    // First owner of the email — created through the UI like a real admin.
    await gotoForm(page);
    const form = page.locator('[data-slot="school-student-new"]');
    await form.getByLabel('Given name').fill('Dup');
    await form.getByLabel('Family name', { exact: true }).fill(`${STAMP}DupA`);
    await form.getByLabel('Email', { exact: true }).fill(email);
    await form.getByLabel('Year level', { exact: true }).selectOption('7');
    await submit(page);
    await page.waitForURL('**/dashboard/school/students', { timeout: 30_000 });

    // Second student, SAME email — today's provisioning middleware must refuse:
    // an email may never be shared by two student accounts.
    await page.goto(NEW);
    await expect(page.locator('[data-slot="school-student-new"]')).toBeVisible();
    await form.getByLabel('Given name').fill('Dup');
    await form.getByLabel('Family name', { exact: true }).fill(`${STAMP}DupB`);
    await form.getByLabel('Email', { exact: true }).fill(email);
    await submit(page);
    // The refusal is a toast — whichever wording lands, the form must stay
    // open and name a failure (NOT navigate back to the roster as success).
    await page.waitForURL('**/dashboard/school/students/new', { timeout: 30_000 });
    await expect(page.locator('[data-slot="school-student-new"]')).toBeVisible({
      timeout: 30_000,
    });
    const toast = page.getByText(
      /did not work|permission|already|exists|failed|unavailable/i,
    );
    await expect(toast.first()).toBeVisible({ timeout: 30_000 });
    await shot(page, '22a-duplicate-email-refused');

    // The same refusal on the wire...
    const second = await apiCreateStudent(request, jwt, {
      given_name: 'Dup',
      family_name: `${STAMP}DupC`,
      email,
      year_level: 7,
    });
    expect(second.status, `duplicate email must refuse: ${JSON.stringify(second.error)}`).toBe(403);

    // ...but TODAY'S PROVISIONING CHANGE writes the row BEFORE provisioning
    // refuses, and nothing rolls it back: the refused create leaves an orphan
    // student row (no account, seat consumed). This assert is DELIBERATELY
    // strict — it failing IS the recorded product defect [BUG-fleet5-orphan].
    const orphan = await apiChildren(request, jwt, `q=${STAMP}DupB`);
    const orphanC = await apiChildren(request, jwt, `q=${STAMP}DupC`);
    expect(orphan.total, '[BUG] refused duplicate-email create left an orphan student row').toBe(0);
    expect(orphanC.total, '[BUG] refused duplicate-email create left an orphan student row').toBe(0);
    await shot(page, '22b-duplicate-email-api-refusal-no-orphan');
    expect(realErrors(errors), realErrors(errors).join('\n')).toEqual([]);
  });

  test('23 spreadsheet/HTML-flavoured names are stored literally and render inert', async ({
    page,
    request,
  }) => {
    page.setDefaultTimeout(30_000);
    const errors = watchErrors(page);
    await page.setViewportSize({ width: 1440, height: 900 });
    await signIn(page);

    let dialogFired = false;
    page.on('dialog', () => {
      dialogFired = true;
    });

    const family = `${STAMP}Xss`;
    await page.goto(NEW);
    const form = page.locator('[data-slot="school-student-new"]');
    await form.getByLabel('Given name').fill('=SUM(A1)');
    await form.getByLabel('Family name', { exact: true }).fill('<script>');
    await form.getByLabel('Email', { exact: true }).fill(`f5.xss.${STAMP.toLowerCase()}@schooltest.local`);
    await submit(page);
    await page.waitForURL('**/dashboard/school/students', { timeout: 30_000 });
    // Toast is transient — the row content below is the hard proof.
    try {
      await expect(
        page.getByText('=SUM(A1) <script> was added to your students.', { exact: true }),
      ).toBeVisible({ timeout: 4_000 });
    } catch {
      console.log('[fleet5] xss-name create: toast not captured; row assert follows');
    }

    // Search by the literal formula name — q matches the NAME fields only,
    // and this family name is '<script>', so search the GIVEN name.
    await page
      .locator('[data-slot="school-students"]')
      .getByLabel('Search by name')
      .fill('=SUM(A1)');
    const row = page
      .locator('[data-slot="school-students-table"]')
      .locator('[data-slot="school-students-row"]');
    await expect(row.first()).toBeVisible({ timeout: 60_000 });
    // Rendered as inert TEXT (React escapes), never executed, never swallowed.
    await expect(row.first()).toContainText('=SUM(A1)');
    await expect(row.first()).toContainText('<script>');
    expect(dialogFired, 'no alert/confirm may fire from a name').toBe(false);
    await shot(page, '23-formula-html-names-inert');
    expect(realErrors(errors), realErrors(errors).join('\n')).toEqual([]);
  });

  test('24 overlong name: inline too-long error, no row', async ({ page }) => {
    page.setDefaultTimeout(30_000);
    const errors = watchErrors(page);
    await page.setViewportSize({ width: 1440, height: 900 });

    await gotoForm(page);
    const form = page.locator('[data-slot="school-student-new"]');
    await form.getByLabel('Given name').fill('L'.repeat(101));
    await submit(page);
    await expect(page.getByText('That is too long.')).toBeVisible({ timeout: 60_000 });
    await shot(page, '24-overlong-name-inline');

    // Other fleet agents mutate this school concurrently, so totals can drift;
    // the precise no-row proof is that the overlong name never appears.
    const search = page.locator('[data-slot="school-students"]').getByLabel('Search by name');
    await page.goto('/en/dashboard/school/students');
    await expect(
      page.locator('[data-slot="school-students-table"]').getByRole('row').first(),
    ).toBeVisible({ timeout: 60_000 });
    await search.fill('LLLLLLLLLLLLLLLLLLLL');
    await expect(
      page.getByText('No students match these filters.'),
    ).toBeVisible({ timeout: 60_000 });
    expect(realErrors(errors), realErrors(errors).join('\n')).toEqual([]);
  });

  test('25 emoji names: accepted, rendered, provisioned', async ({ page, request }) => {
    page.setDefaultTimeout(30_000);
    const errors = watchErrors(page);
    await page.setViewportSize({ width: 1440, height: 900 });
    const jwt = await apiLogin(request);
    const family = `${STAMP}Emoji`;

    await gotoForm(page);
    const form = page.locator('[data-slot="school-student-new"]');
    await form.getByLabel('Given name').fill('🌟Star');
    await form.getByLabel('Family name', { exact: true }).fill(family);
    await form.getByLabel('Email', { exact: true }).fill(`f5.emoji.${STAMP.toLowerCase()}@schooltest.local`);
    await submit(page);
    await page.waitForURL('**/dashboard/school/students', { timeout: 30_000 });
    await expect(
      page.getByText(`🌟Star ${family}`, { exact: true }),
    ).toBeVisible({ timeout: 30_000 });

    await page
      .locator('[data-slot="school-students"]')
      .getByLabel('Search by name')
      .fill(`${STAMP}Emoji`);
    const row = page
      .locator('[data-slot="school-students-table"]')
      .locator('[data-slot="school-students-row"]');
    await expect(row).toHaveCount(1, { timeout: 30_000 });
    await expect(row.first()).toContainText('🌟Star');
    await shot(page, '25a-emoji-name-row');

    const { rows } = await apiChildren(request, jwt, `q=${STAMP}Emoji`);
    expect(rows).toHaveLength(1);
    const link = await dbStudentUserLink(rows[0]!.documentId);
    expect(link, 'emoji-named student is provisioned like any other').toBeTruthy();
    expect(link!.role_type).toBe('student');
    await shot(page, '25b-emoji-provisioned');
    expect(realErrors(errors), realErrors(errors).join('\n')).toEqual([]);
  });

  test('26 DOB before 1900: inline invalid-date error', async ({ page }) => {
    page.setDefaultTimeout(30_000);
    const errors = watchErrors(page);
    await page.setViewportSize({ width: 1440, height: 900 });

    await gotoForm(page);
    const form = page.locator('[data-slot="school-student-new"]');
    await form.getByLabel('Given name').fill('Timeless');
    await form.getByLabel('Date of birth').fill('1899-12-31');
    await submit(page);
    await expect(page.getByText('Enter a valid date of birth.')).toBeVisible({ timeout: 30_000 });
    await shot(page, '26-dob-before-1900-inline');
    expect(realErrors(errors), realErrors(errors).join('\n')).toEqual([]);
  });
});
