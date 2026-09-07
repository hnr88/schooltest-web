import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

import { expect, test } from '@playwright/test';

/**
 * Task 32 e2e — Screen C part 3 (commentary, Ask AI, LLM export) over route
 * interception: /api/results/:id is fulfilled with the ResultView fixture and
 * /api/ai/result-commentary with a canned text answer, so NO live Strapi and
 * NO live LLM gateway are needed — which is exactly why these are `test.fixme`:
 * no app page renders the results screen yet (the wiring train owns that), and
 * the LLM gateway endpoint itself does not exist until the wiring task lands.
 * The spec SHIPS; it runs the day both exist. Nothing here starts a server.
 *
 * The privacy assertion is the one that catches the D5 violation: the request
 * body the page POSTs to the AI endpoint must contain no `prob`, no `theta`
 * and no student name — asserted on the intercepted POST body.
 */

const FIXTURES = resolve(process.cwd(), '../../mvp/contracts/scoring/fixtures');
const bundle = (): unknown => JSON.parse(readFileSync(resolve(FIXTURES, 'diagnostic-export.json'), 'utf8'));
const view = (): Record<string, unknown> => JSON.parse(readFileSync(resolve(FIXTURES, 'result-view.json'), 'utf8'));

const SCREEN_ROUTE = '/en/dashboard/teacher/results/res-fixture-0001'; // the page route the wiring task adds
const AI_ENDPOINT = '**/api/ai/result-commentary';

test.fixme('commentary renders and the POSTed body carries no prob, theta or name', async ({ page }) => {
  const bodies: string[] = [];
  await page.route('**/api/results/res-fixture-0001*', (route) => route.fulfill({ json: view() }));
  await page.route(AI_ENDPOINT, async (route) => {
    bodies.push(route.request().postData() ?? '');
    return route.fulfill({ json: { paragraphs: ['A gated summary.'] } });
  });
  await page.goto(SCREEN_ROUTE);
  await page.getByRole('button', { name: /generate/i }).click();
  await expect(page.locator('[data-slot="student-commentary"]')).toBeVisible();
  for (const body of bodies) {
    expect(body).not.toMatch(/"prob"/);
    expect(body).not.toMatch(/theta/i);
    expect(body.toLowerCase()).not.toContain('amelia');
  }
});

test.fixme('Ask AI: a question posts the bundle context and the answer renders', async ({ page }) => {
  await page.route('**/api/results/res-fixture-0001*', (route) => route.fulfill({ json: view() }));
  await page.route(AI_ENDPOINT, (route) => route.fulfill({ json: { answer: 'Focus on Grammar first.' } }));
  await page.goto(SCREEN_ROUTE);
  await page.locator('[data-slot="ask-ai-chip"]').first().click();
  await page.locator('[data-slot="ask-ai-submit"]').click();
  await expect(page.locator('[data-slot="ask-ai-answer"]')).toContainText('Focus on Grammar first.');
});

test.fixme('the LLM markdown download contains no name and no posteriors', async ({ page }) => {
  await page.route('**/api/results/res-fixture-0001*', (route) => route.fulfill({ json: view() }));
  await page.goto(SCREEN_ROUTE);
  const download = page.waitForEvent('download');
  await page.locator('[data-slot="llm-export-download"]').click();
  const file = await download;
  await expect(file.suggestedFilename()).toMatch(/reading-diagnostic-sitting-4\.md$/);
  const markdown = await file.path().then((path) => (path === null ? '' : readFileSync(path, 'utf8')));
  expect(markdown).toContain('## Overall');
  expect(markdown.toLowerCase()).not.toContain('amelia');
  expect(markdown).not.toMatch(/prob|theta/i);
});

test.fixme('the fallback replaces commentary when the AI endpoint fails, claiming no growth for steady', async ({ page }) => {
  await page.route('**/api/results/res-fixture-0001*', (route) => route.fulfill({ json: view() }));
  await page.route(AI_ENDPOINT, (route) => route.abort());
  await page.goto(SCREEN_ROUTE);
  await page.getByRole('button', { name: /generate/i }).click();
  await expect(page.locator('[data-slot="student-commentary"][data-source="fallback"]')).toBeVisible();
});
