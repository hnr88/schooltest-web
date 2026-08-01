import { expect, test, type APIRequestContext, type APIResponse, type Page } from '@playwright/test';

import { fetchWithRetry, loginCached } from './helpers/http';
import { cat, loadMessages } from './helpers/i18n';

// Task 63 (st-mvp-pivot) targeted live check — NOT part of the suite.
// Teacher read-only roster (C-CHD-01 + the task-63 email widening): the
// teacher sees own-class students with email present/missing flags, the
// school admin's C-CHD-03 email fix clears the flag on reload, an unowned
// class renders the empty state (C-CHD-01 teacher scoping), the teacher
// PATCH is 403 (fix stays school_admin-only), and the TeacherGuard bounces
// school_admin. No ACARA phase anywhere in the teacher DOM (D-10).
const en = loadMessages('en');

const API = 'http://127.0.0.1:5500';
const TEACHER = { email: 'verify21@schooltest.local', password: 'Verify21!pw' };
const SCHOOL_ADMIN = { email: 'schooladmin-a@schooltest.local', password: 'pEbjxVnJ4PPYiv8D!A1' };
const CLASS_ID = 'x1hat1dy90boz11n9zyphoan'; // "EAL/D Year 7 - Room 4"
const CLASS_NAME = 'EAL/D Year 7 - Room 4';
const SOFIA_ID = 'kxd4f1r27muoajv7ww18blvp';
const SOFIA_EMAIL = 'sofia.petrov@schooltest.local';
// Well-formed but never-assigned class documentId: C-CHD-01 teacher scoping
// returns an empty page for it.
const FOREIGN_CLASS = 'zz63zz63zz63zz63zz63zz63';

async function login(
  request: APIRequestContext,
  credentials: { email: string; password: string },
): Promise<string> {
  return loginCached(request, API, credentials);
}

// Every request-context call rides out the API's fixed-window 429 (helpers/http.ts).
const apiGet = (
  request: APIRequestContext,
  url: string,
  options?: Parameters<APIRequestContext['get']>[1],
): Promise<APIResponse> => fetchWithRetry(() => request.get(url, options));
const apiPatch = (
  request: APIRequestContext,
  url: string,
  options?: Parameters<APIRequestContext['patch']>[1],
): Promise<APIResponse> => fetchWithRetry(() => request.patch(url, options));

async function patchSofiaEmail(
  request: APIRequestContext,
  jwt: string,
  email: string | null,
): Promise<void> {
  const res = await apiPatch(request, `${API}/api/schools/me/children/${SOFIA_ID}`, {
    headers: { Authorization: `Bearer ${jwt}` },
    data: { email },
  });
  expect(res.ok()).toBeTruthy();
}

async function signIn(page: Page, credentials: { email: string; password: string }): Promise<void> {
  await page.goto('/sign-in');
  await page.getByLabel(cat(en, 'Auth.emailLabel'), { exact: true }).fill(credentials.email);
  await page
    .getByLabel(cat(en, 'Auth.passwordLabel'), { exact: true })
    .fill(credentials.password);
  const landing = credentials.email.startsWith('schooladmin')
    ? '**/dashboard/school**'
    : '**/dashboard/teach**';
  await page.getByRole('button', { name: cat(en, 'Auth.signInButton'), exact: true }).click();
  // Wait for the SETTLED role landing (not the transient /dashboard hop), so a
  // late role redirect can never hijack the goto that follows. The axios
  // layer rides out any 429 on the auth POST, so allow for that here.
  await page.waitForURL(landing, { timeout: 90_000 });
}

test.describe('task 63: teacher roster with email flags vs live C-CHD-01/03', () => {
  // Serial: the first test mutates Sofia's email through the admin fix path.
  // The timeout carries the 429 ride-out budget for batch runs (helpers/http.ts).
  test.describe.configure({ mode: 'serial', timeout: 120_000 });

  test('roster flags missing emails; admin fix clears the flag on reload', async ({
    page,
    request,
  }) => {
    const adminJwt = await login(request, SCHOOL_ADMIN);
    // Setup: Sofia's email is missing, so the flag must show.
    await patchSofiaEmail(request, adminJwt, null);

    await signIn(page, TEACHER);
    await page.goto('/en/dashboard/teach');
    const home = page.locator('[data-surface="teacher-home"]');
    await expect(home).toBeVisible({ timeout: 20_000 });
    await expect(home.getByText(CLASS_NAME, { exact: true })).toBeVisible();
    await home.getByRole('link', { name: cat(en, 'Teach.home.rosterLink'), exact: true }).click();
    await page.waitForURL(`**/dashboard/teach/classes/${CLASS_ID}`);

    const screen = page.locator('[data-surface="teacher-roster"]');
    await expect(screen).toBeVisible();
    await expect(
      screen.getByRole('heading', { name: CLASS_NAME, exact: true }),
    ).toBeVisible();
    await expect(screen.getByText('Sofia Petrov', { exact: true })).toBeVisible();
    await expect(screen.getByText('Daniel Kim', { exact: true })).toBeVisible();
    // Both students lack an email: two flags plus the admin-directing hint.
    await expect(
      screen.getByText(cat(en, 'Teach.roster.emailMissing'), { exact: true }),
    ).toHaveCount(2);
    await expect(
      screen.getByText(cat(en, 'Teach.roster.emailMissingHint'), { exact: true }),
    ).toBeVisible();
    // D-10: ACARA phase never reaches the teacher DOM.
    const beforeText = (await screen.textContent())?.toLowerCase() ?? '';
    expect(beforeText).not.toContain('acara');
    expect(beforeText).not.toContain('phase');

    // The fix is the school admin's (C-CHD-03): patch, reload, flag clears.
    await patchSofiaEmail(request, adminJwt, SOFIA_EMAIL);
    await page.reload();
    await expect(screen.getByText(SOFIA_EMAIL, { exact: true })).toBeVisible();
    await expect(
      screen.getByText(cat(en, 'Teach.roster.emailMissing'), { exact: true }),
    ).toHaveCount(1); // Daniel Kim (archived) still flagged
    const afterText = (await screen.textContent())?.toLowerCase() ?? '';
    expect(afterText).not.toContain('acara');
    expect(afterText).not.toContain('phase');

    // Negative probes as the teacher: PATCH is 403 (school_admin-only), and
    // a class the teacher does not own returns an empty page (never a leak).
    const teacherJwt = await login(request, TEACHER);
    const forbidden = await apiPatch(request, `${API}/api/schools/me/children/${SOFIA_ID}`, {
      headers: { Authorization: `Bearer ${teacherJwt}` },
      data: { email: 'teacher-edit@example.com' },
    });
    expect(forbidden.status()).toBe(403);
    const foreign = await apiGet(request, 
      `${API}/api/schools/me/children?class=${FOREIGN_CLASS}&pageSize=100`,
      { headers: { Authorization: `Bearer ${teacherJwt}` } },
    );
    expect(foreign.ok()).toBeTruthy();
    expect(((await foreign.json()) as { data: unknown[] }).data).toEqual([]);
  });

  test('a class the teacher does not own renders the empty state', async ({ page }) => {
    await signIn(page, TEACHER);
    await page.goto(`/en/dashboard/teach/classes/${FOREIGN_CLASS}`);
    const screen = page.locator('[data-surface="teacher-roster"]');
    await expect(screen).toBeVisible({ timeout: 20_000 });
    await expect(
      screen.getByText(cat(en, 'Teach.roster.emptyTitle'), { exact: true }),
    ).toBeVisible();
    await expect(screen.locator('table')).toHaveCount(0);
  });

  test('school_admin is bounced by the TeacherGuard', async ({ page }) => {
    await signIn(page, SCHOOL_ADMIN);
    await page.goto(`/en/dashboard/teach/classes/${CLASS_ID}`);
    await page.waitForURL('**/dashboard', { timeout: 20_000 });
    await expect(page.locator('[data-surface="teacher-roster"]')).toHaveCount(0);
  });
});
