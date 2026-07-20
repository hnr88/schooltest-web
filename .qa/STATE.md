# STATE.md — mission 2 board (mirror of STATE.json)

Mission: parent auth (password + Google-wired), student passwordless magic-link API,
parent dashboard (list/add students), global search — borrowed from schoolgo.
Contracts: .qa/CONTRACTS.md · Tasks: .thellmspace/tasks/ (27) · Plan: .qa/PLAN.md

## Board
(resynced from STATE.json 2026-07-18T23:11:00.000Z, during task 25's build pass —
this table had gone stale early in the mission; statuses below are pulled directly
from the authoritative STATE.json, task-by-task, with no additions ahead of it)

| # | Task | Depends | Status | Verify |
|---|------|---------|--------|--------|
| 01 | Email provider (SMTP→Mailhog) | — | DONE | PASS |
| 02 | Student schema +email +parent | — | DONE | PASS |
| 03 | Parent role + grants | 02 | DONE | PASS |
| 04 | Magic-link model + service | 01,02 | DONE | PASS |
| 05 | request/verify/me endpoints | 04 | DONE | PASS |
| 06 | Parent-issue endpoint | 03,04 | DONE | PASS |
| 07 | Seed parent + students | 02,03 | DONE | PASS |
| 08 | Register→parent role ext | 03 | DONE | PASS |
| 09 | Google provider config | — | DONE | PASS |
| 10 | Parent students CRUD | 02,03 | DONE | PASS |
| 11 | Search endpoint | 10 | DONE | PASS |
| 12 | Sign-in page + errors | — | DONE | PASS |
| 13 | Sign-up page | 08,12 | DONE | PASS |
| 14 | Google button + callback | 09,12 | DONE | PASS |
| 15 | Dashboard route + guard | — | DONE | PASS |
| 16 | Students list | 10,15 | DONE | PASS |
| 17 | Add-student dialog | 16 | DONE | PASS |
| 18 | Search bar UI | 11,16 | DONE | PASS |
| 19 | E2E parent login | 07,16 | DONE | PASS |
| 20 | E2E invalid creds | 12 | DONE | PASS |
| 21 | E2E add student | 17 | DONE | PASS |
| 22 | E2E search | 18 | DONE | PASS |
| 23 | E2E magic-link flow | 05,07 | DONE | PASS |
| 24 | E2E a11y + regression | 19–23 | DONE | PASS |
| 25 | Critic ×2 + REPORT | 24 | DONE | PASS |
| 26 | Mailpit service in docker-compose.dev.yml | 01 | DONE | PASS |
| 27 | Adopt schoolgo locale set (en/zh/ko/ms/vi/th), drop de | — | DONE | PASS |

---

## UI polish + parent notifications board (2026-07-20)

Contracts: `.qa/CONTRACTS.md` addendum · Task files: `.thellmspace/tasks/28-*.md` through
`41-*.md` · authoritative machine state: `STATE.json.ui_polish_20260720`.

| # | Task | Depends | Status | Verify |
|---|------|---------|--------|--------|
| 28 | Single logo on auth screens | — | DONE | PASS — live 6/6 auth/a11y |
| 29 | Dark primary sidebar | 28 | DONE | PASS — live desktop/mobile shell |
| 30 | School cards and larger map | 29 | DONE | PASS — live map/data 8/8 |
| 31 | Grouped school filters | 30 | DONE | PASS — live filter/map 12/12 |
| 32 | Agent search polish | 31 | DONE | PASS — live query/filter/a11y |
| 33 | Student selection contrast | 32 | DONE | PASS — live contrast + persisted child |
| 34 | Parent child progress API | 33 | DONE | PASS — live persisted API/security |
| 35 | Child cards and profile metrics | 34 | DONE | PASS — live profile/card/archive/mobile/a11y 13/13 |
| 36 | Separated settings tabs | 35 | TODO | — |
| 37 | In-app notification bell and feed | 36 | TODO | — |
| 38 | Notification preferences settings | 37 | TODO | — |
| 39 | Browser push subscription | 38 | TODO | — |
| 40 | Notification delivery and SMS preparation proof | 39 | TODO | — |
| 41 | Independent critic and final regression | 40 | TODO | — |

Task 15 ("/dashboard route + client guard") is now DONE — verified 2026-07-18 by an
independent explore verifier against its own Done Criteria (not assumed correct just
because task 12's D19 stopgap had already built the files): real incognito redirect to
/sign-in, real seeded-parent session rendering the guarded shell with a live
GET /api/users/me username + working sign-out, axe clean, tsc/lint zero, full 6-locale
key parity, 14/14 e2e green (dashboard.spec.ts + sign-in.spec.ts + google-callback.spec.ts).
Full evidence recorded in STATE.json task 15's `verify` object.

Task 16 ("Students list") is now DONE — independently re-verified 2026-07-18 on the
build agent's attempt-2 (attempt-1's blocking gap was 5 locales carrying a stale generic
"Dashboard" label instead of "your students" for `Dashboard.title`). Confirmed the fix is
real, not cosmetic: grep-proved zero collision with the separately-scoped
`Dashboard.meta.title` and `welcomeTitle` keys, full 358-key/6-locale parity. Live curl
against :5500 confirms C-STUDENT-LIST's exact contracted shape for the seeded parent
(Mia + Jonas, sort/pagination params honored). Own throwaway schema-tamper script proves
the zod schema genuinely rejects a malformed payload. Browser screenshots confirm both
the populated table and the real EmptyState render correctly. 8/8 students-list.spec.ts +
27/27 broader regression green, axe clean twice, tsc/lint 0, prettier clean, zero mock/
fake/stub hits. Own diagnostic route-intercepted spec (deleted after use) proves the
Alert+Retry error branch is genuinely wired and recovers with real data. Full evidence in
STATE.json task 16's `verify` object.

Task 17 ("Add-student dialog") is now DONE — independently verified 2026-07-18. Live
curl against :5500 with the seeded parent's real JWT proves C-STUDENT-CREATE's exact
200 shape ({data:Student}, server-injected parent, client-supplied parent/student_key
overrides silently stripped) and all three documented 400 paths (year_level<7,
missing given_name, invalid email) with the exact {error:{details:{issues}}} envelope
that classify-add-student-error.ts reads; unauth 403 (pre-existing masked-403 install
quirk, non-blocking — dialog only mounts behind ParentGuard). Two curl-created
throwaway students were cleaned up via direct Postgres delete (no DELETE grant exists
for the parent role — 403 confirmed) and the seeded parent's list re-confirmed at
exactly Mia (8) + Jonas (10) afterward, zero pollution. tests/e2e/add-student-dialog.spec.ts
run live: 4/4 passed (real create with no-manual-reload list update via query
invalidation, persistence after a real page reload, axe-clean open dialog with focus
landing inside it, required-field block, invalid-email block, Cancel-discards). Full
suite re-run: 52/52 passed, including students-list.spec.ts's own "exactly Mia+Jonas"
assertion (proves the curl testing left no residue). tsc/lint 0 (1 pre-existing
unrelated warning, confirmed untouched), prettier clean, i18n parity independently
recomputed at 360 keys × 6 locales, grep for mock/fake/stub/dummy/placeholder/hardcoded
across every touched file returned zero fixture hits. Full evidence in STATE.json
task 17's `verify` object.

Task 18 ("Search bar UI") is now DONE — independently verified 2026-07-18. Live curl
against :5500 with the seeded parent's real JWT proves C-STUDENT-SEARCH's exact shape
for q=mia (only Mia, count 1), q= empty (both students, createdAt desc — the recents
contract), and q=zzz (empty data, count 0); unauth 403 (pre-existing D15 masked-403
quirk, non-blocking). Own live Playwright run (not the builder's self-report) confirms
focusing the empty input genuinely shows real recents before any typing — the "always
enabled" query behavior is real, not just claimed. tests/e2e/dashboard-search-bar.spec.ts
run myself: 2/2 passed, 10/10 on --repeat-each=5 (zero flakes): type "mia" → only Mia,
zero axe violations of any severity on the open panel; click Mia → table narrows, Jonas
absent; Clear → both back; type "zzz" → real translated no-results row; Escape → panel
unmounts, text preserved; separate keyboard-only ArrowDown+Enter selection test. Full
suite re-run: 54/54 passed, zero regressions. tsc/lint 0 (1 pre-existing unrelated
warning), prettier clean, i18n parity 360×6 zero diff (independently confirmed the
search-related keys pre-existed in the last commit before this task touched anything).
grep for mock/fake/stub/dummy/placeholder/hardcoded across every touched file: zero
fixture hits. No write path in this task (search read-only, click-select is client-only
Zustand state) so no DB-persistence check applies. Non-blocking nit documented in
STATE.json: StudentsSection.tsx is 128 lines (8 over CLAUDE.md's 120-line component
cap after this task's filter wiring) — not lint-enforced, not a Done Criterion, flagged
for a future tidy-up pass. Full evidence in STATE.json task 18's `verify` object.

Boot-gate: api :5500 healthy ✓ (running), web :3100 healthy ✓ (running), mailpit
1125/8125 ✓ (this mission's own instance, D14 — do not confuse with the neighbor
Mailhog on 1025/8025), postgres :5540 ✓, seeded parent parent@schooltest.local /
Parent1234! (D9) confirmed live via real POST /api/auth/local during task-12 verify.

Task 19 ("E2E parent login") is now DONE — independently verified 2026-07-18. Live curl
against :5500 confirms C-AUTH-LOGIN's real 200 {jwt,user} for the seeded parent and a
follow-up GET /api/my/students returning both Jonas Keller and Mia Keller. Own run of
tests/e2e/parent-auth.spec.ts (not the builder's self-report) against the live
web:3100/api:5500 stack: 1/1 passed, --repeat-each=5 → 5/5 passed, zero flakes. The test
drives the real /sign-in form via catalog-driven labels, asserts network truth on the
real POST /api/auth/local and GET /api/my/students responses, UI truth (Dashboard.title
heading + both student rows in the real table), a genuine JWT in localStorage under the
app's actual AUTH_TOKEN_KEY, and zero console/page errors. tsc/lint 0 (1 pre-existing
unrelated CreateArticleForm.tsx warning), prettier clean, grep for mock/fake/stub/dummy/
placeholder/hardcoded across both new files returned zero fixture hits. Full suite
re-run: 54/55 with the same pre-existing design-system.spec.ts:158 intermittent overlay
flake already documented independently in tasks 12/13/14/18's own evidence (reproduced
it again in isolation on this pass: failed once, passed twice more) — confirmed
unrelated to either file this task touches. Full evidence in STATE.json task 19's
`verify` object.

Task 20 ("E2E invalid creds") is now DONE — independently verified 2026-07-18. Live curl
against :5500 confirms C-AUTH-LOGIN's error path exactly as CONTRACTS.md documents:
wrong-password and unknown-email both return the byte-identical real 400
{error:{status:400,name:"ValidationError",message:"Invalid identifier or password"}} —
no enumeration signal — with correct creds still returning a real 200 {jwt,user}. Own run
(not the builder's self-report) of the extended tests/e2e/parent-auth.spec.ts: 4/4
passed; --repeat-each=3 → 12/12 passed, zero flakes. Confirmed by reading SignInForm.tsx
that classifyError maps any 400 to one translated `loginError` key regardless of body
content, and the tests prove this end to end: the real network response carries the raw
Strapi string while the DOM's styled Alert shows only the translated Auth.loginError
value with the raw string appearing zero times on the page (enumeration-safe in the UI,
not just the API). Empty-submit case verified to fire zero network requests and show
translated Auth.emailRequired/Auth.passwordRequired with aria-invalid on both fields.
Each login case makes exactly one submit (zero-tolerance, no retry loops). axe scan on
the wrong-password errored page ran for real inside the test: zero serious/critical
violations. watchErrors is deliberately skipped only on the two error-case tests, an
already-established pattern (sign-in.spec.ts's own wrong-password test does the same,
because Chromium logs every non-2xx response as a console.error regardless of app
handling). tsc/lint 0 (same 1 pre-existing unrelated CreateArticleForm.tsx warning),
prettier clean, full suite re-run 58/58 with zero regressions, grep for mock/fake/stub/
dummy/placeholder/hardcoded across the touched file returned zero fixture hits (only a
benign "no hardcoded copy" comment). No write path in this task (failed/blocked logins
only) so no DB-persistence check applies. Full evidence in STATE.json task 20's `verify`
object.

Task 21 ("E2E add student persists + reload") is now DONE — independently verified
2026-07-18. tests/e2e/dashboard-students.spec.ts (2 tests, pure test-authoring slice —
schema/backend/typed-client/UI were already DONE by task 17) run live by me: 2/2 passed.
Verified DB-truth myself via direct psql against the live Postgres, not just API/UI
truth: the created rows genuinely persisted (ids 872/873) and students_parent_lnk rows
tie each to its OWN distinct throwaway parent, proving real per-caller ownership. The
spec's documented deviation (task-21 text says "prove via direct api GET /api/students";
the file uses GET /api/my/students instead) is confirmed real, not fabricated — I curled
GET /api/students and GET /api/students/:id with the seeded parent's own JWT and got a
genuine 403 PolicyError both times (D16's IS_TEACHER policy on the core route), so
C-STUDENT-LIST's GET /api/my/students (which forces filters[parent]=<caller>
server-side) is the correct current parent-read route and inherently supplies the
ownership proof the task asks for. Ran my own curl probes covering every documented
C-STUDENT-CREATE path (200 with parent-override-attempt silently stripped; three 400
paths byte-matching CONTRACTS.md's envelope; unauth 403) against a fresh throwaway
parent, cleaned up the one curl-created student via direct Postgres delete afterward,
and reconfirmed via a real GET /api/my/students call that the seeded parent's fixture is
still exactly Mia(8)+Jonas(10) — zero pollution. tsc/lint 0 (1 pre-existing unrelated
warning), prettier clean, grep for mock/fake/stub/dummy/placeholder/hardcoded on the new
file returned zero hits. Full-suite re-run 6x live: 5/6 fully green (60/60); the other
run hit the SAME already-documented design-system.spec.ts:158 popover/dialog overlay
flake independently logged in tasks 12/13/14/18/19's own evidence — unrelated to this
task's file, which was green in every single run (6 full-suite + 2 standalone). Also
independently re-ran add-student-dialog.spec.ts's axe assertion 3x (12/12 green) after a
false-positive color-contrast finding from my OWN ad-hoc verification script turned out
to be a self-inflicted measurement artifact (an extra pre-dialog full-page axe scan in my
script, not present in the official test or the app itself) — root-caused and ruled out,
not a real accessibility regression. Full evidence in STATE.json task 21's `verify`
object.

Task 22 ("E2E search") is now DONE — independently verified 2026-07-18. Pure
test-authoring slice (tests/e2e/dashboard-search.spec.ts, new — schema/backend/
typed-client/UI were already DONE by task 18; git status confirmed zero backend or
other web source edits). C-STUDENT-SEARCH curl-verified live against :5500 with the
seeded parent's own fresh JWT: q=mia -> exact {data:[Mia Keller],meta:{query:{q:'mia',
count:1}}}; q= (empty) -> both students desc by createdAt; q=zzz ->
{data:[],meta:{query:{q:'zzz',count:0}}}; unauth -> 403 (pre-existing D15 masked-403
quirk, same as tasks 15-21, non-blocking). Ran the spec myself (not the builder's
self-report): 1/1 passed; --repeat-each=8 -> 8/8 passed zero flakes across 8 concurrent
workers against the same seeded parent (read-only, no interference). Full suite re-run:
61/61 passed, zero regressions, matching the self-report exactly. The spec's own route
watcher independently proves the debounce contract: 3 fast keystrokes ("m"/"mi"/"mia")
at 50ms delay collapse into exactly ONE settled request for "mia" on the wire, never one
for an intermediate value; click narrows the real table to Mia (Jonas absent); Clear
resets both query and filter; "zzz" round-trips the real zero-result response and
renders the translated no-results row; Escape unmounts the panel while preserving the
typed text; zero console/page errors. Supplementary own throwaway axe spec (deleted
after use) additionally covered the no-results panel state, which task 18's own axe
coverage had not explicitly exercised -> zero violations of any severity. tsc/lint 0
(1 pre-existing unrelated warning), prettier clean, grep for
mock/fake/stub/dummy/placeholder/hardcoded returned zero fixture hits (only benign hit
is the existing `Dashboard.searchPlaceholder` i18n key name). No new write path in this
task, so no DB-persistence-across-reload check applies. Full evidence in STATE.json
task 22's `verify` object.

Task 23 ("E2E magic-link flow") is now DONE — independently verified 2026-07-18.
Personally re-ran the live spec (not just trusted the self-report):
`pnpm exec playwright test --config=tests/e2e-live/playwright.live.config.ts` inside
schooltest-app -> 1 passed (32.5s) against the real :5500 api, real dockerized Mailpit
(:8125/api/v1), and real Postgres. Confirmed via direct psql that a fresh
`student_magic_links` row (id 25, used=true) landed from my own run, matching api.log's
real POST request->200, GET verify->200, GET me->200x2 sequence at 22:44:01-06; Mailpit's
own search count for mia.keller@schooltest.local moved 9->10 across the run. Both
environmental findings behind D21 were independently reproduced, not just read: port 3002
is genuinely held by an unrelated neighbor (`/proc/<pid>/cwd` -> `RCS/park-rcs`, left
untouched); the CORS preflight now echoes `Access-Control-Allow-Origin` for
`:3003` (re-probed myself) while `:3100` still works; the api process's start time lines
up with the claimed restart, and `schooltest-api/.env`'s `FRONTEND_ORIGIN` change is
confirmed gitignored/untracked (zero tracked diff). Confirmed the app strings the spec
asserts on (sign-in title, "Check your inbox", "You're signed in",
"What would you like to work on today?", "Hi {firstName}!") are real pre-existing i18n
keys and the verify/home pages are real pre-existing routes, not fabricated. tsc zero
(scoped tests/e2e-live/tsconfig.json + root), eslint zero on tests/e2e-live/, full
`pnpm lint` shows only the same 4 pre-existing errors/5 warnings outside
tests/e2e-live/ (line-for-line confirmed pre-existing). grep for
mock/fake/stub/dummy/placeholder/hardcoded across tests/e2e-live/ returns only a
descriptive comment, zero fixture code. Spot-checked that the CORS/env change caused no
backend contract regression: unknown-email request 200 {ok:true}, malformed token 400,
reused token 401 reason:used, unauthenticated /me 401 — all matching CONTRACTS.md
C-ML-REQUEST/VERIFY/ME exactly. :3100/:5500 both healthy afterward; port 3003 torn down
cleanly. Axe scan skipped: not a Done Criterion here and no new UI shipped in this task
(pure integration e2e against pages already axe-covered by their own owning tasks). Full
evidence in STATE.json task 23's `verify` object.

Task 24 ("E2E a11y + regression") is now DONE — independently verified 2026-07-18.
Personally ran `tests/e2e/a11y-auth.spec.ts` (not the builder's self-report) against the
real :3100/:5500/Postgres/Mailpit stack: 10/10 passed + 1 skipped, then
`--repeat-each=3` → 30/30 passed + 3 skipped, zero flakes. Full suite re-run twice by
me: both runs 71/71 passed + 1 skipped (72 total, zero failures), including the
pre-existing M1 landing/design-system specs, completely untouched. axe is genuinely
zero serious/critical on /sign-in, /sign-up, /auth/google/callback (error state), and
every swept /dashboard state (welcome, students table, search panel, add-student
dialog open) at 375px and 1280px, modulo the one named, logged, non-blocking exemption
(`scrollable-region-focusable` on shadcn's vendored table-container div,
`TABLE_SCROLL_EXEMPTION`) — observed firing in my own run's console, correctly not
silently dropped. Zero horizontal scroll anywhere swept; forward-tab focus order
verified for /sign-in, /sign-up, /dashboard; hard ≥43px regression assertions passed
for every task-12/13 primary control at both viewports; everything else undersized is
advisory-logged only, matching `a11y-responsive.spec.ts`'s pre-existing (git-diff
confirmed untouched) "(see D22)" comment — which genuinely predated this task and had
no matching DECISIONS.md entry until now (verified via `git show HEAD:...`, not
fabricated after the fact). Google OAuth BLOCKED reasoning (D5) re-verified myself:
`GET /api/connect/google` → real 400 `{message:"This provider is disabled"}`; grepped
`schooltest-api/.env*` and the live api process env for `GOOGLE_CLIENT_ID`/`SECRET` —
none exist anywhere (only commented placeholders in `.env.example`); the spec's
`test.skip` names the exact reason, never a fake pass. Contract conformance re-curled
live: `POST /api/auth/local` (seeded parent) → 200 jwt; `GET /api/my/students` → 200
`{data:[Jonas(10),Mia(8)],meta.pagination.total:2}`, checked both before and after the
full suite ran — zero pollution from the add-student-dialog tests' fresh throwaway
parent registrations. tsc 0 errors, lint 0 errors (1 pre-existing unrelated
`CreateArticleForm.tsx` warning, same as every prior task), prettier clean on the
actual touched code file (the `DECISIONS.md` formatting warning is pre-existing,
confirmed via `git stash`/`pop` to fire identically on the pre-D22 version too — not
introduced by this task, and it's a builder-log file, not code). grep for
mock/fake/stub/dummy/placeholder/hardcoded across the new spec file: zero fixture hits
(only a comment referencing the pre-existing, already-established `stub-jwt`
literal-string pattern shared with sign-in/sign-up/google-callback/dashboard specs).
No new write/persistence path in this task, so no new DB-persistence check applies.
All 6 named screenshots (a11y-sign-in-en/-mobile, a11y-sign-up-en/-mobile,
a11y-dashboard-en, dashboard-mobile-en) freshly regenerated by my own run in
`.qa/screenshots/`. Full evidence in STATE.json task 24's `verify` object.

Task 26 ("Mailpit service in docker-compose.dev.yml") is DONE — verified by
orchestrator live proof: the `schooltest-api-st1-mailpit` container is healthy on
1125 (SMTP)/8125 (HTTP API), the api was restarted after the compose change, and a
real send round-tripped 250-queued and became searchable via `GET /api/v1/search` in
THIS mission's own Mailpit — the staging/prod docker-compose topology (a separate
deployment agent's surface) was left untouched. Full evidence in STATE.json task 26's
`verify` object.

Task 27 ("Adopt schoolgo locale set, drop de") is DONE — verified by an independent
explore verifier + fix: 336 keys × 6 locales (en/zh/ko/ms/vi/th) parity, 38 real
schoolgo-sourced translations per locale (verbatim-checked and brand-fixed
SchoolGo→SchoolTest, zero remaining "SchoolGo" hits), live zh/ko/th render with the
correct `lang` attribute and translated chrome, English-fallback confirmed honest
(not machine pseudo-translation) for unmapped keys, full suite 19/19 green. The
verifier found and fixed 10 borrowed `[TODO:]` placeholders inherited from schoolgo's
`Errors` namespace, replacing them with an honest English fallback (zero remaining),
then re-confirmed the suite green. Full evidence in STATE.json task 27's `verify`
object.

Task 25 ("Critic ×2 + REPORT") is now DONE — independently verified 2026-07-18,
fresh evidence gathered personally against the live stack (not reused from the
builder's self-report). `.qa/REPORT.md` (322 lines) and the STATE.md resync were
confirmed on disk exactly as claimed. Re-curled every CONTRACTS.md endpoint against
live :5500 myself: login success/enumeration-safe-failure, `/users/me` role,
`/my/students` (exactly Mia+Jonas), `/search/students` (q=mia/empty/zzz), create
400-validation paths, and a fresh ownership-override probe (server-injected caller
documentId, client's spoofed `parent` silently stripped) — confirmed the created row
(id 948) genuinely PERSISTED in Postgres via `docker exec psql`, confirmed parent
DELETE is 403, cleaned up via direct psql delete, re-confirmed the seeded parent's
list back to exactly Mia+Jonas with zero residue. Ran the full magic-link round trip
myself end-to-end: request→real Mailpit delivery (fetched via `/api/v1/search` +
`/api/v1/message`)→extracted the raw 64-hex token→computed sha256 locally and
matched the `student_magic_links.token` DB column exactly→verify (200, exp-iat
28800s)→`/auth/student/me` (200)→token reuse (401 reason:"used"); unknown-email
request also 200 `{ok:true}` (enumeration-safe); malformed token 400. Read
`src/api/student/controllers/student.ts` directly and confirmed the ownership
filter/injection genuinely happens AFTER `sanitizeQuery`/`sanitizeInput`, matching
the report's security claims (not just probed). CORS preflight: `:3100`/`:3003`
both echo `Access-Control-Allow-Origin`, an arbitrary unlisted origin gets no CORS
header (no wildcard leak). `pnpm tsc --noEmit`: 0 errors in all three packages
(root + `tests/e2e-live/tsconfig.json`), run myself. `pnpm lint`: 0 errors in
schooltest-web (1 pre-existing warning) and schooltest-api (0/0); schooltest-app's
`tests/e2e-live/` scoped lint 0/0, full-repo lint shows the same 4 pre-existing
errors confirmed untouched via git status. Grepped every touched file in both repos
myself (mock|fake|stub|dummy|placeholder|TODO|FIXME|lorem|hardcod): zero fixture
hits, only benign matches. i18n parity recomputed with my own script: 360 keys × 6
locales, zero diff. Full Playwright suite (schooltest-web) run 3× by me: 2 of 3 runs
71 passed/1 skipped/0 failed exactly matching the report; the 1 flake reproduced was
`design-system.spec.ts:158`'s pre-existing overlay-close timing race, already
independently documented as non-blocking/unrelated in tasks 12/13/14/18/19/21/24's
own verify evidence — never touched by any auth/dashboard/task-25 file.
`schooltest-app/tests/e2e-live/magic-link.spec.ts`: my first run hit a 429 that I
root-caused to MY OWN prior curl testing having exhausted the shared 5/60min
rate-limit budget on `mia.keller@schooltest.local` (confirmed via psql: exactly 5
rows in the trailing window); polled the DB read-only until a slot aged out, then
re-ran once cleanly → 1 passed (2.0m), `:3003` torn down cleanly afterward — a
self-inflicted collision, not a real defect, and consistent with the report's own
claim once accounted for. Prettier confirms both flagged cosmetic-drift files
really do have formatting warnings while `pnpm lint` stays 0 errors for both,
exactly as claimed. git status confirmed zero source pollution from this
verification pass (schooltest-api clean; schooltest-web's uncommitted set unchanged
before/after, 55 porcelain lines both times) and the seeded parent's list re-checked
exactly Mia+Jonas at the end. Full evidence in STATE.json task 25's `verify` object.
