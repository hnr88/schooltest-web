import { AxeBuilder } from '@axe-core/playwright';
import type { Page } from '@playwright/test';

// Task 036 — the KEYBOARD half of the harness. A036-2 traded the wireframe's
// "+ N more" for a `max-h-96` scroller precisely so no sitting is hidden; that
// only holds if the region is reachable and movable WITHOUT a pointer, so these
// helpers measure the real browser (Tab, PageDown, computed focus ring) rather
// than asserting the attributes are present in the markup.

export const SCROLLER = '[data-slot="past-sessions-scroller"]';
const PANEL = '[data-slot="past-sessions"]';
const WCAG_TAGS = ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa'];

const FOCUSABLE =
  'a[href],button:not([disabled]),input:not([disabled]),select,textarea,[tabindex]:not([tabindex="-1"])';

export interface ScrollRegionFacts {
  tabIndex: string | null;
  role: string | null;
  ariaLabel: string | null;
  scrollable: boolean;
  focusableInside: number;
  visibleRows: number;
  totalRows: number;
}

/** What the scroller IS: its a11y attributes and whether its content offers any focus target. */
export async function scrollRegionFacts(
  page: Page,
  selector = SCROLLER,
): Promise<ScrollRegionFacts> {
  return page.evaluate(
    ([sel, focusable]) => {
      const region = document.querySelector(sel);
      if (!(region instanceof HTMLElement)) throw new Error(`[e2e] no scroll region at ${sel}`);
      const rows = Array.from(region.querySelectorAll('[data-slot="past-session-row"]'));
      const box = region.getBoundingClientRect();
      return {
        tabIndex: region.getAttribute('tabindex'),
        role: region.getAttribute('role'),
        ariaLabel: region.getAttribute('aria-label'),
        scrollable: region.scrollHeight > region.clientHeight,
        focusableInside: region.querySelectorAll(focusable).length,
        visibleRows: rows.filter((row) => {
          const rect = row.getBoundingClientRect();
          return rect.top >= box.top && rect.bottom <= box.bottom;
        }).length,
        totalRows: rows.length,
      };
    },
    [selector, FOCUSABLE] as const,
  );
}

export interface KeyboardScrollFacts {
  reachableByTab: boolean;
  tabbedFrom: string | null;
  before: number;
  after: number;
  focusRing: string;
  bottomReached: boolean;
}

const scrollTop = (page: Page): Promise<number> =>
  page.locator(SCROLLER).evaluate((node) => node.scrollTop);

const atBottom = (page: Page): Promise<boolean> =>
  page
    .locator(SCROLLER)
    .evaluate((node) => node.scrollTop + node.clientHeight >= node.scrollHeight - 1);

/**
 * Chromium applies keyboard scrolling off the JS turn that dispatched the key, so a
 * fact read immediately after `press()` can still be the pre-scroll value. This
 * re-reads until the value settles and then returns WHAT IT LAST READ — if the key
 * genuinely moved nothing, the unchanged value is returned and the caller fails.
 */
async function settle<T>(read: () => Promise<T>, done: (value: T) => boolean): Promise<T> {
  let value = await read();
  for (let attempt = 0; attempt < 20 && !done(value); attempt += 1) {
    await new Promise((resolve) => {
      setTimeout(resolve, 50);
    });
    value = await read();
  }
  return value;
}

/**
 * Drives the region the way a keyboard-only teacher does: focus the last focusable
 * element that PRECEDES it in tab order, press Tab once (so the browser's own tab
 * order decides whether the region is reachable), then page down through it.
 */
export async function keyboardScrollFacts(page: Page): Promise<KeyboardScrollFacts> {
  const tabbedFrom = await page.evaluate(
    ([sel, focusable]) => {
      const region = document.querySelector(sel);
      if (!(region instanceof HTMLElement)) throw new Error(`[e2e] no scroll region at ${sel}`);
      region.scrollTop = 0;
      const preceding = Array.from(document.querySelectorAll(focusable)).filter(
        (node) =>
          node !== region &&
          node.getClientRects().length > 0 &&
          (region.compareDocumentPosition(node) & Node.DOCUMENT_POSITION_PRECEDING) !== 0,
      );
      const last = preceding.at(-1);
      if (!(last instanceof HTMLElement)) return null;
      last.focus();
      return last.getAttribute('data-slot') ?? last.tagName.toLowerCase();
    },
    [SCROLLER, FOCUSABLE] as const,
  );

  await page.keyboard.press('Tab');
  const focused = await page.evaluate(
    (sel) => ({
      isRegion: document.activeElement === document.querySelector(sel),
      ring: document.activeElement
        ? getComputedStyle(document.activeElement).boxShadow
        : 'no-active-element',
    }),
    SCROLLER,
  );

  const before = await scrollTop(page);
  await page.keyboard.press('PageDown');
  const after = await settle(
    () => scrollTop(page),
    (top) => top > before,
  );
  // End must reach the LAST row: A036-2's promise is that no sitting is hidden.
  await page.keyboard.press('End');
  const bottomReached = await settle(
    () => atBottom(page),
    (reached) => reached,
  );

  return {
    reachableByTab: focused.isRegion,
    tabbedFrom,
    before,
    after,
    focusRing: focused.ring,
    bottomReached,
  };
}

export interface AxeViolation {
  id: string;
  impact: string | null;
  nodes: number;
  targets: string[];
}

/** axe-core over the panel only, at the WCAG levels this mission pins. */
export async function panelAxeViolations(page: Page): Promise<AxeViolation[]> {
  const results = await new AxeBuilder({ page }).include(PANEL).withTags(WCAG_TAGS).analyze();
  return results.violations.map((violation) => ({
    id: violation.id,
    impact: violation.impact ?? null,
    nodes: violation.nodes.length,
    targets: violation.nodes.map((node) => node.target.join(' ')),
  }));
}
