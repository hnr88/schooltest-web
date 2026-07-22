---
id: 30
title: Compact image-led school cards with an expanded map
layer: ui
kind: fix
slice: school result presentation using live search data
target: src/modules/school-search/components/{SchoolCard,SchoolsSplitLayout,SchoolResultsGrid}.tsx; src/app/globals.css if layout utility is needed; tests/e2e/school-search-presentation.spec.ts
contract: C-SEARCH-SCHOOLS
status: DONE
depends_on: [29]
---
## Objective

Make school results compact and attractive with a meaningful decorative image treatment, and
make the live map visually dominant enough to be useful on desktop.

## Contract

Consumes the unchanged typed school search response. Card/map hover and pin synchronization
continues to operate on the exact returned `documentId` records; no image field is fabricated.

## Files

The named school-search components, existing product image asset only, optional token utility,
and focused E2E screenshots/assertions.

## Depends on

Task 29 establishes final shell contrast for the surrounding dashboard.

## Steps

1. Exercise existing school search against the live API and record returned fields.
2. Redesign cards as compact image-led presentation with product-owned decorative imagery and
   accessible empty alt treatment; preserve real school text/tuition/badges.
3. Widen/tallify the desktop map split using design-system-safe styling; retain mobile sheet.
4. Verify results, map markers, card hover sync, desktop/mobile layout and no horizontal scroll.

## Project rules

Use Next Image and existing design-system components; data remains through the existing query
hook and no hard-coded school records may enter the rendered path.

## Done criteria

Live cards show real result details with visual imagery, the desktop map is expanded, searching
and map/card sync work after reload, and the focused browser test passes.

## Assumptions

`/brand/hero-field.webp` is a product decorative image because no per-school image exists.

## Evidence

Builder proof: the new presentation E2E initially failed because school cards contained zero
images; it passed after adding the explicitly decorative existing product image and changing the
desktop split to equal result/map columns. Independent sequential verification: `pnpm exec
playwright test tests/e2e/school-search-presentation.spec.ts tests/e2e/school-map.spec.ts
--project=chromium` passed 8/8 against the live :3100/:5500 stack. It proved image/card/map
presentation, real map clusters, card↔pin synchronisation, map toggle, mobile map sheet, SSR
safety, reduced motion and axe serious/critical cleanliness. `pnpm tsc --noEmit`, `pnpm lint`
(0 errors; unchanged warning), and `git diff --check` passed.
