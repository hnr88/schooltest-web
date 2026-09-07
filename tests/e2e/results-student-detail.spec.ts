import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

import { expect, test } from '@playwright/test';

import { signIn } from './helpers/teacher-rail';

/**
 * Task 31 e2e — Screen C part 2 over route interception (NO live Strapi: the
 * /api/results/:id call is fulfilled with the contract fixture, which is what
 * proves the CLIENT contract without owning the server).
 *
 * WIRED (the route these tests waited for now exists): the page task 33's
 * wiring train promised is `/en/dashboard/teacher/results/:id`, mounting the
 * task 30/31/32 Screen C components through the results module's wired screen.
 * The C-4 v2 dispatch is live server-side too, but these specs intercept the
 * endpoint either way — the CLIENT contract is what they prove.
 *
 * When unblocked, the assertions are the ones the orchestrator pinned:
 * - sparkline section ABSENT with one sitting, PRESENT with three;
 * - the error-pattern section hidden for an empty array;
 * - the consolidating fixture shows the banner, not the checklist;
 * - `page.emulateMedia({ media: 'print' })` — the print snapshot carries NO
 *   buttons (the shared .print-hidden pair is what hides them);
 * - the Critical card shows a gate state, never a band (task 30 ruling);
 * - a not-assessed skill is a gap, never a 0 (task 30 ruling).
 */

const FIXTURE = resolve(process.cwd(), '../mvp/contracts/scoring/fixtures/result-view.json');

const view = (): Record<string, unknown> => JSON.parse(readFileSync(FIXTURE, 'utf8'));

// The route sits behind TeacherGuard, so every test signs in first — the
// precondition the assertions always assumed; this file shipped before the
// route had a guard and never carried it.
test.beforeEach(async ({ page }) => {
  await signIn(page, 'teacher');
});

const SCREEN_ROUTE = '/en/dashboard/teacher/results/res-fixture-0001'; // the page route task 33 wires

test('sparklines: absent with one sitting, present with two', async ({ page }) => {
  await page.route('**/api/results/res-fixture-0001*', (route) => route.fulfill({ json: view() }));
  await page.goto(SCREEN_ROUTE);
  await expect(page.locator('[data-slot="movement-sparklines"]')).toHaveCount(1);
  await expect(page.locator('[data-slot="movement-row"]')).toHaveCount(5);
  await expect(page.locator('[data-slot="movement-row"][data-skill="Critical"]')).toHaveCount(0);
});

test('error patterns: present with patterns, absent for an empty array', async ({ page }) => {
  await page.route('**/api/results/res-fixture-0001*', (route) => route.fulfill({ json: view() }));
  await page.goto(SCREEN_ROUTE);
  await expect(page.locator('[data-slot="error-patterns"]')).toHaveCount(1);
  await expect(page.locator('[data-slot="error-pattern"]')).toHaveCount(2);
  await expect(page.locator('[data-slot="error-pattern-insight"]')).toContainText('most common slip');
});

test('consolidating: the banner replaces the checklist', async ({ page }) => {
  await page.route('**/api/results/res-fixture-0001*', (route) =>
    route.fulfill({ json: { ...view(), acara_phase: 'consolidating' } }),
  );
  await page.goto(SCREEN_ROUTE);
  await expect(page.locator('[data-slot="consolidating-checklist"]')).toHaveCount(0);
  await expect(page.locator('[data-slot="consolidating-banner-text"]')).toHaveText(
    'Consolidating — meets all requirements',
  );
});

test('print: the print-media snapshot carries no buttons', async ({ page }) => {
  await page.route('**/api/results/res-fixture-0001*', (route) => route.fulfill({ json: view() }));
  await page.goto(SCREEN_ROUTE);
  await expect(page.locator('[data-slot="print-report-button"]')).toBeVisible();
  await page.emulateMedia({ media: 'print' });
  await expect(page.locator('[data-slot="print-report-button"]')).toBeHidden();
  await page.emulateMedia({ media: 'screen' });
});

test('the guardrails hold on the wired screen (task 30 rulings)', async ({ page }) => {
  await page.route('**/api/results/res-fixture-0001*', (route) => route.fulfill({ json: view() }));
  await page.goto(SCREEN_ROUTE);
  await expect(page.locator('[data-slot="skill-card"][data-skill="Gist"]')).toHaveAttribute('data-assessed', 'false');
  await expect(page.locator('[data-slot="skill-card"][data-skill="Critical"]')).not.toHaveAttribute('data-band');
  // Scoped to the rendered surface per the receipt-vs-render ruling: posteriors in API payloads for audit; the guard is on what a teacher SEES.
       // body.textContent would sweep Next's RSC flight payload (catalog text
       // like "Report a problem" matches /prob/i) and assert the wrong rule.
       expect(await page.locator('[data-slot="result-screen"]').textContent()).not.toMatch(/prob|theta/i);
});
