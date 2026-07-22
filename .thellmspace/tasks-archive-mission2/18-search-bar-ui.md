---
id: 18
title: Dashboard — global search bar + results
layer: frontend
kind: build
slice: debounced search input hitting C-STUDENT-SEARCH with a results dropdown
target: src/modules/dashboard/{components/DashboardSearch.tsx,queries/use-search-students.query.ts}
contract: C-STUDENT-SEARCH
status: DONE
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
Independently verified 2026-07-18 (independent explore verifier, evidence gathered
personally against the real live app — not from the builder's self-report):

- **Backend contract (curl, seeded parent JWT)**: `GET /api/search/students?q=mia` →
  exact CONTRACTS.md shape `{data:[Mia],meta:{query:{q:"mia",count:1}}}`; `q=` (empty)
  → both students, `createdAt` desc (Jonas then Mia) — the recents contract; `q=zzz` →
  `{data:[],meta:{query:{q:"zzz",count:0}}}`. Unauthenticated → 403 (pre-existing D15
  masked-403 install quirk, non-blocking — same as tasks 15-17).
- **Live browser proof the "always enabled" claim is real**: own ad-hoc Playwright run
  (not trusting the builder's comment) confirms simply focusing the empty search input
  — no typing — genuinely renders real recents (Jonas Keller, Mia Keller) from a live
  request, matching D8/the contract's "empty q returns recents" behavior.
- **E2E, run live myself**: `pnpm exec playwright test tests/e2e/dashboard-search-bar.spec.ts`
  → 2/2 passed; `--repeat-each=5` → 10/10 passed, zero flakes. Covers: type "mia" → only
  Mia in results, zero axe violations of ANY severity (not just serious/critical) on the
  open panel; click Mia → StudentsSection's table narrows to her, Jonas absent; Clear →
  both students back, input empty; type "zzz" → real translated no-results row
  (`noResultsTitle`/`noResultsSubtitle`); Escape → panel unmounts, query text preserved;
  a second test drives ArrowDown + Enter to select via keyboard only, confirmed via
  `aria-activedescendant` and the resulting single-row table.
- **Full regression**: `pnpm exec playwright test` → 54/54 passed, zero regressions
  (matches the builder's reported count).
- **Static checks**: `pnpm tsc --noEmit` clean; `pnpm lint` 0 errors (1 pre-existing
  unrelated warning in untouched `CreateArticleForm.tsx`); `pnpm exec prettier --check`
  on every touched file clean.
- **i18n parity**: independently recomputed via a flatten script — 360 keys × 6 locales
  (en/ko/ms/th/vi/zh), zero missing/extra. Independently confirmed via `git show` on the
  last commit (`8e867a2`) that `Dashboard.searchPlaceholder/clearSearch/noResultsTitle/
  noResultsSubtitle/yearLevelOption` and `Common.error` genuinely pre-existed before this
  task touched anything — the builder's "no i18n edits needed" claim is real, not a gap.
- **grep for fixtures**: `grep -rniE "mock|fake|stub|dummy|placeholder|hardcoded"` across
  every touched file → only benign hits (`placeholderData` TanStack Query API name, JSX
  `placeholder=`/`searchPlaceholder` i18n key).
- **Design-system compliance**: `InputGroup`/`InputGroupAddon`/`InputGroupButton`/
  `InputGroupInput` confirmed re-exported from the real `src/components/ui/input-group.tsx`
  primitive via `primitives.ts` (not a custom duplicate). No arbitrary Tailwind values or
  raw hex colors in touched files. Import rules followed (same-module direct imports,
  cross-module via the design-system barrel).
- **Write path**: none owned by this task — search is read-only and click-select is
  client-only Zustand state (no backend persistence), so no DB-persistence-across-reload
  check applies here.
- **Non-blocking nit** (documented, not a Done Criterion, not contract, not an automated
  lint gate): `StudentsSection.tsx` is 128 lines — 8 over CLAUDE.md's 120-line component
  cap — after this task added the `selectedStudentId` filter wiring. `pnpm lint` has no
  `max-lines` rule configured so this genuinely reports 0 errors, and the added logic (a
  single one-line `.filter()`) is well under module-pattern.md's 15-line "business logic"
  guideline threshold. Flagged for a future tidy-up pass (e.g. extracting the filtered
  list into a small hook), not blocking this verification.
