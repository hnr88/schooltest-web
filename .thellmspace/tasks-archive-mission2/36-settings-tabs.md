---
id: 36
title: Separate authentication, search and children settings tabs
layer: frontend
kind: implement
slice: settings navigation and existing preference surfaces
target: src/app/[locale]/dashboard/settings/page.tsx; src/modules/settings/**; src/modules/search-preferences/**; src/modules/children/**; messages/*.json; tests/e2e/settings-tabs.spec.ts
contract: C-SEARCHPREF-GET, C-SEARCHPREF-UPDATE, C-STUDENT-LIST
status: DONE
depends_on: [35]
---
## Objective

Create a clear settings page with separate Auth, Search and Children tabs, using the existing
change-password, search-preference and child-management data paths rather than duplicating them.

## Contract

Auth retains its existing password-change contract. Search reads/writes C-SEARCHPREF-GET and
C-SEARCHPREF-UPDATE exactly; Children reads C-STUDENT-LIST and navigates real
management/profile surfaces. Notification settings are reserved for the following slices.

## Files

The named settings page/module and query surfaces, six locale catalogs, and focused E2E.

## Depends on

Task 35 supplies the child profile/management destination used by the Children tab.

## Steps

1. Parse the strict C-SEARCHPREF GET/PUT envelopes through a settings-module query/mutation.
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

Live browser proof: `pnpm exec playwright test tests/e2e/settings-tabs.spec.ts --workers=1`
passed 3/3 against web :3100 and API :5500. It proved URL-addressable, keyboard-operable
Auth/Search/Children tabs; a real C-SEARCHPREF-UPDATE persisted through reload then restored;
and a real auth-tab password update returned 200 before the dedicated seeded test account was
restored through the authenticated production API and logged in again with its original password.
`pnpm tsc --noEmit` passed; `pnpm lint` passed with zero errors and the one pre-existing
`CreateArticleForm.tsx` React Compiler warning.
