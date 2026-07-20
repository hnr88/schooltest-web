---
id: 44
title: Redesign My Children and the individual learning dashboard
layer: frontend
kind: fix
slice: child collection and a distinct assessment-progress detail surface
target: src/modules/children/**; messages/*.json; tests/e2e/children-profile.spec.ts
contract: C-STUDENT-LIST, C-PARENT-CHILD-PROGRESS, C-UI-CHILD-LEARNING-SURFACE
status: DOING
depends_on: [43]
---
## Objective

Replace the generic-looking My Children cards and visually duplicated inner dashboard with a
clear profile collection and a separate, data-led learning progress surface.

## Contract

Consume C-STUDENT-LIST and C-PARENT-CHILD-PROGRESS exactly under C-UI-CHILD-LEARNING-SURFACE.
Only real child/session/result values may appear. Completion is calculated only from actual
`completedSessions` and `totalSessions`; absent assessment data has an explicit empty state.

## Files

Children module components/lib/types where needed, six locale catalogs, and focused E2E.

## Depends on

Task 43 settles the broader dashboard visual system and search workspace before child-specific
information hierarchy is rebuilt.

## Steps

1. Capture red desktop/mobile browser expectations that distinguish the child profile from the
parent overview and preserve real links/actions.
2. Recompose My Children as profile cards with clear progress context and existing edit/archive
actions, without reintroducing a list/table presentation.
3. Recompose the detail route as a learning snapshot plus chronological results stream and real
completion signal, using installed Card, Badge, ProgressBar and EmptyState primitives.
4. Re-run ownership/error/reload/mobile/axe checks and verify there are no fabricated scores or
duplicate dashboard elements.

## Project rules

Read all applicable web module/state/next/tailwind/i18n/testing/quality rules. Use the children
module barrel, typed query hooks, design-system wrappers and no raw fetch/primitive edit.

## Done criteria

Browser E2E proves child cards lead to a visually distinct detail page, real metrics/results
survive reload, foreign access remains safe, controls remain usable, and tsc/lint are zero-error.

## Assumptions

No new learning data model is required: existing API metrics and result ordering are sufficient
for an honest progress composition.

## Evidence

Pending.
