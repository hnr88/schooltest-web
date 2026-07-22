---
id: 335
title: API security — search, search preferences, identity and upload refuse every unauthorized and forged request
layer: security
kind: verify
slice: Endpoints #9-#13 (search + search preferences) and #23-#26 (users/me, updateMe, change-password, upload)
target: tests/e2e/api-security-search-identity.spec.ts (new); schooltest-api handlers only if a refusal is missing
contract: n/a (existing surface — the contracts are the code, per D-CONTRACT-1)
design: n/a
status: TODO
depends_on: []
---

## Objective

Prove with real HTTP requests that the search surface, the per-user preference surface, the
identity surface and the upload endpoint each refuse the wrong caller with the exact contracted
status and message, that strict Zod bodies reject unknown keys, that no caller can read or write
another user's row, and that no private field ever leaves the server.

## Contract

Quoted from `.qa/intake/api-inventory.md`:

- **#9 `GET /api/search/students?q=`** — grant `api::search.search.students` (parent + admin);
  re-asserted `role ∈ {parent, admin}` AND `caller.documentId`; `403 ForbiddenError "Only parents
  and admins can search students"`. `q` is trimmed then **clamped to 80 chars**; `limit` is
  HARD-CLAMPED to **10**. For a **parent** caller the filter
  `{ parent: { documentId: { $eq: caller.documentId } } }` is forced; an **admin** caller is
  UNSCOPED. Success is a **BARE** body `{ data: [...], meta: { query: { q, count } } }`.
- **#10 `POST /api/search/schools`** — STRICT Zod body, **any unknown key ⇒ 400
  `ValidationError "invalid search payload"`** with `details.fields/issues`;
  `403 "Only parents and admins can search schools"`; `500 ApplicationError "school search
  response failed contract validation"`. **No ownership rule** — schools are shared reference
  data. `pageSize` 1..50, `page` 1..10000, `feeMin ≤ feeMax`.
- **#11 `POST /api/search/agents`** — STRICT body; `403 "Only parents and admins can search
  agents"`; unconditional data gate `status = 'verified' AND publicProfileEnabled = true`;
  agent `email` is `private: true` and never read.
- **#12/#13 `GET|PUT /api/search-preferences/me`** — **parent only**;
  `403 "Only parents can read/update search preferences"`; target is ALWAYS `ctx.state.user` —
  no id param, no client-supplied owner; PUT body is a STRICT partial, unknown key ⇒
  `400 ValidationError "invalid search preferences"`; success is BARE `{ data: … }` with
  **no `meta` member**; the `user` relation is NEVER returned; first read lazily creates the
  default row (`[] [] []`, `relevance`, `12`, `null`, `null`).
- **#23 `GET /api/users/me`** — grant required for CUSTOM roles (the built-in `authenticated`
  role's default grant does not cover them); wrapped to set
  `Cache-Control: private, no-store` and append `role` + `profileCompleted`;
  `password`, `resetPasswordToken`, `confirmationToken` are `private: true` and stripped.
- **#24 `PUT /api/users/me`** — spliced BEFORE the stock `PUT /users/:id` so the `:id` wildcard
  cannot capture `"me"`; grant `plugin::users-permissions.user.updateMe` — **parent only**;
  FLAT JSON, 16-field whitelist; unknown/stock keys (`email`, `role`, `blocked`, `password`, …)
  are **SILENTLY STRIPPED**, never a 400; only keys actually PRESENT in the raw body are written;
  target is always `ctx.state.user.documentId` — there is no id param;
  `400 ValidationError "invalid profile payload"`.
- **#25 `POST /api/auth/change-password`** — grant is **parent only** among custom roles;
  teacher/student/admin hold NO grant → `403`; stock 400 on a wrong current password or an
  unchanged new password; on 200 it fires a `security_password_changed` notification.
- **#26 `POST /api/upload`** — grant `plugin::upload.content-api.upload`, parent only among
  custom roles; **`find` / `findOne` / `destroy` are DELIBERATELY NOT granted** — file
  enumeration and deletion stay closed to parents. Success **201**, a BARE JSON **array**.
  The mime/size gate is NOT here — it is `parent-media.ts` on the student write.
- **Global:** rate limit 120 req / 60 000 ms per IP ⇒ `429` + `Retry-After`;
  CORS limited to `FRONTEND_ORIGIN`; error envelope
  `{ "data": null, "error": { "status", "name", "message", "details" } }`.

## Design source

n/a — security task.

## Files

- `tests/e2e/api-security-search-identity.spec.ts` (new)
- Only if a refusal is missing: `schooltest-api/src/api/search/**`,
  `schooltest-api/src/api/search-preference/**`,
  `schooltest-api/src/extensions/users-permissions/**`
- Never the Strapi admin UI

## Depends on

No intra-wave dependency. Wave gate (prose): this surface pre-exists the mission, so it can be
proven at any point; run it after **W8 (230-253)** and **W9 (260-283)** so the web callers it
guards are final.

## Steps

1. Build the caller matrix against `http://localhost:5500`: **A** the seeded parent; **B** a
   throwaway second parent with its own child and its own preference row; **C** no JWT;
   **D** a forged JWT (signature byte flipped, and one re-signed with a wrong secret);
   **E** an expired JWT; **F** a non-parent role JWT if reachable (else recorded not-run).
2. For each of #9-#13 and #23-#26 assert: A → the contracted `2xx`; C → `401`; D (both
   forgeries) → `401`, never 200, never 500; E → `401`; F → `403` with the exact message.
3. **Cross-tenant proof on #9:** as A, search with a `q` that matches **B's** child's name and
   assert zero rows come back (the forced `parent` filter). Then assert the `q` clamp: send a
   200-character `q` and assert the request succeeds with the trimmed/clamped value and does not
   error. Assert the returned row count never exceeds **10** regardless of `q`.
4. **Strict-body proof on #10/#11:** send `{ q: 'x', bogusKey: 1 }` → `400 "invalid search
   payload"` with `details.fields` naming the key; `pageSize: 51` → `400`; `page: 10001` → `400`;
   `feeMin: 100, feeMax: 10` → `400`; `states: ['ZZZ']` → `400`; `services: ['nonsense']` → `400`.
5. **Reference-data boundary on #10/#11:** confirm there is **no** ownership rule — A and B get
   the same school corpus — and that the agent gate holds: assert every returned agent has
   `verified === true` (the service filters `status='verified' AND publicProfileEnabled=true`),
   and that **no** agent email appears anywhere in the body.
6. **Preference isolation on #12/#13:** as A, `PUT` a distinctive `default_page_size`; as B,
   `GET` and assert B's row is untouched; read both rows with `runSql`
   (`select user_id, default_page_size from search_preferences …`) and assert exactly one row per
   user. Send `{ user: <B's id> }` and `{ documentId: '<B row>' }` in the PUT body and assert
   `400` (STRICT partial) and that B's row is unchanged. Assert the response has **no `meta`**
   member and never returns the `user` relation. Restore A's original values.
7. **Identity proof on #23:** assert `Cache-Control: private, no-store` is present; assert
   `password`, `resetPasswordToken`, `confirmationToken` are absent; assert `role` and
   `profileCompleted` are present for a parent.
8. **Identity write proof on #24:** send a body mixing whitelisted and forbidden keys —
   `{ first_name: 'X', email: 'attacker@evil.test', role: 1, blocked: true, password: 'p' }` —
   assert `200`, then read `up_users` with `runSql` and assert `first_name` changed while
   `email`, `role_id`, `blocked` and the password hash are **unchanged**. Also assert the
   spliced route wins: `PUT /api/users/me` never reaches the stock `PUT /users/:id` handler
   (i.e. no other user's row is writable — attempt `PUT /api/users/<B numeric id>` and assert it
   is refused). Restore A's `first_name`.
9. **Change-password proof on #25:** wrong current password → `400`; same-as-current new
   password → `400`; a real change → `200` + a `security_password_changed` notification row +
   the old password dead — then restore the seeded password in the same run (the existing
   `tests/e2e/change-password.spec.ts` already does this; do not break it).
10. **Upload proof on #26:** A uploads a real small PNG → `201`, a bare **array**, `[0].id` a
    positive integer. Then assert the closed surface: `GET /api/upload/files` → `403`,
    `GET /api/upload/files/<id>` → `403`, `DELETE /api/upload/files/<id>` → `403` (find/findOne/
    destroy are deliberately not granted). Assert C/D/E → `401` on upload. Assert that an
    uploaded file id belonging to A cannot be attached to **B's** student via
    `PUT /api/students/<B child>` as A (that is already `403 "You do not own this student"` —
    re-prove it here as the media-linking path).
11. **Rate limit:** one serial test, last in the file, proving `429` + `Retry-After` on a cheap
    endpoint, then waiting out the window.
12. Fix any missing refusal with a typed `@strapi/utils` error in the owning service.

## Project rules

- `schooltest-api` rules (`.qa/RULES.md`): `strapi.documents()` only; `documentId` not numeric
  `id`; explicit `populate`; typed errors from `@strapi/utils`; thin controllers; grants in code
  under `src/bootstrap/`, never the admin UI; **never start/stop the API server**.
- `.qa/RULES.md` command policy — `psql` reads only; never drop or truncate a table.
- `.qa/DECISIONS.md` D-CONTRACT-1 — the running code is the contract; every disagreement with
  the docs is recorded rather than silently reconciled.
- `.claude/rules/testing.md`, D-VERIFY-1.

## Done criteria

- `pnpm tsc --noEmit` + `pnpm lint` clean.
- `pnpm exec playwright test tests/e2e/api-security-search-identity.spec.ts` passes with the
  full caller matrix (A, B, C, D×2, E, F) asserted against all nine endpoints, every status and
  every exact message string.
- Cross-tenant search proven scoped: A cannot see B's child; the 10-row cap and 80-char `q` clamp
  proven.
- Strict-body rejections proven for unknown key, oversize `pageSize`, out-of-range `page`,
  inverted fee range, and invalid enum values on both search endpoints.
- Agent gate proven: every returned agent `verified`, zero agent emails in any body.
- Preference isolation proven with a direct `search_preferences` SQL read (exactly one row per
  user, B untouched); `{ user }` / `{ documentId }` injections rejected.
- `/api/users/me` proven to strip `password`/`resetPasswordToken`/`confirmationToken` and to send
  `Cache-Control: private, no-store`.
- `PUT /api/users/me` proven to silently strip `email`/`role`/`blocked`/`password` — verified by
  a direct `up_users` SQL read showing those columns unchanged; `PUT /api/users/<other id>`
  refused.
- Upload proven: `201` array on POST; `403` on find/findOne/destroy; A's file cannot be attached
  to B's child.
- `429` + `Retry-After` proven, serially and last.
- Every fixture restored (A's preferences, A's `first_name`, the seeded password, throwaway
  parent B removed, uploaded test file left orphaned only if `destroy` is genuinely ungranted —
  recorded in Evidence).
- Zero banned-pattern grep hits in the diff.

## Assumptions

- Parents genuinely cannot delete their own uploads (`destroy` is not granted by design), so a
  test upload leaves one orphaned `files` row. That is recorded in Evidence as an accepted,
  contract-mandated side effect rather than worked around by editing the grant matrix.
- Non-parent role credentials may be unavailable (D9); row F is then recorded not-run with the
  reason.

## Evidence

<!-- filled in as the task runs: the full matrix, SQL reads proving unchanged columns, 429 headers -->
