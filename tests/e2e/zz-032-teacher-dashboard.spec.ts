import path from 'node:path';

import { AxeBuilder } from '@axe-core/playwright';
import { expect, test, type Page } from '@playwright/test';

import { cat, loadMessages } from './helpers/i18n';
import { DESKTOP, signIn } from './helpers/teacher-rail';

// SCRATCH spec for task 032 — deleted before the task closes. It proves the
// class cards against the LIVE C-TD-1 read, never a fixture.
//
// Serial with ONE shared page per persona: the whole QA fleet shares one
// loopback IP and POST /api/auth/local is rate-limited (a 429 was observed at
// 22:57:38 with 111 fleet logins in three minutes), so the form is driven twice
// per run, not once per test.
const en = loadMessages('en');
const zh = loadMessages('zh');
const API = 'http://localhost:5500';
const SHOTS = path.resolve(process.cwd(), '..', '.qa', 'screenshots');

interface Completion {
  completed: number;
  total: number;
}
interface DashboardClass {
  class_document_id: string;
  name: string;
  student_count: number;
  test_a: Completion;
  test_b: Completion;
  top_gap: { attribute: string; name: string; not_yet_count: number } | null;
}

test.describe.configure({ mode: 'serial' });

test.describe('task 032 — teacher class cards', () => {
  let page: Page;

  test.beforeAll(async ({ browser }) => {
    const context = await browser.newContext({ viewport: DESKTOP });
    page = await context.newPage();
    await signIn(page, 'teacher');
  });

  test.afterAll(async () => {
    await page.close();
  });

  test('desktop cards match the live GET /api/teacher/dashboard', async ({ request }) => {
    await page.setViewportSize(DESKTOP);
    await page.goto('/dashboard');
    const surface = page.locator('[data-surface="teacher-dashboard"]');
    await expect(surface).toHaveAttribute('data-status', 'ready', { timeout: 20_000 });

    const token = await page.evaluate(() => window.localStorage.getItem('app.auth.token'));
    const live = await request.get(`${API}/api/teacher/dashboard`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    expect(live.status()).toBe(200);
    const body = (await live.json()) as { classes: DashboardClass[] };
    console.log('LIVE C-TD-1 classes:', JSON.stringify(body.classes));

    const cards = page.locator('[data-slot="teacher-class-card"]');
    await expect(cards).toHaveCount(body.classes.length);

    for (const klass of body.classes) {
      const card = page.locator(`[data-class-id="${klass.class_document_id}"]`);
      await expect(card).toContainText(klass.name);
      await expect(card).toContainText(`${klass.student_count} students`);
      await expect(card.getByRole('progressbar')).toHaveCount(2);
      await expect(card.getByRole('progressbar').first()).toHaveAttribute(
        'aria-valuetext',
        `${klass.test_a.completed} / ${klass.test_a.total}`,
      );
      await expect(card.getByRole('progressbar').nth(1)).toHaveAttribute(
        'aria-valuetext',
        `${klass.test_b.completed} / ${klass.test_b.total}`,
      );
      if (klass.top_gap) {
        await expect(card).toHaveAttribute('data-top-gap', klass.top_gap.attribute);
        await expect(card).toContainText(klass.top_gap.name);
        await expect(card).toContainText(String(klass.top_gap.not_yet_count));
      } else {
        await expect(card).toHaveAttribute('data-top-gap', 'none');
        await expect(card).toContainText(cat(en, 'Teacher.dashboard.noGap'));
      }
    }
    console.log('RENDERED:', (await page.locator('[data-slot="teacher-class-cards"]').innerText()).replace(/\n/g, ' | '));

    await expect(page.getByText(cat(en, 'Dashboard.studentsError'))).toHaveCount(0);
    await expect(page.locator('[data-surface="parent-overview"]')).toHaveCount(0);
    await page.screenshot({ path: path.join(SHOTS, 'task-032-dashboard-desktop.png') });

    await page.reload();
    await expect(surface).toHaveAttribute('data-status', 'ready', { timeout: 20_000 });
    await expect(cards).toHaveCount(body.classes.length);
  });

  test('375px renders with no horizontal overflow', async () => {
    await page.setViewportSize({ width: 375, height: 812 });
    await page.goto('/dashboard');
    await expect(page.locator('[data-surface="teacher-dashboard"]')).toHaveAttribute(
      'data-status',
      'ready',
      { timeout: 20_000 },
    );
    const overflow = await page.evaluate(() => ({
      scroll: document.documentElement.scrollWidth,
      client: document.documentElement.clientWidth,
    }));
    console.log('375px overflow:', JSON.stringify(overflow));
    expect(overflow.scroll).toBeLessThanOrEqual(overflow.client);
    await page.screenshot({
      path: path.join(SHOTS, 'task-032-dashboard-375.png'),
      fullPage: true,
    });
    await page.setViewportSize(DESKTOP);
  });

  test('zh catalog renders the same live numbers', async () => {
    await page.goto('/zh/dashboard');
    const surface = page.locator('[data-surface="teacher-dashboard"]');
    await expect(surface).toHaveAttribute('data-status', 'ready', { timeout: 20_000 });
    await expect(
      page.getByRole('heading', { name: cat(zh, 'Teacher.dashboard.title'), level: 1 }),
    ).toBeVisible();
    await expect(page.locator('[data-slot="teacher-class-card"]')).toHaveCount(2);
    await page.screenshot({ path: path.join(SHOTS, 'task-032-dashboard-zh.png') });
  });

  test('a dead read fails loud — no canned cards, and Try again recovers', async () => {
    let dead = true;
    await page.route('**/api/teacher/dashboard', async (route) => {
      if (dead) return route.abort('connectionfailed');
      return route.continue();
    });
    await page.goto('/dashboard');

    const surface = page.locator('[data-surface="teacher-dashboard"]');
    await expect(surface).toHaveAttribute('data-status', 'error', { timeout: 20_000 });
    await expect(page.locator('[data-slot="teacher-class-card"]')).toHaveCount(0);
    const text = (await surface.innerText()).replace(/\s+/g, ' ');
    console.log('ERROR BRANCH TEXT:', text);
    expect(text).not.toContain('EAL/D');
    expect(text).not.toContain('/ 4');
    expect(text).not.toContain('/ 5');
    await expect(page.getByText(cat(en, 'Teacher.dashboard.errorTitle'))).toBeVisible();
    await page.screenshot({ path: path.join(SHOTS, 'task-032-read-failure.png') });

    dead = false;
    await page.getByRole('button', { name: cat(en, 'Teacher.dashboard.retry') }).click();
    await expect(surface).toHaveAttribute('data-status', 'ready', { timeout: 20_000 });
    await expect(page.locator('[data-slot="teacher-class-card"]').first()).toBeVisible();
    await page.unroute('**/api/teacher/dashboard');
  });

  test('axe: zero serious/critical violations at 1280 and 375', async () => {
    for (const viewport of [DESKTOP, { width: 375, height: 812 }]) {
      await page.setViewportSize(viewport);
      await page.goto('/dashboard');
      await expect(page.locator('[data-surface="teacher-dashboard"]')).toHaveAttribute(
        'data-status',
        'ready',
        { timeout: 20_000 },
      );
      const results = await new AxeBuilder({ page }).analyze();
      const severe = results.violations.filter(
        (violation) => violation.impact === 'serious' || violation.impact === 'critical',
      );
      console.log(
        `AXE ${viewport.width}px — violations: ${results.violations
          .map((violation) => `${violation.id}(${violation.impact})`)
          .join(', ') || 'none'}`,
      );
      expect(severe, JSON.stringify(severe.map((violation) => violation.id))).toHaveLength(0);
    }
    await page.setViewportSize(DESKTOP);
  });

  test('a parent still gets the untouched Overview', async ({ browser }) => {
    const parentPage = await browser.newPage({ viewport: DESKTOP });
    await signIn(parentPage, 'parent');
    await expect(parentPage.locator('[data-surface="parent-overview"]')).toBeVisible({
      timeout: 20_000,
    });
    await expect(parentPage.locator('[data-surface="teacher-dashboard"]')).toHaveCount(0);
    await parentPage.screenshot({ path: path.join(SHOTS, 'task-032-parent-overview.png') });
    await parentPage.close();
  });
});
