import path from 'node:path';

import { expect, test, type APIRequestContext, type Page, type TestInfo } from '@playwright/test';

import { schoolAdminJwt } from './helpers/class-detail';
import { createImportClass, deleteImportClasses } from './helpers/class-import';
import { cat, loadMessages } from './helpers/i18n';
import { loginAs } from './helpers/roles';
import { watchErrors } from './helpers/ui';

// FLEETFIX-C scratch — live proof for two confirmed defects, on the REAL stack
// (web :3002, API :5500; servers are NEVER started here):
//
//   D5  duplicate class names were accepted silently. Now: creating a second
//       class with a trimmed/case-insensitive equal name in the SAME school is
//       refused 400 CLASS_NAME_TAKEN by the API, and the add-class form
//       surfaces the server's refusal INLINE on the name field; renaming a
//       class onto a sibling's name is refused the same way (the API arm).
//   D10 the school-admin students roster had NO unarchive control. Now: an
//       archived row's menu offers "Unarchive student", confirm-gated like its
//       Archive sibling, and the row flips back to active without a reload.
//
// Every created artefact is stamped FIC<epoch>; afterAll disposes of the
// classes (and the students inside them) through the shared import-cleanup
// helpers, so the fixture school does not leak.
const en = loadMessages('en');
const CAPTURES = path.resolve(process.cwd(), 'tests', 'e2e', 'captures', 'fleetfix');
const STAMP = Date.now();

let shotIndex = 0;

async function shot(page: Page, testInfo: TestInfo, slug: string): Promise<void> {
  shotIndex += 1;
  const name = `${String(shotIndex).padStart(2, '0')}-${slug}.png`;
  const body = await page.screenshot({ path: path.join(CAPTURES, name), fullPage: false });
  await testInfo.attach(name, { body, contentType: 'image/png' });
}

/** Interpolates an ICU pattern from the message catalog — cat() returns it raw. */
function msg(key: string, params: Record<string, string>): string {
  return cat(en, key).replace(/\{(\w+)\}/g, (whole, name) => params[name] ?? whole);
}

/**
 * FINDING carried from fleet6 (reported, not masked): GET /api/notifications
 * deterministically 500s for schooladmin-a in this environment. The surfaces
 * under test are untouched by it, so the watcher filters exactly that endpoint
 * and still fails on anything else.
 */
function watchSurfaceErrors(page: Page): { errors: string[]; badResponses: string[] } {
  const errors = watchErrors(page).filter(
    (message) => !(message.includes('Failed to load resource') && message.includes('500')),
  );
  const badResponses: string[] = [];
  page.on('response', (response) => {
    if (response.url().includes('/api/notifications')) return;
    if (response.url().includes('/api/') && response.status() >= 500) {
      badResponses.push(`${response.status()} ${response.request().method()} ${response.url()}`);
    }
  });
  return { errors, badResponses };
}

async function gotoOrRetry(page: Page, path: string, slot: string): Promise<void> {
  // The dev server compiles the route on first visit and the shell can land a
  // beat behind the auth hydration; one retry absorbs both without masking a
  // real defect (the second attempt still asserts the slot).
  for (let attempt = 0; attempt < 2; attempt += 1) {
    await page.goto(path);
    try {
      await expect(page.locator(slot)).toBeVisible({ timeout: 30_000 });
      return;
    } catch {
      if (attempt === 1) throw new Error(`surface ${slot} never rendered after retry`);
    }
  }
}

async function loginAndOpenClasses(page: Page): Promise<Page> {
  await page.setViewportSize({ width: 1440, height: 900 });
  await loginAs(page, 'schoolAdmin');
  await gotoOrRetry(page, '/dashboard/school/classes', '[data-slot="school-classes"]');
  return page;
}

/** Fills and submits the add-class dialog (teacher picker takes the first row). */
async function fillAndSubmitAddClass(page: Page, name: string): Promise<void> {
  const dialog = page.getByRole('dialog');
  await dialog.getByLabel(cat(en, 'Classes.addForm.name')).fill(name);
  await dialog.getByLabel(cat(en, 'Classes.addForm.teacher')).click();
  await page.getByRole('option').first().click();
  await dialog
    .getByRole('button', { name: cat(en, 'Classes.addForm.submit'), exact: true })
    .click();
}

async function listClassNames(request: APIRequestContext, jwt: string): Promise<string[]> {
  const res = await request.get(`http://127.0.0.1:5500/api/schools/me/classes`, {
    headers: { Authorization: `Bearer ${jwt}` },
  });
  expect(res.status()).toBe(200);
  return ((await res.json()) as { data: Array<{ name: string | null }> }).data.map(
    (row) => row.name ?? '',
  );
}

test.describe.configure({ mode: 'serial' });
test.setTimeout(150_000);

test.describe('fleetfix-c: D5 duplicate class refusal + D10 unarchive control', () => {
  const duplicateName = `FIC ${STAMP} Reading 8A`;
  const renameTargetName = `FIC ${STAMP} Rename Probe`;
  const unarchiveClassName = `FIC ${STAMP} Unarchive Class`;
  const family = `Fic${STAMP}Arch`;
  const classRegister: string[] = [];

  test.afterAll(async ({ request }) => {
    // Disposal is best-effort and LAST: the helpers delete the students inside
    // each class first, then the class itself.
    await deleteImportClasses(request, classRegister.splice(0));
  });

  test('D5 create "FIC <epoch>" twice: the second create is refused INLINE on the name field', async ({
    page,
  }, testInfo) => {
    const { errors, badResponses } = watchSurfaceErrors(page);
    const jwt = await schoolAdminJwt(page.request);
    await loginAndOpenClasses(page);

    const screen = page.locator('[data-slot="school-classes"]');
    await screen.getByRole('button', { name: cat(en, 'Classes.addButton'), exact: true }).click();
    const dialog = page.getByRole('dialog');
    await expect(dialog).toBeVisible();

    // First create SUCCEEDS: toast + dialog closes.
    await fillAndSubmitAddClass(page, duplicateName);
    await expect(page.locator('[data-sonner-toast]')).toContainText(
      msg('Classes.addForm.createdToast', { name: duplicateName }),
      { timeout: 30_000 },
    );
    await expect(dialog).toBeHidden();
    await shot(page, testInfo, 'd5-first-create-accepted');

    // The row exists exactly once.
    let names = await listClassNames(page.request, jwt);
    expect(names.filter((name) => name === duplicateName)).toHaveLength(1);

    // Second create, SAME name: the server refuses 400 CLASS_NAME_TAKEN and the
    // form surfaces the refusal INLINE on the name field — the dialog stays
    // open, no success toast, no second row.
    await screen.getByRole('button', { name: cat(en, 'Classes.addButton'), exact: true }).click();
    await expect(dialog).toBeVisible();
    await fillAndSubmitAddClass(page, duplicateName);
    await expect(
      dialog.getByText('A class with this name already exists.', { exact: true }),
    ).toBeVisible({ timeout: 30_000 });
    await expect(dialog).toBeVisible();
    await shot(page, testInfo, 'd5-duplicate-refused-inline');

    names = await listClassNames(page.request, jwt);
    expect(names.filter((name) => name === duplicateName), 'no duplicate row was written').toHaveLength(
      1,
    );

    await dialog
      .getByRole('button', { name: cat(en, 'Classes.addForm.cancel'), exact: true })
      .click();
    await expect(dialog).toBeHidden();

    // Register the class for afterAll disposal.
    const rows = await page.request
      .get(`http://127.0.0.1:5500/api/schools/me/classes`, {
        headers: { Authorization: `Bearer ${jwt}` },
      })
      .then((res) => res.json() as Promise<{ data: Array<{ documentId: string; name: string | null }> }>);
    classRegister.push(
      ...rows.data.filter((row) => row.name === duplicateName).map((row) => row.documentId),
    );
    expect(badResponses, '5xx responses on the class surface').toEqual([]);
    expect(errors).toEqual([]);
  });

  test('D5 renaming a class onto a sibling’s existing name is refused', async ({
    page,
  }, testInfo) => {
    const { errors, badResponses } = watchSurfaceErrors(page);
    const jwt = await schoolAdminJwt(page.request);
    const classId = await createImportClass(page.request, jwt, renameTargetName);
    classRegister.push(classId);
    await loginAndOpenClasses(page);

    const screen = page.locator('[data-slot="school-classes"]');
    await screen.getByLabel(cat(en, 'Classes.list.searchLabel'), { exact: true }).fill(renameTargetName);
    const row = screen.locator('[data-directory-row]').filter({ hasText: renameTargetName }).first();
    await expect(row).toBeVisible();
    await row.getByRole('button', { name: cat(en, 'Classes.list.rowMenuLabel'), exact: true }).click();
    await page.getByRole('menuitem', { name: cat(en, 'Classes.actions.edit'), exact: true }).click();
    const dialog = page.getByRole('dialog');
    await expect(dialog).toBeVisible();

    await dialog.getByLabel(cat(en, 'Classes.detail.edit.nameLabel')).fill(duplicateName);
    await dialog.getByRole('button', { name: cat(en, 'Classes.detail.edit.save') }).click();

    // The refusal: no saved toast, the dialog STAYS open, an error toast fires.
    await expect(page.locator('[data-sonner-toast]').filter({ hasText: 'was updated' })).toHaveCount(0, {
      timeout: 15_000,
    });
    await expect(dialog).toBeVisible();
    await expect(page.locator('[data-sonner-toast]').getByText(cat(en, 'Classes.detail.edit.errorToast'))).toBeVisible({
      timeout: 15_000,
    });
    await shot(page, testInfo, 'd5-rename-onto-existing-refused');

    // And the SERVER never renamed: the API still answers with the old name.
    const names = await listClassNames(page.request, jwt);
    expect(names.filter((name) => name === duplicateName), 'the sibling kept its name').toHaveLength(1);
    expect(names.filter((name) => name === renameTargetName), 'the edited class kept its name').toHaveLength(1);
    await page.keyboard.press('Escape');
    expect(badResponses, '5xx responses on the class surface').toEqual([]);
    expect(errors).toEqual([]);
  });

  test('D10 archive a student, then unarchive the archived row through its NEW menu action', async ({
    page,
  }, testInfo) => {
    const { errors, badResponses } = watchSurfaceErrors(page);
    const jwt = await schoolAdminJwt(page.request);
    const unarchiveClassId = await createImportClass(page.request, jwt, unarchiveClassName);
    classRegister.push(unarchiveClassId);

    // The probe student sits IN the FIC-stamped class and is archived BY THIS
    // SPEC through the UI below.
    const createRes = await page.request.post(`http://127.0.0.1:5500/api/schools/me/children`, {
      headers: { Authorization: `Bearer ${jwt}` },
      data: {
        given_name: 'Una',
        family_name: family,
        email: `fic.unarch.${STAMP}@schooltest.local`,
        year_level: 8,
        class_documentId: unarchiveClassId,
      },
    });
    expect(createRes.status(), await createRes.text()).toBe(201);
    const created = (await createRes.json()) as { data: { documentId: string } };
    const studentDocumentId = created.data.documentId;

    await page.setViewportSize({ width: 1440, height: 900 });
    await loginAs(page, 'schoolAdmin');
    await gotoOrRetry(page, '/dashboard/school/students', '[data-slot="school-students"]');
    const roster = page.locator('[data-slot="school-students"]');
    await roster.getByLabel(cat(en, 'SchoolStudents.filters.searchLabel'), { exact: true }).fill(family);
    const row = roster
      .locator('[data-slot="school-students-table"]')
      .locator('[data-slot="school-students-row"]');
    await expect(row).toHaveCount(1, { timeout: 30_000 });
    await expect(row.first()).toHaveAttribute('data-student-status', 'active');
    await shot(page, testInfo, 'd10-active-student-in-fic-class');

    // ARCHIVE through the row menu (confirm-gated), as a user would.
    await row.first().getByRole('button', { name: 'Actions', exact: true }).click();
    await page.getByRole('menuitem', { name: 'Archive student', exact: true }).click();
    const archiveConfirm = page.getByRole('alertdialog');
    await expect(archiveConfirm).toBeVisible({ timeout: 30_000 });
    await archiveConfirm
      .getByRole('button', { name: 'Archive student', exact: true })
      .click();
    await expect(
      page.getByText(`Una ${family} was archived. Their seat is free again.`, { exact: true }),
    ).toBeVisible({ timeout: 30_000 });
    await expect(row.first()).toHaveAttribute('data-student-status', 'archived', { timeout: 30_000 });
    await shot(page, testInfo, 'd10-archived-row');

    // D10 THE FIX: the archived row's menu now offers Unarchive (and still no
    // second Archive).
    await row.first().getByRole('button', { name: 'Actions', exact: true }).click();
    const unarchiveItem = page.getByRole('menuitem', { name: 'Unarchive student', exact: true });
    await expect(unarchiveItem).toBeVisible({ timeout: 30_000 });
    await expect(page.getByRole('menuitem', { name: 'Archive student', exact: true })).toHaveCount(0);
    await shot(page, testInfo, 'd10-archived-row-menu-has-unarchive');
    await unarchiveItem.click();

    // Confirm gates the write, exactly like the Archive sibling.
    const unarchiveConfirm = page.getByRole('alertdialog');
    await expect(unarchiveConfirm).toBeVisible({ timeout: 30_000 });
    await expect(unarchiveConfirm.getByText(`Unarchive Una ${family}?`)).toBeVisible();
    await shot(page, testInfo, 'd10-unarchive-confirm-dialog');
    await unarchiveConfirm.getByRole('button', { name: 'Unarchive student', exact: true }).click();

    // Success toast, and the row flips back to active WITHOUT a reload.
    await expect(
      page.getByText(`Una ${family} was unarchived. They are active again.`, { exact: true }),
    ).toBeVisible({ timeout: 30_000 });
    await expect(row.first()).toHaveAttribute('data-student-status', 'active', { timeout: 30_000 });
    await expect(row.first()).not.toContainText('Archived');
    await shot(page, testInfo, 'd10-unarchived-active-again');

    // The API agrees: the student is active, inside the FIC-stamped class.
    const detail = await page.request
      .get(`http://127.0.0.1:5500/api/schools/me/children/${studentDocumentId}`, {
        headers: { Authorization: `Bearer ${jwt}` },
      })
      .then((res) => res.json() as Promise<{ data: { student_status: string; class?: { documentId?: string } } }>);
    expect(detail.data.student_status).toBe('active');
    expect(detail.data.class?.documentId).toBe(unarchiveClassId);
    expect(badResponses, '5xx responses on the students surface').toEqual([]);
    expect(errors).toEqual([]);
  });
});
