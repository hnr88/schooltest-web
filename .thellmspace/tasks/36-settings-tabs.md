---
id: 36
title: Separate authentication, search and children settings tabs
layer: frontend
kind: implement
slice: settings navigation and existing preference surfaces
target: src/app/[locale]/dashboard/settings/page.tsx; src/modules/settings/**; src/modules/search-preferences/**; src/modules/children/**; messages/*.json; tests/e2e/settings-tabs.spec.ts
contract: C-STUDENT-LIST, C-PREF-GET
status: TODO
depends_on: [35]
---
## Objective

Create a clear settings page with separate Auth, Search and Children tabs, using the existing
change-password, search-preference and child-management data paths rather than duplicating them.

## Contract

Auth retains its existing password-change contract. Search reads/writes the existing validated
search preferences contract; Children reads the parent-scoped child list and navigates real
management/profile surfaces. Notification settings are reserved for the following slices.

## Files

The named settings page/module and query surfaces, six locale catalogs, and focused E2E.

## Depends on

Task 35 supplies the child profile/management destination used by the Children tab.

## Steps

1. Inspect existing search-preference API/query conventions.
2. Build accessible URL-addressable tabs with existing design-system patterns.
3. Wire Auth, Search and Children tabs to real modules and real form/query states.
4. Browser-test tab navigation, query persistence after reload and keyboard semantics.

## Project rules

Use module barrels, RHF/Zod, typed queries and next-intl; do not hard-code a second settings
data model.

## Done criteria

All three named tabs visibly exist and perform their real operations; preference writes persist
through reload, and responsive E2E/tsc/lint pass.

## Assumptions

The existing search-preferences backend is the intended Search configuration authority.

## Evidence

Pending independent verification.
