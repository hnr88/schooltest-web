---
id: 300
title: Build the app-shell route skeleton from the design's shimmer system
layer: ui
kind: implement
slice: /[locale]/dashboard route-level loading UI — sidebar + header + title block + two child cards + list card
target: src/app/[locale]/dashboard/loading.tsx, src/modules/shell/components/AppShellSkeleton.tsx, src/modules/dashboard/components/DashboardSkeleton.tsx
contract: n/a (pure presentation — design spec quoted below)
design: .qa/design/screens/app--loading-skeleton.html:1-35 · .qa/design/spec/06-auth-states-landing.md#2-loading-skeleton-system-app-loading-skeletonhtml
status: TODO
depends_on: []
---

## Objective

Give the dashboard a real route-level skeleton built from the design's shimmer system and shape
catalogue, so a slow `GET /api/my/students` shows the app's shape instead of a blank frame. The
existing `DashboardSkeleton` (rendered by `DashboardScreen` while its query is pending) is retuned
to the same shapes so the two never disagree.

## Contract

n/a — presentation. Binding design text, `.qa/design/spec/06-auth-states-landing.md` §2.1:

> Keyframe: `@keyframes st-shimmer { 0% { background-position: -400px 0 } 100% { background-position: 400px 0 } }`
> Both variants are applied as `background-size:800px 100%; animation: st-shimmer 1.4s linear infinite;`
>
> | Variant | Gradient | Where |
> |---|---|---|
> | **Light** (on white cards / sidebar / header) | `linear-gradient(90deg,#F1F5F9 25%,#E9EEF6 50%,#F1F5F9 75%)` | `:4-7`, `:11-12`, `:21-22`, `:24-26`, `:30-33` |
> | **Dark** (page-title block on the `#F7F9FC` page background) | `linear-gradient(90deg,#E9EEF6 25%,#E3E8F0 50%,#E9EEF6 75%)` | `:16-17` |
>
> Rule: the shimmer base must be one step darker than the surface it sits on …
> Keep `800px 100%` verbatim.

## Design source

`.qa/design/screens/app--loading-skeleton.html`. Structure (`:1`) `grid 248px 1fr`.

Shape catalogue (spec §2.3) — every one of these is a `<span>`, no text, no aria:

| Shape | Size | Radius | Utility |
|---|---|---|---|
| Nav item | `h 36px`, full width | 10px | `h-9 w-full rounded-lg` |
| Header pill | `110×30` | 999px | `h-7.5 w-27.5 rounded-full` |
| Avatar sm | `38×38` | 999px | `size-9.5 rounded-full` |
| Avatar lg | `52×52` | 999px | `size-13 rounded-full` |
| Page title | `320×28` | 8px | `h-7 w-80 rounded-md` |
| Page subtitle | `420×16` | 6px | `h-4 w-105 rounded-sm` |
| Card title | `180×18` | 6px | `h-4.5 w-45 rounded-sm` |
| Text line (primary) | `60%` / `55%` × 16 | 6px | `h-4 w-3/5` / `w-[55%]`→ use `w-1/2` + the design's deliberate irregularity note below |
| Text line (secondary) | `40%` / `35%` × 13 | 6px | `h-3.5 w-2/5` / `w-1/3` |
| Metric tile | `h 66px` (1/3 col) | 12px | `h-16.5 rounded-tile` |
| List row | `h 44px`, full width | 10px | `h-11 w-full rounded-lg` |

Composition:
- **Sidebar** (`:2-8`): `bg-card border-r border-border`, `p-6 px-4`, `gap-3.5`. **The real logo is
  kept — spec §2.2: "The logo never skeletonises."** `height:30px; margin:0 8px 14px`. Then 4 nav
  placeholders (the real rail has 4 items — `src/modules/shell/constants/nav.constants.ts`).
- **Header** (`:10-13`): `bg-card border-b border-border`, `h-16`, `px-8`, `justify-end`, `gap-3.5`,
  header pill + avatar sm.
- **Main** (`:14-35`): `p-7 px-8`, `gap-5.5`. Page-title block (dark shimmer) → two child cards in
  `grid-cols-1 md:grid-cols-2 gap-4.5`, each a **real card chrome** (`bg-card border border-border
  rounded-panel p-5.5 gap-3.5`) holding avatar lg + 2 text lines + 3 metric tiles → a list card
  (same chrome) with a card title and 3 list rows.
- Card 2's text lines use `55%`/`35%` where card 1 uses `60%`/`40%` — spec §2.2 records this as
  "deliberate irregularity so the two cards don't look cloned". Express with the nearest scale
  fractions (`w-3/5`/`w-2/5` and `w-1/2`/`w-1/3`); never an arbitrary `w-[55%]`.

Token map: `#F1F5F9` → `--color-skeleton-base` · `#E9EEF6` → `--color-skeleton-sheen` · `#E3E8F0` →
`--color-border` · `#F7F9FC` → `--color-background` · `#FFFFFF` → `--color-card`.
`--radius-panel` 16px, `--radius-tile` 12px, `rounded-lg` 10px.

**Existing utility to reuse, and one thing to check:** `src/app/globals.css` already ships
`@keyframes st-shimmer` + `@utility shimmer-sweep`, but at `1.4s ease` with a percentage gradient,
not the design's `1.4s linear` with `background-size:800px 100%`. W0/W1 owns that utility. This task
**consumes** `shimmer-sweep` and, if the timing function still reads `ease`, files the one-line
correction to `linear` as part of its diff and says so in Evidence — the design's value is
unambiguous.

## Files

- `src/app/[locale]/dashboard/loading.tsx` (new — Server Component, renders `AppShellSkeleton`)
- `src/modules/shell/components/AppShellSkeleton.tsx` (new — sidebar + header + main slot; exported
  from `src/modules/shell/index.ts` because the route imports it across a module boundary)
- `src/modules/dashboard/components/DashboardSkeleton.tsx` (retune the shapes to the catalogue)

## Depends on

None inside W10. Wave-level: W1's skeleton primitive; W4's shell (the 248px rail measurement the
skeleton mirrors — if W4 has not landed, mirror the value in
`src/app/[locale]/dashboard/layout.tsx`'s `--sidebar-width: 248px`, never a new number).

## Steps

1. Read `src/app/[locale]/dashboard/layout.tsx`, `DashboardSkeleton.tsx`,
   `src/modules/shell/constants/nav.constants.ts` and `tests/e2e/shell.spec.ts`.
2. Build `AppShellSkeleton` to the composition above, all shapes `aria-hidden="true"`.
3. **Accessibility the design omits** (spec §2 UNKNOWNS: *"no `aria-busy`, `aria-hidden`,
   `role="status"` or visually-hidden loading text appears on any skeleton element"*): the wrapper
   carries `aria-busy="true"` and a single visually-hidden `role="status"` node with
   `Common.loading`; every shape is `aria-hidden="true"`. This is the same pattern
   `DashboardSkeleton` already uses — keep it.
4. Add `src/app/[locale]/dashboard/loading.tsx` returning it.
5. Retune `DashboardSkeleton`'s blocks to the catalogue sizes so the streamed skeleton and the query
   skeleton are the same shapes.
6. Motion: `shimmer-sweep` only. Reduced motion — a
   `@media (prefers-reduced-motion: reduce)` rule must leave the shapes as a flat
   `--color-skeleton-base` fill with `animation: none`. If the utility does not already carry it,
   add it in `globals.css` next to the utility.
7. 375px: the sidebar skeleton is hidden (the real rail is a Sheet below `lg`), the header keeps its
   pill + avatar, the two child cards stack, the metric tiles stay a 3-up grid.

## Project rules

- `schooltest-web/CLAUDE.md` §0 laws 3, 4, 7, 8, 11, 15.
- `.claude/rules/nextjs-patterns.md` — `loading.tsx` is a Server Component; no `'use client'`.
- `.claude/rules/module-pattern.md` — the skeleton lives in `src/modules/shell/components/`, is
  exported through the barrel, and the route imports it via `@/modules/shell`.
- `.claude/rules/tailwind.md` — animate `background-position` only through the design's own
  keyframe; no width/height animation; tokens only; **no arbitrary values**.
- `.claude/rules/i18n.md` — `Common.loading` already exists in all six catalogs.

## Done criteria

- `pnpm tsc --noEmit` + `pnpm lint` clean.
- `pnpm exec playwright test tests/e2e/shell.spec.ts tests/e2e/shell-a11y.spec.ts
  tests/e2e/dashboard.spec.ts` green.
- A real Playwright assertion against the running app: route to `/dashboard` with
  `GET /api/my/students` delayed via `page.route`, and assert (a) `[data-slot="app-shell-skeleton"]`
  is visible with `aria-busy="true"`, (b) a `role="status"` node announces `Common.loading`,
  (c) the sidebar logo image is present and **not** a skeleton shape, (d) the skeleton disappears
  once the real response lands and the two seeded students render.
- Computed-style assertion that a skeleton shape's `animation-name` is `st-shimmer`,
  `animation-duration` is `1.4s` and `animation-timing-function` is `linear`.
- Under `prefers-reduced-motion: reduce`, the same shape reports `animation-name: none` and a flat
  `--color-skeleton-base` background.
- axe zero serious/critical on the skeleton state at 375 and 1280.
- Six catalogs key-identical.
- Zero banned-pattern grep hits.

## Assumptions

The design skeletonises 4 nav rows against a 6-item rail (spec §2.2 notes the deliberate
under-fill); this app's rail has exactly 4 items, so 4 rows is both design-true and app-true.

## Evidence

_(filled in as the task runs)_
