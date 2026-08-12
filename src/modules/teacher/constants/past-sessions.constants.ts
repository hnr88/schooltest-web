import type { StatusPillTone } from '@/modules/design-system';
import type { SittingStatus } from '@/modules/teacher/types/teacher-session.types';

// C-TS-2 returns active AND past sittings in one list, so a row is tagged with
// the sitting's OWN `status` word. Nothing is derived here: no date is compared
// to `now` to guess whether a session is still running, and a closed row is
// never inferred from a non-null `closed_at`.
export const PAST_SESSION_STATUS_TONE: Record<SittingStatus, StatusPillTone> = {
  open: 'success',
  closed: 'neutral',
};

// WCAG 2.2 AA 1.4.1: the tone above is never the only carrier — every row prints
// its status word from these keys under `Teacher.testSessions.pastSessions`.
export const PAST_SESSION_STATUS_LABEL_KEY: Record<SittingStatus, string> = {
  open: 'statusLive',
  closed: 'statusClosed',
};

/** 56px rows so the completion track and the status pill clear the row's ink. */
export const PAST_SESSIONS_ROW_CLASS = 'h-14 border-border';

/**
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
export const PAST_SESSIONS_SCROLL_CLASS =
  'scroll-region scroll-region-x max-h-96 rounded-lg border border-border [&_[data-slot=table-container]]:overflow-x-visible focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none';
