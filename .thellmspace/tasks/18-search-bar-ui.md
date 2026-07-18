---
id: 18
title: Dashboard — global search bar + results
layer: frontend
kind: build
slice: debounced search input hitting C-STUDENT-SEARCH with a results dropdown
target: src/modules/dashboard/{components/DashboardSearch.tsx,queries/use-search-students.query.ts}
contract: C-STUDENT-SEARCH
status: TODO
depends_on: [11, 16]
---
## Objective
The borrowed global search, our design (D8):
- DashboardSearch (client) in the dashboard header: DS InputGroup with search icon +
  placeholder (Dashboard.searchPlaceholder) + clear button; 300ms debounced query state.
- use-search-students.query.ts: GET /api/search/students?q= when debounced value
  changes (enabled always — empty q returns recents per contract); zod-parsed.
- Results: DS-styled dropdown panel below the field (Popover? simplest honest: an
  absolutely-positioned card list under the input, focus/blur managed, Escape closes,
  arrow-key navigable — or reuse cmdk? KEEP SIMPLE: popover list with button rows,
  full keyboard support via the primitive where possible), each row: student name +
  year level + email; click → nothing yet? — no student detail page exists: keep the
  click selecting the student into the list filter? NO INVENTION: rows are
  informational + a "view in list" action that scrolls/highlights? — DECIDE: clicking a
  result filters the students table to that student (sets a local filter state in the
  dashboard store); a "no results" translated empty row when count 0.
## Files
- the above + stores/use-dashboard-search.store.ts (query + selected filter),
  messages keys
## Done criteria
- REAL: type "mia" → only Mia shows in results; click her → the students table shows
  only Mia; clear → all students back; type "zzz" → translated no-results; Escape closes
  the panel; tsc+lint zero; axe clean; parity.
## Evidence
(filled by builder/verifier)
