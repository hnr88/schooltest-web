---
id: 068
title: SECURITY — prove /api/my/progress leaks no other household and no private column
layer: security
kind: verify
slice: GET /api/my/progress — the auth, ownership and output-leak boundary, proven with real requests
target: schooltest-web/tests/e2e/household-progress-security.spec.ts
contract: C-DASH-HOUSEHOLD
design: n/a — security slice; the contract's auth section is the specification
status: TODO
depends_on: [067]
---

## Objective

`/api/my/progress` is a new cross-child aggregate: one request now returns every child of the
caller, their activity and their assessment state. Prove with real HTTP that it returns exactly the
caller's household and nothing else, that every unauthorised path is refused with the right status,
and that no private column reaches the wire.

## Contract

`.qa/CONTRACTS.md` → **C-DASH-HOUSEHOLD**, auth + errors:

| Status | name | When |
|---|---|---|
| `400` | `ValidationError` | any query parameter present (`'household progress does not accept query parameters'`) |
| `401` | `UnauthorizedError` | absent/invalid JWT |
| `403` | `ForbiddenError` | caller role is not `parent` (`'Only parents can view household progress'`) |

Governing rules: `Authorization: Bearer <users-permissions JWT>`; ownership is
`student.parent.documentId === caller.documentId`; **persistence effect: none** — read-only.
Grant `api::student.parent-dashboard.getHouseholdProgress` → `parent` ONLY.

`.qa/intake/api-inventory.md` UNKNOWNS records that the exact anonymous status (`401` vs `403`) was
never confirmed from code. **This task settles it with a real request and writes the answer into
Evidence** — assert the observed status is one of `401`/`403` and record which, then pin it.

## Design source

n/a — this slice ships no UI. The specification is the contract's auth section plus
`.qa/PLAN.md` "Definition of done": "Contract conformance on the success path AND every
error/auth/ownership path".

## Files

- CREATE `schooltest-web/tests/e2e/household-progress-security.spec.ts`
- No `schooltest-api` file is modified by this task. If an assertion fails, the fix lands as a
  correction to 062-067, not as a weakened assertion.

## Depends on

- **067** — the finished, hardened endpoint.

## Steps

1. Model the spec on `tests/e2e/notification-api-security.spec.ts` (same file, same
   `API_BASE_URL = 'http://localhost:5500'`, same `getToken` / `expectError` helpers) and on
   `tests/e2e/push-subscription-security.spec.ts`.
2. Identities:
   - `parent@schooltest.local` / `Parent1234!` — the primary parent (10 children live).
   - `parent-t06@schooltest.local` / `Parent1234!` — the foreign parent.
   - `teacher@schooltest.local` with `apiEnv('SEED_TEACHER_PASSWORD')` from
     `tests/e2e/helpers/auth-db.ts` — the wrong-role caller. Never hardcode the password
     (`.qa/DECISIONS.md` D-AUTH-1).
3. Assert each row of the matrix below with a real request.
4. Use `runSql` to derive ground truth for the cross-household assertions.

## Project rules

- `schooltest-web/.claude/rules/testing.md`; `.qa/DECISIONS.md` **D-VERIFY-1** (proof is a real
  Playwright run; an independent verifier — never the builder — reproduces it).
- `.qa/RULES.md` [schooltest-api] — never start/stop the server; `psql` reads only.
- `.qa/CONTRACTS.md` governing rules — Strapi v5 error envelope
  `{ data: null, error: { status, name, message, details } }`.

## Done criteria

`pnpm exec playwright test tests/e2e/household-progress-security.spec.ts` passes with every one of
these, each a real request against the API on :5500:

1. **No JWT** → `401` or `403` (assert the concrete observed status and record it in Evidence,
   closing the api-inventory UNKNOWN). Body is the Strapi v5 error envelope with `data: null`.
2. **Malformed Bearer** (`Authorization: Bearer notajwt`) → same status class, never `200`,
   never a stack trace in the body.
3. **Expired/foreign-signature JWT** — reuse a token, then assert a tampered copy (last char
   changed) is refused.
4. **Wrong role** — teacher JWT → `403` `ForbiddenError`. Assert `error.name === 'ForbiddenError'`.
5. **Cross-household isolation** — the foreign parent's response contains a `children[]` whose
   `documentId` set is **disjoint** from the primary parent's. Compute both sets from real
   responses and assert `intersection.size === 0`.
6. **Ground truth** — the primary parent's `children[].documentId` set equals exactly the set from
   `runSql`:
   `select s.document_id from students s join students_parent_lnk pl on pl.student_id = s.id
    join up_users u on u.id = pl.user_id where u.email = 'parent@schooltest.local'`
   (currently 10 rows). No extra child, no missing child.
7. **No private column** — the serialised body contains none of: `passport_number`,
   `student_key`, `password`, `resetPasswordToken`, `confirmationToken`, `parent_guardian_phone`,
   `parent_guardian_email`, `email`, `date_of_birth`, `_artefacts`. Assert by regex over
   `JSON.stringify(body)`.
8. **No numeric `id`** — no object in the response tree has an `id` key; `documentId` only
   (CLAUDE.md §2 rule 6, `.qa/CONTRACTS.md` governing rule).
9. **Query rejection** — `?foo=1`, `?populate=*`, `?filters[parent][documentId][$eq]=<foreign>` and
   `?fields[0]=passport_number` each → `400` `ValidationError`. The third is the important one: a
   caller must not be able to re-point the ownership filter.
10. **Grant matrix** — `runSql` over `up_permissions` for action
    `api::student.parent-dashboard.getHouseholdProgress` returns exactly ONE row and its role type
    is `parent`. Re-run after an API reload to prove idempotence, and confirm no
    `authenticated`/`public` row was created.
11. **Read-only** — `select count(*) from sessions`, `results`, `students` before and after 20
    consecutive requests are identical; no `updatedAt` on any student row moved.
12. **Method surface** — `POST`/`PUT`/`DELETE /api/my/progress` → `404` or `405`, never `200`.

Plus: `cd schooltest-api && pnpm tsc --noEmit` and `pnpm lint` clean; no i18n change; no UI →
motion / 375px / axe **n/a**; full `pnpm exec playwright test` still 157 passed / 1 pre-existing
fail (this spec is additive).

## Assumptions

- The rate limiter is 120 req/min/IP (`config/middlewares.ts:53`). Keep the whole spec under ~40
  requests and do not assert a `429` here — a deliberate limiter probe would poison neighbouring
  specs in the same run.
- `parent-t06@schooltest.local` exists in the live database (verified) and owns at least one child.
  If it owns none, the disjointness assertion still holds (empty set) and the task records that the
  stronger both-non-empty form could not be exercised.

## Evidence

<!-- filled in as the task runs: the concrete anon status, the two documentId sets, the grant row -->
