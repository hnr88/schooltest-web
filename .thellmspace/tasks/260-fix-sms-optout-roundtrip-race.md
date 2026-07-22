---
id: 260
title: Fix the red notification-preference-controls round-trip — the SMS opt-out is clobbered by a concurrent spec writing the same parent's preference row
layer: regression
kind: fix
slice: notification-preference-controls.spec.ts:75 "sms and push opt-outs round-trip through the real preference endpoint" — the mission's ONE pre-existing red
target: tests/e2e/notification-preference-controls.spec.ts, tests/e2e/helpers/throwaway-parent.ts (read-only reuse), src/modules/notifications/hooks/use-notification-preference-form.ts (read-only unless the diagnosis below is disproved)
contract: C-PREF-GET, C-PREF-UPDATE (.qa/CONTRACTS.md:195-196)
design: n/a (defect fix — no design surface changes)
status: TODO
depends_on: []
---

## Objective

`.qa/PLAN.md:109-113` records the regression baseline: **157 passed / 1 failed** and the single
red is `tests/e2e/notification-preference-controls.spec.ts:75` — after writing both opt-outs off
and reloading, the `Text messages` switch still reports `aria-checked="true"`. This task
root-causes it against the real endpoint and the real Postgres row, fixes it forward, and proves
it with the existing spec going green **repeatedly and under parallel load**. This is the highest
priority task in W9: no other W9 task may be marked DONE while this red stands, because every
later task's proof runs the same suite.

## Contract

`.qa/CONTRACTS.md:195-196`:

> `C-PREF-GET`/`C-PREF-UPDATE`: `GET`/`PUT /api/notification-preferences/me`, each parent-owned
> and runtime-validated.

Server behaviour that is already correct and must not be changed
(`schooltest-api/src/api/notification-preference/services/notification-preference.ts`):

- `updateForUser` resolves the caller's row server-side (owner never from the body), writes ONLY
  the `UPDATABLE_BOOLEAN_FIELDS` whitelist (`emailEnabled`, `smsEnabled`, `inAppEnabled`,
  `pushEnabled`, `children`, `testActivity`, `testResults`) plus `digestFrequency`, and is a
  **partial** update: absent keys are left untouched, an all-ignored body returns the row unchanged
  with no write.
- `account` / `security` are deliberately absent from the whitelist (non-suppressible).
- The row is a single `notification_preferences` row per user, `draftAndPublish: false`,
  get-or-create on first read.

## Diagnosis (already reproduced — start from here, then confirm it yourself)

Running the spec alone passes:

```
pnpm exec playwright test tests/e2e/notification-preference-controls.spec.ts -g "round-trip"
→ 1 passed (3.1s)
```

Running it concurrently with the other spec that mutates the SAME row reproduces the exact
reported failure:

```
pnpm exec playwright test tests/e2e/notification-preference-controls.spec.ts \
  tests/e2e/notification-preferences.spec.ts tests/e2e/notification-mutation-error.spec.ts \
  --repeat-each=3 --workers=4 --reporter=line
→ 2 failed, both notification-preference-controls.spec.ts:75
   Locator: getByRole('switch', { name: 'Text messages' })
   Expected: "false"   Received: "true"        (spec line 119, after page.reload())
```

Root cause — a shared mutable fixture, not a UI or API defect:

1. `playwright.config.ts:9` sets `fullyParallel: true`. `test.describe.configure({ mode:
   'serial' })` is **file-scoped**, so `notification-preference-controls.spec.ts` and
   `notification-preferences.spec.ts` run concurrently in different workers.
2. Both files authenticate as the same seeded account `parent@schooltest.local`
   (`notification-preference-controls.spec.ts:10`, `notification-preferences.spec.ts:11`), and a
   parent has exactly ONE `notification_preferences` row.
3. `notification-preferences.spec.ts:88` saves the **whole** form and its own assertion at
   `:139-142` pins the payload to all eight whitelist keys —
   `children,digestFrequency,emailEnabled,inAppEnabled,pushEnabled,smsEnabled,testActivity,testResults`
   — so its save writes `smsEnabled: true` (the value its page loaded), and its `finally` at
   `:175` writes the full `original` snapshot back for a second time.
4. Either of those writes landing between the controls spec's save (`:107`) and its reload
   (`:118`) flips `smsEnabled` back to `true`. The controls spec then reloads, the GET returns the
   clobbered row, and the switch is legitimately `aria-checked="true"`.

The UI is behaving correctly: the switch is a controlled Radix/base-ui `Switch`
(`src/modules/design-system/components/toggle-row.tsx:60-68`) fed by
`Controller` → `form.reset(toNotificationPreferenceFormValues(query.data))`
(`src/modules/notifications/hooks/use-notification-preference-form.ts:26-28`). It renders whatever
the server returns.

## Fix

Give `notification-preference-controls.spec.ts` an **isolated real parent** so no other spec can
write its preference row. Use the repo's existing mechanism — `registerAndConfirmParent` from
`tests/e2e/helpers/throwaway-parent.ts`, which registers through the real `C-AUTH-REGISTER`
contract, confirms through the real Mailpit link, and polls until the parent-role grant has
landed. `tests/e2e/change-password.spec.ts:8-12` already uses it for exactly this reason
("the shared seeded parent's password is never touched").

Rejected alternatives, recorded so they are not re-litigated:

- **`parent-t06@schooltest.local`** (the other seeded parent, used by `settings-tabs.spec.ts:10`,
  `push-subscription.spec.ts:13`, `notification-api-security.spec.ts:5`): `settings-tabs.spec.ts:154-196`
  temporarily **changes that account's password** and restores it in a `finally`. Moving onto it
  trades a preference race for a login race.
- **`parent2@schooltest.local`** exists in `up_users` but no spec or seed file sets a password we
  hold. Unusable.
- **Making the client PUT only dirty fields.** This looks like the "real" product fix and it is
  FORBIDDEN here: `notification-preferences.spec.ts:139-142` asserts the payload is exactly the
  eight keys. Changing the payload turns a passing spec red, which `.qa/PLAN.md:113` classifies as
  a regression this mission caused. The server contract is already partial-update tolerant; the
  client's full-payload save stays as it is.
- **`workers: 1`** in `playwright.config.ts`. Serialises the entire 162-test suite for one file's
  contention and multiplies every later wave's verification time. Not proportionate.

## Files

- `tests/e2e/notification-preference-controls.spec.ts` — replace the module-level `PARENT`
  constant with a `test.beforeAll`-registered throwaway parent; add the `afterAll`
  `deleteAuthEmailRows` cleanup used by `change-password.spec.ts:21-23`. **Every assertion in all
  three tests in the file stays byte-identical** — only the identity the fixture authenticates as
  changes.
- `tests/e2e/helpers/throwaway-parent.ts` — read-only reuse (`registerAndConfirmParent`,
  `E2E_PASSWORD`).
- `tests/e2e/helpers/auth-db.ts` — read-only reuse (`deleteAuthEmailRows`).

## Depends on

Nothing in-wave. This runs FIRST in W9. Task 276 (channel-toggle redesign) declares an edge on it
so the toggle rework never lands on a red spec.

## Steps

1. Reproduce. Run the two commands in **Diagnosis** verbatim and paste both outputs into
   `## Evidence`. Do not proceed until you have seen the red yourself.
2. Confirm the clobber against Postgres, not just the UI. While the repeat run is failing, read
   the row:
   `psql -h 127.0.0.1 -p 5540 -c "select np.sms_enabled, np.push_enabled, np.updated_at from notification_preferences np join notification_preferences_user_lnk l on l.notification_preference_id = np.id join up_users u on u.id = l.user_id where u.email = 'parent@schooltest.local';"`
   and show that `sms_enabled` is `true` with an `updated_at` newer than the controls spec's PUT.
3. Add the isolated fixture. `test.beforeAll(async ({ request }) => { parent = await
   registerAndConfirmParent(request, 'notif-prefs'); })`; `getParentToken` logs in with
   `parent.email` / `parent.password`. Keep `test.describe.configure({ mode: 'serial' })` — the
   helper's docstring records that registration is D20-racy and must stay serial per file.
4. Keep the read/restore `try/finally` in the round-trip test as it is. It is harmless on an
   isolated account and its removal would weaken the spec.
5. `afterAll`: `deleteAuthEmailRows(parent.email)`.
6. Verify the fix under the load that produced the red (see Done criteria) — a single green run
   proves nothing here.
7. Re-read the whole file afterwards and confirm no assertion, locator, i18n key or timeout was
   touched.

## Project rules

- `schooltest-web/CLAUDE.md` §0 law 3 (never break existing logic), law 6 (pnpm only),
  law 12 (never run dev/build/start — `pnpm exec playwright test` is the allowed mechanism).
- `.claude/rules/testing.md` + `.qa/DECISIONS.md` **D-VERIFY-1**: proof is a real Playwright run
  against the running app plus a real Postgres row, reproduced by an independent verifier.
- `.qa/RULES.md` command policy: `psql` **reads** against 127.0.0.1:5540 are allowed; never
  truncate or drop.
- `.qa/DECISIONS.md` **D-AUTH-1**: accounts come from the seed or from the real register contract
  (`throwaway-parent.ts` is explicitly built on `C-AUTH-REGISTER` + the real Mailpit confirmation
  — never a UI signup loop, never the Strapi admin UI).

## Done criteria

- `pnpm tsc --noEmit` and `pnpm lint` clean.
- The reproduction command goes green **as a whole**:
  `pnpm exec playwright test tests/e2e/notification-preference-controls.spec.ts tests/e2e/notification-preferences.spec.ts tests/e2e/notification-mutation-error.spec.ts --repeat-each=3 --workers=4`
  → 21 passed, 0 failed. Paste the output.
- A second, independent load shape is also green:
  `pnpm exec playwright test tests/e2e/notification-preference-controls.spec.ts --repeat-each=5`.
- Persistence proof: with the fix in place, after the round-trip test's save, a `psql` read of the
  throwaway parent's `notification_preferences` row shows `sms_enabled = false` AND
  `push_enabled = false`, and the same row still reads `false` after the page reload in the same
  test. Paste the two reads.
- The full suite is green: `pnpm exec playwright test` → **158 passed / 0 failed** (the 157 of the
  `.qa/PLAN.md:109` baseline plus this one), 2 skipped, no new red anywhere.
- `git diff` touches exactly one file (`tests/e2e/notification-preference-controls.spec.ts`) and
  contains **no** change to any `expect(...)` line.
- No i18n change (no user-facing string moved), so the six catalogs stay at 1151 keys each —
  assert it.
- Zero banned-pattern grep hits in the diff: `any`, `.skip(`, `.fixme(`, `test.slow(`,
  `waitForTimeout`.

## Assumptions

- The dev stack stays on the `st1` namespace of `.qa/DECISIONS.md` **D-OPS-1** (api :5500,
  web :3100, postgres :5540, mailpit :1125/:8125). Mailpit must be reachable for
  `registerAndConfirmParent`; `change-password.spec.ts` proves it is today.
- If step 1 does NOT reproduce the red on this machine, do not "fix" anything: record that, then
  raise the concurrency (`--repeat-each=5 --workers=8`) before concluding. A green reproduction
  attempt is not evidence that the defect is gone — `.qa/PLAN.md:110` recorded it in a full-suite
  run.
- If the diagnosis is disproved by step 2 (the DB row genuinely reads `false` while the reloaded
  UI shows `true`), STOP and re-scope: that would be a real client caching defect in
  `use-notification-preferences.query.ts` and this task becomes a product fix, not a fixture fix.

## Evidence

<!-- filled in as the task runs -->
