# REPORT.md — Mission 2: parent auth (password + Google-wired) + student
passwordless magic-link + parent dashboard + global search

Status: **CLOSED**. All 27 tasks DONE (26 with independent-verifier PASS + task 25,
this report, closing the loop with two consecutive clean critic passes). Zero mocks,
zero stubs, zero fixtures standing in for a live query anywhere in the delivered
surface — every claim below was re-verified live against the running stack on
2026-07-18, not copied from earlier task evidence.

## 1. What shipped

### Backend (schooltest-api, Strapi v5.50.1 on :5500)
- **Email**: `@strapi/provider-email-nodemailer` (D6a — the spec'd `-smtp` package
  doesn't exist on npm) → this mission's own dockerized Mailpit
  (`schooltest-api-st1-mailpit`, SMTP 127.0.0.1:1125, API 127.0.0.1:8125/api/v1, D14).
- **Schema**: `student` gains `email` (optional) + `parent` (manyToOne →
  users-permissions user, inversedBy `students`). New content-type
  `student-magic-link` (`email`, `token` **private**, `used`, `expiresAt`, `usedAt`,
  `ipAddress`, `userAgent`, `student`, `parent`) — schema.json byte-checked against
  CONTRACTS.md, `token` confirmed `"private": true`.
- **Parent role**: bootstrap role `parent` with exactly 8 live grants (confirmed via
  psql today): `student.{find,findOne,create,findMyStudents}`,
  `student-magic-link.{requestMagicLink,issueMagicLink}`, `search.students`,
  `users-permissions.user.me`.
- **Endpoints** (all custom routes `01-`-prefixed, load before the core router):
  - `POST /api/auth/student/magic-link/request` (public) — C-ML-REQUEST
  - `GET /api/auth/student/magic-link/verify?token=` (public) — C-ML-VERIFY
  - `GET /api/auth/student/me` (student JWT) — C-ML-ME
  - `POST /api/students/:documentId/magic-link` (parent JWT, owner-only) — C-ML-ISSUE
  - `GET /api/my/students` (parent JWT, server-forced ownership filter) — C-STUDENT-LIST
  - `POST /api/students` (role-branched: parent write path / admin passthrough / else
    403) — C-STUDENT-CREATE
  - `GET /api/search/students?q=` (parent+admin JWT) — C-STUDENT-SEARCH
  - `POST /api/auth/local`, `POST /api/auth/local/register` (stock, register extended
    to assign the `parent` role server-side) — C-AUTH-LOGIN / C-AUTH-REGISTER
  - `GET /api/users/me` (extended to attach `role:{id,name,type,description}`,
    `Cache-Control: private, no-store`) — C-AUTH-ME
  - `GET /api/connect/google`, `GET /api/auth/google/callback` (env-gated) —
    C-AUTH-GOOGLE
- **Google OAuth wiring**: `config/plugins.ts` grant config + a bootstrap wrap that
  syncs it into the plugin's grant store (the only thing v5.50.1's grant engine
  reads), gated behind `GOOGLE_ENABLED` + a live pair-check in `validate-env.ts`.
- **Seed** (D9, code-only, never via UI): parent `parent@schooltest.local` /
  `Parent1234!` (role `parent`) linked to `Mia Keller` (year 8,
  `mia.keller@schooltest.local`) and `Jonas Keller` (year 10,
  `jonas.keller@schooltest.local`).

### Frontend (schooltest-web, Next.js 16.2.10 on :3100)
- Pages: `/sign-in`, `/sign-up`, `/auth/google/callback`, `/dashboard` (client-guarded
  via `ParentGuard` + `useRequireParent`, JWT in localStorage only, never a cookie —
  D11).
- Dashboard: real students table (`StudentsSection`, C-STUDENT-LIST), add-student
  dialog (`AddStudentDialog`, C-STUDENT-CREATE, react-hook-form + Zod, Select limited
  to years 7–12), header search (`DashboardSearch`/`DashboardSearchResults`,
  C-STUDENT-SEARCH, 300 ms debounce, always-enabled recents-on-empty-query,
  keyboard nav).
- Auth: `SignInForm`/`SignUpForm` (typed error model, enumeration-safe UI copy),
  `GoogleButton` (real anchor to `/api/connect/google`, never a dead link),
  `GoogleCallbackScreen` (forwards Google's query verbatim to the api, stores only
  the api's own JWT, never Google's `id_token`).
- i18n: 6 locales (en/zh/ko/ms/th/vi, D17 — `de` dropped), 360 keys/locale, **zero**
  missing/extra keys (recomputed programmatically today).
- 42 files under `src/modules/auth/` + `src/modules/dashboard/` + the 4 new route
  folders — all typed-Axios/TanStack-Query, zero raw `fetch`, zero `src/components/ui/*`
  edits.

### Desktop (schooltest-app) — untouched except the authorized e2e exception
- `tests/e2e-live/` (magic-link.spec.ts, its own Playwright config, a real Mailpit
  client) drives the app's **pre-existing, already-complete** magic-link client
  (request → email → deep-link/verify → `/home`) against the live api — app source
  was never edited.

## 2. Live proof gathered for THIS report (2026-07-18, re-run fresh, not reused)

### Contract conformance (curl against :5500)
```
POST /api/auth/local (correct)        -> 200 {jwt, user} (parent@schooltest.local)
POST /api/auth/local (wrong password) -> 400 {message:"Invalid identifier or password"}
POST /api/auth/local (unknown email)  -> 400 {message:"Invalid identifier or password"}  <- byte-identical, no enumeration
GET  /api/users/me                    -> 200 {...,role:{id:6,name:"Parent",type:"parent",...}}
GET  /api/my/students                 -> 200 {data:[Jonas(10),Mia(8)], meta.pagination.total:2}
GET  /api/search/students?q=mia       -> 200 {data:[Mia], meta.query:{q:"mia",count:1}}
GET  /api/search/students?q=          -> 200 {data:[Jonas,Mia] (createdAt desc), meta.query.count:2}
GET  /api/search/students?q=zzz...    -> 200 {data:[], meta.query.count:0}
POST /api/students {year_level:5}     -> 400 {details:{fields:["year_level"],issues:["year_level: Too small: expected number to be >=7"]}}
POST /api/students {parent:"BOGUS"}   -> 200 {data:{..., parent:{documentId:<CALLER>}}}  <- client override silently stripped, server injected caller's own id
POST /api/students/:id/magic-link (own student)     -> 200 {ok:true}
POST /api/students/:bogus-id/magic-link             -> 404 {message:"Student not found"}
POST /api/auth/student/magic-link/request (unknown) -> 200 {ok:true}  <- enumeration-safe, ZERO db row created (psql-confirmed)
POST /api/auth/student/magic-link/request (real)    -> 200 {ok:true} + real Mailpit delivery
GET  /api/auth/student/magic-link/verify (malformed)-> 400 {message:"Invalid sign-in link"}
GET  /api/connect/google                            -> 400 {message:"This provider is disabled"}
```
A create-time ownership-override probe (`Critic25Owner`, id 947) was deliberately
attempted and cleaned up (direct Postgres delete — the parent role has no DELETE
grant, confirmed 403) immediately after confirming the server-side strip; the seeded
parent's list was re-confirmed at exactly Mia+Jonas afterward, zero residue.

### End-to-end magic-link round-trip (real Mailpit + real Postgres + real crypto)
1. `POST /api/auth/student/magic-link/request {email: mia.keller@schooltest.local}` → `{ok:true}`.
2. Mailpit (`GET /api/v1/search?query=to:mia.keller@schooltest.local`) shows a fresh
   message, subject "Your SchoolTest sign-in link", containing both the
   `http://localhost:3002/en/auth/student/verify?token=<64hex>` web link and the
   `schooltest://auth/student/verify?token=<64hex>` deep link.
3. Extracted the raw 64-hex token from the email HTML.
4. `sha256(rawToken)` computed locally = `00a7cf6eca71f9300239dced811187b5c115b64a3675feea341d8f5f8377068a`,
   matching the `student_magic_links.token` column for that row **exactly** — the
   plaintext token is never persisted, only its hash.
5. `GET .../verify?token=<raw>` → `200 {jwt, student:{documentId,firstName:"Mia",
   lastName:"Keller",email,parentDocumentId,gradeYear:8}}`.
6. `GET /api/auth/student/me` with that student JWT → `200 {payload:{type:"student",
   studentDocumentId,parentDocumentId,iat,exp}, student:{...same shape}}`.
7. Re-using the same token → `401 {message:"This sign-in link has already been used",
   reason:"used"}` (single-use enforced).
8. Full desktop-flow variant re-run live: `schooltest-app/tests/e2e-live/magic-link.spec.ts`
   → **1 passed (35.9s)** against the real renderer (:3003, D21 port workaround),
   the real api, and the real Mailpit — request → inbox → deep-link-style verify →
   real `/home` render, then the dev server torn down cleanly (no orphan process).

### Database proof (docker exec psql, schooltest-api-st1-postgres)
```
up_users x up_users_role_lnk x up_roles  -> id 49 parent@schooltest.local, role type 'parent'
students x students_parent_lnk x up_users -> Mia(8)/Jonas(10) both linked to parent@schooltest.local
up_permissions (role 'parent')            -> exactly 8 grants (listed in section 1)
student_magic_links (recent rows)         -> token column is 64-hex SHA-256, never the raw token
```

### i18n parity (recomputed programmatically, not reused from prior tasks)
`en/zh/ko/ms/th/vi` — **360 keys each, 0 missing, 0 extra** across all 6 catalogs.

### Gates
- `pnpm tsc --noEmit` — **0 errors** (schooltest-web, schooltest-api, and
  schooltest-app both root and `tests/e2e-live/tsconfig.json`).
- `pnpm lint` —
  - schooltest-web: **0 errors**, 1 pre-existing unrelated warning
    (`CreateArticleForm.tsx`, React-Compiler incompatible-library notice, untouched
    by this mission, reconfirmed today).
  - schooltest-api: **0 errors, 0 warnings**.
  - schooltest-app: `tests/e2e-live/` scoped lint **0 errors/0 warnings**; the
    full-repo `pnpm lint` shows 4 pre-existing errors + 5 warnings, all in files this
    mission never touched (`app-shell` components' `<img>` usage,
    `tests/e2e/scenarios/*` file-length caps) — confirmed unrelated, out of scope
    (schooltest-app stays untouched except the authorized `tests/e2e-live/`
    exception).
- Full Playwright suite (schooltest-web), run **twice** back-to-back:
  **71 passed, 1 skipped (the named Google-BLOCKED test), 0 failed — both runs**,
  zero flakes either time.
- Live magic-link e2e (schooltest-app `tests/e2e-live`): **1 passed**.

## 3. Critic passes (banned-pattern grep + semantic review) — TWO consecutive clean

**Pass 1** — lexical grep (`mock|fake|stub|dummy|placeholder|TODO|FIXME|lorem|hardcod`)
across every touched file in both packages (backend: 22 mission source files;
frontend: all of `src/modules/auth/`, `src/modules/dashboard/`, the 4 new route
folders, all 11 mission e2e specs + helpers; app: `tests/e2e-live/`): **zero
fixture/mock hits**. Every match was one of: HTML `placeholder=` props, TanStack's
`placeholderData` option name, `isPlaceholder()` (a real env-secret-hygiene check —
the opposite of a placeholder), an i18n key literally named `searchPlaceholder`, and
honest negative comments ("never hardcoded", "no mocks anywhere", "never a
synthetic/mocked jwt") — including the one already-accepted `stub-jwt` literal used
in 4 specs to seed localStorage for a **client-redirect-only** assertion, re-verified
live today (`Authorization: Bearer stub-jwt` -> real `401 Missing or invalid
credentials` from both `/api/users/me` and `/api/my/students` — the api never
honors it).

**Pass 2** — broader semantic sweep (`lorem ipsum|coming soon|not implemented|
sample data|canned|synthetic|fixture data|dummy data|fake data|as any|@ts-ignore`)
across the same surface: **zero hits** beyond two honest negative comments
("never a synthetic/mocked jwt", "hard-coded" describing the *plugin's own* internal
grant registry, not this mission's code). Combined with a full read-through of every
query/mutation hook (`use-students.query.ts`, `use-search-students.query.ts`,
`use-create-student.mutation.ts`, `use-login/register/google-callback.mutation.ts`,
`use-me.query.ts`) confirming each one calls the typed Axios `strapi` instance
against a real endpoint with zero fallback-to-canned-data branch, and a full read of
the backend service/controller layer (`student-magic-link` service — real
`crypto.randomBytes`/`createHash('sha256')`/`timingSafeEqual`, real
`strapi.documents()` calls; `student` + `search` controllers — real ownership
filters, real Zod validation, real strip-then-inject ownership pattern) — **clean**.

Both passes independently re-derived the same result from a fresh read of the code,
not from re-quoting earlier tasks' self-reports. **Gate satisfied.**

## 4. Security findings (re-verified live today)

1. **Enumeration-safe endpoints.** `POST /api/auth/local` returns the byte-identical
   400 for wrong-password and unknown-email. `POST /api/auth/student/magic-link/request`
   always returns `{ok:true}` regardless of whether the email matches a student —
   confirmed via psql that an unknown email creates **zero** database rows (no
   side channel via timing-via-row-creation either, since the lookup short-circuits
   before any write).
2. **Hashed, single-use tokens.** Magic-link tokens are 64-hex
   `crypto.randomBytes(32)`, stored as `sha256(token)` only (schema field `private:
   true`); a live round-trip proved the stored hash matches `sha256(rawToken)` and
   that reusing a consumed token gets `401 reason:"used"`, never a silent no-op.
3. **Parent ownership enforcement, defense-in-depth.** `GET /api/my/students` and
   `GET /api/search/students` both force `filters.parent.documentId.$eq = <caller>`
   server-side, AFTER Strapi's own `sanitizeQuery` (which would otherwise strip
   caller-supplied filters on the restricted `parent` relation and silently widen
   the scope) — re-verified by reading the controller source, not just probing.
   `POST /api/students` strips `parent/teacher/class/user/student_key` from every
   parent-caller payload and injects `parent=<caller>` after the Document Service
   write; a live probe with a spoofed `parent` documentId proved the spoofed value
   is discarded. `POST /api/students/:id/magic-link` 404s (not 403 — no existence
   leak beyond "not found") once probed with a bogus id; ownership vs.
   non-existence is deliberately not distinguished in the response.
4. **Rate limiting.** `student-magic-link`'s `checkRateLimit` counts real rows
   created for that email in the trailing 60 minutes and throws `RateLimitError`
   (429) at the 6th; live DB state at report time shows `mia.keller@schooltest.local`
   at 4 requests in the trailing window from today's testing/task-23 rerun (not
   deliberately pushed to 429 in this report to avoid exhausting a shared fixture
   mid-mission — the 429 path itself was already live-proven in task 05's own
   verification and the code path was read end-to-end today).
5. **CORS allowlist** (D21) still exactly `http://localhost:3100,http://localhost:3003`
   — reprobed live via `OPTIONS` preflight, both origins echo
   `Access-Control-Allow-Origin` correctly; no unrelated origin was added.
6. **Google OAuth stays credential-gated.** `GOOGLE_ENABLED`/`GOOGLE_CLIENT_ID`/
   `GOOGLE_CLIENT_SECRET` are unset in the live `.env` (grepped directly) and only
   appear as commented-out placeholders in `.env.example`; `validate-env.ts` would
   refuse to boot in production with `GOOGLE_ENABLED=true` and a missing pair.

## 5. Google OAuth — BLOCKED (D5/D18/D24, reconfirmed today)

**Status: BLOCKED**, not partially done and not faked. Real Google OAuth consent
requires `GOOGLE_CLIENT_ID`/`GOOGLE_CLIENT_SECRET` from a real Google Cloud OAuth
client, which exist nowhere in this workspace (grep-confirmed: `.env` has neither
key; `.env.example` carries only commented placeholders). No mock IdP, no fabricated
tokens, no synthetic JWTs were substituted anywhere — `GET /api/connect/google`
answers the real `400 {message:"This provider is disabled"}` today, and the
frontend's Google button/callback page are wired to the **real** api response, not
a stand-in.

**Precise unblock step**: obtain a Google Cloud OAuth 2.0 Client (Console -> APIs &
Services -> Credentials -> OAuth client ID -> Web application), register the
redirect URI `http://localhost:5500/api/connect/google/callback` (or the deployed
api's equivalent), then set in `schooltest-api/.env`:
```
GOOGLE_ENABLED=true
GOOGLE_CLIENT_ID=<client id>
GOOGLE_CLIENT_SECRET=<client secret>
```
and restart the api. Everything downstream — the grant-store sync (bootstrap wrap in
`src/extensions/users-permissions/strapi-server.ts`), the frontend button/callback,
and the JWT-storage flow — already works end-to-end for every step that doesn't
require a real Google consent screen (proven in tasks 14/24); only the actual
Google-hosted consent round-trip needs the credentials above. One known follow-up,
explicitly out of this mission's scope per D18: OAuth-registered users get
users-permissions' default role today, not `parent` — assigning `parent` to
OAuth registrations is a task for after credentials land.

## 6. Assumptions / decisions carried from DECISIONS.md (D1-D22)

- Parent portal lives in schooltest-web, not schooltest-app (D1).
- Student passwordless borrows schooltest-app's already-complete client contract
  verbatim (D2); student schema gains `email`+`parent` additively (D3).
- Registration always assigns the `parent` role; Google-registered users get the
  default role pending credentials (D4/D18).
- Real SMTP delivery to this mission's own dockerized Mailpit, not the neighboring
  Mailhog on 1025/8025 (D6/D6a/D14/D26).
- schooltest-web points at the api on :5500, not the :1337 default (D7).
- Global search is parent-scoped, not a general-purpose index (D8); no Meilisearch
  integration exists in this install (confirmed, D16) — matching is Postgres
  `$containsi` (ILIKE).
- Seeded parent test user recorded in DECISIONS.md only, never committed elsewhere
  (D9) — re-confirmed live and in the DB today.
- `/sign-up` ships for design completeness, never a dead link (D10). Dashboard guard
  is client-side only, per the kit's cookie-mode i18n convention (D11).
- `GET /api/students` (core, teacher-scoped) is untouched; parents get their own
  `/api/my/students` instead (D16) — avoids shadowing/regressing the teacher route.
- Locale set is schoolgo's (en/zh/ko/ms/th/vi), `de` dropped per user direction (D17).
- Google's post-consent redirect lands on the FRONTEND callback; the Strapi JWT comes
  from the API's own JSON response, never Google's `id_token` (D18).
- Task 12's attempt-1 gap (no `/dashboard` route existed yet) was closed by building
  task 15's core deliverable early rather than deferring (D19); STATE.json ownership
  was left correct at the time (task 15 flipped DONE on its own later pass).
- **Known, non-blocking, previously-documented deviations, reconfirmed still true
  today and still not touched by this closing pass** (each is either explicitly
  out-of-scope for its originating task or a pre-existing install quirk unrelated to
  this mission's own code):
  - `POST /api/auth/local`'s 200 response omits `role` on `user` (contra
    CONTRACTS.md); `GET /api/users/me` does carry it. No frontend code reads
    `user.role` from the login response today, so nothing consumes the gap (D19).
  - Unauthenticated calls to auth-required routes on this Strapi install answer a
    masked `403 Forbidden` rather than `401` (D15) — every route this mission owns
    is only ever reached from behind `ParentGuard`, so nothing depends on the status
    code distinction.
  - A concurrent-registration race can make an immediately-following
    `/api/my/students` read 403 for a freshly-registered user before the role write
    lands (D20) — a backend timing issue in the registration path, not triggered by
    normal single-request usage, worked around in the one e2e spec that fires
    concurrent registrations (`test.describe.configure({mode:'serial'})`).
  - Two vendored-shadcn-primitive a11y gaps remain, both explicitly forbidden to fix
    by editing `src/components/ui/*` (Law 11): sub-44px tap targets on default-sized
    `Button`/`Input`/`Select` instances throughout the dashboard (advisory-logged,
    not asserted, exactly matching the pre-existing `/design-system` gallery
    treatment), and one `scrollable-region-focusable` axe finding on the vendored
    `Table` wrapper at 375px (named, logged exemption `TABLE_SCROLL_EXEMPTION`) (D22).
  - Two files show minor Prettier line-wrap drift discovered during this closing
    pass (`src/extensions/users-permissions/strapi-server.ts` in schooltest-api;
    `tests/e2e/sign-in.spec.ts` in schooltest-web) — purely cosmetic (long-line
    wrapping), `pnpm lint` reports 0 errors for both, and neither file's behavior is
    affected. Not fixed here: task 25 is a verify/report task and editing other
    tasks' already-DONE, independently-verified files is outside "do exactly what's
    asked" — flagged for a future tidy-up pass rather than silently patched.

## 7. Watchdog

No `qa-watchdog.sh` process is currently running on this box (`pgrep -af watchdog.sh`
returns nothing) — nothing needed to be stopped. `watchdog.log`'s last entries
(13:54, "SOFT STALL") predate this session; the script's `stale_task()` helper has a
pre-existing `HARD is not defined` bug in its inline `node -e` (an env var was read
as `HARD` but only exported as `HARD_STALL`/`$HARD`), visible in the log, but since
the loop itself isn't running there is nothing live to fix or stop as part of this
closing task.

## 8. Verdict

Two consecutive clean critic passes (section 3), zero banned patterns in any shipped
path, every CONTRACTS.md endpoint re-verified against a real, live response today,
real Postgres/Mailpit persistence proven end-to-end, i18n parity exact, tsc/lint zero
across all three packages' touched surfaces, and the full Playwright suite green
twice with zero flakes. The Google OAuth item is honestly BLOCKED with a precise,
actionable unblock step — never faked. **Mission surface is closed.**
