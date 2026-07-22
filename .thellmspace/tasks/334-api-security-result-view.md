---
id: 334
title: API security — the widened result read refuses foreign, transient and forged requests
layer: security
kind: verify
slice: `GET /api/results/:documentId` — the parent branch added by C-PARENT-RESULT-VIEW
target: tests/e2e/api-security-result-view.spec.ts (new); schooltest-api/src/api/result/services/result-view.ts and its grant, only if a refusal is missing
contract: C-PARENT-RESULT-VIEW
design: n/a
status: TODO
depends_on: []
---

## Objective

This mission **widens who can read a result row** — a parent branch is added to an endpoint that
previously refused parents outright. That is the single most security-sensitive change in the
mission, and `.qa/CONTRACTS.md` makes its proof mandatory. Prove with real requests that a parent
reaches exactly their own children's **official** results and nothing else, and that every refusal
is a `404` so result ids cannot be probed.

## Contract

**C-PARENT-RESULT-VIEW — `GET /api/results/:documentId` (parent branch)**, quoted from
`.qa/CONTRACTS.md`:

- **Additive change to an existing endpoint.** Today `result-view.ts` has student/teacher/admin
  branches and a parent falls through to `403 'role may not read results (C-4)'` (gap **G2**).
- **Transport:** `GET /api/results/:documentId` (route already exists; no new route file).
- **Auth:** parent JWT. New grant: `result.getResult` → `parent`.
- **Ownership:** the result's `student.parent.documentId` MUST equal the caller's `documentId`
  **and** `destination` MUST be `official`. Anything else ⇒ **`404 NotFoundError`** (never 403 —
  a parent must not be able to probe which result ids exist).
- **Success:** `200` with the EXISTING `ResultView` shape from
  `schooltest-api/src/contracts/results.ts` — no new shape, no parent-specific variant. Fields
  the UI consumes: `scope`, `skill`, `attributes` (`{status, prob, prob_se?, items, delta}` per
  attribute code), `display_label`, `acara_phase`, `cefr_band`, `readiness`, `low_confidence`,
  `effort_valid`, `supplementary`, `productive_scores`, `status`, `published_at`.
- **Errors:** `401` no/invalid JWT · `403` role not permitted · `404` unknown id, foreign child,
  or `destination='transient'`.
- **Persistence effect:** none.
- **Security note (verbatim):** *"this widens who can read a result row. The verify task for it
  MUST prove, with real requests: parent reads own child's official result → 200; parent reads
  ANOTHER parent's child's result → 404; parent reads own child's transient result → 404;
  no JWT → 401."*

Pre-existing double lock recorded in `.qa/intake/api-inventory.md` §3.2: *"even if the
`getResult` grant were added, the ownership matrix in
`schooltest-api/src/api/result/services/result-view.ts:54-68` has no `parent` branch — a parent
caller falls through to `throw new ForbiddenError('role may not read results (C-4)')` at `:67`."*
Both locks must now open for the owning parent and for nobody else.

**No composite scores** (`.qa/CONTRACTS.md` governing rules, quoting
`docs/SCHOOLTEST_DOC0_PLATFORM_PRD_V2.md:25,46,193`): no cut scores, no cross-skill composites,
no computed CEFR score. The response must carry none.

## Design source

n/a — security task. The consumer is
`.qa/design/spec/02-portal-children.md` screen B "Skills" (per-skill bars + grade), which reads
`attributes` per-attribute mastery probabilities — the primary datum per
`docs/SCHOOLTEST_DOC0_PLATFORM_PRD_V2.md:45`.

## Files

- `tests/e2e/api-security-result-view.spec.ts` (new)
- Only if a refusal is missing: `schooltest-api/src/api/result/services/result-view.ts`,
  `schooltest-api/src/bootstrap/permissions-actions.ts` (grant matrix, code only — never the
  admin UI)
- Never the Strapi admin Content-Type Builder; never the admin UI for roles/permissions

## Depends on

No intra-wave dependency.
Wave gate (prose): **W2 (060-081)** must be DONE — it adds the parent branch, the grant and its
own security test. This task is the independent adversarial re-proof.

## Steps

1. Build the caller matrix with Playwright's `request` fixture against `http://localhost:5500`:
   **A** the seeded parent; **B** a throwaway second parent with its own child
   (`tests/e2e/helpers/throwaway-parent.ts`); **C** no JWT; **D** a forged JWT (signature byte
   flipped, and a second variant re-signed with a wrong secret); **E** an expired JWT;
   **F** a non-parent role JWT if one is reachable from the seed (else recorded not-run).
2. Discover real result ids **from the API, never from a literal**: call
   `GET /api/my/students/:documentId/results` (C-CHILD-RESULT-HISTORY) as A to get A's official
   result documentIds, and as B to get B's. Find a **transient** result for one of A's children
   with a direct read: `select document_id from results where destination = 'transient' and …`
   via `runSql` from `tests/e2e/helpers/auth-db.ts` (read-only; dropping/truncating is
   forbidden).
3. Assert the four mandated rows verbatim from the contract:
   - A → A's own child's **official** result → **`200`**, body matches the `ResultView` shape
     (assert every consumed field is present with the contracted type; `attributes` is an object
     keyed by attribute code whose values carry `status`, `prob`, `items`, `delta`).
   - A → **B's** child's result → **`404`** `NotFoundError`.
   - A → A's own child's **transient** result → **`404`**.
   - C (no JWT) → **`401`**.
4. Extend the matrix: D (both forgeries) → `401`; E → `401`; F → `403`;
   A → a syntactically valid but nonexistent documentId → `404`;
   A → a malformed documentId → `400` or `404` (assert whichever the code actually returns and
   record it — D-CONTRACT-1: the code is the contract).
5. **Enumeration-safety proof:** assert the response for "B's result", "transient result",
   "nonexistent id" are **byte-identical** — same status, same `error.name`, same
   `error.message`, same `details`. Any difference is a probe oracle and a failure.
6. **Timing-oracle sanity check:** issue each of those three refusals 20 times and assert the
   median latencies are within the same order of magnitude (report the numbers; a 10× gap is
   flagged in Evidence as a finding, not silently ignored).
7. **No-leak proof:** assert the `200` body contains no student PII beyond what the contract
   lists — no `parent`, no `user`, no email, no `passport_number` — and no numeric `id` where a
   `documentId` is contracted.
8. **No-composite proof:** assert the body carries no cross-skill percentage, no total/overall
   score field, and no computed CEFR score — only `cefr_band` (a Crosswalk lookup),
   `acara_phase`, `readiness` and per-attribute `prob` values.
9. **Regression guard on the pre-existing branches:** assert a student/teacher/admin caller (if
   reachable) still gets its previous behaviour, i.e. widening the matrix did not accidentally
   open or close another role's branch. If those roles are not reachable, assert at minimum that
   the grant matrix in `permissions-actions.ts` still lists them for `result.getResult` and
   record the source line.
10. Fix any missing refusal in `result-view.ts` with a typed `@strapi/utils` error — never a bare
    throw, never a policy relaxation, never a message that discloses existence.
11. Clean up: remove throwaway parent B and its child; no result row is created or modified
    (this endpoint is read-only).

## Project rules

- `schooltest-api` rules (`.qa/RULES.md` [schooltest-api]): `strapi.documents()` only;
  `documentId`, never numeric `id`; explicit `populate`, never `'*'`; typed errors from
  `@strapi/utils`; thin controllers, logic in services; grants defined in code under
  `src/bootstrap/`, **never the admin UI**; run `pnpm strapi ts:generate-types` after any schema
  change (none expected here); **never start/stop the API server**.
- `.qa/CONTRACTS.md` C-PARENT-RESULT-VIEW security note — the four mandated rows are not
  optional.
- `.qa/DECISIONS.md` D-CONTRACT-1 — where the doc and the running code disagree, the code is the
  contract and the disagreement is recorded.
- `.claude/rules/testing.md`, D-VERIFY-1.

## Done criteria

- `pnpm tsc --noEmit` + `pnpm lint` clean (web, and api if touched).
- `pnpm exec playwright test tests/e2e/api-security-result-view.spec.ts` passes with the four
  contract-mandated rows asserted **verbatim** plus the extended matrix (forged ×2, expired,
  non-parent role, nonexistent id, malformed id).
- Every result documentId used in the run was **discovered from the live API or a read-only SQL
  query** — zero hardcoded ids.
- The three refusal bodies (foreign / transient / nonexistent) are proven byte-identical.
- The `200` body is proven to match `ResultView` field-by-field for every consumed field, with
  no PII beyond the contract, no numeric `id` where `documentId` is contracted, and no composite
  or computed CEFR score.
- Timing medians recorded in Evidence for the three refusal shapes.
- Throwaway parent B and its child removed; `select count(*) from results` unchanged.
- Zero banned-pattern grep hits in the diff.

## Assumptions

- At least one **official** result and one **transient** result exist for a child of the seeded
  parent. If no transient result exists, the task is BLOCKED with that exact fact rather than
  inserting one by hand — creating a result row outside the scoring pipeline would be inventing
  data (D-SCOPE-1 §4).
- Non-parent role credentials may be unavailable (D9); those rows are recorded not-run with the
  reason.

## Evidence

<!-- filled in as the task runs: the full matrix, byte-identical refusal bodies, timing medians -->
