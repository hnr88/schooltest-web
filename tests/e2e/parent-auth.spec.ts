import { expect, test } from '@playwright/test';

import { loginAsParent, SEEDED_PARENT } from './helpers/auth';
import { cat, loadMessages } from './helpers/i18n';
import { watchErrors } from './helpers/ui';

// Task 19: full C-AUTH-LOGIN flow through the real UI. Visits /sign-in, fills the
// seeded parent (D9), submits, confirms the URL becomes /dashboard, and confirms
// Mia + Jonas Keller are visible in the students list — catalog-driven, no
// hardcoded copy. ALSO asserts the network truth: a real POST /api/auth/local
// round trip against the live api on :5500, and the real GET /api/my/students
// response body contains both seeded students (not just their rendered rows).
//
// Task 20's network-verified error cases are in parent-auth-errors.spec.ts.
// Empty submit stays fully client-side (zod), asserted by watching that no
// request fires.
const en = loadMessages('en');
const DESKTOP = { width: 1280, height: 800 };
interface LoginResponseBody {
  jwt: string;
  user: { email: string };
}

interface StudentsResponseBody {
  data: {
    given_name: string;
    family_name: string;
    status: string | null;
    target_entry_year: string | null;
    target_entry_term: string | null;
  }[];
}

test('en: parent password login through the real UI lands on /dashboard with both seeded students, network-verified', async ({
  page,
}) => {
  const errors = watchErrors(page);
  await page.setViewportSize(DESKTOP);

  const loginResponsePromise = page.waitForResponse(
    (response) =>
      response.request().method() === 'POST' && response.url().endsWith('/api/auth/local'),
  );
  const studentsResponsePromise = page.waitForResponse(
    (response) =>
      response.request().method() === 'GET' && response.url().includes('/api/my/students'),
  );

  await loginAsParent(page);

  await expect(page).toHaveURL(/\/dashboard$/);

  // Network truth #1: the sign-in form made a real POST /api/auth/local against
  // the live api, and it returned a real JWT for the seeded parent.
  const loginResponse = await loginResponsePromise;
  expect(loginResponse.ok(), await loginResponse.text()).toBeTruthy();
  const loginBody = (await loginResponse.json()) as LoginResponseBody;
  expect(loginBody.jwt).toMatch(/^eyJ/);
  expect(loginBody.user.email).toBe(SEEDED_PARENT.email);

  // Network truth #2: the dashboard's real GET /api/my/students response body
  // (not just what got rendered) contains both seeded students.
  const studentsResponse = await studentsResponsePromise;
  expect(studentsResponse.ok(), await studentsResponse.text()).toBeTruthy();
  const studentsBody = (await studentsResponse.json()) as StudentsResponseBody;
  const fullNames = studentsBody.data.map(
    (student) => `${student.given_name} ${student.family_name}`,
  );
  const activeStudents = studentsBody.data.filter((student) => student.status === 'active').length;
  const enrolledStudents = studentsBody.data.filter(
    (student) => student.status === 'enrolled',
  ).length;
  const entryPlans = studentsBody.data.filter(
    (student) => student.target_entry_year && student.target_entry_term,
  ).length;
  const formatNumber = new Intl.NumberFormat('en');
  expect(fullNames).toContain('Mia Keller');
  expect(fullNames).toContain('Jonas Keller');

  // UI truth mirrors the network truth through the overview's functional profile list.
  const overview = page.locator('[data-slot="dashboard-overview"]');
  await expect(overview).toBeVisible();
  const familySummary = overview.locator('[data-slot="dashboard-family-summary"]');
  await expect(familySummary).toContainText(formatNumber.format(studentsBody.data.length));
  await expect(familySummary).toContainText(formatNumber.format(activeStudents));
  await expect(familySummary).toContainText(
    `${formatNumber.format(entryPlans)}/${formatNumber.format(studentsBody.data.length)}`,
  );
  const planBoard = overview.locator('[data-slot="dashboard-plan-board"]');
  await expect(planBoard).toContainText(
    `${formatNumber.format(entryPlans)}/${formatNumber.format(studentsBody.data.length)}`,
  );
  await expect(planBoard).toContainText(formatNumber.format(enrolledStudents));
  await expect(planBoard).toContainText(formatNumber.format(studentsBody.data.length - entryPlans));
  await expect(overview.locator('[data-slot="dashboard-profile-roster"]')).toContainText(
    fullNames[0],
  );

  const token = await page.evaluate(() => window.localStorage.getItem('app.auth.token'));
  expect(token).toMatch(/^eyJ/);
  expect(errors, errors.join('\n')).toEqual([]);
});

test('en: empty submit shows translated field-level zod errors, never calls the api', async ({
  page,
}) => {
  await page.setViewportSize(DESKTOP);
  let loginRequested = false;
  page.on('request', (request) => {
    if (request.method() === 'POST' && request.url().endsWith('/api/auth/local')) {
      loginRequested = true;
    }
  });

  await page.goto('/sign-in');
  await page.getByRole('button', { name: cat(en, 'Auth.signInButton'), exact: true }).click();

  await expect(page.getByText(cat(en, 'Auth.emailRequired'))).toBeVisible();
  await expect(page.getByText(cat(en, 'Auth.passwordRequired'))).toBeVisible();
  await expect(page.getByLabel(cat(en, 'Auth.emailLabel'), { exact: true })).toHaveAttribute(
    'aria-invalid',
    'true',
  );
  await expect(page.getByLabel(cat(en, 'Auth.passwordLabel'), { exact: true })).toHaveAttribute(
    'aria-invalid',
    'true',
  );
  await expect(page).toHaveURL(/\/sign-in$/);
  expect(loginRequested).toBe(false);
});
