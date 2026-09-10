# Journey 01 — ops invites a school and appoints its school admin

**Spec:** `tests/e2e/journey-01-ops-invite-school.spec.ts` — ONE chained test against the real
Strapi on `:5500`, no mocks, driven at 1440x900.

**Result: PASSING** (`1 passed (24.9s)`, exit 0, final gate run of 2026-09-11; see Verification).

## What the journey drives

1. **Sign in** as the seeded `ops` role through the real portal form (`helpers/roles.ts loginAs`),
   after clearing any session a previous run left in localStorage (the JWT lives in
   `app.auth.token`; a stale session redirects `/sign-in` away and strands the form).
2. **Invite the school** — Schools → "Create school". The modal's own copy states the semantics:
   *"Creates the school and invites its first school administrator"*, primary contact
   *"Required — this person receives the owner invitation"*. Submitting really creates the school
   (re-found through the ops schools API by its unique stamped name) and sends the owner
   invitation email. The **owner magic link is read from the real Mailpit email**
   (`magicLinkFromEmail`) and asserted to be a `/school-onboarding/` link — the invite went out
   by email, not by token-lifting from the database.
3. **Appoint the school admin** — school detail → Admins tab → "Invite staff" dialog → role
   *School administrator* → Grace Hopper `j01-admin-<stamp>@schooltest.local` → *Send invitation*.
   The dialog confirms *"Invitation sent"* and the invited row appears.
4. **The appointed admin accepts through the real emailed link** — the `/invite/<token>` URL is
   read from the Mailpit message text and driven in the browser: the acceptance page shows the
   *School administrator* badge and *"Welcome to J01 Journey School …"*, the required
   first/last/password form is submitted, and the new admin lands signed in on
   `/dashboard/school` (`school-admin-home` surface). The acceptance is double-checked in
   Postgres: the newest `invitations` row for the admin reads `accepted|school_admin`.
5. **Full browser reload** (fresh ops sign-in, `page.reload()`), then the school is still in the
   ops schools list — searched, row visible with the *Pending setup* pill and the **Admins
   count `1`** — and the school detail's Admins tab still lists the accepted admin
   (*0 invited · 1 active*).

Eight 1440x900 captures taken inside the spec land in `shots/`:
`01` create-school form, `02` school row + creation toast, `03` detail hero (Pending setup,
Setup incomplete, Invitation sent), `04` staff-invitation dialog with *Invitation sent*,
`05` the real emailed acceptance page, `06` the accepted admin's school-admin dashboard,
`07` schools list AFTER full reload (Admins `1`), `08` Admins tab after reload.

## Provenance (recovered handoff — disclosed)

This task was inherited from worker `comms-zcode-96d2fdfa` (process died of rate-limit before
reporting). The tree held its uncommitted work: the complete spec, the two product fixes below,
and the realignment of eight onboarding/invitation specs. This run **adopted** that work
(no checkpoint existed), verified every piece, completed one unfinished spec edit (below), and
proved everything against the live stack. Nothing was rewritten from scratch.

## What was actually broken, and the fixes

**Product (root causes fixed, not tested around):**

1. **Every onboarding resend returned 500** — api `onboarding-invitation.ts` computed the
   task-11 resend cooldown from `school_onboardings.school_id`, a column that does not exist
   (school links join through `school_onboardings_school_lnk`). Fixed with the same join every
   reader uses; two new C-SCH-05 api tests pin the contract (immediate resend → typed 429 with
   `ONBOARDING_LINK_COOLDOWN` + `retryAfterSeconds`; aged resend → NEW link, old link still
   live, audit row, second email) plus a `backdateNewestLink` test-clock helper.
2. **Accepting any staff invitation 404'd for teachers** — web
   `src/modules/invitation/lib/role-dashboard.ts` hardcoded the post-accept landing
   `/dashboard/teach`, a route retired by ops task 10. Now routes through the single
   `ROLE_DESTINATIONS` mapping (school admin → `/dashboard/school`, teacher →
   `/dashboard/results`), so the destination can no longer drift from sign-in's.

**Stale specs re-pointed at the shipped UI (the suite could not even sign in):**

- Sign-in copy moved to `Auth.portal.*` (commit 4afb591); hand-rolled fills of the retired
  `Auth.*` labels timed out before typing — replaced with the shared `loginAs` helper.
- The portal-lifecycle redesign (ops rows 10-11) replaced the Account/Onboarding chip pair with
  ONE *Pending setup* pill and re-contracted the directory columns (Status, Plan, Admins) —
  send/resend/revoke/list-detail/school-create specs updated to the shipped surfaces, and the
  server-paginated list (25/page) is asserted through its own server-side search/pill filters
  instead of raw 300+-row counts.
- The accept form gained required first/last name fields (client-validated);
  `invite-acceptance`/`zz-task23` fill them.
- `invite-acceptance.spec.ts` carried private `psql`-shelling `runSql`/`apiEnv` copies that
  crashed with ENOENT on hosts without a psql client — now imports the shared `helpers/auth-db`.
- Emailed absolute links name the mailer's configured host (still the retired :3101), so specs
  navigate by the link's PATH on the app under test — the token is the credential.
- The 60s resend cooldown is server-clock; resend/revoke specs move it with
  `backdateOnboardingLink` instead of sleeping.
- `school-onboarding-invitation.spec.ts:87` still expected `link_token_prefix` in the audit
  detail — token material was deliberately removed from the ledger by 0194c1b (2026-09-06).
  The assertion now pins the hardened contract: the ledger carries NO fragment of the minted
  token.

## Verification (the declared gates, run for real)

1. `pnpm --dir schooltest-web typecheck` — **see the report**: clean on this task's write-set;
   the run window's only failure text came from `journey-03-import-students.spec.ts`
   (`EMPTY_CLASS_ID`), a file another worker was actively editing during this window (three
   journey-03-cluster files carry mtimes inside this task's run and are NOT in this task's
   write-set — no line of this task touches them).
2. `pnpm --dir schooltest-web lint` — **PASS, exit 0** (0 errors; the 3 warnings are the
   pre-existing `react-hooks/incompatible-library` notes in
   `src/modules/ops/hooks/use-school-edit-form.ts`, documented by J02's evidence; the
   `check-no-posteriors` sweep is clean 7/7).
3. `pnpm --dir schooltest-api typecheck` — **PASS, exit 0**.
4. `pnpm --dir schooltest-web exec playwright test tests/e2e/journey-01-ops-invite-school.spec.ts --project=chromium --workers=1`
   — **PASS** (`1 passed (24.9s)`). Run through the Playwright CLI per the mission's standing
   finding: managed `tests.run` uiUrl lanes share one parked browser tab (a leftover session
   there fails sign-in-driving specs at exactly their timeout), and the CLI gets a fresh
   context — the sounder evidence.

**Api-side proof of the resend fix — boundary disclosed:** the shared `:5500` process (PID
1948077, `strapi start`, booted 23:21:42) predates the fix (written 23:54:11), so against it
the new C-SCH-05 tests correctly observed the OLD bug — the immediate resend came back **500
Internal Server Error**, exactly the regression the test pins. The mission's standing order
("do NOT start, stop, build or restart" the shared servers) forbids restarting `:5500`, so the
fix was proven on a THROWAWAY instance instead (the stack's established pattern): api built
from this tree, `PORT=5505 strapi start` booted over the same datastore, the spec run with
`E2E_BASE_URL=http://127.0.0.1:5505`, then the throwaway SIGTERMed and the shared servers
re-verified untouched (`:5500` → 204, `:3002` → 200). Results across the proof runs:

- vs stale shared `:5500`: 3 passed / 3 failed — the failures being the pre-fix 500s and the
  stale `link_token_prefix` assertion (below);
- vs throwaway `:5505` (fix live), first pass: 5 passed / 1 failed — the one failure EXPOSED A
  REAL SECOND DEFECT: the cooldown answered **400, not 429**, because Strapi's error middleware
  (`formatApplicationError` in `@strapi/core/dist/services/errors.js`) maps every
  `ApplicationError` by class to 400 and ignores the ad-hoc `.status = 429` the service stamps;
  the controller wrapper set `Retry-After` but rethrew into that mapping. **Fixed** in
  `src/api/school/lib/school-onboarding-link.actions.ts`: the wrapper now answers the 429
  itself, emitting the same envelope Strapi would (`data: null`, `error{status,name,message,
  details}`) plus `Retry-After`, leaving the service owning the window decision;
- vs throwaway `:5505` (final, both fixes live): **6 passed (2.1s), exit 0** — C-SCH-01..04
  contract tests, cooldown 429 + `Retry-After` + `ONBOARDING_LINK_COOLDOWN` +
  `retryAfterSeconds`, and resend-mints-new-link keeping the old link live.

**Found during this proof, NOT fixed here (out of this task's write-set):** the ops resend
endpoint (`src/api/ops/controllers/invitations.ts`, task 15's surface) uses the same
set-`.status`-and-rethrow shape, so its cooldown very likely answers 400 instead of its
documented 429 too — same middleware, same shape. Reported to the orchestrator for that
surface's owner.

## Shared-state hygiene (disclosure)

- Every run stamps school name and both emails with `Date.now()`, so reruns never collide.
- `afterAll` deletes the created school and its staff accounts through the real writes
  (`cleanupSchool`); verified in Postgres after the green run: **0** `J01 Journey School%`
  rows, **0** `j01-%` user accounts.
- Five orphan `invitations` rows with `j01-` emails (from the dead predecessor's crashed runs,
  whose schools are already deleted) remain in the shared datastore — inert: every suite
  queries invitations `where email = <this run's stamp>`, and no spec counts the table
  globally. Left in place rather than hand-deleting shared-table rows.
