import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';

import { expect, test, type Page, type TestInfo } from '@playwright/test';

import { liveDemoSchoolId, pickClass, signInAsOps } from './fleet3-helpers';
import { cat, loadMessages } from './helpers/i18n';
import { apiLoginRetried } from './helpers/ops34-api-retry';
import { loginAs } from './helpers/roles';
import { API_BASE } from './helpers/teacher-auth-rail';
import { freeStudents } from './helpers/teacher-live-sessions';
import { closeSession, readTests } from './helpers/teacher-past-sessions-api';
import { measureDialogFit, openDialog, type DialogFit } from './helpers/ui';

// Every portal modal sizes to its content under a max width only — proven in
// the REAL portal against the REAL API (:5500), no mocks, no page.route. Each
// modal is opened the way a user opens it, measured at 1440×900 and 1280×800,
// and must: sit inside the viewport, never scroll sideways (the dialog and
// every table in it), never clip a table header. A confirm stays narrower than
// the import preview. Nothing is committed: dialogs are opened and cancelled.
//
// MODAL_SIZING_PHASE (before|after) and MODAL_SIZING_SHOTS pick where the
// screenshots and the measured widths (fits-<role>.json) land.

const en = loadMessages('en');
const STAMP = Date.now();
const PHASE = process.env.MODAL_SIZING_PHASE ?? 'after';
const SHOTS = path.join(
  process.env.MODAL_SIZING_SHOTS ?? path.resolve(process.cwd(), 'test-results', 'modal-sizing'),
  PHASE,
);
const VIEWPORTS = [
  { width: 1440, height: 900 },
  { width: 1280, height: 800 },
] as const;

type Fits = Record<string, DialogFit>;

async function checkModal(page: Page, fits: Fits, name: string, testInfo: TestInfo): Promise<DialogFit> {
  const dialog = openDialog(page);
  let widest: DialogFit | null = null;
  for (const viewport of VIEWPORTS) {
    await page.setViewportSize(viewport);
    const fit = await measureDialogFit(dialog);
    const dir = path.join(SHOTS, `${viewport.width}x${viewport.height}`);
    await mkdir(dir, { recursive: true });
    const file = path.join(dir, `${name}.png`);
    await page.screenshot({ path: file });
    await testInfo.attach(`${name}@${viewport.width}`, { path: file, contentType: 'image/png' });
    fits[`${name}@${viewport.width}x${viewport.height}`] = fit;
    const at = `${name} @ ${viewport.width}×${viewport.height}`;
    expect.soft(fit.left, `${at}: left edge inside the viewport`).toBeGreaterThanOrEqual(0);
    expect.soft(fit.top, `${at}: top edge inside the viewport`).toBeGreaterThanOrEqual(0);
    expect.soft(fit.right, `${at}: right edge inside the viewport`).toBeLessThanOrEqual(fit.viewportWidth);
    expect.soft(fit.bottom, `${at}: bottom edge inside the viewport`).toBeLessThanOrEqual(fit.viewportHeight);
    expect.soft(fit.horizontalOverflow, `${at}: nothing scrolls sideways`).toEqual([]);
    expect.soft(fit.clippedHeaders, `${at}: no clipped table header`).toEqual([]);
    widest ??= fit;
  }
  await page.setViewportSize(VIEWPORTS[0]);
  return widest as DialogFit;
}

async function saveFits(role: string, fits: Fits): Promise<void> {
  await mkdir(SHOTS, { recursive: true });
  await writeFile(path.join(SHOTS, `fits-${role}.json`), `${JSON.stringify(fits, null, 2)}\n`);
}

async function closeModal(page: Page): Promise<void> {
  const dialog = openDialog(page);
  await page.keyboard.press('Escape');
  if (await dialog.waitFor({ state: 'hidden', timeout: 5_000 }).then(() => true, () => false)) return;
  await dialog.getByRole('button', { name: /^(Cancel|Close)$/ }).first().click();
  await expect(dialog).toBeHidden();
}

/**
 * Opens one modal through `open`, measures it at both viewports and closes it
 * without committing. A modal the live data cannot offer (`optional`) is noted
 * as an annotation; any other failure to open is a soft failure, so one broken
 * trigger never hides the measurements of the modals after it.
 */
async function modal(
  page: Page,
  fits: Fits,
  testInfo: TestInfo,
  name: string,
  open: () => Promise<unknown>,
  { optional = false }: { optional?: boolean } = {},
): Promise<DialogFit | null> {
  try {
    await open();
    await expect(openDialog(page)).toBeVisible({ timeout: 15_000 });
  } catch (error) {
    const reason = String(error).split('\n')[0];
    if (optional) testInfo.annotations.push({ type: 'skipped-modal', description: `${name}: ${reason}` });
    else expect.soft(reason, `${name} opens`).toBe('');
    await page.keyboard.press('Escape');
    return null;
  }
  const fit = await checkModal(page, fits, name, testInfo);
  await closeModal(page);
  return fit;
}

const rowMenu = (page: Page, label: string, row = 0) =>
  page.locator('[role="row"][data-directory-row]').nth(row).getByRole('button', { name: label, exact: true }).click();
const menuItem = (page: Page, name: string | RegExp) =>
  page.getByRole('menuitem', { name, exact: typeof name === 'string' }).first().click();

test.setTimeout(600_000);
test.use({ actionTimeout: 15_000 });

test('school admin: import students and the other school modals size to their content', async ({ page }, testInfo) => {
  const fits: Fits = {};
  const classId = 'hr2i9jmhfs6uf4mxcajj923m';
  const teacherId = 't75ektq5z1vzuysvaywff40l';
  await page.setViewportSize(VIEWPORTS[0]);
  await loginAs(page, 'schoolAdmin');

  // Students page → Import students, with the REAL template downloaded and
  // filled: long emails, and rows the parser refuses so the per-row report shows.
  await page.goto('/dashboard/school/students');
  await page.getByRole('button', { name: cat(en, 'SchoolStudents.importButton'), exact: true }).click();
  const dialog = openDialog(page);
  await expect(dialog.getByText(cat(en, 'StudentImport.requiredColumnsHint'))).toBeVisible();
  const [download] = await Promise.all([
    page.waitForEvent('download'),
    dialog.getByRole('button', { name: cat(en, 'StudentImport.downloadTemplate') }).click(),
  ]);
  const template = (await readFile(await download.path(), 'utf8')).replace(/^﻿/, '');
  const header = template.split(/\r?\n/)[0];
  const importEmpty = await checkModal(page, fits, 'school-students-import-empty', testInfo);

  const csv = [
    header,
    `Maximiliana-Josephine,Vandenberghe-Okonkwo,maximiliana.josephine.vandenberghe-okonkwo.${STAMP}@stmarys-catholic-college.schooltest.local,2013-04-12,8,vietnamese`,
    `Nomail,Sizing${STAMP},,2013-01-20,8,english`,
    `Bad Dob,Sizing${STAMP},bad.dob.${STAMP}@schooltest.local,20-01-2013,8,english`,
    `,Sizing${STAMP},no.given.name.${STAMP}@stmarys-catholic-college.schooltest.local,2013-01-20,13,`,
  ].join('\n');
  await dialog.getByLabel(cat(en, 'StudentImport.pasteLabel')).fill(csv);
  const rejects = dialog.locator('[data-slot="student-import-rejects"]');
  await expect(rejects.locator('tbody tr').nth(2)).toBeVisible();
  const importRejects = await checkModal(page, fits, 'school-students-import-rejects', testInfo);
  await rejects.scrollIntoViewIfNeeded();
  await checkModal(page, fits, 'school-students-import-rejects-report', testInfo);
  expect.soft(importRejects.width, 'the pasted rows widen the import dialog').toBeGreaterThan(importEmpty.width);
  await closeModal(page);

  const actions = cat(en, 'SchoolStudents.list.rowMenuLabel');
  await modal(page, fits, testInfo, 'school-student-edit', async () => {
    await rowMenu(page, actions);
    await menuItem(page, cat(en, 'SchoolStudents.actions.edit'));
  });
  const archiveConfirm = await modal(page, fits, testInfo, 'school-student-archive-confirm', async () => {
    await rowMenu(page, actions);
    await menuItem(page, cat(en, 'SchoolStudents.actions.archive'));
  }, { optional: true });
  await page.goto('/dashboard/school/students?status=archived');
  await modal(page, fits, testInfo, 'school-student-unarchive-confirm', async () => {
    await rowMenu(page, actions);
    await menuItem(page, cat(en, 'SchoolStudents.actions.unarchive'));
  }, { optional: true });

  await page.goto('/dashboard/school/classes');
  await modal(page, fits, testInfo, 'school-class-add', () =>
    page.getByRole('button', { name: cat(en, 'Classes.addButton'), exact: true }).click());
  await modal(page, fits, testInfo, 'school-class-assign-teachers', () =>
    page.getByRole('button', { name: cat(en, 'Classes.assignTeachersButton'), exact: true }).click());
  await modal(page, fits, testInfo, 'school-class-edit', async () => {
    await rowMenu(page, cat(en, 'Classes.list.rowMenuLabel'));
    await menuItem(page, cat(en, 'Classes.actions.edit'));
  });
  await modal(page, fits, testInfo, 'school-class-delete-confirm', async () => {
    await rowMenu(page, cat(en, 'Classes.list.rowMenuLabel'));
    await menuItem(page, cat(en, 'Classes.actions.delete'));
  });

  await page.goto(`/dashboard/school/classes/${classId}`);
  await expect(page.locator('[data-surface="school-admin-class-detail"]')).toBeVisible();
  await modal(page, fits, testInfo, 'school-class-import-students', async () => {
    await page.getByRole('button', { name: cat(en, 'Classes.detail.importStudents'), exact: true }).first().click();
    await openDialog(page).getByLabel(cat(en, 'StudentImport.pasteLabel')).fill(csv);
    await expect(openDialog(page).locator('[data-slot="student-import-rejects"] tbody tr').nth(2)).toBeVisible();
  });
  await modal(page, fits, testInfo, 'school-class-add-students', () =>
    page.getByRole('button', { name: cat(en, 'Classes.detail.addStudent'), exact: true }).first().click());
  await modal(page, fits, testInfo, 'school-class-add-teachers', () =>
    page
      .getByRole('list', { name: 'Teachers' })
      .getByRole('button', { name: cat(en, 'Classes.detail.teachers.add'), exact: true })
      .click());

  await page.goto('/dashboard/school/teachers');
  await modal(page, fits, testInfo, 'school-teacher-invite', () =>
    page.getByRole('button', { name: cat(en, 'Teachers.addButton'), exact: true }).first().click());
  await modal(page, fits, testInfo, 'school-teacher-edit', async () => {
    await rowMenu(page, cat(en, 'Teachers.table.rowMenuLabel'));
    await menuItem(page, /^Edit /);
  });
  await modal(page, fits, testInfo, 'school-teacher-deactivate-confirm', async () => {
    await rowMenu(page, cat(en, 'Teachers.table.rowMenuLabel'));
    await menuItem(page, cat(en, 'Teachers.actions.deactivate'));
  }, { optional: true });

  await page.goto(`/dashboard/school/teachers/${teacherId}`);
  await modal(page, fits, testInfo, 'school-teacher-assign-classes', () =>
    page.getByRole('button', { name: cat(en, 'Teachers.detail.assignButton'), exact: true }).first().click());

  await modal(page, fits, testInfo, 'school-search-palette', () =>
    page.getByLabel(cat(en, 'SchoolCommand.triggerLabel'), { exact: true }).first().click());

  if (archiveConfirm) expect.soft(archiveConfirm.width, 'a confirm is narrower than the import dialog').toBeLessThan(importRejects.width);
  await saveFits('school-admin', fits);
});

test('ops: import preview table and the other ops modals size to their content', async ({ page }, testInfo) => {
  const fits: Fits = {};
  await page.setViewportSize(VIEWPORTS[0]);
  const schoolId = await liveDemoSchoolId();
  const classId = 'ldir80prpa3oruquwazfaaau';
  await signInAsOps(page);

  await page.goto(`/dashboard/ops/schools/${schoolId}?tab=students`);
  await page
    .getByRole('button', { name: cat(en, 'Ops.schoolTables.studentsImportCta'), exact: true })
    .click({ timeout: 30_000 });
  const panel = page.locator('[data-surface="ops-student-import"]');
  await expect(panel).toBeVisible({ timeout: 30_000 });
  const [download] = await Promise.all([
    page.waitForEvent('download'),
    panel.locator('[data-surface="ops-import-template-download"]').click(),
  ]);
  const header = (await readFile(await download.path(), 'utf8')).replace(/^﻿/, '').split(/\r?\n/)[0];
  const importEmpty = await checkModal(page, fits, 'ops-students-import-empty', testInfo);

  const csv = [
    header,
    `Maximiliana-Josephine,Vandenberghe-Okonkwo,maximiliana.josephine.vandenberghe-okonkwo.${STAMP}@stmarys-catholic-college.schooltest.local,2013-04-12,8,vietnamese`,
    `Oluwaseun,Adebayo-Fitzgerald,oluwaseun.adebayo-fitzgerald.${STAMP}@schooltest.local,2012-11-02,9,yoruba`,
    `Opsnomail,Sizing${STAMP},,2013-02-02,8,english`,
  ].join('\n');
  await panel.locator('#ops-import-file').setInputFiles({
    name: `modal-sizing-${STAMP}.csv`,
    mimeType: 'text/csv',
    buffer: Buffer.from(csv),
  });
  await pickClass(page, 'EAL/D Year 7 - Room 4');
  const preview = panel.locator('[data-surface="ops-import-preview"]');
  await expect(preview).toBeVisible({ timeout: 30_000 });
  const importPreview = await checkModal(page, fits, 'ops-students-import-preview', testInfo);
  await preview.scrollIntoViewIfNeeded();
  await checkModal(page, fits, 'ops-students-import-preview-table', testInfo);
  expect.soft(importPreview.width, 'the preview is no longer held to the old 768px cap').toBeGreaterThan(768);
  expect.soft(importPreview.width, 'the preview never narrows the import dialog').toBeGreaterThanOrEqual(importEmpty.width);
  await closeModal(page);

  const rowActions = cat(en, 'Classes.list.rowMenuLabel');
  await modal(page, fits, testInfo, 'ops-student-create', () => page.getByTestId('ops-students-add-student').click());
  await modal(page, fits, testInfo, 'ops-student-profile', async () => {
    await rowMenu(page, rowActions);
    await menuItem(page, cat(en, 'Ops.schoolTables.opsProfileOpen'));
  });
  await modal(page, fits, testInfo, 'ops-student-move-class', async () => {
    await rowMenu(page, rowActions);
    await menuItem(page, cat(en, 'Ops.schoolTables.studentsActionMoveClass'));
  });
  const deactivate = await modal(page, fits, testInfo, 'ops-student-deactivate-confirm', async () => {
    await rowMenu(page, rowActions);
    await menuItem(page, cat(en, 'Ops.schoolTables.studentsActionDeactivate'));
  }, { optional: true });

  await page.goto(`/dashboard/ops/schools/${schoolId}?tab=classes`);
  await modal(page, fits, testInfo, 'ops-class-edit', async () => {
    await rowMenu(page, rowActions);
    await menuItem(page, cat(en, 'Ops.classActions.actions.edit'));
  });
  await modal(page, fits, testInfo, 'ops-class-reassign-teacher', async () => {
    await rowMenu(page, rowActions);
    await menuItem(page, cat(en, 'Ops.classActions.actions.reassignTeacher'));
  });
  await modal(page, fits, testInfo, 'ops-class-archive-confirm', async () => {
    await rowMenu(page, rowActions);
    await menuItem(page, cat(en, 'Ops.classActions.actions.archive'));
  });
  await modal(page, fits, testInfo, 'ops-class-set-test-window', async () => {
    await page.locator('[role="row"][data-directory-row]').filter({ hasText: 'EAL/D Year 7 - Room 4' }).getByRole('checkbox').first().check();
    await page.getByRole('button', { name: cat(en, 'Ops.classActions.bulk.setTestWindow'), exact: true }).click();
  }, { optional: true });

  await page.goto(`/dashboard/ops/schools/${schoolId}/classes/${classId}`);
  await modal(page, fits, testInfo, 'ops-class-detail-assign-teacher', () =>
    page.locator('[data-slot="ops-class-assign-teacher"]').first().click({ timeout: 30_000 }));
  await modal(page, fits, testInfo, 'ops-class-detail-add-students', () =>
    page.getByRole('button', { name: cat(en, 'Ops.classDetail.addStudents'), exact: true }).first().click());

  await page.goto(`/dashboard/ops/schools/${schoolId}?tab=teachers`);
  await modal(page, fits, testInfo, 'ops-teacher-edit-details', async () => {
    await rowMenu(page, rowActions);
    await menuItem(page, cat(en, 'Ops.schoolTables.actions.editDetails'));
  });
  await modal(page, fits, testInfo, 'ops-teacher-edit-access', async () => {
    await rowMenu(page, rowActions);
    await menuItem(page, cat(en, 'Ops.schoolTables.actions.editAccess'));
  });
  await modal(page, fits, testInfo, 'ops-teacher-suspend-confirm', async () => {
    await rowMenu(page, rowActions);
    await menuItem(page, /^Suspend /);
  }, { optional: true });

  await page.goto(`/dashboard/ops/schools/${schoolId}?tab=admins`);
  await modal(page, fits, testInfo, 'ops-staff-invitations', () => page.getByTestId('ops-admins-invite').click({ timeout: 30_000 }));
  await modal(page, fits, testInfo, 'ops-admin-make-owner', async () => {
    await rowMenu(page, rowActions);
    await menuItem(page, cat(en, 'Ops.schoolTables.makeOwner'));
  }, { optional: true });

  await page.goto(`/dashboard/ops/schools/${schoolId}`);
  await modal(page, fits, testInfo, 'ops-school-edit', () => page.getByTestId('ops-edit-school').first().click({ timeout: 30_000 }));
  const suspend = await modal(page, fits, testInfo, 'ops-school-suspend-confirm', () =>
    page.locator('[data-action="primary-suspend"]').click(), { optional: true });
  await modal(page, fits, testInfo, 'ops-school-archive-typed-confirm', async () => {
    await page.getByRole('button', { name: cat(en, 'Ops.detail.actions.menuLabel'), exact: true }).first().click();
    await menuItem(page, cat(en, 'Ops.detail.actions.archive'));
  });
  await modal(page, fits, testInfo, 'ops-school-invite-admin', () =>
    page.locator('[data-slot="ops-invitation-card"]').getByRole('button', { name: cat(en, 'Ops.onboard.button'), exact: true }).click(), { optional: true });

  await page.goto('/dashboard/ops/schools');
  await modal(page, fits, testInfo, 'ops-school-create', () => page.getByTestId('ops-create-school').click({ timeout: 30_000 }));

  await page.goto('/dashboard/ops/settings');
  await modal(page, fits, testInfo, 'ops-account-edit', () => page.getByTestId('ops-account-edit').click({ timeout: 30_000 }));

  const confirm = suspend ?? deactivate;
  if (confirm) expect.soft(confirm.width, 'a confirm is narrower than the import preview').toBeLessThan(importPreview.width);
  await saveFits('ops', fits);
});

test('teacher: session, reports, export and live-room modals size to their content', async ({ page, request }, testInfo) => {
  const fits: Fits = {};
  const classId = 'qves8wrtl7r9ctw49jivm8gl';
  await page.setViewportSize(VIEWPORTS[0]);
  await loginAs(page, 'teacher');

  await page.goto('/dashboard/results');
  await page.locator('[data-slot="start-session-button"]').first().click();
  await expect(page.locator('[data-surface="start-session-modal"]')).toBeVisible();
  await checkModal(page, fits, 'teacher-start-session', testInfo);
  // Teacher demo mints a real single-use demo link and swaps in its dialog.
  await page.locator('[data-slot="start-choice"][data-value="demo"]').click();
  await page.locator('[data-slot="start-session-cta"]').click();
  const demoLink = page.locator('[data-surface="demo-link-dialog"]');
  if (await demoLink.waitFor({ state: 'visible', timeout: 15_000 }).then(() => true, () => false)) {
    await checkModal(page, fits, 'teacher-demo-link', testInfo);
  } else {
    testInfo.annotations.push({ type: 'skipped-modal', description: 'demo link: the server refused the demo token' });
  }
  await closeModal(page);

  await page.goto(`/dashboard/results/${classId}`);
  await page.locator('[data-slot="class-reports-button"]').click();
  await expect(page.locator('[data-surface="class-reports-modal"]')).toBeVisible();
  await checkModal(page, fits, 'teacher-class-reports', testInfo);
  await closeModal(page);

  await page.goto(`/dashboard/results/${classId}?tab=insights`);
  await page.locator('button[data-export-kind="insights"]').click({ timeout: 60_000 });
  await expect(page.locator('[data-slot="teacher-export-preview"]')).toBeVisible({ timeout: 60_000 });
  await checkModal(page, fits, 'teacher-export-preview', testInfo);
  await closeModal(page);

  await page.goto(`/dashboard/results/${classId}?tab=reports`);
  const reports = page.locator('[data-tab-panel="reports"] [data-slot="family-reports"]');
  await reports.locator('[data-action="release-held"]').click({ timeout: 60_000 });
  await expect(page.getByRole('alertdialog')).toBeVisible();
  const releaseConfirm = await checkModal(page, fits, 'teacher-release-held-confirm', testInfo);
  await closeModal(page);

  const previewRow = reports
    .locator('[data-slot="family-report-row"]')
    .filter({ has: page.getByRole('button', { name: cat(en, 'TeacherPortal.familyReports.actions.preview'), exact: true }) })
    .first();
  await previewRow.getByRole('button', { name: cat(en, 'TeacherPortal.familyReports.actions.preview'), exact: true }).click();
  await expect(page.locator('[data-slot="carer-report-preview"]')).toBeVisible();
  await checkModal(page, fits, 'teacher-carer-report-preview', testInfo);
  await closeModal(page);

  const recallButton = reports
    .getByRole('button', { name: cat(en, 'TeacherPortal.familyReports.actions.recall'), exact: true })
    .first();
  if ((await recallButton.count()) > 0) {
    await recallButton.click();
    await expect(page.locator('[data-slot="recall-report-dialog"]')).toBeVisible();
    await checkModal(page, fits, 'teacher-recall-report', testInfo);
    await closeModal(page);
  } else {
    testInfo.annotations.push({ type: 'skipped-modal', description: 'recall: no released family report on t2' });
  }

  // A real sitting on the class (closed again below): Test settings, the
  // row action confirm and the Close sitting confirm all live on its Live tab.
  const jwt = await apiLoginRetried(request, 'teacher');
  const [form] = await readTests(request, jwt);
  const members = freeStudents(classId).slice(0, 2);
  expect(form, 't2 owns a test').toBeDefined();
  expect(members.length, 't2 has free students').toBeGreaterThan(0);
  const created = await request.post(`${API_BASE}/api/teacher/test-sessions`, {
    headers: { Authorization: `Bearer ${jwt}` },
    data: { class_document_id: classId, form_document_id: form?.form_document_id, student_document_ids: members },
  });
  expect(created.status(), 'POST /api/teacher/test-sessions').toBe(201);
  const sittingId = ((await created.json()) as { sitting_document_id: string }).sitting_document_id;
  try {
    await page.goto(`/dashboard/results/${classId}?tab=live&session=${sittingId}`);
    const surface = page.locator('[data-surface="teacher-test-day"]');
    await expect(surface).toHaveAttribute('data-status', 'ready', { timeout: 60_000 });

    await surface.locator('[data-slot="test-settings-button"]').click();
    await expect(page.locator('[data-slot="session-settings-modal"]')).toBeVisible();
    await checkModal(page, fits, 'teacher-session-settings', testInfo);
    await closeModal(page);

    await surface.locator('[data-slot="live-row-menu"]').first().click();
    await page.locator('[data-action="markAbsent"]').first().click();
    await expect(page.getByRole('alertdialog')).toBeVisible();
    await checkModal(page, fits, 'teacher-mark-absent-confirm', testInfo);
    await closeModal(page);

    await surface.locator('[data-slot="join-code-cell"]').getByRole('button', { name: cat(en, 'TeacherPortal.live.room.close'), exact: true }).click();
    await expect(page.getByRole('alertdialog')).toBeVisible();
    await checkModal(page, fits, 'teacher-close-sitting-confirm', testInfo);
    await closeModal(page);
  } finally {
    await closeSession(request, jwt, sittingId);
  }

  expect.soft(releaseConfirm.width, 'a confirm stays compact').toBeLessThanOrEqual(512);
  await saveFits('teacher', fits);
});
