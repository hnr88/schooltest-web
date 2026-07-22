---
id: 156
title: Dashboard entrance motion — staggered section reveal with a full reduced-motion path
layer: ui
kind: implement
slice: The page-level motion the design does not have
target: src/modules/dashboard/components/DashboardScreen.tsx, src/modules/dashboard/constants/dashboard-motion.constants.ts
contract: n/a (motion)
design: .qa/design/spec/01-portal-dashboard.md#11 · .qa/design/spec/04-ds-foundations.md#I
status: TODO
depends_on: ["133", "140", "144", "150", "154"]
---

## Objective
Give the dashboard one coherent entrance instead of four components each animating on their own
schedule, and prove the whole page is still correct with motion disabled.

## Contract
n/a. Governing decision, `.qa/DECISIONS.md` **D-DESIGN-3**, quoted:
> The design's keyframes (`st-toast-in`, `st-fade-in`, `st-pop-in`, `st-spin`, `st-shimmer`,
> `st-rec-pulse`) are implemented with Tailwind v4 + `tw-animate-css`, which the repo already
> depends on. No new animation dependency. Every animation ships a `prefers-reduced-motion`
> variant. Motion is part of the definition of done for every UI slice, not a follow-up.

And spec §11.1/§11.2: the dashboard slices contain **zero** `transition:` and **zero** `@keyframes`.
Everything here is authored, not ported.

## Design source
- Vocabulary (04-ds-foundations §I): `--duration-enter: 180ms`, `--ease-out-quart`,
  `--ease-out-quint`, `--ease-out-expo`. This repo ships `--ease-out-expo:
  cubic-bezier(0.16, 1, 0.3, 1)` (globals.css:61) and `tw-animate-css` — use `duration-200`
  (the nearest standard step to 180ms) and `ease-out-expo`.
- Section stagger, on the four top-level children of the stack:
  | order | section | delay |
  |---|---|---|
  | 1 | greeting row | `0ms` |
  | 2 | hero grid | `60ms` |
  | 3 | "My children" | `120ms` |
  | 4 | note grid | `180ms` |
  Class per section: `animate-in fade-in slide-in-from-bottom-2 duration-200 ease-out-expo
  motion-reduce:animate-none`, delay via an inline `style={{ animationDelay }}` read from
  `DASHBOARD_STAGGER_MS` in `constants/dashboard-motion.constants.ts` (constants belong in
  `constants/`, per the module law).
  `slide-in-from-bottom-2` = 8px — small enough that the page never looks like it is assembling.
- **Nested stagger budget.** 135 (hero stats, 60ms step), 141 (bars, 40ms step) and 146 (ticks,
  40ms step) each stagger internally. Total time to a fully settled page must stay under **600ms**:
  worst path = note grid 180ms + 200ms duration = 380ms; bars = 60ms + 6×40ms + 200ms = 500ms ✓.
  This task's job is to check that budget and cut a nested stagger if it is exceeded — a dashboard
  that takes a second to settle is worse than no motion.
- **No motion on**: numbers (no count-up — a count-up on a factual metric reads as the number
  changing), the CEFR ticks' width, bar heights, or anything that animates layout. Tailwind rule:
  transform and opacity only.
- **Reduced motion is a first-class path, not a degradation.** With `prefers-reduced-motion: reduce`
  every section, stat, bar and tick must be at its final position and full opacity on first paint —
  `motion-reduce:animate-none` on an `animate-in` element leaves it at its final state, which is the
  behaviour to verify, not assume.
- Route changes: no view-transition is added (spec §11.5 notes the design has none, and Next's
  view transitions would need opt-in across every route — out of this slice).

## Files
- CREATE `src/modules/dashboard/constants/dashboard-motion.constants.ts` —
  `export const DASHBOARD_STAGGER_MS = [0, 60, 120, 180] as const;`
- EDIT `src/modules/dashboard/components/DashboardScreen.tsx` — apply the classes and delays.
- EDIT any of 135/141/146 whose nested stagger blows the 600ms budget.

## Depends on
- **133**, **140**, **144**, **150** (the four sections), **154** (so the entrance plays on the
  data swap, not on the skeleton).

## Steps
1. Add the constant and the four section classes.
2. Measure the settle time with a Playwright animation-frame probe; trim nested staggers if needed.
3. Verify the reduced-motion path renders a complete, final-state page.

## Project rules
- `.claude/rules/tailwind.md` — "Animate `transform` and `opacity` ONLY — never
  width/height/padding/margin"; "Exponential easings only".
- `.qa/DECISIONS.md` D-DESIGN-3 — no new animation dependency; reduced-motion variant on every
  animation.
- `.claude/rules/module-pattern.md` — constants in `constants/`.

## Done criteria
- `pnpm tsc --noEmit` + `pnpm lint` clean.
- Playwright: on load, each of the four sections has a non-`none` computed `animation-name` and the
  four `animation-delay` values are `0s, 0.06s, 0.12s, 0.18s`.
- Settle budget: `document.getAnimations()` on `/dashboard` reports no animation whose
  `startTime + duration + delay` exceeds **600ms** from navigation.
- Reduced motion: with `page.emulateMedia({ reducedMotion: 'reduce' })`, `document.getAnimations()`
  is empty on `/dashboard` after load, AND a full-page screenshot is pixel-comparable to the
  settled motion-enabled screenshot (same layout, same opacity — nothing stuck invisible).
- No animated property outside `transform`/`opacity`: assert every entry of
  `document.getAnimations()` has effect target properties within that set.
- The dashboard renders identically after a hard reload (motion is entrance-only, not stateful).
- axe clean; 375px motion behaves identically. Zero banned-pattern hits.

## Assumptions
- `tw-animate-css` is already a dependency (it is — used by today's `DashboardScreen`).

## Evidence
<filled in as the task runs>
