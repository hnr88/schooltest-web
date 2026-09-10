/**
 * teacher/04 — the kit's sticky-scroll recipe (U-17, D-71), lifted VERBATIM
 * from `teacher/constants/past-sessions.constants.ts` (whose rationale below
 * moved with it, so the next reader finds it beside the recipe it explains).
 * `PAST_SESSIONS_SCROLL_CLASS` is now a re-export of this constant — one
 * recipe, two names, zero divergence.
 *
 * The history is unbounded (this instance already holds 158 real sittings), so
 * the panel scrolls instead of truncating: every row the server sent stays
 * reachable, and no "+N more" device hides a session a teacher may need.
 *
 * A scroll region whose CONTENT is not focusable must be focusable ITSELF, or a
 * keyboard user cannot reach the overflow at all (axe:
 * scrollable-region-focusable, WCAG 2.1.1 / 2.1.3). The table rows hold no
 * interactive element, so the panel gives this div `role="group"`,
 * `tabIndex={0}` and an `aria-label`, and the ring below makes that focus
 * visible (WCAG 2.4.7).
 *
 * BOTH AXES SCROLL ON THIS ONE ELEMENT, DELIBERATELY. The `Table` primitive wraps
 * its `<table>` in its own `<div data-slot="table-container">` carrying
 * `overflow-x-auto`, and `min-w-2xl` on the table makes that inner div overflow at
 * every width below ~1280. That produced a SECOND scroll region — one that scrolls X,
 * holds no focusable descendant and cannot take focus itself, nested inside this one,
 * which scrolls only Y. Measured at 1024x800: the `Completed` cell's right edge sat at
 * x=1031 inside a container ending at x=937, and ArrowRight/End/Tab all left its
 * `scrollLeft` at 0 — the column was unreachable by keyboard and axe reported
 * `scrollable-region-focusable` (serious) at both 1024 and 375.
 *
 * `src/components/ui/*` is read-only (CLAUDE.md law 11), so the inner container's
 * overflow is neutralised from here with the repo's established data-slot descendant
 * variant (22 existing call sites) and both axes are taken over by this focusable
 * region — `scroll-region` + `scroll-region-x`, globals.css's own recipe for exactly
 * this (min-size 0, contained overscroll, stable gutter, and a thin tokenised bar
 * wherever the platform draws classic scrollbars rather than overlay ones), used the
 * same way as `showcase/scroll-affordance-demo` and `search-shared/SearchResultsPanel`. One
 * focusable region scrolling both axes, instead of two with the inner one a keyboard
 * dead end. It is also what makes the header's `sticky top-0` real: sticky pins to the
 * nearest scrollport, which is now this region rather than the primitive's wrapper.
 */
export const DIRECTORY_STICKY_SCROLL_CLASS =
  'scroll-region scroll-region-x max-h-96 rounded-lg border border-border [&_[data-slot=table-container]]:overflow-x-visible focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none';

/**
 * The A3 variant for NON-sticky table bodies (§L-a11y): the same one-focusable-
 * region shape without the panel's `max-h-96` height — the outer div still
 * takes the focus ring and neutralises the primitive's inner X-scroller, so
 * every `layout:'table'` body, not only sticky ones, is one focusable scroll
 * region over both axes.
 */
export const DIRECTORY_TABLE_SCROLL_CLASS =
  'scroll-region scroll-region-x rounded-xl border border-border bg-card [&_[data-slot=table-container]]:overflow-x-visible focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none';
