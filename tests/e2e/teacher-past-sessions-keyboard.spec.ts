import path from 'node:path';

import { expect, test, type Page } from '@playwright/test';

import { cat } from './helpers/i18n';
import {
  keyboardScrollFacts,
  panelAxeViolations,
  scrollRegionFacts,
} from './helpers/teacher-past-sessions-a11y';
import {
  horizontalKeyboardFacts,
  overflowFacts,
  stickyHeaderFacts,
} from './helpers/teacher-past-sessions-overflow';
import {
  openTestSessions,
  PAST_SESSIONS_NS as NS,
  pastSessionsPanel,
} from './helpers/teacher-past-sessions';
import { en, SCREENSHOTS, signIn } from './helpers/teacher-rail';

// Task 036 — the keyboard/a11y lock for the "Past sessions" history, against the
// RUNNING app on :3000 and the REAL Strapi. A036-2 renders every sitting inside a
// `max-h-96` region instead of the wireframe's "+ N more", and `min-w-2xl` keeps the
// four columns legible, so the panel overflows on BOTH axes below ~1280px. These
// tests run at the widths that actually overflow — 1280 hides nothing, which is how
// the first pass measured `violations === []` while the Completed column was
// pointer-only at 1024 and 375.

test.describe.configure({ mode: 'serial' });

/** Widths a real teacher uses, all narrower than the table's 42rem minimum. */
const NARROW = [
  { width: 1024, height: 800 },
  { width: 375, height: 800 },
] as const;

let page: Page;

test.beforeAll(async ({ browser }) => {
  test.setTimeout(180_000);
  // A context, not browser.newPage(): axe-core injects through the context.
  page = await (await browser.newContext({ viewport: { width: 1280, height: 900 } })).newPage();
  await signIn(page, 'teacher');
  await openTestSessions(page);
});

test.afterAll(async () => {
  await page.context().close();
});

test.describe('Past sessions history — keyboard operability (C-TS-2)', () => {
  test('the history scroller is keyboard-operable and the panel is axe-clean', async () => {
    // Only ~7 rows fit the 384px region, so the rest reach a keyboard user ONLY if
    // the region itself takes focus — its rows hold no interactive element.
    const facts = await scrollRegionFacts(page);
    expect(facts.tabIndex).toBe('0');
    expect(facts.role).toBe('group');
    expect(facts.ariaLabel).toBe(cat(en, `${NS}.scrollRegionLabel`));
    expect(facts.scrollable, 'the region must actually overflow for this to matter').toBe(true);
    expect(facts.totalRows).toBeGreaterThan(facts.visibleRows);
    const keys = await keyboardScrollFacts(page);
    expect(keys.reachableByTab, `Tab from ${keys.tabbedFrom} must land on the region`).toBe(true);
    expect(keys.after, 'PageDown must move the region').toBeGreaterThan(keys.before);
    expect(keys.bottomReached, 'End must reach the last sitting').toBe(true);
    expect(keys.focusRing, 'the focused region must show a visible ring').not.toBe('none');
    expect(await panelAxeViolations(page)).toEqual([]);
    await pastSessionsPanel(page).screenshot({ path: path.join(SCREENSHOTS, 'task-036-kbd.png') });
  });

  test('the sticky header stays pinned to the region it scrolls inside', async () => {
    const sticky = await stickyHeaderFacts(page);
    expect(sticky.scrolledBy, 'the region must have scrolled for this to mean anything').toBe(300);
    expect(sticky.stayedPinned, `header offset ${sticky.offsetAfterScroll}px after scrolling`).toBe(
      true,
    );
  });

  for (const viewport of NARROW) {
    test(`the clipped Completed column is keyboard-reachable at ${viewport.width}px`, async () => {
      await page.setViewportSize({ ...viewport });
      await openTestSessions(page);

      const before = await overflowFacts(page);
      // The premise: at this width the table IS wider than the panel…
      expect(
        before.regionHiddenPx,
        'nothing is clipped, so this width proves nothing',
      ).toBeGreaterThan(0);
      expect(before.lastColumnClipped).toBe(true);
      // …the overflow belongs to the ONE focusable region, not to the primitive's
      // wrapper (which can report scrollWidth yet refuse to scroll)…
      expect(before.innerOverflowX).toBe('visible');
      expect(before.innerScrollsX, 'the inner container must not be a second scroller').toBe(false);
      // …and the PAGE still never scrolls sideways.
      expect(before.pageHiddenPx).toBe(0);

      const keys = await horizontalKeyboardFacts(page);
      expect(keys.focusedIsRegion, `Tab from ${keys.tabbedFrom} must land on the region`).toBe(
        true,
      );
      expect(keys.scrollLeftAfter, 'ArrowRight must move the region on X').toBeGreaterThan(
        keys.scrollLeftBefore,
      );
      expect(
        keys.lastColumnReached,
        `Completed still ends at x=${keys.lastCellRightAfter} outside x=${keys.regionRight} after ${keys.presses} presses`,
      ).toBe(true);

      expect(await panelAxeViolations(page)).toEqual([]);
      await pastSessionsPanel(page).screenshot({
        path: path.join(SCREENSHOTS, `task-036-narrow-${viewport.width}.png`),
      });
    });
  }
});
