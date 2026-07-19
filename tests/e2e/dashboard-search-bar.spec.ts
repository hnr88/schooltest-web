import path from 'node:path';

import { AxeBuilder } from '@axe-core/playwright';
import { expect, test } from '@playwright/test';

import { cat, loadMessages } from './helpers/i18n';
import { watchErrors } from './helpers/ui';

// Task 18 verification: DashboardSearch debounces a real GET
// /api/search/students?q= (C-STUDENT-SEARCH) through use-search-students.query
// and filters StudentsSection's table via the shared dashboard-search store —
// no mocks. Uses the seeded parent (D9: Mia + Jonas Keller) read-only, so it
// is safe alongside the other specs that depend on that exact fixture shape.
const en = loadMessages('en');
const SCREENSHOTS = path.resolve(process.cwd(), '.qa', 'screenshots');
const DESKTOP = { width: 1280, height: 800 };
const PARENT = { email: 'parent@schooltest.local', password: 'Parent1234!' };
const API_BASE_URL = 'http://localhost:5500';

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

test('en: search filters, selects, clears, no-results, Escape, axe clean', async ({
  page,
  request,
}) => {
  const errors = watchErrors(page);
  await page.setViewportSize(DESKTOP);
  await signInAs(page, request, PARENT.email, PARENT.password);
  await page.goto('/dashboard');

  const search = page.getByRole('combobox', { name: cat(en, 'Dashboard.searchPlaceholder') });
  await expect(search).toBeVisible();

  // Type "mia" — the debounced GET /api/search/students?q=mia settles and the
  // results panel shows only Mia (Jonas is a real seeded sibling, must be absent).
  await search.fill('mia');
  const miaOption = page.getByRole('option', { name: /Mia Keller/ });
  await expect(miaOption).toBeVisible();
  await expect(page.getByRole('option', { name: /Jonas Keller/ })).toHaveCount(0);

  const axeResults = await new AxeBuilder({ page }).analyze();
  const resultsBlockers = axeResults.violations.filter(
    (violation) => violation.impact === 'serious' || violation.impact === 'critical',
  );
  expect(resultsBlockers.map((violation) => `${violation.impact}:${violation.id}`)).toEqual([]);

  await page.screenshot({ path: path.join(SCREENSHOTS, 'dashboard-search-results-en.png') });

  // Click the result — StudentsSection's table narrows to Mia only.
  await miaOption.click();
  await expect(page.getByRole('option', { name: /Mia Keller/ })).toHaveCount(0);
  await expect(page.getByRole('row', { name: /Mia Keller/ })).toBeVisible();
  await expect(page.getByRole('row', { name: /Jonas Keller/ })).toHaveCount(0);

  // Clear — both the query and the table filter reset together.
  await page.getByRole('button', { name: cat(en, 'Dashboard.clearSearch') }).click();
  await expect(search).toHaveValue('');
  await expect(page.getByRole('row', { name: /Mia Keller/ })).toBeVisible();
  await expect(page.getByRole('row', { name: /Jonas Keller/ })).toBeVisible();

  // Real no-match query — the translated empty row, not a silent blank panel.
  await search.fill('zzz');
  await expect(page.getByText(cat(en, 'Dashboard.noResultsTitle'))).toBeVisible();
  await expect(page.getByText(cat(en, 'Dashboard.noResultsSubtitle'))).toBeVisible();

  // Escape closes the panel without touching the query text.
  await search.press('Escape');
  await expect(page.locator('[data-slot="dashboard-search-panel"]')).toHaveCount(0);
  await expect(search).toHaveValue('zzz');

  expect(errors, errors.join('\n')).toEqual([]);
});

test('en: arrow keys navigate results and Enter selects the active option', async ({
  page,
  request,
}) => {
  await page.setViewportSize(DESKTOP);
  await signInAs(page, request, PARENT.email, PARENT.password);
  await page.goto('/dashboard');

  const search = page.getByRole('combobox', { name: cat(en, 'Dashboard.searchPlaceholder') });
  await search.fill('keller');
  await expect(page.getByRole('option', { name: /Mia Keller|Jonas Keller/ }).first()).toBeVisible();

  await search.press('ArrowDown');
  await expect(search).toHaveAttribute('aria-activedescendant', 'dashboard-search-option-0');
  await search.press('Enter');

  await expect(page.locator('[data-slot="dashboard-search-panel"]')).toHaveCount(0);
  const table = page.getByRole('table');
  await expect(table).toBeVisible();
  await expect(table.getByRole('row')).toHaveCount(2); // header + exactly one matched student
});
