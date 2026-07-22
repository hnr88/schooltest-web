---
id: 184
title: Re-dress the activity snapshot and session-completion block into the portal card
layer: ui
kind: implement
slice: The stack block that carries the four real session metrics and the completion ratio, preserved from today's screen and restyled to the portal chrome.
target: src/modules/children/components/ChildHeroCompletion.tsx, src/modules/children/components/ChildActivitySnapshot.tsx (new), src/modules/children/lib/child-learning-progress.ts
contract: C-PARENT-CHILD-PROGRESS (metrics) · C-UI-CHILD-LEARNING-SURFACE
design: .qa/design/spec/02-portal-children.md §B.2 (KpiStrip chrome, reused) · .qa/design/screens/portal--child-detail.html L17
status: TODO
depends_on: ["181"]
---

## Objective

The design has no slot for the four session metrics, but they are real data and are asserted by the
existing e2e. Keep them, in the portal's own card idiom, immediately below the KPI strip.

## Contract

`C-PARENT-CHILD-PROGRESS` `data.metrics` = `{ totalSessions, completedSessions, activeSessions,
officialResults }`, each a non-negative integer, read-only. `C-UI-CHILD-LEARNING-SURFACE` requires
"an activity/completion summary derived only from real session metrics" and forbids synthesising one
when there is none.

Existing assertions that MUST stay true (`tests/e2e/children-profile.spec.ts:96-121`):
- `[data-slot="child-learning-hero"] [data-slot="stat-strip"]` exists with
  `aria-label = Children.metricsHeading`.
- Its `dt` list equals `Children.metricTotalSessions / metricCompletedSessions / metricActiveSessions /
  metricOfficialResults` in that order, and its `dd` list equals the values from THAT response.
- `[data-slot="child-learning-summary"]` is present with
  `[data-slot="completion-cell"][aria-valuetext="{completed}/{total}"]` when `totalSessions > 0`, and
  **absent** when `totalSessions === 0`.

## Design source

Card chrome copied from §B.2's KpiStrip: `bg-card rounded-3xl`, `padding:24px 30px`,
`--shadow-portal-card`, cells `flex-1 min-w-35`, dividers `w-px bg-portal-rule`, label
12px `text-portal-muted-2`, value 24px/700 `text-navy-900`. The completion ratio keeps the existing
`CompletionCell` primitive; its rail uses `bg-portal-rule` (`#EEF1F6`) and its fill `bg-navy-900`,
matching §B.5's track/fill treatment (6px height).

## Files

- `src/modules/children/components/ChildActivitySnapshot.tsx` (new) — the four-metric `dl`.
- `ChildHeroCompletion.tsx` — re-dressed; keeps both `data-slot` hooks and the `aria-valuetext`.
- `child-learning-progress.ts` — unchanged derivation; only its consumers move.

## Depends on

- `181` — this block sits directly under the KPI strip and reuses its card chrome.

## Steps

1. Move the strip out of the old hero into the stack block, keeping BOTH `data-slot` attributes and
   the `aria-label` intact (the e2e selects on the nesting `child-learning-hero > stat-strip`, so keep
   that wrapper attribute on the block root).
2. Values come from the response, never recomputed; `0` renders as `0`.
3. When `totalSessions === 0` the completion line is not rendered at all (the spec asserts count 0),
   and the block shows `Children.noSessionProgress` instead.
4. Motion: the completion fill animates `transform: scaleX()` 180ms `--ease-out-quart` from 0 to the
   real ratio (transform-only, never `width`); `motion-reduce` renders the final state.

## Project rules

- `CLAUDE.md` §0.3 — never break existing logic (these hooks are load-bearing for a passing spec).
- `.claude/rules/tailwind.md:19` — transform/opacity only.
- `.claude/rules/module-pattern.md` — 120-line component cap.

## Done criteria

- `pnpm tsc --noEmit` + `pnpm lint` clean.
- `tests/e2e/children-profile.spec.ts` passes with its `stat-strip` dt/dd and completion-cell
  assertions untouched.
- Playwright: the four values equal the live `metrics` object; with `totalSessions === 0` the
  completion cell is absent and `Children.noSessionProgress` is visible.
- Motion present + reduced-motion inert; no animation targets `width`.
- 375px: 2-column metric grid, dividers hidden, no h-scroll; 1280px: one row.
- axe zero serious/critical.

## Assumptions

No catalog change — all five keys already exist in all six catalogs.

## Evidence

<!-- filled in as the task runs -->
