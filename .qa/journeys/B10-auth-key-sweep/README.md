# B10 — the retired sign-in labels: 46 files fixed, 11 left correct on purpose

## The premise held, but the MECHANISM in the brief was wrong

The brief said the keys were "retired" and that specs referencing them "cannot
find the field". Half right. The keys were **never deleted** — both blocks live
in `en.json` today, so `cat()` does not throw (it throws only on an undefined
key, `helpers/i18n.ts:54-58`). This is a **silent label mismatch**:

| old key | old value | what the form renders now | breaks? |
|---|---|---|---|
| `Auth.emailLabel` | `"Email"` | `Auth.portal.emailLabel` = `"Email address"` | **yes** |
| `Auth.signInButton` | `"Sign in"` | `Auth.portal.loginButton` = `"Log in"` | **yes** |
| `Auth.passwordLabel` | `"Password"` | `Auth.portal.passwordLabel` = `"Password"` | no — identical |

`/sign-in` → `SignInCard` → `SignInForm`, which calls `t('portal.emailLabel')`
(`SignInForm.tsx:80`, `:88`, `:112`). So a spec resolves `"Email"`, then
`getByLabel('Email', { exact: true })` cannot match `"Email address"` and waits
out the clock. Nothing fails loudly, which is why it reads as a product bug in
whatever surface the spec was testing.

## THE OLD KEYS ARE STILL LIVE ON OTHER FORMS — this is what bounded the row

```
SignUpForm.tsx:73         label={t('emailLabel')}      <- OLD key, CORRECT
ForgotPasswordForm.tsx:85 label={t('emailLabel')}      <- OLD key, CORRECT
SignInForm.tsx:80         label={t('portal.emailLabel')} <- only sign-in moved
```

A blanket sweep would have **broken every passing sign-up and forgot-password
spec**. Only call sites that drive the SIGN-IN form were changed.

## Counts, measured from git rather than the working tree

```
$ git grep -lE "Auth\.(emailLabel|signInButton)[^A-Za-z]" HEAD -- tests/ | wc -l
55            # files at HEAD
$ git grep -hoE "Auth\.(emailLabel|signInButton)[^A-Za-z]" HEAD -- tests/ | wc -l
127           # references at HEAD
```
After this change: **11 files / 25 references**, every one deliberate (table below).
Fixed: **46 files, 102 lines, 51 `emailLabel` + 51 `loginButton`, 1:1 insertions
to deletions.**

### Reconciling the "11 files / 35 references" figure
That figure (peer + orchestrator, ~21:30Z) is a measurement of this tree **after**
the 46-file edit was already applied — it is the residue, not the original scope.
Its file list matches the residue below exactly, and its note that
`Auth.signInButton` has "0 refs in the suite" is true only post-edit: at HEAD that
key had references in 46 files. Both measurements are correct about different
moments. The pre-edit number is the `git grep HEAD` output above, which cannot
move under a working-tree edit.

## The shape of the fix

`Auth.emailLabel` → `Auth.portal.emailLabel`, `Auth.signInButton` →
`Auth.portal.loginButton`, at sign-in call sites only. This follows the
already-fixed specs (`zz-task31-assignment.spec.ts:112-117`) rather than
inventing a second shape. The shared helper needed nothing: `helpers/teacher-rail.ts:98-100`
already uses `Auth.portal.*`. The 102 remaining references were hand-rolled
sign-in blocks duplicating it per spec.

`Auth.passwordLabel` was **deliberately NOT rewritten** — the strings are
identical, so it is behaviour-neutral churn in a shared checkout. 49 such lines
were reverted after an earlier pass had swapped them. (Noting for the record that
the precedent in `zz-task31` swaps all three, so the convention is now mixed;
that is a call for whoever owns the convention, not something to settle here.)

### Three mixed-form files needed LINE-SCOPED edits, not file-wide
`027-auth-and-onboarding-e2e`, `verify-tasks-013-017-toast`, `change-password`
each drive several forms. The trap, in one test in `027`:

```
L231  await page.goto('/sign-in');  … getByLabel(cat(en, 'Auth.portal.emailLabel'))  <- changed
L235  await page.goto('/sign-up');  … getByLabel(cat(en, 'Auth.emailLabel'))         <- MUST NOT change
```
Two identical lines four apart in the same test, requiring opposite treatment.

## The 11 files left alone, and why

| file | refs | reason |
|---|---|---|
| `010-reset-password-states.spec.ts` | 1 | drives `/forgot-password` — the old key is what that form renders |
| `027-auth-and-onboarding-e2e.spec.ts` | 6 | sign-in sites fixed; these 6 are its sign-up and forgot-password sites |
| `a11y-auth.spec.ts` | 4 | every occurrence is under `/sign-up` or `/forgot-password` |
| `forgot-reset.spec.ts` | 1 | `submitForgotForm` — forgot form |
| `helpers/sign-up-form.ts` | 1 | the SIGN-UP helper, not sign-in |
| `sign-up.spec.ts` | 4 | all under `/sign-up` |
| `verify-tasks-013-017-toast.spec.ts` | 4 | sign-in sites fixed; these are sign-up + forgot |
| `teacher-results-students.spec.ts` | 1 | **prose** — a docblock explaining the bug, not a locator |
| `zz-redesign-school-admin.spec.ts` | 1 | **prose** — a comment at `:25` |
| `tests/unit/ops-i18n-locale-parity.test.ts` | 1 | **prose** — a `why:` field in locale-parity test data |
| `zz-task23-invitation-flow.spec.ts` | 1 | **PEER-OWNED — uncommitted edits present. Listed for routing, not edited.** |

The `teacher-results-students` docblock is now stale: it says the shared
`teacher-rail.ts` helper "still reads the PRE-redesign copy", but that helper was
fixed (`:98-100`). Left as found — correcting prose in another row's file is not
this row's write set.

## Verification

```
$ pnpm typecheck                 -> exit 0   (web tsc covers tests/e2e)
$ pnpm lint                      -> exit 0   (3 warnings, 0 errors; check-no-posteriors clean 7/7)

$ pnpm exec playwright test tests/e2e/zz-task25-role-nav.spec.ts \
      tests/e2e/zz-task63-teacher-roster.spec.ts --project=chromium --workers=1
  ✓ task 25 › teacher: school_admin items absent, retired reports entry absent (R-11)   3.7s
  ✓ task 25 › school_admin: school items appear; TeacherGuard bounces to /dashboard     8.2s
  ✓ task 25 › parent: masked state renders; reports + school items absent               5.7s
  ✓ task 63 › roster flags missing emails; admin fix clears the flag on reload          6.8s
  ✓ task 63 › a class the teacher does not own renders the empty state                  4.1s
  ✓ task 63 › school_admin is bounced by the TeacherGuard                               4.8s
  6 passed (36.3s)   exit 0
```
Two surfaces (role-nav guards, teacher roster), six tests, each signing in
through the corrected labels. CLI rather than a managed run on purpose: the
shared browser tab is parked on a logged-in parent session, so the CLI's fresh
context is the sounder evidence here, not a fallback.

## REAL FINDINGS — specs that now reach the form and fail for a DIFFERENT reason

Reported rather than papered over, as the brief requires. In every case the
failure is **downstream of a successful sign-in**, which is itself the proof the
label fix worked — the failure point moved forward.

| spec | fails at | evidence it signed in |
|---|---|---|
| `ops-portal/teachers-list.spec.ts` | waiting for `getByRole('button', { name: 'Manage teachers' })` | error-context snapshot shows `- /url: /dashboard/ops/schools` — authenticated, on the ops surface |
| `change-password.spec.ts` | `:65` waiting for `Settings.changePasswordTitle` = "Change password" | reached `/settings`, past the form |
| `026-dashboard-onboarding-guard.spec.ts` | `page.waitForURL('**/onboarding')` timeout, parent flow | the failure is *after* the login submit; consistent with the parent portal now rendering its "Not part of this release" gate |
| `ops-portal/staff-users.spec.ts` | 0ms failure + retry — setup/`beforeAll`, not a locator | fails before any page interaction |

None of these are label mismatches. Three are surface/data issues for their
owning rows; the parent one is very likely the uncommitted i18n parent-portal
gate that is hot-reloading into every web run.

## What this row did NOT claim

The `teacher-sidebar` and `class-detail-empty-import` managed-run timeouts belong
to the parked-tab hazard, not to these keys: both carry zero retired-key
references and `teacher-sidebar` signs in through the already-correct
`teacher-rail.ts`. Two hazards, one identical symptom. The tell: parked tab shows
**a persona you never signed in as**; a key mismatch shows the sign-in form
rendered correctly with the locator simply not matching.

---

## Addendum — the `passwordLabel` convention, decided

**Decision (orchestrator, 2026-09-11): leave `zz-task31` as it is, and do NOT
re-touch the 49 reverted lines.** Recorded here with the reasoning rather than as
a bare instruction, because the reasoning is the reusable part:

`Auth.passwordLabel` is **not a retired key**. `SignUpForm.tsx:73` and
`ForgotPasswordForm.tsx:85` still render from that block, so a spec citing it is
citing a LIVE key whose value merely happens to equal the portal one — latent,
not broken. Against that, aligning the convention upward would be 49
behaviour-free lines across files that live rows own, in a shared checkout where
collisions have cost this mission more than inconsistency has.

**The convention, for anyone writing or fixing a sign-in spec:** a spec that
targets `/sign-in` SHOULD cite `Auth.portal.*` for all three labels, because
`Auth.portal.*` is what `SignInForm` actually renders.

**The residual risk, stated plainly so it is a five-minute fix and not another
four hours:** if `Auth.portal.passwordLabel` ever diverges from
`Auth.passwordLabel`, every sign-in spec still citing the old key breaks
**silently**, in exactly the way `emailLabel` just did — a timeout that reads as
a product bug. The 49 lines listed in this commit's history are the ones to
sweep, and `git log -S 'Auth.portal.passwordLabel'` finds them.

## Addendum — third surface added to the passing sample

```
$ pnpm exec playwright test tests/e2e/zz-task30-students.spec.ts tests/e2e/zz-task99-teach-groups.spec.ts --project=chromium --workers=1
  ✓ task 30: children v2 round-trip vs live C-CHD-01..04 ›
      add with email/L1/ACARA -> roster -> edit -> archive frees the seat   15.5s
```
That is a school-admin students round-trip signing in through the corrected
labels — a third surface alongside role-nav guards and the teacher roster, so the
sample is 7 tests across 3 surfaces.

Two further downstream failures in the same run, same category as the four
already recorded (they reach the form, then fail for their own reasons):
- `zz-task30-students.spec.ts:211` and `:338` — the task-31 server-mode directory
  kit: the three params reaching the endpoint, and the server-bound pager. Fails
  after a successful sign-in and after the roster round-trip in the same file
  passed, so not a label problem. Candidate cause worth checking first: the kit's
  surface is visible while still loading, so a count at first paint reads zero.
- `zz-task99-teach-groups.spec.ts:86` — fails in 103ms on an API-baseline
  assertion (`groups are coherent with the mastery rows and the catalog`), i.e.
  before any page interaction. A data/contract question, not a UI one.
