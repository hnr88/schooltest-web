import { mkdirSync } from 'node:fs';
import path from 'node:path';

import { expect, test } from '@playwright/test';

import {
  READY,
  TABS,
  TAB_BODIES,
  expectHeader,
  expectNoNewErrors,
  frame,
  label,
  param,
  sectionTab,
  sectionTabs,
  setAsideErrors,
  skillTab,
  waitForDashboard,
} from '../helpers/teacher-class-detail';
import { signIn, signInTeacher } from '../helpers/teacher-rail';
import { watchErrors } from '../helpers/ui';

// S2 — the class-detail frame (Teacher Portal v2.dc.html:518–662, 1004–1020; design
// shots class-detail-sitting--results.png, class-detail-complete--exit.png,
// class-detail-coming-soon--listening.png at 1440×900). Real sign-in, real API, no
// interception: names, counts and statuses are checked against the dashboard response
// the page received, and no console or page error may come from the frame — on load
// and on every tab and skill switch.
const PROOFS = path.resolve(process.cwd(), 'tests', 'e2e', 'proofs', 'teacher-v2');
/** The seeded teacher that owns more than one class (t2 owns exactly one). */
const MULTI_CLASS_TEACHER = 'teacher@schooltest.local';

test.use({ viewport: { width: 1440, height: 900 } });

test.describe('S2 — Teacher Portal v2 class detail frame', () => {
  test('real header, six tabs in the URL, skills, Exit predictions, sticky header', async ({ page }) => {
    test.setTimeout(240_000);
    mkdirSync(PROOFS, { recursive: true });
    const errors = watchErrors(page);
    const dashboardPromise = waitForDashboard(page);
    await signIn(page, 'teacher');
    await page.waitForURL('**/dashboard/results');
    const dashboard = await dashboardPromise;

    // The first class on the Classes list (the Students tab is the default).
    const firstRow = page.locator('[data-slot="results-class-row"]').first();
    await expect(firstRow).toBeVisible({ timeout: 30_000 });
    const firstId = await firstRow.getAttribute('data-class-id');
    const card = dashboard.classes.find((entry) => entry.class_document_id === firstId);
    if (card === undefined) throw new Error('[e2e] the first Classes row is not one of the teacher’s classes');
    setAsideErrors(errors, 'classes-list');
    await firstRow.getByRole('link', { name: card.name }).click();
    await page.waitForURL(`**/dashboard/results/${card.class_document_id}`);
    await expect(frame(page)).toHaveAttribute('data-status', READY, { timeout: 30_000 });
    await expectHeader(page, card, dashboard.classes);
    await expect(sectionTab(page, 'students')).toHaveAttribute('aria-selected', 'true');
    await expect(page.locator('[data-tab-panel="students"]')).toBeVisible();
    await page.screenshot({ path: path.join(PROOFS, 'class-detail-frame.png'), animations: 'disabled' });
    expectNoNewErrors(errors, 'class detail load (Students)', { studentsBody: true });

    // Every tab rewrites ?tab= and shows its own panel; Students (the default) drops the param.
    for (const key of [...TABS.slice(1), TABS[0]]) {
      await sectionTab(page, key).click();
      await expect.poll(() => param(page, 'tab')).toBe(key === 'students' ? null : key);
      await expect(sectionTab(page, key)).toHaveAttribute('aria-selected', 'true');
      const panel = page.locator(`[data-tab-panel="${key}"]`);
      await expect(panel).toHaveAttribute('role', 'tabpanel');
      const body = TAB_BODIES[key];
      if (body !== undefined) await expect(panel.locator(body)).toBeVisible({ timeout: 30_000 });
      if (key === 'students') await expect(panel).toBeVisible();
      expectNoNewErrors(errors, `tab switch to ${key}`, { studentsBody: key === 'students' });
    }

    // The sticky block stays pinned to the top of the scroll column.
    const scroller = page.locator('[data-slot="dashboard-content"]');
    const sticky = page.locator('[data-slot="class-detail-sticky"]');
    if ((await scroller.evaluate((el) => el.scrollHeight - el.clientHeight)) > 200) {
      await scroller.evaluate((el) => el.scrollTo({ top: 400, behavior: 'instant' }));
      await expect.poll(() => scroller.evaluate((el) => el.scrollTop)).toBeGreaterThan(100);
      const top = (await scroller.boundingBox())?.y ?? Number.NaN;
      await expect.poll(async () => Math.abs(((await sticky.boundingBox())?.y ?? Number.NaN) - top)).toBeLessThanOrEqual(2);
      await expect(sectionTabs(page)).toBeInViewport();
      await scroller.evaluate((el) => el.scrollTo({ top: 0, behavior: 'instant' }));
    }

    // A fresh load straight onto Exit predictions: the design's coming-soon panel, inert.
    await page.goto(`/dashboard/results/${card.class_document_id}?tab=exit`);
    await expect(frame(page)).toHaveAttribute('data-status', READY, { timeout: 30_000 });
    const exit = page.locator('[data-tab-panel="exit"] [data-slot="exit-predictions-panel"]');
    await expect(exit.getByRole('heading', { name: label('exit.title'), exact: true })).toBeVisible();
    await expect(exit).toContainText(label('exit.subtitle'));
    await expect(exit.getByRole('heading', { name: label('exit.heading'), exact: true })).toBeVisible();
    await expect(exit).toContainText(label('exit.body'));
    await expect(exit.locator('button, a, input, select')).toHaveCount(0);
    await expectHeader(page, card, dashboard.classes);
    expectNoNewErrors(errors, 'fresh load on Exit predictions');
    await page.screenshot({ path: path.join(PROOFS, 'class-detail-exit.png'), animations: 'disabled' });

    // Listening hides the tab row and shows coming soon; Reading restores the tab.
    await skillTab(page, 'listening').click();
    await expect.poll(() => param(page, 'skill')).toBe('listening');
    await expect(skillTab(page, 'listening')).toHaveAttribute('aria-selected', 'true');
    await expect(sectionTabs(page)).toHaveCount(0);
    const soon = page.locator('[data-slot="coming-soon-panel"]');
    const listening = label('skills.listening');
    await expect(soon.getByRole('heading', { name: label('comingSoonTitle').replace('{skill}', listening) })).toBeVisible();
    await expect(soon).toContainText(label('comingSoonBody').replace('{skill}', listening));
    await expect(soon.locator('[data-slot="skill-status-chip"]')).toHaveCount(4);
    expectNoNewErrors(errors, 'skill switch to Listening');
    await page.screenshot({ path: path.join(PROOFS, 'class-detail-coming-soon.png'), animations: 'disabled' });
    await skillTab(page, 'reading').click();
    await expect.poll(() => param(page, 'skill')).toBeNull();
    await expect(sectionTab(page, 'exit')).toHaveAttribute('aria-selected', 'true');
    expectNoNewErrors(errors, 'skill switch back to Reading');

    // A Monitor link (?tab=live&session=) opens the Live tab with that sitting, and the
    // sitting rides along while the teacher moves between tabs.
    const live = dashboard.live_sessions.find((session) => session.class_name === card.name);
    if (live !== undefined) {
      await page.goto(`/dashboard/results/${card.class_document_id}?tab=live&session=${live.sitting_document_id}`);
      await expect(frame(page)).toHaveAttribute('data-status', READY, { timeout: 30_000 });
      await expect(sectionTab(page, 'live')).toHaveAttribute('aria-selected', 'true');
      await expect(page.locator('[data-tab-panel="live"]')).toHaveAttribute('data-session-id', live.sitting_document_id);
      await expect(page.locator('[data-tab-panel="live"] [data-surface="teacher-test-day"]')).toBeVisible({ timeout: 30_000 });
      expectNoNewErrors(errors, 'Monitor link load on Live sessions');
      await sectionTab(page, 'progress').click();
      await expect.poll(() => param(page, 'tab')).toBe('progress');
      expect(param(page, 'session')).toBe(live.sitting_document_id);
      await expect(page.locator(`[data-tab-panel="progress"] ${TAB_BODIES.progress}`)).toBeVisible();
      expectNoNewErrors(errors, 'Live to Class progress with the sitting');
    }
  });

  test('the class switcher opens another of the teacher’s classes on the same tab', async ({ page }) => {
    test.setTimeout(180_000);
    const errors = watchErrors(page);
    const dashboardPromise = waitForDashboard(page);
    await signInTeacher(page, MULTI_CLASS_TEACHER);
    await page.waitForURL('**/dashboard/results');
    const dashboard = await dashboardPromise;
    test.skip(dashboard.classes.length < 2, `${MULTI_CLASS_TEACHER} owns fewer than two classes`);
    const [from, ...others] = dashboard.classes;
    const to = others.find((entry) => entry.student_count > 0) ?? others[0];
    setAsideErrors(errors, 'classes-list');

    await page.goto(`/dashboard/results/${from.class_document_id}?tab=insights`);
    await expect(frame(page)).toHaveAttribute('data-status', READY, { timeout: 30_000 });
    await expectHeader(page, from, dashboard.classes);
    await expect(page.locator(`[data-tab-panel="insights"] ${TAB_BODIES.insights}`)).toBeVisible();
    expectNoNewErrors(errors, 'load on Teaching insights');
    await page.getByRole('combobox', { name: label('switcherLabel') }).selectOption(to.class_document_id);

    await page.waitForURL(`**/dashboard/results/${to.class_document_id}?tab=insights`);
    await expect(frame(page)).toHaveAttribute('data-class-id', to.class_document_id);
    await expect(frame(page)).toHaveAttribute('data-status', READY, { timeout: 30_000 });
    await expectHeader(page, to, dashboard.classes);
    await expect(sectionTab(page, 'insights')).toHaveAttribute('aria-selected', 'true');
    await expect(page.locator(`[data-tab-panel="insights"] ${TAB_BODIES.insights}`)).toBeVisible();
    expectNoNewErrors(errors, 'class switch on Teaching insights');
  });
});
