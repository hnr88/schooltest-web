import path from 'node:path';

import { expect, test, type Page } from '@playwright/test';

import { cat } from './helpers/i18n';
import { en, SCREENSHOTS } from './helpers/teacher-rail';
import {
  openFirstClass,
  openResultsList,
  readLiveResults,
  signedInTeacherPage,
  type LiveResults,
} from './helpers/teacher-results-live';

// Task 040 — the four tabs of .qa/DESIGN.md §Results (Students · Teaching insights
// · Progress · Exit predictions) on the repo tab primitive, proven against the
// RUNNING app. The ARIA roles, the aria-controls ↔ aria-labelledby pair and the
// keyboard model are the primitive's; this spec proves they actually reach the DOM.

// ONE sign-in and ONE class-detail page for the whole file; each test re-selects
// the tab it needs, so no test depends on another's selection.
test.describe.configure({ mode: 'serial' });

let live: LiveResults;
let page: Page;

test.beforeAll(async ({ browser, playwright }) => {
  live = await readLiveResults(playwright);
  page = await signedInTeacherPage(browser);
  await openResultsList(page);
  await openFirstClass(page, live);
});

test.afterAll(async () => {
  await page.close();
});

const tabLabel = (key: string) => cat(en, `Teacher.results.tabs.${key}`);

test.describe('the four tabs', () => {
  test('are a real tablist in wireframe order, each >= 44px', async () => {
    await expect(page.getByRole('tablist', { name: tabLabel('listLabel') })).toBeVisible();
    const tabs = page.getByRole('tab');
    await expect(tabs).toHaveCount(4);
    await expect(tabs).toHaveText([
      tabLabel('students'),
      tabLabel('insights'),
      tabLabel('progress'),
      new RegExp(`${tabLabel('exit')}\\s*${tabLabel('comingSoon')}`),
    ]);

    for (let index = 0; index < 4; index += 1) {
      const box = await tabs.nth(index).boundingBox();
      expect(box?.height ?? 0).toBeGreaterThanOrEqual(44);
    }
    await expect(tabs.nth(0)).toHaveAttribute('aria-selected', 'true');
  });

  test('are keyboard-operable: arrows move focus, Enter/Space activates', async () => {
    const tabs = page.getByRole('tab');

    // Roving tabindex + MANUAL activation — the ARIA APG pattern Base UI ships by
    // default (`activateOnFocus` defaults to false, TabsList.d.ts): Arrow/Home/End
    // move focus, Enter or Space activates. Manual is the right pattern here
    // because an inactive Tabs.Panel is unmounted, so automatic activation would
    // mount a sibling tab's panel — and fire its query — on every arrow press.
    await tabs.nth(0).focus();
    await page.keyboard.press('ArrowRight');
    await expect(tabs.nth(1)).toBeFocused();
    await expect(tabs.nth(1)).toHaveAttribute('tabindex', '0');
    await expect(tabs.nth(0)).toHaveAttribute('tabindex', '-1');
    await expect(tabs.nth(0)).toHaveAttribute('aria-selected', 'true');
    await page.keyboard.press('Enter');
    await expect(tabs.nth(1)).toHaveAttribute('aria-selected', 'true');
    await expect(tabs.nth(0)).toHaveAttribute('aria-selected', 'false');

    await page.keyboard.press('End');
    await expect(tabs.nth(3)).toBeFocused();
    await page.keyboard.press(' ');
    await expect(tabs.nth(3)).toHaveAttribute('aria-selected', 'true');

    await page.keyboard.press('Home');
    await expect(tabs.nth(0)).toBeFocused();
    await page.keyboard.press('Enter');
    await expect(tabs.nth(0)).toHaveAttribute('aria-selected', 'true');
  });

  test('every tab points at a panel and that panel points back', async () => {
    const tabs = page.getByRole('tab');

    for (let index = 0; index < 4; index += 1) {
      await tabs.nth(index).click();
      const tabId = await tabs.nth(index).getAttribute('id');
      const controls = await tabs.nth(index).getAttribute('aria-controls');
      expect(tabId, 'tab needs an id for aria-labelledby').toBeTruthy();
      expect(controls, 'tab needs aria-controls').toBeTruthy();
      const panel = page.locator(`#${controls}`);
      await expect(panel).toHaveAttribute('role', 'tabpanel');
      await expect(panel).toHaveAttribute('aria-labelledby', tabId ?? '');
      await expect(panel).toBeVisible();
    }
  });

  test('Exit predictions carries the Coming soon badge and NOTHING actionable', async () => {
    await page.getByRole('tab', { name: new RegExp(tabLabel('exit')) }).click();

    const panel = page.locator('[data-slot="exit-predictions-panel"]');
    await expect(panel).toBeVisible();
    await expect(
      panel.getByRole('heading', {
        level: 2,
        name: cat(en, 'Teacher.results.exitPredictions.title'),
      }),
    ).toBeVisible();
    await expect(panel).toContainText(cat(en, 'Teacher.results.exitPredictions.badge'));
    await expect(panel).toContainText(cat(en, 'Teacher.results.exitPredictions.description'));

    // No actionable content, and no fabricated prediction: nothing focusable and
    // no digit anywhere in the panel.
    await expect(
      panel.locator('a, button, input, select, textarea, [role="button"], [tabindex]'),
    ).toHaveCount(0);
    await expect(panel).not.toContainText(/\d/);

    await page.screenshot({
      path: path.join(SCREENSHOTS, 'task-040-exit-predictions-coming-soon.png'),
      animations: 'disabled',
      fullPage: true,
    });
  });

  // Task 041 filled the Students tab (see teacher-results-students.spec.ts) and
  // task 044 the Teaching insights tab, so Progress is the only panel still
  // waiting for its tool. Each filled tab is proven by its OWN spec.
  test('an unfilled tab states the tool is absent, never that the class is empty', async () => {
    const tabs = page.getByRole('tab');

    for (const [index, slot] of [[2, 'progress']] as const) {
      await tabs.nth(index).click();
      const pending = page.locator(`[data-slot="results-tab-pending"][data-tab="${slot}"]`);
      await expect(pending).toBeVisible();
      await expect(pending).toContainText(cat(en, `Teacher.results.pending.${slot}Title`));
      // It issues no query, so it must make NO claim about this class's data.
      await expect(pending).not.toContainText(/\d/);
    }
  });
});
