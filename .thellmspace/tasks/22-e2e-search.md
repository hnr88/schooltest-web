---
id: 22
title: E2E — global search filters results
layer: integration
kind: verify
slice: C-STUDENT-SEARCH through the dashboard search bar
target: tests/e2e/dashboard-search.spec.ts
contract: C-STUDENT-SEARCH
status: DONE
depends_on: [18]
---
## Objective
Login as parent → type "mia" in the search field → results panel shows Mia only (not
Jonas) → click the result → students table filtered to Mia → clear → both students
back → type "zzz" → translated no-results row → Escape closes the panel. Route-watcher
asserts GET /api/search/students?q=mia fired.
## Done criteria
- Spec green; debounce respected (the watcher fires once for the settled value).
## Evidence
Independently verified 2026-07-18 (independent explore verifier — did not build this).
- File created by the builder: tests/e2e/dashboard-search.spec.ts (new, only file
  touched — git status confirmed zero backend changes in schooltest-api and zero other
  web source edits beyond earlier sessions' pre-existing uncommitted diffs).
- curl C-STUDENT-SEARCH live against :5500 with the seeded parent's own fresh JWT:
  q=mia → exact `{data:[Mia Keller],meta:{query:{q:'mia',count:1}}}`; q= (empty) → both
  students desc by createdAt (Jonas then Mia); q=zzz →
  `{data:[],meta:{query:{q:'zzz',count:0}}}`; unauth → 403 (pre-existing D15 masked-403
  install quirk, same as tasks 15-21, non-blocking).
- Ran tests/e2e/dashboard-search.spec.ts myself (not the builder's self-report):
  `pnpm exec playwright test tests/e2e/dashboard-search.spec.ts` → 1/1 passed;
  `--repeat-each=8` → 8/8 passed, zero flakes across 8 concurrent workers hitting the
  same seeded parent (search is read-only, no cross-worker interference).
- Full suite `pnpm exec playwright test` → 61/61 passed, zero regressions, matching the
  self-report exactly.
- Confirmed the spec's own route watcher independently proves the debounce contract:
  typing "mia" one keystroke at a time at 50ms delay (well under the 300ms debounce in
  use-debounced-value.ts) produces exactly ONE settled `GET /api/search/students?q=mia`
  on the wire, never one for the intermediate "m"/"mi" values; the wire response is
  asserted byte-exact against C-STUDENT-SEARCH; the results panel shows Mia only
  (Jonas absent); clicking the result narrows StudentsSection's real table to Mia only;
  Clear resets both the query and the table filter together; typing "zzz" round-trips
  the real `{data:[],meta:{query:{q:'zzz',count:0}}}` and renders the real translated
  Dashboard.noResultsTitle/noResultsSubtitle row; Escape unmounts
  `[data-slot="dashboard-search-panel"]` while preserving the typed query text; zero
  console/page errors throughout (watchErrors).
- Supplementary own throwaway axe spec (deleted after use, per the established
  disposable-probe pattern in tasks 16/21): a real @axe-core/playwright scan on the
  no-results ("zzz") panel state — a UI state task 18's own axe coverage had not
  explicitly exercised (task 18 scanned the populated-results state only) — zero
  violations of any severity.
- `pnpm tsc --noEmit`: 0 errors. `pnpm lint`: 0 errors (same 1 pre-existing unrelated
  React-Compiler warning in untouched CreateArticleForm.tsx documented in tasks 12-21's
  evidence). `pnpm exec prettier --check` on the new file: clean.
- Grepped the new file for mock/fake/stub/dummy/placeholder/hardcoded (case-insensitive):
  the only hit is the pre-existing i18n catalog key name `Dashboard.searchPlaceholder`
  (input placeholder copy) — zero mock/fake/stub/dummy/hardcoded-fixture hits.
- No new write path in this task (search is read-only, selection is client-only
  Zustand state), so no DB-persistence-across-reload check applies.
- Full evidence recorded in .qa/STATE.json task 22's `verify` object.
