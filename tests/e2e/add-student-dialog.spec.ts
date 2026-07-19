import path from 'node:path';

import { AxeBuilder } from '@axe-core/playwright';
import { expect, type Page, test } from '@playwright/test';

import { cat, icu, loadMessages } from './helpers/i18n';
import { watchErrors } from './helpers/ui';

// Task 17 verification: AddStudentDialog persists via the real C-STUDENT-CREATE
// endpoint (POST /api/students) through use-create-student.mutation — no mocks.
// Each test registers its OWN fresh throwaway parent (never the seeded
// parent@schooltest.local) so it never perturbs task 16's "exactly 2 students"
// fixtures/e2e assumptions.
const en = loadMessages('en');
const SCREENSHOTS = path.resolve(process.cwd(), '.qa', 'screenshots');
const DESKTOP = { width: 1280, height: 800 };
const API_BASE_URL = 'http://localhost:5500';

function freshParent() {
  const suffix = `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`;
  return {
    username: `e2e${suffix}`.slice(0, 20),
    email: `e2e-${suffix}@schooltest.local`,
    password: 'Parent1234!',
  };
}

async function registerAndVisitDashboard(
  page: Page,
  request: import('@playwright/test').APIRequestContext,
): Promise<void> {
  const parent = freshParent();
  const registerRes = await request.post(`${API_BASE_URL}/api/auth/local/register`, {
    data: parent,
  });
  expect(registerRes.ok(), await registerRes.text()).toBeTruthy();
  const { jwt } = (await registerRes.json()) as { jwt: string };
  await page.addInitScript((token) => {
    window.localStorage.setItem('app.auth.token', token);
  }, jwt);
  await page.goto('/dashboard');
}

// Serial: each test registers its own throwaway parent against the real api.
// Firing several registrations at once races the api's role-assignment write
// (a pre-existing backend characteristic, unrelated to this task's frontend
// slice — reproduced independently with a raw concurrent-curl script, zero
// concurrency = zero flakes). Running this file's registrations one at a time
// sidesteps it without touching backend code.
test.describe.configure({ mode: 'serial' });

test('en: parent adds a student via the dialog — appears without reload, persists after reload, axe clean', async ({
  page,
  request,
}) => {
  const errors = watchErrors(page);
  await page.setViewportSize(DESKTOP);
  await registerAndVisitDashboard(page, request);

  // Zero students yet — the empty state's own action opens the same dialog
  // as the header button (Objective: "from the dashboard header + empty state").
  await expect(page.getByText(cat(en, 'Dashboard.studentsEmptyTitle'))).toBeVisible();
  await page
    .locator('[data-slot="empty-state"]')
    .getByRole('button', { name: cat(en, 'Dashboard.addStudent') })
    .click();

  const dialog = page.getByRole('dialog', { name: cat(en, 'Dashboard.dialogTitle') });
  await expect(dialog).toBeVisible();

  // Focus management from the primitive: opening the dialog moves focus inside it.
  await expect(dialog).toContainText(cat(en, 'Dashboard.dialogSubtitle'));
  const focusedInsideDialog = await page.evaluate(
    () => document.activeElement?.closest('[data-slot="dialog-content"]') !== null,
  );
  expect(focusedInsideDialog).toBe(true);

  const axeOpen = await new AxeBuilder({ page }).analyze();
  const openBlockers = axeOpen.violations.filter(
    (violation) => violation.impact === 'serious' || violation.impact === 'critical',
  );
  expect(openBlockers.map((violation) => `${violation.impact}:${violation.id}`)).toEqual([]);

  await dialog.getByLabel(cat(en, 'Dashboard.fieldFirstName')).fill('Testa');
  await dialog.getByLabel(cat(en, 'Dashboard.fieldLastName')).fill('Rig');
  await dialog.getByRole('combobox', { name: cat(en, 'Dashboard.fieldYearLevel') }).click();
  await page
    .getByRole('option', { name: icu(cat(en, 'Dashboard.yearLevelOption'), { level: '9' }) })
    .click();
  await dialog.getByLabel(cat(en, 'Dashboard.fieldEmail')).fill('testa.rig@schooltest.local');
  await dialog.getByRole('button', { name: cat(en, 'Dashboard.addStudent'), exact: true }).click();

  // Toast + close, no manual reload — the row appears purely from query invalidation.
  await expect(
    page.getByText(icu(cat(en, 'Dashboard.addedToast'), { name: 'Testa Rig' })),
  ).toBeVisible();
  await expect(dialog).toBeHidden();

  const row = page.getByRole('row', { name: /Testa Rig/ });
  await expect(row).toBeVisible();
  await expect(row).toContainText('9');
  await expect(row).toContainText('testa.rig@schooltest.local');
  await expect(page.locator('[data-slot="students-heading"]')).toContainText('1');

  await page.screenshot({ path: path.join(SCREENSHOTS, 'dashboard-add-student-en.png') });

  // Persistence: survives a full page reload (real Document Service write).
  await page.reload();
  const rowAfterReload = page.getByRole('row', { name: /Testa Rig/ });
  await expect(rowAfterReload).toBeVisible();
  await expect(rowAfterReload).toContainText('9');

  expect(errors, errors.join('\n')).toEqual([]);
});

test('en: required fields are blocked client-side — no year level selected, empty names', async ({
  page,
  request,
}) => {
  await page.setViewportSize(DESKTOP);
  await registerAndVisitDashboard(page, request);

  await page
    .locator('[data-slot="students-heading"]')
    .getByRole('button', { name: cat(en, 'Dashboard.addStudent') })
    .click();
  const dialog = page.getByRole('dialog', { name: cat(en, 'Dashboard.dialogTitle') });
  await expect(dialog).toBeVisible();

  await dialog.getByRole('button', { name: cat(en, 'Dashboard.addStudent'), exact: true }).click();

  await expect(dialog.getByText(cat(en, 'Dashboard.nameRequired')).first()).toBeVisible();
  await expect(dialog.getByText(cat(en, 'Dashboard.yearLevelRequired'))).toBeVisible();
  // Blocked before any request reached the api — the dialog never closes.
  await expect(dialog).toBeVisible();
  await expect(page.getByRole('table')).toHaveCount(0);
});

test('en: an invalid email is blocked client-side', async ({ page, request }) => {
  await page.setViewportSize(DESKTOP);
  await registerAndVisitDashboard(page, request);

  await page
    .locator('[data-slot="students-heading"]')
    .getByRole('button', { name: cat(en, 'Dashboard.addStudent') })
    .click();
  const dialog = page.getByRole('dialog', { name: cat(en, 'Dashboard.dialogTitle') });

  await dialog.getByLabel(cat(en, 'Dashboard.fieldFirstName')).fill('Testa');
  await dialog.getByLabel(cat(en, 'Dashboard.fieldLastName')).fill('Rig');
  await dialog.getByRole('combobox', { name: cat(en, 'Dashboard.fieldYearLevel') }).click();
  await page
    .getByRole('option', { name: icu(cat(en, 'Dashboard.yearLevelOption'), { level: '7' }) })
    .click();
  await dialog.getByLabel(cat(en, 'Dashboard.fieldEmail')).fill('not-an-email');
  await dialog.getByRole('button', { name: cat(en, 'Dashboard.addStudent'), exact: true }).click();

  await expect(dialog.getByText(cat(en, 'Dashboard.emailInvalid'))).toBeVisible();
  await expect(dialog).toBeVisible();
});

test('en: Cancel closes the dialog without submitting', async ({ page, request }) => {
  await page.setViewportSize(DESKTOP);
  await registerAndVisitDashboard(page, request);

  await page
    .locator('[data-slot="students-heading"]')
    .getByRole('button', { name: cat(en, 'Dashboard.addStudent') })
    .click();
  const dialog = page.getByRole('dialog', { name: cat(en, 'Dashboard.dialogTitle') });
  await dialog.getByLabel(cat(en, 'Dashboard.fieldFirstName')).fill('Should Not Save');
  await dialog.getByRole('button', { name: cat(en, 'Dashboard.cancel') }).click();

  await expect(dialog).toBeHidden();
  await expect(page.getByText('Should Not Save')).toHaveCount(0);
  await expect(page.getByText(cat(en, 'Dashboard.studentsEmptyTitle'))).toBeVisible();
});
