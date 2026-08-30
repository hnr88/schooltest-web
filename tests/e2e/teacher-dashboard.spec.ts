import path from 'node:path';

import { AxeBuilder } from '@axe-core/playwright';
import { expect, test, type Page } from '@playwright/test';

import { cat, icu, loadMessages } from './helpers/i18n';
import {
  installPersonaSampler,
  measureOverflow,
  personaFrames,
  plural,
  withWire,
  type WireClass,
} from './helpers/teacher-dashboard-live';
import { signIn } from './helpers/teacher-rail';

// Task 032 / contract C-TD-1 — the teacher landing page. Every number asserted
// below is read off the wire from the REAL GET /api/teacher/dashboard that the
// render itself consumed, so a copy or contract change breaks this spec instead
// of silently drifting past it.
const en = loadMessages('en');
const TD = 'Teacher.dashboard';
const SCREENSHOTS = path.resolve(process.cwd(), '..', '.qa', 'screenshots');

const surface = (page: Page) => page.locator('[data-surface="teacher-dashboard"]');
const cards = (page: Page) => page.locator('[data-slot="teacher-class-card"]');

test.describe.configure({ mode: 'serial' });

test.describe('teacher dashboard (C-TD-1)', () => {
  let page: Page;
  let wire: WireClass[] = [];
  const apiCalls: string[] = [];

  test.beforeAll(async ({ browser }) => {
    // AxeBuilder rejects a page from browser.newPage() — it needs a context.
    const context = await browser.newContext({ viewport: { width: 1280, height: 900 } });
    page = await context.newPage();
    page.on('response', async (res) => {
      const { pathname } = new URL(res.url());
      if (!pathname.startsWith('/api/')) return;
      apiCalls.push(`${res.status()} ${pathname}`);
      if (pathname === '/api/teacher/dashboard' && res.status() === 200) {
        wire = ((await res.json()) as { classes: WireClass[] }).classes;
      }
    });
    await installPersonaSampler(page);
    await signIn(page, 'teacher');
    await expect(surface(page)).toHaveAttribute('data-status', 'ready');
  });

  test.afterAll(async () => {
    await page.close();
  });

  test('the sign-in path never paints or reads as the parent persona', async () => {
    const frames = await personaFrames(page);
    expect(frames.length).toBeGreaterThan(0);
    for (const frame of frames) {
      expect(frame, `wrong persona frame painted: ${frame}`).not.toContain('PARENT');
      expect(frame, `unknown surface painted: ${frame}`).not.toContain('UNKNOWN-MAIN');
    }
    expect(frames[frames.length - 1]).toBe('teacher:ready');

    // The role arrives only with GET /api/users/me — the login payload carries no
    // `role`. Branching before it lands mounted the parent Overview, whose
    // parent-only students read answers 403 for a teacher.
    expect(apiCalls.filter((call) => call.includes('/api/my/students'))).toEqual([]);
    expect(apiCalls.filter((call) => !/^2\d\d /.test(call))).toEqual([]);
    await expect(page.getByText(cat(en, 'Dashboard.studentsError'))).toHaveCount(0);
  });

  test('every card equals the live payload the render consumed', async () => {
    expect(wire.length).toBeGreaterThan(0);
    await expect(page.getByRole('heading', { level: 1 })).toHaveText(cat(en, `${TD}.title`));
    await expect(cards(page)).toHaveCount(wire.length);

    for (const klass of wire) {
      const card = page.locator(`[data-class-id="${klass.class_document_id}"]`);
      await expect(card.getByRole('heading', { level: 2 })).toHaveText(klass.name);
      await expect(
        card.getByText(plural(cat(en, `${TD}.students`), klass.student_count), { exact: true }),
      ).toBeVisible();

      for (const [labelKey, completion] of [
        [`${TD}.testA`, klass.test_a],
        [`${TD}.testB`, klass.test_b],
      ] as const) {
        const label = cat(en, labelKey);
        const params = {
          completed: String(completion.completed),
          total: String(completion.total),
        };
        // Read the <dd> PAIRED with this <dt>, so Test B cannot pass on Test A's row.
        await expect(
          card.locator('dt', { hasText: label }).locator('xpath=following-sibling::dd[1]'),
        ).toHaveText(icu(cat(en, `${TD}.completionValue`), params));
        await expect(
          card.getByRole('progressbar', {
            name: icu(cat(en, `${TD}.completionAria`), { label, ...params }),
          }),
        ).toHaveCount(1);
      }

      const gap = klass.top_gap;
      await expect(card).toHaveAttribute('data-top-gap', gap ? gap.attribute : 'none');
      if (gap) {
        await expect(card.getByText(gap.name, { exact: true })).toBeVisible();
        await expect(
          card.getByText(plural(cat(en, `${TD}.notYetCount`), gap.not_yet_count), { exact: true }),
        ).toBeVisible();
      } else {
        await expect(card.getByText(cat(en, `${TD}.noGap`), { exact: true })).toBeVisible();
      }
    }
  });

  test('no overflow at 375 or 1280, and axe finds no blocker', async () => {
    for (const [name, width, height] of [
      ['desktop-1280', 1280, 900],
      ['mobile-375', 375, 812],
    ] as const) {
      await page.setViewportSize({ width, height });
      await expect(page.locator('[data-slot="teacher-class-cards"]')).toBeVisible();

      const overflow = await measureOverflow(page);
      expect(overflow.doc, `${name} page scrolls horizontally`).toBe(0);
      for (const card of overflow.cards) expect(card, `${name} card overflows`).toBe(0);
      expect(overflow.columns).toBe(width === 1280 ? Math.min(2, wire.length) : 1);

      const results = await new AxeBuilder({ page })
        .include('[data-surface="teacher-dashboard"]')
        .analyze();
      // Only landmark best-practice rules are tolerated: SidebarInset is itself a
      // <main>, so every screen module in this app nests one. Shell-wide, and the
      // untouched parent Overview reports the same two.
      expect(
        results.violations
          .filter((v) => v.impact === 'serious' || v.impact === 'critical')
          .map((v) => `${v.impact}:${v.id}`),
      ).toEqual([]);

      await page.screenshot({
        path: path.join(SCREENSHOTS, `032-teacher-dashboard-${name}.png`),
        fullPage: true,
      });
    }
    await page.setViewportSize({ width: 1280, height: 900 });
  });

  test('completion is carried as text, never by the bar fill alone', async () => {
    const bars = page.getByRole('progressbar');
    await expect(bars).toHaveCount(wire.length * 2);
    for (let index = 0; index < wire.length * 2; index += 1) {
      const bar = bars.nth(index);
      const valuetext = await bar.getAttribute('aria-valuetext');
      expect(valuetext).toMatch(/^\d+ \/ \d+$/);
      await expect(bar).toContainText(valuetext ?? '');
    }
  });

  test('a null top_gap renders the honest empty state, never a zero', async () => {
    await withWire(page, (body) => {
      body.classes[0].top_gap = null;
    });
    const first = cards(page).first();
    await expect(first).toHaveAttribute('data-top-gap', 'none');
    await expect(first.getByText(cat(en, `${TD}.noGap`), { exact: true })).toBeVisible();
    await expect(first.getByText(cat(en, `${TD}.noGapHint`), { exact: true })).toBeVisible();
    expect(await first.innerText()).not.toMatch(/\b0 students not yet\b/);
    await page.unroute('**/api/teacher/dashboard');
  });

  test('an empty class list is an empty state, not a fabricated card', async () => {
    await withWire(page, (body) => {
      body.classes = [];
    });
    await expect(surface(page)).toHaveAttribute('data-status', 'empty');
    await expect(page.getByText(cat(en, `${TD}.emptyTitle`))).toBeVisible();
    await expect(cards(page)).toHaveCount(0);
    await page.unroute('**/api/teacher/dashboard');
  });

  test('a failed read fails loud, and Try again recovers', async () => {
    await page.route('**/api/teacher/dashboard', (route) => route.abort());
    await page.reload();
    await expect(surface(page)).toHaveAttribute('data-status', 'error');
    await expect(page.getByText(cat(en, `${TD}.errorTitle`))).toBeVisible();
    await expect(cards(page)).toHaveCount(0);
    await page.unroute('**/api/teacher/dashboard');
    const retry = page.getByRole('button', { name: cat(en, `${TD}.retry`), exact: true });
    await retry.focus();
    expect(await retry.evaluate((el) => el.matches(':focus-visible'))).toBe(true);
    await retry.click();
    await expect(surface(page)).toHaveAttribute('data-status', 'ready');
    await expect(cards(page)).toHaveCount(wire.length);
  });
});
