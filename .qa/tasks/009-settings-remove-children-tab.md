---
id: 009
title: Remove the children tab from settings
layer: frontend
kind: fix
slice: settings menu without children settings
target: schooltest-web/src/modules/settings
contract: n/a
status: TODO
depends_on: []
---
## Objective
User: "remove the children settings from the settings menu." The children tab duplicates
the My children sidebar page. Remove it end to end.
## Files
- constants/settings.constants.ts (drop 'children' from SETTINGS_TABS + SETTINGS_TAB_CONFIG)
- types/settings.types.ts (union member), components/SettingsScreen.tsx (SETTINGS_PANELS)
- DELETE components/ChildrenSettingsPanel.tsx + ChildSettingsRow.tsx
- src/i18n/messages/*.json (prune Settings.tabs.children + childrenSettings* keys, 6 catalogs)
- tests/e2e/settings-tabs.spec.ts:93-100 (remove children-tab assertions)
## Done criteria
- ?tab=children falls back to default tab; only auth/search/notifications tabs render;
  tsc + lint clean; settings-tabs spec updated and green.
