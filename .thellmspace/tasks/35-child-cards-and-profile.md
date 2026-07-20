---
id: 35
title: Child cards and detailed profile metrics page
layer: frontend
kind: implement
slice: My Children redesign and child profile route backed by progress API
target: src/app/[locale]/dashboard/children/[documentId]/page.tsx; src/modules/children/{components,queries,schemas,types,index.ts}; messages/*.json; tests/e2e/children-profile.spec.ts
contract: C-PARENT-CHILD-PROGRESS
status: DONE
depends_on: [34]
---
## Objective

Replace the unattractive child list with useful responsive child cards and link each card to an
inner profile displaying real test results and metrics from the new parent-owned API.

## Contract

The child profile query parses `C-PARENT-CHILD-PROGRESS` without reshaping it. Card list keeps
the existing real child list/archive/edit actions; the new detail route handles loading, empty,
error and ownership/not-found responses honestly.

## Files

The named App Router page, children module components/query/schema/type/barrel, six locale
catalogs, and focused real E2E spec.

## Depends on

Task 34 provides the exact parent-safe, persistent API contract.

## Steps

1. Define runtime Zod parse and typed query through existing Axios infrastructure.
2. Replace the table presentation with compact cards while retaining current actions.
3. Add the inner profile route with metric cards and recent official-result summaries.
4. Prove child navigation, metric rendering, foreign-not-found behaviour and reload persistence.

## Project rules

Server route shell with client state only where needed; no raw fetch, no fabricated metrics,
no primitive edits, and six-locale parity.

## Done criteria

Each real child card has an accessible detail link; the profile renders persisted test metrics
and results after reload; responsive/a11y E2E, tsc and lint pass.

## Assumptions

Existing archive/edit behaviour remains in scope and must be preserved rather than removed.

## Evidence

PASS — live browser/API verification on 2026-07-20. The profile query strictly parsed the
real `GET /api/my/students/:documentId/progress` response (200), rendered Mia Keller's
persisted zero metrics and the truthful no-results state, and rendered the same data after a
reload. A fresh parent received the real 404 for Mia's foreign profile and the UI showed its
access error. Playwright: `children-profile` 3/3 (desktop axe, mobile no-overflow, foreign
404), `dashboard-students` 2/2 (archive/unarchive DB proof + edit), and `students-list` 8/8
(cards, empty state, six locales). `pnpm tsc --noEmit` passed; `pnpm lint` had zero errors
and its one existing CreateArticleForm warning. Visual screenshot:
`.qa/screenshots/child-profile-en.png`.
