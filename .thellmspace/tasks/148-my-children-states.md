---
id: 148
title: "My children" list loading, single-child and error behaviour
layer: ui
kind: implement
slice: The non-happy states of the "My children" section
target: src/modules/dashboard/components/DashboardChildrenSkeleton.tsx, src/modules/dashboard/components/DashboardChildrenPanel.tsx
contract: C-DASH-HOUSEHOLD
design: .qa/design/spec/01-portal-dashboard.md#UNKNOWNS · .qa/design/spec/06-auth-states-landing.md
status: TODO
depends_on: ["145", "146", "147"]
---

## Objective
The list's loading skeleton, its one-row case, and the guarantee that it never renders a partial or
stale roster. Spec §UNKNOWNS: "No zero-children, zero-results, zero-schools, or error state exists
in these files" — these are authored.

## Contract
`C-DASH-HOUSEHOLD` → `children[]`. `childCount === 0` is handled by **139** (the whole page becomes
the first-run state), so this section's own empty case cannot occur while `childCount > 0`. If it
somehow does — `childCount > 0` with `children: []` — render the 139 empty card inside the list
rather than an empty white box, and log nothing to the console.

## Design source
- **Loading.** The section header (`h2` + "See details →") renders as real copy immediately — it is
  static and must not shimmer, and the link must stay usable while data loads. The card renders
  **two** skeleton rows (the design's own example count) using the existing `shimmer-sweep` utility:
  - avatar block `size-11 rounded-full shimmer-sweep`
  - name block `w-48` containing `h-4 w-24 rounded-md shimmer-sweep` over
    `h-3 w-32 rounded-md shimmer-sweep`
  - strip block `h-1.5 flex-1 rounded-full shimmer-sweep`
  - pill block `h-6 w-24 rounded-full shimmer-sweep`
  Same `py-5` + `border-b` rhythm as a real row so the swap does not jump.
  Card gets `aria-busy="true"`; the skeleton rows are `aria-hidden="true"`.
- **One child**: the single row renders with no bottom border (`last:border-b-0` from 145 already
  does this) and the card does not stretch — no filler row, no "add another child" row inserted
  into the list (that CTA belongs to the children page, not here).
- **Error**: this section shares the hero's single request, so on error it does not mount — 155's
  page error state replaces the stack. Assert count 0, and assert no stale rows survive a failed
  refetch (TanStack keeps previous data by default on refetch; on a hard error state the section
  must not show yesterday's roster next to an error banner).
- Motion: `shimmer-sweep` only (already reduced-motion safe); the real list fades in with
  `animate-in fade-in duration-200 ease-out-expo motion-reduce:animate-none`.

## Files
- CREATE `src/modules/dashboard/components/DashboardChildrenSkeleton.tsx`.
- EDIT `DashboardChildrenPanel.tsx` — branch on the 130 state.

## Depends on
- **145**, **146**, **147** — the row shape the skeleton must mirror.

## Steps
1. Build the two-row skeleton mirroring the real row's box model.
2. Branch the panel; add `aria-busy` + `aria-hidden`.
3. Prove the error branch unmounts the section.

## Project rules
- `.claude/rules/quality.md` — skeletons hidden from AT; loading announced once, at the page level.
- `.claude/rules/tailwind.md` — reuse `shimmer-sweep`; no second shimmer implementation.
- `.claude/rules/state-data.md` — no `useState` mirror of query state in the component.

## Done criteria
- `pnpm tsc --noEmit` + `pnpm lint` clean.
- Playwright: delay `**/api/my/progress` 1500ms ⇒ `[data-slot="dashboard-profile-roster"]` has
  `aria-busy="true"` and exactly 2 skeleton rows and 0 `[data-slot="dashboard-child-row"]`; after
  resolve, `aria-busy` is gone and the real row count equals `children.length`.
- Layout stability: the card's `getBoundingClientRect().height` before and after the swap differs by
  less than 8px when the live family has 2 children (no visible jump).
- One-child stub ⇒ 1 row, no bottom border on it (`border-bottom-width: 0px`).
- Error stub (500) ⇒ `[data-slot="dashboard-profile-roster"]` count 0 and no
  `[data-slot="dashboard-child-row"]` anywhere on the page.
- Reduced motion ⇒ skeleton `animation-name: none`, `background-image: none`.
- axe clean while loading AND loaded; 375px in both states, no horizontal overflow.
- Six catalogs key-identical; zero banned-pattern hits.

## Assumptions
- The seeded parent has ≥1 child, so the loaded path is proven live and the edge cases by stubs.

## Evidence
<filled in as the task runs>
