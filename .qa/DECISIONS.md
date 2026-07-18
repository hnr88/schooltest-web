# DECISIONS.md — mission 2: auth + parent dashboard + search (M1 archive: .qa/m1-archive/)

Intake answered: "no question asked, go full autonomous" → detected defaults adopted.

## 2026-07-18 D1 — Parent portal lives in schooltest-web
The spec's "nice login page using our design" + dashboard + search target the WEB surface.
schooltest-web already has the SchoolTest design system, the auth module scaffold
(login/register/me over Strapi JWT localStorage), and en/de i18n. schooltest-app's own
rules (.claude/rules/auth.md) explicitly place the parent portal on the web. Routes:
/sign-in, /sign-up, /dashboard (client-guarded), search inside the dashboard.

## 2026-07-18 D2 — Student passwordless = schooltest-app's EXISTING client contract
The desktop app's magic-link client is complete and calls exactly:
POST /api/auth/student/magic-link/request, GET /api/auth/student/magic-link/verify,
GET /api/auth/student/me. The api implements THOSE endpoints verbatim (borrowed from
schoolgo-api's student-magic-link API: sha256-hashed 64-hex single-use tokens, 30-min
expiry, 5/60min rate limit, HS256 student JWT 8h). Response shapes map to the app's
existing types: verify → {jwt, student{documentId, firstName, lastName, email,
parentDocumentId, gradeYear}}; me → {payload, student}. App code stays untouched.

## 2026-07-18 D3 — Student schema gains email + parent (additive)
`student.email` (string, optional — magic-link delivery + search) and `student.parent`
(manyToOne → users-permissions user, inversedBy students). Additive only; types
regenerated via `pnpm strapi ts:generate-types`. Seed students get emails; parents get
their students linked.

## 2026-07-18 D4 — Parent role + registration via users-permissions extension
New custom role `parent` (bootstrap roles.ts + ROLE_ACTIONS: students find/create own,
users me, magic-link issue). Registration: extension src/extensions/users-permissions/
strapi-server.ts wrapping register to assign the parent role (borrow schoolgo's pattern).
Password login is stock POST /api/auth/local. Google provider via grant config in
config/plugins.ts, ENV-GATED (only active when GOOGLE_CLIENT_ID/SECRET are set).

## 2026-07-18 D5 — Google OAuth e2e is BLOCKED-with-reason
Real Google OAuth needs real client credentials (GOOGLE_CLIENT_ID/SECRET), which exist
nowhere and cannot be provisioned in code or faked (no mocks allowed). The full wiring
(provider config, frontend button, /auth/google/callback page) ships so it works the
moment credentials are supplied; the e2e flow "parent logs in via Google" is marked
BLOCKED with this exact reason. All other flows get real e2e.

## 2026-07-18 D6 — Email via Mailhog SMTP (real delivery)
schooltest-api gets @strapi/provider-email-smtp configured to 127.0.0.1:1025 (the
machine's running Mailhog) via EMAIL_SMTP_HOST/PORT env with production-sensible
defaults. Email assertions read Mailhog's HTTP API (:8025). This is real SMTP delivery
to a real SMTP server — dev infra, not a mock.

## 2026-07-18 D7 — schooltest-web repoints to the api on :5500
env defaults say :1337; the running api is on :5500. NEXT_PUBLIC_API_BASE_URL +
API_BASE_URL set to http://localhost:5500 in schooltest-web/.env.local (gitignored,
already covered by .env* ignore). schooltest-app gets NEXT_PUBLIC_API_URL=http://localhost:5500
in its .env.local (same ignore rule) + NEXT_PUBLIC_DEV_AUTH unset (real flow only).

## 2026-07-18 D8 — Search scope: parent's students (global search bar)
Borrow schoolgo's global-search shape (typed endpoint, $containsi, scoped results) but
scope it to the parent's domain: GET /api/search/students?q= returns the caller's
students matching given_name/family_name/email (parent-scoped by controller, limit 10).
UI: search field in the dashboard header with a debounced dropdown result list (our
design system; cmdk stays unused for now — simplest honest UI).

## 2026-07-18 D9 — Test credentials (seeded in code, never via UI)
Parent e2e user: parent@schooltest.local / Parent1234! (seeded via a bootstrap seed
addition with the parent role + 2 linked students with emails). Recorded HERE only —
never committed outside .qa. Student magic-link e2e uses one of those seeded students'
email (student1@schooltest.local) with a Mailhog-asserted delivery.

## 2026-07-18 D10 — Registration page included (design completeness)
The DS sign-in card shows "New to SchoolTest? Create an account" — shipping it dead
would violate the no-fake-links rule, so /sign-up ships using the existing
use-register.mutation (extended to assign the parent role server-side per D4). Login
itself needs no registration for e2e (seeded parent).

## 2026-07-18 D11 — No schooltest-web middleware/proxy for guards
Next-intl runs cookie-mode without middleware today; the parent dashboard is guarded
CLIENT-SIDE (zustand auth store + redirect to /sign-in when no token), matching the
kit's documented pattern (never read JWT in proxy.ts).

## 2026-07-18 D6a — Email provider is nodemailer, not smtp (task 01)
`@strapi/provider-email-smtp` does not exist on npm (E404 verified). The official
pin-matched SMTP provider is `@strapi/provider-email-nodemailer@5.50.1` — installed and
configured (EMAIL_PROVIDER=nodemailer, host/port/secure env-driven). Real delivery proven
twice into Mailhog via the api's email service.

## 2026-07-18 D12 — Incident: up_users QA-fixture loss during task 02 (documented + assessed)
During task 02, an initial malformed users-permissions extension (attributes: {students}
only) made Strapi's dev schema-sync drop+re-add up_users auth columns EMPTY and delete
role links. Impact: the 6 bootstrap seed users were REPAIRED from the duplicates' data
(password hashes preserved; seed idempotent, boot clean). 12 historical QA-fixture users
(qat84*/probe043*/verify043*/teacherb065*) lost username/email/password values — NOT
recoverable from the DB. Assessment: zero references to them in schooltest-api/tests/ or
src/ (grep-verified); they were ad-hoc probe artifacts from earlier QA sessions, not
load-bearing. Accepted as lost-and-irrelevant; recorded loudly. Root-cause lesson logged:
users-permissions extensions must carry the FULL attribute set (shallow merge), which the
final extension file does.

## 2026-07-18 D13 — Verify URL is locale-prefixed (contract alignment)
schooltest-app uses localePrefix 'always' (static export, no middleware) — the magic-link
HTTP URL is <APP_WEB_BASE>/en/auth/student/verify?token= (unprefixed paths 404 there).
Deep link schooltest://auth/student/verify?token= stays unprefixed (the app's
DeepLinkHandler adds the locale when routing). CONTRACTS.md updated (D13, additive).

## 2026-07-18 D14 — Own dockerized mailpit for local dev (user instruction, dms-craiova pattern)
schooltest-api/docker-compose.dev.yml now carries axllent/mailpit (container
schooltest-api-st1-mailpit): SMTP 127.0.0.1:1125, web UI 127.0.0.1:8125 (Mailpit API is
/api/v1 — the neighbor's Mailhog on 1025/8025 uses /api/v2 and stays untouched).
Api .env points EMAIL_SMTP_PORT=1125; real send proven queued+searchable in our mailpit.
The staging/prod topology (docker-compose.yml, in-stack mailpit, EMAIL_SMTP_HOST=mailpit
in .env.production/.staging examples) is the deployment-infra agent's work — aligned and
left untouched. Auth doctrine reaffirmed per user: JWT in localStorage only, never
session cookies; Strapi built-ins over custom code (users-permissions, email plugin,
Document Service).

## 2026-07-18 D15 — Task-06 parent fixtures (real persistence path, reusable)
Task 06 needed a parent before task 07's seed exists. Provisioned via `strapi console`
Document Service (idempotent by email/name — task 07 may reuse or overwrite): parent
`parent-t06@schooltest.local` / `Parent1234!` (role parent, confirmed, documentId
jq9z4y202436jafn73zx5szc) + students fui3ya0bhclw399ypgti9udt (own, email
student-t06@schooltest.local), zwp80l593equy81t0tk1drue (no parent), axahnn1nkynj8nf7d7mjpsct
(own, no email). Recorded HERE only — same rule as D9. Also recorded: on this Strapi
v5.50.1 build anonymous calls to auth-required routes answer the masked 403 Forbidden
(not 401); task 06's evidence documents the deviation, and `global::is-authenticated`
(schoolgo) does not exist in this install.

## 2026-07-18 D16 — Parent list route moves to /api/my/students; /users/me gets role via extension
Task 07 proved two facts: (1) the core GET /api/students route carries an IS_TEACHER
policy (parents get 403 there), and (2) /users/me never expands `role` in this install.
Adjustments:
- C-STUDENT-LIST moves from GET /api/students to **GET /api/my/students** (the repo's
  existing /my/* convention — zero teacher-regression risk, no shadowing of the core
  teacher-scoped route). C-STUDENT-CREATE stays POST /api/students via the custom route
  with role-branching (parent → server-side parent injection; teacher/admin →
  passthrough to existing behavior).
- Task 08's users-permissions extension ALSO wraps the plugin `me` controller to include
  the user's role (schoolgo pattern) so C-AUTH-ME returns role:{type} as contracted.
- User reaffirmed: check for existing Meilisearch integration before building search
  (task 11) — the infra agent may have shipped it; reuse over rebuild.

## 2026-07-18 D17 — Locale set adopted from schoolgo (user-directed)
schooltest-web locales are now en/zh/ko/ms/vi/th (schoolgo's set) in cookie mode; de dropped
("not this dummy DE"). 6 catalogs with identical key shape (336 keys, parity-checked):
43 keys/locale carry REAL schoolgo translations (Auth, Common/Errors, Dashboard-students
areas — brand-replaced SchoolGo→SchoolTest); the remaining keys (M1 landing, DesignSystem
showcase, unmapped extras) follow a documented ENGLISH-FALLBACK policy — honest fallback,
never machine-generated pseudo-translations. LocaleSwitcher lists all 6 with endonym
labels. E2E realigned: ZH render, toggle en→zh→en on the translated skip-link, fallback
policy spec, axe zh. schooltest-app (desktop) stays single-locale en (separate surface).
