---
id: 011
title: Rewrite search settings into options that make sense AND apply
layer: frontend
kind: fix
slice: settings > search tab rewrite
target: schooltest-web/src/modules/settings + school-search/agent-search stores
contract: C-SEARCH-PREFS (GET/PUT /api/search-preferences/me)
status: TODO
depends_on: []
---
## Objective
User: "rewrite the search settings they are garbage make nonsense." Root problem found in
exploration: the saved preferences are WRITE-ONLY — nothing consumes them. Rewrite the tab
to a small, sensible set (default states, default sort, results per page — drop the odd
fee-range defaults) and make the school/agent search actually APPLY the saved defaults.
## Files
- settings/components/SearchPreferencesForm.tsx + SearchPreference*Fields.tsx (rebuild panel)
- settings/schemas/search-preferences.schema.ts (trim to the sensible set)
- school-search/stores/use-school-search-store.ts + agent-search store (hydrate defaults
  from useSearchPreferencesQuery on first load when the user has not chosen filters)
- i18n 6 catalogs (new clear copy, e.g. "Default states", "Default sort", "Results per page")
- tests/e2e/settings-tabs.spec.ts search-prefs block (:110-152)
## Constraints
- Keep PUT /api/search-preferences/me contract fields (backend schema unchanged); omitted
  fields simply stay server-default. No backend change.
## Done criteria
- Saving defaults then opening /dashboard/search shows them applied; changing + saving
  persists across reload (real PUT verified); specs green.
