import { expect, test, type APIRequestContext, type Page } from '@playwright/test';

import type { DashboardClass } from '@/modules/teacher/types/teacher.types';

import { apiLoginRetried } from '../helpers/ops34-api-retry';
import { closeSession, createSession, readClasses, readTests } from '../helpers/teacher-past-sessions-api';
import { signIn } from '../helpers/teacher-rail';

// R1 PART B — the pre-v2 teacher routes no longer RENDER anything; each one hands
// over to the surface the design replaced it with. Every id here is read live off
// C-TD-1/C-TD-2 and the one sitting is minted through C-TS-1 and closed again, so
// nothing is stubbed and nothing is left open.
//
// Nothing else asserts these hand-overs: `rg "dashboard/teach/classes|run-sheet|
// teach/results/" tests/e2e` finds only a comment in zz-task77.

test.describe.configure({ mode: 'serial' });

let request: APIRequestContext;
let page: Page;
let jwt = '';
let klass: DashboardClass;
let sittingId = '';

test.beforeAll(async ({ browser, playwright }) => {
  test.setTimeout(120_000);
  request = await playwright.request.newContext();
  jwt = await apiLoginRetried(request, 'teacher');
  const classes = await readClasses(request, jwt);
  expect(classes[0], 'the teacher owns no class').toBeTruthy();
  klass = classes[0];
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  page = await context.newPage();
  await signIn(page, 'teacher');
});

test.afterAll(async () => {
  if (sittingId !== '') await closeSession(request, jwt, sittingId);
  await page?.context().close();
  await request.dispose();
});

test('every retired /dashboard/teach route lands on its v2 replacement', async () => {
  // Six real navigations, each a first compile on the dev server.
  test.setTimeout(180_000);
  const id = klass.class_document_id;
  for (const [from, to] of [
    ['/dashboard/teach', new RegExp(`/dashboard/results$`)],
    [`/dashboard/teach/classes/${id}`, new RegExp(`/dashboard/results/${id}$`)],
    [`/dashboard/teach/classes/${id}/test-day`, new RegExp(`/dashboard/results/${id}\\?tab=live$`)],
    [`/dashboard/teach/results/${id}`, new RegExp(`/dashboard/results/${id}\\?tab=insights$`)],
    ['/dashboard/teach/run-sheet', new RegExp(`/dashboard/test-sessions$`)],
  ] as const) {
    await page.goto(from);
    await expect(page, `${from} did not hand over`).toHaveURL(to, { timeout: 30_000 });
  }
  // The destination really renders — the class detail's Live tab, not a 404 frame.
  await expect(page.locator('[data-surface="teacher-test-sessions"]')).toBeVisible({
    timeout: 30_000,
  });
  await page.goto(`/dashboard/teach/classes/${id}/test-day`);
  await expect(page.locator('[data-surface="teacher-test-day"]')).toBeVisible({ timeout: 60_000 });
});

test('the retired live monitor hands a real sitting to its class Live tab', async () => {
  test.setTimeout(120_000);
  const tests = await readTests(request, jwt);
  const testA = tests.find((entry) => entry.variant === 'A');
  expect(testA, 'C-TD-2 offers no Test A form').toBeTruthy();
  sittingId = await createSession(
    request,
    jwt,
    klass.class_document_id,
    testA?.form_document_id ?? '',
  );

  await page.goto(`/dashboard/test-sessions/${sittingId}`);
  await expect(page).toHaveURL(
    new RegExp(
      `/dashboard/results/${klass.class_document_id}\\?tab=live&session=${sittingId}$`,
    ),
    { timeout: 30_000 },
  );
  const surface = page.locator('[data-surface="teacher-test-day"]');
  await expect(surface).toHaveAttribute('data-status', 'ready', { timeout: 60_000 });
  await expect(surface).toHaveAttribute('data-sitting-id', sittingId);
});

test('a sitting the teacher may not read falls back to the Live sessions page', async () => {
  test.setTimeout(60_000);
  // A real 403/404 from C-TS-3 — an id outside this teacher's own sittings. The
  // retired route has no error state of its own to show, so it hands over to the
  // list the sitting would have been on.
  await page.goto('/dashboard/test-sessions/zzzzzzzzzzzzzzzzzzzzzzzz');
  await expect(page).toHaveURL(/\/dashboard\/test-sessions$/, { timeout: 30_000 });
  await expect(page.locator('[data-surface="teacher-test-sessions"]')).toBeVisible({
    timeout: 30_000,
  });
});
