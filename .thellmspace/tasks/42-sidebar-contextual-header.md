---
id: 42
title: Restore collapsible dark navigation and contextual dashboard header
layer: ui
kind: fix
slice: dashboard sidebar behavior and left-aligned breadcrumb/title header
target: src/modules/shell/**; src/app/[locale]/dashboard/layout.tsx; messages/*.json; tests/e2e/shell.spec.ts
contract: C-UI-SHELL-NAV
status: DONE
depends_on: [36]
---
## Objective

Make the dark primary sidebar useful again: it must collapse on desktop, open as a sheet on
mobile, retain its visible branded logo when expanded, and be accompanied by a purposeful
left-side contextual header with breadcrumb and current page title.

## Contract

Implement C-UI-SHELL-NAV exactly: existing SidebarProvider state, desktop icon-collapse and
Ctrl/Cmd+B, mobile off-canvas behavior, catalog-sourced breadcrumb/title, and user menu on the
right. No backend request or persistence change is allowed.

## Files

AppSidebar, AppTopbar, route-title/breadcrumb helper/constants, locale catalogs, dashboard
layout if required, and focused browser E2E.

## Depends on

Task 36 is complete; this task corrects the surrounding shell before the higher-density
dashboard surfaces are redesigned.

## Steps

1. Write the focused failing browser assertions for desktop toggle, mobile sheet, logo, and
   breadcrumb/title semantics.
2. Use the installed sidebar primitives in their documented collapsible mode; do not edit the
   read-only primitive implementation.
3. Derive every route label through shell constants and `next-intl`, then render a labelled
   breadcrumb and page title in the top bar.
4. Verify at desktop and mobile sizes, keyboard shortcut/trigger behavior, logo visibility,
   zero console errors and serious/critical axe findings.

## Project rules

Read `schooltest-web/.claude/rules/module-pattern.md`, `nextjs-patterns.md`, `i18n.md`,
`tailwind.md`, `testing.md`, and `quality.md`. Reuse design-system Sidebar, SidebarTrigger,
Breadcrumb and Logo only; no primitive edits or hard-coded route copy.

## Done criteria

Live Playwright proves the sidebar toggles and remains dark/branded, contextual header labels
match the real current route, mobile navigation works, and tsc/lint are zero-error.

## Assumptions

The existing sidebar provider is the authoritative local interaction state, as confirmed by
the installed primitive and current shadcn sidebar guidance.

## Evidence

Live browser proof: `pnpm exec playwright test tests/e2e/shell.spec.ts --project=chromium
--workers=1` passed 6/6 and `shell-a11y.spec.ts` passed 2/2 against web :3100/API :5500.
The desktop trigger collapsed the real sidebar from 248px to 48px, preserved its visible logo
mark and accessible nav labels, then Ctrl+B restored it. Mobile still opened/closed the real
sheet. The header test proved the Dashboard breadcrumb and current title on My Children.
Screenshots: `.qa/screenshots/shell-desktop.png` and `shell-desktop-collapsed.png`.
`pnpm tsc --noEmit`, `pnpm lint` (zero errors; one pre-existing warning), locale parity, and
`git diff --check` passed.
