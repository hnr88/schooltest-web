import { AxeBuilder } from '@axe-core/playwright';
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
// Task 20 extends this file: the C-AUTH-LOGIN error model, network-verified.
// Both the wrong-password and unknown-email cases get the real api's IDENTICAL
// 400 "Invalid identifier or password" body (no enumeration), and the UI never
// renders that raw Strapi string — only the translated Auth.loginError catalog
// key inside the styled Alert, never a raw Strapi error page. ONE login attempt
// per case (zero-tolerance: no retry loops against the live api). Empty submit
// stays fully client-side (zod), asserted by watching that no request fires.
const en = loadMessages('en');
const DESKTOP = { width: 1280, height: 800 };
const RAW_STRAPI_MESSAGE = 'Invalid identifier or password';

interface LoginErrorBody {
  error: { status: number; message: string };
}

interface LoginResponseBody {
  jwt: string;
  user: { email: string };
}

interface StudentsResponseBody {
  data: { given_name: string; family_name: string }[];
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
  expect(fullNames).toContain('Mia Keller');
  expect(fullNames).toContain('Jonas Keller');

  // UI truth mirrors the network truth: both students render in the real table.
  await expect(
    page.getByRole('heading', { level: 2, name: cat(en, 'Dashboard.title') }),
  ).toBeVisible();
  const table = page.getByRole('table');
  await expect(table).toBeVisible();
  await expect(page.getByRole('row', { name: /Mia Keller/ })).toBeVisible();
  await expect(page.getByRole('row', { name: /Jonas Keller/ })).toBeVisible();

  const token = await page.evaluate(() => window.localStorage.getItem('app.auth.token'));
  expect(token).toMatch(/^eyJ/);
  expect(errors, errors.join('\n')).toEqual([]);
});

test('en: wrong password stays on /sign-in with the styled translated error, no Strapi leak, axe clean', async ({
  page,
}) => {
  // No watchErrors here: Chromium's devtools protocol logs every non-2xx HTTP
  // response as a console.error "Failed to load resource" regardless of how the
  // app handles it — that is expected browser noise for this intentional 400, not
  // an application bug (sign-in.spec.ts's analogous wrong-password test agrees).
  await page.setViewportSize(DESKTOP);
  await page.goto('/sign-in');

  const loginResponsePromise = page.waitForResponse(
    (response) =>
      response.request().method() === 'POST' && response.url().endsWith('/api/auth/local'),
  );

  await page.getByLabel(cat(en, 'Auth.emailLabel'), { exact: true }).fill(SEEDED_PARENT.email);
  await page.getByLabel(cat(en, 'Auth.passwordLabel'), { exact: true }).fill('WrongPass123!');
  await page.getByRole('button', { name: cat(en, 'Auth.signInButton'), exact: true }).click();

  // Network truth: the real api answered 400 with its stock (untranslated) message —
  // proves the assertion below is a real UI translation, not an accidental echo.
  const loginResponse = await loginResponsePromise;
  expect(loginResponse.status()).toBe(400);
  const loginBody = (await loginResponse.json()) as LoginErrorBody;
  expect(loginBody.error.message).toBe(RAW_STRAPI_MESSAGE);

  const alert = page.locator('[data-slot="alert"]');
  await expect(alert).toBeVisible();
  await expect(alert).toContainText(cat(en, 'Auth.loginError'));
  await expect(page.getByText(RAW_STRAPI_MESSAGE)).toHaveCount(0);
  await expect(page).toHaveURL(/\/sign-in$/);
  const token = await page.evaluate(() => window.localStorage.getItem('app.auth.token'));
  expect(token).toBeNull();

  const results = await new AxeBuilder({ page }).analyze();
  const blockers = results.violations.filter(
    (violation) => violation.impact === 'serious' || violation.impact === 'critical',
  );
  expect(
    blockers.map(
      (violation) =>
        `${violation.impact}:${violation.id} → ${violation.nodes.map((node) => node.target).join(' | ')}`,
    ),
    '/sign-in wrong-password error',
  ).toEqual([]);
});

test('en: unknown email gets the SAME styled translated error (enumeration-safe)', async ({
  page,
}) => {
  await page.setViewportSize(DESKTOP);
  await page.goto('/sign-in');

  const loginResponsePromise = page.waitForResponse(
    (response) =>
      response.request().method() === 'POST' && response.url().endsWith('/api/auth/local'),
  );

  await page
    .getByLabel(cat(en, 'Auth.emailLabel'), { exact: true })
    .fill('no-such-parent-e2e@schooltest.local');
  await page.getByLabel(cat(en, 'Auth.passwordLabel'), { exact: true }).fill('WhateverPass123!');
  await page.getByRole('button', { name: cat(en, 'Auth.signInButton'), exact: true }).click();

  // Network truth: the live api answers unknown-email with the EXACT SAME 400 body
  // as wrong-password above (no enumeration signal to distinguish the two cases).
  const loginResponse = await loginResponsePromise;
  expect(loginResponse.status()).toBe(400);
  const loginBody = (await loginResponse.json()) as LoginErrorBody;
  expect(loginBody.error.message).toBe(RAW_STRAPI_MESSAGE);

  const alert = page.locator('[data-slot="alert"]');
  await expect(alert).toBeVisible();
  await expect(alert).toContainText(cat(en, 'Auth.loginError'));
  await expect(page.getByText(RAW_STRAPI_MESSAGE)).toHaveCount(0);
  await expect(page).toHaveURL(/\/sign-in$/);
  const token = await page.evaluate(() => window.localStorage.getItem('app.auth.token'));
  expect(token).toBeNull();
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
