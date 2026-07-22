---
id: 076
title: Enforce 404-only failure and combined-scope child gating on the parent result read
layer: backend
kind: fix
slice: GET /api/results/:documentId — a parent can never distinguish "not yours" from "does not exist"
target: schooltest-api/src/api/result/services/result-view.ts · schooltest-web/tests/e2e/parent-result-view-404.spec.ts
contract: C-PARENT-RESULT-VIEW
design: .qa/design/spec/02-portal-children.md#b6-component-recentresults (`Report` action target)
status: TODO
depends_on: [075]
---

## Objective

`GET /api/results/:documentId` takes an opaque id. If a parent can tell "this id exists but isn't
yours" apart from "this id doesn't exist", the endpoint becomes an oracle for enumerating other
families' results. Close every path that leaks that difference — including the one the existing
combined-scope code path opens.

## Contract

`.qa/CONTRACTS.md` → **C-PARENT-RESULT-VIEW**:

> **Ownership:** the result's `student.parent.documentId` MUST equal the caller's `documentId`
> **and** `destination` MUST be `official`. Anything else ⇒ `404 NotFoundError` (never 403 — a
> parent must not be able to probe which result ids exist).
>
> **Errors:** `401` no/invalid JWT · `403` role not permitted · `404` unknown id, foreign child, or
> `destination='transient'`.

Plus the governing rule: "a foreign or unknown child is **404**, never 403, so the endpoint cannot
be used to enumerate other families' children."

The **combined** path needs its own rule. `result-view.ts:78-87` resolves a `scope='combined'`
parent result into nested `combined_children` views and deliberately skips the per-child re-gate
with the comment *"Children are the same student's official skill results — ownership holds by
construction (parent already gated), so no per-child re-gate."* That invariant was written for the
student/teacher/admin branches. This task states and PROVES it for the parent branch, or adds the
re-gate if it does not hold.

## Design source

`.qa/design/spec/02-portal-children.md` §B.6 — the `Report` action (`13px/600/#2563EB`,
`--color-brand-600`) deep-links a history row to this endpoint. Every id a parent can obtain comes
from an owned surface (`/my/progress` `skills[].resultDocumentId`, or
`/my/students/:documentId/results` `documentId`), so in normal use a `404` here is unreachable —
which is exactly why the failure paths must be proven deliberately rather than observed by
accident. No UI ships in this task.

## Files

- EDIT `schooltest-api/src/api/result/services/result-view.ts`
- CREATE `schooltest-web/tests/e2e/parent-result-view-404.spec.ts`

## Depends on

- **075** — the parent branch this hardens.

## Steps

1. Confirm the `!row` case (`result-view.ts:73`) and both parent-branch failures throw
   `NotFoundError` with the **same message string**. If 075 used a distinct message for the
   ownership failure, unify them now — a different message is a leak.
2. Add a malformed-id guard: a `documentId` that does not match `/^[a-z0-9]{24}$/i` currently
   reaches `strapi.documents().findOne`. For a **parent** caller it must produce the same `404`,
   not a `400` and never a driver error surfacing as a `500`. Handle it in the service before the
   read, and leave the other roles' behaviour exactly as it is today.
3. **Combined-scope gating.** For `scope='combined'` results read by a parent, either:
   - prove the invariant — every `childResultIds()` target belongs to the same student AND has
     `destination='official'` — with an explicit assertion in the service that throws
     `NotFoundError` when violated; or
   - if the invariant does not hold in real data, re-gate each child with the parent's ownership
     rule and drop non-conforming children.
   Whichever branch is taken, it must be code, not a comment. **690 `scope='combined'` official
   rows exist live**, so this is a real path, not a hypothetical.
4. Confirm the nested `combined_children` views cannot carry a transient child: filter on
   `destination === 'official'` for the parent branch.
5. Do not change the student/teacher/admin behaviour anywhere. `git diff` must show additive
   branches only.
6. `cd schooltest-api && pnpm tsc --noEmit && pnpm lint`.

## Project rules

- `schooltest-api/CLAUDE.md` §2 rule 3 (never break existing logic), rule 21 (typed
  `@strapi/utils` errors — never a bare throw that leaks as a 500 with a driver message), rule 23.
- `.claude/rules/services.md` — the ownership matrix stays in the service.
- `.qa/CONTRACTS.md` C-PARENT-RESULT-VIEW ownership + errors, and the addendum's governing
  ownership rule.
- `.qa/PLAN.md` definition of done: "Contract conformance on the success path AND every
  error/auth/ownership path".

## Done criteria

- `cd schooltest-api && pnpm tsc --noEmit` and `pnpm lint` clean.
- `pnpm exec playwright test tests/e2e/parent-result-view-404.spec.ts` passes, each case a real
  request with the primary parent's JWT:
  - **foreign child's official result** (id read via `runSql` for a child of
    `parent-t06@schooltest.local`) → `404` `NotFoundError`;
  - **own child's transient result** (the primary parent has **15** live) → `404` `NotFoundError`;
  - **unknown but well-formed id** (24 chars, not in `results`) → `404` `NotFoundError`;
  - **malformed id** (`abc`, a 25-char string, `%2e%2e%2f`) → `404` for a parent, never `500`,
    never a driver message in the body;
  - **all four bodies are byte-identical** after normalising any request id — same `status`, same
    `name`, same `message`, same `details`. Assert the equality explicitly; this is the
    non-disclosure proof;
  - **`403` is never returned to a granted parent** for any of the above (grep the four bodies for
    `Forbidden` — must find nothing);
  - **combined scope:** request a `scope='combined'` official result owned by the parent (pick one
    via `runSql` if the seeded household has one; otherwise assert the guard with the nearest
    available combined row and record the coverage gap). Assert `combined_children` is present, is
    an array, and every element's `destination` is `official` and belongs to the same student — via
    `runSql` on each child id;
  - **timing:** the four failure paths do not differ in a way that reveals existence. A crude
    equality of response bodies plus a note that no timing oracle was engineered is sufficient here;
    do not build a timing harness.
- **Non-regression for the other roles:** a student reading their own **transient** result still
  gets `200` (the student branch deliberately allows any destination — `result-view.ts:57-60`), and
  a teacher reading a transient result still gets `403` with the message
  `'transient results are not visible to teachers (C-4)'`. Prove both with real requests using
  `apiEnv('SEED_STUDENT_PASSWORD')` / `apiEnv('SEED_TEACHER_PASSWORD')`.
- `git diff schooltest-api/src/api/result/services/result-view.ts` shows no change to the
  `admin` / `student` / `teacher` branches.
- No i18n change. No UI → motion / 375px / axe **n/a**.
- Baseline regression: full `pnpm exec playwright test` still 157 passed / 1 pre-existing fail.

## Assumptions

- Student credentials are `student1@schooltest.local` with `apiEnv('SEED_STUDENT_PASSWORD')`
  (`src/bootstrap/seed-users-data.ts:22-25`). If that account cannot log in, the student
  non-regression assertion is recorded as a coverage gap in Evidence rather than dropped silently.
- If no combined result is owned by a known-credential parent, the combined assertion runs against
  the guard logic via the nearest reachable row and the gap is recorded. The guard still ships.

## Evidence

<!-- filled in as the task runs -->
