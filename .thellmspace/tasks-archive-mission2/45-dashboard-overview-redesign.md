---
id: 45
title: Redesign the parent dashboard overview around real child context
layer: frontend
kind: fix
slice: parent dashboard information hierarchy and action surfaces
target: src/modules/dashboard/**; messages/*.json; tests/e2e/dashboard.spec.ts
contract: C-STUDENT-LIST, C-UI-DASHBOARD-OVERVIEW
status: DONE
depends_on: [44]
---
## Objective

Rebuild the parent dashboard so it feels like a calm overview and action hub, not another copy
of the child learning dashboard or a stack of generic cards.

## Contract

Implement C-UI-DASHBOARD-OVERVIEW from the existing typed student list only. Every profile,
total, plan state and CTA must be derived from persisted real data and point to live routes.

## Files

Dashboard module components/helpers/types if necessary, six locale catalogs, and focused E2E.

## Depends on

Task 44 establishes the child-specific visual vocabulary that this parent overview must not
duplicate.

## Steps

1. Capture browser expectations for contextual hierarchy, real profile summaries and working
   live actions.
2. Use installed design-system cards, empty states, badges and actions to create a compact
   parent-oriented composition distinct from the child assessment surface.
3. Preserve loading/error/retry and every existing Children/Search/Add navigation path.
4. Prove live data/reload, interaction, mobile/desktop no-overflow, axe and zero-error gates.

## Project rules

Read applicable web rules before edits; use module barrels, next-intl, typed queries and existing
design-system components only. Do not invent notifications, scores, activity, or extra APIs.

## Done criteria

Live E2E proves a redesigned, data-led overview that is visibly distinct from child detail,
with every action wired to a live route and no fake content.

## Assumptions

The parent overview remains read-only except for navigation to the existing add-child flow.

## Evidence

- TDD began with `dashboard.spec.ts` failing on the absent parent-overview slots.
- Live Chromium verification against `:3100` and the real Strapi/PostgreSQL data at `:5500`:
  dashboard, parent-auth, and parent-auth-errors suites pass 8/8. The dashboard test covers
  axe serious/critical cleanliness, a persisted profile link after reload, mobile no-overflow,
  and the live My Children action route.
- Parent-auth assertions now mirror the new family summary, plan board, and profile roster from
  the actual `/api/my/students` response. Its error cases were split into a focused 83-line spec;
  all touched components and test files are under the required limits.
- `pnpm tsc --noEmit` passes; `pnpm lint` has zero errors and only the known unrelated
  `CreateArticleForm.tsx` React Hook Form warning. Six-locale key parity passed. Independent
  adversarial review passed after catching and resolving the stale test-selector and file-size
  regressions. Screenshots: `.qa/screenshots/dashboard-en.png` and
  `.qa/screenshots/dashboard-mobile-actions-en.png`.
