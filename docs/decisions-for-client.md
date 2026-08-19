# Decisions for the client (⚠️ flags collected per rule 41)

Open decisions taken with a stated default while building. Each entry names
the alternative, why the default was chosen, and what reversing it costs.

---

## D-W1 · Teacher rail: Reports stays — the rail is four entries, not three

⚠️ flag — B3's resolution. Fixing B3 (the sidebar fed `buildNavSections` a list
pre-filtered to `group === 'primary'`, dropping the teacher's three `teach`
entries before render) unmasked a product contradiction that the bug had been
hiding: three e2e specs asserted a teacher rail of exactly Dashboard · Test
sessions · Results, while the nav definition and the repo owner's own upstream
fix say Reports belongs too.

**Default taken (Lane B, 2026-08-18, endorsed by the orchestrator's evidence
hand-off):** teachers keep Reports. The teacher rail is FOUR entries in TWO
sections — Manage: Reports; Teach: Dashboard, Test sessions, Results.

**Why:**
1. Upstream commit `5c0841e` (repo owner, 2026-08-12) fixes the identical bug
   and states the intended outcome explicitly: *"Rail per role after this:
   teacher = Reports + Dashboard/Test sessions/Results."* This is the owner's
   own statement of the post-fix product.
2. The nav item itself (`nav.constants.ts`, E11-01) is role-scoped to teachers
   precisely so it renders for them — its comment explains the scoping exists
   to avoid a dead link for parents. It was designed as a teacher rail entry.
3. The three-item assertions were never green under the current nav constants:
   before the B3 fix a teacher saw ONLY Reports (trio dropped, Reports
   present), so both the count-of-three and the reports-count-zero assertions
   failed. They described an intended state no code ever implemented.
4. The alternative makes the E11-01 report surface unreachable by navigation —
   a teacher would have to know and type `/dashboard/reports`.

**Alternative:** cap the rail at three — remove `TEACHER_ROLE_TYPE` from the
reports item (or add `hiddenForRoles: ['teacher']`) and amend the specs back.

**Reversal cost:** small and one-directional — one line in
`nav.constants.ts`, plus reverting the spec amendments in
`teacher-sidebar.spec.ts`, `teacher-auth-sidebar.spec.ts`,
`teacher-report.spec.ts` (the D-W1 hunks are commented as such). The E11-01
routes keep answering either way; only their rail presence changes.

**Reconciliation note:** the local B3 fix and upstream `5c0841e` were
functionally identical but textually different (local introduced
`RAIL_NAV_ITEMS`; upstream passes `NAV_ITEMS` and lets `buildNavSections`
restrict to `NAV_GROUP_ORDER`). `AppSidebar.tsx` now matches `origin/staging`
byte-for-byte so the eventual merge is clean; `PRIMARY_NAV_ITEMS` (the footgun
list) stays deleted locally. The regression test that would have caught the
original bug cheaply now exists: `teacher-sidebar.spec.ts` →
"the rail pipeline hands buildNavSections every teach entry (B3 regression)"
runs the sidebar's exact derivation against the real constants, browser-free.

## D-W2 · The four dead FOREIGN_PARENT fixtures are captured pointers with no env hook — NOT a credentials-class defect

⚠️ flag — task 067's leftover. Four specs pin a hardcoded password with no env
hook for a second parent (`parent-t06@schooltest.local`): `push-subscription.spec.ts`,
`push-subscription-security.spec.ts`, `notification-api-security.spec.ts`,
`settings-tabs.spec.ts`. The account is not seeded anywhere in the repo, so the
tests can only pass against a DB that happens to contain a manually created
parent-t06 — they are believed unexercised on every stack (no one can run that
suite), which is a prediction, not evidence.

**Default taken (Lane J, 2026-08-19, task 067):** left untouched. Do NOT fix by
inventing a seeded foreign parent.

**Why:** these are captured pointers to an account nothing creates, distinct
from the seed-credential fallback mechanism swept in 067. A real fix needs the
tests to provision their own second parent through the registration contract
(the way `throwaway-parent.ts` and `sign-up-form.ts` already do for the primary)
or the seeder to create a documented second parent the specs resolve by name.

**Reversal cost:** small and one-directional — rewrite each fixture to register
its own throwaway second parent via `/api/auth/local` + the sign-up flow, or add
a seeded second parent to the api bootstrap.

## D-W3 · Captured-pointer census: seven literals, all DEAD (Lane N, 2026-08-19)

⚠️ flag — captured-pointer audit, `schooltest-web/tests/e2e`. The seven unique
24–26-char lowercase-alnum literals found by the orchestrator's grep were each
queried against the live datastore (`postgres 127.0.0.1:5540`, db `schooltest`,
via `DATABASE_PASSWORD` from `schooltest-api/.env`). Every one returned ZERO
rows — both in its presumed home table (`document_id` column) and in an
exhaustive scan of **every** text/jsonb column of **every** base table in the
database. Deliberate sentinels (`'aaaaaaaaaaaaaaaaaaaaaaaa'`,
`'zzzzzzzzzzzzzzzzzzzzzzzz'`, `'zz63zz63zz63zz63zz63zz63'`) and Lane G's two
`'bsonh15b2ggwe2rpyuudvzfa'` were excluded per the audit instruction. The
repair differs per case and is NOT made here — this is the census only.

| id | file:line | presumed entity | table checked | result |
|---|---|---|---|---|
| `hvupac2i7ydbtu5zzcczznmm` | `zz-task79-report-alignment.spec.ts:21` (MIXED) | result | `results` | **DEAD** (0 rows; no row in any table) |
| `ndmrbjr6bdvlmnnr5cr4ioks` | `zz-task79-report-alignment.spec.ts:22` (NONE) | result | `results` | **DEAD** (0 rows; no row in any table) |
| `l8148n4woi89kvzlzkrug249` | `zz-task79-report-alignment.spec.ts:23` (FULL) | result | `results` | **DEAD** (0 rows; no row in any table) |
| `miqhycrej19pxzjndotuw9vk` | `zz-task79-report-alignment.spec.ts:24` (EFFORT_INVALID) | result | `results` | **DEAD** (0 rows; no row in any table) |
| `ymd2oc6zp5r3g2vdntey2agy` | `zz-task70-ops-tools.spec.ts:22` (SESSION_DOCUMENT_ID) | session | `sessions` | **DEAD** (0 rows; no row in any table) |
| `zkko2okpnsolmt6m1zg7aqh0` | `zz-task93-per-student-reveal.spec.ts:29` (BETA_ID) | student | `students` | **DEAD** (0 rows; no row in any table) |
| `tqllrynirhpde967ej36s6k3` | `zz-task93-per-student-reveal.spec.ts:31` (ALPHA_ID) | student | `students` | **DEAD** (0 rows; no row in any table) |
| `zkko2okpnsolmt6m1zg7aqh0` | `zz-task139-test-day-summary.spec.ts:28` (BETA_ID, same id as row above) | student | `students` | **DEAD** (0 rows; no row in any table) |

**Population audited:** `results` (183 rows), `sessions` (190), `students` (18),
`sittings` (142) — each confirmed non-empty, so a zero is a true absence, not a
vacant table; plus a whole-database scan of every `document_id` column and every
text/jsonb column of every base table (`information_schema` enumerated, `LIKE
'%id%'`) returning no hit for any of the seven.

**Default taken:** no repair in this census — matches the audit's
"the repair differs per case". At minimum the four result literals and the
session literal are captured pointers with no natural key; consistent with the
mission's other findings they are likely unexercised on every live stack and
would assert against a ghost if ever run.

**Reversal cost:** n/a for the census itself; per-case repair costs will be
recorded when the repair pass is assigned.
