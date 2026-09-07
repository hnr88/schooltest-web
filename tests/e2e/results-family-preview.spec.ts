import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

import { expect, test } from '@playwright/test';

/**
 * Task 35 e2e — Screen D family preview over route interception (no live
 * Strapi): /api/results/:id is fulfilled with the contract fixture.
 *
 * `test.fixme` with the same honest note as tasks 31/32: the family-preview
 * page route does not exist yet (the wiring train owns it) and the live API
 * still emits the v1 view until tasks 16/23, so these cannot run today. They
 * SHIP ready, and run the day the route + flag wiring land. The flag itself
 * (`NEXT_PUBLIC_PARENT_VIEWS_ENABLED`) is env-gated per project config, so the
 * flag-on suite runs with it set and the flag-off suite asserts the route
 * stays hidden exactly as the legacy behaviour does today.
 *
 * The DOM grep for `prob` is the allow-list proof at the rendered surface.
 */

const FIXTURE = resolve(process.cwd(), '../../mvp/contracts/scoring/fixtures/result-view.json');
const view = (): Record<string, unknown> => JSON.parse(readFileSync(FIXTURE, 'utf8'));

const SCREEN_ROUTE = '/en/dashboard/teacher/results/res-fixture-0001/family'; // the page route the wiring task adds

test.fixme('flag on: the family preview renders the allow-list surface', async ({ page }) => {
  await page.route('**/api/results/res-fixture-0001*', (route) => route.fulfill({ json: view() }));
  await page.goto(SCREEN_ROUTE);
  await expect(page.locator('[data-arm="family"]')).toBeVisible();
  await expect(page.locator('[data-slot="report-parent-score"]')).toHaveText('74%');
  await expect(page.locator('[data-slot="report-parent-phase"]')).toContainText('developing');
  await expect(page.locator('[data-slot="report-family-strength"]')).toHaveCount(2);
  await expect(page.locator('[data-slot="report-family-strength"][data-skill="Gist"]')).toHaveCount(0);
  await expect(page.locator('[data-slot="report-family-strength"][data-skill="Critical"]')).toHaveCount(0);
});

test.fixme('the rendered family DOM never contains an audit field (allow-list proof)', async ({ page }) => {
  await page.route('**/api/results/res-fixture-0001*', (route) => route.fulfill({ json: view() }));
  await page.goto(SCREEN_ROUTE);
  expect(await page.locator('body').textContent()).not.toMatch(/prob|theta/i);
});

test.fixme('flag off: the family route stays hidden, as today', async ({ page }) => {
  await page.goto(SCREEN_ROUTE);
  await expect(page.locator('[data-arm="family"]')).toHaveCount(0);
});
