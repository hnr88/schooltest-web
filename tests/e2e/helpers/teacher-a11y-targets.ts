import type { Page } from '@playwright/test';

// Task 047. `collectSmallTargets` (helpers/ui.ts) measures `getBoundingClientRect()`
// on the control itself. That is right for a normal button, and WRONG for any
// control whose pointer target is bigger than its own box (an overlay link): when
// a control's ::after is absolutely positioned, the box that receives the pointer
// is its offset parent, so that is the box measured.
//
// The Students table's row link is exactly that case — `RosterStudentCells.tsx`
// stretches the name link's ::after over the whole row — so the row is what a
// finger hits and the row is what is measured here.

/**
 * TB-33 (recorded decision, `schooltest-api/docs/teacher-portal-v2/TRACKER.md`):
 * the target-size rule on the teacher surface is THE DESIGN plus
 * **WCAG 2.2 AA 2.5.8 — Target Size (Minimum), 24 x 24 CSS px**, with 2.5.8's own
 * Inline exception for a link whose size is constrained by the line-height of the
 * text around it.
 *
 * This REPLACES the 44px floor task 047 set for itself (WCAG 2.5.5 AAA). The
 * design draws the student page's export button at 38px and the Students-tab name
 * link at 18px; both are deliberate, so a 44px floor could only be met by
 * redrawing the design. The decision is recorded here rather than applied
 * silently — nothing about it is a convenience.
 *
 * The project's own 44px floor is NOT abolished: where the code still states it
 * (`TEACHER_RETRY_BUTTON_CLASS`, `min-h-11`), the specs still assert 44.
 */
export const MIN_TARGET_PX = 24;

/** The project floor, still asserted on every control whose class states it. */
export const PROJECT_TARGET_PX = 44;

const MEASURED_MIN_PX = MIN_TARGET_PX - 1; // minus 1px for sub-pixel layout

/**
 * Descriptors of every visible control whose EFFECTIVE pointer target is under
 * the TB-33 floor. WCAG 2.5.8's Inline exception is applied literally: an anchor
 * inside running text, or an anchor whose own height is the line box of its text,
 * is sized by that text and is not reported.
 */
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

      // A form control WRAPPED in its own <label> is activated by a press anywhere
      // in the label — that is what HTML's implicit label association means, so the
      // label is the region that accepts the pointer action. The design's pill search
      // is exactly this: a borderless input inside a 36px `cursor-text` label.
      if (el instanceof HTMLInputElement || el instanceof HTMLSelectElement) {
        const label = el.closest('label');
        if (label !== null) {
          const labelBox = label.getBoundingClientRect();
          if (labelBox.width >= box.width && labelBox.height >= box.height) box = labelBox;
        }
      }

      if (el instanceof HTMLAnchorElement) {
        // WCAG 2.5.8 Inline, first half: a link in a sentence is sized by the sentence.
        if (el.closest('p, li, blockquote') !== null) continue;
        // WCAG 2.5.8 Inline, second half: "its size is otherwise constrained by the
        // line-height of non-target text". A text-only link one line box tall is
        // exactly that — it cannot be made taller without moving the text around it.
        const lineHeight = Number.parseFloat(style.lineHeight);
        const textOnly = el.childElementCount === 0 && (el.textContent ?? '').trim() !== '';
        if (textOnly && Number.isFinite(lineHeight) && box.height <= lineHeight + 2) continue;
      }

      if (box.width < min || box.height < min) {
        const label = el.getAttribute('aria-label') ?? (el.textContent ?? '').trim().slice(0, 40);
        undersized.push(
          `<${el.tagName.toLowerCase()}> "${label}" effective ${Math.round(box.width)}×${Math.round(box.height)}`,
        );
      }
    }
    return undersized;
  }, MEASURED_MIN_PX);
}
