---
id: 332
title: No-broken-UI audit — zero horizontal scroll, overflow, clipping, FOUC or console errors at 375 and 1280
layer: ui
kind: verify
slice: Mission-wide rendering-integrity gate across every route at both widths
target: tests/e2e/no-broken-ui-audit.spec.ts (new); layout fixes at the module call sites; src/app/globals.css
contract: n/a
design: .qa/design/spec/04-ds-foundations.md#unknowns (breakpoint behaviour undefined), .qa/design/spec/05-ds-components.md#responsive-inventory, .qa/design/spec/01-portal-dashboard.md#9-responsive-hints
status: TODO
depends_on: ["320", "321", "322", "323", "324", "325", "326"]
---

## Objective

Prove that no route in the parent portal is visually broken at 375px or 1280px: no horizontal
page scroll, no element overflowing its container, no clipped text or control, no
flash-of-unstyled-content on first paint, and zero console errors or unhandled page errors on any
navigation.

## Contract

n/a. The design's own gap is the reason this task exists —
`.qa/design/spec/04-ds-foundations.md` UNKNOWN 7, quoted: *"Breakpoint behaviour is undefined.
There are zero `@media` queries in the design system source. What
`grid-template-columns:repeat(3,1fr)`, `repeat(6,1fr)`, and `1fr 1fr` collapse to below 1240px is
not designed."* UNKNOWN 8: *"Section padding `64px 48px` is fixed with no mobile reduction
specified."* The mobile composition is therefore authored, and this task is where it is proven
not to be broken.

`.qa/design/spec/05-ds-components.md#responsive-inventory` records what the export **does** ship:
`flex-wrap:wrap` on the topbar shell and its clusters, the dashboard filter bar, the overlays
avatar row, the footer lower bar, the cookie banner and the dark-mode button row; and a
`width:100%` + `preserveAspectRatio="none"` sparkline at a fixed 52px height. Those are the only
built-in responsive affordances and must still work.

## Design source

- Outer frame (`01-portal-dashboard.md#1.1`): `display:flex; gap:24px; padding:24px;
  height:100vh; box-sizing:border-box; max-width:1600px; margin:0 auto`; the sidebar is a fixed
  `248px` `flex:none` and `<main>` is `flex:1`. At 375px the 248px rail must not remain in flow
  — it becomes the Sheet, or the page scrolls horizontally.
- Named grid tracks already in `src/app/globals.css` (`@utility`): `grid-cols-footer`,
  `grid-cols-roster-row`, `grid-cols-history-row`, `grid-cols-profile-row`, `grid-cols-score-row`,
  `grid-cols-skill-row`, `grid-cols-row-compact`, `grid-cols-overview-split`,
  `grid-cols-search-workspace` (`15.5rem | 1fr | 1.2fr`), `grid-cols-search-list`
  (`15.5rem | 1fr`). At 375px each must collapse to a single column — `15.5rem` (248px) plus any
  sibling exceeds 375px and is the single most likely source of horizontal scroll.
- Scroll utilities already present: `scrollbar-thin`, `scroll-region`, `scroll-region-x`,
  `rail-viewport` (`calc(100svh - var(--rail-offset, 7rem))`). Any element that legitimately
  scrolls horizontally must use `scroll-region-x` **and** carry `tabindex="0"` +
  `role="region"` + an `aria-label` (otherwise it fails axe's `scrollable-region-focusable`,
  see task 327).
- Fonts: Google Sans is self-hosted via `next/font/local` (D-DESIGN-4,
  `src/app/[locale]/layout.tsx:13-71`) — `next/font` is what prevents FOUT/CLS, and this task
  asserts it holds.

## Files

- `tests/e2e/no-broken-ui-audit.spec.ts` (new)
- Layout fixes at the call site: any module component, plus `src/app/globals.css` for a grid
  track that needs a mobile collapse
- Never `src/components/ui/**`

## Depends on

- **320-326** — the sweeps deliver the final markup.
- Wave gate (prose): every UI wave (**W0, W1, W4-W10**) DONE.

## Steps

1. Write `tests/e2e/no-broken-ui-audit.spec.ts`. Enumerate every route:
   `/`, `/sign-in`, `/sign-up`, `/forgot-password`, `/reset-password`, `/auth/google/callback`,
   a 404 route, `/design-system`, `/articles`, `/dashboard`, `/dashboard/children`,
   `/dashboard/children/[documentId]`, `/dashboard/children/new` (steps 1-5),
   `/dashboard/children/[documentId]/edit`, `/dashboard/search?mode=schools`,
   `/dashboard/search?mode=agents`, `/dashboard/notifications`, `/dashboard/settings` (4 tabs).
   Plus the overlay states: mobile nav Sheet, archive dialog, filter sheet, mobile map sheet,
   user menu, notification bell popover.
2. **Horizontal scroll**, at 375×812 and 1280×800:
   `document.documentElement.scrollWidth <= window.innerWidth + 1` and
   `document.body.scrollWidth <= window.innerWidth + 1`. On failure, report the offending
   elements by walking the DOM for `el.getBoundingClientRect().right > window.innerWidth + 1`.
3. **Overflow / clipping:** for every visible text-bearing element, assert
   `el.scrollWidth <= el.clientWidth + 1` and `el.scrollHeight <= el.clientHeight + 1`
   **unless** the element (or an ancestor) declares an intentional scroll container
   (`overflow-x: auto|scroll` via the `scroll-region-x` utility) or an explicit
   `text-overflow: ellipsis` with a `title`/`aria-label` carrying the full string. A clipped
   label with no ellipsis and no accessible full text is a failure.
4. **No element escapes the viewport:** assert every visible element's bounding rect satisfies
   `rect.left >= -1` and `rect.right <= window.innerWidth + 1` at 375.
5. **FOUC / layout shift:** navigate with `waitUntil: 'commit'`, capture the first paint, then
   `waitForAnimationsSettled` and compare: assert no element's bounding box moves by more than
   2px between first contentful paint and settled (a cheap CLS proxy), and assert the body's
   computed `font-family` already resolves to the Google Sans stack on first paint (proving
   `next/font/local` and not a runtime swap).
6. **Console cleanliness:** attach `watchErrors(page)` from `tests/e2e/helpers/ui.ts` before the
   first navigation on every route and assert the collected array is **empty** at the end —
   zero `console.error`, zero `pageerror`. Hydration mismatches surface here and are a failure,
   not a warning.
7. **Image integrity:** assert every `<img>`/`next/image` has `naturalWidth > 0` after load
   (no broken asset) and carries `alt` (empty `alt=""` only for decorative), and that no
   raw `<img>` exists outside `src/app/global-error.tsx`.
8. **Scroll containers:** for every element with a horizontal scrollbar
   (`scrollWidth > clientWidth` and `overflow-x` not `visible`), assert it carries `tabindex="0"`,
   `role="region"` and a non-empty `aria-label` — the fix that also closes axe's
   `scrollable-region-focusable`.
9. Fix every failure at the module call site (collapse the grid track at the `md:` breakpoint,
   add `min-w-0` to a flex child, add the scroll-region attributes, wrap a long token). Never
   hide overflow to make the assertion pass.
10. Re-run until every route is clean at both widths, twice in a row.

## Project rules

- `schooltest-web/CLAUDE.md` §0 laws 1, 3, 4, 11, 12; §5 pitfall 14 (`window` at module top
  level) — a hydration error here fails step 6.
- `.claude/rules/tailwind.md` — 4pt spacing, `gap-*` not margin for sibling spacing, no
  arbitrary values; a mobile collapse is a `@theme`/`@utility` change or a responsive utility,
  never a magic pixel.
- `.claude/rules/quality.md` — `next/image` for every image with width/height or fill;
  `next/font` for every font (self-hosted, no CLS); stream slow data with `<Suspense>`.
- `.claude/rules/nextjs-patterns.md` — hydration correctness; `'use client'` on the first line.
- `.claude/rules/testing.md`, D-VERIFY-1.

## Done criteria

- `pnpm tsc --noEmit` + `pnpm lint` clean.
- `pnpm exec playwright test tests/e2e/no-broken-ui-audit.spec.ts` passes on **every** route and
  overlay state listed in step 1, at both 375×812 and 1280×800.
- Zero horizontal page scroll on every route at 375 (`scrollWidth <= 376`).
- Zero clipped text/control without an ellipsis + accessible full string.
- Zero element with `rect.right > 376` at 375.
- Zero bounding-box shift greater than 2px between first paint and settled; body font resolves to
  the Google Sans stack on first paint.
- `watchErrors(page)` empty on every route — zero console errors, zero pageerrors, zero
  hydration mismatch warnings escalated as errors.
- Every image loads (`naturalWidth > 0`) and is `alt`-annotated; no raw `<img>` outside
  `src/app/global-error.tsx`.
- Every horizontally-scrolling container carries `tabindex="0"` + `role="region"` +
  `aria-label`.
- Zero banned-pattern grep hits; no file under `src/components/ui/` in the diff.

## Assumptions

- `prefers-reduced-motion` is left at its default for this audit; task 330 owns the reduced
  variant. The two audits are run in the same session so a fix for one is re-proven against the
  other.
- Overlay states that require a fixture (archive dialog, mobile map sheet) reuse the seeded
  parent's real data and restore it.

## Evidence

<!-- filled in as the task runs: per-route measurements and the offender lists that were fixed -->
