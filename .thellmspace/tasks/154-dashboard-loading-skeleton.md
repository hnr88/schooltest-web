---
id: 154
title: Whole-page dashboard loading skeleton matching the final composition
layer: ui
kind: implement
slice: The dashboard's first paint while GET /api/my/progress is in flight
target: src/modules/dashboard/components/DashboardSkeleton.tsx
contract: C-DASH-HOUSEHOLD
design: .qa/design/spec/06-auth-states-landing.md (skeletons) · .qa/design/spec/01-portal-dashboard.md#11.5
status: TODO
depends_on: ["133", "140", "144", "150"]
---

## Objective
Replace the current generic `DashboardSkeleton` with one whose boxes sit exactly where the real
sections will, so the page does not reflow when data arrives.

## Contract
`C-DASH-HOUSEHOLD` — one request drives the hero, the chart and the children list, so all three
share one loading state. The note card (150) has its own request and its own skeleton; it must be
able to still be loading after the rest has resolved.

## Design source
Spec §11.5 lists "skeleton/loading state" among what the design does NOT specify, so this is
authored from the design system's `st-shimmer` (spec §11.2) via the existing `shimmer-sweep`
utility (`src/app/globals.css:392`), which already ships a `prefers-reduced-motion` branch.
- Same frame as 131: `flex flex-col gap-7`, then the two `grid-cols-portal-2up` grids and the
  children section between them.
- Greeting: a `h-4 w-40 rounded-md shimmer-sweep` date bar over a `h-8 w-72 rounded-md
  shimmer-sweep` title bar (32px tall matches the real `text-h2`).
- Hero: the REAL navy panel (`rounded-portal bg-navy-900 p-8`) with shimmer bars inside — a white
  box where a navy panel is about to appear is the single worst flash on this page. Inside, use
  `bg-navy-800` blocks at `animate-pulse` rather than `shimmer-sweep` (whose light gradient is
  invisible on navy): eyebrow `h-3 w-24`, headline `h-6 w-full` + `h-6 w-2/3`, two stat blocks
  `h-8 w-16`.
- Chart card: 143's skeleton, reused — do not build a second one.
- Children: 148's skeleton, reused — do not build a second one.
- Note card: 150's own loading state, reused.
- `data-slot="dashboard-skeleton"`, `aria-busy="true"` on the page container, and ONE
  visually-hidden polite live region announcing `Common.loading` for the whole page (not one per
  section — three simultaneous announcements are worse than none).
- Motion: `shimmer-sweep` (1.4s) and `animate-pulse` only, both reduced-motion safe; the real
  content replaces it with `animate-in fade-in duration-200 ease-out-expo
  motion-reduce:animate-none`.

## Files
- EDIT `src/modules/dashboard/components/DashboardSkeleton.tsx` — rewrite to the new composition,
  composing 143's and 148's skeletons rather than duplicating them.
- EDIT `DashboardScreen` — render it on `status === 'loading'`.

## Depends on
- **133**, **140**, **144**, **150** — the four shapes it mirrors.

## Steps
1. Rewrite the skeleton as the same frame with shimmer content.
2. Compose the two section skeletons; add the single live region.
3. Measure the reflow between skeleton and loaded state.

## Project rules
- `.claude/rules/quality.md` — one polite live region; skeleton content `aria-hidden`; stream slow
  data rather than blocking.
- `.claude/rules/tailwind.md` — reuse `shimmer-sweep`; no new keyframes beyond the design system's
  six; reduced-motion variant required.
- `.claude/rules/module-pattern.md` — ≤120 lines; compose, do not duplicate.

## Done criteria
- `pnpm tsc --noEmit` + `pnpm lint` clean.
- Playwright: delay `**/api/my/progress` by 2000ms. During the delay
  `[data-slot="dashboard-skeleton"][aria-busy="true"]` is visible and the hero placeholder's
  computed `background-color` already resolves to `oklch(0.2692 0.0871 263.0388)` (no white flash).
- Layout stability: capture `[data-slot="dashboard-overview"]`'s bounding box during loading and
  after resolve at 1280px — vertical difference < 24px. Capture screenshots of both to
  `.qa/screenshots/`.
- Exactly one `[aria-live]` region on the page while loading.
- Reduced motion ⇒ every shimmer/pulse element's `animation-name` is `none`.
- axe clean in the loading state.
- 375px loading state: no horizontal overflow; sections stack in the final order.
- Six catalogs key-identical; zero banned-pattern hits.

## Assumptions
- `Common.loading` exists in all six catalogs (it is used by today's skeleton).

## Evidence
<filled in as the task runs>
