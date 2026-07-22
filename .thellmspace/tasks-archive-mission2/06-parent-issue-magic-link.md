---
id: 06
title: Parent-issued magic link — POST /api/students/:documentId/magic-link
layer: backend
kind: build
slice: parent sends their student a login link (ownership-enforced)
target: schooltest-api/src/api/student-magic-link/{controllers,routes}/ (extend), policies
contract: C-ML-ISSUE
status: DONE
depends_on: [03, 04]
---
## Objective
Add the parent-issued path (schoolgo pattern):
- Route (in 01-custom-student-magic-link.ts): POST /api/students/:documentId/magic-link
  → issueMagicLink, policy global::is-authenticated (built-in plugin policy ref — check
  how existing routes reference it; use the repo's convention).
- Controller action: caller must be role type 'parent'; load student with populate
  parent; 403 when student.parent.documentId !== caller documentId; 400 when
  student.email unset (parent must add an email first); else createToken (with parent)
  + sendMagicLinkEmail; ctx.body = { ok: true }.
## Files
- extend controllers/student-magic-link.ts + routes/01-custom-student-magic-link.ts
## Done criteria (REAL)
- With the seeded parent JWT: POST against their own student → 200 {ok:true} + Mailhog
  message to the student's email. Against another user's student → 403. Against their
  student with email unset → 400. With no JWT → 401. tsc zero.
## Evidence
(filled by builder/verifier)

Builder (2026-07-18):
- Route appended to `schooltest-api/src/api/student-magic-link/routes/01-custom-student-magic-link.ts`:
  `POST /api/students/:documentId/magic-link` → `issueMagicLink`, auth REQUIRED via repo
  convention (auth omitted, empty policies — same as `src/api/session/routes/01-custom-sessions.ts`).
  `global::is-authenticated` (schoolgo) does NOT exist in this install (grep over
  node_modules/@strapi: zero hits) — using it would crash route registration.
- Action appended to `controllers/student-magic-link.ts`: parent-role gate (role read off
  ctx.state.user, users-permissions `fetchAuthenticatedUser` fallback → ForbiddenError),
  student load populate parent+user (404 NotFoundError), ownership 403
  (`student.parent?.documentId !== caller.documentId`), 400 `ValidationError('Student has no
  email on file')` when neither `student.email` nor `student.user?.email`, then
  checkRateLimit → createToken(student, {ipAddress, userAgent, parent: caller}) →
  best-effort sendMagicLinkEmail → `{ ok: true }`.
- Grant: `ISSUE_MAGIC_LINK_ACTION` added to parent in `src/bootstrap/permissions-actions.ts`
  (stale task-03 comment corrected: task 05 landed requestMagicLink PUBLIC, its parent grant
  is inert). Picked up by the running dev server's bootstrap re-ensure (proven by the 200).
- Fixtures (real persistence path via `strapi console` Document Service, idempotent by
  email/name — reusable by task 07/verifier): parent `parent-t06@schooltest.local` /
  `Parent1234!` (role parent, confirmed) documentId `jq9z4y202436jafn73zx5szc`; students
  `fui3ya0bhclw399ypgti9udt` (T06Mia T06Parent, year 8, email student-t06@schooltest.local,
  parent=caller), `zwp80l593equy81t0tk1drue` (T06Noa T06Orphan, year 9, email
  student-t06-foreign@schooltest.local, parent=NULL), `axahnn1nkynj8nf7d7mjpsct` (T06Lea
  T06Noemail, year 10, NO email, parent=caller).
- Verified live (:5500, JWTs not printed):
  - parent JWT + own student → **200 `{"ok":true}`**; our mailpit (:8125, /api/v1) holds the
    message to student-t06@schooltest.local ("Your SchoolTest sign-in link", id
    0frs8IkQrvCU0CBieYxzKL) with the /en/ verify link + schooltest:// deep link.
  - parent JWT + foreign student (parent null) → **403** `{"error":{"status":403,"name":
    "ForbiddenError","message":"Forbidden"}}` (message masked — task-025 project precedent).
  - parent JWT + own no-email student → **400** `{"error":{"status":400,"name":
    "ValidationError","message":"Student has no email on file"}}`.
  - teacher JWT (teacher@schooltest.local) + own student → **403** (role gate).
  - no JWT → **403** (DEVIATION from the brief's 401: on this Strapi v5.50.1 build anonymous
    calls to auth-required routes return the masked 403 — verified identical on POST
    /api/sessions and GET /api/my/sessions; established project behavior since task 025).
  - end-to-end: redeemed the emailed token via C-ML-VERIFY → 200 student JWT payload
    `{type:'student', studentDocumentId:'fui3…', parentDocumentId:'jq9z…'}`; DB row
    `e533hqhzhm90kayew9oz1b3r` shows sha256 hash at rest, used=true/usedAt, expiresAt +30min,
    ipAddress/userAgent captured, parent=caller documentId.
- `pnpm tsc --noEmit` → exit 0, zero output. `pnpm lint` → exit 0, zero findings.
- NOTE: builder committed NOTHING; the deployment-infra agent's commit `cc6bb4a`
  (schooltest-api, 13:31) swept the three edited src files into its env commit — confirmed
  all three diffs are present verbatim in that commit; working tree clean.

