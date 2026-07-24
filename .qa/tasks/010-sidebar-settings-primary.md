---
id: 010
title: Move Settings into the left/primary sidebar group
layer: ui
kind: fix
slice: sidebar Settings aligned like all other nav items
target: schooltest-web/src/modules/shell
contract: n/a
status: TODO
depends_on: []
---
## Objective
User: "move the settings to left like all the other elements in the dashboard." Settings is
the only group:'system' item, bottom-pinned by a flex-1 spacer under an "Account" label
(nav.constants.ts:38-44, AppSidebar.tsx:82-94). Move it into the primary group.
## Files
- shell/constants/nav.constants.ts (group: 'system' -> 'primary')
- shell/components/AppSidebar.tsx (drop the spacer/Account section if empty; keep UserMenu)
- i18n: prune Shell.sidebar.groups.account if unreferenced (6 catalogs)
- tests/e2e/shell.spec.ts (update placement assertions)
## Done criteria
- Settings renders in the same left nav list as Overview/My children/Search, not bottom-pinned;
  shell specs green; axe clean.
