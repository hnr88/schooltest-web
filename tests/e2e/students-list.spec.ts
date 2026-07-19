import path from 'node:path';

import { AxeBuilder } from '@axe-core/playwright';
import { expect, test } from '@playwright/test';

import { type AnyLocale, cat, loadMessages } from './helpers/i18n';
import { watchErrors } from './helpers/ui';

// Task 16 verification: the dashboard's StudentsSection is fed by the real
// C-STUDENT-LIST endpoint (GET /api/my/students) via a zod-parsed TanStack
// Query — no mocks. The seeded parent (D9) has two real students (Mia +
// Jonas Keller); a freshly-registered parent has zero and must see the
// EmptyState instead of a table.
const en = loadMessages('en');
const SCREENSHOTS = path.resolve(process.cwd(), '.qa', 'screenshots');
const DESKTOP = { width: 1280, height: 800 };
const PARENT = { email: 'parent@schooltest.local', password: 'Parent1234!' };
const API_BASE_URL = 'http://localhost:5500';
const ALL_LOCALES: readonly AnyLocale[] = ['en', 'ko', 'ms', 'th', 'vi', 'zh'];
// Attempt-1 gap (verifier-reported): `Dashboard.title` carried a stale generic
// "Dashboard"/"Home page" value in these 5 locales instead of meaning "your
// students" like the fixed EN copy. Asserted absent below so a future revert of
// the catalog fix fails loud, not just a positive match against whatever the
// catalog currently says.
const STALE_DASHBOARD_TITLES: Partial<Record<AnyLocale, string>> = {
  ko: '대시보드',
  ms: 'Papan Pemuka',
  th: 'แดชบอร์ด',
  vi: 'Trang chủ',
  zh: '控制台',
};

function freshParent() {
  const suffix = `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`;
  return {
    username: `e2e${suffix}`.slice(0, 20),
    email: `e2e-${suffix}@schooltest.local`,
    password: 'Parent1234!',
  };
}

async function signInAs(
  page: import('@playwright/test').Page,
  request: import('@playwright/test').APIRequestContext,
  identifier: string,
  password: string,
): Promise<void> {
  const loginRes = await request.post(`${API_BASE_URL}/api/auth/local`, {
    data: { identifier, password },
  });
  expect(loginRes.ok(), await loginRes.text()).toBeTruthy();
  const { jwt } = (await loginRes.json()) as { jwt: string };
  await page.addInitScript((token) => {
    window.localStorage.setItem('app.auth.token', token);
  }, jwt);
}

test('en: seeded parent sees Mia and Jonas in the real students table, axe clean', async ({
  page,
  request,
}) => {
  const errors = watchErrors(page);
  await page.setViewportSize(DESKTOP);
  await signInAs(page, request, PARENT.email, PARENT.password);
  await page.goto('/dashboard');

  await expect(
    page.getByRole('heading', { level: 2, name: cat(en, 'Dashboard.title') }),
  ).toBeVisible();
  await expect(page.locator('[data-slot="students-heading"]')).toContainText('2');

  const table = page.getByRole('table');
  await expect(table).toBeVisible();
  await expect(
    table.getByRole('columnheader', { name: cat(en, 'Dashboard.columnName') }),
  ).toBeVisible();
  await expect(
    table.getByRole('columnheader', { name: cat(en, 'Dashboard.columnYearLevel') }),
  ).toBeVisible();
  await expect(
    table.getByRole('columnheader', { name: cat(en, 'Dashboard.columnEmail') }),
  ).toBeVisible();
  await expect(
    table.getByRole('columnheader', { name: cat(en, 'Dashboard.columnAdded') }),
  ).toBeVisible();

  const miaRow = page.getByRole('row', { name: /Mia Keller/ });
  await expect(miaRow).toContainText('8');
  await expect(miaRow).toContainText('mia.keller@schooltest.local');
  await expect(miaRow).toContainText('2026');

  const jonasRow = page.getByRole('row', { name: /Jonas Keller/ });
  await expect(jonasRow).toContainText('10');
  await expect(jonasRow).toContainText('jonas.keller@schooltest.local');

  await expect(page.getByText(cat(en, 'Dashboard.studentsEmptyTitle'))).toHaveCount(0);

  await page.screenshot({ path: path.join(SCREENSHOTS, 'dashboard-students-en.png') });

  const results = await new AxeBuilder({ page }).analyze();
  const blockers = results.violations.filter(
    (violation) => violation.impact === 'serious' || violation.impact === 'critical',
  );
  expect(
    blockers.map(
      (violation) =>
        `${violation.impact}:${violation.id} → ${violation.nodes.map((node) => node.target).join(' | ')}`,
    ),
    'dashboard students table',
  ).toEqual([]);
  expect(errors, errors.join('\n')).toEqual([]);
});

for (const locale of ALL_LOCALES) {
  test(`${locale}: the students-section heading means "your students", not the stale generic Dashboard label`, async ({
    browser,
    baseURL,
    request,
  }) => {
    const context = await browser.newContext({ baseURL, viewport: DESKTOP });
    await context.addCookies([
      { name: 'NEXT_LOCALE', value: locale, url: baseURL ?? 'http://localhost:3100' },
    ]);
    const page = await context.newPage();
    try {
      await signInAs(page, request, PARENT.email, PARENT.password);
      const messages = loadMessages(locale);
      await page.goto('/dashboard');

      await expect(
        page.getByRole('heading', { level: 2, name: cat(messages, 'Dashboard.title') }),
      ).toBeVisible();

      const staleTitle = STALE_DASHBOARD_TITLES[locale];
      if (staleTitle !== undefined) {
        await expect(page.getByText(staleTitle, { exact: true })).toHaveCount(0);
      }
    } finally {
      await context.close();
    }
  });
}

test('en: a freshly-registered parent with zero students sees the real empty state', async ({
  page,
  request,
}) => {
  const errors = watchErrors(page);
  await page.setViewportSize(DESKTOP);
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

  await expect(
    page.getByText(cat(en, 'Dashboard.studentsEmptyTitle'), { exact: true }),
  ).toBeVisible();
  await expect(page.getByText(cat(en, 'Dashboard.studentsEmptySubtitle'))).toBeVisible();
  await expect(page.getByRole('table')).toHaveCount(0);

  await page.screenshot({ path: path.join(SCREENSHOTS, 'dashboard-students-empty-en.png') });

  const results = await new AxeBuilder({ page }).analyze();
  const blockers = results.violations.filter(
    (violation) => violation.impact === 'serious' || violation.impact === 'critical',
  );
  expect(
    blockers.map(
      (violation) =>
        `${violation.impact}:${violation.id} → ${violation.nodes.map((node) => node.target).join(' | ')}`,
    ),
    'dashboard students empty state',
  ).toEqual([]);
  expect(errors, errors.join('\n')).toEqual([]);
});
