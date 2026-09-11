import { mkdirSync, writeFileSync } from 'node:fs';
import path from 'node:path';

import { expect, test, type APIRequestContext, type Locator, type Page, type TestInfo } from '@playwright/test';

import { apiEnv } from './helpers/auth-db';
import { loginCached } from './helpers/http';
import { cat, loadMessages } from './helpers/i18n';
import { signIn, signInTeacher } from './helpers/teacher-rail';

// Teacher portal GAP AUDIT (orchestrator brief, 2026-09-11). Captures every
// screen a seeded journey teacher actually reaches, at 1440x900, so each one can
// be compared against mvp/teacher/designs/Teacher Portal v2.dc.html. It changes
// no product code. t1 and t2 are read-only. The only data written is ONE sitting
// that t3 opens through the product's own start control and closes again through
// the real close route, so the live console and the roll-up are captured in both
// states. t3's class is used because t2's class carries the J05/J06 journeys; a
// sitting that was already open is never touched. Next to the shots the spec
// writes the rail text, the tab labels, the C-TD-1 dashboard payload and every
// console error, so each number and each dev-overlay issue can be traced.
const en = loadMessages('en');
const API = 'http://127.0.0.1:5500';
const SHOTS = path.resolve(process.cwd(), '..', '.qa', 'journeys', 'teacher-gap-audit', 'shots');
const VIEWPORT = { width: 1440, height: 900 };
const LIVE_TAB = cat(en, 'Teacher.results.tabs.live');

interface DashboardClass {
  class_document_id: string;
  name: string;
  open_session_count: number;
}

interface SittingRow {
  documentId: string;
  status: 'open' | 'closed';
}

const notes: Record<string, unknown> = {};
let openedByAudit: { jwt: string; sittingDocumentId: string } | null = null;
const consoleErrors: string[] = [];

test.describe.configure({ mode: 'serial' });
test.use({ actionTimeout: 30_000, navigationTimeout: 90_000 });

/** Buffers the page's console errors and uncaught errors; each shot claims its own. */
function collectErrors(page: Page): void {
  page.on('console', (message) => {
    if (message.type() === 'error') consoleErrors.push(message.text().slice(0, 500));
  });
  page.on('pageerror', (error) => consoleErrors.push(`pageerror: ${error.message.slice(0, 500)}`));
}

async function shot(page: Page, testInfo: TestInfo, name: string): Promise<void> {
  await page.setViewportSize(VIEWPORT);
  const body = await page.screenshot({ fullPage: true });
  mkdirSync(SHOTS, { recursive: true });
  writeFileSync(path.join(SHOTS, `${name}.png`), body);
  await testInfo.attach(`${name}.png`, { body, contentType: 'image/png' });
  notes[`${name.slice(0, 2)}.errors.${name}`] = consoleErrors.splice(0);
}

/** Waits for the shell, then lets the client islands' first reads land. */
async function settle(page: Page): Promise<void> {
  await page.waitForLoadState('domcontentloaded');
  await expect(page.locator('[data-slot="sidebar"]')).toBeVisible({ timeout: 90_000 });
  await page.waitForTimeout(2_500);
}

/** Opens the Next dev overlay's issue badge, if one shows, and records what it reports. */
async function devIssues(page: Page, testInfo: TestInfo, name: string): Promise<void> {
  const badge = page.getByText(/^\d+ Issues?$/).first();
  if ((await badge.count()) === 0) return;
  notes[`${name.slice(0, 2)}.devBadge.${name}`] = (await badge.innerText()).trim();
  await badge.click();
  await page.waitForTimeout(1_500);
  await shot(page, testInfo, `${name}-dev-overlay`);
  notes[`${name.slice(0, 2)}.devOverlay.${name}`] = await page.evaluate(
    () => document.querySelector('nextjs-portal')?.shadowRoot?.textContent?.slice(0, 5_000) ?? '',
  );
  // The overlay traps pointer events and Escape does not dismiss it; a reload does.
  await page.reload();
  await settle(page);
}

async function textOf(page: Page, selector: string): Promise<string> {
  const target = page.locator(selector).first();
  return (await target.count()) > 0 ? (await target.innerText()).slice(0, 6_000) : '';
}

function slug(label: string): string {
  return label.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
}

async function teacherJwt(request: APIRequestContext, email: string): Promise<string> {
  return loginCached(request, API, { email, password: apiEnv('SEED_TEACHER_PASSWORD') });
}

async function readDashboard(request: APIRequestContext, jwt: string): Promise<DashboardClass[]> {
  const res = await request.get(`${API}/api/teacher/dashboard`, {
    headers: { Authorization: `Bearer ${jwt}` },
  });
  expect(res.ok()).toBeTruthy();
  const body = (await res.json()) as { classes?: DashboardClass[]; data?: { classes?: DashboardClass[] } };
  return body.classes ?? body.data?.classes ?? [];
}

async function classSittings(
  request: APIRequestContext,
  jwt: string,
  classDocumentId: string,
): Promise<SittingRow[]> {
  const res = await request.get(
    `${API}/api/sittings?filters[class][documentId][$eq]=${classDocumentId}&sort=createdAt:desc`,
    { headers: { Authorization: `Bearer ${jwt}` } },
  );
  if (!res.ok()) return [];
  return ((await res.json()) as { data: SittingRow[] }).data;
}

/** The class shell's view tablist is the one that carries the Live sessions tab. */
function viewTabs(page: Page): Locator {
  return page.locator('[role="tablist"]').filter({ has: page.getByRole('tab', { name: LIVE_TAB }) });
}

async function openLiveTab(page: Page, classDocumentId: string): Promise<boolean> {
  await page.goto(`/en/dashboard/results/${classDocumentId}`);
  await settle(page);
  if ((await viewTabs(page).count()) === 0) return false;
  await viewTabs(page).getByRole('tab', { name: LIVE_TAB, exact: true }).click();
  await page.waitForTimeout(2_500);
  return true;
}

/** Sign in through the real form, capture the landing, the rail and /dashboard/results. */
async function captureLanding(
  page: Page,
  testInfo: TestInfo,
  request: APIRequestContext,
  who: string,
  email: string,
): Promise<DashboardClass[]> {
  const classes = await readDashboard(request, await teacherJwt(request, email));
  notes[`${who}.dashboardClasses`] = classes;

  await page.setViewportSize(VIEWPORT);
  if (who === 't2') await signIn(page, 'teacher');
  else await signInTeacher(page, email);
  await settle(page);
  notes[`${who}.landingUrl`] = page.url();
  await shot(page, testInfo, `${who}-01-landing-after-sign-in`);
  await devIssues(page, testInfo, `${who}-01-landing-after-sign-in`);
  notes[`${who}.rail`] = await textOf(page, '[data-slot="sidebar"]');
  mkdirSync(SHOTS, { recursive: true });
  await page.locator('[data-slot="sidebar"]').screenshot({ path: path.join(SHOTS, `${who}-02-rail.png`) });

  await page.goto('/en/dashboard/results');
  await settle(page);
  await shot(page, testInfo, `${who}-03-results-landing`);
  notes[`${who}.resultsText`] = await textOf(page, 'main');
  return classes;
}

/** The class shell, every view tab, a student drill-down and the other skills. */
async function captureShell(page: Page, testInfo: TestInfo, who: string, klass: DashboardClass): Promise<boolean> {
  await page.goto(`/en/dashboard/results/${klass.class_document_id}`);
  await settle(page);
  await shot(page, testInfo, `${who}-10-class-shell`);
  await devIssues(page, testInfo, `${who}-10-class-shell`);
  if ((await viewTabs(page).count()) === 0) {
    notes[`${who}.shellState`] = await textOf(page, '[data-surface="teacher-class-results"]');
    return false;
  }

  const lists = page.locator('[role="tablist"]');
  const labels: string[][] = [];
  for (let l = 0; l < (await lists.count()); l += 1) {
    labels.push((await lists.nth(l).getByRole('tab').allInnerTexts()).map((label) => label.trim()));
  }
  notes[`${who}.tabLabels`] = labels;

  const viewCount = await viewTabs(page).getByRole('tab').count();
  for (let i = 0; i < viewCount; i += 1) {
    const tab = viewTabs(page).getByRole('tab').nth(i);
    const label = (await tab.innerText()).trim();
    await tab.click();
    await page.waitForTimeout(2_500);
    await shot(page, testInfo, `${who}-11-view-${i + 1}-${slug(label)}`);
    notes[`${who}.view.${label}`] = await textOf(page, '[role="tabpanel"]:visible');
  }

  // A student drill-down, reached from the Students view the way a teacher would.
  await viewTabs(page).getByRole('tab').first().click();
  await page.waitForTimeout(2_000);
  const student = page.locator(`a[href*="/results/${klass.class_document_id}/students/"]`).first();
  if ((await student.count()) > 0) {
    await student.click();
    await settle(page);
    notes[`${who}.drilldownUrl`] = page.url();
    await shot(page, testInfo, `${who}-12-student-drilldown`);
    notes[`${who}.drilldownText`] = await textOf(page, 'main');
    await page.goto(`/en/dashboard/results/${klass.class_document_id}`);
    await settle(page);
  }

  // The skill tabs: everything but the first (Reading) is captured, then Reading restored.
  const skills = lists.filter({ hasNot: page.getByRole('tab', { name: LIVE_TAB }) }).first().getByRole('tab');
  const skillCount = await skills.count();
  for (let j = 1; j < skillCount; j += 1) {
    const label = (await skills.nth(j).innerText()).trim();
    await skills.nth(j).click();
    await page.waitForTimeout(2_000);
    await shot(page, testInfo, `${who}-13-skill-${slug(label)}`);
  }
  if (skillCount > 0) await skills.first().click();
  return true;
}

function writeNotes(who: string): void {
  mkdirSync(SHOTS, { recursive: true });
  const mine = Object.fromEntries(Object.entries(notes).filter(([key]) => key.startsWith(`${who}.`)));
  writeFileSync(path.join(SHOTS, `${who}-notes.json`), JSON.stringify(mine, null, 2));
}

test.afterAll(async ({ request }) => {
  test.setTimeout(60_000);
  if (openedByAudit === null) return;
  const res = await request.post(`${API}/api/sittings/${openedByAudit.sittingDocumentId}/close`, {
    headers: { Authorization: `Bearer ${openedByAudit.jwt}` },
  });
  notes['t3.cleanupCloseStatus'] = res.status();
  writeNotes('t3');
});

test('t1 (Tara Okonkwo): landing, rail, class shell, roll-up, legacy routes', async ({
  page,
  request,
}, testInfo) => {
  test.setTimeout(600_000);
  collectErrors(page);
  const classes = await captureLanding(page, testInfo, request, 't1', 't1@schooltest.local');
  const klass = classes[0];
  if (klass !== undefined) await captureShell(page, testInfo, 't1', klass);

  await page.goto('/en/dashboard/test-sessions');
  await settle(page);
  await shot(page, testInfo, 't1-21-rollup');
  notes['t1.rollup'] = await textOf(page, 'main');

  // Older teacher routes that are still reachable, to spot leftovers.
  const legacy: Array<[string, string]> = [['t1-30-legacy-dashboard', '/en/dashboard']];
  if (klass !== undefined) {
    legacy.push(
      ['t1-31-legacy-teach-class', `/en/dashboard/teach/classes/${klass.class_document_id}`],
      ['t1-32-legacy-test-day', `/en/dashboard/teach/classes/${klass.class_document_id}/test-day`],
    );
  }
  legacy.push(['t1-33-legacy-run-sheet', '/en/dashboard/teach/run-sheet'], ['t1-34-legacy-reports', '/en/dashboard/reports']);
  for (const [name, route] of legacy) {
    await page.goto(route);
    await settle(page);
    notes[`t1.url.${name}`] = page.url();
    await shot(page, testInfo, name);
  }
  writeNotes('t1');
});

test('t2 (Marco Alvarez): landing, rail, class shell with scored data', async ({ page, request }, testInfo) => {
  test.setTimeout(600_000);
  collectErrors(page);
  const classes = await captureLanding(page, testInfo, request, 't2', 't2@schooltest.local');
  const klass = classes[0];
  if (klass !== undefined) await captureShell(page, testInfo, 't2', klass);
  writeNotes('t2');
});

test('t3 (Priya Raghavan): live console and roll-up, before and after one sitting opens', async ({
  page,
  request,
}, testInfo) => {
  test.setTimeout(600_000);
  collectErrors(page);
  const email = 't3@schooltest.local';
  const classes = await captureLanding(page, testInfo, request, 't3', email);
  const klass = classes[0];
  expect(klass, 't3 has at least one class on C-TD-1').toBeDefined();
  if (klass === undefined) return;

  const jwt = await teacherJwt(request, email);
  const preOpen = (await classSittings(request, jwt, klass.class_document_id))
    .filter((sitting) => sitting.status === 'open')
    .map((sitting) => sitting.documentId);
  notes['t3.preOpenSittings'] = preOpen;

  const reachable = await openLiveTab(page, klass.class_document_id);
  notes['t3.liveTabReachable'] = reachable;
  await shot(page, testInfo, preOpen.length > 0 ? 't3-20-live-tab-already-open' : 't3-20-live-tab-no-sitting');
  notes['t3.liveTabBefore'] = await textOf(page, '[data-slot="test-day"]');
  await page.goto('/en/dashboard/test-sessions');
  await settle(page);
  await shot(page, testInfo, preOpen.length > 0 ? 't3-21-rollup-already-open' : 't3-21-rollup-nothing-running');
  notes['t3.rollupBefore'] = await textOf(page, 'main');

  if (preOpen.length === 0 && reachable) {
    // Start a sitting through the product's own control on the live tab.
    await openLiveTab(page, klass.class_document_id);
    const start = page
      .locator('[data-slot="test-day"]')
      .getByRole('button', { name: cat(en, 'TestDay.startCta'), exact: true });
    await expect(start).toBeVisible({ timeout: 30_000 });
    await start.click();
    await expect(page.locator('[data-slot="code-reveal-card"]')).toBeVisible({ timeout: 60_000 });
    const opened = (await classSittings(request, jwt, klass.class_document_id)).find(
      (sitting) => sitting.status === 'open',
    );
    if (opened !== undefined) openedByAudit = { jwt, sittingDocumentId: opened.documentId };
    notes['t3.openedSitting'] = opened?.documentId ?? null;
    await page.waitForTimeout(2_500);
    await shot(page, testInfo, 't3-22-live-tab-open-sitting');
    notes['t3.liveTabOpen'] = await textOf(page, '[data-slot="test-day"]');

    const close = page
      .locator('[data-slot="test-day"]')
      .getByRole('button', { name: cat(en, 'TestDay.monitor.closeCta'), exact: true });
    if ((await close.count()) > 0) {
      await close.first().click();
      const dialog = page.locator('[role="alertdialog"]');
      await expect(dialog).toBeVisible({ timeout: 15_000 });
      await shot(page, testInfo, 't3-23-close-confirm');
      notes['t3.closeConfirm'] = await dialog.innerText();
      await page.keyboard.press('Escape');
    }
    await devIssues(page, testInfo, 't3-22-live-tab-open-sitting');

    await page.goto('/en/dashboard/test-sessions');
    await settle(page);
    await shot(page, testInfo, 't3-24-rollup-one-open');
    notes['t3.rollupOpen'] = await textOf(page, 'main');
    if (opened !== undefined) {
      await page.goto(`/en/dashboard/test-sessions/${opened.documentId}`);
      await settle(page);
      await shot(page, testInfo, 't3-25-console-route');
      notes['t3.consoleRoute'] = await textOf(page, 'main');
    }
  }
  writeNotes('t3');
});
