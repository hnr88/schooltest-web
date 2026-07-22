---
id: 077
title: SECURITY — prove the widened result read leaks no PII, no artefacts and no other family's data
layer: security
kind: verify
slice: GET /api/results/:documentId — the full auth/ownership/output-leak boundary for the new parent role
target: schooltest-web/tests/e2e/parent-result-view-security.spec.ts
contract: C-PARENT-RESULT-VIEW
design: n/a — security slice; the contract's security note is the specification
status: TODO
depends_on: [076]
---

## Objective

`.qa/CONTRACTS.md` states plainly: "this widens who can read a result row." Discharge the
contract's own verification demand with real requests, and prove the widened surface exposes only
what the parent branch is meant to expose.

## Contract

`.qa/CONTRACTS.md` → **C-PARENT-RESULT-VIEW**, security note, quoted verbatim:

> The verify task for it MUST prove, with real requests: parent reads own child's official result
> → 200; parent reads ANOTHER parent's child's result → 404; parent reads own child's transient
> result → 404; no JWT → 401.

Plus the shape guarantee: "**Success `200`** with the EXISTING `ResultView` shape from
`schooltest-api/src/contracts/results.ts` — no new shape, no parent-specific variant."

And the reserved-key discipline the view already enforces
(`src/utils/result-view.ts:20-21,55-71`): the stored `attributes` json carries `_artefacts`
(internal psychometric artefacts — **DROPPED**) and `provisional` (**LIFTED** to the root). Neither
may ever surface inside the view's `attributes` map.

## Design source

n/a — no UI. The specification is the contract's security note plus `.qa/PLAN.md`'s definition of
done.

## Files

- CREATE `schooltest-web/tests/e2e/parent-result-view-security.spec.ts`
- No `schooltest-api` file is modified. A failing assertion is fixed in 075/076.

## Depends on

- **076** — the hardened parent branch.

## Steps

1. Model on `tests/e2e/notification-api-security.spec.ts` and
   `tests/e2e/push-subscription-security.spec.ts` (API-level, `API_BASE_URL =
   'http://localhost:5500'`).
2. Identities: `parent@schooltest.local`/`Parent1234!`, `parent-t06@schooltest.local`/`Parent1234!`,
   `teacher@schooltest.local` + `apiEnv('SEED_TEACHER_PASSWORD')`,
   `student1@schooltest.local` + `apiEnv('SEED_STUDENT_PASSWORD')`. Never hardcode a non-parent
   password (`.qa/DECISIONS.md` D-AUTH-1).
3. Derive every result id from `runSql`, never from a hardcoded literal.

## Project rules

- `schooltest-web/.claude/rules/testing.md`; `.qa/DECISIONS.md` **D-VERIFY-1** (an independent
  verifier — never the builder — reproduces the evidence).
- `.qa/RULES.md` [schooltest-api] — never start/stop the server; `psql` reads only.
- `.qa/CONTRACTS.md` C-PARENT-RESULT-VIEW.

## Done criteria

`pnpm exec playwright test tests/e2e/parent-result-view-security.spec.ts` passes with every one of
these, each a real request:

**The four the contract names explicitly**
1. Parent reads own child's **official** result → **`200`**.
2. Parent reads **another parent's** child's result → **`404`**.
3. Parent reads own child's **transient** result → **`404`**.
4. **No JWT** → **`401`** (assert the concrete status; if the observed value is `403`, record it
   and reconcile the contract per `.qa/DECISIONS.md` **D-CONTRACT-1** — code is authoritative —
   rather than weakening the assertion).

**Output leak**
5. The `200` body parses against `resultViewSchema` from `schooltest-api/src/contracts/results.ts`
   — strict, so an unexpected key is a failure by construction.
6. `JSON.stringify(body)` contains **none** of: `_artefacts`, `map_pattern`, `map_posterior`,
   `lexical_decision_dprime`, `student_key`, `given_name`, `family_name`, `passport_number`,
   `email`, `parent`, `teacher`, `username`, `password`. The populate reads `student_key`,
   `username` and `parent.documentId` for GATING only — none may reach the wire.
7. No numeric `id` key anywhere in the response tree; ids are `document_id` /
   `previous_result_document_id` / `session_document_id` only.
8. `attributes` values are each either the literal `'not_assessed'` or an object whose keys are a
   subset of `{status, prob, prob_se, items, delta}` — nothing else.
9. `provisional` is `null` or the literal `'field_test'` and appears at the ROOT, never inside
   `attributes`.
10. For a `scope='combined'` result, every `combined_children[]` element satisfies 5-9 as well.

**Role matrix**
11. Teacher reading a **parent-owned, non-teacher-owned** result still `403` with the existing
    message — the parent branch did not accidentally widen the teacher path.
12. Student reading someone else's result still `403 'not your result (C-4)'`.
13. Student reading their **own transient** result still `200` — the existing, deliberate
    behaviour (`result-view.ts:57-60`) is preserved.
14. Admin behaviour unchanged (any result readable).
15. `runSql` over `up_permissions` for `api::result.result.getResult` returns exactly the four
    roles `student`, `teacher`, `admin`, `parent` — no `authenticated`, no `public` row. Re-assert
    after an API reload.

**General**
16. Malformed / unknown ids → `404` for a parent, never `500`, never a driver message.
17. **Read-only:** `select count(*) from results` and `select max(updated_at) from results` are
    unchanged across 20 consecutive reads.
18. `POST`/`PUT`/`DELETE /api/results/:documentId` with a parent JWT → `403`/`404`/`405`, never
    `200` — the core CRUD router stays admin-only (`src/api/result/routes/result.ts:7-8`).

Plus: `cd schooltest-api && pnpm tsc --noEmit` and `pnpm lint` clean; no i18n change; no UI →
motion / 375px / axe **n/a**; full `pnpm exec playwright test` still 157 passed / 1 pre-existing
fail.

## Assumptions

- Keep the spec under ~40 requests (limiter is 120 req/min/IP, `config/middlewares.ts:53`); do not
  probe `429`.
- The `.qa/intake/api-inventory.md` UNKNOWN about anonymous `401` vs `403` is closed by case 4 for
  this path; record the observed value verbatim in Evidence so W3's error-handling contract can
  rely on it.

## Evidence

<!-- filled in as the task runs -->
