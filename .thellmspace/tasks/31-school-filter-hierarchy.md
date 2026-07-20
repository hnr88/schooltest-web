---
id: 31
title: Group school filters into a clear hierarchy
layer: ui
kind: fix
slice: school filter selection and search request wiring
target: src/modules/school-search/components/{SchoolsPane,SchoolFilterChips,SchoolFilterPanel}.tsx; src/modules/school-search/index.ts; messages/*.json; tests/e2e/school-filter-panel.spec.ts
contract: C-SEARCH-SCHOOLS
status: DONE
depends_on: [30]
---
## Objective

Replace the crowded school filter chip wall with an accessible grouped filter panel while
preserving every existing filter and its live search effect.

## Contract

The existing school request schema remains exact: state, sector, school type and availability
filters mutate the existing Zustand store and the query hook sends the same typed request.

## Files

The named module components/barrel, six locale catalogs, and the focused E2E spec.

## Depends on

Task 30 completes the school result layout that owns the filter panel placement.

## Steps

1. Add translation keys with six-locale parity.
2. Build a labelled trigger and grouped sections for location, school type/sector and features.
3. Retain fee, sort, map and mobile-map affordances without duplicate controls.
4. Browser-test grouped hierarchy, keyboard use, real query requests and result changes.

## Project rules

Use existing popover/button/filter primitives through module wrappers; no raw fetch or UI
primitive edits.

## Done criteria

All existing filters are reachable in logical groups, screen-reader labels are present, a real
selection changes live results, and mobile/desktop E2E passes.

## Assumptions

The established store actions are the authoritative filter mutation API.

## Evidence

Builder proof: the new test initially timed out looking for the absent Filters trigger. The
grouped panel now renders Location, School profile and Features headings and sends a real QLD
query. Independent sequential verification: `pnpm exec playwright test
tests/e2e/school-filter-panel.spec.ts tests/e2e/unified-search.spec.ts
tests/e2e/school-map.spec.ts --project=chromium` passed 12/12 (one documented skipped test)
against live web/API data. It proved grouped keyboard-accessible controls, real POST request,
clear state, panel axe, original search pagination, map/card sync and mobile map behaviour.
Six-locale key parity is 710 × 6; `pnpm tsc --noEmit`, `pnpm lint` (0 errors; unchanged warning)
and `git diff --check` passed.
