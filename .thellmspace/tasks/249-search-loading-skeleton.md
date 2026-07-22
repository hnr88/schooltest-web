---
id: 249
title: Match the search loading skeleton to the new card geometry with a shimmer
layer: ui
kind: implement
slice: The loading state of the school and agent result lists
target: src/modules/search-shared/components/SearchCardSkeletonList.tsx, src/modules/school-search/components/SchoolCardSkeleton.tsx (new)
contract: n/a (presentation)
design: .qa/design/spec/01-portal-dashboard.md#11.5 (gap) · #11.2 (`st-shimmer`) · #8.4 (card geometry)
status: TODO
depends_on: ["237"]
---

## Objective

While a search is in flight the list shows placeholders with the same box, radius and rhythm as
the real cards, so nothing jumps when the query settles.

## Contract

n/a. The design has NO loading state — `.qa/design/spec/01-portal-dashboard.md` §11.5 lists
"skeleton/loading state" among the motion the design does not have. The design system does define
the keyframe this task uses (§11.2):

> `st-shimmer`: `0% { background-position:-400px 0 } 100% { background-position:400px 0 }`

and `.qa/design/spec/04-ds-foundations.md` §I records that `st-shimmer` animates
`background-position`, which `.claude/rules/tailwind.md` forbids, with the sanctioned
substitute: *"replace with a translated overlay element (`transform: translateX()`)"*.

## Design source

The skeleton mirrors the task-237 card exactly:

| Part | Value |
|---|---|
| Box | `rounded-2xl bg-card px-5.5 py-5 shadow-sm border border-transparent` |
| Cover block | `aspect-video w-full rounded-t-2xl` |
| Title bar | `h-4 w-3/5 rounded-md` |
| Meta bar | `h-3 w-2/5 rounded-md mt-0.75` |
| Footer | `mt-3.5 border-t border-divider pt-3.5` with two `h-3` bars |
| Fill | `--color-skeleton-base` (`#F1F5F9`), sheen `--color-skeleton-sheen` (`#E9EEF5`) |
| Count | 4 (matches the current `SearchCardSkeletonList` default and the perceived page height) |

Motion: the existing `shimmer-sweep` utility in `src/app/globals.css` is the carrier. If it still
animates `background-position`, convert it to a `transform: translateX(-100% → 100%)` overlay
inside an `overflow-hidden` box, duration `1400ms` linear infinite (the DS
`--duration-shimmer`). `@media (prefers-reduced-motion: reduce)` → `animation: none`, leaving a
static tinted block (never a spinner that keeps moving).

375px: single column, same geometry, `aspect-video` cover keeps the height stable.

## Files

- `src/modules/school-search/components/SchoolCardSkeleton.tsx` (**new**)
- `src/modules/search-shared/components/SearchCardSkeletonList.tsx` (accept a `renderItem`/
  variant so the agents list can pass its own skeleton in task 251)
- `src/app/globals.css` (only if `shimmer-sweep` still animates `background-position`)

## Depends on

- **237** — the geometry being mirrored.

## Steps

1. Build `SchoolCardSkeleton` from the DS `SkeletonCard` where possible; only fork if the cover
   block cannot be expressed through props.
2. Keep the existing `aria-busy="true"` wrapper and the `role="status"` sr-only label
   (`SchoolSearch.loading`) — they are the accessible loading contract and the key already
   exists in all six catalogs.
3. Ensure the skeleton block's height is within 8px of the loaded card's height for the seeded
   corpus, so the settle produces no visible jump.

## Project rules

`.claude/rules/tailwind.md`: animate transform/opacity only.
`.claude/rules/quality.md`: `aria-busy` + a status label; no infinite motion under reduced
motion. `.claude/rules/module-pattern.md`: ≤120 lines.

## Done criteria

- `pnpm tsc --noEmit` + `pnpm lint` clean.
- Playwright: intercept `POST /api/search/schools` with a 1200 ms delay; during the delay
  `[aria-busy="true"]` is present with 4 skeleton items; measure the first skeleton's bounding
  box and the first real card's bounding box after settle — the vertical delta is ≤8px.
- Cumulative layout shift across the settle is 0 for the list container
  (`PerformanceObserver('layout-shift')` in `page.evaluate`, or a before/after `boundingBox`
  comparison of the element BELOW the list).
- Under `emulateMedia({ reducedMotion: 'reduce' })` the shimmer element's computed
  `animation-name` is `none`.
- `grep -n "background-position" src/app/globals.css` → no hit inside the shimmer utility.
- axe clean during the loading state at 375 + 1280.
- The seven W8 regression specs green.

## Assumptions

Four skeleton items is the existing default and is kept; the page size is 12, but four fills the
first viewport without a long fake list.

## Evidence

_(filled in as the task runs)_
