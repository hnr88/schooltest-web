---
id: 193
title: Build the child-detail skeleton, error and gone states
layer: ui
kind: build
slice: The three non-success states of the detail route — shimmer stack while loading, retryable error, and the calm 404 for a removed or foreign child.
target: src/modules/children/components/ChildProfileSkeleton.tsx, src/modules/children/components/ChildProfileScreen.tsx, src/modules/query-errors (consumer only)
contract: C-PARENT-CHILD-PROGRESS (404) · C-DASH-HOUSEHOLD · C-CHILD-RESULT-HISTORY (404)
design: .qa/design/screens/app--loading-skeleton.html · .qa/design/spec/02-portal-children.md §ANIMATIONS AN-1 · .qa/design/screens/app--404.html
status: TODO
depends_on: ["178", "181", "185", "190"]
---

## Objective

Never show a half-built detail page: shimmer the whole stack while the three reads land, offer a real
retry on failure, and keep the existing gone-state for a child that is not the caller's.

## Contract

`C-PARENT-CHILD-PROGRESS`: "unknown and foreign records both return `404` to avoid ownership
disclosure". `C-CHILD-RESULT-HISTORY`: `404` for unknown or foreign child, `403` for a non-parent role.
`C-DASH-HOUSEHOLD`: `403` for a non-parent (`'Only parents can view household progress'`).

The existing behaviour that must survive (`tests/e2e/children-profile.spec.ts:186-204`):
`[data-slot="query-error-fallback"][data-query-error="gone"]`, the visible
`Children.profileGoneTitle`, and the `Children.backToList` link.

## Design source

`.qa/design/spec/02-portal-children.md` AN-1 — reuse `st-shimmer` (1.4s linear infinite) for the
child-detail loading state, implemented as the repo's transform-based `@utility shimmer-sweep`
(`.claude/rules/tailwind.md:19` forbids animating `background-position`).
Skeleton geometry mirrors the real stack: 60px circle + 320x28 title bar + 420x16 meta bar (header),
one 5-cell KPI card, two 380px-min cards, and three 44px rows in the results card — each inside the
real card chrome (`rounded-3xl`, `--shadow-portal-card`) so nothing shifts on swap.
The gone state uses `app--404.html`'s centred composition ported to the portal chrome.

## Files

- `ChildProfileSkeleton.tsx` — rebuilt to the new stack.
- `ChildProfileScreen.tsx` — branch order: loading → gone (404) → error (other) → content.
- The existing `QueryErrorFallback` from `@/modules/query-errors` is reused via its barrel, unchanged.

## Depends on

- `178`, `181`, `185`, `190` — the blocks whose geometry the skeleton mirrors.

## Steps

1. The skeleton is one `role="status" aria-busy="true"` region; its shapes are `aria-hidden`.
2. A `404` from EITHER `/progress` or `/results` resolves to the gone state (not a generic error), and
   `classifyQueryError` keeps returning `gone` so the existing `data-query-error` attribute is right.
3. A `403` from `/my/progress` degrades gracefully: the page still renders the student's record and
   results, with the household-derived cells showing their honest unassessed strings — one failing
   secondary read must not blank the page.
4. Any other failure renders the retry alert (`Children.errorTitle` + `Children.retry`) that re-issues
   all three reads.
5. No layout shift: assert the first card's bounding box is within 2px before and after the swap.

## Project rules

- `.claude/rules/tailwind.md:19` — transform/opacity only.
- `.qa/DECISIONS.md` D-DESIGN-3 — reduced-motion variant for every animation.
- `.claude/rules/quality.md` — `role="status"`, focus order preserved across the swap.

## Done criteria

- `pnpm tsc --noEmit` + `pnpm lint` clean.
- Playwright: with `/progress` delayed, the skeleton stack is visible and `aria-busy="true"`;
  after resolution no layout shift beyond 2px.
- Foreign child → `404` → `[data-query-error="gone"]` + `Children.profileGoneTitle` +
  `Children.backToList` (the existing third test in `children-profile.spec.ts` passes unchanged).
- Intercepted `403` on `/my/progress` only: the page still renders the name, record and results.
- Intercepted `500`: the retry alert appears and retry re-issues all three requests.
- Under `reducedMotion: 'reduce'` the shimmer has zero running animations.
- 375px + 1280px correct; axe zero serious/critical in all three states.

## Assumptions

`classifyQueryError` already maps `404` → `gone`; no change to `@/modules/query-errors` is needed.

## Evidence

<!-- filled in as the task runs -->
