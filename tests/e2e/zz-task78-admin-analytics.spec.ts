import { readFile } from 'node:fs/promises';

import { expect, test, type APIRequestContext, type Page } from '@playwright/test';

import { cat, loadMessages } from './helpers/i18n';

// Task 78 (st-mvp-pivot) targeted live check — NOT part of the suite.
// C-RPT-04 participation monitor + C-RPT-05 school results export + the
// school_admin 3-level analytics + the admin notifications (mvp spec 4.3).
// API: role matrix, payload shapes, completion-only guarantee. UI: both new
// pages for schooladmin-a, the class drill-down, the CSV download, school B
// empty states and the teacher guard.
const en = loadMessages('en');

const API = 'http://127.0.0.1:5500';
const ADMIN_A = { email: 'schooladmin-a@schooltest.local', password: 'pEbjxVnJ4PPYiv8D!A1' };
const ADMIN_B = { email: 'schooladmin-b@schooltest.local', password: 'BT77uuUGgqVSpFkP!A1' };
const TEACHER = { email: 'verify21@schooltest.local', password: 'Verify21!pw' };
const PARENT = { email: 'parent@schooltest.local', password: 'yvmnVObAiaOJw2C1!A1' };
const FIXTURE_CLASS = 'x1hat1dy90boz11n9zyphoan'; // "EAL/D Year 7 - Room 4"

async function login(
  request: APIRequestContext,
  credentials: { email: string; password: string },
): Promise<string> {
  const res = await request.post(`${API}/api/auth/local`, {
    data: { identifier: credentials.email, password: credentials.password },
  });
  expect(res.ok()).toBeTruthy();
  return ((await res.json()) as { jwt: string }).jwt;
}

async function signIn(page: Page, credentials: { email: string; password: string }): Promise<void> {
  await page.goto('/sign-in');
  await page.getByLabel(cat(en, 'Auth.emailLabel'), { exact: true }).fill(credentials.email);
  await page
    .getByLabel(cat(en, 'Auth.passwordLabel'), { exact: true })
    .fill(credentials.password);
  await page.getByRole('button', { name: cat(en, 'Auth.signInButton'), exact: true }).click();
  await page.waitForURL('**/dashboard', { timeout: 30_000 });
}

test.describe('task 78: admin analytics + participation + notifications', () => {
  test('API: C-RPT-04 participation - buckets, completion-only, role matrix', async ({
    request,
  }) => {
    const adminJwt = await login(request, ADMIN_A);
    const res = await request.get(`${API}/api/schools/me/participation`, {
      headers: { Authorization: `Bearer ${adminJwt}` },
    });
    expect(res.status()).toBe(200);
    const body = (await res.json()) as {
      data: {
        classes: Array<{
          documentId: string;
          name: string | null;
          teacher: string | null;
          roster_count: number;
          test_a: { submitted: number; in_progress: number; not_started: number };
          test_b: { submitted: number; in_progress: number; not_started: number };
        }>;
      };
    };
    const fixture = body.data.classes.find((row) => row.documentId === FIXTURE_CLASS);
    expect(fixture).toBeTruthy();
    expect(fixture!.roster_count).toBe(10);
    // Buckets sum to the roster and match the live session state (1 sat A, 1 sat B).
    for (const form of [fixture!.test_a, fixture!.test_b]) {
      expect(form.submitted + form.in_progress + form.not_started).toBe(fixture!.roster_count);
      expect(form.submitted).toBe(1);
      expect(form.in_progress).toBe(0);
    }
    // Completion status ONLY: no result fields can leak into this payload.
    const raw = JSON.stringify(body);
    expect(raw).not.toMatch(/label|band|phase|attributes|prob|mastery/);

    // Role matrix: 403 no token, 401 forged, 403 teacher, 403 parent.
    expect((await request.get(`${API}/api/schools/me/participation`)).status()).toBe(403);
    expect(
      (
        await request.get(`${API}/api/schools/me/participation`, {
          headers: { Authorization: 'Bearer garbage' },
        })
      ).status(),
    ).toBe(401);
    const teacherJwt = await login(request, TEACHER);
    expect(
      (
        await request.get(`${API}/api/schools/me/participation`, {
          headers: { Authorization: `Bearer ${teacherJwt}` },
        })
      ).status(),
    ).toBe(403);
    const parentJwt = await login(request, PARENT);
    expect(
      (
        await request.get(`${API}/api/schools/me/participation`, {
          headers: { Authorization: `Bearer ${parentJwt}` },
        })
      ).status(),
    ).toBe(403);

    // schooladmin-b (school B, no classes): 200 with an empty list - school A
    // data never leaks across the scope.
    const adminBJwt = await login(request, ADMIN_B);
    const bRes = await request.get(`${API}/api/schools/me/participation`, {
      headers: { Authorization: `Bearer ${adminBJwt}` },
    });
    expect(bRes.status()).toBe(200);
    expect(((await bRes.json()) as { data: { classes: unknown[] } }).data.classes).toHaveLength(0);
  });

  test('API: C-RPT-05 results export - JSON, CSV, role matrix', async ({ request }) => {
    const adminJwt = await login(request, ADMIN_A);
    const res = await request.get(`${API}/api/schools/me/results-export`, {
      headers: { Authorization: `Bearer ${adminJwt}` },
    });
    expect(res.status()).toBe(200);
    const body = (await res.json()) as {
      data: {
        results: Array<{
          student_ref: string;
          form: string | null;
          label: string | null;
          band: string | null;
          phase: string | null;
          attributes: Array<{ code: string; name: string; status: string }>;
        }>;
      };
    };
    expect(body.data.results.length).toBeGreaterThan(0);
    const sofiaA = body.data.results.find(
      (row) => row.student_ref === 'Sofia P.' && row.form === 'RDG-FT-A-79',
    );
    expect(sofiaA).toBeTruthy();
    expect(sofiaA!.attributes).toHaveLength(7);
    // student_ref privacy: no surnames or emails anywhere in the export.
    const raw = JSON.stringify(body);
    expect(raw).not.toMatch(/petrov|@/i);

    const csv = await request.get(`${API}/api/schools/me/results-export?format=csv`, {
      headers: { Authorization: `Bearer ${adminJwt}` },
    });
    expect(csv.status()).toBe(200);
    expect(csv.headers()['content-type']).toContain('text/csv');
    expect(csv.headers()['content-disposition']).toContain('school-results.csv');
    const csvBody = await csv.text();
    expect(csvBody.split('\n')[0]).toContain('student_ref,form,label,band,phase');
    expect(csvBody).toContain('"Sofia P."');
    expect(csvBody).not.toMatch(/petrov|@/i);

    // Unknown format is a 400; teacher is NOT granted (403); forged is 401.
    expect(
      (
        await request.get(`${API}/api/schools/me/results-export?format=xml`, {
          headers: { Authorization: `Bearer ${adminJwt}` },
        })
      ).status(),
    ).toBe(400);
    const teacherJwt = await login(request, TEACHER);
    expect(
      (
        await request.get(`${API}/api/schools/me/results-export`, {
          headers: { Authorization: `Bearer ${teacherJwt}` },
        })
      ).status(),
    ).toBe(403);
  });

  test('API: admin notifications - results ready + window open rows', async ({ request }) => {
    // Task 78 live evidence (recorded in the task file): a real publish fired
    // test_results_ready at the school_admin, and re-PUTting the school A
    // form window fired the window notice. Both rows are in the admin's feed.
    const adminJwt = await login(request, ADMIN_A);
    const res = await request.get(`${API}/api/notifications?pageSize=20`, {
      headers: { Authorization: `Bearer ${adminJwt}` },
    });
    expect(res.status()).toBe(200);
    const body = (await res.json()) as {
      data: Array<{ eventType: string; title: string; linkUrl: string | null }>;
    };
    const titles = body.data.map((row) => row.title);
    expect(titles).toContain('Results ready');
    expect(titles).toContain('Test A window open');
    const windowRow = body.data.find((row) => row.title === 'Test A window open');
    expect(windowRow!.eventType).toBe('test_results_ready'); // enum closed - data.notice marks it
    expect(windowRow!.linkUrl).toBe('/dashboard/school/participation');
  });

  test('UI: participation page renders the per-class A/B buckets', async ({ page }) => {
    await signIn(page, ADMIN_A);
    await page.goto('/en/dashboard/school/participation');
    const screen = page.locator('[data-surface="school-admin-participation"]');
    await expect(screen).toBeVisible({ timeout: 20_000 });
    await expect(
      screen.getByRole('heading', { name: cat(en, 'SchoolAdmin.participation.title') }),
    ).toBeVisible();

    const fixtureRow = screen
      .locator('[data-slot="participation-row"]')
      .filter({ hasText: 'EAL/D Year 7 - Room 4' });
    await expect(fixtureRow).toBeVisible();
    await expect(fixtureRow).toContainText('Vee Twentyone');
    await expect(fixtureRow).toContainText(
      `${cat(en, 'SchoolAdmin.participation.buckets.submitted')}: 1`,
    );
    await expect(fixtureRow).toContainText(
      `${cat(en, 'SchoolAdmin.participation.buckets.notStarted')}: 9`,
    );
  });

  test('UI: analytics - school overview, class drill, CSV export', async ({ page }) => {
    await signIn(page, ADMIN_A);
    await page.goto('/en/dashboard/school/analytics');
    const screen = page.locator('[data-surface="school-admin-analytics"]');
    await expect(screen).toBeVisible({ timeout: 20_000 });
    // Level 1: the school overview aggregate + the class list.
    await expect(
      screen.getByRole('heading', { name: cat(en, 'SchoolAdmin.analytics.aggregateTitle') }),
    ).toBeVisible({ timeout: 20_000 });
    await expect(screen.locator('[data-slot="analytics-class-list"]')).toBeVisible();

    // Level 2: drill into the fixture class - the SAME teacher diagnostic and
    // progress components render at school scope.
    await screen
      .locator('[data-slot="analytics-class-list"]')
      .getByRole('button', { name: /EAL\/D Year 7 - Room 4/ })
      .click();
    const diagnostic = page.locator('[data-surface="teacher-diagnostic"]');
    await expect(diagnostic).toBeVisible({ timeout: 20_000 });
    await expect(diagnostic.locator('[data-slot="mastery-table"]')).toBeVisible();
    await expect(page.locator('[data-surface="teacher-progress"]')).toBeVisible();
    // Level 3: one click down to a student profile.
    await diagnostic.locator('[data-slot="mastery-table"] button', { hasText: 'Sofia P.' }).click();
    await expect(diagnostic.getByText(/Sofia P\. - /)).toBeVisible();

    // C-RPT-05: the export button downloads school-results.csv.
    const exportSlot = page.locator('[data-slot="results-export"]').first();
    const button = exportSlot.getByRole('button', {
      name: cat(en, 'SchoolAdmin.analytics.export.cta'),
      exact: true,
    });
    const [download] = await Promise.all([page.waitForEvent('download'), button.click()]);
    expect(download.suggestedFilename()).toBe('school-results.csv');
    const path = await download.path();
    const csvBody = await readFile(path!, 'utf-8');
    expect(csvBody).toContain('"Sofia P."');
    expect(csvBody).not.toMatch(/petrov|@/i);
  });

  test('UI: the notification bell surfaces the new admin events', async ({ page }) => {
    await signIn(page, ADMIN_A);
    await page.goto('/en/dashboard/school/participation');
    await expect(page.locator('[data-surface="school-admin-participation"]')).toBeVisible({
      timeout: 20_000,
    });
    await page.locator('[data-slot="notification-bell"]').click();
    const popover = page.locator('[data-slot="notification-popover"]');
    await expect(popover).toBeVisible();
    await expect(popover.getByText('Test A window open')).toBeVisible();
    await expect(popover.getByText('Results ready')).toBeVisible();
  });

  test('UI: school B empty states', async ({ page }) => {
    // School B has no classes: both screens show their honest empty states.
    await signIn(page, ADMIN_B);
    await page.goto('/en/dashboard/school/participation');
    await expect(
      page.getByRole('heading', { name: cat(en, 'SchoolAdmin.participation.emptyTitle') }),
    ).toBeVisible({ timeout: 20_000 });
    await page.goto('/en/dashboard/school/analytics');
    await expect(
      page.getByRole('heading', { name: cat(en, 'SchoolAdmin.analytics.emptyTitle') }),
    ).toBeVisible({ timeout: 20_000 });
  });

  test('UI: the teacher role is guarded out of the school section', async ({ page }) => {
    await signIn(page, TEACHER);
    await page.goto('/en/dashboard/school/participation');
    await expect(page.locator('[data-surface="school-admin-participation"]')).toHaveCount(0);
    await page.waitForURL((url) => !url.pathname.includes('/dashboard/school'), {
      timeout: 20_000,
    });
    await page.goto('/en/dashboard/school/analytics');
    await expect(page.locator('[data-surface="school-admin-analytics"]')).toHaveCount(0);
  });
});
