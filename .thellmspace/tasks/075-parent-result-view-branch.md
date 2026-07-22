---
id: 075
title: Add the parent branch to the result-view ownership matrix and grant getResult to parent
layer: backend
kind: implement
slice: GET /api/results/:documentId — a parent can read their own child's official result
target: schooltest-api/src/api/result/services/result-view.ts · src/bootstrap/permissions-action-refs.ts · src/bootstrap/permissions-actions.ts
contract: C-PARENT-RESULT-VIEW
design: .qa/design/spec/02-portal-children.md#b5-component-skillscard · .qa/design/screens/portal--child-detail.html:43-55
status: TODO
depends_on: []
---

## Objective

Open the existing `ResultView` to the owning parent so the design's "Skills" section can be built
from the per-attribute mastery map — the data gap **G2** describes as completely unreachable for a
parent today, because `result-view.ts:54-68` has no parent branch and the grant is not held.

## Contract

`.qa/CONTRACTS.md` → **C-PARENT-RESULT-VIEW — GET /api/results/:documentId (parent branch)**.
An **additive change to an existing endpoint** — no new route file, no new contract, no new shape.

- **Transport:** `GET /api/results/:documentId` (route already exists at
  `src/api/result/routes/01-custom-results.ts:12-21`)
- **Auth:** parent JWT. New grant: `result.getResult` → `parent`.
- **Ownership:** the result's `student.parent.documentId` MUST equal the caller's `documentId`
  **and** `destination` MUST be `official`. Anything else ⇒ **`404 NotFoundError`** (never `403` —
  a parent must not be able to probe which result ids exist).
- **Success `200`** with the EXISTING `ResultView` shape from `src/contracts/results.ts` — no new
  shape, no parent-specific variant. Fields the UI consumes: `scope`, `skill`, `attributes`
  (`{status, prob, prob_se?, items, delta}` per attribute code), `display_label`, `acara_phase`,
  `cefr_band`, `readiness`, `low_confidence`, `effort_valid`, `supplementary`,
  `productive_scores`, `status`, `published_at`.
- **Errors:** `401` no/invalid JWT · `403` role not permitted · `404` unknown id, foreign child, or
  `destination='transient'`.
- **Persistence effect:** none.
- **Security note (contract text):** "this widens who can read a result row."

**What must not change:** the student, teacher and admin branches at
`result-view.ts:54-68` are untouched. Teacher keeps its own-students + official-only rule with its
own `403` messages; student keeps any-destination access to its own results. Breaking either is a
regression, not progress (`.qa/PLAN.md` "Preserve behaviour").

## Design source

`.qa/design/spec/02-portal-children.md` §B.5 SkillsCard (`portal--child-detail.html:43-55`):

- Card `background:#FFFFFF; border-radius:24px; padding:28px 30px; box-shadow:0 1px 2px
  rgba(14,35,80,.04)`; `<h2>` **`Skills`** `margin:0 0 20px; 16px/600/#0E2350`
  (`--color-navy-900`); rows wrapper `display:flex; flex-direction:column; gap:13px`.
- **SkillRow** `display:grid; grid-template-columns:76px 1fr 38px; align-items:center; gap:14px`;
  name `13px/#7C8698`; track `height:6px; background:#EEF1F6; border-radius:99px`; fill
  `height:100%; border-radius:99px`; grade `12px/600; text-align:right`.
- `sk.color` is `#0E2350` normally and **`#2563EB`** (`--color-brand-600`) for the focus/weakest
  skill — "colour encodes emphasis, not value".
- Skill note `margin-top:22px; padding-top:18px; border-top:1px solid #EEF1F6; 13px/#7C8698;
  line-height:1.55`.
- The design's bar **percentages** (Emma `78% 70% 52% 64%`) are composite scores and are **BLOCKED**
  (B-3/B-5, task 080). What this endpoint unlocks instead is the sanctioned datum: the per-attribute
  mastery map `attributes` — `{ status: mastered|emerging|not_mastered|not_assessed, prob, items,
  delta }` keyed by attribute code (`R1..R7`, `L1..L7`, `S1..S5`, `W1..W6`,
  `src/contracts/vocab.ts:62-75`) — plus `readiness` and `acara_phase`. W6 renders the design's bar
  geometry from per-attribute mastery, never from an invented percentage.

## Files

- EDIT `schooltest-api/src/api/result/services/result-view.ts` — add the parent branch to
  `assertMayRead` and extend the `load()` populate so the parent relation is available
- EDIT `schooltest-api/src/bootstrap/permissions-actions.ts` — add `GET_RESULT_ACTION` to
  `ROLE_ACTIONS.parent`; update the `parent:` doc comment
- EDIT `schooltest-api/src/bootstrap/permissions-action-refs.ts` — extend the `GET_RESULT_ACTION`
  comment (`:64-67`) to record the fourth role and the 404-not-403 rule
- CREATE `schooltest-web/tests/e2e/parent-result-view.spec.ts`

## Depends on

Nothing. (Independent of the two new endpoints.)

## Steps

1. Read `src/api/result/services/result-view.ts` and `src/api/result/controllers/result.ts` in full.
   Note that the controller sets `ctx.body` to the **BARE** `ResultView` (not a `{ data, meta }`
   envelope) and that output safety comes from the service's explicit field whitelist plus the
   strict `resultViewSchema` guard — that design is preserved exactly.
2. Extend `GatedResultRow` with the parent link and widen the `load(documentId, true)` populate:
   ```ts
   student: {
     fields: ['student_key'],
     populate: {
       user:    { fields: ['username'] },
       teacher: { fields: ['username'] },
       parent:  { fields: ['documentId'] },   // NEW — C-PARENT-RESULT-VIEW ownership
     },
   }
   ```
   Explicit, one extra field. **Never `populate: '*'`.** `student.parent` is a relation to
   `plugin::users-permissions.user` (`student/schema.json`), so `documentId` is the right key —
   never the numeric `id` (contrast the student/teacher branches, which compare `user.id`; the
   parent branch compares `documentId` because that is what
   `.qa/CONTRACTS.md` defines ownership as).
3. Add the branch to `assertMayRead`, **before** the final `throw`:
   ```ts
   if (role === 'parent') {
     if (row.student?.parent?.documentId !== user.documentId) throw new NotFoundError('result not found');
     if (row.destination !== 'official') throw new NotFoundError('result not found');
     return;
   }
   ```
   Both failures are `NotFoundError`, message byte-identical to the `!row` case at `:73` — that is
   the non-disclosure requirement. The other three branches are not touched.
4. Ensure the `AuthUser` type carries `documentId`; extend it in `src/utils/session-creation.ts`
   only if it does not, and only additively.
5. Add `GET_RESULT_ACTION` to `ROLE_ACTIONS.parent`. `ensureRolePermissions` runs on every boot
   regardless of `SEED` (`src/index.ts:48-49`), so the source-edit reload creates the row. Do not
   restart the server by hand; do not touch `SEED` (`.qa/RULES.md`, root D-INT-11).
6. `cd schooltest-api && pnpm tsc --noEmit && pnpm lint`.

## Project rules

- `schooltest-api/CLAUDE.md` §2 rule 3 (never break existing logic — the three existing branches
  are preserved verbatim), rule 4 (never change unrequested code), rules 6, 11/12, 21, 23.
- `.claude/rules/services.md` — the ownership matrix stays in the service.
- `.claude/rules/document-service.md` — explicit nested populate with `fields`.
- `.qa/RULES.md` [schooltest-api] — roles/permissions in code under `src/bootstrap/`, never the
  admin UI.
- `.qa/PLAN.md` "Preserve behaviour" — a broken passing e2e spec is a failure.

## Done criteria

- `cd schooltest-api && pnpm tsc --noEmit` and `pnpm lint` clean.
- `pnpm exec playwright test tests/e2e/parent-result-view.spec.ts` passes:
  - the primary parent reads their own child's OFFICIAL result → **`200`** with the bare
    `ResultView` body; the returned `document_id` equals the requested id;
  - the body carries `attributes` as an object (or `null` while `status='scoring'`), plus
    `scope`, `skill`, `display_label`, `acara_phase`, `cefr_band`, `readiness`, `low_confidence`,
    `effort_valid`, `supplementary`, `productive_scores`, `status`, `published_at`;
  - it parses cleanly against `resultViewSchema` imported from
    `schooltest-api/src/contracts/results.ts` — same schema the server validates with;
  - the result id is obtained from the household endpoint's `children[].skills[].resultDocumentId`
    or via `runSql` against `results` joined to this parent's children (3 official rows live);
  - **the three pre-existing branches still work**: re-run `pnpm exec playwright test` in full and
    confirm every result-reading spec stays green.
- `psql`: `select r.type from up_permissions p join up_permissions_role_lnk l on
  l.permission_id = p.id join up_roles r on r.id = l.role_id where p.action =
  'api::result.result.getResult'` now returns **four** rows — `student`, `teacher`, `admin`,
  `parent` — and survives an API reload. That is this task's persistence proof.
- `grep -n "populate: '\*'" schooltest-api/src/api/result/services/result-view.ts` returns nothing.
- `git diff` on `result-view.ts` shows the student/teacher/admin branches unchanged.
- No i18n change. No UI → motion / 375px / axe **n/a**.
- Baseline regression: full run still 157 passed / 1 pre-existing fail.

## Assumptions

- `ctx.state.user.documentId` is present on a parent JWT — every other parent-scoped controller in
  the repo relies on it (`parent-progress.ts:21`, `search-preference.ts:42`,
  `parent-student-read-actions.ts:57`). If it is ever absent the branch must throw
  `NotFoundError`, never fall through to a permissive path.
- 404-discipline for the remaining edges (`combined` scope children, unknown ids, malformed ids) is
  hardened in task 076; this task lands the happy path plus the two ownership failures.

## Evidence

<!-- filled in as the task runs -->
