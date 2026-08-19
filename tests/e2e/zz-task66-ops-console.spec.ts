import { expect, test, type APIRequestContext, type Page } from '@playwright/test';

import { fetchWithRetry, loginCached } from './helpers/http';
import { cat, loadMessages } from './helpers/i18n';
import { roleCredentials } from './helpers/credentials';

// Task 66 (st-mvp-pivot) targeted live check — NOT part of the suite.
// Signs in as the seeded ops account, pulls C-OPS-01 directly from the API,
// and asserts /dashboard/ops/schools renders those exact rows and counts;
// then confirms the detail page and the non-ops bounce (school_admin,
// teacher) off the whole /dashboard/ops section.
const en = loadMessages('en');

const API = 'http://127.0.0.1:5500';
const OPS = roleCredentials('ops');
const SCHOOL_ADMIN = roleCredentials('schoolAdmin');
const TEACHER = roleCredentials('teacher');

interface OpsSchool {
  documentId: string;
  name: string;
  account_status: string;
  onboarding_status: string;
  teacher_count: number;
  class_count: number;
  student_count: number;
  results_count: number;
}

async function fetchOpsSchools(request: APIRequestContext): Promise<OpsSchool[]> {
  const jwt = await loginCached(request, API, OPS);
  const res = await fetchWithRetry(() =>
    request.get(`${API}/api/ops/schools`, {
      headers: { Authorization: `Bearer ${jwt}` },
    }),
  );
  expect(res.ok()).toBeTruthy();
  const body = (await res.json()) as { data: OpsSchool[] };
  return body.data;
}

async function signIn(page: Page, email: string, password: string, landing: string): Promise<void> {
  await page.goto('/sign-in');
  await page.getByLabel(cat(en, 'Auth.emailLabel'), { exact: true }).fill(email);
  await page.getByLabel(cat(en, 'Auth.passwordLabel'), { exact: true }).fill(password);
  await page.getByRole('button', { name: cat(en, 'Auth.signInButton'), exact: true }).click();
  // Wait for the SETTLED role landing (not the transient /dashboard hop), so a
  // late role redirect can never hijack the goto that follows. The axios
  // layer rides out any 429 on the auth POST, so allow for that here.
  await page.waitForURL(`**${landing}`, { timeout: 90_000 });
}

test.describe('task 66: ops console vs live C-OPS-01', () => {
  // The timeout carries the 429 ride-out budget for batch runs (helpers/http.ts).
  test.describe.configure({ timeout: 120_000 });
  test('ops sign-in lands on /dashboard/ops/schools with the live rows and counts', async ({
    page,
    request,
  }) => {
    const schools = await fetchOpsSchools(request);
    const demo = schools.find((s) => s.name === 'SchoolTest Demo School A');
    expect(demo, 'seeded demo school A present in C-OPS-01').toBeTruthy();

    await signIn(page, OPS.email, OPS.password, '/dashboard/ops/schools');

    const surface = page.locator('[data-surface="ops-schools"]');
    await expect(surface).toBeVisible({ timeout: 20_000 });
    await expect(
      surface.getByRole('heading', { name: cat(en, 'Ops.schools.title'), exact: true }),
    ).toBeVisible();

    // The seeded demo row renders the live C-OPS-01 counts, digit for digit.
    const row = surface.getByRole('row').filter({ hasText: demo!.name });
    await expect(row).toBeVisible({ timeout: 20_000 });
    await expect(
      row.getByText(cat(en, `Ops.schools.accountStatus.${demo!.account_status}`), { exact: true }),
    ).toBeVisible();
    for (const count of [
      demo!.teacher_count,
      demo!.class_count,
      demo!.student_count,
      demo!.results_count,
    ]) {
      await expect(row.getByText(String(count), { exact: true })).toBeVisible();
    }

    // Row link opens the detail page with the same live counts.
    await row.getByRole('link', { name: demo!.name }).click();
    await page.waitForURL(`**/dashboard/ops/schools/${demo!.documentId}`, { timeout: 30_000 });
    const detail = page.locator('[data-surface="ops-school-detail"]');
    await expect(detail).toBeVisible({ timeout: 20_000 });
    await expect(detail.getByRole('heading', { name: demo!.name, exact: true })).toBeVisible();
    await expect(detail.getByText(String(demo!.student_count), { exact: true })).toBeVisible();
    await expect(detail.getByText(String(demo!.results_count), { exact: true })).toBeVisible();
  });

  test('school_admin is bounced out of /dashboard/ops', async ({ page }) => {
    await signIn(page, SCHOOL_ADMIN.email, SCHOOL_ADMIN.password, '/dashboard/school');
    await page.goto('/dashboard/ops/schools');
    await page.waitForURL('**/dashboard/school', { timeout: 30_000 });
    await expect(page.locator('[data-surface="ops-schools"]')).toHaveCount(0);
  });

  test('teacher is bounced out of /dashboard/ops', async ({ page }) => {
    await signIn(page, TEACHER.email, TEACHER.password, '/dashboard');
    await page.goto('/dashboard/ops/schools');
    await page.waitForURL('**/dashboard/teach', { timeout: 30_000 });
    await expect(page.locator('[data-surface="ops-schools"]')).toHaveCount(0);
  });
});
