import { expect, test, type APIRequestContext, type Page } from '@playwright/test';

import { cat, icu, loadMessages } from './helpers/i18n';

// Task 75 (st-mvp-pivot) targeted live check — NOT part of the suite.
// Teacher diagnostic dashboard (C-RPT-01): class mastery list across the seven
// reading areas with the item-type heat map nested underneath (item code +
// section only, items correct / responses), the one-click student drill-down,
// the WYSIWYG empty state on a results-free class, and the error state on an
// unowned class. ACARA phase never reaches the DOM (D-10 / mvp spec 4.4).
const en = loadMessages('en');

const API = 'http://127.0.0.1:5500';
const TEACHER = { email: 'verify21@schooltest.local', password: 'Verify21!pw' };
const SCHOOL_ADMIN = { email: 'schooladmin-a@schooltest.local', password: 'pEbjxVnJ4PPYiv8D!A1' };
const FOREIGN_TEACHER = { email: 'teacher@schooltest.local', password: 'www9Livfmzyk4RM1!A1' };
const PARENT = { email: 'parent@schooltest.local', password: 'yvmnVObAiaOJw2C1!A1' };
const CLASS_ID = 'x1hat1dy90boz11n9zyphoan'; // "EAL/D Year 7 - Room 4"
const CLASS_NAME = 'EAL/D Year 7 - Room 4';
// Results-free school-A class (created for this task's empty-state probe);
// the spec assigns verify21 to it via C-CLS-03 before visiting.
const EMPTY_CLASS_ID = 'sbxoff8ow7p1dfl14e6bpg8u';
// Orphan class with no school link: every school role 403s it.
const UNOWNED_CLASS_ID = 'bsonh15b2ggwe2rpyuudvzfa';

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

test.describe('task 75: teacher diagnostic dashboard vs live C-RPT-01', () => {
  test.describe.configure({ mode: 'serial' });

  test('populated class: mastery list, nested heat map, drill-down, no ACARA phase', async ({
    page,
    request,
  }) => {
    // API role matrix first: foreign teacher and parent 403, school_admin 200.
    const foreignJwt = await login(request, FOREIGN_TEACHER);
    const foreign = await request.get(`${API}/api/schools/me/classes/${CLASS_ID}/diagnostic`, {
      headers: { Authorization: `Bearer ${foreignJwt}` },
    });
    expect(foreign.status()).toBe(403);
    const parentJwt = await login(request, PARENT);
    const parent = await request.get(`${API}/api/schools/me/classes/${CLASS_ID}/diagnostic`, {
      headers: { Authorization: `Bearer ${parentJwt}` },
    });
    expect(parent.status()).toBe(403);
    const adminJwt = await login(request, SCHOOL_ADMIN);
    const admin = await request.get(`${API}/api/schools/me/classes/${CLASS_ID}/diagnostic`, {
      headers: { Authorization: `Bearer ${adminJwt}` },
    });
    expect(admin.ok()).toBeTruthy();

    await signIn(page, TEACHER);
    await page.goto('/en/dashboard/teach');
    const home = page.locator('[data-surface="teacher-home"]');
    await expect(home).toBeVisible({ timeout: 20_000 });
    await home
      .locator('li', { hasText: CLASS_NAME })
      .getByRole('link', { name: cat(en, 'Teach.home.resultsLink'), exact: true })
      .click();
    await page.waitForURL(`**/dashboard/teach/results/${CLASS_ID}`);

    const screen = page.locator('[data-surface="teacher-diagnostic"]');
    await expect(screen).toBeVisible();
    await expect(screen.getByRole('heading', { name: CLASS_NAME, exact: true })).toBeVisible();
    await expect(
      screen.getByText(icu(cat(en, 'Teach.diagnostic.summary'), { sat: '1', roster: '10' }), {
        exact: false,
      }),
    ).toBeVisible();

    // Mastery: a list (never a grid) of students with the seven area pills.
    const mastery = screen.locator('[data-slot="mastery-table"]');
    await expect(mastery).toBeVisible();
    await expect(mastery.getByText('Sofia P.', { exact: true })).toBeVisible();
    await expect(
      mastery.getByText(cat(en, 'Teach.diagnostic.status.mastered'), { exact: true }).first(),
    ).toBeVisible();
    await expect(
      mastery.getByText(cat(en, 'Teach.diagnostic.status.not_assessed'), { exact: true }).first(),
    ).toBeVisible();

    // Heat map: nested under the mastery section, cells keyed by item code +
    // section only, framed as items correct / responses (1A: 15/27 = 56%).
    const heatmap = screen.locator('[data-slot="item-type-heatmap"]');
    await expect(heatmap).toBeVisible();
    await expect(heatmap.getByText('1A', { exact: true })).toBeVisible();
    await expect(heatmap.getByText('15/27 (56%)', { exact: true })).toBeVisible();
    await expect(
      heatmap.getByText(icu(cat(en, 'Teach.diagnostic.sectionHeading'), { section: '2' }), {
        exact: true,
      }),
    ).toBeVisible();

    // Drill-down: one click to the individual level, then close.
    await mastery.getByRole('button', { name: /Sofia P\./ }).click();
    const drilldown = screen.locator('[data-slot="student-mastery-drilldown"]');
    await expect(drilldown).toBeVisible();
    await expect(
      drilldown.getByRole('heading', {
        name: icu(cat(en, 'Teach.diagnostic.drilldownTitle'), { student: 'Sofia P.' }),
        exact: true,
      }),
    ).toBeVisible();
    await expect(
      drilldown.getByText(cat(en, 'Teach.diagnostic.areas.R7'), { exact: true }),
    ).toBeVisible();
    await drilldown
      .getByRole('button', { name: cat(en, 'Teach.diagnostic.drilldownClose'), exact: true })
      .click();
    await expect(drilldown).toHaveCount(0);

    // D-10 / mvp spec 4.4: ACARA phase never reaches the teacher DOM.
    const text = (await screen.textContent())?.toLowerCase() ?? '';
    expect(text).not.toContain('acara');
    expect(text).not.toContain('phase');
  });

  test('results-free class renders the WYSIWYG empty state', async ({ page, request }) => {
    // Setup: verify21 must sit in the class's teachers (C-RPT-01 object scope).
    const adminJwt = await login(request, SCHOOL_ADMIN);
    const teachersRes = await request.get(`${API}/api/schools/me/teachers`, {
      headers: { Authorization: `Bearer ${adminJwt}` },
    });
    expect(teachersRes.ok()).toBeTruthy();
    const teachers = ((await teachersRes.json()) as { data: Array<{ documentId: string; email: string }> })
      .data;
    const verify21 = teachers.find((row) => row.email === TEACHER.email);
    expect(verify21).toBeTruthy();
    const patch = await request.patch(`${API}/api/schools/me/classes/${EMPTY_CLASS_ID}`, {
      headers: { Authorization: `Bearer ${adminJwt}` },
      data: { teacher_documentIds: [verify21!.documentId] },
    });
    expect(patch.ok()).toBeTruthy();

    await signIn(page, TEACHER);
    await page.goto(`/en/dashboard/teach/results/${EMPTY_CLASS_ID}`);
    const screen = page.locator('[data-surface="teacher-diagnostic"]');
    await expect(screen).toBeVisible({ timeout: 20_000 });
    const empty = screen.locator('[data-slot="diagnostic-empty-state"]');
    await expect(empty).toBeVisible();
    // Both panels present but unpopulated: the full dashboard shape from first login.
    await expect(
      empty.getByText(cat(en, 'Teach.diagnostic.emptyMasteryTitle'), { exact: true }),
    ).toBeVisible();
    await expect(
      empty.getByText(cat(en, 'Teach.diagnostic.emptyHeatmapTitle'), { exact: true }),
    ).toBeVisible();
    await expect(screen.locator('[data-slot="mastery-table"]')).toHaveCount(0);
    await expect(screen.locator('[data-slot="item-type-heatmap"]')).toHaveCount(0);
  });

  test('an unowned class renders the error state, never a leak', async ({ page }) => {
    await signIn(page, TEACHER);
    await page.goto(`/en/dashboard/teach/results/${UNOWNED_CLASS_ID}`);
    const screen = page.locator('[data-surface="teacher-diagnostic"]');
    await expect(screen).toBeVisible({ timeout: 20_000 });
    await expect(
      screen.getByRole('alert').getByText(cat(en, 'Teach.diagnostic.loadError'), { exact: true }),
    ).toBeVisible({ timeout: 20_000 }); // TanStack default retries the 403 before isError
    await expect(screen.locator('[data-slot="mastery-table"]')).toHaveCount(0);
  });
});
