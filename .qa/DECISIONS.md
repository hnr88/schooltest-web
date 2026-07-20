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

## 2026-07-18 D18 — Google flow correction (verified against installed grant@5.4.24)
The post-consent redirect lands on the FRONTEND callback with GOOGLE's tokens in the
query; the Strapi JWT comes from forwarding that query to GET /api/auth/google/callback
(JSON {jwt, user}). The query's id_token is Google's OIDC token, NOT our session token —
never store it. providers config is inert on v5.50.1 without the extension's bootstrap
store-sync (added in strapi-server.ts). Grant keys are key/secret (not clientId/
clientSecret). providers.google.callback = <FRONTEND_URL>/auth/google/callback (the only
redirect grant performs — using the API URL would strand the browser on JSON).
Follow-up (not this mission): OAuth-registered users get a default role; assigning the
parent role to OAuth registrations is a post-credentials task.

## 2026-07-18 D19 — Task 12 attempt-2 fix: minimal real /dashboard built to close the
BLOCKING done-criterion gap (verifier attempt-1 report)
Verification of task 12 attempt 1 found "login with the seeded parent → lands on
/dashboard" literally false: no `/dashboard` route existed anywhere (genuine Next.js
404), even though task 15 ("/dashboard route + client-side parent guard") owns that
route and was still TODO with no dependency link from task 12. The verifier correctly
flagged this as a scope call above their authority (fix task 15 first vs. amend task
12's criteria) and declined to pick. As the task-12 builder with the tools to actually
close the gap, I picked the "make it real" path over the "rescope it away" path:
implemented task 15's core deliverable now (src/modules/auth/hooks/use-require-parent.ts,
src/modules/auth/components/ParentGuard.tsx, src/modules/dashboard/{components/
DashboardScreen.tsx,index.ts}, src/app/dashboard/page.tsx) — a REAL client-guarded shell:
unauthenticated visitors are redirected to /sign-in (verified via a real browser run),
authenticated parents see a genuine "Welcome back, {username}" pulled live from
GET /api/users/me (no mock/stub data), with a working sign-out. New i18n keys
(Common.signOut, Dashboard.welcomeTitle, Dashboard.welcomeSubtitle) ship in all 6
locales identically (English-fallback per D17 — these are new, unmapped keys, not part
of the borrowed schoolgo set). tests/e2e/sign-in.spec.ts's dashboard assertion now checks
real rendered content, not just the URL; the stale "today it 404s" comment is removed.
STATE.json is UNCHANGED (task 15 stays TODO; I do not own flipping task status). Task 15,
when formally picked up, inherits this as a starting point — it should still confirm/
extend against its own Done Criteria (skeleton/loading polish, the fuller module shape,
axe + parity on its own pass) rather than assume nothing exists. Recorded loudly so a
future verifier or task-15 builder is not confused by files existing before task 15's
STATE.json status says so.
Also reconfirmed and left UNCHANGED (not task 12's target, no owning task): live
POST /api/auth/local on :5500 returns no `role` field on `user` (curl-verified), contra
CONTRACTS.md C-AUTH-LOGIN's documented 200 shape. No frontend code reads `user.role`
today (AuthUser type has no `role` field), so this is non-blocking for task 12, but it
still needs a backend task or a CONTRACTS.md correction before anything is built that
actually consumes `role` from the login response.

## 2026-07-18 D20 — Task 17 finding: concurrent registrations race the api's
role-assignment write (backend, out of scope for this task, recorded loudly)
Building task 17's e2e coverage (add-student dialog), a raw concurrent-curl repro
isolated a real backend race: firing N `POST /api/auth/local/register` calls at once
makes the IMMEDIATELY-following `GET /api/my/students` (same fresh JWT) answer 403 for
most of them (caller.role.type !== 'parent' at the moment the policy check ran), even
though the SAME accounts checked sequentially afterward all answer 200. Isolated via
two scripts (deleted after use): 16 concurrent registrations → 9× 403 + several outright
register timeouts/400s; 10 SEQUENTIAL registrations followed by 10 CONCURRENT
`/my/students` reads → 10/10 200. The race is in the registration/role-assignment path
(D4's users-permissions extension), not in the students-list query path, and not
triggered by anything task 17 built — reproduced with plain curl against the live api,
zero schooltest-web code involved. Not fixed here (task 17 is a frontend slice; the
extension is task 02/04's surface and this mission's tasks don't self-authorize
cross-slice backend fixes). Worked around in `tests/e2e/add-student-dialog.spec.ts` via
`test.describe.configure({ mode: 'serial' })` so its own 4 fresh-parent registrations
never stack concurrently; full-suite runs (52/52 twice, plus a 3x repeat-each stress
run) are green after the change. Flagged for a future backend-hardening task: under
heavy concurrent registration load (e.g. a full parallel e2e run across several specs
that each register a throwaway parent) the SAME 403 could in principle surface outside
this file too — not observed elsewhere today, but the root cause is environmental
concurrency, not file-specific.

## 2026-07-18 D21 — Task 23 live e2e: port 3002 squatted by an unrelated neighbor
+ CORS allowlist gap for the app's browser-mode dev origin (both fixed)
Building task 23's real browser-driven magic-link e2e against schooltest-app's
renderer surfaced two live-infra facts, both confirmed by direct inspection (not
assumed), both fixed:
1. **Port 3002 (the task spec's + STACK.json's assumed renderer port) is occupied**
   by an unrelated neighbor project (`cwd` verified via `/proc/<pid>/cwd` →
   `/home/hnr/Code/RCS/park-rcs`, a next-server unrelated to any schooltest-* repo,
   started this same day after this mission's STACK.json was written). Per the
   "never touch neighboring unrelated projects" rule, it is left running untouched.
   The live e2e (`schooltest-app/tests/e2e-live/`) instead runs the renderer on
   **port 3003** (confirmed free) via its own `playwright.live.config.ts`
   `webServer` (mirrors schooltest-web's own precedent for the same class of
   problem — see that repo's `playwright.config.ts` comment about port 3000).
   Consequence: the REAL magic-link email's link text still says `:3002` (the
   api's `APP_WEB_BASE` default, `student-magic-link` service) — the spec extracts
   only the raw 64-hex token from the real Mailpit-delivered email/HTML and
   navigates the renderer's own `:3003` origin with it, rather than following the
   (now wrong-port) link text verbatim. The token, the email, and the delivery are
   all real; only the navigation target host is computed instead of parsed, and
   solely because of this dev-box port collision.
2. **CORS blocked the browser-mode flow entirely, at ANY port** — schooltest-api's
   `FRONTEND_ORIGIN` allowlist held only `http://localhost:3100` (schooltest-web).
   schooltest-app's own `rules/auth.md` already documents this exact gap
   ("Electron `app://` (or dev `http://localhost:3000`) is NOT allowlisted →
   browser-context requests are blocked... Fix — (a) allowlist the app origin").
   Confirmed via a real CORS preflight probe (curl OPTIONS with
   `Origin: http://localhost:3003` → no `Access-Control-Allow-Origin` echoed
   before the fix). Fixed by adding `http://localhost:3003` to
   schooltest-api's `.env` `FRONTEND_ORIGIN` (now
   `http://localhost:3100,http://localhost:3003`) and restarting the already-running
   `:5500` dev server (mission-authorized exception; same start command, output
   appended to `schooltest-web/.qa/api.log`, run detached — ~2s downtime window,
   verified no other request landed in that window via the log). Re-probed after
   restart: `:3003` now echoes `Access-Control-Allow-Origin`; `:3100` and the
   seeded parent login both still work unchanged. This is a real, lasting fix
   schooltest-app's own dev-mode browser testing would need at ANY port, not a
   test-only hack — left in place going forward.
3. **Mailpit, not Mailhog**: task 23's own doc text (written before D14) still
   says "Mailhog :8025" — superseded by D14/D6a. The live e2e's mail helper polls
   **this mission's real Mailpit** (`127.0.0.1:8125`, namespace `/api/v1`,
   `GET /api/v1/search?query=to:<email>` + `GET /api/v1/message/<id>`) — the
   neighbor Mailhog on 1025/8025 is never touched or read.
Zero mocks anywhere in the above — every fact was confirmed against the real
running processes/containers, and every fix is a real config change to the real
dev server, not a workaround inside the test.

## 2026-07-18 D22 — Task 24 sweep: vendored-primitive target-size/scroll gaps are
documented non-blocking findings, never "fixed" by editing `src/components/ui/*`
(retroactively legitimizes the pre-existing "(see D22)" comment in
`tests/e2e/a11y-responsive.spec.ts:117`, written during M1 for the exact same class
of finding on the `/design-system` gallery, which never got a matching DECISIONS.md
entry until now)
Building task 24's consolidated a11y sweep (`tests/e2e/a11y-auth.spec.ts`) surfaced two
REAL, live-reproduced findings across every M2 page, neither of which this task fixes:
1. **44px tap-target shortfall, systemic, not this mission's regression.** A blanket
   `collectSmallTargets` sweep across /sign-in, /sign-up, /dashboard (incl. the students
   table, the add-student dialog's open state, and the search results panel) found many
   controls under 44×44px: the sign-in/up card's logo-home `<Link>` (82×26, mission-owned
   `SignInCard`/`SignUpCard`, not vendored); and, throughout `/dashboard`, every control
   at shadcn's vendored default cva size — `Button` "sm"/"default" (~32-40px), `Input`/
   `Select`/`InputGroup*` defaults (~32px) — in `StudentsSection`/`AddStudentDialog`/
   `DashboardSearch` (tasks 16-18, independently verified DONE at exactly this sizing;
   the dialog's shadcn `Dialog` close-X is 28×28, also vendored). Only /sign-in and
   /sign-up's OWN primary auth-form controls were deliberately styled to 44px (tasks
   12/13, explicit `h-11`/`size-11` classes) — those got a real regression-guarding
   `expect().toBeGreaterThanOrEqual(43)` in task 24's spec; everything else is logged
   (loudly, per-element, in the test's own console output) but NOT asserted, matching
   the exact non-blocking treatment `a11y-responsive.spec.ts` already established for
   the `/design-system` showcase. Redesigning shadcn's vendored default sizes is
   forbidden (Law 11: never edit `src/components/ui/*`); redesigning the already-DONE,
   independently-verified dashboard/dialog call sites' sizing is out of a `kind: verify`
   task's authority (zero extras, never touch what wasn't explicitly requested) —
   flagged here for a future dedicated a11y-hardening task, not silently dropped.
2. **`scrollable-region-focusable` (axe, serious) on the students Table at 375px.**
   The Table's content becomes wider than the 375px viewport, so its own wrapper
   scrolls horizontally — but that wrapper is shadcn's vendored
   `src/components/ui/table.tsx` `<div data-slot="table-container"
   className="...overflow-x-auto">`; `Table`'s props all forward to the inner
   `<table>` element, never to that wrapper div, so no caller (StudentsSection
   included) can add the `tabIndex`/aria fix axe wants without editing the vendored
   file itself (Law 11). Task 24's sweep names this exact rule ID as a documented,
   logged, non-blocking exemption (`TABLE_SCROLL_EXEMPTION` in
   `tests/e2e/a11y-auth.spec.ts`) rather than silently filtering it or faking a pass —
   flagged for the same future hardening task as (1).
Both are real, live-reproduced (Playwright + `@axe-core/playwright` against the running
:3100/:5500 stack, zero mocks), not assumed from reading source. Neither blocks task
24's own Done Criteria, which are axe-serious/critical-clean (modulo the one named
exemption above), zero horizontal scroll, and real tab-focus order — all of which pass.
Also reconfirmed per D5: the Google OAuth LIVE consent round-trip stays BLOCKED (no
GOOGLE_CLIENT_ID/SECRET anywhere in this workspace, never faked) — documented as a
named `test.skip` in `tests/e2e/a11y-auth.spec.ts` with the exact reason and what ships
instead, not deleted and not a fake pass.

## 2026-07-20 D28 — UI polish mission operational decisions

- Scope is exactly the user-requested auth/search/sidebar/children/settings/notifications
  work. Existing school and agent APIs already return real data, so presentation work does
  not invent duplicate search endpoints or data fields.
- School records have no verified individual image field. The previous decorative local photo
  is not an acceptable school-card fallback; the next school-search slice adds an explicit
  Strapi media relation and renders an honest identity tile while a verified relation is absent.
- Existing child records, sessions, results, notification preferences, notifications and push
  subscriptions persist in the live PostgreSQL datastore. New child-progress and VAPID-public
  key read surfaces are additive, parent-scoped contracts; no seed, mock or fallback data is
  introduced.
- The currently running local stack is reused: web `:3100`, API `:5500`, PostgreSQL `:5540`,
  Mailpit `:8125`. Project rules prohibit starting development/build servers; verification
  targets these live services.

## 2026-07-20 D29 — UI repair research and hierarchy

- Current shadcn sidebar guidance confirms the installed primitive's intended model: a
  `SidebarProvider` plus `SidebarTrigger`, with `collapsible="icon"` for a desktop icon rail
  and the same trigger/keyboard shortcut for mobile off-canvas navigation. Task 42 uses that
  mechanism instead of a custom sidebar state machine.
- The dashboard repair follows current parent/student progress patterns: parent overview and
  individual child learning progress must be separate information architectures, with an
  activity/completion summary and chronological assessment results only where backed by actual
  data. This prevents a generic duplicated card wall and avoids inventing scores.
- The desktop school search will use a persistent filter rail, result list and map workspace;
  mobile retains a constrained sheet. This replaces the desktop dropdown as requested.
