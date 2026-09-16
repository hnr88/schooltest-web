import { expect, test, type Page } from '@playwright/test';

import {
  apiChild,
  apiChildren,
  apiCreateStudent,
  apiLogin,
  realErrors,
  shot,
  signIn,
  STAMP,
} from './helpers/fleet5-live';
import { watchErrors } from './helpers/ui';

/**
 * Fleet 5 — EDIT + STUDENT DETAIL. Edit round-trips name/DOB/year level and
 * survives a reload; the detail screen renders every section for a rich
 * roster student (Reading 8B — Alvarez, the t2 roster with real results);
 * a bogus documentId URL lands on the clean not-found state.
 */

const ROSTER = '/en/dashboard/school/students';

async function openRoster(page: Page): Promise<ReturnType<Page['locator']>> {
  await page.goto(ROSTER);
  const screen = page.locator('[data-slot="school-students"]');
  await expect(screen).toBeVisible({ timeout: 30_000 });
  await expect(
    screen.locator('[data-slot="school-students-table"]').getByRole('row').first(),
  ).toBeVisible({ timeout: 30_000 });
  return screen;
}

test.describe('fleet5: edit + detail', () => {
  test.setTimeout(90_000);

  test('30 edit name/DOB/year level from the row menu persists after reload', async ({
    page,
    request,
  }) => {
    test.setTimeout(120_000);
    page.setDefaultTimeout(30_000);
    const errors = watchErrors(page);
    await page.setViewportSize({ width: 1440, height: 900 });
    const jwt = await apiLogin(request);
    const family = `${STAMP}Edit`;
    const created = await apiCreateStudent(request, jwt, {
      given_name: 'Edith',
      family_name: family,
      email: `f5.edit.${STAMP.toLowerCase()}@schooltest.local`,
      year_level: 7,
      date_of_birth: '2013-05-01',
    });
    expect(created.status, JSON.stringify(created.error)).toBe(201);
    const documentId = created.data!.documentId;

    await signIn(page);
    const screen = await openRoster(page);
    await screen.getByLabel('Search by name').fill(family);
    const row = screen
      .locator('[data-slot="school-students-table"]')
      .locator('[data-slot="school-students-row"]');
    await expect(row).toHaveCount(1, { timeout: 60_000 });
    await shot(page, '30a-before-edit');

    // ROW CLICK opens the detail (the row's one link, spec §4).
    await row.first().getByRole('link').first().click();
    await page.waitForURL(new RegExp(`/dashboard/school/students/${documentId}$`), {
      timeout: 30_000,
    });
    await expect(
      page
        .locator('[data-slot="school-student-detail"]')
        .getByRole('heading', { level: 1, name: `Edith ${family}` }),
    ).toBeVisible({ timeout: 30_000 });
    await shot(page, '30a2-row-click-detail');

    // Back to the roster for the edit flow.
    await page
      .locator('[data-slot="school-student-detail"]')
      .getByText('Back to students')
      .click();
    await page.waitForURL(/\?q=/, { timeout: 30_000 });
    await expect(row).toHaveCount(1, { timeout: 60_000 });

    // Row menu -> Edit student.
    await row.first().getByRole('button', { name: 'Actions', exact: true }).click();
    await page.getByRole('menuitem', { name: 'Edit student', exact: true }).click();
    const dialog = page.getByRole('dialog');
    await expect(dialog).toBeVisible({ timeout: 30_000 });
    await expect(dialog.getByText(`Edit Edith ${family}`)).toBeVisible();
    await shot(page, '30b-edit-dialog-open');

    await dialog.getByLabel('Given name').fill('Edith-Prime');
    await dialog.getByLabel('Date of birth').fill('2012-11-23');
    await dialog.getByLabel('Year level', { exact: true }).selectOption('9');
    await dialog.getByRole('button', { name: 'Save changes', exact: true }).click();
    await expect(dialog).toBeHidden({ timeout: 30_000 });
    await expect(
      page.getByText(`Edith-Prime ${family} was updated.`, { exact: true }),
    ).toBeVisible({ timeout: 30_000 });
    await shot(page, '30c-edit-saved-toast');

    // HARD RELOAD — the roster re-reads, the edit SURVIVED.
    await page.reload();
    const screenAfter = page.locator('[data-slot="school-students"]');
    await expect(
      screenAfter.locator('[data-slot="school-students-table"]').getByRole('row').first(),
    ).toBeVisible({ timeout: 30_000 });
    await screenAfter.getByLabel('Search by name').fill(family);
    const rowAfter = screenAfter
      .locator('[data-slot="school-students-table"]')
      .locator('[data-slot="school-students-row"]');
    await expect(rowAfter).toHaveCount(1, { timeout: 30_000 });
    await expect(rowAfter.first()).toContainText('Edith-Prime');
    await shot(page, '30d-after-reload-persisted');

    // API truth: the patch landed whole.
    const detail = await apiChild(request, jwt, documentId);
    expect(detail.given_name).toBe('Edith-Prime');
    expect(detail.date_of_birth).toBe('2012-11-23');
    expect(detail.year_level).toBe(9);
    expect(realErrors(errors), realErrors(errors).join('\n')).toEqual([]);
  });

  test('31 detail screen: every section renders for a rich Reading 8B student, console-clean', async ({
    page,
    request,
  }) => {
    test.setTimeout(90_000);
    page.setDefaultTimeout(30_000);
    const errors = watchErrors(page);
    await page.setViewportSize({ width: 1440, height: 900 });
    const jwt = await apiLogin(request);
    const { rows } = await apiChildren(request, jwt, 'class=qves8wrtl7r9ctw49jivm8gl&page=1&pageSize=1');
    test.skip(rows.length === 0, 'Reading 8B — Alvarez has no students on this DB');

    const rich = rows[0]!;
    const fullName = [rich.given_name, rich.family_name].filter(Boolean).join(' ');

    await signIn(page);
    await openRoster(page);
    await page.goto(`${ROSTER}/${rich.documentId}`);
    const detail = page.locator('[data-slot="school-student-detail"]');
    await expect(detail).toBeVisible({ timeout: 30_000 });

    // Header: name, level badge, status pill, meta line with the student ID.
    await expect(detail.getByRole('heading', { level: 1, name: fullName })).toBeVisible({
      timeout: 30_000,
    });
    await expect(detail.getByText('First language:').first()).toBeVisible();
    await expect(detail.getByText(new RegExp(`ID ${rich.documentId}`))).toBeVisible();
    await expect(detail.getByText('Edit details').first()).toBeVisible();

    // The three body sections render.
    await expect(detail.getByText('Student details')).toBeVisible();
    await expect(detail.getByText('Class')).toBeVisible();
    await shot(page, '31a-detail-rich-student');

    // API cross-check of the pill truth.
    const apiRow = await apiChild(request, jwt, rich.documentId);
    const expectedPill = apiRow.student_status === 'archived' ? 'Archived' : 'Active';
    await expect(detail.getByText(expectedPill, { exact: true }).first()).toBeVisible();
    await shot(page, '31b-detail-status-pill-matches-api');

    // Edit details opens the dialog from the detail screen too.
    await detail.getByText('Edit details').first().click();
    await expect(page.getByRole('dialog')).toBeVisible({ timeout: 30_000 });
    await shot(page, '31c-detail-edit-dialog');
    await page.getByRole('dialog').getByRole('button', { name: 'Cancel', exact: true }).click();
    await expect(page.getByRole('dialog')).toBeHidden();
    expect(realErrors(errors), realErrors(errors).join('\n')).toEqual([]);
  });

  test('32 bogus student documentId: clean not-found alert, no crash', async ({ page }) => {
    test.setTimeout(90_000);
    page.setDefaultTimeout(30_000);
    const errors = watchErrors(page);
    await page.setViewportSize({ width: 1440, height: 900 });
    await signIn(page);

    await page.goto(`${ROSTER}/f5notarealdocumentid00`);
    const detail = page.locator('[data-slot="school-student-detail"]');
    await expect(detail).toBeVisible({ timeout: 30_000 });
    await expect(detail.getByText('We could not find that student')).toBeVisible({
      timeout: 30_000,
    });
    await expect(detail.getByText('They may have been removed, or they belong to another school.')).toBeVisible();
    await shot(page, '32-bogus-documentid-notfound');

    // Back link still returns to the roster.
    await detail.getByText('Back to students').click();
    await page.waitForURL('**/dashboard/school/students');
    await expect(
      page.locator('[data-slot="school-students-table"]').getByRole('row').first(),
    ).toBeVisible({ timeout: 30_000 });
    // A 404 fetch is EXPECTED here — only real errors fail.
    expect(realErrors(errors), realErrors(errors).join('\n')).toEqual([]);
  });

  test('33 detail of the API-created student: year band label, ID meta line, back nav', async ({
    page,
    request,
  }) => {
    test.setTimeout(90_000);
    page.setDefaultTimeout(30_000);
    const errors = watchErrors(page);
    await page.setViewportSize({ width: 1440, height: 900 });
    const jwt = await apiLogin(request);
    const family = `${STAMP}Det`;
    const created = await apiCreateStudent(request, jwt, {
      given_name: 'Detta',
      family_name: family,
      email: `f5.det.${STAMP.toLowerCase()}@schooltest.local`,
      year_level: 10,
      first_language: 'korean',
      acara_phase: 'emerging',
    });
    expect(created.status, JSON.stringify(created.error)).toBe(201);
    const documentId = created.data!.documentId;

    await signIn(page);
    await page.goto(`${ROSTER}/${documentId}`);
    const detail = page.locator('[data-slot="school-student-detail"]');
    await expect(detail.getByRole('heading', { level: 1, name: `Detta ${family}` })).toBeVisible({
      timeout: 30_000,
    });
    // ACARA phase badge + meta line language.
    await expect(detail.getByText('Emerging', { exact: true }).first()).toBeVisible();
    await expect(detail.getByText(/Korean/).first()).toBeVisible();
    await shot(page, '33-detail-created-student');

    // Back to students -> the roster.
    await detail.getByText('Back to students').click();
    await page.waitForURL('**/dashboard/school/students');
    await expect(
      page.locator('[data-slot="school-students-table"]').getByRole('row').first(),
    ).toBeVisible({ timeout: 30_000 });
    expect(realErrors(errors), realErrors(errors).join('\n')).toEqual([]);
  });
});
