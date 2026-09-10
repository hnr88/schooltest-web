# Journey 02 — school admin creates a teacher and a class

**Spec:** `tests/e2e/journey-02-school-admin-teachers-classes.spec.ts` — ONE test against the real
Strapi on `:5500`, no mocks, driven at 1440x900.

**Result: PASSING** (`1 passed (16.6s)` on the final gate run; see Verification below).

## What the journey drives

1. **Sign in** through the real portal form as the seeded `schoolAdmin`
   (`helpers/roles.ts loginAs`, paced for the shared 20/min-per-IP auth budget).
2. **Create teacher** — Teachers → "Add teacher" → First/Last/Email → "Send invitation".
   The UI creates a C-INV-01 **invitation** (the shipped semantics of the design's
   `modal.teacher-form`); the staff table immediately shows the row with the **Invited** badge and
   `data-status="invited"`, and it is still there after a reload. The invitation POST's 201 response
   is captured off the wire and must carry the `invite_url` the email uses.
3. **Create class** — Classes → "Add class" → name → "Create class" (C-CLS-02, no teacher yet —
   the invited teacher is not yet an account, exactly the design's
   "No teacher assigned — you can add one later"). Cross-checked in the API: class exists with
   `teachers: []`; the classes row shows the em-dash "no teacher" cell.
4. **The teacher accepts** — the emailed link's real public legs are driven over the API:
   `GET /api/invitations/<token>` (C-INV-05) then `POST /api/invitations/<token>/accept`
   (C-INV-06) with a real password. This is the one leg that does NOT happen in the admin's browser
   by nature: in real life the teacher opens the emailed link on their own machine. The acceptance
   endpoints are the same ones `src/modules/invitation/**` (J01's module, deliberately untouched
   here) drives, and the account they create is what makes the teacher assignable —
   `assertAssignableTeachers` (api `class-student-assignment.ts`) rejects any teacher whose account
   is not `confirmed`, so acceptance is a hard precondition of the assign leg, not a shortcut.
5. **Assign** — teacher detail → "Assign to class" → tick the new class → "Save changes"
   (the design's S14 "Assign <teacher> to classes" picker). API truth checked immediately:
   the class's `teachers` now contains the new teacher's documentId.
6. **Full browser reload**, then both records are asserted present and linked in three UI surfaces
   AND the API:
   - teacher detail: "Assigned classes" lists the class (`teacher-detail-classes` link);
   - teachers list: the row flipped `data-status` invited → active, Invited badge gone;
   - classes list: the class row's Teacher cell shows the teacher's name;
   - class detail: the served `class-teacher-chip` shows the teacher's name;
   - API: class `teachers == [teacherDocumentId]`; the teacher is served by C-TCH-01, not blocked.

## What was actually broken

**Nothing in the product.** The whole journey already worked end-to-end against the live stack; the
API chain was first proven with a standalone HTTP probe (invitation 201 with `invite_url` → public
read → accept 200 with jwt+user → class create 201 → assign PATCH 200 → linked in list reads), then
the UI journey was driven and passed once the spec's own selector assumptions were corrected:

- the classes-list "no teacher" cell renders the em-dash `Classes.table.teacherNone` ("—"), not the
  other table's `teachersNone` sentence (first run failed on my wrong expectation);
- an **active** staff row renders NO status badge at all (`StaffNameCell` badges only
  invited/deactivated), so the invited→active transition is asserted via the row's
  `data-status="invited" → "active"` plus the badge's absence (second run failed on my wrong
  expectation).

Both failures were spec-side, fixed in the spec; no product file was touched (the task's entire
diff is the new spec + this evidence folder).

## Root cause / what changed

- `tests/e2e/journey-02-school-admin-teachers-classes.spec.ts` — NEW: the durable journey spec.
- `.qa/journeys/02-school-admin-teachers-classes/**` — NEW: this README + `shots/` (six 1440x900
  captures taken inside the spec: invited row, created class + toast, assign dialog, teacher detail
  after reload, classes list after reload, class detail chip after reload).
- No web/api product code changed. Prior spec fixtures were reused (`helpers/roles.ts`,
  `helpers/credentials.ts`, `helpers/i18n.ts`) rather than duplicated.

## Verification (the declared gates, run for real)

1. `pnpm --dir schooltest-web typecheck` — **PASS** (`tsc --noEmit`, no output).
2. `pnpm --dir schooltest-web lint` — **PASS** with 0 errors (3 pre-existing warnings, all in
   `src/modules/ops/hooks/use-school-edit-form.ts` — J01's surface, not this task's files).
3. `pnpm --dir schooltest-api typecheck` — **FAILS, not this task's dirt**: the only errors are
   `tests/e2e/result-review.spec.ts(308,53) TS2304: Cannot find name 'ownerRow'` inside the
   in-flight J06 write-set (`src/utils/result-view-v2.ts` + `tests/unit/result-view-v2.spec.ts` +
   that spec — all modified in the api tree before this task started; the tree even carries a
   `dist/tsconfig.j06check.tsbuildinfo`). This task's write-set contains **zero api files**.
4. `pnpm --dir schooltest-web exec playwright test tests/e2e/journey-02-school-admin-teachers-classes.spec.ts --project=chromium --workers=1`
   — **PASS** (`1 passed (16.6s)`), and **PASS again** under the managed-runner shape
   (`CI=1 ... --reporter=json`, exit 0). Earlier iterations: 2 failed runs while calibrating
   selectors, then green, then re-run green after the sweep below.

**Managed Codephant Tests runner — unavailable for schooltest-web this mission (reported, not
claimed):** every `tests.run` with `uiUrl` against this suite dies in ~1.0s with
`did not produce a readable JSON report` before any test executes — runIds `b044e648…` and
`bd095439…` (J06's worker), `6574497f…` (J03's worker), `7f0aaf86…` (the orchestrator itself),
and this task's `ad5ccd5c…` + `ef007a1a…` (retried after opening a visible Codephant Browser tab).
Reproduction attempts from the shell did NOT reproduce: `CI=1 --list` collects all 834 tests and
`CI=1 --reporter=json` runs the journey green, so the failure is inside the runner's spawn step,
mission-wide, not in this spec or the web config. The visible-tab leg of the policy was still
exercised directly: `browser.open` + `browser.capture` on `http://localhost:3002` serves the real
guarded portal (`.codephant/evidence/browser/1cbb14c5-1784-4d6e-b76f-edc0430b272c.png`).
The declared gate 4 (the CLI invocation above) is the app's own verification command and passes.

Regression sanity next to the gates: `zz-task29-classes-crud.spec.ts` and
`zz-task32-sa-teachers-kit.spec.ts` were run and FAIL for causes that pre-date this task (this
task's diff is one new spec file, so it cannot have regressed them):

- `zz-task32` fails at sign-in on the pre-redesign `Auth.emailLabel`/`Auth.signInButton` keys —
  the portal auth redesign moved the labels to `Auth.portal.*` (which this journey uses).
- `zz-task29` test 1 times out on its row-menu leg ("Actions" button never renders for its row);
  test 2 fails on `login()` when the shared per-IP auth budget is saturated (20 POST/min shared
  with five concurrent journey workers).

## Shared-state hygiene (disclosure)

- Every run uses a `Date.now()`-stamped teacher email and class name, so reruns never collide.
- The spec deletes its class and deactivates its teacher at the end (accounts are never deleted;
  deactivated preserves the audit trail). A crashed run can therefore leave one class + one
  invitation behind; after the first (failed) run left litter, the sweep deleted
  `Journey02 Class 1789068557082` and revoked its pending invitation, and also deleted five
  crashed-run `PW29 Probe *` classes that earlier `zz-task29` aborts had left in the shared demo
  school. Accepted invitations return 409 on revoke (correct: they are accounts now).
