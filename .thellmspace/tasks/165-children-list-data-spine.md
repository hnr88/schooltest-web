---
id: 165
title: Join C-STUDENT-LIST with C-DASH-HOUSEHOLD into one children-list view model
layer: data
kind: wire
slice: The single typed view model every "My children" card row reads from — one student row + its household-progress entry, with honest empty slots when a child has no progress entry.
target: src/modules/children/lib/children-list-view-model.ts (new), src/modules/children/types/children.types.ts, src/modules/children/hooks/use-children-list.ts, src/modules/children/index.ts
contract: C-STUDENT-LIST, C-DASH-HOUSEHOLD, C-UI-CHILD-LEARNING-SURFACE
design: .qa/design/screens/portal--my-children-list.html (L12-34) · .qa/design/spec/02-portal-children.md §A.5 + §METRIC INVENTORY rows "A card"
status: TODO
depends_on: ["090", "110"]
---

## Objective

Produce ONE typed row shape for the redesigned children list: identity + status from the existing
`GET /api/my/students`, and CEFR band / day streak / tests completed / last activity / focus skill
from `GET /api/my/progress`. No component may reach for a query itself, and no card may show a
number that is not on one of those two responses.

## Contract

`C-STUDENT-LIST` — `GET /api/my/students` (Bearer parent JWT). Query: `pagination[page]`,
`pagination[pageSize]<=100`, `sort`. Controller forces
`filters[parent][documentId][$eq]=<caller>`. `200 { data: Student[], meta: { pagination } }`,
`401` unauth. Already consumed by `useStudentsQuery` (`src/modules/dashboard/queries/use-students.query.ts`)
with keys `['dashboard','students',{includeArchived}]` — REUSE it, do not add a second call.

`C-DASH-HOUSEHOLD` — `GET /api/my/progress` (parent JWT, **no query parameters accepted — any query
key ⇒ `400 ValidationError`**). `200 { data: { household: {...}, children: [ { documentId, givenName,
familyName, yearLevel, status, testsCompleted, practiceSecondsThisWeek, practiceDayStreak,
lastActivityAt, focusSkill, skills[] } ] }, meta: {} }`.
`401` absent/invalid JWT · `403` non-parent (`'Only parents can view household progress'`).
**Per AMENDMENT A1 (`.qa/CONTRACTS.md`), there is no per-child `cefrBand`/`cefrStageIndex`/
`acaraPhase` — those are DELETED (cross-skill composite, BLOCKED B-9).** `focusSkill` is
**nullable**; `skills` always carries **exactly four entries** (one per skill), padded with
`readiness: "not_assessed"` / `cefrBand: null` / `resultDocumentId: null` when a skill has no
official result — never fewer than four.

`C-UI-CHILD-LEARNING-SURFACE`: "When no metrics or results exist, the UI states that honestly rather
than synthesizing a score, chart, or recommendation."

## Design source

`.qa/design/spec/02-portal-children.md` §A.5 lists the four card data slots: `k.level` (→ per-child
`cefrBand`), `k.streak` (→ `practiceDayStreak`), `k.meta`, `k.note` (→ `focusSkill`).
**`k.level` is now BLOCKED B-9** — a single per-child level is the same forbidden composite as
`last result`/`Progress to next`; this view model exposes NO field for it. `skills[]` remains
available on the row for any per-skill rendering elsewhere (e.g. the per-skill CEFR strips,
task 146), but nothing plays the role of a single-value "Level" cell. §METRIC INVENTORY row
"A card · `day streak`" = "Consecutive calendar days with >=1 completed practice session" — exactly
`practiceDayStreak`. Rows `to {nextLevel}` and `last result` are BLOCKED (tasks 170 / 169); this view
model must NOT expose a field for either.

## Files

- `src/modules/children/lib/children-list-view-model.ts` — pure `buildChildrenListRows(students, household)`.
- `src/modules/children/types/children.types.ts` — `ChildrenListRow` (documentId, name, initials,
  yearLevel, status, createdAt, practiceDayStreak, testsCompleted, lastActivityAt, focusSkill,
  focusReadiness, skills). **No `cefrBand`/`cefrStageIndex`/`acaraPhase` fields — AMENDMENT A1
  deletes the per-child level (B-9); `skills[]` is the only carrier of a band.**
- `src/modules/children/hooks/use-children-list.ts` — add the household query, keep the existing
  `includeArchived` re-query, the `useDashboardSearchStore` name filter and every returned counter.
- `src/modules/children/index.ts` — export the row type only if a sibling module needs it.

## Depends on

- The whole of **W3** (typed client + query layer): the Zod mirror of `C-DASH-HOUSEHOLD` and its
  TanStack Query hook live there. `090` is named as the concrete edge; the wave gate is all of W3.
- The whole of **W4** (app shell), because the list renders inside `/dashboard` chrome. Edge: `110`.

## Steps

1. Read the W3 household query hook + Zod schema; import the hook, never re-type the response.
2. Write `buildChildrenListRows`: index `data.children` by `documentId` into a `Map`, then map the
   student rows (order preserved) onto `ChildrenListRow`. A student with no household entry gets
   `practiceDayStreak: 0, testsCompleted: 0, lastActivityAt: null, focusSkill: null, skills: [4
   entries, all readiness: 'not_assessed', cefrBand: null]` — matching the same all-`not_assessed`
   shape the API itself returns for a never-assessed child (AMENDMENT A1); never a default band,
   never `-`, never `skills: []`.
3. Name via the existing `getStudentDisplayName` / `getStudentInitials` from `src/lib/student-name.ts`.
4. Surface `isLoading` / `isError` / `isFetching` as the OR of both queries and `refetch` as the
   `Promise.all` of both (the existing hook's contract).
5. Unit-free: prove it through the screen in 176's Playwright run.

## Project rules

- `.claude/rules/module-pattern.md` — pure helper in `lib/`, type in `types/x.types.ts`, hook in
  `hooks/`, no `useQuery` outside `queries/`; 200-line file cap; never import your own barrel.
- `.claude/rules/state-data.md` — array query keys, one hook per query, no second axios instance.
- `CLAUDE.md` §0.14 no `any` (narrow `unknown`), §0.3 never break existing logic.
- `.qa/RULES.md` [schooltest-web] "Components are dumb": all joining happens here, not in JSX.

## Done criteria

- `pnpm tsc --noEmit` + `pnpm lint` clean.
- Playwright against the running app: on `/dashboard/children` the network records **exactly one**
  `GET /api/my/students` (per `includeArchived` variant) and **exactly one** `GET /api/my/progress`
  — never one request per child.
- `GET /api/my/progress` returns `200` for the seeded parent and its `children[].documentId` set is a
  superset of the rendered cards' ids; a child absent from `children[]` still renders (with empty
  metric slots) rather than disappearing.
- `tests/e2e/students-list.spec.ts`, `children-profile.spec.ts`, `dashboard-students.spec.ts` stay green.
- Zero banned-pattern hits in the diff: `any`, raw hex, `[` arbitrary Tailwind values, `fetch(`.

## Assumptions

W3 names the hook `useHouseholdProgressQuery` in `src/modules/dashboard/queries/`; if it lands under a
different module/name, import W3's actual export — do not create a duplicate.

## Evidence

<!-- filled in as the task runs -->
