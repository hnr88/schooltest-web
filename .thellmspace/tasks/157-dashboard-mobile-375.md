---
id: 157
title: 375px composition of the whole dashboard — row reflow, collapsed grids, no fixed widths
layer: ui
kind: implement
slice: The dashboard at 375px, end to end
target: src/modules/dashboard/components/* (composition classes only)
contract: n/a (responsive)
design: .qa/design/spec/01-portal-dashboard.md#9 · .qa/design/screens/portal--main.html
status: TODO
depends_on: ["132", "135", "141", "142", "145", "146", "147", "150"]
---

## Objective
Make every dashboard surface correct at 375px. The design has **zero** media queries (spec §9,
verified by grep), so the mobile composition is authored — and several of the design's fixed widths
are actively wrong at 375px and must be replaced, not scaled.

## Contract
n/a. Spec §9, the design's only adaptivity, quoted:
> `grid-template-columns:repeat(auto-fit,minmax(380px,1fr))` — hero grid and note/recommendations
> grid collapse to 1 column below ~780px of main width
> `flex-wrap:wrap` — greeting row, hero stat row, filter-chip row, search header row …
> Fixed, non-responsive: sidebar `248px`, search list rail `340px`, **kid name column `190px`**,
> dashboard search pill `240px`, search-view pill `360px`, date block `56px`, filter dialog `560px`

## Design source — what breaks at 375px and the fix for each
1. **Child row** (`portal--main.html:66`). At 375px the row is
   `44 (avatar) + 20 + 192 (name) + 20 + 120 (ticks) + 20 + pill + 20 + 16` ≈ 460px — 85px over.
   Fix: at `max-sm` the row becomes a two-line grid —
   line 1 `avatar | name block (flex-1, no fixed width) | chevron`,
   line 2 (indented past the avatar) `CEFR strip (flex-1) | focus pill`.
   Implement with `grid grid-cols-[auto_1fr_auto] gap-x-4 gap-y-3 sm:flex sm:items-center sm:gap-5`
   — `grid-cols-[auto_1fr_auto]` is an arbitrary value and is **banned**; emit
   `@utility grid-cols-child-row { grid-template-columns: auto minmax(0,1fr) auto; }` in
   `src/app/globals.css` beside the existing `@utility grid-cols-search-list`.
   The name block drops `w-48` at `max-sm` (`w-full sm:w-48`).
   The row must remain ONE link and ONE tab stop after the reflow (149's assertion still holds).
2. **Hero stat row**: `flex-wrap` already stacks the two cells; the vertical separator becomes
   `max-sm:hidden` and cell 2 gets `max-sm:pt-4` (a vertical rule between stacked rows is wrong).
3. **Hero panel padding**: `p-8` → `max-sm:p-6` (32px → 24px) so the 24px headline is not pinched.
4. **Headline `max-w-105`** (420px) exceeds a 375px viewport minus padding — add `max-w-full
   sm:max-w-105`.
5. **Practice chart**: 7 columns at `gap-3.5` inside a 375px card with `p-6` = 327px content ⇒
   ~26px per column; `max-w-8` (32px) never binds, so bars stay `w-full`. Verify the 11px weekday
   letters do not wrap or clip. Plot keeps `min-h-30`.
6. **Strongest-day caption**: `text-caption` (13px) over two lines is fine; ensure the emphasised
   span does not break across lines awkwardly — `text-pretty` on the caption.
7. **Both grids** collapse automatically via `grid-cols-portal-2up`'s `minmax(23.75rem, 1fr)` —
   verify, do not add a media query.
8. **Page padding**: the design's `padding:8px 4px 8px 8px` is desktop-only; use
   `px-4 py-6 sm:py-2 sm:pr-1 sm:pl-2`.
9. **Section stack gap**: `gap-7` (28px) stays — it reads correctly on mobile too.
10. **Note card**: `p-8` → `max-sm:p-6`; the footer row wraps (`flex-wrap`).

Touch targets: every interactive element ≥ 44×44 — the child row, the "See details" link (needs
`py-2 -my-2` to reach 44px without changing the visual baseline), and the note card's "View" link.

## Files
- EDIT `src/app/globals.css` — `@utility grid-cols-child-row`.
- EDIT the composition classes of `DashboardScreen`, `DashboardHeroPanel`, `DashboardHeroHeadline`,
  `DashboardHeroStats`, `DashboardPracticeChart`, `DashboardPracticeCaption`, `DashboardChildRow`,
  `DashboardChildrenPanel`, `DashboardSchoolNote`.
- No new component. No JS-driven breakpoint logic — CSS only.

## Depends on
- **132**, **135**, **141**, **142**, **145**, **146**, **147**, **150** — every surface it reflows.

## Steps
1. Add the `@utility`; reflow the child row.
2. Sweep the remaining nine points at 375px in a real browser.
3. Re-check 1280px is unchanged — this task must not regress the desktop composition.

## Project rules
- `.claude/rules/tailwind.md` — no arbitrary values (hence the `@utility`); mobile-first classes
  with `sm:` overrides, not `max-*` where a mobile-first form exists.
- `.claude/rules/quality.md` — 44px touch targets; no horizontal scroll; text remains legible
  without zoom.
- `CLAUDE.md` §0 law 4 — touch only what this slice needs.

## Done criteria
- `pnpm tsc --noEmit` + `pnpm lint` clean.
- Playwright at 375×800, seeded parent, `/dashboard`:
  - `document.documentElement.scrollWidth <= clientWidth` (no horizontal scroll) — asserted in the
    loading state, the loaded state, the error state and the zero-children state.
  - every `[data-slot="dashboard-child-row"]` has `getBoundingClientRect().width <= 375` and the
    CEFR strip's box `y` is greater than the name block's `y` (proving the two-line reflow).
  - the hero stat separator is `display: none`.
  - the practice plot has 7 visible columns with non-zero width and no clipped label
    (`scrollWidth <= clientWidth` on the plot).
  - every interactive element's box is ≥ 44px on the smaller axis.
  - one tab stop per child row (149's assertion re-run at 375px).
- Playwright at 1280×800: the desktop composition is unchanged — the child row is a single line
  (CEFR strip `y` equals the name block's `y` within 4px) and both grids are 2 columns.
- Full-page screenshots at 375 and 1280 saved to `.qa/screenshots/`.
- axe clean at 375px. Zero banned-pattern hits; `grep -rn "grid-cols-\[" src/modules/dashboard`
  returns nothing.

## Assumptions
- 375px is the target minimum (matches the existing `a11y-responsive.spec.ts` and
  `dashboard.spec.ts` mobile viewport).

## Evidence
<filled in as the task runs>
