---
id: 29
title: Dark primary application sidebar
layer: ui
kind: fix
slice: dashboard navigation visual hierarchy
target: src/app/globals.css; src/modules/shell/components/AppSidebar.tsx; tests/e2e/sidebar-theme.spec.ts
contract: C-UI-SIDEBAR-DARK
status: DONE
depends_on: [28]
---
## Objective

Give the dashboard sidebar a dark primary background with accessible foreground, hover and
active navigation states, while retaining the existing responsive sidebar behaviour.

## Contract

No API change. The sidebar token family supplies dark background, readable text and distinct
active/focus states in the normal theme; navigation links keep their current routes.

## Files

The named token stylesheet, shell sidebar consumer, all locale catalogs only if labels change,
and its Playwright visual/accessibility coverage.

## Depends on

Task 28 keeps the auth branding hierarchy stable before shared logo/sidebar work.

## Steps

1. Capture the live sidebar colour/route baseline.
2. Adjust only application tokens and the shell wrapper/classes, never vendored sidebar UI.
3. Make the sidebar logo appropriate for the dark surface and retain visible keyboard focus.
4. Verify desktop and mobile navigation, computed contrast, axe and route links.

## Project rules

Use OKLCH design tokens and existing shell/design-system modules; never edit `src/components/ui/*`.

## Done criteria

The live dashboard shows a dark primary sidebar, active/hover/focus text remains readable,
mobile drawer still works, and focused E2E plus tsc/lint pass.

## Assumptions

Dark-mode sidebar tokens are a valid established visual reference; no new palette is invented.

## Evidence

Builder proof: the focused live shell assertion initially observed a white RGB maximum of 255;
after the token/shell change it observed a dark sidebar and passed. Independent sequential
verification: `pnpm exec playwright test tests/e2e/shell.spec.ts --project=chromium --grep
'sidebar: visible|aside hidden'` passed 2/2 against web :3100/API :5500, proving the dark
desktop sidebar plus mobile drawer navigation/Escape behaviour. `pnpm tsc --noEmit`, `pnpm
lint` (0 errors; unchanged CreateArticleForm warning) and `git diff --check` passed. The wider
shell suite has one stale unrelated expectation that `/dashboard/children` is a not-found route;
the live route already exists and its redesign is task 35, so this task leaves it intact.
