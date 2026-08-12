import { expect, test, type Page } from '@playwright/test';

import { cat } from './helpers/i18n';
import {
  DESKTOP,
  MOBILE,
  openReady,
  readA11ySurface,
  signedInTeacherContextPage,
  tabStops,
  type A11ySurface,
} from './helpers/teacher-a11y';
import { undersizedTargets } from './helpers/teacher-a11y-targets';
import { en } from './helpers/teacher-rail';

// TASK 047, the KEYBOARD leg axe cannot see: a VISIBLE focus indicator on every stop
// the browser's own tab order visits, the four tabs operable by Arrow/Home/End, and
// focus management in the one dialog these pages own (the 375px nav Sheet).
// /dashboard/test-sessions and the live monitor are DEFERRED (task 053 owns them).
test.describe.configure({ mode: 'serial' });

let page: Page;
let surface: A11ySurface;

test.beforeAll(async ({ browser, playwright }) => {
  surface = await readA11ySurface(playwright);
  page = await signedInTeacherContextPage(browser);
});

test.afterAll(async () => {
  await page.context().close();
});

const classUrl = (): string => `/dashboard/results/${surface.classDocumentId}`;

test('KEYBOARD: every tab stop on both pages shows a visible focus indicator', async () => {
  await page.setViewportSize(DESKTOP);
  for (const [label, url, slot] of [
    ['/dashboard', '/dashboard', 'teacher-dashboard'],
    ['/dashboard/results', '/dashboard/results', 'teacher-results'],
    ['class detail', classUrl(), 'teacher-class-results'],
  ] as const) {
    await openReady(page, url, slot);
    const stops = await tabStops(page, 16);
    // `isDevChrome` drops the dev-server-only stops (TanStack devtools trigger, the
    // Next.js dev overlay element, and BODY once the order wraps) — none ship.
    const ringless = stops.filter((stop) => !stop.isDevChrome && !stop.hasRing);
    expect(
      ringless.map((stop) => `${stop.tag} "${stop.name}" ${stop.width}×${stop.height}`),
      `${label}: tab stops with no visible focus indicator`,
    ).toEqual([]);
    expect(
      stops.filter((stop) => !stop.isDevChrome).length,
      `${label}: nothing was keyboard reachable`,
    ).toBeGreaterThan(4);
  }
});

test('KEYBOARD: the tab panel Base UI makes focusable now carries a ring too', async () => {
  await page.setViewportSize(DESKTOP);
  await openReady(page, classUrl(), 'teacher-class-results');
  const panel = page.locator('[data-slot="tabs-content"]:visible');
  await page.getByRole('tab').first().focus();
  await page.keyboard.press('Tab');
  await expect(panel).toBeFocused();
  const indicator = await panel.evaluate((el) => {
    const style = getComputedStyle(el);
    return { outline: `${style.outlineWidth} ${style.outlineStyle}`, boxShadow: style.boxShadow };
  });
  expect(
    indicator.boxShadow !== 'none' || !indicator.outline.startsWith('0px'),
    `the focused tab panel had no indicator: ${JSON.stringify(indicator)}`,
  ).toBe(true);
});

test('KEYBOARD: Arrow/Home/End move between tabs and Enter activates the focused one', async () => {
  await page.setViewportSize(DESKTOP);
  await openReady(page, classUrl(), 'teacher-class-results');
  const tabs = page.getByRole('tab');
  await expect(tabs).toHaveCount(4);
  await tabs.first().focus();
  await expect(tabs.nth(0)).toHaveAttribute('aria-selected', 'true');

  // Base UI's Tabs use MANUAL activation: an arrow key moves focus and leaves the
  // selection where it was, so a keyboard teacher can read the tab names without the
  // panel changing under them. Measured, not assumed — aria-selected stays "false" on
  // the newly focused tab until Enter, and that is the accessible behaviour to lock.
  await page.keyboard.press('ArrowRight');
  await expect(tabs.nth(1)).toBeFocused();
  await expect(tabs.nth(1)).toHaveAttribute('aria-selected', 'false');
  await page.keyboard.press('Enter');
  await expect(tabs.nth(1)).toHaveAttribute('aria-selected', 'true');
  await expect(tabs.nth(0)).toHaveAttribute('aria-selected', 'false');

  await page.keyboard.press('End');
  await expect(tabs.nth(3)).toBeFocused();
  await page.keyboard.press('Home');
  await expect(tabs.nth(0)).toBeFocused();
});

test('375px: no undersized target on either page and the nav dialog manages focus', async () => {
  await page.setViewportSize(MOBILE);
  for (const [url, slot] of [
    ['/dashboard', 'teacher-dashboard'],
    ['/dashboard/results', 'teacher-results'],
    [classUrl(), 'teacher-class-results'],
    [`${classUrl()}/students/${surface.twoTestStudentId}`, 'teacher-student-drill-down'],
  ] as const) {
    await openReady(page, url, slot);
    const small = await undersizedTargets(page);
    expect(small, `${url} @ 375px undersized targets:\n${small.join('\n')}`).toEqual([]);
  }

  await openReady(page, '/dashboard', 'teacher-dashboard');
  const trigger = page.getByRole('button', {
    name: cat(en, 'Shell.topbar.toggleNav'),
    exact: true,
  });
  await trigger.click();
  const dialog = page.getByRole('dialog');
  await expect(dialog).toBeVisible();
  // Focus must land INSIDE the dialog, not stay behind on the trigger…
  await expect
    .poll(async () => dialog.evaluate((el) => el.contains(document.activeElement)), {
      timeout: 5000,
    })
    .toBe(true);
  // …and Escape must close it AND hand focus back to what opened it.
  await page.keyboard.press('Escape');
  await expect(dialog).toBeHidden();
  await expect(trigger).toBeFocused();
});
