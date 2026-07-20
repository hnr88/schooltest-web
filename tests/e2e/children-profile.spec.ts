import path from 'node:path';

import { AxeBuilder } from '@axe-core/playwright';
import { expect, test } from '@playwright/test';

import { deleteAuthEmailRows } from './helpers/auth-db';
import { cat, icu, loadMessages } from './helpers/i18n';
import { loginParentJwt, registerAndConfirmParent } from './helpers/throwaway-parent';
import { watchErrors } from './helpers/ui';

const en = loadMessages('en');
const API_BASE_URL = 'http://localhost:5500';
const PARENT = { email: 'parent@schooltest.local', password: 'Parent1234!' };
const SCREENSHOTS = path.resolve(process.cwd(), '.qa', 'screenshots');
const usedEmails: string[] = [];

interface ParentStudent {
  documentId: string;
  given_name: string;
  family_name: string;
}

async function signInAs(
  page: import('@playwright/test').Page,
  request: import('@playwright/test').APIRequestContext,
  identifier: string,
  password: string,
): Promise<string> {
  const response = await request.post(`${API_BASE_URL}/api/auth/local`, {
    data: { identifier, password },
  });
  expect(response.ok(), await response.text()).toBeTruthy();
  const { jwt } = (await response.json()) as { jwt: string };
  await page.addInitScript((token) => {
    window.localStorage.setItem('app.auth.token', token);
  }, jwt);
  return jwt;
}

async function firstChild(
  request: import('@playwright/test').APIRequestContext,
  jwt: string,
): Promise<ParentStudent> {
  const response = await request.get(`${API_BASE_URL}/api/my/students`, {
    headers: { Authorization: `Bearer ${jwt}` },
  });
  expect(response.ok(), await response.text()).toBeTruthy();
  const body = (await response.json()) as { data: ParentStudent[] };
  expect(body.data.length).toBeGreaterThan(0);
  return body.data[0];
}

test.afterAll(() => {
  for (const email of usedEmails) deleteAuthEmailRows(email);
});

test('en: child cards open a real persisted profile with metrics and an honest results state', async ({
  page,
  request,
}) => {
  const errors = watchErrors(page);
  await page.setViewportSize({ width: 1280, height: 800 });
  await signInAs(page, request, PARENT.email, PARENT.password);
  await page.goto('/dashboard/children');

  const card = page.getByRole('article', {
    name: icu(cat(en, 'Children.childCardLabel'), { name: 'Mia Keller' }),
  });
  await expect(card).toBeVisible();
  const profileResponse = page.waitForResponse(
    (response) =>
      response.url().includes('/api/my/students/') && response.url().endsWith('/progress'),
  );
  await card
    .getByRole('link', { name: icu(cat(en, 'Children.viewProfileLabel'), { name: 'Mia Keller' }) })
    .click();
  const response = await profileResponse;
  expect(response.status(), await response.text()).toBe(200);

  await expect(page.getByRole('heading', { level: 1, name: 'Mia Keller' })).toBeVisible();
  await expect(
    page.getByRole('region', { name: cat(en, 'Children.metricsHeading') }),
  ).toBeVisible();
  for (const key of [
    'metricTotalSessions',
    'metricCompletedSessions',
    'metricActiveSessions',
    'metricOfficialResults',
  ]) {
    await expect(page.getByRole('article', { name: cat(en, `Children.${key}`) })).toContainText(
      '0',
    );
  }
  await expect(
    page.getByRole('heading', { level: 2, name: cat(en, 'Children.recentResultsHeading') }),
  ).toBeVisible();
  await expect(page.getByText(cat(en, 'Children.emptyResults'), { exact: true })).toBeVisible();

  await page.reload();
  await expect(page.getByRole('heading', { level: 1, name: 'Mia Keller' })).toBeVisible();
  await expect(
    page.getByRole('article', { name: cat(en, 'Children.metricOfficialResults') }),
  ).toContainText('0');
  await page.screenshot({ path: path.join(SCREENSHOTS, 'child-profile-en.png') });

  const results = await new AxeBuilder({ page }).analyze();
  const blockers = results.violations.filter(
    (violation) => violation.impact === 'serious' || violation.impact === 'critical',
  );
  expect(blockers, 'child profile accessibility').toEqual([]);
  expect(errors, errors.join('\n')).toEqual([]);
});

test('en: child cards remain usable at mobile width', async ({ page, request }) => {
  await page.setViewportSize({ width: 375, height: 800 });
  await signInAs(page, request, PARENT.email, PARENT.password);
  await page.goto('/dashboard/children');

  await expect(
    page.getByRole('link', {
      name: icu(cat(en, 'Children.viewProfileLabel'), { name: 'Mia Keller' }),
    }),
  ).toBeVisible();
  expect(
    await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth),
  ).toBeTruthy();
});

test('en: a foreign child profile remains unavailable to another real parent', async ({
  page,
  request,
}) => {
  const parentJwt = await signInAs(page, request, PARENT.email, PARENT.password);
  const child = await firstChild(request, parentJwt);
  const foreignParent = await registerAndConfirmParent(request, 'child-profile-foreign');
  usedEmails.push(foreignParent.email);
  const foreignJwt = await loginParentJwt(request, foreignParent);
  await page.addInitScript((token) => {
    window.localStorage.setItem('app.auth.token', token);
  }, foreignJwt);

  const responsePromise = page.waitForResponse((response) =>
    response.url().endsWith(`/api/my/students/${child.documentId}/progress`),
  );
  await page.goto(`/dashboard/children/${child.documentId}`);
  const response = await responsePromise;
  expect(response.status(), await response.text()).toBe(404);
  await expect(
    page.getByText(cat(en, 'Children.profileErrorTitle'), { exact: true }),
  ).toBeVisible();
  await expect(page.getByRole('link', { name: cat(en, 'Children.backToList') })).toBeVisible();
});
