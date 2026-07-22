---
id: 333
title: API security — the parent student surface and the two new aggregates refuse every unauthorized and forged request
layer: security
kind: verify
slice: Endpoints #1-#8 (`/my/students*`, `/students*`, magic-link) plus C-DASH-HOUSEHOLD and C-CHILD-RESULT-HISTORY
target: tests/e2e/api-security-parent-students.spec.ts (new); schooltest-api handlers only if a refusal is missing
contract: C-DASH-HOUSEHOLD, C-CHILD-RESULT-HISTORY
design: n/a
status: TODO
depends_on: []
---

## Objective

Prove, with **real HTTP requests against the running Strapi on :5500**, that every endpoint in the
parent student surface refuses the wrong caller with the exact contracted status, name and
message — no JWT, a forged/tampered JWT, a non-parent role, and another family's child — and that
no refusal leaks whether a resource exists.

## Contract

**C-DASH-HOUSEHOLD — `GET /api/my/progress`** (`.qa/CONTRACTS.md`):
| Status | name | When |
|---|---|---|
| `400` | `ValidationError` | any query parameter present (`'household progress does not accept query parameters'`) |
| `401` | `UnauthorizedError` | absent/invalid JWT |
| `403` | `ForbiddenError` | caller role is not `parent` (`'Only parents can view household progress'`) |
Persistence effect: none.

**C-CHILD-RESULT-HISTORY — `GET /api/my/students/:documentId/results`** (`.qa/CONTRACTS.md`):
`400` bad/unknown query (incl. `pageSize > 50`) · `401` no JWT · `403` non-parent role ·
**`404` unknown or foreign child** — never 403, so the endpoint cannot enumerate other families.

Existing surface, quoted from `.qa/intake/api-inventory.md`:
- **#1 `GET /api/my/students`** — `403 ForbiddenError "Only parents can list their students"`;
  server-forced `{ parent: { documentId: { $eq: caller.documentId } } }` applied **after**
  `sanitizeQuery` (that ordering is what prevents a cross-tenant leak); caller `filters[...]` are
  `$and`-ed so they can only NARROW.
- **#2 `GET /api/my/students/:documentId`** — `403 "Only parents can view their students"`;
  foreign or unknown ⇒ **404** `"Student <documentId> not found"`; `passport_number` is
  `private: true` and stripped by `sanitizeOutput`.
- **#3 `GET /api/my/students/:documentId/progress`** — `400
  "child progress does not accept query parameters"`; `400 "invalid child progress document id"`
  when `documentId` fails `/^[a-z0-9]{24}$/i`; `403 "Only parents can view child progress"`;
  `404 "student not found"`.
- **#4 `POST /api/students`** — `parent, teacher, class, user, student_key, status` are DELETED
  before validation; `parent: caller.documentId` and `status: 'active'` are injected **after**
  `sanitizeInput`, so a client-sent `parent`/`status` is inert. `403 ForbiddenError "Forbidden"`
  for teacher/student. Server media gate: `image/*` ≤15360 KB, `audio/*` ≤10240 KB.
- **#5 `PUT /api/students/:documentId`** — missing ⇒ `404 "Student <id> not found"`;
  owner mismatch ⇒ `403 ForbiddenError "You do not own this student"`.
- **#6/#7 archive/unarchive** — parent only; **admin included in the hard-403**; same
  ownership rules; idempotent (already-target ⇒ no write, `updatedAt` unchanged).
- **#8 `POST /api/students/:documentId/magic-link`** — `403 "Only parents can issue student
  magic links"` / `403 "Only the owning parent can issue a magic link for this student"`;
  `404 "Student not found"`; `400 "Student has no email on file"`; success is the BARE body
  `{ "ok": true }` (no `data`/`meta` envelope); its own `checkRateLimit` on top of the global one.
- **Granted but inert:** `api::student.student.find` / `.findOne` — the core router gates them
  with `global::is-teacher`, so a parent JWT 403s at the policy layer.
- **Global:** `global::rate-limit`, in-memory fixed window keyed by client IP,
  `RATE_LIMIT_MAX` default **120 requests / 60 000 ms**, over budget ⇒ **429** with `Retry-After`.
- **Error envelope:** `{ "data": null, "error": { "status", "name", "message", "details" } }`.

## Design source

n/a — security task.

## Files

- `tests/e2e/api-security-parent-students.spec.ts` (new)
- Only if a refusal is genuinely missing: the owning handler in `schooltest-api/src/api/student/**`
  or `schooltest-api/src/utils/parent-student-read-actions.ts` (thin controller, logic in the
  service, typed errors from `@strapi/utils`)
- Never the Strapi admin UI; never `src/bootstrap/**` edited outside code

## Depends on

No intra-wave dependency.
Wave gate (prose): **W2 (Backend metric surfaces, ids 060-081)** must be DONE — it delivers
C-DASH-HOUSEHOLD and C-CHILD-RESULT-HISTORY and their own security tests; this task is the
independent cross-cutting re-proof over the whole surface.

## Steps

1. Build the caller matrix using Playwright's `request` fixture against
   `http://localhost:5500` directly (not through the web app):
   - **A**: the seeded parent (`parent@schooltest.local` / `Parent1234!`,
     `tests/e2e/helpers/auth.ts`) — real JWT from `POST /api/auth/local`.
   - **B**: a second, throwaway parent created through the real registration + Mailpit
     confirmation flow (`tests/e2e/helpers/throwaway-parent.ts`) with its own child — the
     cross-tenant probe. Cleaned up at the end.
   - **C**: no `Authorization` header at all.
   - **D**: a **forged** JWT — same header/payload as A's but with one byte of the signature
     flipped; and a second forgery with `sub`/`id` rewritten to B's user id and re-signed with a
     wrong secret.
   - **E**: a structurally valid but expired token (mint one, or reuse the
     `tests/e2e/helpers/auth-db.ts` helpers to age a token) — asserts `401`, not a 500.
   - **F**: a non-parent role's JWT if one is reachable from the seed (teacher/student per
     `.qa/DECISIONS.md` D9); if no non-parent password is available, this row is recorded as
     not-run with the reason, never faked.
2. For **every** endpoint #1-#8 and both new aggregates, assert the full matrix:
   | caller | expectation |
   |---|---|
   | A on A's own resource | the contracted `2xx` |
   | C (no JWT) | `401`, envelope shape `{data:null,error:{status,name,message}}` |
   | D (forged signature / re-signed) | `401` — **never** a 200, never a 500 |
   | E (expired) | `401` |
   | F (non-parent role) | `403` with the exact contracted message string |
   | A on **B's** child documentId | **`404`** for every `/my/*` read and for
     C-CHILD-RESULT-HISTORY; `403 "You do not own this student"` for `PUT`/archive/unarchive
     (that asymmetry is the contract — assert it exactly, do not normalise it) |
   | A on a syntactically valid but nonexistent documentId | `404` |
3. Enumeration-safety proof: assert the response bodies for "foreign child" and "nonexistent
   child" are **byte-identical** for every `/my/*` read (same status, same `error.name`, same
   `error.message`, same `details`) — a difference is an enumeration oracle and a failure.
4. Query-tampering proof on **#1**: send `filters[parent][documentId][$eq]=<B's documentId>` and
   assert the response still contains only A's children (the forced filter is applied **after**
   `sanitizeQuery` and `$and`-ed, so a caller filter can only narrow). Send
   `pagination[pageSize]=10000` and assert it is clamped to ≤100. Send `sort=parent.email:desc`
   and assert either a `400` or a response with no `parent` relation leaked.
5. Body-tampering proof on **#4**: `POST /api/students` with
   `{ data: { …valid…, parent: '<B documentId>', status: 'archived', student_key: 'x',
   user: 1, teacher: 1, class: 1 } }` and assert the created row's `parent` is **A** and its
   `status` is `active` — proven by reading the row back with `runSql`. Delete the fixture.
6. Private-field proof: assert `passport_number` never appears in any response body from #2,
   #3 or #5, even when it is set on the row (set it via #5, read it back, assert absent, then
   clear it).
7. Aggregate-specific negatives: `GET /api/my/progress?anything=1` → `400 ValidationError` with
   the exact message; `GET /api/my/students/<invalid-id>/progress` → `400 "invalid child
   progress document id"` with `details.fields: ['documentId']`;
   `GET /api/my/students/<A child>/results?pageSize=51` → `400`;
   `?skill=maths` → `400`; `?unknownKey=1` → `400`.
8. Rate limit: fire 121 requests within the window from one IP against a cheap endpoint and
   assert the 121st returns **429** with a `Retry-After` header and the contracted message
   `"Too many requests, please slow down."` — then wait out the window so the rest of the suite
   is unaffected (run this test **serially**, `test.describe.serial`, and last in the file).
9. Assert the C-DASH-HOUSEHOLD and C-CHILD-RESULT-HISTORY responses contain **no composite
   score**: no field whose value is a percentage of a cross-skill aggregate, no computed CEFR
   score — only `cefrBand`, `cefrStageIndex`, `acaraPhase`, `readiness`, and per-attribute data
   (`docs/SCHOOLTEST_DOC0_PLATFORM_PRD_V2.md:25,46,193`, quoted in `.qa/CONTRACTS.md`).
10. If any refusal is missing, fix it in the API service/controller with a typed error from
    `@strapi/utils` — never a bare throw, never a policy relaxation.

## Project rules

- `schooltest-api` rules (`.qa/RULES.md` [schooltest-api]): `strapi.documents()` only, never the
  Entity Service; `documentId`, never numeric `id`; explicit `populate`, never `'*'`; typed
  errors from `@strapi/utils`; thin controllers, logic in services; overridden core actions must
  run `validateQuery`/`sanitizeQuery`/`sanitizeOutput`/`transformResponse`; custom routes in
  `01-custom-<name>.ts`; never write `auth: true` in route config; roles/permissions/seed users
  in code under `src/bootstrap/`, **never the admin UI**; **never start/stop the API server**.
- `.claude/rules/testing.md`, D-VERIFY-1 — real requests against the running stack.
- `.qa/RULES.md` command policy — `psql` reads against 127.0.0.1:5540 are allowed; dropping or
  truncating any table is forbidden.

## Done criteria

- `pnpm tsc --noEmit` (web) and `pnpm tsc --noEmit` (api, if the API was touched) clean;
  `pnpm lint` clean.
- `pnpm exec playwright test tests/e2e/api-security-parent-students.spec.ts` passes with the
  **full caller matrix** (A, B, C, D, E, F) asserted against all ten endpoints — every status,
  every `error.name`, every exact `error.message` string.
- The forged-JWT rows return `401` on every endpoint — zero `200`, zero `500`.
- Foreign-child and nonexistent-child responses proven **byte-identical** for every `/my/*` read.
- Query tampering proven inert: a `filters[parent]` injection returns only A's children;
  `pageSize=10000` clamps to ≤100.
- Body tampering proven inert: a client-sent `parent`/`status` on `POST /api/students` does not
  reach the DB — proven by a direct `select parent…, status from students` read.
- `passport_number` proven absent from every response body even when set.
- `429` proven with a real burst and a `Retry-After` header, run serially and last.
- Zero composite score / computed CEFR score in either new aggregate's payload.
- Every fixture (throwaway parent B, its child, A's temporary child, the temporary
  `passport_number`) removed; `select count(*)` on `students` returns to its pre-run value.
- Zero banned-pattern grep hits in the diff.

## Assumptions

- A non-parent role password may not be available in this environment; row **F** is then recorded
  as not-run with the exact reason (D9 keeps `SEED_*_PASSWORD` in `schooltest-api/.env` and never
  in a committed file), never faked.
- The rate-limit test is the only test that intentionally exhausts the 120/60s budget; it is
  serialised and placed last so it cannot poison sibling specs.

## Evidence

<!-- filled in as the task runs: the full status/name/message matrix, SQL reads, the 429 headers -->
