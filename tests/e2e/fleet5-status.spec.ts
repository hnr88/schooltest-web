import { expect, test, type Page } from '@playwright/test';

import {
  apiArchive,
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
 * Fleet 5 — STATUS LIFECYCLE. Archive CTA (confirm-gated, pill updates), the
 * archived row's menu (no second Archive), unarchive at the API (the
 * school-admin UI ships NO unarchive control — asserted here, reported),
 * idempotent re-archive, double-click guards, refresh mid-form, back-nav
 * staleness. Deactivate/reactivate are OPS-console actions, not school-admin
 * ones — the API's 404 for them is pinned here as the contract probe.
 */

const ROSTER = '/en/dashboard/school/students';
const NEW = '/en/dashboard/school/students/new';
const API = 'http://127.0.0.1:5500';

async function openRosterWithStudent(page: Page, family: string) {
  await signIn(page);
  await page.goto(ROSTER);
  const screen = page.locator('[data-slot="school-students"]');
  await expect(screen).toBeVisible({ timeout: 30_000 });
  await screen.getByLabel('Search by name').fill(family);
  const row = screen
    .locator('[data-slot="school-students-table"]')
    .locator('[data-slot="school-students-row"]');
  await expect(row).toHaveCount(1, { timeout: 30_000 });
  return { screen, row: row.first() };
}

test.describe('fleet5: status lifecycle', () => {
  test.setTimeout(90_000);

  test('40 archive: confirm gates, toast fires, pill appears, seat math stays whole', async ({
    page,
    request,
  }) => {
    test.setTimeout(150_000);
    page.setDefaultTimeout(30_000);
    const errors = watchErrors(page);
    await page.setViewportSize({ width: 1440, height: 900 });
    const jwt = await apiLogin(request);
    const family = `${STAMP}ArchUi`;
    const created = await apiCreateStudent(request, jwt, {
      given_name: 'Arrow',
      family_name: family,
      email: `f5.archui.${STAMP.toLowerCase()}@schooltest.local`,
      year_level: 7,
    });
    expect(created.status, JSON.stringify(created.error)).toBe(201);
    const documentId = created.data!.documentId;

    // Entitlement seat before/after: archiving frees a seat.
    const seatsBefore = await request
      .get(`${API}/api/schools/me/entitlement`, { headers: { Authorization: `Bearer ${jwt}` } })
      .then((res) => res.json() as Promise<{ data: { seats_used: number } }>)
      .then((body) => body.data.seats_used);

    await signIn(page);
    const { screen, row } = await openRosterWithStudent(page, family);
    await expect(row).not.toContainText('Archived');
    await shot(page, '40a-active-row-before-archive');

    // Confirm GATES the mutation: menu -> dialog -> confirm.
    await row.getByRole('button', { name: 'Actions', exact: true }).click();
    const archiveItem = page.getByRole('menuitem', { name: 'Archive student', exact: true });
    await expect(archiveItem).toBeVisible();
    // Cancel first — nothing may change.
    await archiveItem.click();
    const confirm = page.getByRole('alertdialog');
    await expect(confirm).toBeVisible({ timeout: 30_000 });
    await expect(confirm.getByText(`Archive Arrow ${family}?`)).toBeVisible();
    await expect(
      confirm.getByText('Archiving frees their seat straight away.', { exact: false }),
    ).toBeVisible();
    await shot(page, '40b-archive-confirm-dialog');
    await confirm.getByRole('button', { name: 'Cancel', exact: true }).click();
    await expect(confirm).toBeHidden();
    let apiStatus = (await apiChildren(request, jwt, `q=${family}`)).rows[0]!.student_status;
    expect(apiStatus, 'cancel must leave the student active').toBe('active');

    // Now the real archive.
    await row.getByRole('button', { name: 'Actions', exact: true }).click();
    await page.getByRole('menuitem', { name: 'Archive student', exact: true }).click();
    await expect(page.getByRole('alertdialog')).toBeVisible();
    await shot(page, '40c-archive-confirm-again');
    await page
      .getByRole('alertdialog')
      .getByRole('button', { name: 'Archive student', exact: true })
      .click();
    await expect(
      page.getByText(`Arrow ${family} was archived. Their seat is free again.`, { exact: true }),
    ).toBeVisible({ timeout: 30_000 });
    await shot(page, '40d-archive-toast');

    // The row's pill updates WITHOUT a reload (query invalidation).
    await expect(row).toContainText('Archived', { timeout: 30_000 });
    await expect(row).toHaveAttribute('data-student-status', 'archived');
    await shot(page, '40e-row-pill-archived');

    const seatsAfter = await request
      .get(`${API}/api/schools/me/entitlement`, { headers: { Authorization: `Bearer ${jwt}` } })
      .then((res) => res.json() as Promise<{ data: { seats_used: number } }>)
      .then((body) => body.data.seats_used);
    expect(seatsAfter, 'archiving frees exactly one seat').toBe(seatsBefore - 1);

    apiStatus = (await apiChildren(request, jwt, `q=${family}`)).rows[0]!.student_status;
    expect(apiStatus).toBe('archived');
    expect(realErrors(errors), realErrors(errors).join('\n')).toEqual([]);
  });

  test('41 archived row: menu offers no second Archive; re-archive idempotent; unarchive restores (API — the UI ships no control)', async ({
    page,
    request,
  }) => {
    test.setTimeout(120_000);
    page.setDefaultTimeout(30_000);
    const errors = watchErrors(page);
    await page.setViewportSize({ width: 1440, height: 900 });
    const jwt = await apiLogin(request);
    const family = `${STAMP}Unarch`;
    const created = await apiCreateStudent(request, jwt, {
      given_name: 'Una',
      family_name: family,
      email: `f5.unarch.${STAMP.toLowerCase()}@schooltest.local`,
      year_level: 8,
    });
    expect(created.status, JSON.stringify(created.error)).toBe(201);
    const documentId = created.data!.documentId;
    expect(await apiArchive(request, jwt, documentId, 'archive')).toBe(200);

    await signIn(page);
    const { row } = await openRosterWithStudent(page, family);
    await expect(row).toContainText('Archived');
    await shot(page, '41a-archived-row');

    // The archived row's menu: Edit yes, Archive GONE (refusal by absence).
    await row.getByRole('button', { name: 'Actions', exact: true }).click();
    await expect(page.getByRole('menuitem', { name: 'Edit student', exact: true })).toBeVisible();
    await expect(
      page.getByRole('menuitem', { name: 'Archive student', exact: true }),
    ).toHaveCount(0);
    await shot(page, '41b-archived-menu-no-archive');
    await page.keyboard.press('Escape');

    // Idempotent re-archive on the wire: 200, still archived, no 500.
    expect(await apiArchive(request, jwt, documentId, 'archive')).toBe(200);
    expect((await apiChildren(request, jwt, `q=${family}`)).rows[0]!.student_status).toBe(
      'archived',
    );

    // Unarchive: API-level only — the school-admin UI offers NO unarchive.
    expect(await apiArchive(request, jwt, documentId, 'unarchive')).toBe(200);
    expect((await apiChildren(request, jwt, `q=${family}`)).rows[0]!.student_status).toBe(
      'active',
    );

    // Reload the roster: the pill is gone again.
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
    await expect(rowAfter.first()).not.toContainText('Archived');
    await expect(rowAfter.first()).toHaveAttribute('data-student-status', 'active');
    await shot(page, '41c-unarchived-active-again');
    expect(realErrors(errors), realErrors(errors).join('\n')).toEqual([]);
  });

  test('42 deactivate/reactivate are NOT school-admin actions (contract probe)', async ({
    request,
  }) => {
    test.setTimeout(90_000);
    const jwt = await apiLogin(request);
    const family = `${STAMP}Deact`;
    const created = await apiCreateStudent(request, jwt, {
      given_name: 'Dea',
      family_name: family,
      email: `f5.deact.${STAMP.toLowerCase()}@schooltest.local`,
      year_level: 7,
    });
    expect(created.status).toBe(201);
    const documentId = created.data!.documentId;
    for (const action of ['deactivate', 'reactivate']) {
      const res = await request.post(`${API}/api/schools/me/children/${documentId}/${action}`, {
        headers: { Authorization: `Bearer ${jwt}` },
        data: {},
      });
      // Not offered to this surface: 404 (no such route) is the contract.
      expect(
        res.status(),
        `${action} must not be a school-admin student action`,
      ).toBe(404);
    }
  });

  test('43 double-click Save creates exactly ONE student', async ({ page, request }) => {
    test.setTimeout(120_000);
    page.setDefaultTimeout(30_000);
    const errors = watchErrors(page);
    await page.setViewportSize({ width: 1440, height: 900 });
    const jwt = await apiLogin(request);
    const family = `${STAMP}DblSave`;

    await signIn(page);
    await page.goto(NEW);
    const form = page.locator('[data-slot="school-student-new"]');
    await form.getByLabel('Given name').fill('Dee');
    await form.getByLabel('Family name', { exact: true }).fill(family);
    await form.getByLabel('Email', { exact: true }).fill(`f5.dblsave.${STAMP.toLowerCase()}@schooltest.local`);
    // Two rapid clicks: the pending gate must swallow the second.
    await Promise.all([
      form.getByRole('button', { name: 'Add student', exact: true }).dblclick(),
    ]);
    await page.waitForURL('**/dashboard/school/students', { timeout: 30_000 });
    await shot(page, '43a-double-save-landed');

    const { total, rows } = await apiChildren(request, jwt, `q=${family}`);
    expect(total, `double Save must create ONE student, got ${total}`).toBe(1);
    expect(rows[0]!.given_name).toBe('Dee');

    // And the created account provisioning is single, not duplicated.
    const link = await import('./helpers/fleet5-live').then((m) =>
      m.dbStudentUserLink(rows[0]!.documentId),
    );
    expect(link).toBeTruthy();
    expect(link!.email).toBe(`f5.dblsave.${STAMP.toLowerCase()}@schooltest.local`);
    await shot(page, '43b-double-save-single-row');
    expect(realErrors(errors), realErrors(errors).join('\n')).toEqual([]);
  });

  test('44 double-click Archive confirm fires the mutation exactly once', async ({
    page,
    request,
  }) => {
    test.setTimeout(120_000);
    page.setDefaultTimeout(30_000);
    const errors = watchErrors(page);
    await page.setViewportSize({ width: 1440, height: 900 });
    const jwt = await apiLogin(request);
    const family = `${STAMP}DblArch`;
    const created = await apiCreateStudent(request, jwt, {
      given_name: 'Dee',
      family_name: family,
      email: `f5.dblarch.${STAMP.toLowerCase()}@schooltest.local`,
      year_level: 7,
    });
    expect(created.status).toBe(201);
    const documentId = created.data!.documentId;

    await signIn(page);
    const { row } = await openRosterWithStudent(page, family);
    let archivePosts = 0;
    page.on('request', (req) => {
      if (req.method() === 'POST' && req.url().endsWith(`/children/${documentId}/archive`)) {
        archivePosts += 1;
      }
    });

    await row.getByRole('button', { name: 'Actions', exact: true }).click();
    await page.getByRole('menuitem', { name: 'Archive student', exact: true }).click();
    const confirm = page.getByRole('alertdialog');
    await expect(confirm).toBeVisible();
    await confirm.getByRole('button', { name: 'Archive student', exact: true }).dblclick();
    await expect(
      page.getByText(`Dee ${family} was archived. Their seat is free again.`, { exact: true }),
    ).toBeVisible({ timeout: 30_000 });
    await shot(page, '44a-double-archive-confirm');

    await expect
      .poll(() => archivePosts, { timeout: 15_000 })
      .toBe(1);
    expect((await apiChildren(request, jwt, `q=${family}`)).rows[0]!.student_status).toBe(
      'archived',
    );
    expect(realErrors(errors), realErrors(errors).join('\n')).toEqual([]);
  });

  test('45 refresh mid-form: no ghost row, form resets', async ({ page, request }) => {
    test.setTimeout(120_000);
    page.setDefaultTimeout(30_000);
    const errors = watchErrors(page);
    await page.setViewportSize({ width: 1440, height: 900 });
    const jwt = await apiLogin(request);
    const family = `${STAMP}Ghost`;
    const before = await apiChildren(request, jwt, 'page=1&pageSize=1');

    await signIn(page);
    await page.goto(NEW);
    const form = page.locator('[data-slot="school-student-new"]');
    await form.getByLabel('Given name').fill('Ghostly');
    await form.getByLabel('Family name', { exact: true }).fill(family);
    await form.getByLabel('Email', { exact: true }).fill(`f5.ghost.${STAMP.toLowerCase()}@schooltest.local`);
    await shot(page, '45a-mid-form-filled');

    await page.reload();
    const reloaded = page.locator('[data-slot="school-student-new"]');
    await expect(reloaded).toBeVisible({ timeout: 30_000 });
    await expect(reloaded.getByLabel('Given name')).toHaveValue('');
    await expect(reloaded.getByLabel('Family name', { exact: true })).toHaveValue('');
    await shot(page, '45b-after-refresh-form-reset');

    const after = await apiChildren(request, jwt, 'page=1&pageSize=1');
    expect(after.total, 'a refresh mid-form must not create a row').toBe(before.total);
    const ghost = await apiChildren(request, jwt, `q=${family}`);
    expect(ghost.total).toBe(0);
    expect(realErrors(errors), realErrors(errors).join('\n')).toEqual([]);
  });

  test('46 archive then back-navigation: the roster is not stale', async ({
    page,
    request,
  }) => {
    test.setTimeout(150_000);
    page.setDefaultTimeout(30_000);
    const errors = watchErrors(page);
    await page.setViewportSize({ width: 1440, height: 900 });
    const jwt = await apiLogin(request);
    const family = `${STAMP}BackNav`;
    const created = await apiCreateStudent(request, jwt, {
      given_name: 'Bak',
      family_name: family,
      email: `f5.backnav.${STAMP.toLowerCase()}@schooltest.local`,
      year_level: 7,
    });
    expect(created.status).toBe(201);
    const documentId = created.data!.documentId;

    await signIn(page);
    await page.goto(`${ROSTER}/${documentId}`);
    const detail = page.locator('[data-slot="school-student-detail"]');
    await expect(detail.getByRole('heading', { level: 1, name: `Bak ${family}` })).toBeVisible({
      timeout: 30_000,
    });
    // Active pill on detail...
    await expect(detail.getByText('Active', { exact: true }).first()).toBeVisible();
    await shot(page, '46a-detail-active');

    // ...archive via the API while we sit on the detail...
    expect(await apiArchive(request, jwt, documentId, 'archive')).toBe(200);

    // ...navigate BACK to the roster: it must show the fresh archived truth,
    // not a cached active row.
    await page.goBack();
    const screen = page.locator('[data-slot="school-students"]');
    await expect(screen).toBeVisible({ timeout: 30_000 });
    await screen.getByLabel('Search by name').fill(family);
    const row = screen
      .locator('[data-slot="school-students-table"]')
      .locator('[data-slot="school-students-row"]');
    await expect(row).toHaveCount(1, { timeout: 30_000 });
    await expect(row.first()).toHaveAttribute('data-student-status', 'archived', {
      timeout: 30_000,
    });
    await shot(page, '46b-back-nav-shows-archived');
    expect(realErrors(errors), realErrors(errors).join('\n')).toEqual([]);
  });
});
