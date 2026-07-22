---
id: 173
title: Build the children-list shimmer skeleton and the error/retry state
layer: ui
kind: build
slice: The two non-success states of the card grid — a card-shaped shimmer while both queries load, and a real retry when either fails.
target: src/modules/children/components/ChildrenRosterSkeleton.tsx, src/modules/children/components/ChildrenScreen.tsx, src/i18n/messages/*.json
contract: C-STUDENT-LIST · C-DASH-HOUSEHOLD (401/403/network)
design: .qa/design/screens/app--loading-skeleton.html · .qa/design/spec/02-portal-children.md §ANIMATIONS AN-1
status: TODO
depends_on: ["167"]
---

## Objective

While the list loads, show the design's shimmer in the shape of the new card; when either query
fails, show one alert with a working retry instead of an empty grid.

## Contract

Both `C-STUDENT-LIST` and `C-DASH-HOUSEHOLD` can answer `401` (token cleared by the axios response
interceptor, `src/lib/axios/strapi.ts:45-53`) or `403` (non-parent). The screen must not blank; the
existing `Children.errorTitle` + `Common.errorDescription` + `Children.retry` alert is preserved and
re-dressed. `refetch()` re-issues BOTH queries (the `Promise.all` in `use-children-list.ts`).

## Design source

`.qa/design/spec/02-portal-children.md` AN-1, quoting `SchoolTest App Screens.dc.html` L20:

```
@keyframes st-shimmer { 0% { background-position: -400px 0; } 100% { background-position: 400px 0; } }
```

applied as `animation: st-shimmer 1.4s linear infinite` over
`linear-gradient(90deg,#F1F5F9 25%,#E9EEF6 50%,#F1F5F9 75%); background-size:800px 100%`.
The spec's own instruction for this screen: "Reuse this for the children-list and child-detail
loading states: **52px circle** for the card avatar, **60%x16px + 40%x13px** bars for name/meta,
**three 66px tiles** for the metric strip." Card chrome is the same as task `167`
(`rounded-3xl`, `p-7`, `--shadow-portal-card`).

`.qa/design/spec/04-ds-foundations.md` §I: `st-shimmer` animates `background-position`, which
`.claude/rules/tailwind.md:19` forbids — **use the compliant substitute**: a `translateX` overlay
element inside the placeholder, i.e. the repo's existing `@utility shimmer-sweep` in `globals.css`
(tokens `--color-skeleton-base` / `--color-skeleton-sheen`), duration `1400ms`, `linear`, infinite.

## Files

- `ChildrenRosterSkeleton.tsx` — three card placeholders in `grid-cols-child-cards`.
- `ChildrenScreen.tsx` — state branching order: loading → error → empty → grid.
- Catalogs: reuse `Children.errorTitle`, `Children.retry`, `Common.errorDescription`; add
  `Children.loadingLabel` for the `aria-busy` region label.

## Depends on

- `167` — the skeleton must be the same geometry as the real card.

## Steps

1. Skeleton container: `role="status"`, `aria-busy="true"`, `aria-label={t('loadingLabel')}`,
   individual placeholders `aria-hidden`.
2. Three cards, each: 52px circle + 60%x16px + 40%x13px bars + three 66px tiles (`h-16.5` via the W0
   token or the nearest 4pt `h-16`), matching the real card's 28px padding and 22px gaps.
3. Error branch: keep the existing `Alert variant="error"` with the `Button` retry (`loading={isFetching}`)
   so the current behaviour and its i18n keys survive; re-dress to the portal card radius.
4. Prove the retry: intercept `GET /api/my/progress` with a `500` once, assert the alert, release the
   route, click retry, assert the grid renders.

## Project rules

- `.claude/rules/tailwind.md:19` — transform/opacity only; the shimmer is a translated overlay.
- `.qa/DECISIONS.md` D-DESIGN-3 — every animation ships a `prefers-reduced-motion` variant.
- `.claude/rules/quality.md` — `role="status"` region, no layout shift between skeleton and content.

## Done criteria

- `pnpm tsc --noEmit` + `pnpm lint` clean.
- Playwright: with the household route delayed, three shimmer cards are visible and
  `aria-busy="true"`; after the response they are replaced by the real cards with no layout shift
  (bounding box of the first card within 2px before/after).
- Intercepted `500` on either endpoint renders `Children.errorTitle` + a working `Children.retry`
  that re-issues both requests (network log shows two new requests).
- Under `reducedMotion: 'reduce'` the shimmer element has no running animation
  (`getAnimations().length === 0`).
- 375px + 1280px both render the skeleton in the same track count as the real grid; no h-scroll.
- axe zero serious/critical in the loading and error states; six catalogs key-identical.

## Assumptions

`@utility shimmer-sweep` already exists in `globals.css`; W0 may retune its tokens — use it, do not
re-implement a second shimmer.

## Evidence

<!-- filled in as the task runs -->
