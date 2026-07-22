---
id: 062
title: Stand up GET /api/my/progress end-to-end returning the four household count aggregates
layer: backend
kind: implement
slice: GET /api/my/progress — service + controller + route + grant, delivering household counts and child identity
target: schooltest-api/src/api/student/services/parent-dashboard.ts · controllers/parent-dashboard.ts · routes/01-custom-parent-students.ts · src/bootstrap/permissions-action-refs.ts · src/bootstrap/permissions-actions.ts
contract: C-DASH-HOUSEHOLD
design: .qa/design/spec/01-portal-dashboard.md#41-metric-1--tests-completed · .qa/design/spec/01-portal-dashboard.md#10-metric-inventory row 1 · .qa/design/screens/portal--main.html:26-38
status: TODO
depends_on: [060]
---

## Objective

Make `GET /api/my/progress` a real, reachable, parent-authenticated endpoint that returns the
household's four count aggregates plus the identity of every child — in ONE request, which is the
entire reason the surface exists (gap **G1**: today the dashboard would need 1+N requests against a
120 req/min/IP limiter). Everything else on this endpoint is added by 063-066 on top of this
skeleton.

## Contract

`.qa/CONTRACTS.md` → **C-DASH-HOUSEHOLD — GET /api/my/progress**.

- **Transport:** `GET /api/my/progress`
- **Route file:** `schooltest-api/src/api/student/routes/01-custom-parent-students.ts` (append)
- **Handler:** `api::student.parent-dashboard.getHouseholdProgress`
- **Auth:** parent JWT required. Grant `parent-dashboard.getHouseholdProgress` → `parent` ONLY,
  registered in `src/bootstrap/permissions-actions.ts`.
- **Request:** no path params. Query: **none accepted** — any query key ⇒
  `400 ValidationError('household progress does not accept query parameters')`.
- **Errors:** `400` any query parameter · `401` absent/invalid JWT · `403` `ForbiddenError`
  `'Only parents can view household progress'` when the caller's role is not `parent`.
- **Persistence effect:** none. Read-only over `students`, `students_parent_lnk`, `sessions`,
  `results`.
- **This task's response subset** (schema stage 1 from task 060):

```jsonc
{ "data": {
    "household": { "childCount": 3, "testsCompleted": 41, "resultsPublished": 18 },
    "children": [ { "documentId": "…", "givenName": "Emma", "familyName": "Chen",
                    "yearLevel": 7, "status": "active" } ] },
  "meta": {} }
```

Metric definitions for this task:
- `childCount` — number of children whose `parent.documentId` is the caller. **All statuses**
  (`active`, `enrolled`, `archived`) are counted and returned; the addendum's `status` field is
  what lets the UI filter. This differs from `GET /api/my/students`, which defaults to
  `status $ne archived` — recorded so it is a decision, not an accident.
- `testsCompleted` — `sessions.status = 'complete'`, all children, all time.
- `resultsPublished` — `results.destination = 'official'`, all children, all time.

## Design source

`.qa/design/spec/01-portal-dashboard.md` §3 + §4.1 (`portal--main.html:26-38`):
- Hero stat 1: value **`7`**, sub-label literal **`tests completed`** (lowercase). Value is
  `24px / 700 / -0.02em`, sub-label `12px / 400 / #8FA3C7`, `margin-top:3px`. Integer, no unit, no
  thousands separator, **no trend/delta indicator, no icon**.
- §10 row 1 defines it as "count of completed test sessions across all children of the parent".
- `resultsPublished` has no hero tile of its own; it backs the children surfaces
  (`.qa/design/spec/02-portal-children.md` §B.6 "Recent results").
- The navy panel colour `#0E2350` maps to `--color-navy-900`; the sub-label `#8FA3C7` has no token
  in `.qa/design/spec/04-ds-foundations.md#tailwind-v4-mapping` and is W5's problem, not this
  task's — no UI ships here.

## Files

- CREATE `schooltest-api/src/api/student/services/parent-dashboard.ts` (service
  `api::student.parent-dashboard`)
- CREATE `schooltest-api/src/api/student/controllers/parent-dashboard.ts` (controller
  `api::student.parent-dashboard`)
- EDIT `schooltest-api/src/api/student/routes/01-custom-parent-students.ts` — append the route
- EDIT `schooltest-api/src/bootstrap/permissions-action-refs.ts` — add
  `HOUSEHOLD_PROGRESS_ACTION = 'api::student.parent-dashboard.getHouseholdProgress'` with the
  same style of explanatory comment the neighbouring refs carry
- EDIT `schooltest-api/src/bootstrap/permissions-actions.ts` — add it to `ROLE_ACTIONS.parent` and
  to NO other role; extend the `parent:` doc comment
- EDIT `schooltest-api/src/contracts/parent-household-progress.ts` — only if 060 left a TODO
- CREATE `schooltest-web/tests/e2e/household-progress.spec.ts`

## Depends on

- **060** — the Zod module this service validates its output against and this controller re-parses.

## Steps

1. Read, in full, the three files this mirrors: `services/parent-progress.ts`,
   `controllers/parent-progress.ts`, `routes/01-custom-parent-students.ts`.
2. **Service** `services/parent-dashboard.ts`, shaped exactly like `parent-progress.ts`:
   `export default ({ strapi }: { strapi: Core.Strapi }): ParentDashboardService => ({ ... })`
   with an exported `ParentDashboardService` interface. Declare each UID once as a `const`
   (`STUDENT_UID`, `SESSION_UID`, `RESULT_UID`) — CLAUDE.md §2 rule 19.
   - Load the caller's children with ONE
     `strapi.documents(STUDENT_UID).findMany({ filters: { parent: { documentId: { $eq: caller } } },
     fields: ['given_name','family_name','year_level','status'], sort: ['createdAt:desc'],
     limit: <cap> })`. Explicit `fields`; **never `populate:'*'`**.
   - Derive `childDocumentIds: string[]` from that one read.
   - Fire the two counts with `Promise.all`, filtered by
     `{ student: { documentId: { $in: childDocumentIds } } }` — ONE grouped query per aggregate.
     **No per-child loop with `await` inside it** (CLAUDE.md §2 rule 20; the addendum repeats it).
   - Short-circuit: when `childDocumentIds.length === 0`, return
     `{ household: { childCount: 0, testsCompleted: 0, resultsPublished: 0 }, children: [] }`
     without issuing the count queries.
   - Validate the assembled object through `householdProgressDataSchema` and throw
     `ApplicationError('household progress response failed contract validation', { issues })` on
     failure — the same key-leak guard `parent-progress.ts:102-108` uses.
3. **Controller** `controllers/parent-dashboard.ts` —
   `factories.createCoreController('api::student.student', ({ strapi }) => ({ ... }))`, method
   `getHouseholdProgress(ctx: Context)`, in this exact order (it is the `parent-progress.ts` order):
   role re-assert → query-key rejection → `await this.validateQuery(ctx)` →
   `await this.sanitizeQuery(ctx)` → service call → `await this.sanitizeOutput(...)` on the child
   rows → re-parse with `householdProgressDataSchema` → `return this.transformResponse(checked.data)`.
   Errors from `@strapi/utils` only.
4. **Route** — append to the `routes` array of `01-custom-parent-students.ts`:
   `{ method: 'GET', path: '/my/progress', handler:
   'api::student.parent-dashboard.getHouseholdProgress', config: { policies: [], middlewares: [] } }`.
   **Never write `auth: true`** (invalid — GOTCHA 1); omitting `auth` is what requires the JWT.
   Add the same style of comment the sibling entries carry. `/my/progress` shares no path shape
   with `/my/students/:documentId`, so ordering within the file is free — say so in the comment.
5. **Grant** — add the action ref const and the `ROLE_ACTIONS.parent` entry. `ensureRolePermissions`
   runs on EVERY boot regardless of `SEED` (`src/index.ts:48-49`), so the source edit's reload
   creates the `up_permissions` row; do NOT restart the server by hand and do NOT touch `SEED`.
6. `cd schooltest-api && pnpm tsc --noEmit && pnpm lint`.
7. Write `tests/e2e/household-progress.spec.ts` (API-level, the
   `tests/e2e/notification-api-security.spec.ts` pattern: `request.post('/api/auth/local')` for the
   JWT, `API_BASE_URL = 'http://localhost:5500'`).

## Project rules

- `schooltest-api/CLAUDE.md` §2: rule 5 (`strapi.documents()`, never entityService), rule 6
  (`documentId`, never numeric `id`), rule 10 (never skip sanitize), rule 11/12 (never
  `populate:'*'`), rule 16 (no `auth: true`), rule 17 (`01-` prefixed custom route file),
  rule 19 (UID const once), rule 20 (no await-in-loop), rule 21 (`@strapi/utils` errors only),
  rule 23 (`pnpm tsc --noEmit`).
- `.claude/rules/controllers.md` (sanitizeQuery / sanitizeOutput / transformResponse on replaced
  actions), `.claude/rules/services.md` (thin controller, logic in the service),
  `.claude/rules/routes.md` (auth semantics, `01-` load order),
  `.claude/rules/document-service.md` (relation filters are nested objects, explicit populate).
- `schooltest-web/.qa/RULES.md` [schooltest-api] — never start/stop the server; roles/permissions
  in code under `src/bootstrap/`, never the admin UI.

## Done criteria

- `cd schooltest-api && pnpm tsc --noEmit` and `pnpm lint` clean.
- `pnpm exec playwright test tests/e2e/household-progress.spec.ts` passes against the running API
  on :5500 and asserts:
  - parent JWT (`parent@schooltest.local` / `Parent1234!`) → **200**, body has exactly the keys
    `data.household.{childCount,testsCompleted,resultsPublished}` and `data.children[]` with the
    five identity keys, and `meta` present;
  - **the numbers equal a direct SQL count**, via `runSql` from `tests/e2e/helpers/auth-db.ts` —
    `childCount` equals `select count(*) from students s join students_parent_lnk pl on
    pl.student_id = s.id join up_users u on u.id = pl.user_id where u.email =
    'parent@schooltest.local'` (currently **10**), and `testsCompleted` / `resultsPublished` equal
    the equivalent joins over `sessions`/`results`. Not "looks correct" — an equality assertion;
  - `documentId` is a 24-char string and **no numeric `id` key appears** on any child row;
  - `GET /api/my/progress?foo=1` → **400** `ValidationError`,
    message `household progress does not accept query parameters`;
  - no JWT → **401 or 403** (never 200, never 404 — 404 would mean the route did not register);
  - the response is identical after an API reload (read-only endpoint, stable numbers).
- `grep -rn "populate: '\*'\|entityService\|auth: true" schooltest-api/src/api/student/` returns
  nothing.
- `psql` shows exactly one new `up_permissions` row:
  `select r.type from up_permissions p join up_permissions_role_lnk l on l.permission_id = p.id
  join up_roles r on r.id = l.role_id where p.action =
  'api::student.parent-dashboard.getHouseholdProgress'` → exactly `parent`, one row. It survives an
  API reload (bootstrap is idempotent) — that is this task's persistence proof.
- No user-facing string added → no i18n catalog change (W3 owns the keys). No UI → motion /
  375px / axe **n/a**.
- Baseline regression: full `pnpm exec playwright test` still 157 passed / 1 pre-existing fail; in
  particular `dashboard.spec.ts` and `children-profile.spec.ts` stay green.

## Assumptions

- The children read is capped with an explicit `limit` (e.g. 200) rather than left unbounded; the
  live maximum today is 10 children for one parent. State the cap in the code comment.
- `sanitizeOutput` is applied to the raw student rows before projection, matching
  `parent-progress.ts:34`, so `passport_number` (`private: true`) can never reach the wire.

## Evidence

<!-- filled in as the task runs -->
