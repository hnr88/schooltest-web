---
id: 248
title: Compose the search surface at 375px — the map collapses, filters go to the overlay
layer: ui
kind: implement
slice: The phone composition of the whole Find-a-school surface
target: src/modules/school-search/components/SchoolsPane.tsx, MobileMapSheet.tsx, SchoolFilterBar.tsx
contract: n/a (layout)
design: .qa/design/spec/01-portal-dashboard.md#9 (responsive hints) · #8.3 · #8.5
status: TODO
depends_on: ["247", "234"]
---

## Objective

At 375px the surface is a single readable column: header, filter bar, chips, result cards. The
map is not rendered inline — it is one tap away in the existing bottom sheet — and the filters
open in the design's overlay.

## Contract

n/a. Design spec quoted (§9):

> There are **zero `@media` queries** in `Parent Portal.dc.html` … All adaptivity is intrinsic:
> `flex-wrap:wrap` — greeting row, hero stat row, filter-chip row, search header row,
> school-card footer (9 occurrences total); `min-width:0` on `<main>` and every flex text stack;
> Fixed, non-responsive: … search list rail `340px` … filter dialog `560px`;
> Dialog `max-width:100%; max-height:88vh; overflow-y:auto`; Map `min-height:420px`.

The design has **no** phone composition — that is a stated finding, not an omission. The operator
requirement ("do good mobile", D-SCOPE-1) and `.qa/PLAN.md`'s definition of done ("correct at
375px and 1280px") make this task the authored answer, derived from the design's own intrinsic
hints.

## Design source

| Region | 1280 | 375 |
|---|---|---|
| Header row | title left, 360px pill right | wraps (`flex-wrap`, design §9); pill `w-full` |
| Sub-line | one line | wraps, no truncation |
| Filter bar | pill · divider · chips · hint | wraps to 2-3 lines; the divider is `hidden sm:block` (a 1px rule at the start of a wrapped line reads as a bug) |
| Filter surface | rail + overlay | overlay only (`SchoolFiltersDialog`, `max-w-full`, `p-4` scrim gutter, `max-h-[88svh]`) |
| Rail | visible `lg:block` | `hidden` — it is the same controls component, so nothing is lost |
| List | 340px column, own scroller | full width, `flex flex-col gap-3.5`, ONE ordinary document scroll (no nested scroller — a nested scroller on a phone traps the page scroll) |
| Map | fluid column, `min-h-105` | NOT mounted inline; the `MobileMapSheet` trigger (`SchoolSearch.map.showMap`) opens a `h-dvh` bottom sheet that mounts Leaflet on open |
| Zoom stack | `right-5 top-5` | `right-4 top-4` inside the sheet |
| Selected map card | `bottom-5 left-5`, `max-w-85` | `inset-x-4 bottom-4` |
| Pager | pinned footer of the panel | inline after the last card |

Motion: the sheet uses the DS `Sheet` enter/exit (`slide-in-from-bottom` + fade, ~200 ms
`ease-out-expo`), `motion-reduce:animate-none`. The map is mounted only while the sheet is open —
Leaflet must not boot on a phone that never opens it.

## Files

- `src/modules/school-search/components/SchoolsPane.tsx`
- `src/modules/school-search/components/MobileMapSheet.tsx`
- `src/modules/school-search/components/SchoolFilterBar.tsx`
- `src/modules/school-search/components/SchoolResults.tsx` (scroller only above `lg`)

## Depends on

- **247** — the desktop split it degrades from.
- **234** — the overlay is the phone filter surface.

## Steps

1. Keep the existing `hidden lg:block` on the desktop map column and the `lg:hidden` on the sheet
   trigger — `school-map.spec.ts:101-117` asserts exactly this pair.
2. Confine `scroll-region` to `lg:` so the phone gets one document scroll.
3. Hide the 248px rail below `lg` (already true) and make the All-filters pill the only filter
   affordance there.
4. Check every fixed width from the design for phone safety: the 360px pill → `w-full sm:w-90`;
   the 340px list → `w-full`; the 560px dialog → `max-w-full`.
5. Verify no horizontal overflow anywhere on the surface, including with the longest seeded
   school name and the widest chip row (all 8 states selected).

## Project rules

`.claude/rules/tailwind.md`: mobile-first utilities, no arbitrary widths.
`.claude/rules/quality.md`: 44px pointer targets, no horizontal page scroll, focus order follows
DOM order. `schooltest-web/CLAUDE.md` §0.3: do not regress the desktop composition.

## Done criteria

- `pnpm tsc --noEmit` + `pnpm lint` clean.
- Playwright at 375×812 on `/dashboard/search`:
  `document.scrollingElement.scrollWidth <= 375` with 12 cards rendered AND with all 8 state
  chips applied.
- `page.locator('aside .leaflet-container')` is hidden; the `SchoolSearch.map.showMap` trigger
  opens `getByRole('dialog')` containing a visible `.leaflet-container`
  (`school-map.spec.ts` scenario 6, unmodified).
- Before the sheet is opened, zero requests to the tile host are made (Leaflet did not boot).
- The All-filters pill opens the overlay; the overlay's card fits inside 375 with a ≥16px gutter
  and its footer stays visible while the body scrolls.
- Every interactive element on the surface has a ≥44×44 pointer box at 375.
- axe: zero serious/critical at 375 with the overlay closed AND open.
- `unified-search.spec.ts`'s 375 "rail → Filters trigger" scenario passes.
- Reduced motion: the sheet and overlay report no animation.

## Assumptions

The phone keeps the bottom-sheet map rather than an inline one: an inline 420px map above a
result list pushes every result below the fold, and the sheet is existing, tested behaviour.

## Evidence

_(filled in as the task runs)_
