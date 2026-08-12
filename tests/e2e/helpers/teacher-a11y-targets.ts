import type { Page } from '@playwright/test';

// Task 047. `collectSmallTargets` (helpers/ui.ts) measures `getBoundingClientRect()`
// on the control itself. That is right for a normal button, and WRONG for the
// row-overlay pattern the Students table uses: `StudentResultsRow` renders ONE real
// <Link> whose `after:absolute after:inset-0` stretches the pointer target across the
// whole table row, so the anchor's own box is just the text run ("Fatema R." = 63×17)
// while the target a finger actually hits is the row (848×56 at 1280px).
//
// This collector measures the EFFECTIVE target instead of relaxing the floor:
// when a control's ::after is absolutely positioned, the box that receives the
// pointer is its offset parent, so that is the box measured. Nothing is excluded and
// no rule is loosened — teacher-a11y-semantics.spec.ts independently hit-tests the
// row's corners with `elementFromPoint` to prove the overlay really does answer.

const MIN_TARGET_PX = 43; // 44px floor minus 1px for sub-pixel layout

/** Descriptors of every visible control whose EFFECTIVE pointer target is under 44×44. */
export async function undersizedTargets(page: Page): Promise<string[]> {
  return page.evaluate((min) => {
    const undersized: string[] = [];
    const selector = 'button, [role="button"], select, input, a[href]';
    for (const el of document.querySelectorAll(selector)) {
      // Dev-server-only chrome: the TanStack Query devtools trigger ships in no build.
      if (el.closest('.tsqd-parent-container') !== null) continue;
      const style = getComputedStyle(el);
      if (style.visibility === 'hidden' || style.display === 'none') continue;

      let box = el.getBoundingClientRect();
      if (box.width <= 1 && box.height <= 1) continue; // sr-only clip / display:none

      const after = getComputedStyle(el, '::after');
      const stretched = after.content !== 'none' && after.position === 'absolute';
      // `offsetParent` is an HTMLElement API — an SVGAElement matched by `a[href]`
      // has none, and is measured by its own box.
      const host = el instanceof HTMLElement ? el.offsetParent : null;
      if (stretched && host instanceof HTMLElement && host.contains(el)) {
        box = host.getBoundingClientRect();
      }

      // WCAG 2.5.8's inline exception: a link inside a sentence is sized by its text.
      if (el instanceof HTMLAnchorElement && el.closest('p, li, blockquote') !== null) continue;

      if (box.width < min || box.height < min) {
        const label = el.getAttribute('aria-label') ?? (el.textContent ?? '').trim().slice(0, 40);
        undersized.push(
          `<${el.tagName.toLowerCase()}> "${label}" effective ${Math.round(box.width)}×${Math.round(box.height)}`,
        );
      }
    }
    return undersized;
  }, MIN_TARGET_PX);
}
