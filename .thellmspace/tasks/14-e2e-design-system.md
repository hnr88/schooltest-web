---
id: 14
title: E2E — design-system showcase: every export renders, variants + interactions work
layer: integration
kind: verify
slice: Playwright specs for /design-system variants, props, interactions, locale toggle
target: tests/e2e/design-system.spec.ts
contract: C-E2E (E2E-DS-VARIANTS, E2E-DS-PROPS, E2E-LOCALE-TOGGLE)
status: DONE
depends_on: [07, 12]
---
## Objective
Prove every design-system export renders with all variant props on the real showcase page,
interactive demos actually work, props follow shadcn conventions (className merge), and the
locale toggle updates all content live.

## Contract (C-E2E entries 2, 5, 3)
1. Variants render: goto '/design-system' — assert all 9 section headings (from
   DesignSystem namespace); buttons: all 10 variants present (by accessible name +
   class/data checks: each variant button visible; loading button shows spinner + is
   disabled); badges: all variants + 3 status badges + count badge; alerts: 4 variants with
   titles; cards: 3 stat cards, 2 feature cards, empty state; forms: input/error/disabled,
   textarea, search, select, checkbox, radios, switches; data: tabs ×3, table with 4 rows,
   pagination, breadcrumb; feedback: 2 progress bars, skeleton, spinner; brand: 3 logo
   variants + 2 eyebrows.
2. Interactions: dialog opens on trigger, closes via cancel AND confirm; dropdown opens,
   items clickable; tooltip appears on hover AND focus; popover opens with title + copy
   button; segmented control switches aria-pressed/data-state; tag remove button removes
   the tag; alert dismiss hides the alert; tabs switch panels; FAQ-free (covered in 13).
3. Props/className merge: locate the element carrying the showcase's custom probe class
   (e.g. `ds-probe` on one Button) and assert computed background differs from the default
   variant — proves className merging is honored. (If no probe exists, add one in the
   showcase page in THIS task: a Button with className="ds-probe bg-teal-500".)
4. Locale toggle: on '/' scroll to footer, switch LocaleSwitcher en→de: assert hero h1
   text becomes de value WITHOUT full navigation (same URL), footer tagline de; switch
   back → en. Repeat the toggle on '/design-system' for the page title.
5. Zero console errors on both pages during all the above (attach console listener, fail
   on pageerror/console.error — filter benign Next dev warnings if any, list them in
   Evidence).

## Files
- CREATE tests/e2e/design-system.spec.ts (+ reuse helpers from task 13)
- Possibly EDIT showcase page (ds-probe class only).

## Steps
1. Write spec. 2. Run `pnpm exec playwright test tests/e2e/design-system.spec.ts`. 3. Fix
   forward until green (real fixes in components, never test weakening).

## Project rules
testing.md, quality.md; assertions read catalogs from messages JSONs (no duplicated copy).

## Done criteria
- All specs pass on the real app; every interaction proven (not just presence);
  verifier re-runs fresh and checks the spec asserts behavior, not only visibility.
## Assumptions
- LocaleSwitcher keeps its current Select-based UI (read src/modules/i18n first; the spec
  drives whatever control it renders).
## Evidence
PASS (independent verifier, 2026-07-17): fresh full suite 12/12 green; all interactions genuinely exercised; console guard zero-whitelist; locale toggle same-URL + content flip proven; production fixes (tooltip children, pagination→DS Button href, href props spread) all sound — pagination deviation ACCEPTED with C-PAGE-DS addendum; tsc 0, lint 0 errors.

(filled by builder/verifier)
