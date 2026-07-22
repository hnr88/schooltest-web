---
id: 130
title: Wire the dashboard screen to GET /api/my/progress and define its page-level query contract
layer: data
kind: wire
slice: The parent dashboard's single data source — household + per-child aggregate
target: src/modules/dashboard/components/DashboardScreen.tsx, src/modules/dashboard/hooks/use-dashboard-household.ts, src/modules/dashboard/index.ts
contract: C-DASH-HOUSEHOLD
design: .qa/design/spec/01-portal-dashboard.md#10 (metric inventory), .qa/design/screens/portal--main.html
status: TODO
depends_on: ["090", "091", "110"]
---

## Objective
Make `/dashboard` read the household aggregate from ONE request instead of the current
`GET /api/my/students` page-walk, and publish the single loading / empty / error contract that
every other W5 task branches on. No visual change in this task beyond the states.

## Contract
`C-DASH-HOUSEHOLD` — `GET /api/my/progress`, parent JWT required, **no query parameters accepted**
(any query key ⇒ `400 ValidationError` `'household progress does not accept query parameters'`).

Success `200`:
`data.household = { childCount:int, testsCompleted:int, testsCompletedThisWeek:int,
resultsPublished:int, practiceSecondsThisWeek:int, practiceByDay:[7 × {date,weekday,seconds}]
oldest→newest, strongestDay: {date,weekday,seconds} | null }`
`data.children[] = { documentId, givenName, familyName|null, yearLevel|null, status, testsCompleted,
practiceSecondsThisWeek, practiceDayStreak, lastActivityAt|null, focusSkill|null, skills[] }` —
**per AMENDMENT A1 (`.qa/CONTRACTS.md`) there is no per-child `cefrBand`/`cefrStageIndex`/
`acaraPhase`; those are DELETED (cross-skill composite, BLOCKED B-9). A band exists only inside
each `skills[]` entry, which always has four entries (one per skill), padded with
`readiness: "not_assessed"` when a skill has no official result.**

Errors: `400` ValidationError (query param present) · `401` UnauthorizedError · `403` ForbiddenError
`'Only parents can view household progress'`. Read-only — no persistence effect.

## Design source
`.qa/design/spec/01-portal-dashboard.md` §10 rows 1, 3, 4, 5, 6, 7 all read from this one response;
§1.3 the dashboard is the `isDash` branch of the main scroll column. This task renders the existing
composition unchanged — it only swaps the data source and adds the three states.

## Files
- CREATE `src/modules/dashboard/hooks/use-dashboard-household.ts` — thin hook: calls the W3 query
  hook, returns `{ household, children, status: 'loading'|'empty'|'error'|'ready', refetch,
  isFetching }`. `empty` ⇔ `household.childCount === 0`. No `useQuery` here (rules: query hooks live
  in `queries/`; this is the branching hook only).
- CREATE `src/modules/dashboard/types/dashboard-household.types.ts` — `DashboardHouseholdState`.
- EDIT `src/modules/dashboard/components/DashboardScreen.tsx` — consume the hook; keep `useAuth()`
  for the greeting name; keep `data-slot="dashboard-overview"` + `data-surface="parent-overview"` on
  `<main>` (existing e2e depends on both).
- EDIT `src/modules/dashboard/index.ts` — export `useDashboardHousehold` + the state type.

## Depends on
- **090** (W3) — the Zod mirror of `C-DASH-HOUSEHOLD` in
  `src/modules/dashboard/schemas/household-progress.schema.ts`.
- **091** (W3) — `useHouseholdProgressQuery` in
  `src/modules/dashboard/queries/use-household-progress.query.ts`, query key
  `['dashboard','household']`.
- **110** (W4) — the app shell (sidebar + topbar) the page renders inside.
If those W3/W4 slice ids differ from the ones recorded here, correct the edge — do not build a
second query hook or a second Zod schema. **A duplicate schema or duplicate `useQuery` is a fail.**

## Steps
1. Confirm 090/091 landed: `src/modules/dashboard/queries/use-household-progress.query.ts` exists
   and parses through the Zod mirror.
2. Write `use-dashboard-household.ts` deriving the four-way state. `isPending` ⇒ `loading`;
   `isError` ⇒ `error`; `childCount === 0` ⇒ `empty`; otherwise `ready`.
3. Replace `useDashboardOverviewStudentsQuery` in `DashboardScreen` with the new hook. **Do not
   delete** `useDashboardOverviewStudentsQuery` — `AppSidebar` and the children roster still use
   `useStudentsQuery` from the same file.
4. Keep the existing `DashboardSkeleton` / `Alert` branches wired to the new state until 154/155
   replace them.
5. Verify one real request in the browser: exactly ONE `GET /api/my/progress` on load, no N+1.

## Project rules
- `.claude/rules/state-data.md` — one hook per query in `queries/`; array query keys starting with
  the resource name; never `import axios` in a component.
- `.claude/rules/module-pattern.md` — hooks in `hooks/`, types in `types/x.types.ts`, cross-module
  imports through the barrel only, never import your own barrel.
- `CLAUDE.md` §0 law 3 (never break existing logic), law 14 (no `any`), law 9 (no `fetch` from a
  client component).

## Done criteria
- `pnpm tsc --noEmit` + `pnpm lint` clean.
- Playwright, real seeded parent (`parent@schooltest.local` / `Parent1234!`) against the running
  app: intercept network on `/dashboard` and assert **exactly one** request matching
  `**/api/my/progress` and **zero** requests to `**/api/my/students*` originating from
  `DashboardScreen`, and that the response status is `200`.
- Real-data proof: the response body's `data.children[].documentId` values match rows read with
  `psql` from `127.0.0.1:5540` (`select document_id, given_name from students …` joined via
  `students_parent_lnk` to the seeded parent). Reload the page — the same ids come back.
- Error path proof: `page.route('**/api/my/progress', r => r.fulfill({status:500}))` ⇒ the screen
  renders the error branch, not a blank page or a crash.
- 401 path: clear `app.auth.token` mid-session ⇒ redirect to `/sign-in` (existing `ParentGuard`
  behaviour preserved).
- Existing `tests/e2e/dashboard.spec.ts` guard + sign-out + mobile tests still pass.
- Zero banned-pattern grep hits in the diff (`any`, `as unknown as`, `mock`, `dummy`, `TODO`).

## Assumptions
- W3 named the hook `useHouseholdProgressQuery`; if it chose another name, use the real one.

## Evidence
<filled in as the task runs>
