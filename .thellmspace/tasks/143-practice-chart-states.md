---
id: 143
title: Practice-minutes card loading, zero-week and error states
layer: ui
kind: implement
slice: The three non-happy states of the practice chart card
target: src/modules/dashboard/components/DashboardPracticeChart.tsx, src/modules/dashboard/components/DashboardPracticeChartSkeleton.tsx
contract: C-DASH-HOUSEHOLD
design: .qa/design/spec/06-auth-states-landing.md (skeletons) · .qa/design/spec/01-portal-dashboard.md#11.5 #UNKNOWNS
status: TODO
depends_on: ["141", "142"]
---

## Objective
Give the chart card the three states the design does not have. Spec §11.5 lists "skeleton/loading
state" among the motion the design does not specify, and §UNKNOWNS records that no empty or error
state exists in these files — so these are authored from the design system's shimmer and the app's
existing primitives.

## Contract
`C-DASH-HOUSEHOLD` guarantees `practiceByDay` has exactly 7 entries even when every `seconds` is 0,
and `strongestDay: null` in that case. So "zero week" is a **content** state, not an empty state:
the card still renders seven labelled columns.

## Design source
- **Loading.** Header (`h2` + range label) renders as real text immediately — it is static copy and
  must not shimmer. The plot renders seven shimmer columns at fixed decorative heights
  (`h-8 h-12 h-10 h-20 h-14 h-6 h-4` — 32/48/40/80/56/24/16px, a plausible silhouette, never the
  design's literal 34/52/42/88/60/26/14 which would imply real minutes) using the existing
  `shimmer-sweep` utility (`src/app/globals.css:392`), which already degrades to a flat tint under
  `prefers-reduced-motion`. Caption slot renders a `h-4 w-60 rounded-md shimmer-sweep` bar.
  Container gets `aria-busy="true"` and the plot gets `aria-hidden="true"` while loading so no
  screen reader reads seven meaningless boxes; a visually-hidden `t('Common.loading')` live region
  announces the load.
- **Zero week** (`maxSeconds === 0`): seven 2px stubs from 141, no highlight, caption from 142's
  null branch. No "no data" illustration — the card is answering the question truthfully.
- **Error.** The chart card is not error-able on its own: it and the hero share one request. On
  `status === 'error'` the whole page renders 155's error state and this card does not mount. This
  task's job is to make sure the card never renders a partial/stale chart on error — assert count 0.
- Motion: `shimmer-sweep` only (1.4s ease infinite, already reduced-motion-safe). The skeleton→data
  swap gets `animate-in fade-in duration-200 ease-out-expo motion-reduce:animate-none` on the real
  plot so the transition is not a hard cut.

## Files
- CREATE `src/modules/dashboard/components/DashboardPracticeChartSkeleton.tsx`.
- EDIT `src/modules/dashboard/components/DashboardPracticeChart.tsx` — branch on the 130 state.
- i18n: reuse `Common.loading`; add `Dashboard.practice.loadingLabel` only if `Common.loading`'s
  copy does not fit.

## Depends on
- **141** (bars), **142** (caption).

## Steps
1. Build the skeleton with real header copy + shimmer plot.
2. Branch the card; add `aria-busy` and the live region.
3. Prove the error branch does not mount the card.

## Project rules
- `.claude/rules/quality.md` — loading states announced, not silent; decorative skeletons hidden
  from AT.
- `.claude/rules/tailwind.md` — reuse the existing `shimmer-sweep` utility; do not author a second
  shimmer.
- `.claude/rules/module-pattern.md` — separate skeleton component, ≤120 lines.

## Done criteria
- `pnpm tsc --noEmit` + `pnpm lint` clean.
- Playwright: delay `**/api/my/progress` by 1500ms; before it resolves the card shows
  `[data-slot="dashboard-practice-chart"][aria-busy="true"]` with 7 shimmer columns and the REAL
  `h2` text; after it resolves `aria-busy` is absent and 7 real bars are present.
- Reduced motion: with `reducedMotion: 'reduce'` the shimmer elements' computed `animation-name` is
  `none` and their `background-image` is `none` (the utility's own reduced-motion block).
- Zero week: stub all-zero ⇒ 7 columns, 0 highlighted, caption = `Dashboard.practice.noPractice`.
- Error: stub a 500 ⇒ `[data-slot="dashboard-practice-chart"]` count is 0 and the page error state
  (155) is visible.
- axe clean in the loading state as well as the loaded state (run AxeBuilder while `aria-busy`).
- 375px in all three states, no horizontal overflow. Six catalogs key-identical.

## Assumptions
- `Common.loading` exists in all six catalogs (it does — used by the current `DashboardSkeleton`).

## Evidence
<filled in as the task runs>
