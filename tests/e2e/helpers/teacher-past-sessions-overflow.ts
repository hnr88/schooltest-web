import type { Page } from '@playwright/test';

import { SCROLLER, settle, tabIntoRegion } from './teacher-past-sessions-a11y';

// Task 036, second pass — the HORIZONTAL half of the harness. `min-w-2xl` keeps the
// four columns legible, so below ~1280px the history overflows sideways. That is only
// acceptable if the ONE focusable region owns that axis: the `Table` primitive's own
// `overflow-x-auto` wrapper must not be a second, unreachable scroll container, and the
// clipped `Completed` column must come into view by key press alone (WCAG 2.1.1).

const INNER = `${SCROLLER} [data-slot="table-container"]`;
const LAST_CELL = `${SCROLLER} [data-slot="past-session-row"]:first-child td:last-child`;
const HEADER = `${SCROLLER} [data-slot="table-header"]`;
/** 40px per Chromium arrow press; 30 covers the 379px clipped at 375px wide. */
const MAX_ARROW_PRESSES = 30;

export interface OverflowFacts {
  innerOverflowX: string;
  innerScrollsX: boolean;
  regionHiddenPx: number;
  pageHiddenPx: number;
  lastCellRight: number;
  regionRight: number;
  lastColumnClipped: boolean;
}

/** Where the sideways overflow lives, and whether the clipped column starts off-screen. */
export async function overflowFacts(page: Page): Promise<OverflowFacts> {
  return page.evaluate(
    ([regionSel, innerSel, cellSel]) => {
      const region = document.querySelector(regionSel);
      const inner = document.querySelector(innerSel);
      const cell = document.querySelector(cellSel);
      if (!(region instanceof HTMLElement)) throw new Error(`[e2e] no region at ${regionSel}`);
      if (!(inner instanceof HTMLElement)) throw new Error(`[e2e] no container at ${innerSel}`);
      if (!(cell instanceof HTMLElement)) throw new Error(`[e2e] no last cell at ${cellSel}`);
      region.scrollLeft = 0;
      // A box whose overflow is `visible` reports scrollWidth but CANNOT be scrolled,
      // so the honest probe is to try: assign, read back, restore.
      inner.scrollLeft = 999;
      const innerScrollsX = inner.scrollLeft > 0;
      inner.scrollLeft = 0;
      const regionRight = region.getBoundingClientRect().right;
      const lastCellRight = cell.getBoundingClientRect().right;
      const root = document.documentElement;
      return {
        innerOverflowX: getComputedStyle(inner).overflowX,
        innerScrollsX,
        regionHiddenPx: region.scrollWidth - region.clientWidth,
        pageHiddenPx: root.scrollWidth - root.clientWidth,
        lastCellRight,
        regionRight,
        lastColumnClipped: lastCellRight > regionRight,
      };
    },
    [SCROLLER, INNER, LAST_CELL] as const,
  );
}

export interface HorizontalKeyboardFacts {
  focusedIsRegion: boolean;
  tabbedFrom: string | null;
  presses: number;
  scrollLeftBefore: number;
  scrollLeftAfter: number;
  lastCellRightAfter: number;
  regionRight: number;
  lastColumnReached: boolean;
}

/**
 * Tab into the region, then press ArrowRight until the clipped column is inside the
 * region's box. Chromium ANIMATES keyboard scrolling, so each press is followed by a
 * settle that waits for `scrollLeft` to actually move — reading straight after
 * `press()` returns the pre-scroll offset (measured: `sl=0` four presses in a row).
 * The settle returns what it LAST read, so a key that genuinely moves nothing yields
 * an unchanged `scrollLeftAfter` and `lastColumnReached: false` rather than a pass.
 */
export async function horizontalKeyboardFacts(page: Page): Promise<HorizontalKeyboardFacts> {
  const focused = await tabIntoRegion(page);
  const read = () =>
    page.evaluate(
      ([regionSel, cellSel]) => {
        const region = document.querySelector(regionSel);
        const cell = document.querySelector(cellSel);
        if (!(region instanceof HTMLElement)) throw new Error(`[e2e] no region at ${regionSel}`);
        if (!(cell instanceof HTMLElement)) throw new Error(`[e2e] no last cell at ${cellSel}`);
        const regionRight = region.getBoundingClientRect().right;
        const cellRight = cell.getBoundingClientRect().right;
        return { scrollLeft: region.scrollLeft, cellRight, regionRight };
      },
      [SCROLLER, LAST_CELL] as const,
    );

  const start = await read();
  let latest = start;
  let presses = 0;
  while (presses < MAX_ARROW_PRESSES && latest.cellRight > latest.regionRight) {
    const from = latest.scrollLeft;
    await page.keyboard.press('ArrowRight');
    presses += 1;
    latest = await settle(read, (value) => value.scrollLeft > from);
  }

  return {
    focusedIsRegion: focused.focusedIsRegion,
    tabbedFrom: focused.tabbedFrom,
    presses,
    scrollLeftBefore: start.scrollLeft,
    scrollLeftAfter: latest.scrollLeft,
    lastCellRightAfter: latest.cellRight,
    regionRight: latest.regionRight,
    lastColumnReached: latest.cellRight <= latest.regionRight,
  };
}

export interface StickyHeaderFacts {
  offsetAtTop: number;
  offsetAfterScroll: number;
  scrolledBy: number;
  stayedPinned: boolean;
}

/** `sticky top-0` on the header only works if THIS region is the scrollport. */
export async function stickyHeaderFacts(page: Page, scrollBy = 300): Promise<StickyHeaderFacts> {
  return page.evaluate(
    ([regionSel, headerSel, distance]) => {
      const region = document.querySelector(regionSel);
      const header = document.querySelector(headerSel);
      if (!(region instanceof HTMLElement)) throw new Error(`[e2e] no region at ${regionSel}`);
      if (!(header instanceof HTMLElement)) throw new Error(`[e2e] no header at ${headerSel}`);
      const offset = () => header.getBoundingClientRect().top - region.getBoundingClientRect().top;
      region.scrollTop = 0;
      const offsetAtTop = offset();
      region.scrollTop = distance;
      const scrolledBy = region.scrollTop;
      const offsetAfterScroll = offset();
      region.scrollTop = 0;
      return {
        offsetAtTop,
        offsetAfterScroll,
        scrolledBy,
        stayedPinned: Math.abs(offsetAfterScroll - offsetAtTop) <= 1,
      };
    },
    [SCROLLER, HEADER, scrollBy] as const,
  );
}
