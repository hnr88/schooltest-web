import { expect, test, type Page } from '@playwright/test';

import { cat } from './helpers/i18n';
import { sectionTab, sectionTabs } from './helpers/teacher-class-detail';
import {
  DESKTOP,
  MOBILE,
  openReady,
  openStudentReady,
  readA11ySurface,
  signedInTeacherContextPage,
  tabStops,
  type A11ySurface,
} from './helpers/teacher-a11y';
import { MIN_TARGET_PX, undersizedTargets } from './helpers/teacher-a11y-targets';
import { en } from './helpers/teacher-rail';

// TASK 047, the KEYBOARD leg axe cannot see, on the Teacher Portal v2 pages: a
// VISIBLE focus indicator on every stop the browser's own tab order visits, the six
// section tabs operable by Arrow/Home/End, and focus management in the one dialog
// these pages own (the 375px nav Sheet).
//
// TB-30: a teacher's `/dashboard` lands on the Classes list and the retired
// `teacher-dashboard` surface never renders, so the audited set is Classes, the
// class detail and the student page — and the student page's settled read is
// `success`, not `ready` (`openStudentReady`).
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

test('KEYBOARD: every tab stop on every v2 page shows a visible focus indicator', async () => {
  await page.setViewportSize(DESKTOP);
  for (const [label, open] of [
    ['/dashboard/results', () => openReady(page, '/dashboard/results', 'teacher-results')],
    ['class detail', () => openReady(page, classUrl(), 'teacher-class-results')],
    [
      'student page',
      () => openStudentReady(page, surface.classDocumentId, surface.twoTestStudentId),
    ],
  ] as const) {
    await open();
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
  // The class detail carries TWO tab lists — the skill strip and the section row —
  // and Base UI gives each a roving tabindex, so `getByRole('tab').first()` is the
  // skill strip's Reading, not a section tab. The panel follows the SECTION row.
  await sectionTab(page, 'students').focus();
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
  const tabs = sectionTabs(page).getByRole('tab');
  await expect(tabs).toHaveCount(6);
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
  await expect(tabs.nth(5)).toBeFocused();
  await page.keyboard.press('Home');
  await expect(tabs.nth(0)).toBeFocused();
});

test('375px: no undersized target on any v2 page and the nav dialog manages focus', async () => {
  await page.setViewportSize(MOBILE);
  // TB-33 (recorded decision): the floor these pages are held to is the DESIGN plus
  // WCAG 2.2 AA 2.5.8 — 24x24 CSS px, with 2.5.8's own Inline exception. The rule and
  // the reasoning live in `helpers/teacher-a11y-targets.ts`; the old 44px floor
  // (WCAG 2.5.5 AAA) is not silently relaxed, it is superseded there by name.
  for (const [label, open] of [
    ['/dashboard/results', () => openReady(page, '/dashboard/results', 'teacher-results')],
    ['class detail', () => openReady(page, classUrl(), 'teacher-class-results')],
    [
      'student page',
      () => openStudentReady(page, surface.classDocumentId, surface.twoTestStudentId),
    ],
  ] as const) {
    await open();
    const small = await undersizedTargets(page);
    expect(
      small,
      `${label} @ 375px targets under ${MIN_TARGET_PX}px (TB-33):\n${small.join('\n')}`,
    ).toEqual([]);
  }

  await openReady(page, '/dashboard/results', 'teacher-results');
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
