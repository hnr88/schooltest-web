import { expect, test, type Page } from '@playwright/test';

import { TABS, frame, sectionTab } from './helpers/teacher-class-detail';
import { signIn } from './helpers/teacher-rail';
import { readLiveResults, TEACHER_EMAIL } from './helpers/teacher-results-live';

// Task 34 — the class analytics gates on the REAL API as the journey teacher (t2), with
// no interception: every section tab of the class detail is served by the ONE roster
// read (GET /api/my/students/results?class=), and no retired C-TR-3 / C-TR-4 result
// route (/api/teacher/classes/:id/insights | /progress) is ever requested — the gate
// behind the api-side route retirement (scoring task 24). What the Class progress tab
// draws is proven on the live roster by teacher-v2/progress-tab.spec.ts.

test.describe.configure({ mode: 'serial' });

const ROSTER_PATH = '/api/my/students/results';
const isRetired = (url: string): boolean =>
  url.includes('/teacher/classes/') && (url.includes('/insights') || url.includes('/progress'));

let page: Page;
let classDocumentId: string;
const rosterReads: string[] = [];
const retiredReads: string[] = [];

test.beforeAll(async ({ browser, playwright }) => {
  test.setTimeout(180_000);
  const [first] = (await readLiveResults(playwright, TEACHER_EMAIL, { withDetail: false })).classes;
  if (first === undefined) throw new Error('[e2e] the journey teacher owns no class');
  classDocumentId = first.class_document_id;
  page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
  page.on('request', (request) => {
    const url = new URL(request.url());
    if (request.method() === 'GET' && url.pathname === ROSTER_PATH && url.searchParams.get('class') === classDocumentId) {
      rosterReads.push(request.url());
    }
    if (isRetired(request.url())) retiredReads.push(request.url());
  });
  await signIn(page, 'teacher');
});

test.afterAll(async () => {
  await page?.close();
});

test('every section tab is served by the ONE roster read', async () => {
  rosterReads.length = 0;
  await page.goto(`/dashboard/results/${classDocumentId}`);
  await expect(frame(page)).toHaveAttribute('data-status', 'ready', { timeout: 30_000 });
  for (const key of [...TABS.slice(1), TABS[0]]) {
    await sectionTab(page, key).click();
    await expect(sectionTab(page, key)).toHaveAttribute('aria-selected', 'true');
    await expect(page.locator(`[data-tab-panel="${key}"]`)).toBeVisible();
  }
  expect(rosterReads, 'one roster read for the load and every tab visit').toHaveLength(1);
});

test('no retired insights / progress result URL is ever requested', async () => {
  for (const key of TABS) {
    await sectionTab(page, key).click();
    await expect(page.locator(`[data-tab-panel="${key}"]`)).toBeVisible();
  }
  expect(retiredReads, JSON.stringify(retiredReads)).toEqual([]);
});
