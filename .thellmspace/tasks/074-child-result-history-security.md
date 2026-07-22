---
id: 074
title: SECURITY — prove the child result history refuses foreign children, transient results and bad queries
layer: security
kind: verify
slice: GET /api/my/students/:documentId/results — the auth, ownership, scope and query boundary
target: schooltest-web/tests/e2e/child-result-history-security.spec.ts
contract: C-CHILD-RESULT-HISTORY
design: n/a — security slice; the contract's auth/scope sections are the specification
status: TODO
depends_on: [073]
---

## Objective

This endpoint hands a parent a paged window onto the `results` table for the first time. Prove with
real HTTP that the window is exactly one owned child's official results, that ownership failures are
indistinguishable from nonexistence, and that no query parameter can widen either boundary.

## Contract

`.qa/CONTRACTS.md` → **C-CHILD-RESULT-HISTORY**:

- **Auth:** parent JWT; grant `api::student.parent-results.listChildResults` → `parent`.
  Ownership: unknown/foreign child ⇒ **`404`**.
- **Scope:** `destination='official'` ONLY. Practice/transient results stay invisible to parents
  (preserves the `getParentProgress` boundary; gap **G8** left open deliberately).
- **Errors:** `400` bad/unknown query · `401` no JWT · `403` non-parent role · `404` unknown or
  foreign child.
- **Persistence effect:** none.
- Governing rule: "a foreign or unknown child is **404**, never 403, so the endpoint cannot be used
  to enumerate other families' children."

## Design source

n/a — no UI. The specification is the contract plus `.qa/PLAN.md`'s definition of done: "Contract
conformance on the success path AND every error/auth/ownership path".

## Files

- CREATE `schooltest-web/tests/e2e/child-result-history-security.spec.ts`
- No `schooltest-api` file is modified. A failing assertion is fixed in 070-073, never by weakening
  the assertion.

## Depends on

- **073** — the finished endpoint.

## Steps

1. Model on `tests/e2e/notification-api-security.spec.ts` (API-level, `API_BASE_URL =
   'http://localhost:5500'`, `getToken`, `expectError`).
2. Identities: `parent@schooltest.local`/`Parent1234!` (primary),
   `parent-t06@schooltest.local`/`Parent1234!` (foreign parent),
   `teacher@schooltest.local` with `apiEnv('SEED_TEACHER_PASSWORD')` (wrong role). Never hardcode a
   non-parent password (`.qa/DECISIONS.md` D-AUTH-1).
3. Derive ground truth with `runSql` from `tests/e2e/helpers/auth-db.ts`.

## Project rules

- `schooltest-web/.claude/rules/testing.md`; `.qa/DECISIONS.md` **D-VERIFY-1**.
- `.qa/RULES.md` [schooltest-api] — never start/stop the server; `psql` reads only.
- `.qa/CONTRACTS.md` governing rules — the Strapi v5 error envelope.

## Done criteria

`pnpm exec playwright test tests/e2e/child-result-history-security.spec.ts` passes with every one
of these as a real request:

1. **No JWT** → `401` or `403`; body is the v5 error envelope with `data: null`. Record the
   concrete status (closes the same api-inventory UNKNOWN as task 068 for this path).
2. **Malformed Bearer** → same class, never `200`, no stack trace in the body.
3. **Wrong role** — teacher JWT → `403` `ForbiddenError`; assert `error.name`.
4. **Foreign child → 404.** Read a child documentId belonging to `parent-t06@schooltest.local` via
   `runSql`, request it with the PRIMARY parent's JWT → `404` `NotFoundError`.
5. **Unknown child → 404 with a byte-identical body** to case 4. Diff the two response bodies:
   they must not differ in message, `details`, or any field that would let a caller distinguish
   "exists but not yours" from "does not exist". This is the enumeration guard.
6. **Malformed documentId** (`abc`, `../../etc/passwd`, a 25-char string, an empty segment) →
   `400` `ValidationError` `'invalid child results document id'` with
   `details.fields: ['documentId']`, never a 500 and never a 200.
7. **Transient invisibility.** The primary parent has **15 transient results** live. Read their
   documentIds with `runSql`; assert **none** appears in ANY page of the response for the owning
   child, at any `pageSize`, with or without `?skill=`.
8. **Scope cannot be widened.** `?filters[destination][$eq]=transient`,
   `?filters[destination][$ne]=official`, `?destination=transient`, `?publicationState=preview`,
   `?status=draft` → each `400` (unknown key). And where any of them is silently accepted, the
   returned ids must still be the official-only set — assert both.
9. **Ownership cannot be re-pointed.** `?filters[student][documentId][$eq]=<foreign child>` → `400`;
   and the path child's ids are returned unchanged.
10. **Cross-child isolation.** For two of the primary parent's own children, the returned id sets
    are disjoint, and each equals its own SQL official-result set.
11. **No PII, no private column.** The serialised body contains none of: `attributes`,
    `_artefacts`, `productive_scores`, `supplementary`, `passport_number`, `student_key`,
    `given_name`, `family_name`, `email`, `parent`, `password`. This endpoint is a list of result
    metadata; the per-attribute map belongs to C-PARENT-RESULT-VIEW alone.
12. **No numeric `id`** anywhere in the response tree.
13. **Grant matrix.** `runSql` over `up_permissions` for
    `api::student.parent-results.listChildResults` returns exactly one row, role `parent`; no
    `teacher`, `student`, `admin`, `authenticated` or `public` row exists. Re-assert after an API
    reload.
14. **Read-only.** `select count(*) from results` and `select max(updated_at) from results` are
    unchanged across 20 consecutive requests.
15. **Method surface.** `POST`/`PUT`/`DELETE` on the path → `404`/`405`, never `200`.

Plus: `cd schooltest-api && pnpm tsc --noEmit` and `pnpm lint` clean; no i18n change; no UI →
motion / 375px / axe **n/a**; full `pnpm exec playwright test` still 157 passed / 1 pre-existing
fail.

## Assumptions

- Keep the whole spec under ~40 requests: the global limiter is 120 req/min/IP
  (`config/middlewares.ts:53`) and a limiter trip would poison neighbouring specs in the same run.
  Do not deliberately probe `429` here.
- Case 5's byte-identical requirement compares the JSON bodies after removing any timestamp-like
  field; if the framework injects a request id, normalise it and say so in Evidence.

## Evidence

<!-- filled in as the task runs -->
