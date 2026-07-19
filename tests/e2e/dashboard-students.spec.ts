import path from 'node:path';

import { expect, type Page, test } from '@playwright/test';

import { deleteAuthEmailRows } from './helpers/auth-db';
import { cat, icu, loadMessages } from './helpers/i18n';
import { loginParentJwt, registerAndConfirmParent } from './helpers/throwaway-parent';
import { watchErrors } from './helpers/ui';

// Task 21 verification: C-STUDENT-CREATE through the real dialog, with a
// DB-truth reload proof AND a direct api-only assertion (bypassing the
// TanStack Query cache entirely) that the created row is scoped to its
// owning parent. Each test provisions its OWN fresh throwaway parent through
// the full real register → Mailpit confirm → login round-trip (D-AUTH-1:
// register alone no longer returns a jwt; same convention as tasks 16/17 —
// never the seeded parent@schooltest.local) so this file never perturbs the
// "seeded parent has exactly Mia+Jonas" fixtures/e2e assumptions relied on
// elsewhere.
//
// Deviation from the task-21 spec text (recorded, not silently ignored): the
// spec says "prove via a direct api GET /api/students". Live-verified
// against the real api (curl, seeded parent JWT): GET /api/students now 403s
// for the parent role (core route carries an IS_TEACHER policy per
// CONTRACTS.md D16 — GET /api/students/:id also 403s the same way). The
// CURRENT, CONTRACTS.md-authoritative parent-read route is
// GET /api/my/students (C-STUDENT-LIST), which forces
// filters[parent][documentId][$eq]=<caller> server-side — so a direct call
// with the CALLER's own JWT returning exactly the created row (and nothing
// else, for a fresh zero-student parent) is itself the ownership proof the
// task asks for. This file uses that route instead of the stale reference.
const en = loadMessages('en');
const SCREENSHOTS = path.resolve(process.cwd(), '.qa', 'screenshots');
const DESKTOP = { width: 1280, height: 800 };
const API_BASE_URL = 'http://localhost:5500';
const usedEmails: string[] = [];

async function registerAndVisitDashboard(
  page: Page,
  request: import('@playwright/test').APIRequestContext,
  flow: string,
): Promise<void> {
  const parent = await registerAndConfirmParent(request, flow);
  usedEmails.push(parent.email);
  const jwt = await loginParentJwt(request, parent);
  await page.addInitScript((token) => {
    window.localStorage.setItem('app.auth.token', token);
  }, jwt);
  await page.goto('/dashboard');
}

interface ApiStudent {
  documentId: string;
  given_name: string;
  family_name: string;
  year_level: number | null;
  email: string | null;
}

interface ApiStudentsResponse {
  data: ApiStudent[];
  meta: { pagination: { total: number } };
}

// Serial: each test registers its own throwaway parent against the real api.
// Task 17/D20 already isolated a real backend race where firing several
// registrations concurrently makes the immediately-following authenticated
// read 403 (caller.role.type !== 'parent' at policy-check time). Running
// this file's tests one at a time sidesteps it, same as add-student-dialog.spec.ts.
test.describe.configure({ mode: 'serial' });

// Test hygiene (task 020 convention): drop the auth_email_requests budget rows
// every throwaway registration above created.
test.afterAll(() => {
  for (const email of usedEmails) deleteAuthEmailRows(email);
});

test('en: parent adds a student — appears without reload, survives a hard reload, and is provable via a direct api call scoped to the caller', async ({
  page,
  request,
}) => {
  const errors = watchErrors(page);
  await page.setViewportSize(DESKTOP);
  await registerAndVisitDashboard(page, request, 'students-reload');

  const studentEmail = `e2e+${Date.now()}@schooltest.local`;

  await page
    .locator('[data-slot="students-heading"]')
    .getByRole('button', { name: cat(en, 'Dashboard.addStudent') })
    .click();
  const dialog = page.getByRole('dialog', { name: cat(en, 'Dashboard.dialogTitle') });
  await expect(dialog).toBeVisible();

  await dialog.getByLabel(cat(en, 'Dashboard.fieldFirstName')).fill('Nora');
  await dialog.getByLabel(cat(en, 'Dashboard.fieldLastName')).fill('Reload');
  await dialog.getByRole('combobox', { name: cat(en, 'Dashboard.fieldYearLevel') }).click();
  await page
    .getByRole('option', { name: icu(cat(en, 'Dashboard.yearLevelOption'), { level: '9' }) })
    .click();
  await dialog.getByLabel(cat(en, 'Dashboard.fieldEmail')).fill(studentEmail);
  await dialog.getByRole('button', { name: cat(en, 'Dashboard.addStudent'), exact: true }).click();

  // Row appears purely from query invalidation — no manual reload yet.
  await expect(
    page.getByText(icu(cat(en, 'Dashboard.addedToast'), { name: 'Nora Reload' })),
  ).toBeVisible();
  await expect(dialog).toBeHidden();

  const row = page.getByRole('row', { name: /Nora Reload/ });
  await expect(row).toBeVisible();
  await expect(row).toContainText('9');
  await expect(row).toContainText(studentEmail);
  await expect(page.locator('[data-slot="students-heading"]')).toContainText('1');

  await page.screenshot({ path: path.join(SCREENSHOTS, 'dashboard-students-add-reload-en.png') });

  // Persistence proof #1: HARD reload — a real navigation-level reload that
  // refetches everything from the server, not a client-router soft nav.
  await page.reload({ waitUntil: 'load' });
  const rowAfterReload = page.getByRole('row', { name: /Nora Reload/ });
  await expect(rowAfterReload).toBeVisible();
  await expect(rowAfterReload).toContainText('9');
  await expect(rowAfterReload).toContainText(studentEmail);

  // Persistence proof #2 (DB truth, bypassing the app entirely): read the
  // real auth token this page is using, then call the api DIRECTLY with it —
  // no TanStack Query cache, no React state, just the live Postgres-backed
  // response for this exact caller.
  const token = await page.evaluate(() => window.localStorage.getItem('app.auth.token'));
  expect(token, 'a real JWT must be present in localStorage after reload').toBeTruthy();

  const directRes = await page.request.get(`${API_BASE_URL}/api/my/students`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  expect(directRes.ok(), await directRes.text()).toBeTruthy();
  const directBody = (await directRes.json()) as ApiStudentsResponse;

  // Ownership proof: GET /api/my/students forces filters[parent]=<caller>
  // server-side (C-STUDENT-LIST) — a fresh parent had zero students before
  // this test, so getting back EXACTLY one row, matching what was submitted,
  // under THIS caller's own JWT is direct evidence the persisted row's
  // `parent` relation is this parent, not any other caller.
  expect(directBody.meta.pagination.total).toBe(1);
  expect(directBody.data).toHaveLength(1);
  const [persisted] = directBody.data;
  expect(persisted.given_name).toBe('Nora');
  expect(persisted.family_name).toBe('Reload');
  expect(persisted.year_level).toBe(9);
  expect(persisted.email).toBe(studentEmail);

  // Negative ownership check: a DIFFERENT parent's own token must NOT see
  // this row — proving the scoping is a real per-caller boundary, not an
  // artifact of there being only one row in the whole table.
  const otherParent = await registerAndConfirmParent(request, 'students-other');
  usedEmails.push(otherParent.email);
  const otherJwt = await loginParentJwt(request, otherParent);
  const otherRes = await page.request.get(`${API_BASE_URL}/api/my/students`, {
    headers: { Authorization: `Bearer ${otherJwt}` },
  });
  expect(otherRes.ok(), await otherRes.text()).toBeTruthy();
  const otherBody = (await otherRes.json()) as ApiStudentsResponse;
  expect(
    otherBody.data.find((student) => student.documentId === persisted.documentId),
  ).toBeUndefined();

  expect(errors, errors.join('\n')).toEqual([]);
});

test('en: a second student with year level 5 is blocked by the form — the option does not exist and no request reaches the api', async ({
  page,
  request,
}) => {
  await page.setViewportSize(DESKTOP);
  await registerAndVisitDashboard(page, request, 'students-blocked');

  // First student succeeds normally, so the "second student" attempt below
  // is genuinely a second-row attempt against a non-empty list.
  await page
    .locator('[data-slot="students-heading"]')
    .getByRole('button', { name: cat(en, 'Dashboard.addStudent') })
    .click();
  let dialog = page.getByRole('dialog', { name: cat(en, 'Dashboard.dialogTitle') });
  await dialog.getByLabel(cat(en, 'Dashboard.fieldFirstName')).fill('First');
  await dialog.getByLabel(cat(en, 'Dashboard.fieldLastName')).fill('Student');
  await dialog.getByRole('combobox', { name: cat(en, 'Dashboard.fieldYearLevel') }).click();
  await page
    .getByRole('option', { name: icu(cat(en, 'Dashboard.yearLevelOption'), { level: '9' }) })
    .click();
  await dialog.getByRole('button', { name: cat(en, 'Dashboard.addStudent'), exact: true }).click();
  await expect(dialog).toBeHidden();
  await expect(page.locator('[data-slot="students-heading"]')).toContainText('1');

  // Only watch for POSTs from here on — the first student's own creation
  // legitimately fires one and must not be misread as a "blocked" leak.
  const blockedRequests: string[] = [];
  page.on('request', (req) => {
    if (req.method() === 'POST' && req.url().includes('/api/students')) {
      blockedRequests.push(req.url());
    }
  });

  // Second student attempt: year level 5 cannot even be selected — the
  // combobox only ever renders YEAR_LEVEL_OPTIONS = [7..12].
  await page
    .locator('[data-slot="students-heading"]')
    .getByRole('button', { name: cat(en, 'Dashboard.addStudent') })
    .click();
  dialog = page.getByRole('dialog', { name: cat(en, 'Dashboard.dialogTitle') });
  await expect(dialog).toBeVisible();

  await dialog.getByLabel(cat(en, 'Dashboard.fieldFirstName')).fill('Second');
  await dialog.getByLabel(cat(en, 'Dashboard.fieldLastName')).fill('Student');
  await dialog.getByRole('combobox', { name: cat(en, 'Dashboard.fieldYearLevel') }).click();
  await expect(
    page.getByRole('option', { name: icu(cat(en, 'Dashboard.yearLevelOption'), { level: '5' }) }),
  ).toHaveCount(0);
  // Close the Select popup WITHOUT picking an option. A plain Escape bubbles
  // to the Dialog's own onEscapeKeyDown and closes the whole dialog too —
  // click a field ABOVE the trigger instead (the popup renders downward from
  // the trigger and would intercept a click on a field below it), still
  // inside the dialog content, so only the popup dismisses.
  await dialog.getByLabel(cat(en, 'Dashboard.fieldFirstName')).click();

  // Submitting with no valid year level selected is blocked client-side —
  // the mutation (and therefore any POST /api/students) never fires.
  await dialog.getByRole('button', { name: cat(en, 'Dashboard.addStudent'), exact: true }).click();
  await expect(dialog.getByText(cat(en, 'Dashboard.yearLevelRequired'))).toBeVisible();
  await expect(dialog).toBeVisible();

  expect(blockedRequests, blockedRequests.join('\n')).toEqual([]);

  // The list still shows only the first student — the blocked attempt left
  // no trace, proven both in the UI and via a direct api call.
  await expect(page.locator('[data-slot="students-heading"]')).toContainText('1');
  await expect(page.getByRole('row', { name: /Second Student/ })).toHaveCount(0);

  const token = await page.evaluate(() => window.localStorage.getItem('app.auth.token'));
  const directRes = await page.request.get(`${API_BASE_URL}/api/my/students`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  const directBody = (await directRes.json()) as ApiStudentsResponse;
  expect(directBody.meta.pagination.total).toBe(1);
  expect(directBody.data[0]?.given_name).toBe('First');
});
