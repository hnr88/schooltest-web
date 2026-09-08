import path from 'node:path';

import { expect, test } from '@playwright/test';

import { apiEnv } from './helpers/auth-db';
import { cat, loadMessages } from './helpers/i18n';

// Ledger row 11d / D-007 — ONE spec walking all three C-OPS-04 inspection
// surfaces with ONE login as ops:
//   11b  the session responses.csv export beside the schools export
//   11a  form Q-matrix + key inspection on the school's window detail surface
//   11c  the audited view-as-teacher read from the teachers directory
//
// The 11c step is the only one that writes anything: the SERVER records an
// `api::audit-log` row (`view_as_teacher`, actor + target + time) for every
// call, which is the behaviour under test, not a side effect to hide. Nothing
// else here mutates.
//
// Screenshots attach to the result AND save under the mission captures dir as
// inspection-surfaces-*.png (desktop + 375px).

const en = loadMessages('en');
const CAPTURES =
  process.env.INSPECTION_CAPTURES_DIR
  ?? path.resolve(__dirname, '..', '..', '..', '.codephant', 'missions', 'msn-0da39441-f845-426b-88a1-037c9eb98442', 'captures');

// SchoolTest Demo School A — the school that actually owns teachers in the dev
// database (checked before writing this: every other school's teacher list is
// empty, so 11c would have no row to click).
const SCHOOL = 'y71h16mmldmxfecnao4diqd0';
// A complete progress session with 94 stored responses (dev database).
const SESSION = 'dyvqpiunc7a4mibn2f6fnwwu';

test.describe('ops inspection surfaces (ledger 11 / D-007)', () => {
  test.setTimeout(180_000);

  test('responses.csv downloads, form inspection shows keys, view-as-teacher is labelled impersonation', async ({
    page,
  }, testInfo) => {
    const consoleErrors: string[] = [];
    page.on('console', (message) => {
      if (message.type() === 'error') consoleErrors.push(message.text());
    });
    const apiStatuses: string[] = [];
    page.on('response', (response) => {
      const url = response.url();
      if (url.includes('/api/ops/responses.csv') || url.includes('/inspection') || url.includes('/api/ops/view-as-teacher/')) {
        apiStatuses.push(`${response.request().method()} ${url.replace('http://127.0.0.1:5500', '')} -> ${response.status()}`);
      }
    });

    // --- the one login ---
    await page.goto('/sign-in');
    await page.getByLabel(cat(en, 'Auth.emailLabel'), { exact: true }).fill('apiadmin@schooltest.local');
    await page.getByLabel(cat(en, 'Auth.passwordLabel'), { exact: true }).fill(apiEnv('SEED_APIADMIN_PASSWORD'));
    await page.getByRole('button', { name: cat(en, 'Auth.signInButton'), exact: true }).click();
    await page.waitForURL('**/dashboard');

    // --- 11b: the responses.csv export, beside the schools export ---
    await page.goto('/dashboard/ops/schools');
    const csvPanel = page.locator('[data-slot="ops-responses-export"]');
    await expect(csvPanel).toBeVisible({ timeout: 60_000 });
    // Beside, not instead of: the schools export is still there.
    await expect(page.locator('[data-slot="ops-schools-export"]')).toBeVisible();
    // Nothing to export until a session id is named — the server requires it.
    await expect(csvPanel.locator('[data-slot="ops-responses-export-cta"]')).toBeDisabled();
    await csvPanel.locator('[data-slot="ops-responses-export-input"]').fill(SESSION);
    await expect(csvPanel.locator('[data-slot="ops-responses-export-cta"]')).toBeEnabled();

    const download = page.waitForEvent('download', { timeout: 60_000 });
    await csvPanel.locator('[data-slot="ops-responses-export-cta"]').click();
    const done = csvPanel.locator('[data-slot="ops-responses-export-done"]');
    await expect(done).toBeVisible({ timeout: 60_000 });
    // The SERVER named the file (Content-Disposition), not the browser.
    await expect(done).toHaveAttribute('data-filename', `responses-${SESSION}.csv`);
    expect((await download).suggestedFilename()).toBe(`responses-${SESSION}.csv`);

    // --- 11a: form inspection on the window detail surface ---
    await page.goto(`/dashboard/ops/schools/${SCHOOL}`);
    const inspection = page.locator('[data-slot="ops-form-inspection"]');
    await expect(inspection).toBeVisible({ timeout: 60_000 });
    // Closed by default: this is the only surface that serves correct keys.
    await expect(inspection).toHaveAttribute('data-open', 'false');
    await expect(inspection.locator('[data-slot="ops-form-inspection-table"]')).toHaveCount(0);

    await inspection.locator('[data-slot="ops-form-inspection-toggle"]').click();
    await expect(inspection).toHaveAttribute('data-open', 'true');
    await expect(inspection.locator('[data-slot="ops-form-inspection-select"]')).toBeVisible({
      timeout: 60_000,
    });
    const summary = inspection.locator('[data-slot="ops-form-inspection-summary"]');
    await expect(summary).toBeVisible({ timeout: 60_000 });
    const rows = inspection.locator('[data-slot="ops-form-inspection-row"]');
    expect(await rows.count()).toBeGreaterThan(0);
    // A real authored key, rendered verbatim.
    await expect(inspection.locator('[data-slot="ops-form-inspection-key"]').first()).toContainText(
      'answer',
    );
    const desktopInspection = await page.screenshot({ fullPage: true });
    await testInfo.attach('inspection-surfaces-form-desktop', {
      body: desktopInspection,
      contentType: 'image/png',
    });
    const { writeFile } = await import('node:fs/promises');
    await writeFile(path.join(CAPTURES, 'inspection-surfaces-form-desktop.png'), desktopInspection);

    // --- 11c: the audited view-as-teacher read ---
    // A WIDER FRAME FIRST, and it is measured rather than cosmetic: this dialog
    // renders 384px wide while its 7-column directory table overflows to
    // x≈1285, so at 1280 the actions column sits outside the frame entirely and
    // is NOT reachable by scrolling (the container is not a scroller — the
    // table simply spills). Edit and Remove already share that pre-existing
    // problem; it is reported with this slice, not silently patched here. A
    // 1680px frame is where an operator actually reaches these controls.
    await page.setViewportSize({ width: 1680, height: 1000 });
    await page.locator('[data-slot="ops-count-card-teachers"]').click();
    const dialog = page.locator('[data-slot="ops-teachers-dialog"]');
    await expect(dialog).toBeVisible({ timeout: 60_000 });
    // Target the TEACHER row by email, not "the first row": this directory
    // lists school admins too (`teacherRoleSchema` = teacher | school_admin)
    // and the row contract carries no role, so the server 404s a view-as read
    // of an admin. Picking the row deterministically is the honest proof.
    const teacherRow = dialog.locator('[data-teacher-email="teacher@schooltest.local"]');
    await expect(teacherRow).toBeVisible({ timeout: 60_000 });
    const openViewAs = teacherRow.locator('[data-slot="ops-view-as-teacher-open"]');
    await expect(openViewAs).toBeVisible({ timeout: 60_000 });
    // The accessible name says impersonation BEFORE the click is recorded.
    await expect(openViewAs).toHaveAttribute('aria-label', /impersonation/i);
    await openViewAs.scrollIntoViewIfNeeded();
    await openViewAs.click();

    const panel = dialog.locator('[data-slot="ops-view-as-teacher-panel"]');
    await expect(panel).toBeVisible({ timeout: 60_000 });
    await expect(panel.locator('[data-slot="ops-view-as-teacher-impersonation-label"]')).toHaveText(
      cat(en, 'Ops.viewAsTeacher.impersonationTitle'),
    );
    // The two things the operator must not be able to miss: whose view, and
    // that the access is recorded.
    await expect(panel.locator('[data-slot="ops-view-as-teacher-subject"]')).toContainText(
      'teacher@schooltest.local',
    );
    await expect(panel.locator('[data-slot="ops-view-as-teacher-audited"]')).toContainText(
      'audit log',
    );
    // The teacher's own scope came back and rendered.
    await expect(panel.locator('[data-slot="ops-view-as-teacher-class-count"]')).toBeVisible();
    expect(await panel.locator('[data-slot="ops-view-as-teacher-class"]').count()).toBeGreaterThan(0);

    const desktopViewAs = await page.screenshot({ fullPage: true });
    await testInfo.attach('inspection-surfaces-view-as-desktop', {
      body: desktopViewAs,
      contentType: 'image/png',
    });
    await writeFile(path.join(CAPTURES, 'inspection-surfaces-view-as-desktop.png'), desktopViewAs);

    // Closing drops the impersonation payload (the query keeps no cache).
    await panel.locator('[data-slot="ops-view-as-teacher-close"]').click();
    await expect(panel).toHaveCount(0);

    // --- every surface answered, and the audited read is in the log ---
    expect(
      apiStatuses.filter((line) => line.includes('/inspection') && line.endsWith('-> 200')).length,
    ).toBeGreaterThan(0);
    expect(
      apiStatuses.filter((line) => line.includes('responses.csv') && line.endsWith('-> 200')).length,
    ).toBeGreaterThan(0);
    expect(
      apiStatuses.filter((line) => line.includes('view-as-teacher') && line.endsWith('-> 200'))
        .length,
    ).toBe(1);
    // CONSOLE ERRORS, split honestly. These pages carry 27 PRE-EXISTING
    // `IntlError: MISSING_MESSAGE` errors that this slice did not introduce and
    // is not scoped to fix — `Ops.export` (the whole schools-export namespace),
    // `Ops.createSchool.*`, `Ops.schools.bulkSuspend|bulkArchive`,
    // `Ops.activity` and thirteen `Ops.teachers.*` keys (the directory's own
    // filters, pagination and two columns) — so a blanket zero-errors assertion
    // could only be satisfied by fixing another row's work. Instead:
    //  1. NOTHING this slice added may be missing a message, and
    //  2. no error of any OTHER kind may appear (a React crash, a failed
    //     request, a thrown parse) — that keeps the real teeth. `IntlError` in
    //     any form is excluded because the same pages also raise a
    //     FORMATTING_ERROR of that family ("Archive {name}?" rendered with no
    //     `name`), which is the same pre-existing catalog defect.
    const mine = consoleErrors.filter((line) =>
      /Ops\.(inspection|responsesExport|viewAsTeacher)/.test(line),
    );
    expect(mine, `errors naming this slice: ${mine.join(' | ')}`).toHaveLength(0);
    const notIntl = consoleErrors.filter((line) => !line.includes('IntlError:'));
    expect(notIntl, `non-i18n console errors: ${notIntl.join(' | ')}`).toHaveLength(0);

    // --- 375px: the schools page export ---
    await page.setViewportSize({ width: 375, height: 812 });
    await page.goto('/dashboard/ops/schools');
    const mobileExport = page.locator('[data-slot="ops-responses-export"]');
    await expect(mobileExport).toBeVisible({ timeout: 60_000 });
    // Wait for the list itself to finish loading and scroll the panel into
    // frame: a full-page shot taken while the table is still skeleton proves
    // nothing about the control underneath it.
    await expect(page.locator('[data-slot="ops-directory"]')).toBeVisible({ timeout: 60_000 });
    await expect(page.getByRole('row').nth(1)).toBeVisible({ timeout: 60_000 });
    await mobileExport.scrollIntoViewIfNeeded();
    await page.waitForTimeout(400);
    const mobilePanel = await mobileExport.screenshot();
    await testInfo.attach('inspection-surfaces-375-export', {
      body: mobilePanel,
      contentType: 'image/png',
    });
    await writeFile(path.join(CAPTURES, 'inspection-surfaces-375-export.png'), mobilePanel);
    const mobile = await page.screenshot({ fullPage: true });
    await testInfo.attach('inspection-surfaces-375', { body: mobile, contentType: 'image/png' });
    const mobilePath = path.join(CAPTURES, 'inspection-surfaces-375.png');
    await writeFile(mobilePath, mobile);
    await testInfo.attach('inspection-surfaces-375-saved', { path: mobilePath });
  });
});
