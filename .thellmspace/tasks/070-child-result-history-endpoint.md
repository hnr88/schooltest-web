---
id: 070
title: Stand up GET /api/my/students/:documentId/results with ownership, official-only scope and pagination
layer: backend
kind: implement
slice: GET /api/my/students/:documentId/results — service + controller + route (ordered) + grant
target: schooltest-api/src/api/student/services/parent-results.ts · controllers/parent-results.ts · routes/01-custom-parent-students.ts · src/bootstrap/permissions-action-refs.ts · permissions-actions.ts
contract: C-CHILD-RESULT-HISTORY
design: .qa/design/spec/02-portal-children.md#b6-component-recentresults · .qa/design/screens/portal--child-detail.html:58-72
status: TODO
depends_on: [069]
---

## Objective

Replace the un-paginated, 5-row-capped `recentResults` projection with a real, owned, paginated
result history for one child — the endpoint the design's "Recent results" list and its
`All reports →` link require, and which gap **G4** says cannot be built from anything that exists.

## Contract

`.qa/CONTRACTS.md` → **C-CHILD-RESULT-HISTORY**.

- **Transport:** `GET /api/my/students/:documentId/results`
- **Route file:** `01-custom-parent-students.ts`, placed **before** `/my/students/:documentId`
  (the wildcard would otherwise swallow it — Strapi v5 **GOTCHA 2**; the file's existing comment at
  `:27-33,34-41` records the same precedent for `/progress`).
- **Handler:** `api::student.parent-results.listChildResults`
- **Auth:** parent JWT; grant → `parent` only. Ownership: unknown/foreign child ⇒ **`404`**.
- **Scope:** `destination='official'` ONLY. Practice/transient results stay invisible to parents —
  preserves the existing `getParentProgress` boundary; gap **G8** is left open deliberately.
- **Sort:** `published_at_field:desc, createdAt:desc` — same as the existing progress read.
- **Success `200`:** `{ data: [row…], meta: { pagination: { page, pageSize, pageCount, total } } }`
  with the 14-key row from task 069. This task lands 12 of the 14 keys; the two linkage keys
  (`previousResultDocumentId`, `sessionDocumentId`) arrive in 072.
- **Errors:** `400` bad/unknown query (071 owns the full matrix) · `401` no JWT · `403` non-parent
  role · `404` unknown or foreign child.
- **Persistence effect:** none.

## Design source

`.qa/design/spec/02-portal-children.md` §B.6 (`portal--child-detail.html:58-72`) — the card renders
**3 placeholder rows** and links to `All reports →`, i.e. a page-1-of-N list. Row chrome:
`display:flex; align-items:center; gap:20px; padding:17px 0; border-bottom:1px solid #EEF1F6`;
name `14.5px/600/#0E2350` (`--color-navy-900`); date `13px/#7C8698`; action `Report`
`13px/600/#2563EB` (`--color-brand-600`). The default `pageSize: 10` in the contract is what makes
one request serve the card (3 visible) and the first screen of the full list.

`§B.2` KpiStrip cell 5 `Since joining` `+2 levels` (blue `#2563EB`) also reads this history —
oldest band vs newest band. The **`+2 levels`** form is servable from bands; the sibling cells 2
(`Progress to B2` / `68%`) and 4 (`Last result` / `74%`) are **BLOCKED** (B-4, B-3 — task 080).

## Files

- CREATE `schooltest-api/src/api/student/services/parent-results.ts` (service
  `api::student.parent-results`)
- CREATE `schooltest-api/src/api/student/controllers/parent-results.ts`
- EDIT `schooltest-api/src/api/student/routes/01-custom-parent-students.ts`
- EDIT `schooltest-api/src/bootstrap/permissions-action-refs.ts` — add
  `CHILD_RESULT_HISTORY_ACTION = 'api::student.parent-results.listChildResults'` with the
  neighbouring comment style
- EDIT `schooltest-api/src/bootstrap/permissions-actions.ts` — add to `ROLE_ACTIONS.parent` only
- CREATE `schooltest-web/tests/e2e/child-result-history.spec.ts`

## Depends on

- **069** — the Zod module the service validates against and the controller re-parses.

## Steps

1. Read `services/parent-progress.ts` (ownership pattern, `findFirst` with the forced parent
   filter, `NotFoundError('student not found')`) and `utils/parent-student-read-actions.ts`
   (pagination clamping precedent).
2. **Route first in the file order.** Insert the new entry into `01-custom-parent-students.ts`
   **immediately after** the `/my/students/:documentId/progress` entry and **before** the
   `/my/students/:documentId` entry, with a comment naming GOTCHA 2. Never write `auth: true`.
3. **Service** `services/parent-results.ts`:
   - `listForParent(callerDocumentId, documentId, query)`.
   - Parse `documentId` with `parentChildResultsParamsSchema`; on failure throw
     `ValidationError('invalid child results document id', { fields: ['documentId'], issues })` —
     mirroring `parent-progress.ts:65-72`.
   - Ownership: `strapi.documents(STUDENT_UID).findFirst({ filters: { documentId: { $eq },
     parent: { documentId: { $eq: callerDocumentId } } }, fields: ['status'] })`; `null` ⇒
     `NotFoundError('student not found')`. **Foreign and unknown are indistinguishable** — that is
     the contract's non-disclosure rule.
   - Results read, ONE `Promise.all` of `count` + `findMany`, never sequential:
     - `filters: { student: { documentId: { $eq: student.documentId } },
       destination: { $eq: 'official' }, ...(skill ? { skill: { $eq: skill } } : {}) }`
     - `fields: ['scope','skill','display_label','cefr_band','acara_phase','readiness',
       'low_confidence','effort_valid','status','published_at_field','createdAt']` — explicit,
       eleven columns. **Never `populate: '*'`.**
     - `sort: ['published_at_field:desc', 'createdAt:desc']`
     - `start: (page - 1) * pageSize`, `limit: pageSize`
   - `pageCount = total === 0 ? 0 : Math.ceil(total / pageSize)` — the `notification` service's
     convention (`services/notification.ts`: `pageCount = 0` when `total = 0`).
   - Project snake_case → the contract's camelCase; validate the whole payload through
     `parentChildResultsResponseSchema` and throw
     `ApplicationError('child results response failed contract validation', { issues })` on
     failure.
4. **Controller** `controllers/parent-results.ts` — `factories.createCoreController('api::student.student', …)`,
   method `listChildResults(ctx)`: role re-assert
   (`ForbiddenError('Only parents can view child results')`) → parse `ctx.query` with the contract's
   query schema → `await this.validateQuery(ctx)` → `await this.sanitizeQuery(ctx)` → service →
   `await this.sanitizeOutput(rows, ctx)` → re-parse → `return this.transformResponse(rows, { pagination })`.
5. **Grant** — action ref const + `ROLE_ACTIONS.parent`. `ensureRolePermissions` runs on every boot
   (`src/index.ts:48-49`); do not touch `SEED`, do not restart by hand.
6. `cd schooltest-api && pnpm tsc --noEmit && pnpm lint`.

## Project rules

- `schooltest-api/CLAUDE.md` §2 rules 5, 6, 10, 11/12, **16 (no `auth: true`)**,
  **17 + GOTCHA 2 (route ordering)**, 19, 20, 21, 23.
- `.claude/rules/routes.md` — custom routes load alphabetically; `01-` prefix; auth is required
  when `auth` is omitted.
- `.claude/rules/controllers.md` — replaced actions MUST sanitize; enforce a max pageSize.
- `.claude/rules/document-service.md` — nested relation filters; explicit fields; `start`/`limit`.
- `.qa/RULES.md` [schooltest-api].

## Done criteria

- `cd schooltest-api && pnpm tsc --noEmit` and `pnpm lint` clean.
- `pnpm exec playwright test tests/e2e/child-result-history.spec.ts` passes:
  - parent JWT + own child `funvimlj3yeh8mada2bkbt7x` → **200**; `data` is an array; `meta.pagination`
    has the four int keys; `total` equals
    `select count(*) from results r join results_student_lnk rl on rl.result_id = r.id
     join students s on s.id = rl.student_id
     where s.document_id = 'funvimlj3yeh8mada2bkbt7x' and r.destination = 'official'` via `runSql`
    (currently **1**);
  - **route ordering proof:** `GET /api/my/students/<id>/results` returns the results envelope
    (`data` is an ARRAY, `meta.pagination` present), NOT the single-student detail object that
    `/my/students/:documentId` returns. A 404 here would mean the entry never registered;
  - **official-only:** the parent has **15 transient results** live; assert every returned
    `documentId` is in the SQL set of official ids for that child and that a known transient
    documentId (read via `runSql`) is absent;
  - **ownership:** the same path with a child of `parent-t06@schooltest.local` → **404**
    `NotFoundError`; a syntactically valid but nonexistent 24-char id → **404** with the SAME body;
  - **role:** teacher JWT (`apiEnv('SEED_TEACHER_PASSWORD')`) → **403**;
  - **no JWT** → 401/403, never 200;
  - defaults: no query ⇒ `page: 1`, `pageSize: 10`;
  - no numeric `id` anywhere in the body; no `student` relation, no PII.
- `psql`: exactly one `up_permissions` row for
  `api::student.parent-results.listChildResults`, role `parent`, surviving an API reload — this
  task's persistence proof.
- `grep -rn "populate: '\*'\|entityService\|auth: true" schooltest-api/src/api/student/` returns
  nothing.
- The route entry sits between the `/progress` and `/:documentId` entries — verify by reading the
  file and by `pnpm strapi routes:list` output (allowed by CLAUDE.md §8).
- No i18n change. No UI → motion / 375px / axe **n/a**.
- Baseline regression: 157 passed / 1 pre-existing fail. In particular `children-profile.spec.ts`
  and `students-list.spec.ts` must stay green — `/my/students/:documentId` behaviour is unchanged.

## Assumptions

- The child-detail read `/my/students/:documentId` is NOT modified. Its 5-row `recentResults` on
  `/progress` also stays exactly as-is: this is an additive endpoint, and
  `.qa/PLAN.md` "Preserve behaviour" forbids changing a passing surface.
- `results.createdAt` is Strapi's own timestamp column and is always present (verified: 0 nulls).

## Evidence

<!-- filled in as the task runs -->
